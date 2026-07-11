import { NextResponse } from "next/server";
import { getAiProvider } from "@/lib/ai-provider";
import { createGigaChatCompletion, GigaChatTlsCertificateError, MissingGigaChatCredentialsError, type GigaChatMessage } from "@/lib/gigachat";
import { evaluateMockDialog } from "@/lib/scoreDialog";
import { createOpenAITextResponse, MissingOpenAIKeyError } from "@/lib/openai";
import { buildEvaluatorPrompt, buildGigaChatEvaluatorPrompt, toTranscript } from "@/lib/prompts";
import { getScenarioById } from "@/lib/scenarios";
import type { ChatMessage, EvaluationResult, Scenario } from "@/lib/types";

export const runtime = "nodejs";

const evaluationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: { type: "number", minimum: 0, maximum: 100 },
    clientOutcome: { type: "string" },
    summary: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    mistakes: { type: "array", items: { type: "string" } },
    missedQuestions: { type: "array", items: { type: "string" } },
    recommendations: { type: "array", items: { type: "string" } },
    betterResponseExample: { type: "string" },
    nextTrainingScenario: { type: "string" }
  },
  required: [
    "score",
    "clientOutcome",
    "summary",
    "strengths",
    "mistakes",
    "missedQuestions",
    "recommendations",
    "betterResponseExample",
    "nextTrainingScenario"
  ]
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

function getLastClientMessage(messages: ChatMessage[]): string {
  return [...messages].reverse().find((message) => message.role === "client")?.content.trim() || "";
}

function buildFallbackBetterResponse(scenario: Scenario, messages: ChatMessage[]): string {
  const lastClientMessage = getLastClientMessage(messages);
  const clientContext = lastClientMessage ? `На последнюю реплику клиента: «${lastClientMessage}» можно было ответить так. ` : "";

  if (scenario.id === "trust") {
    return `${clientContext}Понимаю ваше опасение: перевод денег и покупка в Китае — не та история, где достаточно слов «нам можно доверять». Давайте разложим сделку по этапам: кто принимает оплату, какие документы оформляются, как проверяется продавец и автомобиль, какие фото, видео, VIN и документы вы видите до решения. После этого я предложу вам не договор сразу, а короткую консультацию и расчет по конкретной машине, чтобы вы спокойно оценили риски.`;
  }

  if (scenario.id === "expensive") {
    return `${clientContext}Понимаю, что сопровождение кажется отдельной лишней затратой. Чтобы сравнение было честным, давайте посмотрим не только на цену услуги, а на то, что входит: проверка машины, расчет под ключ, документы, доставка, таможня, СБКТС и ЭПТС. Подскажите, какой бюджет под ключ для вас комфортен и с каким предложением вы сравниваете — я покажу, где может быть разница и какие риски закрывает сопровождение.`;
  }

  if (scenario.id === "competitor") {
    return `${clientContext}Понимаю, что если вам уже назвали цену дешевле, хочется сравнить предметно. Я не буду говорить, что конкуренты плохие — лучше сверим состав расчета: цена машины, комиссия, доставка, таможня, утиль, СБКТС, ЭПТС и документы. Пришлите параметры или расчет конкурента, и я покажу, какие строки учтены, а где могут появиться дополнительные платежи.`;
  }

  if (scenario.id === "think") {
    return `${clientContext}Понимаю, решение не нужно принимать сразу. Чтобы вам было проще подумать не в целом, а по фактам, давайте зафиксируем, что именно смущает: итоговая цена, оплата, документы, состояние автомобиля или сроки. Я могу предложить маленький следующий шаг без обязательств — сделать расчет по вашим параметрам и показать, из чего складывается стоимость под ключ.`;
  }

  if (scenario.id === "price") {
    return `${clientContext}Понимаю, вы хотите сначала увидеть порядок цены. Точную сумму под ключ корректно считать только по конкретной машине: год, мощность, цена в Китае, доставка, таможня, утиль, СБКТС и ЭПТС влияют на итог. Давайте начнем с трех параметров: бюджет, класс или модель авто и желаемый год — после этого я сделаю предварительный расчет и покажу вилку без пустых обещаний.`;
  }

  return `${clientContext}Понимаю ваше сомнение. Давайте не будем опираться на общие обещания: сначала уточню бюджет, требования к автомобилю и что для вас критично — цена, документы, оплата или состояние машины. После этого подготовлю расчет под ключ с отдельными строками по машине, доставке, таможне, утилю, СБКТС и ЭПТС, чтобы вы увидели итоговую сумму и возможные риски до решения.`;
}

