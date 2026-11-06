# Express.js и PostgreSQL: конспект по десяти урокам

Материал составлен по десяти презентациям в корне этой папки. Примеры используют ES Modules и учебный ресурс `products`. Код каждого урока опирается на понятия из предыдущих; повторные определения опущены.

## Урок 1. Введение в Express.js и первый сервер

### Зачем нужен Express

Node.js выполняет JavaScript вне браузера. Его встроенный модуль `http` уже умеет принимать HTTP-запросы, но разработчику приходится самостоятельно разбирать адрес и метод запроса, выбирать обработчик и формировать ответ. Express добавляет маршрутизацию, удобные объекты запроса и ответа, а также промежуточные обработчики — middleware. Express работает внутри процесса Node.js и сам по себе не задаёт бизнес-логику или структуру базы данных.

Обычный путь данных: браузер или другое клиентское приложение отправляет HTTP-запрос → Express выбирает обработчик → сервер выполняет операцию → отправляет HTTP-статус и данные, обычно JSON.

### Подготовка проекта

```bash
mkdir express-intro
cd express-intro
npm init -y
npm install express
```

- `npm init -y` создаёт `package.json` с ответами по умолчанию. Без `-y` npm задаёт вопросы в терминале.
- `npm install express` добавляет пакет в `dependencies`, создаёт `node_modules` и `package-lock.json`. Последний фиксирует дерево версий зависимостей; обычно его не редактируют вручную.
- В `package.json` добавьте `"type": "module"`, если используете `import` и `export` в файлах `.js`. Без этого поля `.js` по умолчанию рассматриваются как CommonJS, где обычно применяют `require()`.

`package.json` также содержит `name`, `version` и `scripts`. Поле `main` указывает точку входа *пакета*, но команда `node app.js` запускает указанный файл независимо от `main`.

### Минимальное приложение

```js
import express from 'express';

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello Express!');
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
```

Запуск: `node app.js`. После запуска сервер ждёт запросы, поэтому процесс не завершается сам. Остановить его можно сочетанием `Ctrl+C`. Адрес `http://localhost:3000/api/status` вернёт JSON.

### Методы и объекты

| Вызов | Аргументы | Если не передать |
|---|---|---|
| `express()` | Для обычного создания приложения аргументы не нужны. | Создаёт объект `app` без дополнительной настройки. |
| `app.listen(port, callback)` | `port` — TCP-порт; `callback` — функция запуска сервера. | `callback` необязателен. Если не указать `port`, Node.js может выбрать свободный порт автоматически, но для учебного сервера лучше задавать его явно. В Express 5 callback также может получить ошибку запуска аргументом. |
| `app.get(path, handler)` | `path` — путь, например `/`; `handler(req, res)` — обработчик GET-запроса. | Оба аргумента нужны для полезного маршрута; без обработчика запрос не получит ответа от этого маршрута. |
| `res.send(value)` | `value` — отправляемые данные; для простого текста передайте строку. | Вызов без значения завершает ответ без содержимого. |
| `res.json(value)` | `value` — значение для JSON-ответа, обычно объект или массив. | Без значения клиент не получит полезных JSON-данных. |
| `res.status(code)` | `code` — числовой HTTP-статус. Метод только устанавливает статус; ответ отправляет следующий вызов, например `.json(...)`. | Если не вызвать `status`, успешный ответ обычно имеет код `200`. |

`req` содержит данные входящего запроса. Через `res` задают статус и отправляют ответ. Например, `res.status(201).json(product)` сначала задаёт код `201`, затем отправляет JSON. `res.send()` и `res.json()` завершают ответ: после этого не отправляйте второй ответ из того же обработчика.

## Урок 2. Маршрутизация и HTTP-методы

**Маршрут** связывает HTTP-метод и путь с функцией-обработчиком. Пара `GET /api/products` и `POST /api/products` — два разных endpoint, хотя путь совпадает. Express ищет подходящий маршрут среди зарегистрированных. Строка запроса после `?` не входит в путь: `/api/products?category=books` соответствует маршруту `/api/products`.

