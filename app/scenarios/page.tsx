import Link from "next/link";
import { scenarios } from "@/lib/scenarios";

export default function ScenariosPage() {
  return (
    <section className="section page-section">
      <div className="page-head">
        <p className="eyebrow">Тренировка</p>
        <h1>Выберите сценарий</h1>
        <p>
          В демо пользователь играет менеджера Nexaire Auto. AI-клиент сомневается, задает вопросы и не соглашается без нормальной работы с потребностью, доверием и ценой.
        </p>
      </div>

      <div className="scenario-grid">
        {scenarios.map((scenario) => (
          <article className="scenario-card" key={scenario.id}>
            <div>
              <span className={`difficulty difficulty-${scenario.difficulty}`}>{scenario.difficulty}</span>
              <h2>{scenario.title}</h2>
              <p>{scenario.description}</p>
            </div>
            <Link className="button button-primary full-width" href={`/train/${scenario.id}?new=1`}>
              Начать тренировку
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
