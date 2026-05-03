# TS Урок 1 — Базовые типы

## Зачем TypeScript?

TypeScript — это JavaScript с типами. Компилятор проверяет код **до запуска** и ловит ошибки, которые в JS проявились бы только в рантайме.

```ts
// JS — ошибка только в браузере
function greet(name) {
  return name.toUpperCase();
}
greet(42); // 💥 TypeError в рантайме

// TS — ошибка сразу в редакторе
function greet(name: string): string {
  return name.toUpperCase();
}
greet(42); // ❌ Argument of type 'number' is not assignable to parameter of type 'string'
```

---

## Примитивные типы

```ts
const name: string = 'Алексей';
const age: number = 25;
const isAdmin: boolean = true;
const nothing: null = null;
const missing: undefined = undefined;

// В большинстве случаев тип выводится автоматически — явно писать не нужно
const name = 'Алексей'; // TypeScript сам поймёт, что это string
```

---

## Arrays

```ts
const names: string[] = ['Алексей', 'Мария'];
const scores: number[] = [1, 2, 3];

// Альтернативный синтаксис (реже используется)
const names: Array<string> = ['Алексей', 'Мария'];
```

---

## Tuple — массив с фиксированной структурой

```ts
const point: [number, number] = [10, 20];
const entry: [string, number] = ['возраст', 25];

// Деструктуризация
const [x, y] = point;
```

---

## Union — одно из нескольких типов

```ts
let id: string | number;
id = '123';  // ✅
id = 123;    // ✅
id = true;   // ❌

type Status = 'loading' | 'success' | 'error';
let status: Status = 'loading';
```

---

## Literal types — конкретное значение как тип

```ts
type Direction = 'left' | 'right' | 'up' | 'down';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

function move(direction: Direction): void {
  console.log(`Moving ${direction}`);
}

move('left');   // ✅
move('diagonal'); // ❌
```

---

## Enum

```ts
enum Role {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
}

const userRole: Role = Role.Admin;
console.log(userRole); // 'admin'
```

> В React-проектах чаще используют `type Role = 'admin' | 'user' | 'guest'` вместо enum — короче и без лишнего JS-кода в бандле.

---

## any, unknown, never

```ts
// any — отключает проверку типов (избегай!)
let x: any = 'строка';
x = 42;        // ✅ без ошибок
x.foo.bar();   // ✅ TS молчит, но упадёт в рантайме

// unknown — безопасная альтернатива any
let y: unknown = getData();
y.toUpperCase(); // ❌ нельзя использовать без проверки типа

if (typeof y === 'string') {
  y.toUpperCase(); // ✅ TypeScript знает, что это string
}

// never — значение, которого никогда не будет
function throwError(msg: string): never {
  throw new Error(msg);
}
```

---

## Type assertions — явное указание типа

```ts
const input = document.getElementById('search') as HTMLInputElement;
input.value = 'привет'; // ✅ теперь TS знает, что это input

// Альтернативный синтаксис (не работает в JSX)
const input = <HTMLInputElement>document.getElementById('search');
```
