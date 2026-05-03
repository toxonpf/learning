# TS Урок 5 — Utility Types

TypeScript предоставляет встроенные утилитные типы для трансформации существующих типов.

---

## Partial и Required

```ts
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// Partial<T> — все поля становятся опциональными
type UserUpdate = Partial<User>;
// { id?: number; name?: string; email?: string; age?: number }

// Required<T> — все поля становятся обязательными
interface Config {
  host?: string;
  port?: number;
}
type StrictConfig = Required<Config>;
// { host: string; port: number }

// Практика: функция обновления
function updateUser(id: number, changes: Partial<User>): User {
  // можно передать только те поля, которые меняются
}
updateUser(1, { name: 'Мария' }); // ✅ не нужно передавать всё
```

---

## Pick и Omit

```ts
// Pick<T, K> — взять только указанные поля
type UserPreview = Pick<User, 'id' | 'name'>;
// { id: number; name: string }

// Omit<T, K> — убрать указанные поля
type UserWithoutId = Omit<User, 'id'>;
// { name: string; email: string; age: number }

type PublicUser = Omit<User, 'email' | 'age'>;
// { id: number; name: string }

// Практика: форма создания (без id — его генерирует сервер)
type CreateUserDto = Omit<User, 'id'>;
function createUser(data: CreateUserDto): Promise<User> { ... }
```

---

## Record

```ts
// Record<K, V> — объект с ключами типа K и значениями типа V
type RoleLabel = Record<'admin' | 'user' | 'guest', string>;
const labels: RoleLabel = {
  admin: 'Администратор',
  user: 'Пользователь',
  guest: 'Гость',
};

// Словарь
type Cache = Record<string, unknown>;
type UserMap = Record<number, User>;
```

---

## Readonly

```ts
// Readonly<T> — все поля становятся readonly
type ImmutableUser = Readonly<User>;

const user: ImmutableUser = { id: 1, name: 'Алексей', email: 'a@mail.ru', age: 25 };
user.name = 'Мария'; // ❌ Cannot assign to 'name' because it is a read-only property

// Глубокий readonly для массивов
const arr: ReadonlyArray<number> = [1, 2, 3];
arr.push(4); // ❌
```

---

## ReturnType и Parameters

```ts
function fetchUser(id: number, options: { cache: boolean }): Promise<User> { ... }

type FetchReturn = ReturnType<typeof fetchUser>;      // Promise<User>
type FetchParams = Parameters<typeof fetchUser>;      // [number, { cache: boolean }]

// Полезно при работе с внешними функциями
type ButtonClickHandler = React.MouseEventHandler<HTMLButtonElement>;
// = (event: React.MouseEvent<HTMLButtonElement>) => void
```

---

## Exclude и Extract

```ts
type Status = 'loading' | 'success' | 'error' | 'idle';

// Exclude<T, U> — убрать из T варианты, которые есть в U
type ActiveStatus = Exclude<Status, 'idle'>;
// 'loading' | 'success' | 'error'

// Extract<T, U> — оставить только варианты из T, которые есть в U
type FinishedStatus = Extract<Status, 'success' | 'error'>;
// 'success' | 'error'
```

---

## NonNullable

```ts
type MaybeString = string | null | undefined;
type DefinitelyString = NonNullable<MaybeString>; // string

// Полезно для фильтрации массивов
const values: (string | null)[] = ['a', null, 'b', null, 'c'];
const strings = values.filter((v): v is NonNullable<typeof v> => v !== null);
// string[]
```

---

## Комбинирование утилит

```ts
interface ApiUser {
  id: number;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

// DTO для создания — без серверных полей
type CreateUser = Omit<ApiUser, 'id' | 'passwordHash' | 'createdAt' | 'updatedAt'> & {
  password: string;
};

// DTO для обновления — всё опционально, без системных полей
type UpdateUser = Partial<Omit<ApiUser, 'id' | 'createdAt' | 'updatedAt'>>;

// Публичный профиль
type PublicProfile = Readonly<Pick<ApiUser, 'id' | 'name' | 'createdAt'>>;
```
