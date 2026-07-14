"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LeadForm from "@/components/LeadForm";
import { buildTrainingPromptContext, buildTrainingUrl } from "@/lib/trainingContext";
import type { ChatMessage, EvaluationResult, TrainingContext } from "@/lib/types";

type StoredDialogue = {
  scenarioId: string;
  trainingContext?: TrainingContext;
  messages: ChatMessage[];
  finishedAt: string;
};

function getScore(evaluation: EvaluationResult) {
  return evaluation.mode === "full_funnel" ? evaluation.overallScore ?? evaluation.score : evaluation.score;
}

function getSafeBetterResponse(evaluation: EvaluationResult | null): string {
  const text = evaluation?.betterResponseExample?.trim();
  if (text) return text;

  return "Понимаю ваше сомнение. Давайте сначала уточним вашу задачу, критерии выбора и что именно сейчас останавливает. После этого я покажу, как решение связано с вашей ситуацией, без давления и лишних обещаний. Если логика подойдет, предложу понятный следующий шаг.";
}

function ResultList({ title, items, className = "" }: { title: string; items: string[]; className?: string }) {
  return (
    <div className={`result-card ${className}`.trim()}>
      <h2>{title}</h2>
      <ul>
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function ResultView() {
  const [dialogue, setDialogue] = useState<StoredDialogue | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const promptContext = useMemo(() => {
    if (!dialogue?.trainingContext) return undefined;
    return buildTrainingPromptContext(dialogue.trainingContext);
  }, [dialogue?.trainingContext]);

  useEffect(() => {
    const saved = localStorage.getItem("nexaire-trainer-last-dialogue");

    if (!saved) {
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(saved) as StoredDialogue;
      setDialogue(parsed);
    } catch {
      setError("Не удалось прочитать сохраненный диалог.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function evaluate() {
      if (!dialogue) return;

      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenarioId: dialogue.scenarioId,
            trainingContext: dialogue.trainingContext,
            messages: dialogue.messages
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Не удалось получить оценку");
        }

        if (!cancelled) setEvaluation(data.evaluation);
      } catch (evaluateError) {
        if (!cancelled) setError(evaluateError instanceof Error ? evaluateError.message : "Не удалось получить оценку");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    evaluate();

    return () => {
      cancelled = true;
    };
  }, [dialogue]);

  if (!dialogue && !loading) {
    return (
      <section className="section page-section">
        <div className="empty-state">
          <h1>Нет завершенного диалога</h1>
          <p>Сначала пройдите тренировку, а затем вернитесь к результатам.</p>
          <Link className="button button-primary" href="/scenarios">Выбрать сценарий</Link>
        </div>
      </section>
    );
  }

  const restartHref = dialogue?.trainingContext ? buildTrainingUrl(dialogue.trainingContext) : "/scenarios";
  const score = evaluation ? getScore(evaluation) : 0;
  const resultTitle = evaluation?.mode === "single_stage"
    ? `Разбор этапа: ${evaluation.stage ?? promptContext?.stage?.title ?? "отдельный этап"}`
    : "Разбор всей сделки";

  return (
    <section className="section page-section">
      <div className="page-head result-head">
        <div>
          <p className="eyebrow">Результат тренировки</p>
          <h1>{resultTitle}</h1>
          <p>
            {promptContext
              ? `Сфера: ${promptContext.industry.title}. Режим: ${promptContext.mode === "single_stage" ? "отдельный этап" : "вся сделка"}. Сценарий: ${promptContext.scenario.title}.`
              : "Оценка строится по контакту, выявлению потребности, доверию, цене, возражениям, закрытию и общей адекватности коммуникации."}
          </p>
        </div>
        {evaluation && (
          <div className="score-card-large">
            <span>{score}</span>
            <small>из 100</small>
          </div>
        )}
      </div>

      {loading && <div className="loading-card">AI-оценщик разбирает диалог...</div>}
      {error && <div className="error-banner">{error}</div>}

      {evaluation && (
        <div className="result-layout">
          <div className="result-main">
            <article className="result-card result-summary">
              <h2>Итог клиента</h2>
              <p><strong>{evaluation.clientOutcome}</strong></p>
              <p>{evaluation.summary}</p>
            </article>

            {evaluation.mode === "full_funnel" && evaluation.stageScores && (
              <article className="result-card stage-score-card">
                <h2>Оценка по этапам</h2>
                <div className="stage-score-list">
                  {evaluation.stageScores.map((stage) => (
                    <div className="stage-score-row" key={stage.stage}>
                      <div>
                        <strong>{stage.stage}</strong>
                        <p>{stage.comment}</p>
                      </div>
                      <span>{stage.score}</span>
                    </div>
                  ))}
                </div>
              </article>
            )}

            <div className="result-grid">
              <ResultList title="Сильные стороны" items={evaluation.strengths} />
              <ResultList title={evaluation.mode === "full_funnel" ? "Слабые этапы" : "Ошибки"} items={evaluation.mode === "full_funnel" ? evaluation.weakStages ?? evaluation.mistakes : evaluation.mistakes} />
              <ResultList className="result-card-wide" title="Рекомендации" items={evaluation.recommendations} />
            </div>

            <article className="result-card improved-answer-card">
              <h2>Пример улучшенного ответа</h2>
              <p>{getSafeBetterResponse(evaluation)}</p>
            </article>

            <article className="result-card">
              <h2>Что тренировать дальше</h2>
              <p>{evaluation.nextRecommendedStage ?? evaluation.nextTrainingScenario ?? "Отработка возражений"}</p>
            </article>

            <div className="result-actions">
              <Link className="button button-secondary" href={restartHref}>
                Пройти еще раз
              </Link>
              <a className="button button-primary" href="#lead">
                Собрать тренажер под нашу компанию
              </a>
            </div>
          </div>

          <aside className="dialogue-preview">
            <h2>Контекст</h2>
            {promptContext && (
              <div className="context-list result-context-list">
                <span>Сфера: <strong>{promptContext.industry.title}</strong></span>
                <span>Режим: <strong>{promptContext.mode === "single_stage" ? "Отдельный этап" : "Вся сделка"}</strong></span>
                {promptContext.stage && <span>Этап: <strong>{promptContext.stage.title}</strong></span>}
                <span>Сценарий: <strong>{promptContext.scenario.title}</strong></span>
              </div>
            )}

            <h2>Фрагмент диалога</h2>
            <div className="preview-messages">
              {dialogue?.messages.slice(-6).map((message) => (
                <div key={message.id}>
                  <strong>{message.role === "manager" ? "Менеджер" : "Клиент"}</strong>
                  <p>{message.content}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      <section className="cta-section result-lead" id="lead">
        <div>
          <p className="eyebrow">Следующий шаг</p>
          <h2>Собрать тренажер под ваш продукт</h2>
          <p>Оставьте контакт — обсудим сценарии, скрипты, возражения и формат запуска.</p>
        </div>
        <LeadForm source="result" />
      </section>
    </section>
  );
}
