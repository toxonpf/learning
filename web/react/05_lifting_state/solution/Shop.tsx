import { useState } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
}

const PRODUCTS: Product[] = [
  { id: 1, name: 'Ноутбук', price: 50000 },
  { id: 2, name: 'Мышь', price: 1500 },
  { id: 3, name: 'Клавиатура', price: 3000 },
  { id: 4, name: 'Монитор', price: 25000 },
  { id: 5, name: 'Наушники', price: 5000 },
];

function ProductList({ products, cart, onAdd }: {
  products: Product[];
  cart: Product[];
  onAdd: (p: Product) => void;
}) {
  return (
    <div>
      {/* твой код здесь */}
    </div>
  );
}

function Cart({ items, onRemove }: {
  items: Product[];
  onRemove: (id: number) => void;
}) {
  return (
    <div>
      {/* твой код здесь */}
    </div>
  );
}

export function Shop() {
  const [cart, setCart] = useState<Product[]>([]);

  return (
    <div>
      {/* твой код здесь */}
    </div>
  );
}
