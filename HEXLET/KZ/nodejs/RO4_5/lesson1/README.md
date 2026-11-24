# Лабораторная работа №1

## Основы тестирования серверных приложений

Выделены чистые calculateOrderTotal и canCancelOrder. Написаны node:test и assert/strict проверки позитивных, негативных и граничных сценариев, включая переполнение безопасного целого. Выполнен эксперимент с неверным assertion и восстановлением suite.

## Запуск

Из корня `web/nodejs` выполните `npm ci`. Затем перейдите в каталог этого урока. Каждый этап запускается самостоятельно.

Для тестов не нужны Express server, PostgreSQL, `.env` или Prisma generate:

```powershell
npm test
npm run test:watch
```

Унаследованное API сохранено для дальнейших этапов; оно не импортируется unit tests.

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

Исходное задание: [PDF](ЛР-1.pdf). Отчёт: [DOCX](Лабораторная%20работа%20№1.docx), [PDF](Лабораторная%20работа%20№1.pdf).

## Контрольные вопросы

Arrange готовит данные, Act вызывает функцию, Assert сравнивает фактический результат с ожидаемым. strictEqual проверяет значение и тип; throws подтверждает исключение.

Unit test проверяет небольшую изолированную функцию без HTTP и БД. Integration test проверяет совместную работу HTTP, Service и PostgreSQL. E2E воспроизводит пользовательский сценарий через браузер.

Границы quantity равны 1 и 100. Значения 0, 101 и дробные количества отклоняются. Пустой заказ имеет total 0; отменяется только заказ new.
