# ДЗ TS 2 — Модели данных

Свои решения клади в папку `solution/`.

---

## Задание

Смоделируй типы для интернет-магазина.

### 1. Базовые сущности

Опиши интерфейсы:

```
Product:
  - id (readonly)
  - name
  - price
  - description (опционально)
  - category
  - inStock: boolean

Category:
  - id (readonly)
  - name
  - slug (только буквы и дефис)

CartItem:
  - product: Product
  - quantity: number

Order:
  - id (readonly)
  - items: CartItem[]
  - status: 'pending' | 'processing' | 'shipped' | 'delivered'
  - createdAt: Date
  - total: number (readonly)
```

### 2. Расширение

```ts
// Создай интерфейс DiscountedProduct — Product плюс:
// - discount: number (процент скидки 0-100)
// - originalPrice: number (цена до скидки)

// Создай функцию applyDiscount(product: Product, discountPercent: number): DiscountedProduct
```

### 3. Функции

```ts
// calculateTotal(items: CartItem[]): number
// Посчитать сумму: quantity * price для каждого CartItem

// groupByCategory(products: Product[]): Record<string, Product[]>
// Сгруппировать продукты по полю category
```

---

## Требования

- [ ] Все интерфейсы описаны корректно
- [ ] `applyDiscount` возвращает именно `DiscountedProduct`
- [ ] `groupByCategory` использует `Record<string, Product[]>`
- [ ] Нигде нет `any`
