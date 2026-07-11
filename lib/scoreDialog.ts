import { analyzeManagerMessage, type ManagerMessageAnalysis } from "./analyzeManagerMessage";
import { getMockClientReply } from "./getMockClientReply";
import type { ChatMessage, ClientState, EvaluationResult, Scenario } from "./types";

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

function getSummary(score: number) {
  if (score <= 40) {
    return "Диалог слабый. Менеджер не выявил потребность, не ответил на главное возражение и не довел клиента до следующего шага.";
  }

  if (score <= 65) {
    return "Диалог частично рабочий. Менеджер объяснил отдельные моменты, но не хватило конкретики, вопросов и закрытия на следующий шаг.";
  }

  if (score <= 80) {
    return "Хороший диалог. Менеджер спокойно вел клиента, ответил на ключевые сомнения и приблизил к следующему шагу.";
  }

  return "Сильный диалог. Менеджер выявил потребность, отработал возражение, объяснил ценность и предложил понятный следующий шаг.";
}

function getClientOutcome(score: number, finalState: ClientState) {
  if (score >= 81 || finalState.readiness >= 75) return "клиент готов к расчету/подбору";
  if (score >= 66 || finalState.readiness >= 58) return "клиент согласен на консультацию или расчет";
  if (score >= 51) return "клиент готов к повторному контакту";
  if (score >= 31) return "клиент просит время подумать";
  return "клиент потерян";
}

function pushIf(condition: boolean, target: string[], value: string) {
  if (condition) target.push(value);
}

export function evaluateMockDialog(scenario: Scenario, messages: ChatMessage[]): EvaluationResult {
  const managerMessages = messages.filter((message) => message.role === "manager");
  let stats = createEmptyDialogStats();
  let finalState = { ...scenario.initialState };

  for (const message of managerMessages) {
    const analysis = analyzeManagerMessage(message.content);
    stats = updateDialogStats(stats, analysis);
    const reply = getMockClientReply({ scenario, state: finalState, managerText: message.content });
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

  pushIf(stats.askedQuestionsCount > 0, strengths, "Менеджер задавал вопросы и не свел диалог только к презентации услуги.");
  pushIf(stats.specificAnswersCount > 0, strengths, "В ответах были конкретные элементы: этапы, расчет, документы, проверка или риски.");
  pushIf(stats.empathyCount > 0, strengths, "Менеджер признал опасения клиента и не обесценил сомнения.");
  pushIf(stats.nextStepProposed, strengths, "Был предложен следующий шаг, а не просто общая консультация без цели.");

  pushIf(stats.askedQuestionsCount === 0, mistakes, "Менеджер мало выявлял потребность и быстро перешел к объяснению услуги.");
  pushIf(stats.specificAnswersCount === 0, mistakes, "Ответы были слишком общими: клиенту не хватило конкретики по процессу и снижению рисков.");
  pushIf(!stats.nextStepProposed, mistakes, "Не предложен понятный следующий шаг: расчет, консультация, отправка параметров или сравнение предложений.");
  pushIf(stats.overpromiseCount > 0, mistakes, "Были опасные обещания. Для импорта авто это снижает доверие, потому что клиент ждет фактов, а не гарантий на словах.");
  pushIf(stats.pushyCount > 0, mistakes, "В диалоге было давление на клиента. Для сомневающегося клиента это повышает сопротивление.");
  pushIf(stats.shortAnswersCount > 1, mistakes, "Несколько ответов были слишком короткими и не раскрывали ценность сопровождения.");
  pushIf(stats.empathyCount === 0, mistakes, "Не хватило признания опасений клиента: страх цены, документов, перевода денег и доначислений нужно проговорить спокойно.");

  pushIf(stats.askedQuestionsCount === 0, missedQuestions, "Какой бюджет под ключ для клиента комфортен?");
  pushIf(stats.askedQuestionsCount < 2, missedQuestions, "Что для клиента важнее: цена, срок, надежность, документы, состояние автомобиля или отсутствие скрытых платежей?");
  pushIf(stats.addressedObjectionsCount === 0, missedQuestions, "С чем клиент сравнивает предложение: с покупкой в России, другой компанией или самостоятельным поиском?");
  pushIf(stats.specificAnswersCount === 0, missedQuestions, "Есть ли у клиента конкретная модель, ссылка на автомобиль, год, мощность и требования к комплектации?");
  pushIf(!stats.nextStepProposed, missedQuestions, "Готов ли клиент к маленькому следующему шагу: расчету без обязательств или отправке параметров машины?");

  pushIf(stats.askedQuestionsCount < 2, recommendations, "Добавьте 2–3 коротких вопроса в начале: бюджет, модель/класс авто, что смущает, с чем сравнивает клиент.");
  pushIf(stats.specificAnswersCount === 0, recommendations, "Объясняйте сопровождение через конкретные этапы: расчет, проверка VIN/истории, документы, покупка, доставка, таможня, СБКТС и ЭПТС.");
  pushIf(!stats.nextStepProposed, recommendations, "В конце фиксируйте один простой следующий шаг: отправить параметры авто, сделать расчет или провести консультацию на 15 минут.");
  pushIf(stats.overpromiseCount > 0, recommendations, "Уберите абсолютные обещания. Лучше говорить: “мы заранее проверяем параметры и документы, чтобы снизить риск ошибок”.");
  pushIf(stats.pushyCount > 0, recommendations, "Не давите на клиента. Сомнение лучше переводить в конкретику: “давайте посмотрим, что именно вас останавливает”.");
  pushIf(stats.empathyCount === 0, recommendations, "Сначала подтвердите опасение клиента, потом объясняйте решение. Это снижает сопротивление.");

  return {
    score,
    clientOutcome: getClientOutcome(score, finalState),
    summary: getSummary(score),
    strengths: strengths.length ? strengths : ["Менеджер поддержал диалог и не оборвал разговор после первого возражения."],
    mistakes: mistakes.length ? mistakes : ["Серьезных ошибок в мок-оценке не выявлено, но ответы можно сделать еще более структурными."],
    missedQuestions: missedQuestions.length ? missedQuestions : ["Можно дополнительно уточнить сроки покупки и опыт клиента с импортом авто."],
    recommendations: recommendations.length
      ? recommendations
      : [
          "Сохраняйте спокойный стиль и переводите каждое сомнение клиента в понятный следующий шаг.",
          "После объяснения ценности сопровождения фиксируйте действие: расчет, консультация или параметры автомобиля."
        ],
    betterResponseExample:
      "Понимаю ваше сомнение. Чтобы не обещать на словах, я бы предложил начать с конкретного расчета: модель, год, мощность, цена в Китае, доставка, таможня, утиль, СБКТС и ЭПТС. Так вы увидите итоговую стоимость под ключ и поймете, где есть риски. Подскажите, какой бюджет и какие 2–3 модели сейчас рассматриваете?",
    nextTrainingScenario:
      scenario.id === "trust"
        ? "Клиент сравнивает с конкурентом"
        : "Клиент не доверяет компании"
  };
}