Общий вид: `app.METHOD(path, handler)`. Вместо `METHOD` используют `get`, `post`, `put`, `patch` или `delete`. Все эти методы принимают путь и функцию-обработчик; функция получает `req` и `res`. Обработчик можно определить отдельно: `app.get('/api/products', getProducts)`. Если путь или обработчик не указаны, ожидаемый endpoint не получится.

| Метод | Обычный смысл | Пример |
|---|---|---|
| `GET` | Прочитать данные, не изменяя их. | Получить список товаров. |
| `POST` | Создать ресурс или выполнить действие. | Добавить товар. |
| `PUT` | Заменить представление ресурса целиком. | Передать все поля обновлённого товара. |
| `PATCH` | Частично изменить ресурс. | Передать только новую цену. |
| `DELETE` | Удалить ресурс. | Удалить товар по ID. |

Ресурсный API называет в пути объект, а действие задаёт HTTP-метод: `POST /api/products` понятнее, чем `POST /api/createProduct`. Для одного товара обычно используют путь `/api/products/:id` — параметр `:id` рассматривается в следующем уроке. Примеры из ранней презентации с `PUT /api/products` и `DELETE /api/products` лишь показывают синтаксис методов; в полноценном CRUD API нужен ID конкретного товара.

```js
app.get('/api/products', getProducts);
app.post('/api/products', createProduct);
app.put('/api/products/:id', replaceProduct);
app.patch('/api/products/:id', updateProduct);
app.delete('/api/products/:id', deleteProduct);
```

HTTP-статус описывает результат операции: `200` — успешный ответ с данными, `201` — ресурс создан, `204` — успех без тела, `400` — некорректный запрос, `404` — ресурс не найден, `500` — внутренняя ошибка. Для проверки GET достаточно открыть URL в браузере; для POST, PUT, PATCH и DELETE удобнее HTTP-клиент, где можно задать метод, заголовки и тело.

## Урок 3. Данные запроса: `params`, `query` и `body`

Клиент передаёт данные тремя основными способами:

| Источник | Где находится | Для чего используют | Пример доступа |
|---|---|---|---|
| `req.params` | Динамические сегменты пути | Выбрать конкретный ресурс | `req.params.id` для `/products/:id` |
| `req.query` | После `?` в URL | Фильтр, поиск, сортировка, пагинация | `req.query.category` |
| `req.body` | Тело запроса | Создать или изменить данные | `req.body.price` |

### Параметры маршрута

```js
app.get('/api/products/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  const product = products.find(item => item.id === id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
});
```

В пути `/api/products/:id` двоеточие обозначает имя параметра. Для `/api/products/15` значение `req.params.id` равно строке `'15'`. Если сегмент `/15` отсутствует, маршрут `/:id` не совпадёт. Несколько параметров работают так же: `/categories/:categoryId/products/:productId`. `Number(value)` преобразует строку в число; при невозможности преобразования возвращает `NaN`, поэтому результат надо проверить. Если вызвать `Number()` без аргумента, результат будет `0` — это не валидный ID для нашего примера. `products.find(predicate)` возвращает первый подходящий элемент или `undefined`; без функции-предиката вызов некорректен. `return` после ответа об ошибке прекращает выполнение обработчика и защищает от попытки отправить второй ответ.

### Query-параметры

`GET /api/products?category=laptops&inStock=true` передаёт два параметра, разделённых `&`. Если параметр не передан, соответствующее свойство `req.query` имеет значение `undefined`. Простые значения из URL приходят как строки: `'true'` не равно логическому `true`, а `'10000'` ещё не число.

```js
app.get('/api/products', (req, res) => {
  const { category } = req.query;
  const result = category
    ? products.filter(product => product.category === category)
    : products;
  res.json(result);
});
```

`array.filter(predicate)` создаёт новый массив из элементов, для которых функция возвращает истинное значение. Без предиката вызов некорректен. Если `category` не передан, пример возвращает все товары. Параметры `minPrice`, `maxPrice`, `page` и `limit` нужно преобразовать в числа и проверить до применения; иначе `NaN` и некорректные диапазоны дадут неожиданный результат.

### JSON-тело

```js
app.use(express.json()); // До маршрутов, которым нужен req.body

app.post('/api/products', (req, res) => {
  const { name, price } = req.body ?? {};
  // После проверки данных создать товар и отправить 201.
});
```

