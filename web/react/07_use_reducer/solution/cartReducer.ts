export interface Product {
  id: number;
  name: string;
  price: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface CartState {
  items: CartItem[];
}

export type CartAction =
  | { type: 'add'; product: Product }
  | { type: 'remove'; id: number }
  | { type: 'increment'; id: number }
  | { type: 'decrement'; id: number }
  | { type: 'clear' };

export const initialCartState: CartState = { items: [] };

export function cartReducer(state: CartState, action: CartAction): CartState {
  // твой код здесь
  return state;
}
