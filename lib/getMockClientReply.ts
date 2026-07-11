import { analyzeManagerMessage, type ManagerMessageAnalysis } from "./analyzeManagerMessage";
import type { ClientState, MockClientResponseRule, Scenario, ScenarioStage } from "./types";

export type MockClientReplyResult = {
  message: string;
  nextState: ClientState;
  analysis: ManagerMessageAnalysis;
  outcome?: "success" | "neutral" | "failure";
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function applyStateDelta(
  state: ClientState,
  delta: Partial<Omit<ClientState, "stage" | "turn">> = {},
  nextStage?: ScenarioStage
): ClientState {
  return {
    trust: clamp(state.trust + (delta.trust ?? 0)),
    doubt: clamp(state.doubt + (delta.doubt ?? 0)),
    interest: clamp(state.interest + (delta.interest ?? 0)),
    readiness: clamp(state.readiness + (delta.readiness ?? 0)),
    stage: nextStage ?? state.stage,
    turn: state.turn + 1
  };
}

function isRecentlyUsed(rule: MockClientResponseRule, state: ClientState) {
  return rule.id === state.lastReplyId || Boolean(state.recentReplyIds?.includes(rule.id));
}

function findRule(
  scenario: Scenario,
  condition: string,
  stage?: ScenarioStage,
  state?: ClientState,
  allowRecent = false
): MockClientResponseRule | undefined {
  const rules = scenario.responseRules
    .filter((rule) => rule.condition === condition && (!rule.stage || !stage || rule.stage === stage))
    .sort((a, b) => b.priority - a.priority);

  if (allowRecent || !state) {
    return rules[0];
  }

  return rules.find((rule) => !isRecentlyUsed(rule, state)) ?? rules[0];
}

function findScenarioMessage(scenario: Scenario, condition: string, state: ClientState) {
  return (
    findRule(scenario, condition, state.stage, state) ??
    findRule(scenario, condition, undefined, state) ??
    findRule(scenario, "default", state.stage, state) ??
    findRule(scenario, "default", undefined, state)
  );
}

const antiRepeatFallbacks: Record<ScenarioStage, string[]> = {
  opening: [
    "Понял. Но пока мне все еще не хватает конкретики: где именно вы снижаете риски и как это отражается на итоговой цене?",
    "Давайте тогда разложим проще: что я получаю на первом шаге и за счет чего понимаю, что сделка безопасная?"
  ],
  clarification: [
    "Окей, это уже ближе к делу. Тогда мне важно понять рамки по бюджету, документам и следующему шагу.",
    "Хорошо. Давайте тогда не общими словами, а по конкретной машине или хотя бы по понятному диапазону цены."
  ],
  main_objection: [
    "Сомнение у меня остается, но я готов слушать, если вы объясните на конкретном примере.",
    "Пока я не против продолжить, но хочу понять практический смысл сопровождения, а не просто обещание надежности."
  ],
  trust_check: [
    "Порядок понятнее. Следующий вопрос — как я увижу подтверждения по машине, оплате и документам до финального решения?",
    "Хорошо, но мне важно видеть не только объяснение, а конкретные точки контроля по сделке."
  ],
  price_check: [
    "С ценой стало чуть понятнее. А какие данные нужны, чтобы сделать расчет ближе к реальности, а не примерную вилку?",
    "Окей, тогда давайте оттолкнемся от расчета. Мне важно заранее понимать, где цена может измениться."
  ],
  next_step: [
    "Если следующий шаг без обязательств и с нормальным расчетом, то можно попробовать.",
    "Давайте так: сначала расчет и понятные условия, а дальше уже буду принимать решение."
  ],
  close: [
    "Давайте на этом зафиксируемся. Следующий шаг понятен.",
    "Окей, дальше логично идти в расчет или короткую консультацию."
  ]
};

function pickAntiRepeatFallback(state: ClientState, fallbackMessage: string) {
  if (fallbackMessage !== state.lastReplyText) {
    return fallbackMessage;
  }

  const candidates = antiRepeatFallbacks[state.stage] ?? antiRepeatFallbacks.main_objection;
  return candidates.find((message) => message !== state.lastReplyText) ?? fallbackMessage;
}

function buildReply(
  scenario: Scenario,
  rule: MockClientResponseRule | undefined,
  state: ClientState,
  analysis: ManagerMessageAnalysis,
  fallbackMessage: string,
  fallbackDelta: Partial<Omit<ClientState, "stage" | "turn">> = {},
  fallbackStage?: ScenarioStage,
  outcome?: "success" | "neutral" | "failure"
): MockClientReplyResult {
  const rawMessage = rule?.message ?? fallbackMessage;
  const message = pickAntiRepeatFallback(state, rawMessage);
  const nextStateBase = applyStateDelta(
    state,
    rule?.stateDelta ?? fallbackDelta,
    rule?.nextStage ?? fallbackStage
  );
  const replyId = rule?.id ?? `fallback-${nextStateBase.stage}-${nextStateBase.turn}`;
  const recentReplyIds = [replyId, ...(state.recentReplyIds ?? [])]
    .filter((id, index, all) => all.indexOf(id) === index)
    .slice(0, 4);
  const nextState: ClientState = {
    ...nextStateBase,
    lastReplyId: replyId,
    lastReplyText: message,
    recentReplyIds
  };

  return {
    message,
    nextState,
    analysis,
    outcome
  };
}

export function getMockClientReply({
  scenario,
  state,
  managerText
}: {
  scenario: Scenario;
  state: ClientState;
  managerText: string;
}): MockClientReplyResult {
  const analysis = analyzeManagerMessage(managerText);

  if (state.stage === "close") {
    return buildReply(
      scenario,
      undefined,
      state,
      analysis,
      "Я уже понял следующий шаг. Давайте лучше на этом зафиксируемся и не будем дальше усложнять.",
      { readiness: 2 },
      "close",
      state.readiness >= 60 ? "success" : "neutral"
    );
  }

  if (analysis.madeOverpromise) {
    return buildReply(
      scenario,
      findScenarioMessage(scenario, "overpromise", state),
      state,
      analysis,
      "Вот такие обещания меня и настораживают. Мне нужны не гарантии на словах, а понятная проверка и расчет.",
      { trust: -15, doubt: 15, readiness: -10 },
      "trust_check"
    );
  }

  if (analysis.pushedTooHard) {
    return buildReply(
      scenario,
      findScenarioMessage(scenario, "pushed_too_hard", state),
      state,
      analysis,
      "Не очень люблю, когда меня подталкивают к решению. Я хочу спокойно разобраться.",
      { trust: -10, doubt: 10, readiness: -10 }
    );
  }

  if (analysis.criticizedCompetitor) {
    return buildReply(
      scenario,
      findScenarioMessage(scenario, "criticized_competitor", state),
      state,
      analysis,
      "Не хочу сравнивать в формате “они плохие, мы хорошие”. Мне важнее понять разницу в подходе.",
      { trust: -8, doubt: 8, readiness: -5 },
      "main_objection"
    );
  }

  const earlyNextStep = analysis.mentionedNextStep && state.turn <= 2 && state.trust < 55;
  if (earlyNextStep) {
    return buildReply(
      scenario,
      findScenarioMessage(scenario, "general_answer", state),
      state,
      analysis,
      "Пока рано переходить к следующему шагу. Сначала хочу понять, чем вы реально снижаете мои риски.",
      { trust: -3, doubt: 4, readiness: -4 },
      "main_objection"
    );
  }

  if (
    analysis.mentionedNextStep &&
    state.trust >= 55 &&
    state.readiness >= 42 &&
    !analysis.madeOverpromise &&
    !analysis.pushedTooHard
  ) {
    return buildReply(
      scenario,
      findScenarioMessage(scenario, "next_step", state),
      state,
      analysis,
      scenario.successReply,
      { trust: 10, doubt: -10, readiness: 20 },
      "close",
      "success"
    );
  }

  if (analysis.askedConcern) {
    return buildReply(
      scenario,
      findScenarioMessage(scenario, "asked_concern", state),
      state,
      analysis,
      "Больше всего смущают итоговая стоимость, документы и вероятность неприятных сюрпризов после покупки.",
      { trust: 9, doubt: -6, readiness: 8 },
      "clarification"
    );
  }

  if (analysis.askedQuestion && (analysis.mentionedBudget || analysis.mentionedPrice || analysis.mentionedCompetitor)) {
    return buildReply(
      scenario,
      findScenarioMessage(scenario, "asked_budget_or_price", state),
      state,
      analysis,
      "Бюджет примерно до 2,3 млн под ключ. Главное — чтобы без скрытых доплат и проблем с документами.",
      { trust: 8, doubt: -5, interest: 6, readiness: 8 },
      "clarification"
    );
  }

  if ((analysis.isTooShort && !analysis.askedQuestion && !analysis.mentionedNextStep) || (!analysis.isSpecific && !analysis.askedQuestion && !analysis.empathy)) {
    return buildReply(
      scenario,
      findScenarioMessage(scenario, "general_answer", state),
      state,
      analysis,
      "Пока звучит слишком общо. Мне нужна конкретика: что вы проверяете, как считаете цену и какие риски закрываете?",
      { trust: -5, doubt: 5, readiness: -5 },
      state.stage === "opening" ? "main_objection" : state.stage
    );
  }

  if (analysis.mentionedContract) {
    return buildReply(
      scenario,
      findScenarioMessage(scenario, "mentioned_contract", state),
      state,
      analysis,
      "Договор — это хорошо, но мне важно понять, как контролируются деньги, машина и документы на каждом этапе.",
      { trust: 7, doubt: -4, readiness: 6 },
      "trust_check"
    );
  }

  if (analysis.mentionedCheck) {
    return buildReply(
      scenario,
      findScenarioMessage(scenario, "mentioned_check", state),
      state,
      analysis,
      "А как я пойму, что машина реально в том состоянии, которое заявлено?",
      { trust: 9, doubt: -7, readiness: 8 },
      "trust_check"
    );
  }

  if (analysis.mentionedDocuments) {
    return buildReply(
      scenario,
      findScenarioMessage(scenario, "mentioned_documents", state) ?? findScenarioMessage(scenario, "documents_risks_calculation", state),
      state,
      analysis,
      "С документами понятнее. А на каком этапе я вижу итоговый расчет и понимаю риски по машине?",
      { trust: 10, doubt: -8, readiness: 10 },
      "trust_check"
    );
  }

  if (analysis.mentionedRisks) {
    return buildReply(
      scenario,
      findScenarioMessage(scenario, "mentioned_risks", state) ?? findScenarioMessage(scenario, "documents_risks_calculation", state),
      state,
      analysis,
      "А какие риски чаще всего всплывают уже после красивого предварительного расчета?",
      { trust: 10, doubt: -8, readiness: 10 },
      "trust_check"
    );
  }

  if (analysis.mentionedCalculation || analysis.mentionedPrice) {
    return buildReply(
      scenario,
      findScenarioMessage(scenario, "documents_risks_calculation", state),
      state,
      analysis,
      "Окей, а как понять, что итоговая стоимость потом не изменится из-за документов, доставки или таможни?",
      { trust: 8, doubt: -6, readiness: 8 },
      "price_check"
    );
  }

  if (analysis.mentionedStages || analysis.isSpecific) {
    return buildReply(
      scenario,
      findScenarioMessage(scenario, "explained_stages", state),
      state,
      analysis,
      "Порядок стал понятнее. А где именно в этом процессе я вижу итоговую сумму и основные риски?",
      { trust: 7, doubt: -5, readiness: 7 },
      "trust_check"
    );
  }

  if (analysis.empathy) {
    return buildReply(
      scenario,
      findScenarioMessage(scenario, "empathy_or_summary", state),
      state,
      analysis,
      "Да, вы в целом правильно поняли мое опасение. Если будет конкретный первый шаг без обязательств, я готов его обсудить.",
      { trust: 7, doubt: -5, readiness: 8 },
      "next_step"
    );
  }

  if (state.turn >= 7 && state.readiness >= 55 && state.trust >= 55) {
    return buildReply(
      scenario,
      findScenarioMessage(scenario, "next_step", state),
      state,
      analysis,
      scenario.successReply,
      { trust: 8, doubt: -8, readiness: 18 },
      "close",
      "success"
    );
  }

  if (state.turn >= 6 && state.readiness < 60) {
    return buildReply(
      scenario,
      undefined,
      state,
      analysis,
      scenario.neutralReply,
      { readiness: -5 },
      "close",
      "neutral"
    );
  }

  if (state.trust <= 25) {
    return buildReply(
      scenario,
      undefined,
      state,
      analysis,
      scenario.failureReply,
      { trust: -5, doubt: 5, readiness: -10 },
      "close",
      "failure"
    );
  }

  return buildReply(
    scenario,
    findScenarioMessage(scenario, "default", state),
    state,
    analysis,
    scenario.neutralReply,
    { trust: 2, doubt: -2, readiness: 2 }
  );
}
