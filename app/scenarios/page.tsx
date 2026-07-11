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

export default function ScenariosPage() {
  const [industryId, setIndustryId] = useState(industries[3]?.id ?? industries[0].id);
  const [mode, setMode] = useState<TrainingMode | null>(null);
  const [stageId, setStageId] = useState<string | null>(null);

  const selectedIndustry = industries.find((industry) => industry.id === industryId) ?? industries[0];
  const selectedStage = salesStages.find((stage) => stage.id === stageId);

  const readyForScenario = mode === "full_funnel" || (mode === "single_stage" && Boolean(stageId));

  const contextForScenario = useMemo(
    () => ({ industryId, mode: mode ?? "full_funnel", stageId: stageId ?? undefined }),
    [industryId, mode, stageId]
  );

  return (
    <section className="section page-section">
      <div className="page-head scenario-wizard-head">
        <p className="eyebrow">Тренировка</p>
        <h1>Настройте тренировку продаж</h1>
        <p>
          Выберите сферу, режим и сценарий. AI-клиент адаптирует поведение под контекст бизнеса, типовое возражение и этап воронки.
        </p>
      </div>

      <div className="wizard-summary">
        <span>Сфера: <strong>{selectedIndustry.title}</strong></span>
        <span>Режим: <strong>{mode ? modeOptions.find((option) => option.id === mode)?.title : "не выбран"}</strong></span>
        {mode === "single_stage" && <span>Этап: <strong>{selectedStage?.title ?? "не выбран"}</strong></span>}
      </div>

      <div className="wizard-step">
        <div className="section-head-row compact-head">
          <div>
            <p className="eyebrow">Шаг 1</p>
            <h2>Выберите сферу для тренировки</h2>
          </div>
        </div>

        <div className="scenario-grid industry-grid">
          {industries.map((industry) => (
            <button
              className={`scenario-card selectable-card ${industry.id === industryId ? "selected-card" : ""}`}
              key={industry.id}
              type="button"
              onClick={() => setIndustryId(industry.id)}
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
      </div>

      <div className="wizard-step">
        <div className="section-head-row compact-head">
          <div>
            <p className="eyebrow">Шаг 2</p>
            <h2>Что хотите тренировать?</h2>
          </div>
        </div>

        <div className="scenario-grid mode-grid">
          {modeOptions.map((option) => (
            <button
              className={`scenario-card selectable-card ${mode === option.id ? "selected-card" : ""}`}
              key={option.id}
              type="button"
              onClick={() => {
                setMode(option.id);
                if (option.id === "full_funnel") setStageId(null);
              }}
            >
              <div>
                <h2>{option.title}</h2>
                <p>{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {mode === "single_stage" && (
        <div className="wizard-step">
          <div className="section-head-row compact-head">
            <div>
              <p className="eyebrow">Шаг 3</p>
              <h2>Выберите этап</h2>
            </div>
          </div>

          <div className="stage-grid">
            {salesStages.map((stage) => (
              <button
                className={`stage-card selectable-card ${stage.id === stageId ? "selected-card" : ""}`}
                key={stage.id}
                type="button"
                onClick={() => setStageId(stage.id)}
              >
                <h3>{stage.title}</h3>
                <p>{stage.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`wizard-step ${!readyForScenario ? "disabled-step" : ""}`}>
        <div className="section-head-row compact-head">
          <div>
            <p className="eyebrow">{mode === "single_stage" ? "Шаг 4" : "Шаг 3"}</p>
            <h2>Выберите сценарий</h2>
          </div>
          {!readyForScenario && <p>Сначала выберите режим и этап, если тренируете отдельный навык.</p>}
        </div>

        <div className="scenario-grid">
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
      </div>
    </section>
  );
}
