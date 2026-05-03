# Урок 5 — Поднятие состояния

## Проблема

Когда двум компонентам нужно одно и то же состояние — его нельзя хранить в обоих сразу. Нужно **поднять** состояние к ближайшему общему родителю и передавать вниз через props.

```
       App (state здесь)
      /        \
 ChildA       ChildB
(читает)     (меняет)
```

---

## Пример: фильтр и список

```tsx
// ❌ Состояние в каждом компоненте — они не знают друг о друге
function Filter() {
  const [query, setQuery] = useState(''); // изолировано
}

function List() {
  // не знает про query из Filter
}
```

```tsx
// ✅ Состояние поднято в родителя
function App() {
  const [query, setQuery] = useState('');
  const items = ['Яблоко', 'Банан', 'Вишня'];
  const filtered = items.filter((i) => i.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <Filter query={query} onQueryChange={setQuery} />
      <List items={filtered} />
    </div>
  );
}

function Filter({ query, onQueryChange }: { query: string; onQueryChange: (q: string) => void }) {
  return (
    <input value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder="Поиск..." />
  );
}

function List({ items }: { items: string[] }) {
  return <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>;
}
```

---

## Паттерн: коллбек для изменения состояния

Родитель передаёт функцию вниз — дочерний компонент вызывает её при событии.

```tsx
// Родитель
function Parent() {
  const [count, setCount] = useState(0);
  return <Child count={count} onIncrement={() => setCount((c) => c + 1)} />;
}

// Дочерний — не знает как работает состояние, просто вызывает коллбек
function Child({ count, onIncrement }: { count: number; onIncrement: () => void }) {
  return (
    <div>
      <p>{count}</p>
      <button onClick={onIncrement}>+1</button>
    </div>
  );
}
```

---

## Пример: корзина покупок

```tsx
interface Product {
  id: number;
  name: string;
  price: number;
}

function Shop() {
  const [cart, setCart] = useState<Product[]>([]);
  const products: Product[] = [
    { id: 1, name: 'Ноутбук', price: 50000 },
    { id: 2, name: 'Мышь', price: 1500 },
  ];

  const addToCart = (product: Product) => setCart((prev) => [...prev, product]);
  const removeFromCart = (id: number) => setCart((prev) => prev.filter((p) => p.id !== id));

  return (
    <div>
      <ProductList products={products} onAdd={addToCart} />
      <Cart items={cart} onRemove={removeFromCart} />
    </div>
  );
}

function ProductList({ products, onAdd }: { products: Product[]; onAdd: (p: Product) => void }) {
  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>
          {p.name} — {p.price}₽
          <button onClick={() => onAdd(p)}>В корзину</button>
        </li>
      ))}
    </ul>
  );
}

function Cart({ items, onRemove }: { items: Product[]; onRemove: (id: number) => void }) {
  const total = items.reduce((sum, p) => sum + p.price, 0);
  return (
    <div>
      <h3>Корзина: {total}₽</h3>
      {items.map((p) => (
        <div key={p.id}>
          {p.name} <button onClick={() => onRemove(p.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}
```

---

## Когда поднимать состояние?

| Ситуация | Решение |
|----------|---------|
| Только один компонент использует состояние | Держи локально |
| Два соседних компонента используют одно состояние | Подними к их общему родителю |
| Состояние нужно везде в приложении | `useContext` (следующий урок) |
