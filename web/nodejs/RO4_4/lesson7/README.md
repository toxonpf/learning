# Лабораторная работа №7

## CORS и безопасность HTTP-взаимодействия

Frontend запускается на localhost:5500, backend — на localhost:3000. Настроены explicit CORS origin, разрешённые методы и заголовки, preflight OPTIONS и учебная HttpOnly cookie с credentials.

## Запуск

Из корня `web/nodejs` выполните `npm ci`. Затем перейдите в каталог этого урока. Каждый этап запускается самостоятельно.

Для запуска API нужен Node.js 22.12+ и PostgreSQL. Создайте отдельную учебную БД, скопируйте `.env.example` в `.env` и задайте `DATABASE_URL` и случайный `JWT_SECRET` длиной не менее 32 байт.

```powershell
Copy-Item .env.example .env
npm run db:generate
npm run db:deploy
npm run db:seed
npm start
```

Откройте http://localhost:3000. Схема разворачивается из миграций на пустой базе. Seed идемпотентно добавляет категории и товары. Реальные `.env` и загруженные файлы исключены из Git.

Регистрация: `POST /api/auth/register`; login: `POST /api/auth/login`. Администратор назначается доверенной SQL-командой, затем выполняет новый login:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

Чтение каталога публично. POST/PATCH/DELETE каталога требуют `Authorization: Bearer <admin token>`. Заказы создаются от имени пользователя из JWT. Маршруты `/api/orders/my` и `/api/orders/my/:id` возвращают только свои заказы.

Frontend для CORS запускается отдельно:

```powershell
node scripts/serve-frontend.js 5500
```

Откройте http://localhost:5500. Разрешённый origin задаётся в `FRONTEND_ORIGIN`, а в production-этапах — в `CORS_ORIGIN`. Cookie endpoint `/api/demo-cookie` служит только учебному эксперименту и не аутентифицирует пользователя.

## Проверка и отчёт

`verification.json` содержит фактические HTTP responses, test output и выполненные сценарии. Все новые проекты проверяются командой `npm run test:new` из корня при заданном `TEST_DATABASE_URL` роли с CREATE DATABASE. Создаются только новые базы с префиксом `nodejs_lab_new_`. Они не удаляются автоматически.

Исходное задание: [PDF](ЛР-7.pdf). Отчёт: [DOCX](Лабораторная%20работа%20№7.docx), [PDF](Лабораторная%20работа%20№7.pdf).

## Контрольные вопросы

Origin состоит из схемы, хоста и порта. Поэтому localhost:5500 и localhost:3000 имеют разные origins. Chromium блокирует чтение ответа без подходящего Access-Control-Allow-Origin.

JSON и Authorization вызывают OPTIONS preflight. Запрос содержит Origin, Access-Control-Request-Method и Access-Control-Request-Headers; ответ разрешает методы и заголовки.

credentials: include позволяет браузеру работать с cookie при cross-origin fetch. HttpOnly скрывает cookie от document.cookie. При credentialed CORS используется конкретный origin вместо wildcard.

CORS ограничивает браузерное чтение ответа и не заменяет Authentication/Authorization. Cookie автоматически прикладывается браузером, поэтому для cookie-аутентификации нужны меры против CSRF: SameSite, проверка Origin, CSRF token, HTTPS/Secure. Изменения выполняются через POST/PATCH/DELETE.