function parseEvaluation(text: string, scenario: Scenario, messages: ChatMessage[]): EvaluationResult {
  const parsed = JSON.parse(extractJson(text)) as Partial<EvaluationResult>;
  const score = Number(parsed.score);
  const fallbackBetterResponse = buildFallbackBetterResponse(scenario, messages);

  if (!Number.isFinite(score)) {
    throw new Error("Invalid evaluation JSON structure: score is missing");
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    clientOutcome: normalizeString(parsed.clientOutcome, "Итог клиента не определен"),
    summary: normalizeString(parsed.summary, "AI-оценщик вернул неполное резюме."),
    strengths: normalizeStringArray(parsed.strengths, ["Есть попытка вести диалог с клиентом."]),
    mistakes: normalizeStringArray(parsed.mistakes, ["Оценщик не смог структурировать ошибки. Проверьте диалог вручную."]),
    missedQuestions: normalizeStringArray(parsed.missedQuestions, ["Нужно уточнить бюджет, критерии выбора и основные опасения клиента."]),
    recommendations: normalizeStringArray(parsed.recommendations, ["Задавайте больше уточняющих вопросов и закрывайте разговор на понятный следующий шаг."]),
    betterResponseExample: normalizeString(parsed.betterResponseExample, fallbackBetterResponse),
    nextTrainingScenario: normalizeString(parsed.nextTrainingScenario, "Клиенту дорого")
  };
}

function buildEvaluationInput(scenario: Scenario, messages: ChatMessage[]): string {
  return `Сценарий: ${scenario.title}\nОписание сценария: ${scenario.description}\nЦель менеджера: ${scenario.managerGoal}\n\nДиалог:\n${toTranscript(messages)}\n\nОцени только действия менеджера и верни JSON.`;
}

function buildGigaChatEvaluationMessages(scenario: Scenario, messages: ChatMessage[]): GigaChatMessage[] {
  return [
    { role: "system", content: buildGigaChatEvaluatorPrompt() },
    { role: "user", content: buildEvaluationInput(scenario, messages) }
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

    if (!Array.isArray(messages) || !messages.every(isValidMessage)) {
      return NextResponse.json({ error: "messages must be an array of chat messages" }, { status: 400 });
    }

    if (messages.filter((message) => message.role === "manager").length === 0) {
      return NextResponse.json({ error: "Диалог не содержит реплик менеджера" }, { status: 400 });
    }

    const provider = getAiProvider();

    if (provider === "mock") {
      return NextResponse.json({ evaluation: evaluateMockDialog(scenario, messages), mock: true });
    }

    if (provider === "gigachat") {
      const text = await createGigaChatCompletion(buildGigaChatEvaluationMessages(scenario, messages), {
        temperature: 0.1,
        maxTokens: 1300
      });

      try {
        return NextResponse.json({ evaluation: parseEvaluation(text, scenario, messages), provider: "gigachat" });
      } catch (parseError) {
        console.error("GigaChat evaluation JSON parse error", parseError, text);
        return NextResponse.json(
          { error: "GigaChat-оценщик вернул некорректный JSON. Попробуйте завершить диалог еще раз." },
          { status: 502 }
        );
      }
    }

    const text = await createOpenAITextResponse(buildEvaluatorPrompt(), buildEvaluationInput(scenario, messages), {
      temperature: 0.2,
      maxOutputTokens: 1200,
      jsonSchema: evaluationSchema
    });

    try {
      return NextResponse.json({ evaluation: parseEvaluation(text, scenario, messages), provider: "openai" });
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