`express.json()` возвращает middleware, которое разбирает запросы с JSON-телом и помещает результат в `req.body`. При обычном использовании аргументы ему не нужны; настройки можно передать объектом опций. Без этого middleware, при неподходящем `Content-Type` или без тела `req.body` может быть `undefined`. Синтаксически неверный JSON приводит к ошибке разбора. Сам разбор **не проверяет** обязательные поля и правила товара: валидация появится в уроке 8. Для JSON клиент должен отправить заголовок `Content-Type: application/json`.

Один запрос может использовать все источники сразу: `PATCH /api/products/15?notify=true` с телом `{ "price": 79990 }` даёт ID из `params`, флаг из `query` и новую цену из `body`.

## Урок 4. Express Router и файлы маршрутов

Когда маршрутов становится много, их удобно группировать по ресурсу. `express.Router()` создаёт маршрутизатор внутри того же приложения. Он не открывает отдельный порт. Методы `router.get/post/put/patch/delete` принимают те же аргументы, что и соответствующие методы `app`.

```js
// routes/productRoutes.js
import express from 'express';

const router = express.Router();
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
export default router;
```

```js
// app.js
import productRoutes from './routes/productRoutes.js';

app.use(express.json());
app.use('/api/products', productRoutes);
```

`app.use(path, router)` монтирует маршрутизатор на URL-префикс. Внутренний `/` теперь соответствует `/api/products`, а `/:id` — `/api/products/:id`. Для других ресурсов создают, например, `categoryRoutes.js` и `orderRoutes.js`.

`app.use()` также подключает middleware. В форме `app.use(middleware)` путь не указан, поэтому функция применяется ко всем подходящим запросам после места регистрации. В форме `app.use('/api/products', middleware)` она применяется к этому префиксу. Если не передать ни Router, ни middleware, подключать нечего. В ES Modules относительный импорт файла `.js` пишут с расширением: `./routes/productRoutes.js`.

## Урок 5. Middleware и порядок обработки

Middleware — функция с параметрами `(req, res, next)`, которая выполняется между получением запроса и окончательным ответом. Она может прочитать или дополнить `req`, отправить ответ либо передать управление дальше вызовом `next()`. Порядок регистрации определяет порядок выполнения.

```js
function logger(req, res, next) {
  console.log(new Date().toISOString(), req.method, req.originalUrl);
  next();
}

app.use(logger);
app.use(express.json());
app.use('/api/products', productRoutes);
```

`req.method` — HTTP-метод, `req.originalUrl` — исходный URL. `next()` без аргумента переходит к следующему подходящему обработчику. Если middleware не вызовет `next()` и не отправит ответ, клиент будет ждать. Если ответ уже отправлен, вызывать `next()` для обычной цепочки обычно не нужно. `next(error)` переключает обработку на middleware ошибок; подробно это разобрано в уроке 8.

Middleware подключают на разных уровнях:

| Запись | Область действия |
|---|---|
| `app.use(logger)` | Запросы приложения после места регистрации. |
| `app.use('/api/products', logger)` | Запросы с указанным префиксом. |
| `router.use(logger)` | Маршруты этого Router. |
| `router.post('/', checkApiKey, createProduct)` | Только один маршрут; `checkApiKey` выполняется перед контроллером. |

Встроенные middleware:

| Вызов | Что делает | Аргументы и отсутствие аргументов |
|---|---|---|
| `express.json()` | Разбирает JSON-тело в `req.body`. | Опции необязательны; без них действуют значения по умолчанию. |
| `express.urlencoded({ extended: true })` | Разбирает поля HTML-формы `application/x-www-form-urlencoded` в `req.body`. | Объект опций необязателен; `extended` выбирает способ разбора вложенных значений. Для обычного JSON API используют `express.json()`. |
| `express.text()` | Разбирает текстовое тело в строку. | Опции необязательны. |
| `express.raw()` | Оставляет подходящее тело как `Buffer`. | Опции необязательны. |
| `express.static('public')` | Отдаёт файлы из каталога `public`. | Путь к каталогу обязателен. Файл `public/logo.png` доступен как `/logo.png`, если не задан другой префикс. |

### Собственное middleware с условием

```js
function checkApiKey(req, res, next) {
  const apiKey = req.get('x-api-key');
  if (apiKey !== 'college-demo') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
}
```

