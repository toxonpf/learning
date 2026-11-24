# Лабораторная работа №8

## Защита REST API и валидация пользовательских данных

Добавлены express-validator, matchedData, checkExact, req.validated, Helmet, JSON limit 100kb и отдельные лимиты для API и login. Проверяются создание и PATCH товара, id и позиции заказа.

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

Исходное задание: [PDF](ЛР-8.pdf). Отчёт: [DOCX](Лабораторная%20работа%20№8.docx), [PDF](Лабораторная%20работа%20№8.pdf).

## Контрольные вопросы

Сначала выполняются Authentication и Authorization, затем validation и Controller. В Service передаются только проверенные поля из req.validated.

PATCH проверяет только переданные поля, но требует хотя бы одно изменение. checkExact отклоняет неизвестные поля; userId в Order теперь возвращает 400.

Defence in depth объединяет независимые слои: JWT/RBAC/ownership, валидацию, ограничения размера, security headers и rate limiting. Ошибки 400, 413 и 429 обрабатываются явно; внутренний stack клиенту не отправляется.
