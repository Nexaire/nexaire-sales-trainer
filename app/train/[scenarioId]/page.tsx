import ChatTrainer from "@/components/ChatTrainer";
import { getScenarioById } from "@/lib/scenarios";
import { buildTrainingPromptContext, createTrainingContext } from "@/lib/trainingContext";

type TrainingPageProps = {
  params: { scenarioId: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

function getParam(searchParams: TrainingPageProps["searchParams"], key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] : value;
}

export default function TrainingPage({ params, searchParams }: TrainingPageProps) {
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

  const trainingContext = createTrainingContext({
    scenarioId: scenario.id,
    industryId: getParam(searchParams, "industry"),
    mode: getParam(searchParams, "mode"),
    stageId: getParam(searchParams, "stage")
  });
  const promptContext = buildTrainingPromptContext(trainingContext);

  return <ChatTrainer scenario={scenario} trainingContext={trainingContext} promptContext={promptContext} />;
}
