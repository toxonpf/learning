import { useReducer } from 'react';
import { cartReducer, initialCartState, Product } from './cartReducer';

const PRODUCTS: Product[] = [
  { id: 1, name: 'Ноутбук', price: 50000 },
  { id: 2, name: 'Мышь', price: 1500 },
  { id: 3, name: 'Клавиатура', price: 3000 },
  { id: 4, name: 'Монитор', price: 25000 },
  { id: 5, name: 'Наушники', price: 5000 },
];

export function CartApp() {
  const [cart, dispatch] = useReducer(cartReducer, initialCartState);

  return (
    <div>
      {/* твой код здесь */}
    </div>
  );
}
