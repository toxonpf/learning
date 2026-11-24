# Лабораторная работа №2

## Модульное тестирование с использованием Jest

Настроен Jest ESM. Product Service принимает repository через dependency injection. Tests используют beforeEach, jest.fn, async assertions, test.each и проверки аргументов и числа вызовов. Реализованы positive и negative tests для delete.

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

Исходное задание: [PDF](ЛР-2.pdf). Отчёт: [DOCX](Лабораторная%20работа%20№2.docx), [PDF](Лабораторная%20работа%20№2.pdf).

## Контрольные вопросы

Dependency injection передаёт зависимость через аргумент. Unit test использует mock repository, поэтому PostgreSQL и Prisma Client для npm test не требуются.

beforeEach создаёт новые объекты и mocks для каждого test; clearMocks очищает историю вызовов. mockResolvedValueOnce задаёт последовательные ответы.

not.toHaveBeenCalled подтверждает, что недопустимая цена или отсутствующий товар не приводят к записи или удалению в repository.
