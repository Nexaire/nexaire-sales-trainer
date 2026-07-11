"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { industries } from "@/lib/industries";
import { salesStages } from "@/lib/salesStages";
import { scenarios } from "@/lib/scenarios";
import { buildTrainingUrl } from "@/lib/trainingContext";
import type { TrainingMode } from "@/lib/types";

const modeOptions: Array<{ id: TrainingMode; title: string; description: string }> = [
  {
    id: "full_funnel",
    title: "Вся сделка",
    description: "Полный диалог от первого контакта до закрытия или отказа. В конце — оценка по этапам воронки."
  },
  {
    id: "single_stage",
    title: "Отдельный этап",
    description: "Короткая тренировка конкретного навыка: квалификация, потребность, презентация, закрытие или возражения."
  }
];

type WizardStep = "industry" | "mode" | "stage" | "scenario";

const stepMeta: Record<WizardStep, { title: string; shortTitle: string; eyebrow: string }> = {
  industry: {
    title: "Выберите сферу для тренировки",
    shortTitle: "Сфера",
    eyebrow: "Шаг 1"
  },
  mode: {
    title: "Что хотите тренировать?",
    shortTitle: "Режим",
    eyebrow: "Шаг 2"
  },
  stage: {
    title: "Выберите этап",
    shortTitle: "Этап",
    eyebrow: "Шаг 3"
  },
  scenario: {
    title: "Выберите сценарий",
    shortTitle: "Сценарий",
    eyebrow: "Финальный шаг"
  }
};

function getWizardSteps(mode: TrainingMode | null): WizardStep[] {
  return mode === "single_stage" ? ["industry", "mode", "stage", "scenario"] : ["industry", "mode", "scenario"];
}