`req.get(name)` читает HTTP-заголовок с указанным именем; если заголовка нет, вернёт `undefined`. Имя заголовка нужно передать. Ключ в коде выше — только учебный пример проверки условия, а не полноценная аутентификация.

## Урок 6. Архитектура: routes, controllers, services

Express не требует конкретных папок. Разделение на три слоя — соглашение, которое помогает держать разные обязанности в разных местах:

| Слой | Задача | Работает с `req` и `res`? |
|---|---|---|
| Route | Связывает метод и URL с контроллером, при необходимости подключает middleware. | В самой записи маршрута обычно нет логики запроса. |
| Controller | Получает данные из HTTP-запроса, вызывает service, выбирает статус и отправляет ответ. | Да. |
| Service | Выполняет операции с данными и правила приложения, возвращает результат. | Нет. |

Направление вызовов: **Route → Controller → Service**. Результат service возвращается контроллеру, который формирует HTTP-ответ.

```js
// routes/productRoutes.js
router.get('/:id', getProductById);

// controllers/productController.js
export function getProductById(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }
  const product = findProductById(id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
}

// services/productService.js
export function findProductById(id) {
  return products.find(product => product.id === id);
}
```

Здесь `findProductById(id)` получает обычное число и возвращает товар или `undefined`. Если аргумент `id` не передать, поиск, скорее всего, ничего не найдёт; service не должен самостоятельно читать `req.params`. Так его можно использовать вне HTTP и позже заменить массив на базу данных, почти не меняя маршруты.

Типовая структура: `app.js`, папки `routes/`, `controllers/`, `services/`. Для небольшого приложения допустимо начать с одного файла и разделить его по мере роста.

## Урок 7. REST API и полный CRUD

REST API организует работу вокруг ресурсов. **CRUD** означает Create, Read, Update, Delete — создать, прочитать, изменить, удалить. Коллекция `/api/products` обозначает набор товаров; `/api/products/:id` — один товар.

| Операция | Запрос | Успешный ответ |
|---|---|---|
| Получить список | `GET /api/products` | `200` и массив. |
| Получить один товар | `GET /api/products/:id` | `200` и объект; `404`, если товара нет. |
| Создать | `POST /api/products` | `201` и созданный объект с ID. |
| Изменить часть полей | `PATCH /api/products/:id` | `200` и обновлённый объект. |
| Заменить целиком | `PUT /api/products/:id` | Обычно `200` с объектом или `204` без тела. |
| Удалить | `DELETE /api/products/:id` | `200` с удалённым объектом или `204` без тела. |

`PUT` используют, когда клиент передаёт полное новое представление ресурса; `PATCH` — когда передаёт только изменяемые поля. Повторение одного и того же PUT-запроса должно давать то же конечное состояние ресурса. В учебном Product API презентации реализуют частичное обновление через PATCH.

### Операции service с массивом

```js
let products = [
  { id: 1, name: 'Keyboard', price: 15000, category: 'Accessories', inStock: true },
  { id: 2, name: 'Mouse', price: 8000, category: 'Accessories', inStock: true }
];
let nextId = 3;

export function getAllProducts() {
  return products;
}

export function findProductById(id) {
  return products.find(product => product.id === id);
}

export function addProduct(data) {
  const product = { ...data, id: nextId++ };
  products.push(product);
  return product;
}

export function updateProductById(id, changes) {
  const product = findProductById(id);
  if (!product) return null;
  Object.assign(product, changes);
  return product;
}

export function deleteProductById(id) {
  const index = products.findIndex(product => product.id === id);
  if (index === -1) return null;
  const [deleted] = products.splice(index, 1);
  return deleted;
}
```

| Метод | Аргументы | Результат и важный случай отсутствия аргумента |
|---|---|---|
| `array.find(predicate)` | Функция проверяет элементы по очереди. | Первый подходящий элемент или `undefined`. Без функции вызов некорректен. |
| `array.findIndex(predicate)` | Такая же проверка, но нужен индекс. | Индекс или `-1`. Без функции вызов некорректен. |
| `array.push(item)` | Элемент для добавления в конец. | Возвращает новую длину. Без аргумента ничего не добавит. |
| `array.splice(start, deleteCount)` | Индекс начала и число удаляемых элементов. | Возвращает массив удалённых элементов. Без `deleteCount` удалит все элементы от `start` до конца — поэтому `1` здесь обязателен. |
| `Object.assign(target, changes)` | Объект, который изменяют, и объект с новыми полями. | Возвращает `target`. Без `changes` ничего не скопирует; без `target` вызов некорректен. |

