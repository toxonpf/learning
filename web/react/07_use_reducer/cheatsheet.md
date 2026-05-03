# Шпаргалка — useReducer

```tsx
// Типы действий
type Action =
  | { type: 'increment' }
  | { type: 'add'; payload: string }
  | { type: 'delete'; id: number };

// Редьюсер — чистая функция
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment': return { ...state, count: state.count + 1 };
    case 'add': return { ...state, items: [...state.items, action.payload] };
    case 'delete': return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    default: return state;
  }
}

// Использование
const [state, dispatch] = useReducer(reducer, initialState);

dispatch({ type: 'increment' });
dispatch({ type: 'add', payload: 'новый элемент' });
dispatch({ type: 'delete', id: 5 });
```
