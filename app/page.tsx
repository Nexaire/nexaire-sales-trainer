import Link from "next/link";
import LeadForm from "@/components/LeadForm";

const trainingSteps = [
  "Менеджер выбирает сценарий и формат тренировки: пройти всю сделку целиком или отработать отдельный этап продаж.",
  "Ведёт диалог с AI-клиентом, который реагирует на ответы, задаёт вопросы и возражает.",
  "После тренировки система анализирует диалог, оценивает прохождение этапов продажи и отмечает допущенные ошибки.",
  "Менеджер получает разбор, рекомендации и примеры того, как можно было ответить точнее и убедительнее.",
  "Руководитель видит результаты тренировок, повторяющиеся ошибки и этапы, которые менеджеру нужно отработать дополнительно."
];

const managerBenefits = [
  "Отработка сложных ситуаций из реальной практики компании без риска потерять клиента или сделку",
  "Возможность повторять одну и ту же ситуацию, пока нужный навык не станет устойчивым",
  "Понятный разбор ошибок и конкретные рекомендации после каждой тренировки"
];

const leaderBenefits = [
  "Понимание, насколько менеджер готов к разговорам с реальными клиентами",
  "Видимость повторяющихся ошибок и этапов продажи, которые требуют дополнительной отработки",
  "Единые критерии оценки, которые помогают сравнивать результаты сотрудников и планировать дальнейшее обучение",
  "Меньше времени на проведение ролевых тренировок и повторение одной и той же обратной связи",
  "Более быстрая и системная подготовка новых менеджеров к работе с клиентами"
];

const setupItems = [
  "продукты и услуги",
  "этапы и скрипты продаж",
  "типовые возражения",
  "роли клиентов",
  "сложные кейсы",
  "критерии оценки",
  "сложность сценариев"
];

const audiences = [
  "отделы продаж",
  "РОПы",
  "корпоративное обучение",
  "онлайн-школы",
  "автосалоны и автоуслуги",
  "недвижимость",
  "медицина",
  "B2B-услуги",
  "колл-центры"
];

const launchSteps = [
  {
    title: "Адаптируем под ваш продукт и воронку продаж",
    text: "Учитываем специфику продукта, типы клиентов, структуру сделки и принятый в компании процесс продаж."
  },
  {
    title: "Настраиваем тренировки и аналитику",
    text: "Определяем этапы, ситуации и сценарии, задаём критерии оценки и данные, которые должен видеть руководитель."
  },
  {
    title: "Запускаем тренажёр в работу",
    text: "Менеджеры начинают тренироваться, а руководитель получает результаты и видит, какие навыки требуют дополнительной отработки."
  }
];

const faqItems = [
  {
    question: "Можно ли настроить тренажёр под наши скрипты и материалы?",
    answer:
      "Да. При запуске под компанию мы учитываем ваши продукты, этапы продаж, скрипты, типовые возражения и реальные ситуации из практики. На этой основе настраиваются сценарии тренировок, поведение AI-клиента и критерии оценки."
  },
  {
    question: "Что делать, если у нас нет готового скрипта продаж?",
    answer:
      "Это не мешает запуску. Мы можем собрать сценарии на основе вашей воронки, продукта, типовых вопросов клиентов, возражений и практики менеджеров. В процессе настройки определим, какие действия и ответы считать правильными на каждом этапе продажи."
  },
  {
    question: "Как тренажёр оценивает ответы менеджера?",
    answer:
      "Критерии оценки настраиваются под вашу систему продаж. Тренажёр учитывает прохождение этапов, качество вопросов, работу с потребностями и возражениями, точность презентации и другие параметры, которые важны для вашей компании."
  },
  {
    question: "Можно ли тренировать отдельные этапы продаж?",
    answer:
      "Да. Менеджер может пройти всю сделку целиком или отдельно отработать нужный этап: установление контакта, квалификацию, выявление потребности, презентацию, закрытие или работу с возражениями."
  },
  {
    question: "Чем открытое демо отличается от запуска под компанию?",
    answer:
      "В демо используются типовые сферы и сценарии, чтобы показать механику тренажёра. При запуске под компанию он адаптируется под ваш продукт, воронку продаж, реальные ситуации, критерии оценки и требования к аналитике."
  }
];

