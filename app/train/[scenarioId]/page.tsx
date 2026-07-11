import ChatTrainer from "@/components/ChatTrainer";
import { getScenarioById } from "@/lib/scenarios";

export default function TrainingPage({ params }: { params: { scenarioId: string } }) {
  const scenario = getScenarioById(params.scenarioId);

  if (!scenario) {
    return (
      <section className="section page-section">
        <div className="empty-state">
          <h1>Сценарий не найден</h1>
          <p>Вернитесь к списку сценариев и выберите доступную тренировку.</p>
          <a className="button button-primary" href="/scenarios">К сценариям</a>
        </div>
      </section>
    );
  }

  return <ChatTrainer scenario={scenario} />;
}
