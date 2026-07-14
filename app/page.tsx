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
          <div className="direct-contacts">
            <p className="direct-contacts-title">Связаться напрямую</p>
            <div className="direct-contact-grid">
              <a
                className="button button-secondary direct-contact-button"
                href="tel:+79853309292"
                aria-label="Позвонить по номеру +7 985 330 92 92"
              >
                <svg className="contact-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M6.62 10.79a15.46 15.46 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z" />
                </svg>
                <span>+7 985 330 92 92</span>
              </a>
              <a
                className="button button-secondary direct-contact-button"
                href="https://telegram.me/nexaire_tech"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Написать в Telegram"
              >
                <svg className="contact-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M21.8 3.6 18.6 19c-.24 1.09-.88 1.36-1.78.85l-4.87-3.59-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.96 9.02-8.15c.39-.35-.09-.55-.61-.2L6.23 12.71 1.43 11.2C.39 10.87.37 10.16 1.65 9.66L20.4 2.43c.87-.32 1.63.21 1.4 1.17Z" />
                </svg>
                <span>Написать</span>
              </a>
              <a
                className="button button-secondary direct-contact-button"
                href="https://max.ru/u/f9LHodD0cOJ-vZ-7zc6Nn1gazPatEAj2TxVMusPIHovtOoKQmCCf2q7iucs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Написать в MAX"
              >
                <svg className="contact-icon contact-icon-max" viewBox="0 0 1000 1000" aria-hidden="true" focusable="false">
                  <rect width="1000" height="1000" rx="250" />
                  <path className="max-icon-mark" fillRule="evenodd" d="M508.211 878.328c-75.007 0-109.864-10.95-170.453-54.75-38.325 49.275-159.686 87.783-164.979 21.9 0-49.456-10.95-91.248-23.36-136.873-14.782-56.21-31.572-118.807-31.572-209.508 0-216.626 177.754-379.597 388.357-379.597 210.785 0 375.947 171.001 375.947 381.604.707 207.346-166.595 376.118-373.94 377.224m3.103-571.585c-102.564-5.292-182.499 65.7-200.201 177.024-14.6 92.162 11.315 204.398 33.397 210.238 10.585 2.555 37.23-18.98 53.837-35.587a189.8 189.8 0 0 0 92.71 33.032c106.273 5.112 197.08-75.794 204.215-181.95 4.154-106.382-77.67-196.486-183.958-202.574Z" clipRule="evenodd" />
                </svg>
                <span>Написать</span>
              </a>
              <a
                className="button button-secondary direct-contact-button"
                href="mailto:tech@nexaire.ru"
                aria-label="Написать на email tech@nexaire.ru"
              >
                <svg className="contact-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm9 7.2L20.4 7H3.6l8.4 5.2Zm0 2.35L3 9v8h18V9l-9 5.55Z" />
                </svg>
                <span>tech@nexaire.ru</span>
              </a>
            </div>
          </div>
        </div>
        <LeadForm source="home" />
      </section>
    </div>
  );
}
