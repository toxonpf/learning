# TS Урок 3 — Типизация функций

## Базовая типизация

```ts
// Параметры и возвращаемое значение
function add(a: number, b: number): number {
  return a + b;
}

// Стрелочная функция
const multiply = (a: number, b: number): number => a * b;

// void — функция ничего не возвращает
function log(message: string): void {
  console.log(message);
}
```

---

## Опциональные и дефолтные параметры

```ts
// Опциональный параметр — всегда после обязательных
function greet(name: string, greeting?: string): string {
  return `${greeting ?? 'Привет'}, ${name}!`;
}

greet('Алексей');            // 'Привет, Алексей!'
greet('Алексей', 'Здорово'); // 'Здорово, Алексей!'

// Дефолтное значение
function createUser(name: string, role: 'admin' | 'user' = 'user') {
  return { name, role };
}
```

---

## Rest параметры

```ts
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}

sum(1, 2, 3, 4); // 10
```

---

## Function types — тип как переменная

```ts
// Описание типа функции
type Predicate<T> = (item: T) => boolean;
type Transformer<T, R> = (input: T) => R;
type EventHandler = (event: React.MouseEvent) => void;

// Использование
const isAdult: Predicate<number> = (age) => age >= 18;
const toString: Transformer<number, string> = (n) => String(n);
```

---

## Перегрузки (overloads)

```ts
// Объявления перегрузок
function format(value: string): string;
function format(value: number): string;
function format(value: Date): string;
// Реализация — принимает все варианты
function format(value: string | number | Date): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return value.toLocaleString();
  return value.toLocaleDateString('ru-RU');
}
```

---

## Типизация коллбеков

```ts
// Коллбек в параметрах
function fetchData(url: string, onSuccess: (data: unknown) => void, onError: (err: Error) => void): void {
  fetch(url)
    .then((r) => r.json())
    .then(onSuccess)
    .catch(onError);
}

// Коллбек, который может вернуть void или значение
type SetStateAction<T> = T | ((prev: T) => T);
```

---

## Типизация в React

```tsx
// Обработчики событий
function handleClick(event: React.MouseEvent<HTMLButtonElement>): void {
  event.preventDefault();
}

function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
  console.log(event.target.value);
}

function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
  event.preventDefault();
}

// Компонент с типизированными props
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, i) => (
        <li key={keyExtractor(item)}>{renderItem(item, i)}</li>
      ))}
    </ul>
  );
}
```
