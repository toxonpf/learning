# ДЗ 7 — Корзина через useReducer

Свои решения клади в папку `solution/`.

---

## Задание

Перепиши корзину из урока 5 с использованием `useReducer` вместо `useState`.

### Состояние:

```tsx
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}
```

### Действия:

```tsx
type CartAction =
  | { type: 'add'; product: Product }
  | { type: 'remove'; id: number }
  | { type: 'increment'; id: number }
  | { type: 'decrement'; id: number }
  | { type: 'clear' };
```

### Логика:
- `add` — добавить товар (если уже есть — увеличить `quantity`)
- `remove` — удалить товар полностью
- `increment` / `decrement` — изменить количество (минимум 1)
- `clear` — очистить корзину

---

## Требования

- [ ] Весь стейт корзины управляется одним редьюсером
- [ ] Редьюсер вынесен в отдельный файл `cartReducer.ts`
- [ ] В корзине показывается количество и сумма по каждому товару
- [ ] Итоговая сумма считается правильно

---

## Бонус

- Объедини `useReducer` + `useContext` — доступ к корзине из любого компонента
- Напиши unit-тесты для редьюсера (чистая функция — легко тестировать!)
