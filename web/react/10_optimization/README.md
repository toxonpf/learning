# Урок 10 — Оптимизация

## Когда оптимизировать?

Сначала убедись, что проблема действительно есть. Преждевременная оптимизация усложняет код без реальной пользы. Используй React DevTools Profiler для поиска медленных компонентов.

---

## React.memo — пропуск лишних ререндеров

По умолчанию при ререндере родителя **все** дочерние компоненты рендерятся заново, даже если их props не изменились. `React.memo` запоминает последний результат и пропускает ререндер, если props не изменились.

```tsx
// Без memo — рендерится при каждом ререндере родителя
function ExpensiveList({ items }: { items: string[] }) {
  return <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>;
}

// С memo — рендерится только если items изменились
const ExpensiveList = React.memo(function ExpensiveList({ items }: { items: string[] }) {
  return <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>;
});
```

**Важно:** `memo` сравнивает props по ссылке. Объекты и функции, созданные при каждом рендере родителя, всегда будут «новыми» → `memo` не поможет без `useMemo`/`useCallback`.

---

## useMemo — кэширование вычислений

Кэширует результат дорогого вычисления между рендерами.

```tsx
function ProductList({ products, query }: { products: Product[]; query: string }) {
  // ❌ Фильтрует при каждом рендере, даже если products и query не изменились
  const filtered = products.filter((p) => p.name.includes(query));

  // ✅ Пересчитывает только при изменении products или query
  const filtered = useMemo(
    () => products.filter((p) => p.name.includes(query)),
    [products, query]
  );

  return <ul>{filtered.map((p) => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

---

## useCallback — стабильная ссылка на функцию

Возвращает ту же функцию между рендерами, если зависимости не изменились. Нужен, когда функция передаётся в `memo`-компонент.

```tsx
function Parent() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState(['a', 'b', 'c']);

  // ❌ Новая функция при каждом рендере → Child всегда рендерится заново
  const handleDelete = (item: string) => setItems(items.filter((i) => i !== item));

  // ✅ Та же функция пока items не изменился
  const handleDelete = useCallback(
    (item: string) => setItems((prev) => prev.filter((i) => i !== item)),
    [] // пустой массив, потому что используем функциональное обновление
  );

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
      <MemoizedList items={items} onDelete={handleDelete} />
    </div>
  );
}

const MemoizedList = React.memo(function List({
  items,
  onDelete,
}: {
  items: string[];
  onDelete: (item: string) => void;
}) {
  console.log('List render');
  return (
    <ul>
      {items.map((i) => (
        <li key={i}>
          {i} <button onClick={() => onDelete(i)}>✕</button>
        </li>
      ))}
    </ul>
  );
});
```

---

## Когда что использовать

| Инструмент | Когда применять |
|------------|----------------|
| `React.memo` | Компонент рендерится часто с теми же props |
| `useMemo` | Дорогое вычисление (фильтрация/сортировка большого массива) |
| `useCallback` | Функция передаётся в `memo`-компонент |

---

## Ленивая загрузка компонентов

```tsx
import { lazy, Suspense } from 'react';

// Компонент загружается только когда нужен (отдельный chunk)
const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<p>Загрузка графика...</p>}>
      <HeavyChart />
    </Suspense>
  );
}
```

---

## key для принудительного сброса

```tsx
// Изменение key полностью пересоздаёт компонент (сбрасывает состояние)
<UserForm key={userId} userId={userId} />
```
