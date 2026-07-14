# Обновление production-стенда

Эта инструкция описывает обновление Nexaire Sales Trainer из Git-репозитория на Linux-сервере. Проект собирается как Next.js-приложение и запускается командой `npm run start`.

> В репозитории пока нет Docker/Compose-конфигурации, unit-файла systemd или PM2-конфигурации. Поэтому ниже основным считается запуск через уже настроенный systemd-сервис. Если стенд устроен иначе, сначала зафиксируйте фактическую схему запуска и скорректируйте команды перезапуска.

## Параметры стенда

Перед первым использованием инструкции замените примеры на фактические значения production-сервера.

| Параметр | Пример | Что указать |
|---|---|---|
| `APP_DIR` | `/opt/nexaire-sales-trainer` | каталог приложения на сервере |
| `PROD_BRANCH` | `main` | ветка, из которой обновляется production |
| `SERVICE_NAME` | `nexaire-sales-trainer` | имя systemd-сервиса |
| `BASE_URL` | `https://trainer.example.ru` | публичный адрес стенда |

Инструкция предполагает Node.js 20 LTS, npm из поставки Node.js и наличие reverse proxy (обычно Nginx), который уже направляет запросы на порт приложения.

## Краткий порядок действий

1. Проверить релиз локально или в CI.
2. Подключиться к серверу и проверить его состояние.
3. Сохранить commit, конфигурацию и файл заявок.
4. Получить нужный commit из Git.
5. Остановить приложение, установить зависимости и собрать проект.
6. Запустить приложение и выполнить smoke-тесты.
7. При проблеме откатить только код; актуальные заявки не затирать.

## 1. Проверить релиз до обновления production

На локальной машине или в CI выполнить из корня репозитория:

```bash
npm ci
npm run typecheck
npm run build
```

Все три команды должны завершиться успешно. Зафиксировать commit, который требуется развернуть:

```bash
git rev-parse HEAD
```

Не обновлять production из непроверенного рабочего дерева. Целевой commit должен находиться в production-ветке и быть отправлен в `origin`.

## 2. Подключиться к серверу и задать параметры

```bash
ssh <production-user>@<production-host>

export APP_DIR=/opt/nexaire-sales-trainer
export PROD_BRANCH=main
export SERVICE_NAME=nexaire-sales-trainer
export BASE_URL=https://trainer.example.ru

cd "$APP_DIR"
```

Проверить, что выбран правильный каталог:

```bash
pwd
git remote -v
git branch --show-current
```

Ожидаемый Git remote для этого проекта:

```text
https://github.com/Nexaire/nexaire-sales-trainer.git
```

## 3. Выполнить предварительные проверки

```bash
git status --short
node --version
npm --version
df -h "$APP_DIR"
sudo systemctl status "$SERVICE_NAME" --no-pager
```

Условия продолжения:

- `git status --short` ничего не выводит;
- используется поддерживаемая версия Node.js, рекомендуемая версия — 20 LTS;
- на диске достаточно места для `node_modules` и `.next`;
- текущий сервис работает, либо причина его остановки известна.

Если Git показывает изменённые отслеживаемые файлы, обновление остановить. Не выполнять автоматически `git stash`, `git reset --hard` или удаление файлов: сначала выяснить происхождение серверных изменений.

Проверить наличие production-конфигурации, не выводя её секреты в терминал или журнал:

```bash
test -f .env.local && echo ".env.local: OK" || echo ".env.local: MISSING"
test -d data && test -w data && echo "data/: writable" || echo "data/: check required"
```

Если `.env.local` отсутствует или каталог `data` недоступен на запись пользователю приложения, не продолжать обновление до исправления конфигурации или прав.

Для реального AI-провайдера в `.env.local` должны быть настроены соответствующие переменные:

- GigaChat: `AI_PROVIDER=gigachat`, `USE_MOCK_AI=false`, `GIGACHAT_AUTH_KEY`;
- OpenAI: `AI_PROVIDER=openai`, `USE_MOCK_AI=false`, `OPENAI_API_KEY`;
- автономный demo-режим: `AI_PROVIDER=mock`, `USE_MOCK_AI=true`.

На production должно оставаться `GIGACHAT_DISABLE_TLS_REJECT=false`. Если GigaChat требует дополнительный корневой сертификат, настройте `NODE_EXTRA_CA_CERTS` в окружении systemd-сервиса. Не отключайте проверку TLS на production.

## 4. Сделать резервную копию

Сохранить текущий commit и серверные данные перед изменениями:

```bash
STAMP=$(date +%Y%m%d-%H%M%S)
OLD_COMMIT=$(git rev-parse HEAD)
BACKUP_DIR="$HOME/prod-backups/nexaire-sales-trainer-$STAMP"

install -d -m 700 "$BACKUP_DIR"
printf '%s\n' "$OLD_COMMIT" > "$BACKUP_DIR/commit.txt"
cp -p .env.local "$BACKUP_DIR/.env.local"

if [ -f data/leads.jsonl ]; then
  cp -p data/leads.jsonl "$BACKUP_DIR/leads.jsonl"
fi

chmod 600 "$BACKUP_DIR"/*

echo "Previous commit: $OLD_COMMIT"
echo "Backup: $BACKUP_DIR"
```

