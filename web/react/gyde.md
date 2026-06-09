# План изучения React

## 0. База перед React

Перед React нужно уверенно знать базу HTML, CSS и JavaScript.

### HTML

* Структура HTML-документа
* Семантические теги
* Формы
* `input`
* `button`
* `select`
* `textarea`
* Атрибуты
* Подключение CSS и JS

### CSS

* Селекторы
* Flexbox
* Grid
* Позиционирование
* Адаптивная верстка
* Media queries
* Hover-эффекты
* Transitions
* Основы анимаций

### JavaScript

* `let` и `const`
* Типы данных
* Функции
* Стрелочные функции
* Объекты
* Массивы
* `map`
* `filter`
* `find`
* `reduce`
* Destructuring
* Spread/rest
* `import/export`
* Promises
* `async/await`
* `fetch`
* `localStorage`
* Обработка событий

---

# 1. Что такое React

## Темы

* Что такое React
* Для чего нужен React
* Компонентный подход
* Что такое UI-компонент
* Как React обновляет интерфейс
* Отличие React от обычного JavaScript
* Почему React удобен для больших интерфейсов

## Нужно понять

React — это библиотека для создания пользовательских интерфейсов.
Интерфейс собирается из компонентов, а компоненты можно переиспользовать.

---

# 2. Установка React-проекта

## Темы

* Node.js
* npm
* pnpm
* Vite
* Структура React-проекта
* `package.json`
* `npm run dev`
* `npm run build`
* `src/main.jsx`
* `src/App.jsx`

## Команда для создания проекта

```bash
npm create vite@latest my-app
cd my-app
npm install
npm run dev
```

## Лучше использовать

```text
Vite + React
```

Не стоит начинать с Create React App, потому что сейчас чаще используют Vite.

---

# 3. JSX

## Темы

* Что такое JSX
* Как писать HTML-подобный код внутри JavaScript
* Почему используется `className`, а не `class`
* Вставка JavaScript в JSX через `{}`
* Условия в JSX
* Рендер списков
* Фрагменты `<>...</>`
* Атрибут `key`

## Пример

```jsx
const name = "Artem";

function App() {
  return (
    <>
      <h1>Привет, {name}</h1>
      <p>Это React</p>
    </>
  );
}
```

---

# 4. Компоненты

## Темы

* Функциональные компоненты
* Разделение интерфейса на компоненты
* Импорт и экспорт компонентов
* Именование компонентов с большой буквы
* Папка `components`
* Переиспользование компонентов

## Пример структуры

```text
src/
  components/
    Header.jsx
    Button.jsx
    ProductCard.jsx
  App.jsx
  main.jsx
```

## Пример компонента

```jsx
function Header() {
  return (
    <header>
      <h1>Мой сайт</h1>
    </header>
  );
}

export default Header;
```

---

# 5. Props

## Темы

* Что такое props
* Передача данных в компонент
* Деструктуризация props
* Props как параметры функции
* Передача строк
* Передача чисел
* Передача массивов
* Передача объектов
* Передача функций
* `children`

## Пример

```jsx
function ProductCard({ title, price }) {
  return (
    <div>
      <h2>{title}</h2>
      <p>{price} ₸</p>
    </div>
  );
}

function App() {
  return <ProductCard title="Наушники" price={25000} />;
}
```

---

# 6. State

## Темы

* Что такое состояние компонента
* `useState`
* Изменение состояния
* Почему нельзя менять state напрямую
* Ререндер компонента
* State для input
* State для модального окна
* State для корзины
* State для фильтрации
* State для табов

## Пример

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Клик: {count}
    </button>
  );
}
```

---

# 7. Events

## Темы

* `onClick`
* `onChange`
* `onSubmit`
* `onMouseEnter`
* Объект `event`
* `event.preventDefault()`
* Передача аргументов в обработчик
* Обработка форм

## Пример

```jsx
function App() {
  function handleClick() {
    alert("Клик");
  }

  return <button onClick={handleClick}>Нажми</button>;
}
```

---

# 8. Forms

## Темы

* Controlled components
* `input` + `useState`
* `textarea`
* `select`
* Checkbox
* Radio
* Валидация формы
* Очистка формы
* Отправка формы
* Ошибки формы

## Пример

```jsx
import { useState } from "react";

