# Шпаргалка — useState

```tsx
// Базовый синтаксис
const [value, setValue] = useState<Type>(initial);

// Примитивы
const [count, setCount] = useState(0);
const [name, setName] = useState('');
const [flag, setFlag] = useState(false);

// Объект — всегда spread при обновлении
const [user, setUser] = useState({ name: '', age: 0 });
setUser({ ...user, name: 'Алексей' });

// Массив — всегда новый массив
const [items, setItems] = useState<string[]>([]);
setItems([...items, 'новый элемент']);          // добавить
setItems(items.filter((i) => i !== 'убрать'));  // удалить

// Функциональное обновление (если зависит от предыдущего)
setCount((prev) => prev + 1);

// Ленивая инициализация (дорогое вычисление)
const [data, setData] = useState(() => heavyFn());

// Переключатель
setFlag((prev) => !prev);
```
