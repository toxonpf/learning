# Шпаргалка — Кастомные хуки

```tsx
// Шаблон хука
function useMyHook(param: Type) {
  const [state, setState] = useState(initial);
  useEffect(() => { /* ... */ }, [param]);
  return { state, someAction };
}

// useFetch
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { /* fetch + AbortController */ }, [url]);
  return { data, loading, error };
}

// useLocalStorage
function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() =>
    JSON.parse(localStorage.getItem(key) ?? 'null') ?? initial
  );
  const set = (v: T) => { setValue(v); localStorage.setItem(key, JSON.stringify(v)); };
  return [value, set];
}

// useDebounce
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// useToggle
function useToggle(initial = false): [boolean, () => void] {
  const [v, setV] = useState(initial);
  return [v, useCallback(() => setV((x) => !x), [])];
}
```
