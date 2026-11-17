# Лабораторная работа №4

## Отладка и логирование Node.js-приложений

Подключён Pino, request ID, child logger, время обработки и безопасные error responses. Отдельный диагностический сценарий воспроизводит неверный тип Prisma id и использует Node Inspector для проверки локальных переменных на breakpoint.

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

## Интеграционные тесты

Создайте отдельную БД `shop_test`; используйте отдельную роль с правами только на неё. Скопируйте `.env.test.example` в `.env.test`, задайте test URL и случайный секрет. До первого удаления данных suite проверяет test environment и имя БД.

```powershell
Copy-Item .env.test.example .env.test
# DATABASE_URL должен указывать на shop_test
$env:DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/shop_test"
npm run db:generate
npm run db:deploy
npm test
```

Для unit tests отдельно: `npm run test:unit`. Jest/Supertest выполняются последовательно через `--runInBand`, перед каждым HTTP test данные пересоздаются. Не указывайте development или production database.

## Диагностика

`npm run debug` включает Inspector; `npm run debug:break` останавливается до начала исполнения. `LOG_LEVEL=debug` включает подробные сообщения; штатный уровень — info. В production Pino выводит JSON, в development используется pino-pretty. Request ID возвращается в `X-Request-Id`, секреты скрываются.

Диагностический exercise: `node --inspect scripts/diagnose.js`. Он воспроизводит неверный тип id на отдельном диагностическом app, ставит breakpoint, проверяет локальные переменные и сравнивает 500 с исправленным 200. Реальный вывод сохранён в `diagnostics.json`.

## Проверка и отчёт

`verification.json` содержит фактические HTTP responses, test output и выполненные сценарии. Все новые проекты проверяются командой `npm run test:new` из корня при заданном `TEST_DATABASE_URL` роли с CREATE DATABASE. Создаются только новые базы с префиксом `nodejs_lab_new_`. Они не удаляются автоматически.

Исходное задание: [PDF](ЛР-4.pdf). Отчёт: [DOCX](Лабораторная%20работа%20№4.docx), [PDF](Лабораторная%20работа%20№4.pdf).

## Контрольные вопросы

Debugging позволяет остановиться на breakpoint и исследовать переменные. Logging сохраняет context событий. Testing автоматически обнаруживает регрессию при повторных изменениях.

Inspector показал: id является number, а queryId после String(id) — string. Prisma отклоняет неверный тип; исправленный Service передаёт число. GET по id закреплён integration test.

Stack trace читается от места ошибки до первой относящейся к проекту строки. Request ID связывает HTTP response с логами start/completed/error. Пароли и токены скрываются redaction.

--inspect открывает Inspector и продолжает исполнение. --inspect-brk дополнительно останавливается до начала выполнения. Диагностический debugger находится в отдельном exercise script, а не в production Controller.
