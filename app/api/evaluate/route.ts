import { NextResponse } from "next/server";
import { getAiProvider } from "@/lib/ai-provider";
import { createGigaChatCompletion, GigaChatTlsCertificateError, MissingGigaChatCredentialsError, type GigaChatMessage } from "@/lib/gigachat";
import { createOpenAITextResponse, MissingOpenAIKeyError } from "@/lib/openai";
import { buildEvaluatorPrompt, buildGigaChatEvaluatorPrompt, toTranscript } from "@/lib/prompts";
import { getScenarioById } from "@/lib/scenarios";
import { evaluateMockDialog } from "@/lib/scoreDialog";
import { buildTrainingPromptContextFromBody } from "@/lib/trainingContext";
import type { ChatMessage, EvaluationResult, Scenario, StageScore, TrainingPromptContext } from "@/lib/types";

export const runtime = "nodejs";

const evaluationSchema = {
  type: "object",
  properties: {
    mode: { type: "string" },
    industry: { type: "string" },
    stage: { type: "string" },
    scenario: { type: "string" },
    score: { type: "number" },
    overallScore: { type: "number" },
    clientOutcome: { type: "string" },
    summary: { type: "string" },
    stageScores: {
      type: "array",
      items: {
        type: "object",
        properties: {
          stage: { type: "string" },
          score: { type: "number" },
          comment: { type: "string" }
        }
      }
    },
    strengths: { type: "array", items: { type: "string" } },
    weakStages: { type: "array", items: { type: "string" } },
    mistakes: { type: "array", items: { type: "string" } },
    missedQuestions: { type: "array", items: { type: "string" } },
    recommendations: { type: "array", items: { type: "string" } },
    betterResponseExample: { type: "string" },
    nextTrainingScenario: { type: "string" },
    nextRecommendedStage: { type: "string" }
  },
  required: ["clientOutcome", "summary", "strengths", "mistakes", "recommendations"]
};

function isValidMessage(message: unknown): message is ChatMessage {
  if (!message || typeof message !== "object") return false;
  const candidate = message as Partial<ChatMessage>;
  return (
    typeof candidate.id === "string" &&
    (candidate.role === "manager" || candidate.role === "client") &&
    typeof candidate.content === "string" &&
    typeof candidate.createdAt === "string"
  );
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return trimmed;

  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match?.[1]) return match[1].trim();

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

function normalizeStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : fallback;
}