export default function ScenariosPage() {
  const [industryId, setIndustryId] = useState<string | null>(null);
  const [mode, setMode] = useState<TrainingMode | null>(null);
  const [stageId, setStageId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<WizardStep>("industry");

  const selectedIndustry = industries.find((industry) => industry.id === industryId);
  const selectedStage = salesStages.find((stage) => stage.id === stageId);
  const selectedMode = modeOptions.find((option) => option.id === mode);

  const wizardSteps = getWizardSteps(mode);
  const currentStepIndex = wizardSteps.indexOf(activeStep) >= 0 ? wizardSteps.indexOf(activeStep) : 0;
  const stepCount = wizardSteps.length;

  const readyForScenario = Boolean(industryId) && (mode === "full_funnel" || (mode === "single_stage" && Boolean(stageId)));

  const contextForScenario = useMemo(
    () => ({
      industryId: industryId ?? industries[0].id,
      mode: mode ?? "full_funnel",
      stageId: stageId ?? undefined
    }),
    [industryId, mode, stageId]
  );

  function goBack() {
    if (activeStep === "scenario") {
      setActiveStep(mode === "single_stage" ? "stage" : "mode");
      return;
    }

    if (activeStep === "stage") {
      setActiveStep("mode");
      return;
    }

    if (activeStep === "mode") {
      setActiveStep("industry");
    }
  }

  function canOpenStep(step: WizardStep) {
    if (step === "industry") return true;
    if (step === "mode") return Boolean(industryId);
    if (step === "stage") return Boolean(industryId) && mode === "single_stage";
    if (step === "scenario") return readyForScenario;
    return false;
  }

  function openStep(step: WizardStep) {
    if (!canOpenStep(step)) return;
    setActiveStep(step);
  }

  return (
    <section className="section page-section">
      <div className="page-head scenario-wizard-head">
        <p className="eyebrow">Тренировка</p>
        <h1>Настройте тренировку продаж</h1>
        <p>
          Выберите сферу, режим и сценарий. AI-клиент адаптирует поведение под контекст бизнеса, типовое возражение и этап воронки.
        </p>
      </div>

      <div className="wizard-shell">
        <div className="wizard-progress" aria-label="Шаги настройки тренировки">
          {wizardSteps.map((step, index) => {
            const isActive = step === activeStep;
            const isDone = index < currentStepIndex || (step === "industry" && Boolean(industryId)) || (step === "mode" && Boolean(mode)) || (step === "stage" && Boolean(stageId));
            const enabled = canOpenStep(step);

            return (
              <button
                className={`wizard-progress-item ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
                disabled={!enabled}
                key={step}
                onClick={() => openStep(step)}
                type="button"
              >
                <span>{index + 1}</span>
                {stepMeta[step].shortTitle}
              </button>
            );
          })}
        </div>

        <div className="wizard-summary wizard-summary-inline">
          <span>Сфера: <strong>{selectedIndustry?.title ?? "не выбрана"}</strong></span>
          <span>Режим: <strong>{selectedMode?.title ?? "не выбран"}</strong></span>
          {mode === "single_stage" && <span>Этап: <strong>{selectedStage?.title ?? "не выбран"}</strong></span>}
        </div>

        <div className="wizard-panel">
          <div className="wizard-panel-head">
            <div>
              <p className="eyebrow">
                {stepMeta[activeStep].eyebrow} из {stepCount}
              </p>
              <h2>{stepMeta[activeStep].title}</h2>
            </div>
            {activeStep !== "industry" && (
              <button className="button button-secondary wizard-back-button" onClick={goBack} type="button">
                Назад
              </button>
            )}
          </div>

          {activeStep === "industry" && (
            <div className="scenario-grid industry-grid wizard-card-grid">
              {industries.map((industry) => (
                <button
                  className={`scenario-card selectable-card ${industry.id === industryId ? "selected-card" : ""}`}
                  key={industry.id}
                  type="button"
                  onClick={() => {
                    setIndustryId(industry.id);
                    setActiveStep("mode");
                  }}
                >
                  <div>
                    <h2>{industry.title}</h2>
                    <p>{industry.description}</p>
                  </div>
                  <div className="mini-list">
                    {industry.commonObjections.slice(0, 3).map((objection) => (
                      <span key={objection}>{objection}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeStep === "mode" && (
            <div className="scenario-grid mode-grid wizard-card-grid">
              {modeOptions.map((option) => (
                <button
                  className={`scenario-card selectable-card ${mode === option.id ? "selected-card" : ""}`}
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setMode(option.id);
                    if (option.id === "full_funnel") {
                      setStageId(null);
                      setActiveStep("scenario");
                    } else {
                      setActiveStep("stage");
                    }
                  }}
                >
                  <div>
                    <h2>{option.title}</h2>
                    <p>{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeStep === "stage" && (
            <div className="stage-grid wizard-card-grid">
              {salesStages.map((stage) => (
                <button
                  className={`stage-card selectable-card ${stage.id === stageId ? "selected-card" : ""}`}
                  key={stage.id}
                  type="button"
                  onClick={() => {
                    setStageId(stage.id);
                    setActiveStep("scenario");
                  }}
                >
                  <h3>{stage.title}</h3>
                  <p>{stage.description}</p>
                </button>
              ))}
            </div>
          )}

          {activeStep === "scenario" && (
            <>
              {!readyForScenario && (
                <div className="wizard-warning">
                  Сначала выберите сферу, режим и этап, если тренируете отдельный навык.
                </div>
              )}

              <div className="scenario-grid wizard-card-grid">
                {scenarios.map((scenario) => (
                  <article className="scenario-card" key={scenario.id}>
                    <div>
                      <span className={`difficulty difficulty-${scenario.difficulty}`}>{scenario.difficulty}</span>
                      <h2>{scenario.title}</h2>
                      <p>{scenario.description}</p>
                    </div>
                    {readyForScenario ? (
                      <Link
                        className="button button-primary full-width"
                        href={buildTrainingUrl({ ...contextForScenario, scenarioId: scenario.id })}
                      >
                        Начать тренировку
                      </Link>
                    ) : (
                      <button className="button button-secondary full-width" type="button" disabled>
                        Сначала выберите параметры
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
