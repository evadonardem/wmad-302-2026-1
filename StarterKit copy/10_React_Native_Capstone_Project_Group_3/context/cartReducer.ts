/**
 * Cart reducer - pure state transitions for CartContext
 */
import type { CartItem } from '@/types/product';

export interface CartState {
  items: CartItem[];
  couponCode: string | null;
  /** False until the persisted cart has been loaded from AsyncStorage. */
  hydrated: boolean;
}

export type CartAction =
  | { type: 'HYDRATE'; payload: { items: CartItem[] } }
  | { type: 'ADD_ITEM'; payload: { item: Omit<CartItem, 'quantity'>; quantity: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: number; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: number } }
  | { type: 'APPLY_COUPON'; payload: { code: string } }
  | { type: 'REMOVE_COUPON' }
  | { type: 'CLEAR' };

export const initialCartState: CartState = {
  items: [],
  couponCode: null,
  hydrated: false,
};

/** Keeps a quantity between 1 and the available stock. */
function clampQuantity(quantity: number, stock: number): number {
  const max = Math.max(stock, 1);
  return Math.min(Math.max(Math.floor(quantity), 1), max);
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, items: action.payload.items, hydrated: true };

    case 'ADD_ITEM': {
      const { item, quantity } = action.payload;
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, ...item, quantity: clampQuantity(i.quantity + quantity, item.stock) }
              : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...item, quantity: clampQuantity(quantity, item.stock) }],
      };
    }

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.productId !== productId) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === productId ? { ...i, quantity: clampQuantity(quantity, i.stock) } : i
        ),
      };
    }

    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.productId !== action.payload.productId) };

    case 'APPLY_COUPON':
      return { ...state, couponCode: action.payload.code.trim().toUpperCase() };

    case 'REMOVE_COUPON':
      return { ...state, couponCode: null };

    case 'CLEAR':
      return { ...state, items: [], couponCode: null };

    default:
      return state;
  }
}
