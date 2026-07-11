import { analyzeManagerMessage, type ManagerMessageAnalysis } from "./analyzeManagerMessage";
import { getMockClientReply } from "./getMockClientReply";
import type { ChatMessage, ClientState, EvaluationResult, Scenario, TrainingPromptContext } from "./types";

export type DialogStats = {
  askedQuestionsCount: number;
  specificAnswersCount: number;
  addressedObjectionsCount: number;
  nextStepProposed: boolean;
  overpromiseCount: number;
  pushyCount: number;
  shortAnswersCount: number;
  empathyCount: number;
};

export function createEmptyDialogStats(): DialogStats {
  return {
    askedQuestionsCount: 0,
    specificAnswersCount: 0,
    addressedObjectionsCount: 0,
    nextStepProposed: false,
    overpromiseCount: 0,
    pushyCount: 0,
    shortAnswersCount: 0,
    empathyCount: 0
  };
}

export function updateDialogStats(stats: DialogStats, analysis: ManagerMessageAnalysis): DialogStats {
  return {
    askedQuestionsCount: stats.askedQuestionsCount + (analysis.askedQuestion ? 1 : 0),
    specificAnswersCount: stats.specificAnswersCount + (analysis.isSpecific ? 1 : 0),
    addressedObjectionsCount:
      stats.addressedObjectionsCount +
      (analysis.mentionedPrice ||
      analysis.mentionedDocuments ||
      analysis.mentionedRisks ||
      analysis.mentionedCheck ||
      analysis.mentionedCalculation ||
      analysis.mentionedCompetitor
        ? 1
        : 0),
    nextStepProposed: stats.nextStepProposed || analysis.mentionedNextStep,
    overpromiseCount: stats.overpromiseCount + (analysis.madeOverpromise ? 1 : 0),
    pushyCount: stats.pushyCount + (analysis.pushedTooHard ? 1 : 0),
    shortAnswersCount: stats.shortAnswersCount + (analysis.isTooShort ? 1 : 0),
    empathyCount: stats.empathyCount + (analysis.empathy ? 1 : 0)
  };
}

export function scoreDialog(stats: DialogStats, finalState: ClientState) {
  let score = 40;

  score += Math.min(stats.askedQuestionsCount * 8, 20);
  score += Math.min(stats.specificAnswersCount * 8, 20);
  score += Math.min(stats.addressedObjectionsCount * 4, 12);
  score += stats.nextStepProposed ? 15 : 0;
  score += Math.min(stats.empathyCount * 5, 10);

  score -= stats.overpromiseCount * 15;
  score -= stats.pushyCount * 10;
  score -= stats.shortAnswersCount * 5;

  score += Math.round((finalState.trust - 50) * 0.3);
  score += Math.round((finalState.readiness - 30) * 0.3);

  return Math.max(0, Math.min(100, score));
}

function getSummary(score: number, context?: TrainingPromptContext) {
  if (context?.mode === "single_stage" && context.stage) {
    if (score <= 40) return `Этап «${context.stage.title}» отработан слабо. Менеджер не снял ключевое сопротивление и не показал понятный следующий шаг.`;
    if (score <= 65) return `Этап «${context.stage.title}» отработан частично. Есть отдельные правильные действия, но не хватило конкретики и управляемости.`;
    if (score <= 80) return `Этап «${context.stage.title}» отработан хорошо. Менеджер удержал контакт и приблизил клиента к следующему шагу.`;
    return `Этап «${context.stage.title}» отработан сильно. Менеджер действовал по задаче этапа, без давления и с понятным завершением.`;
  }

  if (score <= 40) return "Диалог слабый. Менеджер не выявил потребность, не ответил на главное возражение и не довел клиента до следующего шага.";
  if (score <= 65) return "Диалог частично рабочий. Менеджер объяснил отдельные моменты, но не хватило конкретики, вопросов и закрытия на следующий шаг.";
  if (score <= 80) return "Хороший диалог. Менеджер спокойно вел клиента, ответил на ключевые сомнения и приблизил к следующему шагу.";
  return "Сильный диалог. Менеджер выявил потребность, отработал возражение, объяснил ценность и предложил понятный следующий шаг.";
}