Каталог резервных копий должен быть доступен только администратору, поскольку `.env.local` содержит секреты, а `leads.jsonl` — персональные данные.

## 5. Получить целевую версию

```bash
git fetch origin --prune
git log --oneline --decorate -5 "origin/$PROD_BRANCH"
git switch "$PROD_BRANCH"
git merge --ff-only "origin/$PROD_BRANCH"
NEW_COMMIT=$(git rev-parse HEAD)
echo "Deploying commit: $NEW_COMMIT"
```

Сверить `NEW_COMMIT` с commit, проверенным на шаге 1. Если значения не совпадают, не продолжать до выяснения причины.

Опция `--ff-only` намеренно запрещает создавать merge commit непосредственно на production-сервере.

## 6. Собрать и перезапустить приложение

Следующие команды создают короткое окно недоступности. Оно начинается с остановки сервиса и заканчивается его запуском.

```bash
sudo systemctl stop "$SERVICE_NAME"

npm ci
npm run typecheck
npm run build

sudo systemctl start "$SERVICE_NAME"
sudo systemctl status "$SERVICE_NAME" --no-pager
```

`npm ci` используется вместо `npm install`, чтобы установить версии строго из `package-lock.json`. Файлы `.env.local` и `data/leads.jsonl` игнорируются Git и не должны удаляться при обновлении.

Если `npm ci`, typecheck или build завершились с ошибкой, не запускать неполную сборку — перейти к разделу «Откат».

### Если приложение управляется PM2

Вместо команд systemd использовать имя процесса из `pm2 list`:

```bash
pm2 stop <PM2_APP_NAME>
npm ci
npm run typecheck
npm run build
pm2 restart <PM2_APP_NAME> --update-env
pm2 status
```

Остальные шаги инструкции не меняются.

## 7. Проверить обновление

Сначала проверить процесс и последние логи:

```bash
sudo systemctl is-active "$SERVICE_NAME"
sudo journalctl -u "$SERVICE_NAME" --since "10 minutes ago" --no-pager
```

Затем проверить публичные страницы:

```bash
curl --fail --silent --show-error --output /dev/null \
  --write-out 'home: %{http_code}\n' "$BASE_URL/"

curl --fail --silent --show-error --output /dev/null \
  --write-out 'scenarios: %{http_code}\n' "$BASE_URL/scenarios"
```

Ожидаемый результат — HTTP `200`. После этого провести ручной smoke-тест в браузере:

1. Открыть главную страницу и перейти к выбору сценария.
2. Выбрать сферу, режим, этап и сценарий.
3. Начать диалог и получить ответ AI-клиента.
4. Завершить тренировку и проверить появление оценки.
5. Проверить светлую и тёмную темы хотя бы на desktop или mobile.
6. Если разрешена тестовая заявка, отправить её с явной пометкой `TEST`, проверить появление строки в `data/leads.jsonl` и доставку настроенного уведомления по email/Telegram.

После проверки ещё раз просмотреть логи на ошибки AI, TLS, SMTP и Telegram:

```bash
sudo journalctl -u "$SERVICE_NAME" --since "10 minutes ago" --no-pager
```

Обновление считается успешным, если сервис активен, обе страницы отвечают `200`, полный сценарий тренировки работает, а в логах нет новых повторяющихся ошибок.

## 8. Откат

Откат нужен, если сервис не запускается, smoke-тест не проходит или после релиза возникла критичная ошибка.

На том же сервере, из `APP_DIR`, выполнить:

```bash
cd "$APP_DIR"
sudo systemctl stop "$SERVICE_NAME"

git switch --detach "$OLD_COMMIT"
npm ci
npm run typecheck
npm run build

sudo systemctl start "$SERVICE_NAME"
sudo systemctl status "$SERVICE_NAME" --no-pager
```

Если SSH-сессия была закрыта и переменная `OLD_COMMIT` потеряна, взять значение из созданной резервной копии:

```bash
ls -1dt "$HOME"/prod-backups/nexaire-sales-trainer-*
BACKUP_DIR=<путь-к-нужной-резервной-копии>
OLD_COMMIT=$(cat "$BACKUP_DIR/commit.txt")
echo "$OLD_COMMIT"
```

После отката повторить проверки из шага 7.

Важно:

- не восстанавливать старый `leads.jsonl` поверх текущего файла — это удалит заявки, поступившие после резервного копирования;
- `.env.local` восстанавливать из копии только если конфигурация действительно менялась или была повреждена;
- detached HEAD после аварийного отката допустим временно; при следующем согласованном релизе вернуться на `PROD_BRANCH` командами из шага 5;
- записать неуспешный `NEW_COMMIT`, время инцидента и основную ошибку из журналов.

## 9. Зафиксировать результат обновления

В журнале релизов или задаче указать:

- дату и время обновления;
- адрес стенда;
- предыдущий и новый commit;
- кто выполнил обновление;
- результаты typecheck, build и smoke-теста;
- выполнялся ли тест заявки;
- были ли ошибки или откат.

Пример короткой записи:

```text
2026-07-14 18:30 MSK
Production: https://trainer.example.ru
Old commit: <OLD_COMMIT>
New commit: <NEW_COMMIT>
typecheck/build: OK
Smoke test: home, scenarios, chat, evaluation — OK
Lead test: not performed
Rollback: no
```
