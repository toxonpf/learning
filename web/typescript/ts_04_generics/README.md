# TS Урок 4 — Generics

## Зачем нужны дженерики?

Дженерики позволяют писать код, который работает с **любым типом**, сохраняя при этом типобезопасность.

```ts
// Без дженериков — либо any (небезопасно), либо дублирование
function firstItem(arr: number[]): number { return arr[0]; }
function firstItem(arr: string[]): string { return arr[0]; } // дублируем!

// С дженериком — один раз, для любого типа
function firstItem<T>(arr: T[]): T {
  return arr[0];
}

const num = firstItem([1, 2, 3]);       // T = number
const str = firstItem(['a', 'b', 'c']); // T = string
```

---

## Синтаксис

```ts
// Функция с дженериком
function identity<T>(value: T): T {
  return value;
}

// Несколько дженериков
function pair<A, B>(first: A, second: B): [A, B] {
  return [first, second];
}

// Дженерик-интерфейс
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

const response: ApiResponse<User[]> = {
  data: [{ id: 1, name: 'Алексей' }],
  status: 200,
  message: 'OK',
};
```

---

## Ограничения (constraints)

```ts
// T должен иметь поле length
function logLength<T extends { length: number }>(value: T): void {
  console.log(value.length);
}

logLength('строка');   // ✅
logLength([1, 2, 3]);  // ✅
logLength(42);         // ❌ number не имеет length

// T должен быть одним из конкретных типов
function format<T extends string | number>(value: T): string {
  return String(value);
}
```

---

## keyof — ключи объекта как тип

```ts
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: 1, name: 'Алексей', age: 25 };
const name = getProperty(user, 'name');  // string
const id = getProperty(user, 'id');      // number
getProperty(user, 'email');              // ❌ не существует
```

---

## Дженерики в React

```tsx
// Универсальный Select-компонент
interface SelectProps<T> {
  options: T[];
  value: T | null;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
  getValue: (option: T) => string;
}

function Select<T>({ options, value, onChange, getLabel, getValue }: SelectProps<T>) {
  return (
    <select
      value={value ? getValue(value) : ''}
      onChange={(e) => {
        const selected = options.find((o) => getValue(o) === e.target.value);
        if (selected) onChange(selected);
      }}
    >
      {options.map((opt) => (
        <option key={getValue(opt)} value={getValue(opt)}>
          {getLabel(opt)}
        </option>
      ))}
    </select>
  );
}

// Использование с любым типом данных
<Select
  options={users}
  value={selectedUser}
  onChange={setSelectedUser}
  getLabel={(u) => u.name}
  getValue={(u) => String(u.id)}
/>
```

---

## Дженерик-хук

```tsx
// useFetch из урока 8 — уже использует дженерик
function useFetch<T>(url: string): { data: T | null; loading: boolean; error: string | null }

// Использование
const { data } = useFetch<User[]>('/api/users');
// data — User[] | null, TypeScript знает точный тип
```
