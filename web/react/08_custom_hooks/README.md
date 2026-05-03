# Урок 8 — Кастомные хуки

## Что такое кастомный хук?

Кастомный хук — обычная функция, имя которой начинается с `use`. Он позволяет вынести повторяющуюся логику с хуками из компонентов и переиспользовать её.

```tsx
// Вместо того чтобы копировать логику в каждый компонент...
function ComponentA() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  // ...
}

// ...выносим в хук и используем везде
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

function ComponentA() {
  const width = useWindowWidth();
  // ...
}
```

---

## Примеры кастомных хуков

### useFetch — загрузка данных

```tsx
interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useFetch<T>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setState({ data: null, loading: false, error: err.message });
        }
      });

    return () => controller.abort();
  }, [url]);

  return state;
}

// Использование
function UserList() {
  const { data, loading, error } = useFetch<User[]>('https://jsonplaceholder.typicode.com/users');
  if (loading) return <p>Загрузка...</p>;
  if (error) return <p>Ошибка: {error}</p>;
  return <ul>{data?.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

### useLocalStorage — синхронизация с localStorage

```tsx
function useLocalStorage<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initial;
  });

  const setAndStore = (newValue: T) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  };

  return [value, setAndStore];
}

// Использование
const [theme, setTheme] = useLocalStorage('theme', 'light');
```

### useDebounce — задержка обновления значения

```tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

// Использование — поиск не срабатывает при каждом символе
function Search() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) fetchResults(debouncedQuery);
  }, [debouncedQuery]);
}
```

### useToggle — переключатель

```tsx
function useToggle(initial = false): [boolean, () => void] {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle];
}

// Использование
const [isOpen, toggleOpen] = useToggle();
```

---

## Правила хуков (напоминание)

- Только на верхнем уровне компонента или другого хука
- Только внутри React-функций (компонент или хук)
- Имя начинается с `use`
