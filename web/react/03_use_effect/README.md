# Урок 3 — useEffect

## Что такое сайд-эффект?

Сайд-эффект — всё, что выходит за рамки рендера: запросы к API, подписки, таймеры, работа с DOM. `useEffect` позволяет выполнять такой код синхронизированно с рендером.

---

## Синтаксис

```tsx
useEffect(() => {
  // код эффекта

  return () => {
    // функция очистки (необязательна)
  };
}, [dependencies]);
```

---

## Три режима работы

### 1. Без зависимостей — каждый рендер

```tsx
useEffect(() => {
  console.log('компонент перерисовался');
});
```

### 2. Пустой массив `[]` — только при монтировании

```tsx
useEffect(() => {
  console.log('компонент появился в DOM');
}, []);
```

### 3. С зависимостями — при изменении конкретных значений

```tsx
useEffect(() => {
  console.log('userId изменился:', userId);
}, [userId]);
```

---

## Пример: загрузка данных

```tsx
interface User {
  id: number;
  name: string;
}

function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    fetch(`https://jsonplaceholder.typicode.com/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      });
  }, [userId]); // перезапускается при смене userId

  if (loading) return <p>Загрузка...</p>;
  return <p>{user?.name}</p>;
}
```

---

## Функция очистки

Возвращается из эффекта. Вызывается перед следующим запуском эффекта и при размонтировании.

### Таймер

```tsx
useEffect(() => {
  const id = setInterval(() => {
    setTime(new Date());
  }, 1000);

  return () => clearInterval(id); // очищаем при размонтировании
}, []);
```

### Подписка на событие

```tsx
useEffect(() => {
  const handleResize = () => setWidth(window.innerWidth);
  window.addEventListener('resize', handleResize);

  return () => window.removeEventListener('resize', handleResize);
}, []);
```

---

## AbortController — отмена запроса

Проблема: компонент размонтировался, а запрос ещё летит — setState вызовется на мёртвом компоненте.

```tsx
useEffect(() => {
  const controller = new AbortController();

  fetch(url, { signal: controller.signal })
    .then((res) => res.json())
    .then(setData)
    .catch((err) => {
      if (err.name !== 'AbortError') throw err;
    });

  return () => controller.abort();
}, [url]);
```

---

## Частые ошибки

```tsx
// ❌ Бесконечный цикл — объект создаётся заново каждый рендер
const options = { page: 1 };
useEffect(() => { fetchData(options); }, [options]);

// ✅ Примитив в зависимостях или useMemo
useEffect(() => { fetchData({ page }); }, [page]);
```

```tsx
// ❌ async прямо в useEffect
useEffect(async () => { ... }); // нельзя!

// ✅ async функция внутри
useEffect(() => {
  async function load() {
    const data = await fetch(url).then(r => r.json());
    setData(data);
  }
  load();
}, [url]);
```
