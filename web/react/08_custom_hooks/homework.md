# ДЗ 8 — Библиотека хуков

Свои решения клади в папку `solution/`.

---

## Задание

Напиши 4 кастомных хука и компонент, который их демонстрирует.

---

### Хук 1: `useCounter`

Счётчик с настраиваемым шагом и лимитами.

```tsx
function useCounter(options?: { initial?: number; step?: number; min?: number; max?: number })
// Возвращает: { count, increment, decrement, reset }
```

Требования:
- `increment` не увеличивает выше `max` (если задан)
- `decrement` не уменьшает ниже `min` (если задан)
- `reset` возвращает к `initial`

---

### Хук 2: `useLocalStorage`

Состояние, синхронизированное с localStorage.

```tsx
function useLocalStorage<T>(key: string, initial: T): [T, (value: T) => void]
```

---

### Хук 3: `useDebounce`

Задержка обновления значения.

```tsx
function useDebounce<T>(value: T, delay: number): T
```

---

### Хук 4: `useFetch`

Загрузка данных с управлением состоянием.

```tsx
function useFetch<T>(url: string): { data: T | null; loading: boolean; error: string | null }
```

---

### Компонент-демо `HooksDemo`

Покажи все четыре хука в действии:
- Счётчик от 0 до 10 с шагом 2
- Поле, которое сохраняет значение после перезагрузки страницы
- Поиск с дебаунсом 500мс + запрос к API
- Список пользователей через `useFetch`

---

## Требования

- [ ] Каждый хук в отдельном файле
- [ ] Все хуки строго типизированы через TypeScript
- [ ] `useFetch` использует `AbortController`

---

## Бонус

- `useMediaQuery(query: string): boolean` — следит за CSS media query
- `usePrevious<T>(value: T): T | undefined` — возвращает предыдущее значение
