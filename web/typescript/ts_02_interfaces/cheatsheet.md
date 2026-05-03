# Шпаргалка — Interfaces и Types

```ts
// Interface
interface User {
  readonly id: number;
  name: string;
  age?: number;          // опциональное
}

// Type alias
type Point = { x: number; y: number };
type ID = string | number;
type Callback = (val: string) => void;

// Расширение
interface Admin extends User {
  role: 'admin';
}

// Intersection
type AdminWithMeta = Admin & { createdAt: Date };

// Индексная сигнатура
interface Dict {
  [key: string]: string;
}

// Правило выбора:
// interface — для объектов (Props, модели данных)
// type     — для union, примитивов, функций, tuple
```