function normalizeString(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeScore(value: unknown, fallback = 0) {
  const score = Number(value);
  if (!Number.isFinite(score)) return fallback;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeStageScores(value: unknown, context: TrainingPromptContext, fallbackScore: number): StageScore[] | undefined {
  if (context.mode !== "full_funnel") return undefined;

  if (!Array.isArray(value)) {
    return context.allStages.map((stage) => ({
      stage: stage.title,
      score: fallbackScore,
      comment: "AI-оценщик не вернул отдельный комментарий по этапу."
    }));
  }

  const normalized = value
    .map((item): StageScore | null => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as Partial<StageScore>;
      return {
        stage: normalizeString(candidate.stage, "Этап продаж"),
        score: normalizeScore(candidate.score, fallbackScore),
        comment: normalizeString(candidate.comment, "Комментарий по этапу не указан.")
      };
    })
    .filter((item): item is StageScore => Boolean(item));

  return normalized.length > 0 ? normalized : undefined;
}

function getLastClientMessage(messages: ChatMessage[]): string {
  return [...messages].reverse().find((message) => message.role === "client")?.content.trim() || "";
}

function buildFallbackBetterResponse(context: TrainingPromptContext, messages: ChatMessage[]): string {
  const lastClientMessage = getLastClientMessage(messages);
  const clientContext = lastClientMessage ? `На последнюю реплику клиента: «${lastClientMessage}» можно было ответить так. ` : "";
  const action = context.targetActions[0] ?? "следующий шаг";
  const stage = context.mode === "single_stage" && context.stage ? ` Сейчас нам важно отработать этап «${context.stage.title}», поэтому` : "";

  return `${clientContext}Понимаю ваше сомнение. В сфере «${context.industry.title}» решение действительно не стоит принимать на общих словах.${stage} давайте сначала уточним вашу задачу, критерии выбора и что именно сейчас останавливает. После этого я покажу, как решение связано с вашей ситуацией, без давления и лишних обещаний. Если логика подойдет, предложу понятный следующий шаг — ${action}.`;
}

function parseEvaluation(text: string, context: TrainingPromptContext, messages: ChatMessage[]): EvaluationResult {
  const parsed = JSON.parse(extractJson(text)) as Partial<EvaluationResult>;
  const fallbackBetterResponse = buildFallbackBetterResponse(context, messages);
  const rawScore = context.mode === "full_funnel" ? parsed.overallScore ?? parsed.score : parsed.score;
  const score = normalizeScore(rawScore, 0);

  if (!Number.isFinite(score)) {
    throw new Error("Invalid evaluation JSON structure: score is missing");
  }

  const base = {
    mode: context.mode,
    industry: normalizeString(parsed.industry, context.industry.title),
    scenario: normalizeString(parsed.scenario, context.scenario.title),
    score,
    clientOutcome: normalizeString(parsed.clientOutcome, "Итог клиента не определен"),
    summary: normalizeString(parsed.summary, "AI-оценщик вернул неполное резюме."),
    strengths: normalizeStringArray(parsed.strengths, ["Есть попытка вести диалог с клиентом."]),
    mistakes: normalizeStringArray(parsed.mistakes, ["Оценщик не смог структурировать ошибки. Проверьте диалог вручную."]),
    recommendations: normalizeStringArray(parsed.recommendations, ["Задавайте больше уточняющих вопросов и закрывайте разговор на понятный следующий шаг."]),
    betterResponseExample: normalizeString(parsed.betterResponseExample, fallbackBetterResponse),
    nextRecommendedStage: normalizeString(parsed.nextRecommendedStage, context.stage?.title ?? "Отработка возражений")
  } satisfies EvaluationResult;

  if (context.mode === "single_stage") {
    return {
      ...base,
      mode: "single_stage",
      stage: normalizeString(parsed.stage, context.stage?.title ?? "Отдельный этап")
    };
  }

  const stageScores = normalizeStageScores(parsed.stageScores, context, score);
  return {
    ...base,
    mode: "full_funnel",
    overallScore: score,
    stageScores,
    weakStages: normalizeStringArray(parsed.weakStages, stageScores?.filter((stage) => stage.score < 65).map((stage) => stage.stage) ?? [])
  };
}

function buildEvaluationInput(context: TrainingPromptContext, messages: ChatMessage[]): string {
  return `Сфера: ${context.industry.title}\nРежим: ${context.mode}\n${context.stage ? `Этап: ${context.stage.title}\n` : ""}Сценарий: ${context.scenario.title}\nЦель менеджера: ${context.managerGoal}\n\nДиалог:\n${toTranscript(messages)}\n\nОцени только действия менеджера и верни JSON.`;
}

function buildGigaChatEvaluationMessages(context: TrainingPromptContext, messages: ChatMessage[]): GigaChatMessage[] {
  return [
    { role: "system", content: buildGigaChatEvaluatorPrompt(context) },
    { role: "user", content: buildEvaluationInput(context, messages) }
  ];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const scenarioId = body?.scenarioId;
    const messages = body?.messages;

    if (typeof scenarioId !== "string") {
      return NextResponse.json({ error: "scenarioId is required" }, { status: 400 });
    }

    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    const context = buildTrainingPromptContextFromBody(body);
    if (!context) {
      return NextResponse.json({ error: "trainingContext is required" }, { status: 400 });
    }

    if (!Array.isArray(messages) || !messages.every(isValidMessage)) {
      return NextResponse.json({ error: "messages must be an array of chat messages" }, { status: 400 });
    }

    if (messages.filter((message) => message.role === "manager").length === 0) {
      return NextResponse.json({ error: "Диалог не содержит реплик менеджера" }, { status: 400 });
    }

    const provider = getAiProvider();

    if (provider === "mock") {
      return NextResponse.json({ evaluation: evaluateMockDialog(scenario, messages, context), mock: true });
    }

    if (provider === "gigachat") {
      const text = await createGigaChatCompletion(buildGigaChatEvaluationMessages(context, messages), {
        temperature: 0.1,
        maxTokens: context.mode === "full_funnel" ? 1800 : 1300
      });

      try {
        return NextResponse.json({ evaluation: parseEvaluation(text, context, messages), provider: "gigachat" });
      } catch (parseError) {
        console.error("GigaChat evaluation JSON parse error", parseError, text);
        return NextResponse.json(
          { error: "GigaChat-оценщик вернул некорректный JSON. Попробуйте завершить диалог еще раз." },
          { status: 502 }
        );
      }
    }

    const text = await createOpenAITextResponse(buildEvaluatorPrompt(context), buildEvaluationInput(context, messages), {
      temperature: 0.2,
      maxOutputTokens: context.mode === "full_funnel" ? 1800 : 1300,
      jsonSchema: evaluationSchema
    });

    try {
      return NextResponse.json({ evaluation: parseEvaluation(text, context, messages), provider: "openai" });
    } catch (parseError) {
      console.error("Evaluation JSON parse error", parseError, text);
      return NextResponse.json(
        { error: "AI-оценщик вернул некорректный JSON. Попробуйте завершить диалог еще раз." },
        { status: 502 }
      );
    }
  } catch (error) {
    if (error instanceof MissingOpenAIKeyError) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY не задан. Добавьте ключ в .env.local или включите AI_PROVIDER=mock." },
        { status: 500 }
      );
    }

    if (error instanceof MissingGigaChatCredentialsError) {
      return NextResponse.json(
        { error: "GIGACHAT_AUTH_KEY не задан. Добавьте ключ авторизации в .env.local или включите AI_PROVIDER=mock." },
        { status: 500 }
      );
    }

    if (error instanceof GigaChatTlsCertificateError) {
      return NextResponse.json(
        {
          error:
            "Node.js не доверяет сертификату GigaChat. Для локального теста поставьте GIGACHAT_DISABLE_TLS_REJECT=true или настройте NODE_EXTRA_CA_CERTS с российскими сертификатами."
        },
        { status: 500 }
      );
    }

    console.error("/api/evaluate error", error);
    return NextResponse.json({ error: "Не удалось получить оценку диалога" }, { status: 500 });
  }
}
