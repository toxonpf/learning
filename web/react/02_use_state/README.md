# Урок 2 — useState

## Зачем нужно состояние?

Обычные переменные в компоненте сбрасываются при каждом рендере. `useState` — специальное хранилище, изменение которого **вызывает перерисовку** компонента.

```tsx
// ❌ Не работает — переменная сбросится при следующем рендере
let count = 0;
count = count + 1;

// ✅ Работает — React знает об изменении и перерисует компонент
const [count, setCount] = useState(0);
setCount(count + 1);
```

---

## Синтаксис

```tsx
const [state, setState] = useState(initialValue);
```

- `state` — текущее значение
- `setState` — функция для обновления
- `initialValue` — начальное значение (выполняется только при первом рендере)

---

## Примеры

### Счётчик

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Счёт: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>−</button>
      <button onClick={() => setCount(0)}>Сброс</button>
    </div>
  );
}
```

### Строка

```tsx
function NameInput() {
  const [name, setName] = useState('');

  return (
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="Введи имя"
    />
  );
}
```

### Булево (переключатель)

```tsx
function Toggle() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div>
      <button onClick={() => setIsVisible(!isVisible)}>
        {isVisible ? 'Скрыть' : 'Показать'}
      </button>
      {isVisible && <p>Секретный текст!</p>}
    </div>
  );
}
```

### Объект

```tsx
function UserForm() {
  const [user, setUser] = useState({ name: '', age: 0 });

  // При обновлении объекта — копируй старые поля через spread
  const updateName = (name: string) => setUser({ ...user, name });

  return <input value={user.name} onChange={(e) => updateName(e.target.value)} />;
}
```

---

## Функциональное обновление

Если новое состояние зависит от предыдущего — передавай функцию, а не значение:

```tsx
// ❌ Может дать неправильный результат при быстрых кликах
setCount(count + 1);

// ✅ Всегда берёт актуальное предыдущее значение
setCount((prev) => prev + 1);
```

---

## Ленивая инициализация

Если начальное значение дорого вычислять — передай функцию:

```tsx
// ❌ Вычисляется при каждом рендере
const [data, setData] = useState(heavyComputation());

// ✅ Вычисляется только один раз
const [data, setData] = useState(() => heavyComputation());
```

---

## Важные правила

- `setState` не меняет состояние мгновенно — компонент перерисуется на следующем рендере
- Нельзя вызывать хуки внутри условий, циклов или вложенных функций — только на верхнем уровне компонента
- Несколько `useState` в одном компоненте — это нормально