В презентациях ID создаётся как `products.length + 1`. После удаления это может повторить уже существующий ID, поэтому в примере выше используется отдельный счётчик. Данные массива исчезают при перезапуске процесса. `Object.assign` копирует **все** переданные поля, в том числе `id` и неожиданные свойства; перед ним нужно валидировать тело и отбирать разрешённые поля. В примере `addProduct` записывает серверный `id` последним, чтобы клиент не смог его заменить.

Полная проверка CRUD: создать товар → получить его по выданному ID → изменить цену → получить товар ещё раз → удалить → убедиться, что повторный GET возвращает `404`.

## Урок 8. Валидация данных и обработка ошибок

`express.json()` проверяет синтаксис JSON, но не правила товара. Для `POST /api/products` презентация требует `name` и `category` как непустые строки, `price` как число больше нуля, `inStock` как boolean. Если поле не прислали, его значение будет `undefined` и проверка должна отклонить запрос. Для PATCH все поля передавать не нужно, но каждое переданное значение должно быть корректным. ID из пути и числа из query тоже требуют проверки.

### Проверка при создании

```js
function validateCreateProduct(req, res, next) {
  const data = req.body;
  const errors = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return res.status(400).json({ message: 'Expected a JSON object' });
  }
  if (typeof data.name !== 'string' || !data.name.trim()) {
    errors.push('name must be a non-empty string');
  }
  if (typeof data.price !== 'number' || !Number.isFinite(data.price) || data.price <= 0) {
    errors.push('price must be a positive number');
  }
  if (typeof data.category !== 'string' || !data.category.trim()) {
    errors.push('category must be a non-empty string');
  }
  if (typeof data.inStock !== 'boolean') {
    errors.push('inStock must be boolean');
  }

  if (errors.length) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }
  next();
}

router.post('/', validateCreateProduct, createProduct);
```

`Array.isArray(data)` отличает массив от обычного объекта; аргумент обязателен. `string.trim()` убирает пробелы по краям и без аргументов работает в обычном режиме. `Number.isFinite(value)` проверяет, что число не равно `NaN` или бесконечности; если аргумент опустить, получится `false`. Для PATCH проверяют лишь поля, которые реально пришли, а также запрещают изменение `id` и неизвестные свойства. Иначе простое `Object.assign(product, req.body)` может изменить данные, которые клиент менять не должен. Пустой PATCH тоже разумно отклонить кодом `400`.

### Централизованные ошибки

Ожидаемая ошибка клиента получает статус `4xx`: например, `400` для неверных данных и `404` для отсутствующего товара. Неожиданная ошибка сервера получает `500`; подробности сохраняют в журнале сервера, а клиенту отправляют безопасное сообщение.

```js
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

function notFound(req, res, next) {
  next(new AppError('Route not found', 404));
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const statusCode = err.statusCode || err.status || 500;
  console.error(err);
  res.status(statusCode).json({
    message: statusCode === 500 ? 'Internal server error' : err.message
  });
}

app.use(express.json());
app.use('/api/products', productRoutes);
app.use(notFound);
app.use(errorHandler);
```

`new AppError(message, statusCode)` создаёт ошибку с сообщением и HTTP-кодом. Если код не передать, используется `500`; если сообщение не передать, полезного описания для ожидаемой ошибки не будет. `next(error)` передаёт ошибку обработчику с четырьмя параметрами `(err, req, res, next)`. Четвёртый параметр нужен в сигнатуре, даже если функция его не вызывает. `notFound` ставят после всех маршрутов, `errorHandler` — последним. Ошибку поиска товара контроллер может передать как `next(new AppError('Product not found', 404))`.

