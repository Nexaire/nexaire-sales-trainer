export type ManagerMessageAnalysis = {
  askedQuestion: boolean;
  isTooShort: boolean;
  isSpecific: boolean;
  mentionedPrice: boolean;
  mentionedBudget: boolean;
  mentionedDocuments: boolean;
  mentionedRisks: boolean;
  mentionedCheck: boolean;
  mentionedCalculation: boolean;
  mentionedNextStep: boolean;
  mentionedGuarantee: boolean;
  madeOverpromise: boolean;
  pushedTooHard: boolean;
  empathy: boolean;
  mentionedCompetitor: boolean;
  criticizedCompetitor: boolean;
  mentionedStages: boolean;
  mentionedContract: boolean;
  askedConcern: boolean;
};

function normalize(text: string) {
  return text.toLowerCase().replace(/ё/g, "е").trim();
}

export function analyzeManagerMessage(text: string): ManagerMessageAnalysis {
  const t = normalize(text);
  const hasAny = (words: string[]) => words.some((word) => t.includes(normalize(word)));

  const askedQuestion =
    text.includes("?") ||
    hasAny([
      "уточню",
      "подскажите",
      "скажите",
      "какой",
      "какая",
      "какие",
      "какую",
      "что для вас важно",
      "с чем сравниваете",
      "что смущает",
      "что вас смущает",
      "какие опасения",
      "по какому бюджету",
      "в какой бюджет",
      "какой бюджет"
    ]);

  const mentionedDocuments = hasAny([
    "документ",
    "сбктс",
    "эптс",
    "инвойс",
    "договор",
    "тамож",
    "утилизационный",
    "утиль"
  ]);

  const mentionedCheck = hasAny([
    "провер",
    "vin",
    "вин",
    "истори",
    "фото",
    "видео",
    "состояние",
    "отчет",
    "диагност",
    "осмотр"
  ]);

  const mentionedRisks = hasAny([
    "риск",
    "ошиб",
    "доначисл",
    "занижен",
    "скрытые",
    "нюанс",
    "сюрприз",
    "проблем",
    "не так"
  ]);

  const mentionedCalculation = hasAny([
    "расчет",
    "считаем",
    "посчитаем",
    "под ключ",
    "итоговая",
    "итоговую",
    "стоимость",
    "смета"
  ]);

  const mentionedPrice = hasAny([
    "цена",
    "стоимость",
    "дорого",
    "дешевле",
    "бюджет",
    "руб",
    "₽",
    "под ключ",
    "доплаты",
    "платеж"
  ]);

  const mentionedBudget = hasAny([
    "бюджет",
    "уложиться",
    "диапазон",
    "до 2",
    "до 3",
    "предел",
    "комфортная сумма"
  ]);

  const mentionedNextStep = hasAny([
    "следующий шаг",
    "расчет",
    "консультац",
    "отправьте",
    "пришлите",
    "давайте начнем",
    "можем начать",
    "с чего начнем",
    "параметры",
    "данные по машине",
    "ссылку на машину"
  ]);

  const mentionedGuarantee = hasAny(["гарант", "точно", "100%", "без проблем", "без рисков"]);

  const madeOverpromise = hasAny([
    "точно пройдет",
    "гарантируем утиль",
    "гарантируем льготный",
    "никаких рисков",
    "100%",
    "без проблем пройдет",
    "все пройдет",
    "вообще без рисков",
    "можете не переживать"
  ]);

  const pushedTooHard = hasAny([
    "надо решать",
    "только сегодня",
    "вы должны",
    "иначе потеряете",
    "срочно",
    "лучше не тянуть",
    "надо брать",
    "нужно сейчас",
    "потом будет поздно"
  ]);

  const empathy = hasAny([
    "понимаю",
    "логично",
    "нормально",
    "согласен",
    "это важный вопрос",
    "ваше опасение понятно",
    "понимаю ваше опасение",
    "это разумно",
    "правильно, что уточняете"
  ]);

  const mentionedCompetitor = hasAny([
    "конкурент",
    "другая компания",
    "у других",
    "они",
    "дешевле",
    "сравнить"
  ]);

  const criticizedCompetitor = hasAny([
    "они обманывают",
    "у них плохо",
    "они не умеют",
    "они врут",
    "нельзя им доверять",
    "мошенники",
    "лохотрон"
  ]);

  const mentionedStages = hasAny([
    "этап",
    "порядок",
    "сначала",
    "потом",
    "дальше",
    "от запроса до",
    "подбор",
    "покупка",
    "доставка",
    "таможня"
  ]);

  const mentionedContract = hasAny(["договор", "юрид", "реквизит", "ооо", "ответственность"]);

  const askedConcern = hasAny([
    "что смущает",
    "что вас смущает",
    "какое сомнение",
    "какие сомнения",
    "какие опасения",
    "что останавливает",
    "почему хотите подумать"
  ]);

  const isSpecific =
    mentionedStages ||
    mentionedDocuments ||
    mentionedCheck ||
    mentionedRisks ||
    mentionedCalculation ||
    mentionedContract;

  return {
    askedQuestion,
    isTooShort: t.length < 60,
    isSpecific,
    mentionedPrice,
    mentionedBudget,
    mentionedDocuments,
    mentionedRisks,
    mentionedCheck,
    mentionedCalculation,
    mentionedNextStep,
    mentionedGuarantee,
    madeOverpromise,
    pushedTooHard,
    empathy,
    mentionedCompetitor,
    criticizedCompetitor,
    mentionedStages,
    mentionedContract,
    askedConcern
  };
}