function App() {
  const [name, setName] = useState("");

  return (
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="Введите имя"
    />
  );
}
```

---

# 9. Lists

## Темы

* Рендер массива через `map`
* Фильтрация списка
* Поиск
* Сортировка
* Удаление элемента
* Добавление элемента
* Редактирование элемента
* Атрибут `key`

## Пример

```jsx
const products = [
  { id: 1, title: "Телефон" },
  { id: 2, title: "Ноутбук" },
];

function App() {
  return (
    <div>
      {products.map((product) => (
        <p key={product.id}>{product.title}</p>
      ))}
    </div>
  );
}
```

---

# 10. Conditional Rendering

## Темы

* `if`
* Тернарный оператор
* `&&`
* Показ загрузки
* Показ ошибки
* Показ пустого состояния
* Модальные окна
* Авторизован / не авторизован

## Пример

```jsx
function App() {
  const isAuth = true;

  return (
    <div>
      {isAuth ? <p>Вы вошли</p> : <p>Войдите в аккаунт</p>}
    </div>
  );
}
```

---

# 11. useEffect

## Темы

* Что такое side effects
* Когда нужен `useEffect`
* Загрузка данных
* Dependency array
* Пустой массив зависимостей
* Cleanup function
* Бесконечный ререндер
* Работа с API
* Работа с localStorage
* Таймеры

## Пример

```jsx
import { useEffect, useState } from "react";

function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));
  }, []);

  return (
    <div>
      {users.map((user) => (
        <p key={user.id}>{user.name}</p>
      ))}
    </div>
  );
}
```

---

# 12. Работа с API

## Темы

* `fetch`
* `async/await`
* Loading state
* Error state
* Empty state
* GET-запрос
* POST-запрос
* DELETE-запрос
* PUT/PATCH-запрос
* Axios
* React Query / TanStack Query

## Пример

```jsx
useEffect(() => {
  async function loadData() {
    const res = await fetch("https://api.example.com/products");
    const data = await res.json();
    setProducts(data);
  }

  loadData();
}, []);
```

---

# 13. Component Lifecycle на хуках

## Темы

* Компонент появился
* Компонент обновился
* Компонент удалился
* Как это связано с `useEffect`
* Почему React может рендерить компонент несколько раз
* StrictMode
* Cleanup

---

# 14. Lifting State Up

## Темы

* Поднятие состояния наверх
* Передача state через props
* Передача set-функции вниз
* Общий state для нескольких компонентов
* Когда state должен быть в родителе
* Когда state должен быть внутри компонента

## Нужно понять

Если нескольким компонентам нужны одни и те же данные, state нужно поднять в общего родителя.

---

# 15. Context API

## Темы

* Что такое Context
* `createContext`
* `Provider`
* `useContext`
* Глобальные данные
* Тема сайта
* Авторизация
* Язык интерфейса
* Корзина
* Когда Context использовать не надо

## Пример использования

```jsx
import { createContext, useContext } from "react";

const ThemeContext = createContext();

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Page />
    </ThemeContext.Provider>
  );
}

function Page() {
  const theme = useContext(ThemeContext);

  return <p>Тема: {theme}</p>;
}
```

---

# 16. Custom Hooks

## Темы

* Что такое кастомный хук
* Почему хук должен начинаться с `use`
* Вынесение логики из компонента
* `useFetch`
* `useLocalStorage`
* `useDebounce`
* `useModal`
* `useForm`

## Пример

```jsx
import { useState } from "react";

function useToggle(defaultValue = false) {
  const [value, setValue] = useState(defaultValue);

  function toggle() {
    setValue((prev) => !prev);
  }

  return [value, toggle];
}
```

---

# 17. React Router

## Темы

* Установка React Router
* `BrowserRouter`
* `Routes`
* `Route`
* `Link`
* `NavLink`
* Динамические маршруты
* `useParams`
* `useNavigate`
* Layout routes
* Protected routes
* 404 page

## Нужно уметь делать маршруты

```text
/
/about
/products
/products/:id
/login
/profile
```

---

# 18. Стилизация в React

## Темы

* Обычный CSS
* CSS Modules
* SCSS
* Tailwind CSS
* clsx / classnames
* Условные классы
* Адаптив
* Темная тема
* UI-kit
* shadcn/ui

## Для фриланса особенно полезно

* Tailwind CSS
* shadcn/ui
* Framer Motion
* GSAP

---

# 19. State Management

## Темы

* Локальный state
* Поднятие state
* Context
* Zustand
* Redux Toolkit
* Когда Redux не нужен
* Глобальный store
* Actions
* Selectors
* Persist state

## Правильный порядок изучения

```text
useState → lifting state up → Context → Zustand → Redux Toolkit
```

Не стоит начинать сразу с Redux.

---

# 20. Оптимизация

## Темы

* Почему компонент перерендеривается
* `React.memo`
* `useMemo`
* `useCallback`
* Lazy loading
* Code splitting
* `Suspense`
* Оптимизация списков
* Debounce
* Throttle
* Избегание лишнего state

Эту тему лучше изучать после уверенной базы.

---

# 21. TypeScript + React

## Темы

* Типизация props
* Типизация state
* Типизация events
* Типизация forms
* Типизация API response
* Interfaces
* Types
* Generics
* `ReactNode`
* `ComponentProps`
* Типизация custom hooks

## Пример

```tsx
type ProductCardProps = {
  title: string;
  price: number;
};