Если контроллер сам ловит исключение, он передаёт его через `next(error)`. Express 5 сам передаёт отклонённый Promise из асинхронного обработчика в цепочку ошибок; в Express 4 это нужно сделать в коде. Ошибка разбора JSON обычно содержит статус `400` в `err.status`, поэтому обработчик выше сохраняет его. Проверка `res.headersSent` передаёт ошибку встроенному обработчику, если отправка ответа уже началась.

## Урок 9. Подключение браузерного интерфейса к REST API

Frontend отправляет HTTP-запросы к API, получает JSON и обновляет DOM. Если Express отдаёт страницу и API с одного адреса, клиент может использовать относительные URL, например `/api/products`:

```js
app.use(express.static('public'));
app.use('/api/products', productRoutes);
```

Если страница и API работают на разных протоколах, хостах или портах, это разные origin; браузеру может потребоваться настроенный CORS. В презентации клиент и API размещены на одном Express-сервере.

### `fetch()` и ответ сервера

```js
async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    throw new Error(data?.message || `HTTP ${response.status}`);
  }
  return data;
}
```

| Вызов или свойство | Что делает | Если аргумент не передать |
|---|---|---|
| `fetch(url, options)` | Отправляет запрос и возвращает `Promise<Response>`. `options` задаёт `method`, `headers`, `body`. | `url` нужен; без `options` выполняется GET с настройками по умолчанию. |
| `response.json()` | Асинхронно читает тело ответа и разбирает JSON. | Аргументы не нужны. Пустое тело, например при `204`, нельзя разбирать как JSON. |
| `response.ok` | `true` для статусов `200–299`. | Это свойство, без аргументов. |
| `response.status` | Числовой HTTP-статус. | Это свойство, без аргументов. |
| `JSON.stringify(value)` | Преобразует объект в JSON-строку для тела запроса. | Без значения возвращает `undefined`, а не полезное JSON-тело. |

`fetch()` не отклоняет Promise при статусе `400` или `404`: он возвращает `Response`, поэтому `response.ok` проверяют отдельно. `try/catch` ловит сетевые ошибки и ошибки, которые мы сами выбрасываем после этой проверки. Функция выше предполагает JSON-ответы API и отдельно обрабатывает пустой ответ `204`.

### Чтение и отображение товаров

```js
async function loadProducts() {
  const products = await request('/api/products');
  const list = document.querySelector('#products');
  list.replaceChildren();

  for (const product of products) {
    const item = document.createElement('li');
    item.textContent = `${product.name} — ${product.price} ₸`;
    list.append(item);
  }
}

document.addEventListener('DOMContentLoaded', loadProducts);
```

`document.querySelector(selector)` ищет первый элемент по CSS-селектору или возвращает `null`; селектор обязателен, а существование элемента нужно обеспечить HTML-разметкой. `document.createElement(tag)` создаёт элемент; имя тега обязательно. `list.replaceChildren()` без аргументов очищает список, а с узлами заменяет содержимое ими. `list.append(item)` добавляет элемент в конец; без аргумента ничего не изменит. `addEventListener(event, handler)` регистрирует обработчик события; оба аргумента нужны. `DOMContentLoaded` означает, что DOM построен и элементы страницы доступны.

### Создание, изменение и удаление

Значение HTML-поля `.value` — строка даже для `type="number"`, поэтому цену преобразуют через `Number()` и проверяют. Значение checkbox `.checked` — boolean. У события отправки формы вызов `event.preventDefault()` отменяет стандартную перезагрузку страницы; аргументы не нужны.

```js
async function createProduct(product) {
  return request('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
}

async function updateProduct(id, changes) {
  return request(`/api/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes)
  });
}

