# Урок 0 — Установка и запуск React

## Что нам нужно

- **Node.js** — среда выполнения JavaScript/TypeScript
- **npm** — пакетный менеджер (идёт вместе с Node.js)
- **Vite** — инструмент сборки, создаёт проект и запускает дев-сервер

Проверь что Node.js установлен:

```
node --version   # должно быть v18 или новее
npm --version
```

---

## Проект `sandbox`

В папке курса уже есть готовый проект `sandbox/` — устанавливай и запускай:

```
cd sandbox
npm install
npm run dev
```

Открой [http://localhost:5173](http://localhost:5173) — увидишь список уроков в боковой панели.

---

## Как проверять домашние задания

В `sandbox` встроен **селектор уроков**: слева список, справа — работающее решение.

Когда пишешь своё решение в `XX_lesson/solution/Component.tsx` — оно сразу доступно через селектор, перезагружать страницу не нужно.

### Если хочешь запустить свой файл вместо готового решения

Поменяй один импорт в [sandbox/src/App.tsx](../sandbox/src/App.tsx):

```tsx
// Было (готовое решение):
const TodoList = lazy(() => import('../../02_use_state/solution/TodoList')...);

// Стало (твой файл):
const TodoList = lazy(() => import('../../02_use_state/solution/MyTodoList')...);
```

---

## Структура `sandbox`

```
sandbox/
├── src/
│   ├── main.tsx          ← точка входа
│   ├── App.tsx           ← селектор уроков (список + рендер)
│   └── demos/
│       └── ProfileCardDemo.tsx  ← обёртка для компонентов с обязательными props
├── index.html
├── package.json
├── tsconfig.json         ← включает ../*/solution для проверки типов
└── vite.config.ts
```

---

## Полезные команды

| Команда | Что делает |
|---------|-----------|
| `npm run dev` | запустить дев-сервер |
| `npm run typecheck` | проверить TypeScript без сборки |
| `npm run build` | собрать продакшн-версию |

---

## Структура проекта Vite (справочно)

```
src/
├── main.tsx     ← createRoot + монтирование в <div id="root">
└── App.tsx      ← корневой компонент
index.html       ← единственный HTML-файл
```

### `main.tsx` — точка входа

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

React берёт `<div id="root">` из `index.html` и рендерит туда `App`.

---

## Итог

- Проект уже создан в `sandbox/` — просто `npm install` + `npm run dev`
- Все решения видны в браузере через боковое меню
- `npm run typecheck` — проверить типы во всех решениях
