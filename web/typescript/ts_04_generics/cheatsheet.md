# Шпаргалка — Generics

```ts
// Базовый дженерик
function identity<T>(val: T): T { return val; }

// Несколько параметров
function pair<A, B>(a: A, b: B): [A, B] { return [a, b]; }

// Дженерик-интерфейс
interface Box<T> { value: T }
interface ApiResponse<T> { data: T; status: number }

// Ограничение
function log<T extends { length: number }>(val: T): void { ... }
function get<T extends object, K extends keyof T>(obj: T, key: K): T[K] { ... }

// keyof
type UserKeys = keyof User; // 'id' | 'name' | 'email'
type UserValues = User[keyof User]; // string | number

// В React — дженерик-компонент
function List<T>({ items, render }: { items: T[]; render: (item: T) => ReactNode }) {
  return <ul>{items.map((item, i) => <li key={i}>{render(item)}</li>)}</ul>;
}

// Дженерик-хук
function useFetch<T>(url: string): { data: T | null; loading: boolean } { ... }
const { data } = useFetch<User[]>('/api/users'); // data: User[] | null
```
