# TS Урок 2 — Interfaces и Type Aliases

## Interface — описание формы объекта

```ts
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = { id: 1, name: 'Алексей', email: 'a@mail.ru' };
```

---

## Опциональные поля и readonly

```ts
interface Product {
  readonly id: number;    // нельзя изменить после создания
  name: string;
  price: number;
  description?: string;  // необязательное поле
  category?: string;
}

const p: Product = { id: 1, name: 'Ноутбук', price: 50000 };
p.id = 2; // ❌ Cannot assign to 'id' because it is a read-only property
```

---

## Type alias — псевдоним типа

```ts
type Point = {
  x: number;
  y: number;
};

type UserId = number;
type StringOrNumber = string | number;
type Callback = (value: string) => void;
```

---

## Interface vs Type — когда что использовать

| | Interface | Type |
|--|-----------|------|
| Объекты | ✅ предпочтительно | ✅ |
| Union типы | ❌ | ✅ `type A = B \| C` |
| Примитивы | ❌ | ✅ `type ID = string` |
| Расширение | `extends` | `&` (intersection) |
| Дополнение (merging) | ✅ | ❌ |

**Правило на практике:** используй `interface` для объектов-данных, `type` для всего остального.

---

## Расширение интерфейсов

```ts
interface Animal {
  name: string;
}

interface Dog extends Animal {
  breed: string;
}

const dog: Dog = { name: 'Бобик', breed: 'Лабрадор' };
```

---

## Intersection types — объединение типов через &

```ts
type WithTimestamps = {
  createdAt: Date;
  updatedAt: Date;
};

type UserWithTimestamps = User & WithTimestamps;

const u: UserWithTimestamps = {
  id: 1,
  name: 'Алексей',
  email: 'a@mail.ru',
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

---

## Индексные сигнатуры — объект с динамическими ключами

```ts
interface StringMap {
  [key: string]: string;
}

const translations: StringMap = {
  hello: 'привет',
  world: 'мир',
};

// С конкретными полями и динамическими
interface Config {
  name: string;
  [key: string]: unknown; // остальные поля любые
}
```

---

## Практика в React

```tsx
// Так описываются props компонентов
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

function Button({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled} className={variant}>
      {label}
    </button>
  );
}
```
