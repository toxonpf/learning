# Шпаргалка — Utility Types

```ts
interface User { id: number; name: string; email: string; age?: number }

Partial<User>           // все поля опциональны
Required<User>          // все поля обязательны
Readonly<User>          // все поля readonly

Pick<User, 'id' | 'name'>    // только id и name
Omit<User, 'email'>          // всё кроме email

Record<'a' | 'b', number>    // { a: number; b: number }
Record<string, User>         // словарь

Exclude<'a' | 'b' | 'c', 'a'>   // 'b' | 'c'
Extract<'a' | 'b' | 'c', 'a' | 'b'> // 'a' | 'b'
NonNullable<string | null | undefined>  // string

ReturnType<typeof fn>      // тип возвращаемого значения
Parameters<typeof fn>      // tuple типов параметров

// Комбо — DTO для обновления:
type UpdateDto = Partial<Omit<User, 'id'>>;

// Комбо — публичные readonly данные:
type PublicUser = Readonly<Pick<User, 'id' | 'name'>>;
```
