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
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (status === "loading") return;

    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, contact, comment, source })
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
    } catch (submitError) {
      setStatus("error");
      setError(submitError instanceof Error ? submitError.message : "Не удалось отправить заявку");
    }
  }

  return (
    <form className="lead-form" aria-busy={status === "loading"} onSubmit={handleSubmit}>
      <label>
        Имя
        <input
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Александр"
          required
        />
      </label>
      <label>
        Компания
        <input
          autoComplete="organization"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          placeholder="Название компании"
          required
        />
      </label>
      <label>
        Телефон или Telegram
        <input
          autoComplete="tel"
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          placeholder="+7... или @username"
          required
        />
      </label>
      <label>
        Комментарий — необязательно
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Каких менеджеров нужно тренировать?" rows={4} />
      </label>
      <button className="button button-primary full-width" disabled={status === "loading"} type="submit">
        {status === "loading" ? "Отправляем..." : "Обсудить запуск"}
      </button>
      {status === "success" && (
        <p className="form-success" role="status">
          Спасибо. Заявка отправлена — мы свяжемся с вами, чтобы обсудить запуск тренажёра.
        </p>
      )}
      {status === "error" && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
