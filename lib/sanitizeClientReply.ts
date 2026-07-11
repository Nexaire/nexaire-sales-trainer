import type { TrainingPromptContext } from "./types";

const metaReplacements: Array<[RegExp, string]> = [
  [/\bКлиент:\s*/gi, ""],
  [/\bМенеджер:\s*/gi, ""],
  [/\bAI[- ]?клиент:\s*/gi, ""],
  [/\bИИ[- ]?клиент:\s*/gi, ""],
  [/\bкак\s+клиент[:,]?\s*/gi, ""],
  [/\bв\s+рамках\s+этого\s+этапа\b/gi, "в этой ситуации"],
  [/\bна\s+этом\s+этапе\b/gi, "сейчас"],
  [/\bна\s+начальном\s+этапе\b/gi, "пока просто разбираюсь"],
  [/\bэтот\s+этап\b/gi, "этот вопрос"],
  [/\bвыбранный\s+этап\b/gi, "этот вопрос"],
  [/\bотдельный\s+этап\b/gi, "отдельный вопрос"],
  [/\bрежим\s+тренировки\b/gi, "формат разговора"],
  [/\bв\s+режиме\s+тренировки\b/gi, "в разговоре"],
  [/\bэтот\s+сценарий\b/gi, "эта ситуация"],
  [/\bвыбранный\s+сценарий\b/gi, "эта ситуация"],
  [/\bпо\s+сценарию\b/gi, "по ситуации"],
  [/\bсценарий\b/gi, "ситуация"],
  [/\bтренировк[аиуыойе]*\b/gi, "разговор"],
  [/\bустановление\s+контакта\b/gi, "первый разговор"],
  [/\bпрограммирование\s*\/\s*рамка\s+разговора\b/gi, "порядок разговора"],
  [/\bрамка\s+разговора\b/gi, "порядок разговора"],
  [/\bквалификац[а-я]*\b/gi, "исходные параметры"],
  [/\bпотребность\s*\/\s*боль\b/gi, "задача"],
  [/\bпредзакрытие\b/gi, "оставшиеся сомнения"],
  [/\bотработка\s+возражений\b/gi, "ответы на сомнения"],
  [/\bзакрытие\b/gi, "следующий шаг"],
  [/\bпрезентация\b/gi, "объяснение предложения"],
  [/\bкакие\s+этапы\s+сделки\b/gi, "как проходит сделка"],
  [/\bна\s+каком\s+этапе\b/gi, "когда"],
  [/\bна\s+каждом\s+этапе\b/gi, "по ходу процесса"],
  [/\bкаждый\s+этап\b/gi, "весь процесс"]
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compact(text: string) {
  return text
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\n/g, "\n")
    .trim();
}

export function sanitizeClientReply(text: string, context?: TrainingPromptContext) {
  let cleaned = text.trim();

  const dynamicPhrases = [
    context?.stage?.title,
    context?.scenario.title,
    context?.mode === "single_stage" ? "отдельный этап" : undefined,
    context?.mode === "full_funnel" ? "вся сделка" : undefined
  ].filter(Boolean) as string[];

  for (const phrase of dynamicPhrases) {
    cleaned = cleaned.replace(new RegExp(`«?${escapeRegExp(phrase)}»?`, "gi"), "эта ситуация");
  }

  for (const [pattern, replacement] of metaReplacements) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  cleaned = cleaned
    .replace(/эта ситуация\s+эта ситуация/gi, "эта ситуация")
    .replace(/отдельный\s+вопрос\s+эта ситуация/gi, "этот вопрос")
    .replace(/я\s+хочу\s+понять\s+эта\s+ситуация/gi, "я хочу понять, как это будет работать в моей ситуации")
    .replace(/я\s+хочу\s+понять\s+этот\s+вопрос/gi, "я хочу понять, как это будет работать в моей ситуации")
    .replace(/Сейчас\s+я\s+хочу\s+понять\s+именно\s+[^.?!]+[.?!]?/gi, "")
    .replace(/Пока\s+я\s+пока/gi, "Пока я");

  cleaned = compact(cleaned);

  if (!cleaned) {
    return "Пока я хочу спокойно разобраться и понять, как это будет работать в моей ситуации.";
  }

  return cleaned;
}
