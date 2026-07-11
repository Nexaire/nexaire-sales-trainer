"use client";

import { FormEvent, useState } from "react";

type Props = {
  source: string;
};

export default function LeadForm({ source }: Props) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [comment, setComment] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    if (!consentAccepted) {
      setStatus("error");
      setError("Подтвердите согласие с политикой конфиденциальности и обработкой персональных данных");
      return;
    }

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, contact, comment, source, consentAccepted })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Не удалось отправить заявку");
      }

      setStatus("success");
      setName("");
      setCompany("");
      setContact("");
      setComment("");
      setConsentAccepted(false);
    } catch (submitError) {
      setStatus("error");
      setError(submitError instanceof Error ? submitError.message : "Не удалось отправить заявку");
    }
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      <label>
        Имя
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Александр" required />
      </label>
      <label>
        Компания
        <input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Название компании" required />
      </label>
      <label>
        Telegram или телефон
        <input value={contact} onChange={(event) => setContact(event.target.value)} placeholder="@username или +7..." required />
      </label>
      <label>
        Комментарий
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Каких менеджеров нужно тренировать?" rows={4} />
      </label>
      <label className="consent-row">
        <input
          checked={consentAccepted}
          onChange={(event) => setConsentAccepted(event.target.checked)}
          required
          type="checkbox"
        />
        <span>
          Оставляя заявку, вы соглашаетесь с{" "}
          <a href="https://nexaire.ru/privacy.html" target="_blank" rel="noreferrer">
            политикой конфиденциальности и обработки персональных данных
          </a>
          .
        </span>
      </label>
      <button className="button button-primary full-width" disabled={status === "loading" || !consentAccepted} type="submit">
        {status === "loading" ? "Отправляем..." : "Обсудить внедрение"}
      </button>
      {status === "success" && (
        <p className="form-success">Спасибо. Мы свяжемся с вами и обсудим, как можно собрать тренажер под ваш отдел продаж.</p>
      )}
      {status === "error" && <p className="form-error">{error}</p>}
    </form>
  );
}
