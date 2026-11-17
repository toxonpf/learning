# Лабораторная работа №6

## Автоматизация тестирования Node.js REST API с использованием CI

Подготовлен GitHub Actions workflow для push и pull request в main. Pipeline использует Node.js 22, npm ci, временную PostgreSQL shop_test, Prisma generate/migrate deploy и Jest/Supertest. Локально на Node.js 22 выполнен цикл success/failure/success.

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

## Production

Скопируйте `.env.production.example` в `.env.production`, замените placeholders и выполните `npm run start:prod:local`. `GET /health/live` проверяет HTTP process, `GET /health/ready` — PostgreSQL через SELECT 1.

`TRUST_PROXY_HOPS=0` по умолчанию. Значение 1 включайте только за одним доверенным reverse proxy, при закрытом прямом доступе. SIGINT/SIGTERM закрывают HTTP server и Prisma. В Windows проверка обоих обработчиков выполнена через `process.emit` в дочернем процессе; факт указан в журнале.

## GitHub Actions

Рабочий workflow: `.github/workflows/nodejs-shop-ci.yml` в корне Git-репозитория `learning`; копия — `.github/workflows/ci.yml` этого урока. Рабочий каталог в YAML учитывает структуру монорепозитория. Сначала выполняется `npm ci` в `web/nodejs`, затем Prisma и tests в этом уроке.

Локальный цикл failure/success выполнен на Node.js 22.23.5. Hosted runs и их скриншоты появляются после commit/push; локальный журнал не выдаётся за результат GitHub Actions.

## Проверка и отчёт

`verification.json` содержит фактические HTTP responses, test output и выполненные сценарии. Все новые проекты проверяются командой `npm run test:new` из корня при заданном `TEST_DATABASE_URL` роли с CREATE DATABASE. Создаются только новые базы с префиксом `nodejs_lab_new_`. Они не удаляются автоматически.

Исходное задание: [PDF](ЛР-6.pdf). Отчёт: [DOCX](Лабораторная%20работа%20№6.docx), [PDF](Лабораторная%20работа%20№6.pdf).

## Контрольные вопросы

Continuous Integration автоматически проверяет изменения одним воспроизводимым pipeline. Workflow запускается при push в main и pull request в main.

GitHub runner — выделенное окружение выполнения job. PostgreSQL service предоставляет временную test database со своей health check.

npm ci устанавливает версии из package-lock.json и завершается ошибкой при расхождении lock и manifest. Lock фиксирует дерево зависимостей для повторяемости.

prisma generate создаёт Client из schema; migrate deploy подготавливает схему test database. Production database в CI не используется.

Failure означает ненулевой exit code одного из шагов. Причину ищут в первом failed step и его logs. Учебный assertion ожидал 25001 вместо фактического 25000; после исправления suite снова прошёл.

Каждый следующий push автоматически запускает workflow заново. Файл pipeline расположен также в .github/workflows/nodejs-shop-ci.yml корня Git-репозитория; копия сохранена внутри урока.

Локальная проверка Node.js 22 записана в verification.json. Hosted workflow запускается после отправки подготовленных изменений в GitHub; его success/failure screenshots относятся к результатам этого запуска.