function getClientOutcome(score: number, finalState: ClientState, context?: TrainingPromptContext) {
  const action = context?.targetActions[0] ?? "консультацию или расчет";
  if (score >= 81 || finalState.readiness >= 75) return `клиент готов к следующему шагу: ${action}`;
  if (score >= 66 || finalState.readiness >= 58) return `клиент готов обсудить следующий шаг: ${action}`;
  if (score >= 51) return "клиент готов к повторному контакту";
  if (score >= 31) return "клиент просит время подумать";
  return "клиент потерян";
}

function pushIf(condition: boolean, target: string[], value: string) {
  if (condition) target.push(value);
}

function buildBetterResponse(context?: TrainingPromptContext) {
  if (!context) {
    return "Понимаю ваше сомнение. Давайте не будем опираться на общие обещания: сначала уточню вашу задачу, бюджет, критерии выбора и главный риск. После этого предложу понятный следующий шаг, чтобы вы могли спокойно оценить решение без давления.";
  }

  const action = context.targetActions[0] ?? "следующий шаг";
  const stage = context.mode === "single_stage" && context.stage ? ` Сейчас нам важно качественно пройти этап «${context.stage.title}», поэтому` : "";
  return `Понимаю ваше сомнение: в сфере «${context.industry.title}» решение действительно не стоит принимать на общих словах.${stage} я сначала уточню вашу задачу, критерии выбора и что именно сейчас останавливает. После этого покажу, как наше решение связано с вашей ситуацией, без обещаний и давления. Если логика подойдет, предложу простой следующий шаг — ${action}.`;
}

function buildStageScores(stats: DialogStats, baseScore: number, context?: TrainingPromptContext) {
  const stages = context?.allStages ?? [];
  if (!stages.length) return undefined;

  return stages.map((stage) => {
    let score = Math.max(10, Math.min(95, baseScore));
    if (stage.id === "contact") score += stats.empathyCount > 0 ? 8 : -8;
    if (stage.id === "qualification") score += stats.askedQuestionsCount >= 2 ? 8 : -10;
    if (stage.id === "needs") score += stats.askedQuestionsCount >= 2 ? 6 : -8;
    if (stage.id === "presentation") score += stats.specificAnswersCount > 0 ? 8 : -10;
    if (stage.id === "closing") score += stats.nextStepProposed ? 10 : -15;
    if (stage.id === "objections") score += stats.addressedObjectionsCount > 0 ? 8 : -10;
    if (stage.id === "framing") score += stats.askedQuestionsCount > 0 ? 4 : -6;
    if (stage.id === "preclose") score += stats.nextStepProposed && stats.askedQuestionsCount > 0 ? 6 : -8;
    if (stats.overpromiseCount > 0) score -= 10;
    if (stats.pushyCount > 0) score -= 10;
    score = Math.max(0, Math.min(100, Math.round(score)));

    return {
      stage: stage.title,
      score,
      comment: score >= 70 ? "Этап в целом пройден нормально." : "Этап стоит потренировать отдельно."
    };
  });
}