function ProductCard({ title, price }: ProductCardProps) {
  return (
    <div>
      <h2>{title}</h2>
      <p>{price} ₸</p>
    </div>
  );
}
```

---

# 22. Продвинутые формы

## Темы

* React Hook Form
* Zod
* Валидация схемой
* Ошибки полей
* Маски
* Динамические поля
* Отправка формы на backend
* Loading после submit
* Disable button
* Toast-уведомления

Это нужно для реальных проектов: заявки, квизы, калькуляторы, CRM, админки.

---

# 23. Работа с серверными данными

## Темы

* REST API
* CRUD
* TanStack Query
* Кэширование
* Refetch
* Mutation
* Optimistic update
* Pagination
* Infinite scroll
* Search params

---

# 24. Авторизация

## Темы

* Login form
* Register form
* JWT
* Access token
* Refresh token
* Хранение токена
* Protected routes
* Logout
* Проверка пользователя при загрузке
* Роли: admin/user

---

# 25. Next.js после React

## Темы

* App Router
* Pages
* Layouts
* Server Components
* Client Components
* Routing
* Dynamic routes
* Loading pages
* Error pages
* API routes
* Metadata
* SSR
* SSG
* Deployment на Vercel

## Важно

Next.js лучше изучать после того, как понятны:

* Components
* Props
* State
* useEffect
* React Router
* Forms
* API

---

# Правильный порядок изучения

```text
1. JS база
2. Vite + React
3. JSX
4. Components
5. Props
6. useState
7. Events
8. Forms
9. Lists
10. Conditional rendering
11. useEffect
12. API fetch
13. React Router
14. Context
15. Custom Hooks
16. Tailwind CSS
17. Zustand
18. React Hook Form
19. TypeScript
20. Next.js
```

---

# Проекты для практики

## Уровень 1

* Счетчик
* Todo List
* Tabs
* Modal window
* Accordion
* Calculator
* Product cards
* Search filter

## Уровень 2

* Weather app
* Movie search app
* Notes app
* Cart / корзина
* Quiz app
* Currency converter
* Simple CRM layout
* Admin dashboard UI

## Уровень 3

* Интернет-магазин
* Личный кабинет
* Kanban-доска
* Мини-CRM
* Лендинг с анимациями
* Сайт строительной компании
* Dashboard с графиками
* Авторизация + protected routes

---

# Что пока не учить

На старте можно не трогать:

* Redux
* React Compiler
* Server Components
* Suspense для data fetching
* SSR
* Microfrontends
* React Native
* Сложную оптимизацию
* Class components
* Legacy lifecycle methods

---

# План на 6 недель

## Неделя 1

React база:

* JSX
* Components
* Props
* useState
* Events
* Forms

## Неделя 2

Работа с данными:

* Lists
* Conditional rendering
* useEffect
* API
* localStorage

## Неделя 3

Структура приложения:

* React Router
* Context
* Custom Hooks
* Tailwind CSS

## Неделя 4

Коммерческая база:

* Zustand
* React Hook Form
* Zod
* TypeScript база

## Неделя 5

Портфолио:

* Собрать 2–3 проекта
* Сделать адаптив
* Добавить анимации
* Выложить на GitHub
* Задеплоить

## Неделя 6

Next.js:

* App Router
* Layouts
* Dynamic routes
* Server/client components
* Deployment

---

# Рекомендуемый стек для старта

```text
React + Vite + TypeScript + Tailwind CSS + React Router + Zustand + React Hook Form + Zod
```

# Следующий стек после базы

```text
Next.js + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion
```

Этот стек подходит для лендингов, личных кабинетов, админок, CRM и сайтов для клиентов.
