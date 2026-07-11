import { defaultIndustry, getIndustryById } from "./industries";
import { getSalesStageById, salesStages } from "./salesStages";
import { getScenarioById } from "./scenarios";
import type { Scenario, TrainingContext, TrainingMode, TrainingPromptContext } from "./types";

const allowedModes: TrainingMode[] = ["full_funnel", "single_stage"];

export function normalizeTrainingMode(value: unknown): TrainingMode {
  return allowedModes.includes(value as TrainingMode) ? (value as TrainingMode) : "full_funnel";
}

function getScenarioBaseObjection(scenario: Scenario) {
  if (scenario.baseObjection) return scenario.baseObjection;
  if (scenario.id === "expensive") return "дорого";
  if (scenario.id === "trust") return "нет доверия";
  if (scenario.id === "competitor") return "у конкурентов лучше";
  if (scenario.id === "think") return "я подумаю";
  if (scenario.id === "price-only") return "просто скажите цену";
  return scenario.title.toLowerCase();
}

export function createTrainingContext(input: {
  scenarioId: string;
  industryId?: string | null;
  mode?: string | null;
  stageId?: string | null;
}): TrainingContext {
  const mode = normalizeTrainingMode(input.mode);
  const industry = getIndustryById(input.industryId) ?? defaultIndustry;
  const stage = mode === "single_stage" ? getSalesStageById(input.stageId) ?? salesStages[7] : undefined;

  return {
    scenarioId: input.scenarioId,
    industryId: industry.id,
    mode,
    ...(stage ? { stageId: stage.id } : {})
  };
}

export function serializeTrainingContext(context: TrainingContext) {
  const params = new URLSearchParams();
  params.set("industry", context.industryId);
  params.set("mode", context.mode);
  if (context.stageId) params.set("stage", context.stageId);
  params.set("new", "1");
  return params.toString();
}

export function buildTrainingUrl(context: TrainingContext) {
  return `/train/${context.scenarioId}?${serializeTrainingContext(context)}`;
}

export function getTrainingStorageSuffix(context: TrainingContext) {
  return [context.industryId, context.mode, context.stageId ?? "full", context.scenarioId].join("-");
}

function buildManagerGoal(context: TrainingContext, prompt: Omit<TrainingPromptContext, "managerGoal" | "openingMessage">) {
  const targetAction = prompt.industry.targetActions[0] ?? "следующий шаг";

  if (context.mode === "single_stage" && prompt.stage) {
    return `${prompt.stage.managerGoal} Учитывайте сферу «${prompt.industry.title}» и сценарий «${prompt.scenario.title}». Цель — не пройти всю сделку, а качественно отработать выбранный этап и, если уместно, вывести клиента на мягкий следующий шаг: ${targetAction}.`;
  }

  return `Провести клиента через ключевые этапы разговора: контакт, рамку, квалификацию, выявление потребности, презентацию, предзакрытие, закрытие и работу с возражениями. Итоговая цель — понятный следующий шаг: ${prompt.industry.targetActions.join(", ")}.`;
}