export default function HomePage() {
  return (
    <div>
      <section className="hero section">
        <div className="hero-content">
          <p className="eyebrow">Nexaire Tech · AI-тренажёр продаж</p>
          <h1>Тренируйте менеджеров на сценариях вашей компании — до разговора с реальным клиентом</h1>
          <p className="hero-text">
            Менеджеры проходят реалистичные диалоги с AI-клиентом, получают разбор ошибок и рекомендации. Руководитель видит результаты и понимает, где сотруднику нужна дополнительная практика.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/scenarios">
              Попробовать демо
            </Link>
            <a className="button button-secondary" href="#lead">
              Обсудить запуск для компании
            </a>
          </div>
        </div>
        <div className="hero-card" aria-label="Пример результата после тренировки">
          <p className="card-label">Пример результата после тренировки</p>
          <div className="score-display" aria-label="Оценка: 82 из 100">
            <div className="score-ring score-ring-result">82</div>
            <span className="score-total">из 100</span>
          </div>
          <h2>Хороший диалог</h2>
          <p>Клиент готов к расчёту, но менеджеру нужно сильнее раскрыть документы и риски.</p>
          <div className="mini-list" aria-label="Разбор этапов диалога">
            <span>Контакт</span>
            <span>Потребность</span>
            <span>Возражения</span>
          </div>
        </div>
      </section>

      <section className="section grid-two home-section" id="problem">
        <div>
          <p className="eyebrow">Проблема</p>
          <h2>Теория не показывает, готов ли менеджер к реальному разговору</h2>
        </div>
        <div className="text-block">
          <p>
            Менеджер может знать продукт и выучить скрипт, но растеряться при неожиданном вопросе, возражении или отказе. Обычно это становится заметно уже в реальных разговорах и может приводить к потере сделки. Руководитель поздно видит слабые места и не всегда понимает, что именно сотруднику нужно отрабатывать.
          </p>
        </div>
      </section>

      <section className="section home-section" id="how">
        <p className="eyebrow">Как работает</p>
        <div className="section-head-row">
          <h2>Как работает тренажёр</h2>
        </div>
        <div className="steps steps-five">
          {trainingSteps.map((item, index) => (
            <article className="step-card" key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section demo-section home-section" id="demo">
        <div>
          <p className="eyebrow">Демо</p>
          <h2>Попробуйте тренажёр в действии</h2>
          <p>
            В открытом демо можно выбрать сферу, сценарий и формат тренировки: пройти всю сделку целиком или отработать отдельный этап продаж. Это типовые сценарии, которые показывают механику продукта. При запуске под вашу компанию тренажёр настраивается под ваши продукты, клиентов, возражения и стандарты продаж.
          </p>
        </div>
        <div className="demo-action">
          <Link className="button button-primary" href="/scenarios">
            Начать тренировку
          </Link>
          <p className="demo-note">Без регистрации</p>
        </div>
      </section>

      <section className="section home-section" id="features">
        <p className="eyebrow">Возможности</p>
        <h2>Что получает менеджер, а что — руководитель</h2>
        <div className="benefit-grid">
          <article className="benefit-card">
            <h3>Для менеджера</h3>
            <ul>
              {managerBenefits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="benefit-card">
            <h3>Для руководителя</h3>
            <ul>
              {leaderBenefits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="section grid-two home-section" id="setup">
        <div>
          <p className="eyebrow">Настройка</p>
          <h2>Тренажёр под вашу систему продаж</h2>
          <p className="muted">
            Сценарии создаются на основе ваших продуктов, скриптов, возражений и реальных ситуаций из практики компании.
          </p>
        </div>
        <div className="tag-cloud">
          {setupItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="section">
        <p className="eyebrow">Для кого</p>
        <div className="audience-grid">
          {audiences.map((item) => (
            <div className="audience-card" key={item}>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="section home-section" id="launch">
        <p className="eyebrow">Запуск</p>
        <h2>Как проходит запуск под вашу компанию</h2>
        <div className="steps launch-steps">
          {launchSteps.map((item, index) => (
            <article className="step-card" key={item.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section developer-section home-section" id="developer">
        <div>
          <p className="eyebrow">О разработчике</p>
          <h2>Разработчик — Nexaire Tech</h2>
          <p>
            Nexaire Tech — технологическое направление ООО «Нексэйр». Мы создаём системные AI-решения для обучения, продаж и автоматизации бизнес-процессов.
          </p>
        </div>
        <a
          className="button button-secondary"
          href="https://tech.nexaire.ru"
          target="_blank"
          rel="noopener noreferrer"
        >
          Подробнее о Nexaire Tech
        </a>
      </section>

      <section className="section home-section" id="faq">
        <p className="eyebrow">Вопросы</p>
        <h2>Частые вопросы о тренажёре</h2>
        <div className="faq-list">
          {faqItems.map((item) => (
            <details className="faq-item" key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="section cta-section home-section" id="lead">
        <div>
          <p className="eyebrow">Запуск</p>
          <h2>Обсудить запуск тренажёра для вашей компании</h2>
          <p>
            На встрече разберём ваш продукт, воронку продаж и задачи обучения. После этого предложим подходящий формат запуска и определим, какие сценарии, этапы и аналитику нужно настроить.
          </p>
        </div>
        <LeadForm source="home" />
      </section>
    </div>
  );
}
