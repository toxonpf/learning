# Шпаргалка — Функции в TypeScript

```ts
// Базовая типизация
function fn(a: string, b: number): boolean { ... }
const fn = (a: string): void => { ... };

// Опциональный параметр
function fn(a: string, b?: number): string { ... }

// Дефолтное значение
function fn(a: string, role: 'admin' | 'user' = 'user') { ... }

// Rest параметры
function sum(...nums: number[]): number { ... }

// Тип функции
type Handler = (event: MouseEvent) => void;
type Transform<T, R> = (input: T) => R;

// React события
(e: React.MouseEvent<HTMLButtonElement>) => void
(e: React.ChangeEvent<HTMLInputElement>) => void
(e: React.FormEvent<HTMLFormElement>) => void
(e: React.KeyboardEvent<HTMLInputElement>) => void

// Компонент с явным возвращаемым типом
function MyComponent(): React.ReactElement { ... }
// или просто — TS выведет сам
function MyComponent() { return <div /> }
```
