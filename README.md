# Nexaire Tech — AI-тренажер продаж

Рабочее web-демо AI-тренажера продаж для направления Nexaire Tech.

Демо показывает продуктовый сценарий:

```text
выбор сферы
→ выбор режима тренировки
→ выбор этапа, если нужен
→ выбор сценария
→ диалог с AI-клиентом
→ оценка результата
→ форма заявки
```

## Что реализовано

- 5 сфер: психология/консультации, недвижимость, онлайн-курсы, автомобили, оборудование/B2B.
- 2 режима: вся сделка или отдельный этап.
- 8 этапов продаж для режима отдельного этапа.
- 5 сценариев возражений.
- AI-клиент через GigaChat, OpenAI или mock-режим.
- Rule-based mock-симулятор без внешнего AI.
- Разные форматы оценки для `single_stage` и `full_funnel`.
- В режиме всей сделки есть оценка по этапам.
- Темная тема по умолчанию и переключатель темы.
- Форма заявки с отправкой уведомлений на email.
- Email-уведомление на `info@nexaire.ru` при SMTP-настройках.

## Основные файлы

```text
app/scenarios/page.tsx          мастер выбора: сфера → режим → этап → сценарий
app/train/[scenarioId]/page.tsx страница тренировки
app/result/page.tsx             страница результата
components/ChatTrainer.tsx      UI и логика чата
components/ResultView.tsx       UI итоговой оценки
components/LeadForm.tsx         форма заявки
lib/industries.ts               сферы бизнеса
lib/salesStages.ts              этапы продаж
lib/scenarios.ts                базовые сценарии возражений
lib/trainingContext.ts          сборка полного контекста тренировки
lib/prompts.ts                  промпты AI-клиента и AI-оценщика
lib/gigachat.ts                 GigaChat OAuth + chat/completions
lib/getMockClientReply.ts       mock-логика ответа клиента
lib/scoreDialog.ts              mock-оценка диалога
app/api/chat/route.ts           API ответа клиента
app/api/evaluate/route.ts       API оценки диалога
app/api/lead/route.ts           API заявки
```

## Локальный запуск

```bash
npm install
cp .env.example .env.local
npm run dev
```

Открыть:

```text
http://localhost:3000
```

## Mock-режим без AI

```env
AI_PROVIDER=mock
USE_MOCK_AI=true
```

## GigaChat

```env
AI_PROVIDER=gigachat
USE_MOCK_AI=false

GIGACHAT_AUTH_KEY=ваш_ключ_авторизации
GIGACHAT_SCOPE=GIGACHAT_API_PERS
GIGACHAT_MODEL=GigaChat
GIGACHAT_AUTH_URL=https://ngw.devices.sberbank.ru:9443/api/v2/oauth
GIGACHAT_BASE_URL=https://gigachat.devices.sberbank.ru/api/v1
```

Для локального теста при ошибке сертификата можно временно добавить:

```env
GIGACHAT_DISABLE_TLS_REJECT=true
```

На production лучше поставить российские доверенные сертификаты и оставить:

```env
GIGACHAT_DISABLE_TLS_REJECT=false
```

## Email-заявки

```env
LEAD_EMAIL_TO=info@nexaire.ru
LEAD_EMAIL_FROM=info@nexaire.ru
SMTP_HOST=mail.hosting.reg.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@nexaire.ru
SMTP_PASS=пароль_от_ящика
```

Заявки также сохраняются локально в:

```text
data/leads.jsonl
```

Файл `data/leads.jsonl` не должен попадать в git.

## Production build

```bash
npm run typecheck
npm run build
npm run start
```

Пошаговое обновление production-стенда, проверки и откат описаны в
[`docs/production-update.md`](docs/production-update.md).

## Что не коммитить

```text
.env
.env.local
.env.*.local
node_modules
.next
data/leads.jsonl
```
