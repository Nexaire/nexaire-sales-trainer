import type { ClientState, Scenario, ScenarioStage } from "./types";

const defaultStages: ScenarioStage[] = [
  "opening",
  "clarification",
  "main_objection",
  "trust_check",
  "price_check",
  "next_step",
  "close"
];

const baseState: ClientState = {
  trust: 45,
  doubt: 70,
  interest: 60,
  readiness: 20,
  stage: "opening",
  turn: 1
};

export const scenarios: Scenario[] = [
  {
    id: "expensive",
    title: "Клиенту дорого",
    description:
      "Клиент заинтересован, но считает стоимость сопровождения завышенной и сравнивает с другими предложениями.",
    managerGoal:
      "Выявить критерии выбора, объяснить ценность сопровождения и довести клиента до следующего шага.",
    clientProfile:
      "Клиент рассматривает авто из Китая, но считает, что может найти дешевле и не понимает, за что платить сопровождению.",
    objections: [
      "У других дешевле",
      "Почему я должен платить за сопровождение?",
      "Я сам могу найти машину",
      "Скиньте цену, я подумаю"
    ],
    difficulty: "medium",
    openingMessage: "У других сопровождение дешевле. Почему у вас дороже?",
    initialClientMessage: "У других сопровождение дешевле. Почему у вас дороже?",
    stages: defaultStages,
    initialState: { ...baseState, trust: 42, doubt: 72, readiness: 18 },
    responseRules: [
      {
        id: "expensive-overpromise",
        priority: 100,
        condition: "overpromise",
        message:
          "Вот как раз такие обещания меня и настораживают. Все говорят “точно пройдет”, а потом появляются нюансы. На чем это основано?",
        nextStage: "trust_check",
        stateDelta: { trust: -15, doubt: 15, readiness: -10 }
      },
      {
        id: "expensive-pushy",
        priority: 95,
        condition: "pushed_too_hard",
        message:
          "Не очень люблю, когда меня подталкивают к решению. Я пока хочу спокойно разобраться, а не торопиться.",
        stateDelta: { trust: -10, doubt: 10, readiness: -10 }
      },
      {
        id: "expensive-general",
        priority: 70,
        condition: "general_answer",
        message: "Пока звучит как просто “мы лучше работаем”. А конкретно за что я плачу?",
        nextStage: "main_objection",
        stateDelta: { trust: -5, doubt: 5, readiness: -5 }
      },
      {
        id: "expensive-stages",
        priority: 62,
        condition: "explained_stages",
        message: "Окей, а что из этого реально снижает риск для меня?",
        nextStage: "trust_check",
        stateDelta: { trust: 7, doubt: -4, readiness: 6 }
      },
      {
        id: "expensive-docs",
        priority: 64,
        condition: "documents_risks_calculation",
        message:
          "А если после покупки выяснится, что расчет был неправильный или что-то не так с документами?",
        nextStage: "trust_check",
        stateDelta: { trust: 10, doubt: -8, readiness: 10 }
      },
      {
        id: "expensive-budget",
        priority: 66,
        condition: "asked_budget_or_price",
        message:
          "Бюджет примерно до 2,3 млн под ключ. Но мне важно понять, не вылезут ли потом дополнительные платежи.",
        nextStage: "clarification",
        stateDelta: { trust: 8, doubt: -5, interest: 6, readiness: 8 }
      },
      {
        id: "expensive-next-step",
        priority: 80,
        condition: "next_step",
        message: "Хорошо, тогда давайте начнем с расчета. Что нужно отправить?",
        nextStage: "close",
        stateDelta: { trust: 12, doubt: -12, interest: 8, readiness: 22 }
      },
      {
        id: "expensive-default",
        priority: 10,
        condition: "default",
        message:
          "Смотрите, я не против заплатить за работу, если понимаю ценность. Но пока мне нужно разложить, где именно вы снижаете риски и где просто берете комиссию.",
        stateDelta: { trust: 2, doubt: -2, readiness: 2 }
      }
    ],
    successReply: "Хорошо, тогда давайте начнем с расчета. Что нужно отправить?",
    neutralReply:
      "Я понял вашу логику. Давайте я пока сравню и вернусь, если решу идти в расчет с нормальной детализацией.",
    failureReply:
      "Пока не убедили. Выглядит так, что я просто переплачу за посредника. Я еще посмотрю другие варианты."
  },
  {
    id: "trust",
    title: "Клиент не доверяет компании",
    description:
      "Клиент боится обмана, перевода денег в Китай, подмены автомобиля и проблем с документами.",
    managerGoal:
      "Снизить тревогу клиента, объяснить этапы проверки и показать, как строится корректная сделка.",
    clientProfile:
      "Клиент хочет купить авто под ключ, но боится потерять деньги и не понимает, кто за что отвечает.",
    objections: [
      "А какие гарантии, что меня не кинут?",
      "Я боюсь переводить деньги в Китай",
      "А если машина приедет не такая?",
      "Как я пойму, что документы нормальные?"
    ],
    difficulty: "hard",
    openingMessage: "Если честно, я боюсь переводить деньги в Китай. Какие гарантии, что меня не кинут?",
    initialClientMessage: "Если честно, я боюсь переводить деньги в Китай. Какие гарантии, что меня не кинут?",
    stages: defaultStages,
    initialState: { ...baseState, trust: 35, doubt: 82, interest: 58, readiness: 12 },
    responseRules: [
      {
        id: "trust-overpromise",
        priority: 100,
        condition: "overpromise",
        message:
          "Меня как раз смущают обещания “без рисков”. Хочется понять не обещания, а как вы реально проверяете сделку.",
        nextStage: "trust_check",
        stateDelta: { trust: -15, doubt: 15, readiness: -10 }
      },
      {
        id: "trust-pushy",
        priority: 95,
        condition: "pushed_too_hard",
        message:
          "Я пока не готов торопиться. Вопрос с переводом денег для меня серьезный, хочется спокойно понять порядок.",
        stateDelta: { trust: -10, doubt: 10, readiness: -10 }
      },
      {
        id: "trust-general",
        priority: 70,
        condition: "general_answer",
        message: "“Работаем честно” все говорят. А как это проверяется на практике?",
        nextStage: "main_objection",
        stateDelta: { trust: -5, doubt: 5, readiness: -5 }
      },
      {
        id: "trust-contract",
        priority: 65,
        condition: "mentioned_contract",
        message: "Договор — это хорошо, но деньги ведь уходят не только вам. Как контролируется сама покупка?",
        nextStage: "trust_check",
        stateDelta: { trust: 7, doubt: -4, readiness: 6 }
      },
      {
        id: "trust-check",
        priority: 66,
        condition: "mentioned_check",
        message: "А как я пойму, что машина реально в том состоянии, которое заявлено?",
        nextStage: "trust_check",
        stateDelta: { trust: 9, doubt: -7, readiness: 8 }
      },
      {
        id: "trust-docs",
        priority: 64,
        condition: "documents_risks_calculation",
        message: "Какие документы я в итоге получаю на руки?",
        nextStage: "trust_check",
        stateDelta: { trust: 10, doubt: -8, readiness: 10 }
      },
      {
        id: "trust-stages",
        priority: 60,
        condition: "explained_stages",
        message: "Порядок понятнее. А на каком этапе я понимаю итоговую сумму и риски по машине?",
        nextStage: "price_check",
        stateDelta: { trust: 8, doubt: -6, readiness: 8 }
      },
      {
        id: "trust-next-step",
        priority: 80,
        condition: "next_step",
        message: "Так понятнее. Тогда можно начать с консультации, чтобы я понял весь порядок?",
        nextStage: "close",
        stateDelta: { trust: 14, doubt: -12, readiness: 24 }
      },
      {
        id: "trust-default",
        priority: 10,
        condition: "default",
        message:
          "Мне важно понять не общие гарантии, а конкретный контроль: кто проверяет машину, как идет оплата и где я вижу документы.",
        stateDelta: { trust: 2, doubt: -2, readiness: 2 }
      }
    ],
    successReply: "Так понятнее. Тогда можно начать с консультации, чтобы я понял весь порядок?",
    neutralReply:
      "Я понял порядок чуть лучше. Пока хочу спокойно переварить и, возможно, вернуться к консультации.",
    failureReply:
      "Пока доверия не появилось. Слишком много непонятного с оплатой и контролем сделки. Я не готов двигаться дальше."
  },
  {
    id: "competitor",
    title: "Клиент сравнивает с конкурентом",
    description:
      "Клиент говорит, что другая компания обещает дешевле, быстрее и без проблем.",
    managerGoal:
      "Не спорить с конкурентом, а выявить условия сравнения и объяснить разницу в подходе, документах и рисках.",
    clientProfile:
      "Клиент уже общался с другой компанией, услышал красивое обещание и пытается продавить цену/условия.",
    objections: [
      "Другая компания обещает дешевле",
      "Они говорят, что все пройдет без проблем",
      "Они быстрее привезут",
      "Почему у вас не так выгодно?"
    ],
    difficulty: "medium",
    openingMessage: "Мне другая компания уже назвала цену под ключ и обещает дешевле. Почему мне идти к вам?",
    initialClientMessage: "Мне другая компания уже назвала цену под ключ и обещает дешевле. Почему мне идти к вам?",
    stages: defaultStages,
    initialState: { ...baseState, trust: 40, doubt: 74, readiness: 16 },
    responseRules: [
      {
        id: "competitor-criticized",
        priority: 100,
        condition: "criticized_competitor",
        message:
          "Не хочу сравнивать в формате “они плохие, мы хорошие”. Мне важнее понять разницу в подходе.",
        nextStage: "main_objection",
        stateDelta: { trust: -8, doubt: 8, readiness: -5 }
      },
      {
        id: "competitor-overpromise",
        priority: 98,
        condition: "overpromise",
        message:
          "Ну вот они тоже говорят, что все точно пройдет. Меня такие обещания как раз смущают. Как это проверить по фактам?",
        nextStage: "trust_check",
        stateDelta: { trust: -12, doubt: 12, readiness: -8 }
      },
      {
        id: "competitor-pushy",
        priority: 95,
        condition: "pushed_too_hard",
        message:
          "Я не готов решать на эмоциях. Если у вас есть отличие, лучше объясните спокойно, без давления.",
        stateDelta: { trust: -10, doubt: 10, readiness: -10 }
      },
      {
        id: "competitor-cautious-price",
        priority: 65,
        condition: "documents_risks_calculation",
        message:
          "То есть вы не называете цену сразу, потому что сначала проверяете параметры машины и документы?",
        nextStage: "price_check",
        stateDelta: { trust: 10, doubt: -7, readiness: 10 }
      },
      {
        id: "competitor-risks",
        priority: 64,
        condition: "mentioned_risks",
        message: "А какие риски чаще всего не учитывают в дешевых предложениях?",
        nextStage: "trust_check",
        stateDelta: { trust: 9, doubt: -6, readiness: 9 }
      },
      {
        id: "competitor-docs",
        priority: 63,
        condition: "mentioned_documents",
        message:
          "Про документы понял. А если конкурент говорит, что утиль точно будет льготный, как это проверить?",
        nextStage: "trust_check",
        stateDelta: { trust: 9, doubt: -6, readiness: 9 }
      },
      {
        id: "competitor-next-step",
        priority: 80,
        condition: "next_step",
        message: "Хорошо, можно сравнить. Что вам нужно, чтобы сделать расчет по конкретной машине?",
        nextStage: "close",
        stateDelta: { trust: 12, doubt: -10, readiness: 22 }
      },
      {
        id: "competitor-general",
        priority: 70,
        condition: "general_answer",
        message:
          "Пока не вижу разницы. Все говорят про надежность и сопровождение. В чем конкретно отличие?",
        nextStage: "main_objection",
        stateDelta: { trust: -5, doubt: 5, readiness: -5 }
      },
      {
        id: "competitor-default",
        priority: 10,
        condition: "default",
        message:
          "Я готов сравнивать не только по цене, но мне нужно видеть, что именно включено в расчет и где могут быть скрытые риски.",
        stateDelta: { trust: 2, doubt: -2, readiness: 2 }
      }
    ],
    successReply: "Хорошо, можно сравнить. Что вам нужно, чтобы сделать расчет по конкретной машине?",
    neutralReply:
      "Понял. Я тогда сравню ваши условия с тем предложением и вернусь, если будет смысл считать предметно.",
    failureReply:
      "Пока я не увидел разницы. Другая компания хотя бы сразу дала цену, а здесь слишком много неопределенности."
  },
  {
    id: "think",
    title: "Клиент говорит: «Я подумаю»",
    description:
      "Клиент пока присматривается к покупке авто из Китая, избегает конкретики и позже может уйти в ‘я подумаю’.",
    managerGoal:
      "Аккуратно выяснить реальное сомнение, не давить и зафиксировать понятный следующий шаг.",
    clientProfile:
      "Клиент заинтересован, но пока только присматривается, боится ошибиться и не хочет чувствовать давление.",
    objections: [
      "Я подумаю",
      "Пока просто смотрю",
      "Нужно посоветоваться",
      "Скиньте информацию, я вернусь"
    ],
    difficulty: "easy",
    openingMessage:
      "Я пока просто присматриваюсь к авто из Китая. Можете коротко объяснить, как у вас проходит сделка и от чего зависит цена под ключ?",
    initialClientMessage:
      "Я пока просто присматриваюсь к авто из Китая. Можете коротко объяснить, как у вас проходит сделка и от чего зависит цена под ключ?",
    stages: defaultStages,
    initialState: { ...baseState, trust: 48, doubt: 66, interest: 62, readiness: 18 },
    responseRules: [
      {
        id: "think-pushy",
        priority: 100,
        condition: "pushed_too_hard",
        message: "Вот поэтому я и не хочу торопиться. Мне нужно спокойно сравнить варианты.",
        stateDelta: { trust: -12, doubt: 10, readiness: -12 }
      },
      {
        id: "think-overpromise",
        priority: 98,
        condition: "overpromise",
        message:
          "Такие обещания звучат красиво, но я как раз не хочу принимать решение на обещаниях. Мне нужна понятная логика и расчет.",
        nextStage: "trust_check",
        stateDelta: { trust: -12, doubt: 12, readiness: -8 }
      },
      {
        id: "think-smth-wrong",
        priority: 66,
        condition: "asked_concern",
        message:
          "Наверное, больше всего смущает, что я не понимаю итоговую стоимость и риски по документам.",
        nextStage: "clarification",
        stateDelta: { trust: 9, doubt: -6, readiness: 8 }
      },
      {
        id: "think-criteria",
        priority: 64,
        condition: "asked_budget_or_price",
        message:
          "Мне важно уложиться в бюджет и не попасть на доначисления или проблемы при оформлении.",
        nextStage: "clarification",
        stateDelta: { trust: 8, doubt: -5, readiness: 8 }
      },
      {
        id: "think-next-step",
        priority: 80,
        condition: "next_step",
        message: "Расчет без обязательств — звучит нормально. Давайте попробуем с этого.",
        nextStage: "close",
        stateDelta: { trust: 12, doubt: -10, readiness: 22 }
      },
      {
        id: "think-general",
        priority: 70,
        condition: "general_answer",
        message:
          "Пока звучит общо. Я из-за этого обычно и ухожу подумать: непонятно, какая будет итоговая сумма и где риски.",
        nextStage: "main_objection",
        stateDelta: { trust: -5, doubt: 5, readiness: -5 }
      },
      {
        id: "think-summary",
        priority: 55,
        condition: "empathy_or_summary",
        message:
          "Да, вы в целом верно поняли. Я не против вернуться к разговору, если будет понятный первый шаг без обязательств.",
        nextStage: "next_step",
        stateDelta: { trust: 8, doubt: -6, readiness: 10 }
      },
      {
        id: "think-default",
        priority: 10,
        condition: "default",
        message:
          "Я пока не готов принимать решение. Сначала хочу понять порядок сделки, примерный расчет и что от меня нужно на первом шаге.",
        stateDelta: { trust: 2, doubt: -2, readiness: 2 }
      }
    ],
    successReply: "Расчет без обязательств — звучит нормально. Давайте попробуем с этого.",
    neutralReply:
      "Давайте так: я пока подумаю, но если будет понятный расчет без давления, можно вернуться к разговору.",
    failureReply:
      "Пока я не готов продолжать. Чувствую, что меня скорее пытаются подтолкнуть, чем спокойно разобраться."
  },
  {
    id: "price-only",
    title: "Клиент хочет просто узнать цену",
    description:
      "Клиент хочет сразу цену под ключ, но не готов давать параметры, бюджет и требования.",
    managerGoal:
      "Показать, почему точный расчет зависит от параметров, и получить минимум вводных без давления.",
    clientProfile:
      "Клиент нетерпеливый, хочет быстрый ответ и может уйти, если менеджер начнет читать лекцию.",
    objections: [
      "А сколько будет под ключ?",
      "Почему нельзя сразу сказать точную цену?",
      "Мне пока не нужен подбор, просто цена",
      "Давайте без лишних вопросов"
    ],
    difficulty: "medium",
    openingMessage: "Сколько будет под ключ? Мне пока не нужна консультация, просто цену скажите.",
    initialClientMessage: "Сколько будет под ключ? Мне пока не нужна консультация, просто цену скажите.",
    stages: defaultStages,
    initialState: { ...baseState, trust: 43, doubt: 68, interest: 58, readiness: 15 },
    responseRules: [
      {
        id: "price-overpromise",
        priority: 100,
        condition: "overpromise",
        message:
          "Странно, а как вы можете точно сказать цену, если еще не знаете конкретную машину и параметры?",
        nextStage: "price_check",
        stateDelta: { trust: -14, doubt: 12, readiness: -8 }
      },
      {
        id: "price-pushy",
        priority: 95,
        condition: "pushed_too_hard",
        message:
          "Я просто хотел понять порядок цены, а не чтобы меня сразу вели в продажу. Давайте без давления.",
        stateDelta: { trust: -10, doubt: 10, readiness: -10 }
      },
      {
        id: "price-avoid",
        priority: 68,
        condition: "general_answer",
        message: "Ну вот, я поэтому и спрашиваю. Почему нельзя просто назвать сумму?",
        nextStage: "price_check",
        stateDelta: { trust: -5, doubt: 5, readiness: -5 }
      },
      {
        id: "price-factors",
        priority: 66,
        condition: "documents_risks_calculation",
        message:
          "Окей, понял. То есть цена зависит не только от машины, но и от года, мощности, документов, доставки и таможни?",
        nextStage: "clarification",
        stateDelta: { trust: 10, doubt: -8, readiness: 10 }
      },
      {
        id: "price-questions",
        priority: 64,
        condition: "asked_budget_or_price",
        message:
          "Модель пока смотрю примерно до 2 млн. Хочу что-то надежное, не старше 3–5 лет.",
        nextStage: "clarification",
        stateDelta: { trust: 8, doubt: -5, readiness: 8 }
      },
      {
        id: "price-next-step",
        priority: 80,
        condition: "next_step",
        message: "Хорошо, если это быстро, давайте расчет. Что нужно от меня?",
        nextStage: "close",
        stateDelta: { trust: 12, doubt: -10, readiness: 22 }
      },
      {
        id: "price-too-general",
        priority: 60,
        condition: "too_general_price",
        message:
          "Мне пока непонятно. Я хотел просто понять порядок цены, а не общие слова про подбор.",
        nextStage: "price_check",
        stateDelta: { trust: -5, doubt: 5, readiness: -5 }
      },
      {
        id: "price-default",
        priority: 10,
        condition: "default",
        message:
          "Мне не нужна точная цифра с потолка. Мне нужен хотя бы понятный порядок: от чего зависит цена и какие данные нужны для расчета.",
        stateDelta: { trust: 2, doubt: -2, readiness: 2 }
      }
    ],
    successReply: "Хорошо, если это быстро, давайте расчет. Что нужно от меня?",
    neutralReply:
      "Порядок понял. Я пока посмотрю варианты и вернусь, если решу считать конкретную машину.",
    failureReply:
      "Пока вы не ответили на главный вопрос по цене. Я хотел простой ориентир, а получил общие слова."
  }
];

export function getScenarioById(id: string): Scenario | undefined {
  return scenarios.find((scenario) => scenario.id === id);
}
