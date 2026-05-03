# ДЗ TS 3 — Типизация функций

Свои решения клади в папку `solution/`.

---

## Задание

### 1. Утилиты для массивов

Напиши типизированные функции:

```ts
// filter — аналог Array.prototype.filter с типизацией
function filter<T>(arr: T[], predicate: (item: T) => boolean): T[]

// map — аналог Array.prototype.map
function map<T, R>(arr: T[], transform: (item: T) => R): R[]

// groupBy — сгруппировать массив по ключу
function groupBy<T>(arr: T[], getKey: (item: T) => string): Record<string, T[]>
```

Пример использования:
```ts
const users = [{ name: 'Алексей', age: 25 }, { name: 'Мария', age: 17 }];
const adults = filter(users, (u) => u.age >= 18); // [{ name: 'Алексей', age: 25 }]
const names = map(users, (u) => u.name);           // ['Алексей', 'Мария']
```

### 2. Обработчики событий в React

Создай компонент `SearchBar` со следующей сигнатурой props:

```ts
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
}
```

Все обработчики событий должны быть явно типизированы (не `any`).

### 3. Функция с перегрузками

```ts
// Напиши функцию formatDate с двумя перегрузками:
// formatDate(date: Date): string             — вернуть дату в формате 'DD.MM.YYYY'
// formatDate(date: Date, time: true): string — вернуть дату и время 'DD.MM.YYYY HH:MM'
```

---

## Требования

- [ ] `filter`, `map`, `groupBy` работают с любым типом T
- [ ] В `SearchBar` все события типизированы корректно
- [ ] `formatDate` реализована через перегрузки
