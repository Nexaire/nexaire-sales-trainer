export type AiProvider = "mock" | "openai" | "gigachat";

export function getAiProvider(): AiProvider {
  const explicitProvider = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (explicitProvider === "mock" || explicitProvider === "openai" || explicitProvider === "gigachat") {
    return explicitProvider;
  }

  // Backward compatibility with previous versions.
  if (process.env.USE_MOCK_AI === "true") {
    return "mock";
  }

  // Prefer GigaChat if the Russian-provider key is configured.
  if (process.env.GIGACHAT_AUTH_KEY?.trim()) {
    return "gigachat";
  }

  if (process.env.OPENAI_API_KEY?.trim()) {
    return "openai";
  }

  return "mock";
}

export function isMockProvider() {
  return getAiProvider() === "mock";
}