export function buildOpeningMessage(prompt: Pick<TrainingPromptContext, "industry" | "scenario" | "mode" | "stage">) {
  const objection = getScenarioBaseObjection(prompt.scenario);
  const stageHint = prompt.mode === "single_stage" && prompt.stage ? ` Сейчас я хочу понять именно этап «${prompt.stage.title.toLowerCase()}».` : "";

  const openings: Record<string, Record<string, string>> = {
    expensive: {
      psychology: "Честно, мне кажется, консультации выходят дороговато. И я не понимаю, сколько встреч понадобится и поможет ли это вообще.",
      real_estate: "Мне кажется, комиссия и сопровождение дорогие. Я видел варианты дешевле, почему мне платить больше?",
      online_courses: "Курс выглядит интересным, но дорого. Я не уверен, что он окупится и что я дойду до конца.",
      auto: "У других сопровождение дешевле. Почему у вас дороже?",
      equipment_b2b: "У вас решение дороже, чем у поставщика, с которым мы уже работаем. За счет чего переплата оправдана?"
    },
    trust: {
      psychology: "Мне сложно довериться специалисту. Я уже пробовал похожий формат, и особого результата не было.",
      real_estate: "Я боюсь ошибиться с объектом и потом пожалеть. Как понять, что вы действительно на моей стороне?",
      online_courses: "Не уверен, что школе можно доверять. Все обещают результат, а потом человек остается один с уроками.",
      auto: "Если честно, я боюсь переводить деньги в Китай. Какие гарантии, что меня не кинут?",
      equipment_b2b: "Мы не работали с вами раньше. Какие гарантии по поставке, сервису и срокам?"
    },
    competitor: {
      psychology: "Я смотрю еще одного специалиста, у него дешевле и отзывы хорошие. Почему мне идти к вам?",
      real_estate: "Другое агентство уже предложило варианты и обещает быстрее. Чем вы отличаетесь?",
      online_courses: "У другой школы программа дешевле, и они обещают быстрый результат. Почему выбрать вас?",
      auto: "Мне другая компания уже назвала цену под ключ и обещает дешевле. Почему мне идти к вам?",
      equipment_b2b: "У текущего поставщика дешевле и привычнее. Почему нам менять подход?"
    },
    think: {
      psychology: "В целом формат интересен, но я пока присматриваюсь. Не понимаю, насколько мне это сейчас нужно.",
      real_estate: "Объект интересный, но я хочу подумать и обсудить с семьей. Пока не готов двигаться дальше.",
      online_courses: "Программа вроде подходит, но я хочу подумать. Боюсь купить и потом не найти время.",
      auto: "Я пока просто присматриваюсь к авто из Китая. Можете коротко объяснить, как у вас проходит сделка и от чего зависит цена под ключ?",
      equipment_b2b: "Предложение интересное, но нужно подумать и обсудить внутри. Пока не готов ничего обещать."
    },
    "price-only": {
      psychology: "Сколько стоит работа? Мне пока не нужна подробная консультация, просто хочу понять цену.",
      real_estate: "Сколько будет стоить сопровождение? Я пока просто смотрю варианты.",
      online_courses: "Сколько стоит курс? Мне пока не нужна консультация, просто цену скажите.",
      auto: "Сколько будет под ключ? Мне пока не нужна консультация, просто цену скажите.",
      equipment_b2b: "Пришлите цену или КП. Пока не хочу созваниваться, просто нужно понять порядок бюджета."
    }
  };

  const message = openings[prompt.scenario.id]?.[prompt.industry.id];
  return `${message ?? `Я рассматриваю ${prompt.industry.title.toLowerCase()}, но у меня есть сомнение: ${objection}. Объясните, как вы можете помочь?`}${stageHint}`;
}

export function buildTrainingPromptContext(context: TrainingContext): TrainingPromptContext {
  const industry = getIndustryById(context.industryId) ?? defaultIndustry;
  const scenario = getScenarioById(context.scenarioId) ?? getScenarioById("expensive");

  if (!scenario) {
    throw new Error("No scenarios configured");
  }

  const stage = context.mode === "single_stage" ? getSalesStageById(context.stageId) ?? salesStages[7] : undefined;
  const draft = {
    industry,
    mode: context.mode,
    stage,
    allStages: salesStages,
    scenario,
    clientContext: industry.clientContext,
    commonObjections: industry.commonObjections,
    evaluationFocus: industry.evaluationFocus,
    targetActions: industry.targetActions
  };

  const promptContext: TrainingPromptContext = {
    ...draft,
    managerGoal: buildManagerGoal(context, draft),
    openingMessage: buildOpeningMessage({ industry, scenario, mode: context.mode, stage })
  };

  return promptContext;
}

export function buildTrainingPromptContextFromBody(body: unknown): TrainingPromptContext | undefined {
  if (!body || typeof body !== "object") return undefined;
  const candidate = (body as { trainingContext?: Partial<TrainingContext>; scenarioId?: unknown }).trainingContext;
  const fallbackScenarioId = (body as { scenarioId?: unknown }).scenarioId;

  const scenarioId = typeof candidate?.scenarioId === "string" ? candidate.scenarioId : typeof fallbackScenarioId === "string" ? fallbackScenarioId : undefined;
  if (!scenarioId) return undefined;

  const context = createTrainingContext({
    scenarioId,
    industryId: typeof candidate?.industryId === "string" ? candidate.industryId : undefined,
    mode: typeof candidate?.mode === "string" ? candidate.mode : undefined,
    stageId: typeof candidate?.stageId === "string" ? candidate.stageId : undefined
  });

  return buildTrainingPromptContext(context);
}
