# Шпаргалка — Установка и запуск

## Запуск sandbox

```
cd sandbox
npm install
npm run dev      # → http://localhost:5173
```

## Проверить типы

```
npm run typecheck
```

## Добавить новый урок в селектор

В `sandbox/src/App.tsx`:

```tsx
// 1. Добавь lazy-импорт
const MyComponent = lazy(() =>
  import('../../XX_lesson/solution/MyComponent').then(m => ({ default: m.MyComponent }))
);

// 2. Добавь в массив LESSONS
{ id: 'XX', label: 'XX — Название урока', component: <MyComponent /> },
```

## Если компонент требует props

Создай обёртку в `sandbox/src/demos/MyDemo.tsx`:

```tsx
import { MyComponent } from '../../../XX_lesson/solution/MyComponent';

export function MyDemo() {
  return <MyComponent requiredProp="значение" />;
}
```

Затем импортируй `MyDemo` вместо `MyComponent`.