async function deleteProduct(id) {
  await request(`/api/products/${id}`, { method: 'DELETE' });
}
```

Для POST нужен объект с обязательными полями товара; если его не передать, `JSON.stringify(undefined)` не даст полезного тела, а сервер вернёт ошибку валидации. Для PATCH `id` определяет товар, `changes` содержит только разрешённые изменяемые поля; без ID получится неверный URL, без изменений — пустой или некорректный запрос. DELETE обычно не требует тела, но ID в URL обязателен для выбора товара. Кнопка может хранить ID в `data-id`, который JavaScript читает как `element.dataset.id` — это строка.

После успешного POST, PATCH или DELETE вызовите `loadProducts()` ещё раз, чтобы показать состояние сервера. Для загрузки покажите индикатор, для пустого массива — сообщение «Товаров нет», а ошибку из `catch` выведите пользователю. Разделение файлов `api.js` (запросы), `ui.js` (DOM и сообщения), `app.js` (события и координация) делает клиентский код понятным.

## Урок 10. PostgreSQL и подключение базы данных к Node.js

### Зачем переходить от массива к базе данных

Массив `products` существует в памяти процесса: после перезапуска сервера добавленные и изменённые товары исчезают. PostgreSQL хранит данные независимо от процесса Node.js, поддерживает одновременную работу клиентов, SQL-запросы и ограничения целостности. Он запускается как отдельный сервер. Приложение подключается к нему как клиент, отправляет SQL и получает результат.

Реляционная база содержит **таблицы**. Таблица `products` состоит из строк-товаров и столбцов-свойств. Первичный ключ `id` уникально определяет строку. В этом уроке меняется источник данных для чтения товаров: маршруты REST API остаются прежними, а `Service` вместо массива выполняет SQL.

### Создание базы и таблицы

Подключитесь к PostgreSQL от имени пользователя с правом создавать роли и базы, затем выполните:

```sql
CREATE USER shop_user WITH PASSWORD 'замените_на_свой_пароль';
CREATE DATABASE shop_db OWNER shop_user;
```

Следующие команды выполните **в базе `shop_db`**:

```sql
CREATE TABLE products (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  category VARCHAR(100) NOT NULL,
  in_stock BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO products (name, price, category, in_stock)
VALUES
  ('Keyboard', 15000, 'Accessories', true),
  ('Mouse', 8000, 'Accessories', true),
  ('Monitor', 85000, 'Monitors', false);

SELECT * FROM products ORDER BY id;
```

`GENERATED ALWAYS AS IDENTITY` поручает PostgreSQL выдавать ID при вставке строки; столбец `id` в `INSERT` не указан. `PRIMARY KEY` запрещает повторяющиеся и пустые ID. `NOT NULL` требует значение; `CHECK (price > 0)` запрещает нулевую и отрицательную цену. `DEFAULT true` подставляет `true`, если `in_stock` не указан в `INSERT`; явный `NULL` всё равно не пройдёт из-за `NOT NULL`. У `name` и `category` нет SQL-проверки на непустую строку: это правило по-прежнему проверяет приложение. Цена здесь хранится целым числом тенге.

`INSERT INTO ... VALUES` добавляет строки; список столбцов задаёт порядок значений. `SELECT *` читает все столбцы, а `ORDER BY id` явно упорядочивает результат. Без `ORDER BY` порядок строк не гарантирован. Проверка запросом `SELECT` до подключения Node.js помогает отделить ошибки структуры базы от ошибок приложения.

### Параметры подключения и `Pool`

Приложению нужны адрес сервера (`host`), порт (обычно `5432`), имя базы, пользователь и пароль. Установите драйвер: `npm install pg`. Express сам не выполняет SQL; пакет `pg` предоставляет подключение и запросы. `Client` представляет одно соединение, а `Pool` управляет повторно используемыми соединениями для множества HTTP-запросов. Обычно создают один `Pool` на приложение.

В корне проекта создайте `.env` со своими значениями и добавьте `.env` в `.gitignore`:

```dotenv
PGHOST=localhost
PGPORT=5432
PGDATABASE=shop_db
PGUSER=shop_user
PGPASSWORD=ваш_пароль
```

```js
// config/db.js
import { loadEnvFile } from 'node:process';
import { Pool } from 'pg';

loadEnvFile();
export const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD
});
```

`loadEnvFile(path)` загружает переменные в `process.env`. Без аргумента ищет `./.env` относительно текущей рабочей папки; если файла нет, вызов завершится ошибкой. Функция есть в Node.js начиная с версии 20.12.0; на более старой версии используйте другой поддерживаемый способ загрузки `.env`. `process.env` содержит строки, поэтому порт преобразуется через `Number()`; если `PGPORT` отсутствует, `Number(undefined)` даст `NaN`. Проверьте настройки до запуска либо используйте переменные окружения напрямую: `new Pool()` умеет читать стандартные `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` после их загрузки.

`new Pool(config)` создаёт пул с объектом настроек. Сам объект необязателен: без него `pg` использует переменные окружения и свои значения по умолчанию. Отсутствие нужного пользователя, пароля или базы обычно обнаружится при первом запросе. Не создавайте новый пул для каждого HTTP-запроса.

### SQL-запросы из Node.js

```js
const result = await pool.query('SELECT NOW() AS current_time');
console.log(result.rows[0]);
```

`pool.query(text, values)` получает SQL-строку `text` и необязательный массив значений `values`. SQL-строка обязательна. Если в ней нет параметров `$1`, `$2` и далее, второй аргумент можно не передавать. Если параметры есть, передайте для них значения в том же порядке; пропуск значения приведёт к ошибке запроса. Метод возвращает `Promise`, поэтому результат получают через `await`. Пул сам берёт соединение для такого запроса и возвращает его после выполнения.

`result.rows` — массив строк результата; каждая строка представлена объектом с именами выбранных столбцов. `result.rows[0]` — первая строка или `undefined`, если строк нет. `result.rowCount` сообщает число строк, обработанных запросом; для обычного `SELECT` здесь это число полученных строк. У `rows` и `rowCount` нет аргументов: это свойства объекта результата.

Не подставляйте пользовательские значения в SQL через шаблонную строку или конкатенацию. Параметризованный запрос передаёт SQL и данные отдельно:

```js
// services/productService.js
import { pool } from '../config/db.js';

