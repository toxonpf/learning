# Шпаргалка — Оптимизация

```tsx
// React.memo — пропуск ререндера если props не изменились
const MyComponent = React.memo(function MyComponent({ value }: { value: string }) {
  return <p>{value}</p>;
});

// useMemo — кэшировать дорогое вычисление
const result = useMemo(() => heavyCalculation(data), [data]);

// useCallback — стабильная ссылка на функцию
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Ленивая загрузка
const Page = lazy(() => import('./Page'));
<Suspense fallback={<Spinner />}><Page /></Suspense>

// Когда что использовать:
// memo       → компонент рендерится часто с теми же props
// useMemo    → дорогое вычисление (фильтрация/сортировка большого массива)
// useCallback → функция передаётся в memo-компонент
```
