# Лабораторная работа №6

## Аутентификация во frontend-приложении

Реализованы состояния guest, loading и authenticated, hash router, requireUser и requireAdmin. Навигация зависит от роли; закрытые страницы очищаются при выходе и истечении JWT.

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

Исходное задание: [PDF](ЛР-6.pdf). Отчёт: [DOCX](Лабораторная%20работа%20№6.docx), [PDF](Лабораторная%20работа%20№6.pdf).

## Контрольные вопросы

Гость перенаправляется с profile и orders на login. Обычный user видит страницу 403 при ручном переходе на admin; admin получает соответствующий пункт навигации.

Route guards управляют интерфейсом. Доступ к API независимо проверяется сервером, поэтому скрытая кнопка не заменяет авторизацию.

Auth bootstrap с HttpOnly cookie — отдельная архитектура. В этой работе после reload пользователь становится гостем, поскольку JWT хранится только в памяти.
