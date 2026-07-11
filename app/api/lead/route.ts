import { mkdir, appendFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import type { LeadPayload } from "@/lib/types";

export const runtime = "nodejs";

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === "on";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatLeadText(lead: LeadPayload) {
  return [
    "Новая заявка с AI-тренажера продаж",
    `Имя: ${lead.name}`,
    `Компания: ${lead.company}`,
    `Контакт: ${lead.contact}`,
    `Комментарий: ${lead.comment || "—"}`,
    `Источник: ${lead.source || "—"}`,
    `Согласие с политикой: ${lead.consentAccepted ? "да" : "нет"}`
  ].join("\n");
}

function formatLeadHtml(lead: LeadPayload) {
  const rows = [
    ["Имя", lead.name],
    ["Компания", lead.company],
    ["Контакт", lead.contact],
    ["Комментарий", lead.comment || "—"],
    ["Источник", lead.source || "—"],
    ["Согласие с политикой", lead.consentAccepted ? "да" : "нет"]
  ];

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin: 0 0 16px;">Новая заявка с AI-тренажера продаж</h2>
      <table cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 640px;">
        ${rows
          .map(
            ([label, value]) => `
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 700; width: 180px;">${escapeHtml(label)}</td>
                <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(value)}</td>
              </tr>`
          )
          .join("")}
      </table>
      <p style="margin-top: 16px; color: #6b7280;">
        Пользователь подтвердил согласие с политикой конфиденциальности и обработки персональных данных:
        <a href="https://nexaire.ru/privacy.html">https://nexaire.ru/privacy.html</a>
      </p>
    </div>
  `;
}

async function sendToTelegram(lead: LeadPayload) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: formatLeadText(lead) })
  });
}

async function sendToEmail(lead: LeadPayload) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;
  const to = process.env.LEAD_EMAIL_TO || "info@nexaire.ru";
  const from = process.env.LEAD_EMAIL_FROM || user;

  if (!host || !user || !pass || !from) {
    console.warn("Email lead notification skipped: SMTP settings are not configured");
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  await transporter.sendMail({
    from,
    to,
    subject: `Новая заявка Nexaire Tech: ${lead.company}`,
    text: formatLeadText(lead),
    html: formatLeadHtml(lead)
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lead: LeadPayload = {
      name: normalize(body?.name),
      company: normalize(body?.company),
      contact: normalize(body?.contact),
      comment: normalize(body?.comment),
      source: normalize(body?.source) || "unknown",
      consentAccepted: normalizeBoolean(body?.consentAccepted)
    };

    if (!lead.name || !lead.company || !lead.contact) {
      return NextResponse.json({ error: "Заполните имя, компанию и контакт" }, { status: 400 });
    }

    if (!lead.consentAccepted) {
      return NextResponse.json(
        { error: "Подтвердите согласие с политикой конфиденциальности и обработкой персональных данных" },
        { status: 400 }
      );
    }

    const dataDir = path.join(process.cwd(), "data");
    await mkdir(dataDir, { recursive: true });
    await appendFile(
      path.join(dataDir, "leads.jsonl"),
      JSON.stringify({ ...lead, createdAt: new Date().toISOString() }) + "\n",
      "utf8"
    );

    try {
      await sendToEmail(lead);
    } catch (emailError) {
      console.error("Email lead notification failed", emailError);
    }

    try {
      await sendToTelegram(lead);
    } catch (telegramError) {
      console.error("Telegram lead notification failed", telegramError);
    }

    console.log("New lead", lead);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("/api/lead error", error);
    return NextResponse.json({ error: "Не удалось отправить заявку" }, { status: 500 });
  }
}
