# Лабораторная работа №5

## Интеграция frontend и backend

Созданы единый apiFetch и состояние аутентификации в памяти. Форма выполняет login через fetch, запросы получают Bearer JWT автоматически. Добавлены профиль, каталог, загрузка заказов и состояния загрузки и ошибок.

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

## Проверка и отчёт

`verification.json` содержит фактические HTTP responses, test output и выполненные сценарии. Все новые проекты проверяются командой `npm run test:new` из корня при заданном `TEST_DATABASE_URL` роли с CREATE DATABASE. Создаются только новые базы с префиксом `nodejs_lab_new_`. Они не удаляются автоматически.

Исходное задание: [PDF](ЛР-5.pdf). Отчёт: [DOCX](Лабораторная%20работа%20№5.docx), [PDF](Лабораторная%20работа%20№5.pdf).

## Контрольные вопросы

APIError хранит HTTP status. При 401 apiFetch очищает состояние и сообщает интерфейсу об истечении сессии. При 403 состояние сохраняется.

Токен живёт только в памяти вкладки. Reload и logout удаляют его. localStorage и sessionStorage не используются.

Frontend отображает результат, а backend проверяет JWT, роль и принадлежность заказов при каждом запросе.
