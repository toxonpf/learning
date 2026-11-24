# Лабораторная работа №9

Транзакции и целостность данных.

Создание заказа и позиций выполняется в одном Prisma $transaction callback через tx. Сервер получает цену из Product, проверяет пользователя и наличие товара. Успех фиксирует все записи; ошибка второй позиции откатывает уже созданный Order и первую позицию. Валидация запрещает пустой заказ, нулевое количество и повтор productId; ограничения PostgreSQL защищают данные дополнительно.

Исходное задание: [PDF](ЛР-9.pdf). Отчёт: [DOCX](<Лабораторная работа №9.docx>), [PDF](<Лабораторная работа №9.pdf>).

## Запуск

Из корня всего репозитория один раз выполните `npm ci`. Затем из этого каталога:

```bash
cp .env.example .env
# Укажите подключение к своей учебной PostgreSQL в .env.
# Подготовьте схему по инструкции ниже, затем выполните npm start.
```

Сервер: http://localhost:3000. Остановить: Ctrl+C. Можно задать другой `PORT`.

Для новой учебной базы создайте роль и БД из `sql/00_create_database.sql` через административное подключение PostgreSQL. Далее выполняйте SQL от имени владельца базы.

Для последовательной работы используйте ту же `shop_db` и выполняйте только новый SQL-этап. Для отдельного запуска с нуля:

```bash
psql -h localhost -U shop_user -d shop_db -v ON_ERROR_STOP=1 -f sql/01_products.sql
psql -h localhost -U shop_user -d shop_db -v ON_ERROR_STOP=1 -f sql/02_categories.sql
psql -h localhost -U shop_user -d shop_db -v ON_ERROR_STOP=1 -f sql/03_relations.sql
```

SQL 01–03 создают и преобразуют схему последовательно; повторно их применять к уже подготовленной базе не нужно. Изменения проверялись на отдельной временной БД.

Prisma 7: после настройки `.env` выполните:

```bash
npm exec -- prisma db pull --print
# Вывод introspection можно сравнить с prisma/schema.prisma.
# @map/@@map и удобные имена моделей уже настроены в сохранённой схеме.
# Для существующих таблиц SQL 01–03 отметьте baseline один раз:
npm exec -- prisma migrate resolve --applied 20261104000100_baseline
npm run db:deploy
npm run db:generate
npm run db:status
npm start
```

Если история baseline уже зарегистрирована предыдущей работой, `migrate resolve` пропустите. Для полностью пустой БД вместо SQL 01–03 можно сразу выполнить `npm run db:deploy`: baseline создаст таблицы, затем `npm run db:seed` добавит стартовые категории и товары. Пользователи и примеры заказов создаются SQL 03; в разделе аутентификации новых пользователей можно зарегистрировать через API.

```bash
npm run db:seed
npm run db:seed
npm run db:studio
```

Повторный seed не создаёт дубли. Для нового изменения схемы: `npm exec -- prisma migrate dev --name имя_изменения`, затем `npm run db:generate`. В репозитории сохранены отдельные миграции description и slug.

Исходные пять товаров, добавленные SQL 01, сохраняются при переносе категорий в SQL 02. Цены — целые числа в тенге; после нормализации в POST/PATCH передаётся `categoryId`, а не текстовое `category`.

Учебный `x-api-key: college-demo` нужен только для POST товара; он сохранён из лабораторной по middleware. Это отдельная демонстрация, а не JWT-аутентификация.

## Проверка

Запросы для ручного выполнения: `requests.http`. Фактические результаты автоматической проверки: `verification.json`. Проверки запускаются из корня: `npm test` для Express; `TEST_DATABASE_URL="postgresql://.../postgres" npm run test:db` для PostgreSQL. Последняя команда создаёт новые базы с префиксом `nodejs_lab_`, не очищая существующие. Проверка БД требует роли с правом CREATE DATABASE.