export function evaluateMockDialog(scenario: Scenario, messages: ChatMessage[], context?: TrainingPromptContext): EvaluationResult {
  const managerMessages = messages.filter((message) => message.role === "manager");
  let stats = createEmptyDialogStats();
  let finalState = { ...scenario.initialState };

  for (const message of managerMessages) {
    const analysis = analyzeManagerMessage(message.content);
    stats = updateDialogStats(stats, analysis);
    const reply = getMockClientReply({ scenario, promptContext: context, state: finalState, managerText: message.content });
    finalState = reply.nextState;
  }

  let score = managerMessages.length === 0 ? 0 : scoreDialog(stats, finalState);

  if (managerMessages.length <= 1) {
    finalState = { ...finalState, readiness: Math.min(finalState.readiness, 25) };
    score = Math.min(score, 42);
  }

  const strengths: string[] = [];
  const mistakes: string[] = [];
  const missedQuestions: string[] = [];
  const recommendations: string[] = [];

  pushIf(stats.askedQuestionsCount > 0, strengths, "Менеджер задавал вопросы и не свел диалог только к презентации.");
  pushIf(stats.specificAnswersCount > 0, strengths, "В ответах были конкретные элементы: процесс, расчет, проверка, документы, формат или критерии выбора.");
  pushIf(stats.empathyCount > 0, strengths, "Менеджер признал опасения клиента и не обесценил сомнения.");
  pushIf(stats.nextStepProposed, strengths, "Был предложен следующий шаг, а не просто общая консультация без цели.");

  pushIf(stats.askedQuestionsCount === 0, mistakes, "Менеджер мало выявлял потребность и быстро перешел к объяснению решения.");
  pushIf(stats.specificAnswersCount === 0, mistakes, "Ответы были слишком общими: клиенту не хватило конкретики под выбранную сферу.");
  pushIf(!stats.nextStepProposed, mistakes, "Не предложен понятный следующий шаг.");
  pushIf(stats.overpromiseCount > 0, mistakes, "Были опасные обещания. Это снижает доверие, особенно в сомнительных или дорогих сделках.");
  pushIf(stats.pushyCount > 0, mistakes, "В диалоге было давление на клиента. Для сомневающегося клиента это повышает сопротивление.");
  pushIf(stats.shortAnswersCount > 1, mistakes, "Несколько ответов были слишком короткими и не раскрывали ценность решения.");
  pushIf(stats.empathyCount === 0, mistakes, "Не хватило признания опасений клиента.");

  pushIf(stats.askedQuestionsCount === 0, missedQuestions, "Какую задачу клиент хочет решить?");
  pushIf(stats.askedQuestionsCount < 2, missedQuestions, "Что для клиента важнее: цена, срок, надежность, результат, формат или снижение риска?");
  pushIf(stats.addressedObjectionsCount === 0, missedQuestions, "С чем клиент сравнивает предложение?");
  pushIf(!stats.nextStepProposed, missedQuestions, "Готов ли клиент к маленькому следующему шагу без обязательств?");

  pushIf(stats.askedQuestionsCount < 2, recommendations, "Добавьте 2–3 коротких вопроса в начале: задача, критерии выбора, что смущает, с чем сравнивает клиент.");
  pushIf(stats.specificAnswersCount === 0, recommendations, "Объясняйте решение через конкретику выбранной сферы, а не через общие обещания.");
  pushIf(!stats.nextStepProposed, recommendations, "В конце фиксируйте один простой следующий шаг.");
  pushIf(stats.overpromiseCount > 0, recommendations, "Уберите абсолютные обещания. Лучше говорить о проверке, критериях, формате и границах ответственности.");
  pushIf(stats.pushyCount > 0, recommendations, "Не давите на клиента. Сомнение лучше переводить в конкретику: что именно останавливает.");
  pushIf(stats.empathyCount === 0, recommendations, "Сначала подтвердите опасение клиента, потом объясняйте решение. Это снижает сопротивление.");

  const baseResult = {
    mode: context?.mode,
    industry: context?.industry.title,
    scenario: context?.scenario.title ?? scenario.title,
    score,
    clientOutcome: getClientOutcome(score, finalState, context),
    summary: getSummary(score, context),
    strengths: strengths.length ? strengths : ["Менеджер поддержал диалог и не оборвал разговор после первого возражения."],
    mistakes: mistakes.length ? mistakes : ["Серьезных ошибок в мок-оценке не выявлено, но ответы можно сделать еще более структурными."],
    missedQuestions: missedQuestions.length ? missedQuestions : ["Можно дополнительно уточнить сроки, критерии выбора и опыт клиента."],
    recommendations: recommendations.length ? recommendations : ["Сохраняйте спокойный стиль и переводите каждое сомнение клиента в понятный следующий шаг."],
    betterResponseExample: buildBetterResponse(context),
    nextTrainingScenario: scenario.id === "trust" ? "Сравнение с конкурентом" : "Клиент не доверяет"
  } satisfies EvaluationResult;

  if (context?.mode === "single_stage" && context.stage) {
    return {
      ...baseResult,
      mode: "single_stage",
      stage: context.stage.title,
      nextRecommendedStage: score >= 75 ? "Следующий этап воронки" : context.stage.title
    };
  }

  const stageScores = buildStageScores(stats, score, context);
  const weakStages = stageScores?.filter((stage) => stage.score < 65).map((stage) => stage.stage) ?? [];

  return {
    ...baseResult,
    mode: "full_funnel",
    overallScore: score,
    stageScores,
    weakStages,
    nextRecommendedStage: weakStages[0] ?? "Отработка возражений"
  };
}
