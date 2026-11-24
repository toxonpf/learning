# Лабораторная работа №3

## Интеграционное тестирование REST API

Express app отделён от server.js. Jest/Supertest проверяют HTTP status, JSON и реальные изменения PostgreSQL. Перед каждым test данные пересоздаются с учётом внешних ключей; защитная проверка имени БД запрещает очистку development/production.

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

## Проверка и отчёт

`verification.json` содержит фактические HTTP responses, test output и выполненные сценарии. Все новые проекты проверяются командой `npm run test:new` из корня при заданном `TEST_DATABASE_URL` роли с CREATE DATABASE. Создаются только новые базы с префиксом `nodejs_lab_new_`. Они не удаляются автоматически.

Исходное задание: [PDF](ЛР-3.pdf). Отчёт: [DOCX](Лабораторная%20работа%20№3.docx), [PDF](Лабораторная%20работа%20№3.pdf).

## Контрольные вопросы

Supertest вызывает request(app) без отдельного app.listen в app.js. JWT получается через настоящий login после создания тестового пользователя.

Integration suite использует только shop_test или отдельную БД с префиксом nodejs_lab_new_. До очистки проверяются NODE_ENV и имя БД.

Проверены пустая коллекция, чтение ресурса, 400/401/403/404, POST 201, PATCH и DELETE, а также наличие и отсутствие записей после mutations. --runInBand исключает конкурирующую очистку общей test database.
