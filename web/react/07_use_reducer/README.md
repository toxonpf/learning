# Урок 7 — useReducer

## Когда useState недостаточно

`useState` хорошо работает для простых значений. Когда логика обновления становится сложной — несколько взаимосвязанных состояний, много разных действий — `useReducer` делает код чище.

| useState | useReducer |
|----------|------------|
| 1-2 независимых значения | Много взаимосвязанных полей |
| Простая логика обновления | Сложная логика с несколькими ветками |
| — | Удобно тестировать редьюсер отдельно |

---

## Синтаксис

```tsx
const [state, dispatch] = useReducer(reducer, initialState);
```

- `state` — текущее состояние
- `dispatch(action)` — отправить действие
- `reducer(state, action) => newState` — чистая функция, возвращает новое состояние
- `initialState` — начальное состояние

---

## Пример: счётчик

```tsx
type Action = { type: 'increment' } | { type: 'decrement' } | { type: 'reset' };

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case 'increment': return state + 1;
    case 'decrement': return state - 1;
    case 'reset': return 0;
    default: return state;
  }
}

function Counter() {
  const [count, dispatch] = useReducer(reducer, 0);

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>−</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Сброс</button>
    </div>
  );
}
```

---

## Пример: список задач (сложная логика)

```tsx
interface Todo {
  id: number;
  text: string;
  done: boolean;
}

type TodoAction =
  | { type: 'add'; text: string }
  | { type: 'toggle'; id: number }
  | { type: 'delete'; id: number }
  | { type: 'clear_done' };

function todoReducer(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case 'add':
      return [...state, { id: Date.now(), text: action.text, done: false }];
    case 'toggle':
      return state.map((t) => t.id === action.id ? { ...t, done: !t.done } : t);
    case 'delete':
      return state.filter((t) => t.id !== action.id);
    case 'clear_done':
      return state.filter((t) => !t.done);
    default:
      return state;
  }
}

function TodoList() {
  const [todos, dispatch] = useReducer(todoReducer, []);
  const [input, setInput] = useState('');

  const handleAdd = () => {
    if (!input.trim()) return;
    dispatch({ type: 'add', text: input });
    setInput('');
  };

  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={handleAdd}>Добавить</button>
      {todos.map((todo) => (
        <div key={todo.id}>
          <span
            style={{ textDecoration: todo.done ? 'line-through' : 'none' }}
            onClick={() => dispatch({ type: 'toggle', id: todo.id })}
          >
            {todo.text}
          </span>
          <button onClick={() => dispatch({ type: 'delete', id: todo.id })}>✕</button>
        </div>
      ))}
      <button onClick={() => dispatch({ type: 'clear_done' })}>Очистить выполненные</button>
    </div>
  );
}
```

---

## useReducer + useContext

Мощный паттерн: `useReducer` для логики + `useContext` для доступа из любого компонента.

```tsx
const StoreContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}
```
