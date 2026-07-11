import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getAiProvider } from "@/lib/ai-provider";
import { createGigaChatCompletion, GigaChatTlsCertificateError, MissingGigaChatCredentialsError, type GigaChatMessage } from "@/lib/gigachat";
import { getMockClientReply } from "@/lib/getMockClientReply";
import { createOpenAITextResponse, MissingOpenAIKeyError } from "@/lib/openai";
import { buildClientPrompt, buildGigaChatClientPrompt, toTranscript } from "@/lib/prompts";
import { getScenarioById } from "@/lib/scenarios";
import { buildTrainingPromptContextFromBody } from "@/lib/trainingContext";
import type { ChatMessage, ClientState, Scenario, TrainingPromptContext } from "@/lib/types";

export const runtime = "nodejs";

function makeClientMessage(content: string): ChatMessage {
  return {
    id: randomUUID(),
    role: "client",
    content,
    createdAt: new Date().toISOString()
  };
}

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

function isValidClientState(state: unknown): state is ClientState {
  if (!state || typeof state !== "object") return false;
  const candidate = state as Partial<ClientState>;
  return (
    typeof candidate.trust === "number" &&
    typeof candidate.doubt === "number" &&
    typeof candidate.interest === "number" &&
    typeof candidate.readiness === "number" &&
    typeof candidate.stage === "string" &&
    typeof candidate.turn === "number"
  );
}

function toGigaChatMessages(context: TrainingPromptContext, messages: ChatMessage[]): GigaChatMessage[] {
  return [
    { role: "system", content: buildGigaChatClientPrompt(context) },
    ...messages.map((message): GigaChatMessage => ({
      role: message.role === "client" ? "assistant" : "user",
      content: message.content
    })),
    {
      role: "user",
      content:
        "Ответь следующей репликой клиента. Пиши только текст клиента, без подписи роли. Не повторяй предыдущую реплику клиента дословно."
    }
  ];
}

function getFallbackState(scenario: Scenario, messages: ChatMessage[]): ClientState {
  return {
    ...scenario.initialState,
    turn: Math.max(1, messages.filter((message) => message.role === "manager").length)
  };
}

function buildMockResponse(context: TrainingPromptContext, messages: ChatMessage[], bodyClientState: unknown) {
  if (messages.length === 0) {
    return {
      message: makeClientMessage(context.openingMessage),
      nextState: context.scenario.initialState,
      mock: true
    };
  }

  const lastMessage = messages[messages.length - 1];

  if (lastMessage?.role !== "manager") {
    return { error: "Last message must be from manager", status: 400 };
  }

  const currentState = isValidClientState(bodyClientState)
    ? bodyClientState
    : getFallbackState(context.scenario, messages);

  const reply = getMockClientReply({
    scenario: context.scenario,
    promptContext: context,
    state: currentState,
    managerText: lastMessage.content
  });

  return {
    message: makeClientMessage(reply.message),
    nextState: reply.nextState,
    analysis: reply.analysis,
    outcome: reply.outcome,
    mock: true
  };
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

    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "manager" && !lastMessage.content.trim()) {
      return NextResponse.json({ error: "Message is empty" }, { status: 400 });
    }

    if (lastMessage?.role === "manager" && lastMessage.content.length > 2000) {
      return NextResponse.json({ error: "Message is too long" }, { status: 400 });
    }

    const provider = getAiProvider();

    if (provider === "mock") {
      const mockResponse = buildMockResponse(context, messages, body?.clientState);
      if ("error" in mockResponse) {
        return NextResponse.json({ error: mockResponse.error }, { status: mockResponse.status });
      }
      return NextResponse.json(mockResponse);
    }

    // Keep opening deterministic for every provider, so the training starts naturally and fits the selected context.
    if (messages.length === 0) {
      return NextResponse.json({
        message: makeClientMessage(context.openingMessage),
        nextState: context.scenario.initialState,
        provider
      });
    }

    if (lastMessage?.role !== "manager") {
      return NextResponse.json({ error: "Last message must be from manager" }, { status: 400 });
    }

    if (provider === "gigachat") {
      const text = await createGigaChatCompletion(toGigaChatMessages(context, messages), {
        temperature: 0.75,
        maxTokens: 460
      });

      return NextResponse.json({ message: makeClientMessage(text), provider: "gigachat" });
    }

    const instructions = buildClientPrompt(context);
    const transcript = toTranscript(messages);
    const input = `История диалога:\n${transcript}\n\nОтветь следующей репликой клиента. Пиши только реплику клиента, без подписи роли.`;

    const text = await createOpenAITextResponse(instructions, input, {
      temperature: 0.8,
      maxOutputTokens: 460
    });

    return NextResponse.json({ message: makeClientMessage(text), provider: "openai" });
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

    console.error("/api/chat error", error);
    return NextResponse.json({ error: "Не удалось получить ответ AI-клиента" }, { status: 500 });
  }
}