const productColumns = `
  id, name, price, category, in_stock AS "inStock"
`;

export async function getAllProducts() {
  const result = await pool.query(
    `SELECT ${productColumns} FROM products ORDER BY id`
  );
  return result.rows;
}

export async function findProductById(id) {
  const result = await pool.query(
    `SELECT ${productColumns} FROM products WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}
```

`$1` обозначает первый параметр, `[id]` передаёт его значение. Так ID не становится частью текста SQL, что защищает этот запрос от SQL-инъекции. Параметрами можно передавать **значения**, но не имена таблиц или столбцов. В примере `productColumns` — постоянная строка, заданная разработчиком, а не пользовательский ввод. `AS "inStock"` сохраняет ожидаемое клиентом имя поля: без кавычек PostgreSQL привёл бы псевдоним к нижнему регистру.

### Как меняется контроллер

Service теперь асинхронный, поэтому контроллер ждёт его результат. Он по-прежнему читает `req.params`, проверяет ID и выбирает HTTP-ответ:

```js
export async function getProductById(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await findProductById(id);
    if (!product) return next(new AppError('Product not found', 404));
    res.json(product);
  } catch (error) {
    next(error);
  }
}
```

`await` без Promise тоже допустим, но здесь нужен именно потому, что обращение к базе занимает время. Если не поставить `await`, переменная `product` получит Promise вместо товара. `try/catch` передаёт ошибку PostgreSQL общему `errorHandler` через `next(error)`. В Express 5 отклонённый Promise из асинхронного обработчика может передаваться обработчику ошибок автоматически, но явный вариант выше соответствует презентации и работает также в Express 4.

Полный путь запроса: **Route → Controller → Service → Pool → PostgreSQL**. `GET /api/products` и `GET /api/products/:id` продолжают выглядеть для клиента так же, как до подключения базы. Этот урок переводит на PostgreSQL чтение; для постоянного хранения операций POST, PATCH и DELETE нужно позже заменить их операции с массивом на SQL `INSERT`, `UPDATE` и `DELETE`.

## Краткая карта всего курса

1. Создаём Node.js-проект, Express-приложение и HTTP-сервер.
2. Связываем HTTP-метод и путь с обработчиком.
3. Читаем идентификатор, настройки запроса и JSON-тело из разных частей `req`.
4. Группируем маршруты по ресурсам через `Router`.
5. Подключаем middleware в нужном порядке.
6. Отделяем HTTP-код контроллера от операций service.
7. Реализуем CRUD API и возвращаем подходящие статусы.
8. Проверяем входные данные и централизованно обрабатываем ошибки.
9. Вызываем API через `fetch()` и обновляем интерфейс по ответу сервера.
10. Подключаем PostgreSQL и читаем товары через параметризованные SQL-запросы в `Service`.
