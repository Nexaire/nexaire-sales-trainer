import Link from "next/link";
import LeadForm from "@/components/LeadForm";

const setupItems = [
  "продукт компании",
  "скрипты продаж",
  "типовые возражения",
  "роли клиентов",
  "сложность сценариев",
  "критерии оценки",
  "рекомендации для менеджеров"
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

export default function HomePage() {
  return (
    <div>
      <section className="hero section">
        <div className="hero-content">
          <p className="eyebrow">Nexaire Tech · демо гипотезы</p>
          <h1>AI-тренажер продаж под скрипты и возражения вашей компании</h1>
          <p className="hero-text">
            Менеджеры тренируются на сложных клиентах до выхода на реальные заявки. Руководитель видит, кто готов продавать, а кому нужна доработка.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/scenarios">
              Попробовать демо
            </Link>
            <a className="button button-secondary" href="#lead">
              Обсудить внедрение
            </a>
          </div>
          <p className="hero-note">
            Сначала показываем рабочий маршрут: сценарий, диалог, оценка, рекомендации и заявка. Красоту и аналитику можно докрутить после проверки спроса.
          </p>
        </div>
        <div className="hero-card" aria-label="Пример оценки тренировки">
          <p className="card-label">Понятно и по этапам</p>
          <div className="score-ring">82</div>
          <h2>Хороший диалог</h2>
          <p>Клиент готов к расчету, но менеджеру нужно сильнее раскрыть документы и риски.</p>
          <div className="mini-list">
            <span>Контакт</span>
            <span>Потребность</span>
            <span>Возражения</span>
          </div>
        </div>
      </section>

      <section className="section grid-two">
        <div>
          <p className="eyebrow">Проблема</p>
          <h2>Практика часто начинается слишком поздно</h2>
        </div>
        <div className="text-block">
          <p>
            Менеджеры часто изучают продукт и скрипты в теории, а настоящая практика начинается уже на живых клиентах. В результате компания теряет заявки, деньги и время руководителя.
          </p>
          <p>
            AI-тренажер позволяет отрабатывать сложные разговоры заранее: цену, недоверие, сравнение с конкурентами, просьбы о скидке и фразу «я подумаю».
          </p>
        </div>
      </section>

      <section className="section" id="how">
        <p className="eyebrow">Как работает</p>
        <div className="section-head-row">
          <h2>От сценария до разборa диалога</h2>
          <p>Логика демо похожа на понятный маршрут сделки: пользователь понимает, где он находится сейчас и какой следующий шаг.</p>
        </div>
        <div className="steps">
          {[
            "Загружаем продукт, скрипты и типовые возражения.",
            "Собираем реалистичные сценарии клиентов.",
            "Менеджеры проходят тренировочные диалоги.",
            "Система оценивает ответы и показывает ошибки.",
            "Руководитель видит, кто готов к реальным продажам."
          ].map((item, index) => (
            <article className="step-card" key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section grid-two">
        <div>
          <p className="eyebrow">Настройка</p>
          <h2>Что можно настроить под компанию</h2>
          <p className="muted">Демо сейчас собрано вокруг Nexaire Auto, но логика переносится на любой продукт со сложной консультационной продажей.</p>
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
            <div className="audience-card" key={item}>{item}</div>
          ))}
        </div>
      </section>

      <section className="section cta-section" id="lead">
        <div>
          <p className="eyebrow">Внедрение</p>
          <h2>Хотите такой тренажер под ваш отдел продаж?</h2>
          <p>
            Можно собрать демо на ваших скриптах, продуктах и реальных возражениях клиентов.
          </p>
        </div>
        <LeadForm source="home" />
      </section>
    </div>
  );
}
