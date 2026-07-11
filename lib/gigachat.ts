import { randomUUID } from "crypto";

export type GigaChatRole = "system" | "user" | "assistant";

export type GigaChatMessage = {
  role: GigaChatRole;
  content: string;
};

type GigaChatOptions = {
  temperature?: number;
  maxTokens?: number;
};

type CachedToken = {
  accessToken: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;

export class MissingGigaChatCredentialsError extends Error {
  constructor() {
    super("GIGACHAT_AUTH_KEY is not set");
    this.name = "MissingGigaChatCredentialsError";
  }
}

export class GigaChatTlsCertificateError extends Error {
  constructor(cause?: unknown) {
    super(
      "Node.js не доверяет цепочке сертификатов GigaChat. Установите российские доверенные сертификаты и запустите Node с NODE_EXTRA_CA_CERTS или временно включите GIGACHAT_DISABLE_TLS_REJECT=true только для локальной разработки."
    );
    this.name = "GigaChatTlsCertificateError";
    this.cause = cause;
  }
}

function getAuthUrl() {
  return process.env.GIGACHAT_AUTH_URL || "https://ngw.devices.sberbank.ru:9443/api/v2/oauth";
}

function getApiBaseUrl() {
  return (process.env.GIGACHAT_BASE_URL || "https://gigachat.devices.sberbank.ru/api/v1").replace(/\/$/, "");
}

function normalizeAuthorizationHeader(authKey: string) {
  const cleanKey = authKey.trim();

  if (/^(basic|bearer)\s+/i.test(cleanKey)) {
    return cleanKey;
  }

  return `Basic ${cleanKey}`;
}

function maybeDisableTlsRejectForLocalDev() {
  if (process.env.GIGACHAT_DISABLE_TLS_REJECT === "true") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }
}

function isTlsCertificateError(error: unknown) {
  const candidate = error as { code?: unknown; cause?: { code?: unknown }; message?: unknown };
  const code = candidate?.code || candidate?.cause?.code;
  const message = typeof candidate?.message === "string" ? candidate.message : "";

  return (
    code === "SELF_SIGNED_CERT_IN_CHAIN" ||
    code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
    code === "DEPTH_ZERO_SELF_SIGNED_CERT" ||
    message.includes("self-signed certificate") ||
    message.includes("certificate chain")
  );
}

async function safeFetch(input: string, init: RequestInit) {
  maybeDisableTlsRejectForLocalDev();

  try {
    return await fetch(input, init);
  } catch (error) {
    if (isTlsCertificateError(error)) {
      throw new GigaChatTlsCertificateError(error);
    }
    throw error;
  }
}

function getTokenExpiration(data: any): number {
  const expiresAt = Number(data?.expires_at);

  if (Number.isFinite(expiresAt) && expiresAt > Date.now()) {
    return expiresAt;
  }

  const expiresIn = Number(data?.expires_in);
  if (Number.isFinite(expiresIn) && expiresIn > 0) {
    return Date.now() + expiresIn * 1000;
  }

  // GigaChat access token normally lives about 30 minutes. Keep a conservative fallback.
  return Date.now() + 25 * 60 * 1000;
}

async function getGigaChatAccessToken(): Promise<string> {
  const authKey = process.env.GIGACHAT_AUTH_KEY;

  if (!authKey?.trim()) {
    throw new MissingGigaChatCredentialsError();
  }

  if (cachedToken && cachedToken.expiresAt - 60_000 > Date.now()) {
    return cachedToken.accessToken;
  }

  const scope = process.env.GIGACHAT_SCOPE || "GIGACHAT_API_PERS";
  const response = await safeFetch(getAuthUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      RqUID: randomUUID(),
      Authorization: normalizeAuthorizationHeader(authKey)
    },
    body: new URLSearchParams({ scope }).toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GigaChat OAuth error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const accessToken = data?.access_token;

  if (typeof accessToken !== "string" || !accessToken.trim()) {
    throw new Error("GigaChat OAuth response did not contain access_token");
  }

  cachedToken = {
    accessToken,
    expiresAt: getTokenExpiration(data)
  };

  return accessToken;
}

export async function createGigaChatCompletion(
  messages: GigaChatMessage[],
  options: GigaChatOptions = {}
): Promise<string> {
  const accessToken = await getGigaChatAccessToken();
  const model = process.env.GIGACHAT_MODEL || "GigaChat";

  const response = await safeFetch(`${getApiBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 700,
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GigaChat API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }

  throw new Error("GigaChat response did not contain message content");
}
