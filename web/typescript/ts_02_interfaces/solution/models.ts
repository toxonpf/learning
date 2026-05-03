// 1. Базовые интерфейсы
export interface Product {
  // твой код здесь
}

export interface Category {
  // твой код здесь
}

export interface CartItem {
  // твой код здесь
}

export interface Order {
  // твой код здесь
}

// 2. Расширение
export interface DiscountedProduct extends Product {
  // твой код здесь
}

export function applyDiscount(product: Product, discountPercent: number): DiscountedProduct {
  // твой код здесь
  return {} as DiscountedProduct;
}

// 3. Функции
export function calculateTotal(items: CartItem[]): number {
  // твой код здесь
  return 0;
}

export function groupByCategory(products: Product[]): Record<string, Product[]> {
  // твой код здесь
  return {};
}
