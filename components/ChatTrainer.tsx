"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ChatMessage, ClientState, Scenario, TrainingContext, TrainingPromptContext } from "@/lib/types";
import { getTrainingStorageSuffix, serializeTrainingContext } from "@/lib/trainingContext";

type Props = {
  scenario: Scenario;
  trainingContext: TrainingContext;
  promptContext: TrainingPromptContext;
};

function createMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function modeLabel(context: TrainingPromptContext) {
  return context.mode === "single_stage" ? "Отдельный этап" : "Вся сделка";
}

export default function ChatTrainer({ scenario, trainingContext, promptContext }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldStartNew = searchParams.get("new") === "1";
  const storageSuffix = useMemo(() => getTrainingStorageSuffix(trainingContext), [trainingContext]);
  const storageKey = useMemo(() => `nexaire-trainer-session-${storageSuffix}`, [storageSuffix]);
  const stateStorageKey = useMemo(() => `nexaire-trainer-client-state-${storageSuffix}`, [storageSuffix]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [clientState, setClientState] = useState<ClientState>(scenario.initialState);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const chatWindowRef = useRef<HTMLDivElement | null>(null);
  const queryString = useMemo(() => serializeTrainingContext(trainingContext), [trainingContext]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError("");

      try {
        if (!shouldStartNew) {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const parsed = JSON.parse(saved) as ChatMessage[];
            if (!cancelled && Array.isArray(parsed) && parsed.length > 0) {
              setMessages(parsed);

              const savedState = localStorage.getItem(stateStorageKey);
              if (savedState) {
                try {
                  setClientState(JSON.parse(savedState) as ClientState);
                } catch {
                  setClientState(scenario.initialState);
                }
              } else {
                setClientState(scenario.initialState);
              }

              setLoading(false);
              return;
            }
          }
        } else {
          localStorage.removeItem(storageKey);
          localStorage.removeItem(stateStorageKey);
          localStorage.removeItem("nexaire-trainer-last-dialogue");
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenarioId: scenario.id, trainingContext, messages: [], clientState: scenario.initialState })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Не удалось начать диалог");
        }

        if (!cancelled) {
          setMessages([data.message]);
          setClientState(data.nextState ?? scenario.initialState);
        }
      } catch (initError) {
        if (!cancelled) {
          setError(initError instanceof Error ? initError.message : "Не удалось начать диалог");
          setMessages([
            {
              id: createMessageId(),
              role: "client",
              content: promptContext.openingMessage,
              createdAt: new Date().toISOString()
            }
          ]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [scenario.id, scenario.initialState, promptContext.openingMessage, shouldStartNew, storageKey, stateStorageKey, trainingContext]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey]);

  useEffect(() => {
    localStorage.setItem(stateStorageKey, JSON.stringify(clientState));
  }, [clientState, stateStorageKey]);

  useEffect(() => {
    const chatWindow = chatWindowRef.current;

    if (!chatWindow) return;

    requestAnimationFrame(() => {
      chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: "smooth" });
    });
  }, [messages, loading]);

  async function sendMessage() {
    const cleanInput = input.trim();

    if (!cleanInput || loading) return;

    if (cleanInput.length > 2000) {
      setError("Сообщение слишком длинное. Сократите его до 2000 символов.");
      return;
    }

    const managerMessage: ChatMessage = {
      id: createMessageId(),
      role: "manager",
      content: cleanInput,
      createdAt: new Date().toISOString()
    };

    const nextMessages = [...messages, managerMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: scenario.id, trainingContext, messages: nextMessages, clientState })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "AI-клиент не ответил");
      }

      setMessages((currentMessages) => [...currentMessages, data.message]);
      if (data.nextState) setClientState(data.nextState);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "AI-клиент не ответил");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function finishDialogue() {
    const managerMessagesCount = messages.filter((message) => message.role === "manager").length;

    if (managerMessagesCount < 2) {
      const confirmed = window.confirm("Диалог выглядит слишком коротким. Оценка будет неполной. Завершить сейчас?");
      if (!confirmed) return;
    }

    localStorage.setItem(
      "nexaire-trainer-last-dialogue",
      JSON.stringify({ scenarioId: scenario.id, trainingContext, messages, clientState, finishedAt: new Date().toISOString() })
    );

    router.push(`/result?scenario=${scenario.id}`);
  }

  function restart() {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(stateStorageKey);
    router.push(`/train/${scenario.id}?${queryString}`);
  }

  const managerMessagesCount = messages.filter((message) => message.role === "manager").length;

  return (
    <section className="section trainer-section">
      <aside className="trainer-sidebar">
        <a className="back-link" href="/scenarios">← Настроить тренировку</a>
        <p className="eyebrow">Тренировка</p>
        <h1>{scenario.title}</h1>
        <p>{scenario.description}</p>

        <div className="context-list">
          <span>Сфера: <strong>{promptContext.industry.title}</strong></span>
          <span>Режим: <strong>{modeLabel(promptContext)}</strong></span>
          {promptContext.stage && <span>Этап: <strong>{promptContext.stage.title}</strong></span>}
          <span>Сценарий: <strong>{scenario.title}</strong></span>
        </div>

        <div className="sidebar-block">
          <h2>Цель менеджера</h2>
          <p>{promptContext.managerGoal}</p>
        </div>

        <div className="sidebar-block">
          <h2>Контекст клиента</h2>
          <p>{promptContext.clientContext}</p>
        </div>

        <div className="message-counter">
          Реплик менеджера: <strong>{managerMessagesCount}</strong>
        </div>
      </aside>

      <div className="chat-panel">
        <div className="chat-head">
          <div>
            <p className="eyebrow">Чат с AI-клиентом</p>
            <h2>{promptContext.industry.title} · {modeLabel(promptContext)}</h2>
          </div>
          <button className="button button-secondary" type="button" onClick={restart}>
            Начать заново
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="chat-window" aria-live="polite" ref={chatWindowRef}>
          {messages.map((message) => (
            <div className={`message-row message-row-${message.role}`} key={message.id}>
              <div className="message-meta">{message.role === "manager" ? "Менеджер" : "Клиент"}</div>
              <div className={`message-bubble message-${message.role}`}>{message.content}</div>
            </div>
          ))}
          {loading && <div className="typing">AI-клиент печатает...</div>}
        </div>

        <form className="chat-form" onSubmit={handleSubmit}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите ответ клиенту..."
            rows={3}
            disabled={loading}
          />
          <div className="chat-actions">
            <button className="button button-secondary" type="button" onClick={finishDialogue} disabled={messages.length === 0}>
              Завершить диалог
            </button>
            <button className="button button-primary" type="submit" disabled={!input.trim() || loading}>
              {loading ? "Ждем ответ..." : "Отправить"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
