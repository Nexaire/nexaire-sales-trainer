"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LeadForm from "@/components/LeadForm";
import { getScenarioById } from "@/lib/scenarios";
import type { ChatMessage, EvaluationResult } from "@/lib/types";

type StoredDialogue = {
  scenarioId: string;
  messages: ChatMessage[];
  finishedAt: string;
};

function getSafeBetterResponse(evaluation: EvaluationResult | null): string {
  const text = evaluation?.betterResponseExample?.trim();

  if (text) return text;

  return "Понимаю ваше сомнение. Давайте не будем принимать решение на общих словах: сначала уточним бюджет, требования к автомобилю и главный риск, который вас беспокоит. После этого я подготовлю расчет под ключ и покажу отдельно цену машины, доставку, таможню, утиль, СБКТС, ЭПТС и документы — так вы увидите итоговую сумму и сможете спокойно сравнить варианты.";
}

function ResultList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="result-card">
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

  const scenario = useMemo(() => {
    if (!dialogue?.scenarioId) return undefined;
    return getScenarioById(dialogue.scenarioId);
  }, [dialogue?.scenarioId]);

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
          body: JSON.stringify({ scenarioId: dialogue.scenarioId, messages: dialogue.messages })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Не удалось получить оценку");
        }

        if (!cancelled) {
          setEvaluation(data.evaluation);
        }
      } catch (evaluateError) {
        if (!cancelled) {
          setError(evaluateError instanceof Error ? evaluateError.message : "Не удалось получить оценку");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
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

  return (
    <section className="section page-section">
      <div className="page-head result-head">
        <div>
          <p className="eyebrow">Результат тренировки</p>
          <h1>{scenario?.title || "Диалог"}</h1>
          <p>Оценка строится по контакту, выявлению потребности, доверию, цене, возражениям, закрытию и общей адекватности коммуникации.</p>
        </div>
        {evaluation && (
          <div className="score-card-large">
            <span>{evaluation.score}</span>
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
              <h2>Итог диалога</h2>
              <p><strong>{evaluation.clientOutcome}</strong></p>
              <p>{evaluation.summary}</p>
            </article>

            <div className="result-grid">
              <ResultList title="Сильные стороны" items={evaluation.strengths} />
              <ResultList title="Ошибки" items={evaluation.mistakes} />
              <ResultList title="Незаданные вопросы" items={evaluation.missedQuestions} />
              <ResultList title="Рекомендации" items={evaluation.recommendations} />
            </div>

            <article className="result-card improved-answer-card">
              <h2>Пример улучшенного ответа</h2>
              <p>{getSafeBetterResponse(evaluation)}</p>
            </article>

            <div className="result-actions">
              <Link className="button button-secondary" href={`/train/${dialogue?.scenarioId}?new=1`}>
                Пройти еще раз
              </Link>
              <a className="button button-primary" href="#lead">
                Собрать тренажер под нашу компанию
              </a>
            </div>
          </div>

          <aside className="dialogue-preview">
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
          <p>Оставьте контакт — обсудим сценарии, скрипты, возражения и формат пилота.</p>
        </div>
        <LeadForm source="result" />
      </section>
    </section>
  );
}
