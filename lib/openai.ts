type OpenAITextOptions = {
  temperature?: number;
  maxOutputTokens?: number;
  jsonSchema?: Record<string, unknown>;
};

export class MissingOpenAIKeyError extends Error {
  constructor() {
    super("OPENAI_API_KEY is not set");
    this.name = "MissingOpenAIKeyError";
  }
}

export async function createOpenAITextResponse(
  instructions: string,
  input: string,
  options: OpenAITextOptions = {}
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new MissingOpenAIKeyError();
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.6";
  const body: Record<string, unknown> = {
    model,
    instructions,
    input,
    temperature: options.temperature ?? 0.7,
    max_output_tokens: options.maxOutputTokens ?? 700,
    store: false
  };

  if (options.jsonSchema) {
    body.text = {
      format: {
        type: "json_schema",
        name: "sales_training_evaluation",
        schema: options.jsonSchema,
        strict: true
      }
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return extractOutputText(data);
}

function extractOutputText(data: any): string {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const content = data?.output
    ?.flatMap((item: any) => item?.content || [])
    ?.map((contentItem: any) => contentItem?.text || "")
    ?.join("\n")
    ?.trim();

  if (content) {
    return content;
  }

  throw new Error("OpenAI response did not contain output text");
}
