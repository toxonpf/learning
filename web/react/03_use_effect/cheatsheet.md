# Шпаргалка — useEffect

```tsx
// При каждом рендере
useEffect(() => { ... });

// Только при монтировании
useEffect(() => { ... }, []);

// При изменении значения
useEffect(() => { ... }, [value]);

// С очисткой
useEffect(() => {
  const id = setInterval(fn, 1000);
  return () => clearInterval(id);
}, []);

// Загрузка данных (правильный паттерн)
useEffect(() => {
  const controller = new AbortController();

  async function load() {
    const res = await fetch(url, { signal: controller.signal });
    const data = await res.json();
    setData(data);
  }

  load();
  return () => controller.abort();
}, [url]);

// Подписка на событие
useEffect(() => {
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);
```
