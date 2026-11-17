# Лабораторные работы Node.js

Задания из корня выполнены в 33 отдельных проектах. Работы сгруппированы по разделам из [репозитория преподавателя](https://github.com/ShViktor72/education2026/tree/main/%D0%A0_%D0%9F_%D0%9E/%D0%9F%D0%9C4_nodejs). Уроки находятся непосредственно в папках разделов: `RO4_N/lessonN`. PDF-задание, исходники и отчёты каждого урока лежат вместе.

| Раздел | Содержание | Уроки |
|---|---|---|
| RO4_1 | Ранее выполненные основы Node.js; прежние отчёты сохранены рядом с кодом | [RO4_1](RO4_1) |
| RO4_2 | Express.js, Router, middleware, REST API, frontend | [RO4_2](RO4_2) |
| RO4_3 | PostgreSQL, SQL, связи, Prisma, миграции, транзакции | [RO4_3](RO4_3) |
| RO4_4 | Регистрация, JWT, RBAC, frontend, CORS, валидация и изображения | [RO4_4](RO4_4/README.md) |
| RO4_5 | Unit/Jest/Supertest, диагностика, production и CI | [RO4_5](RO4_5/README.md) |

Результаты сверки заданий, найденные исправления и проверка шаблона отчётов: [AUDIT.md](AUDIT.md).

Имена `ЛР-N.pdf`, `ЛР-N (1).pdf` и `ЛР-N (2).pdf` из прежнего корня соответствуют разделам RO4_2, RO4_3 и RO4_4. Теперь каждое задание называется `ЛР-N.pdf` внутри соответствующего `lessonN`. [Конспект Express](RO4_2/Конспект_Express.js.md) также находится в RO4_2.

Каждый новый `lessonN` содержит исходное PDF-задание, исходники, `package.json`, инструкции запуска, `requests.http`, журнал фактической проверки `verification.json` и отчёт `Лабораторная работа №N` в DOCX и PDF. Титульный лист оформлен по прежним работам: ТОО «Колледж Хекслет», Дубинин Кирилл. Код показан листингами, результаты — реальными HTTP-ответами; для браузерных работ добавлены скриншоты Chromium.

## Новые работы — 16 ноября 2026

Добавлены 12 проектов по новым PDF: [RO4_4, работы 4–9](RO4_4/README.md) и [RO4_5, работы 1–6](RO4_5/README.md). В каждом уроке сохранены исходное задание, код, README, requests.http, verification.json и отчёт DOCX/PDF по прежнему шаблону. Исходные файлы в корне также сохранены.

Новые этапы изменяют политику доступа: каталог читается публично, а POST/PATCH/DELETE требуют JWT роли admin. Заказы принадлежат пользователю из JWT. В RO4_4/8 и далее неизвестный userId в теле заказа отклоняется валидацией.

Unit-тесты RO4_5/1–2 запускаются без PostgreSQL: `npm test` в каталоге урока. Интеграционные этапы RO4_5/3–6 требуют отдельную test database; инструкции находятся в их README. Публичная регистрация не назначает admin.

```powershell
# Из корня web/nodejs, роль должна иметь CREATE DATABASE
$env:TEST_DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/postgres"
npm run test:new
node scripts/check-new-browser.js
```

Новая проверка создаёт только отдельные БД с префиксом nodejs_lab_new_. В журналах сохранены HTTP-сценарии, результаты Jest/Supertest и браузерных проверок. Проверки production и CI дополнительно выполнены локально на Node.js 22.23.5. Workflow размещён в `.github/workflows/nodejs-shop-ci.yml` корня Git-репозитория; копия включена в RO4_5/lesson6. Hosted runs выполняются после отправки изменений в GitHub.

Для сборки новых отчётов предусмотрен `scripts/build-new-reports.py`, для рендеринга — `scripts/render-new-reports.py`. Они используют `scripts/new-lab-metadata.json` и сохранённый DOCX-шаблон, не пересобирая прежние отчёты. Нужны Python с Pillow/Pygments/pypdf и LibreOffice; путь конвертера передаётся через `--libreoffice`. Оформление и геометрия страниц сохранены; новый текст и результаты относятся к конкретному уроку.

## Запуск

Нужны современный Node.js с npm и PostgreSQL для RO4_3/RO4_4. Prisma используется в версии 7, с PostgreSQL adapter и запуском через tsx.

```bash
npm ci
cd RO4_2/lesson9
npm start
```

Откройте http://localhost:3000. Другие работы запускаются так же из собственного каталога. Каждый этап — самостоятельная копия проекта; следующий этап не изменяет предыдущий. Для переноса отдельной работы достаточно её каталога и `npm install` в новом месте.

Для PostgreSQL скопируйте `.env.example` в `.env`, задайте своё подключение и следуйте README выбранного проекта. В `sql` сохранены команды создания учебной базы, таблиц, безопасного переноса категорий и связей. Prisma-проекты содержат baseline и дальнейшие миграции. Для уже существующей схемы baseline отмечается применённой, данные не удаляются.

POST товара начиная с работы по middleware использует учебный заголовок `x-api-key: college-demo`. В RO4_3 после нормализации вместо текстового `category` передаётся `categoryId`. В RO4_4 работа №3 требует отдельный случайный `JWT_SECRET` в `.env`.

## Проверка

```bash
npm run check
npm test
TEST_DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/postgres" npm run test:db
```

`npm test` выполняет 17 проверок: восемь прежних работ по основам Node.js и девять Express-этапов. Файловые проверки работают с временными копиями, HTTP-проверки используют локальные порты. `test:db` выполняет 13 проверок: двенадцать этапов PostgreSQL/Prisma/аутентификации и развёртывание пустой базы из миграций с повторным seed. Команда создаёт только новые БД с префиксом `nodejs_lab_`; нужна роль с правом CREATE DATABASE. Созданные тестовые БД сохраняются для просмотра. Если `TEST_DATABASE_URL` не задан, тесты БД явно пропускаются.

Сценарии включают полный CRUD, совместные фильтры, ошибки валидации, внешние и уникальные ключи, CHECK, чтение связанных данных, повторный seed, COMMIT/ROLLBACK, регистрацию, Argon2id и JWT. Проверка выполнена на Node.js v26.12.1 и PostgreSQL 18.6: 17/17 общих тестов и 13/13 PostgreSQL-тестов прошли. Браузерный CRUD, три формы login и Prisma Studio также проверены в Chromium. Полные результаты каждой новой работы находятся в её `verification.json`.

Скрипт `scripts/check-browser.js` повторяет браузерную проверку после тестов с `SAVE_LAB_EVIDENCE=1`; нужен Chromium и сохранённые тестовые `.env`. Для повторной сборки отчётов: `python scripts/build-reports.py` (Python, Pillow, Pygments, pdftotext и LibreOffice). Листинги оформлены в стиле снимков редактора: тема One Dark, цветная подсветка синтаксиса и номера строк.

## Работы

### RO4_2

- [1. Создание первого серверного приложения на Express.js](RO4_2/lesson1/README.md)
- [2. Маршрутизация и HTTP-методы в Express.js](RO4_2/lesson2/README.md)
- [3. Параметры маршрутов, query-параметры и тело запроса](RO4_2/lesson3/README.md)
- [4. Разделение маршрутов с помощью Express Router](RO4_2/lesson4/README.md)
- [5. Создание и использование middleware в Express.js](RO4_2/lesson5/README.md)
- [6. Разделение приложения на routes, controllers и services](RO4_2/lesson6/README.md)
- [7. Разработка REST API и CRUD-операций](RO4_2/lesson7/README.md)
- [8. Валидация входных данных и обработка ошибок](RO4_2/lesson8/README.md)
- [9. Интеграция REST API с клиентским приложением](RO4_2/lesson9/README.md)

### RO4_3

- [1. Подключение Internet Shop API к PostgreSQL](RO4_3/lesson1/README.md)
- [2. Полный CRUD Product API с PostgreSQL](RO4_3/lesson2/README.md)
- [3. Проектирование базы данных Internet Shop](RO4_3/lesson3/README.md)
- [4. Связи между таблицами Internet Shop](RO4_3/lesson4/README.md)
- [5. Подключение Prisma ORM к существующей базе shop_db](RO4_3/lesson5/README.md)
- [6. CRUD-операции с использованием Prisma](RO4_3/lesson6/README.md)
- [7. Связанные данные и запросы в Prisma](RO4_3/lesson7/README.md)
- [8. Миграции и начальное заполнение базы данных](RO4_3/lesson8/README.md)
- [9. Транзакции и целостность данных](RO4_3/lesson9/README.md)

### RO4_4

- [1. Аутентификация пользователей](RO4_4/lesson1/README.md)
- [2. Хеширование и безопасное хранение паролей](RO4_4/lesson2/README.md)
- [3. JWT-аутентификация](RO4_4/lesson3/README.md)

### Дополнение RO4_4

- [4. Авторизация и разграничение доступа](RO4_4/lesson4/README.md)
- [5. Интеграция frontend и backend](RO4_4/lesson5/README.md)
- [6. Аутентификация во frontend-приложении](RO4_4/lesson6/README.md)
- [7. CORS и безопасность HTTP-взаимодействия](RO4_4/lesson7/README.md)
- [8. Защита REST API и валидация пользовательских данных](RO4_4/lesson8/README.md)
- [9. Загрузка файлов и защита пользовательского контента](RO4_4/lesson9/README.md)

### RO4_5

- [1. Основы тестирования серверных приложений](RO4_5/lesson1/README.md)
- [2. Модульное тестирование с использованием Jest](RO4_5/lesson2/README.md)
- [3. Интеграционное тестирование REST API](RO4_5/lesson3/README.md)
- [4. Отладка и логирование Node.js-приложений](RO4_5/lesson4/README.md)
- [5. Подготовка приложения к Production-окружению](RO4_5/lesson5/README.md)
- [6. Автоматизация тестирования Node.js REST API с использованием CI](RO4_5/lesson6/README.md)
