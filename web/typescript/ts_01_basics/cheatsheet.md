# Шпаргалка — Базовые типы TS

```ts
// Примитивы
const s: string = 'text';
const n: number = 42;
const b: boolean = true;
const nothing: null = null;

// Массивы
const arr: string[] = [];
const matrix: number[][] = [[1, 2], [3, 4]];

// Tuple
const pair: [string, number] = ['age', 25];

// Union
let id: string | number = '123';
type Status = 'loading' | 'success' | 'error';

// Literal
type Dir = 'left' | 'right' | 'up' | 'down';

// Enum (предпочитай union-типы)
enum Color { Red = 'red', Blue = 'blue' }

// any — плохо, unknown — хорошо
let val: unknown = getData();
if (typeof val === 'string') val.toUpperCase(); // сужение типа

// Type assertion
const el = document.getElementById('id') as HTMLInputElement;

// Автовывод — не пиши тип если TS сам его знает
const name = 'Алексей'; // уже string
```
