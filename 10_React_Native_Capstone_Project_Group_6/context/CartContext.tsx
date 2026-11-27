import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartItem, Product, ProductSummary } from '@/types/product';

const CART_STORAGE_KEY = 'cart';

interface Coupon {
  code: string;
  percent: number;
  minSubtotal: number;
}

interface CartTotals {
  subtotal: number;
  productDiscount: number;
  couponDiscount: number;
  total: number;
  totalQuantity: number;
}

interface CartState {
  items: CartItem[];
  coupon: Coupon | null;
  isHydrated: boolean;
}

type CartAction =
  | { type: 'HYDRATE'; payload: CartState }
  | { type: 'SET_ITEMS'; payload: CartItem[] }
  | { type: 'SET_COUPON'; payload: Coupon | null };

interface CartContextType extends CartState {
  totals: CartTotals;
  couponCode: string | null;
  addItem: (product: Product | ProductSummary) => { ok: boolean; message: string };
  setQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => { ok: boolean; message: string };
  removeCoupon: () => void;
  totalQuantity: number;
}

const initialState: CartState = {
  items: [],
  coupon: null,
  isHydrated: false,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;
    case 'SET_ITEMS':
      return { ...state, items: action.payload };
    case 'SET_COUPON':
      return { ...state, coupon: action.payload };
    default:
      return state;
  }
}

function toCartItem(product: Product | ProductSummary): CartItem {
  return {
    productId: product.id,
    title: product.title,
    thumbnail: product.thumbnail,
    price: product.price,
    discountPercentage: product.discountPercentage,
    quantity: 1,
    stock: product.stock,
  };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(CART_STORAGE_KEY)
      .then((stored) => {
        if (!active) return;
        if (!stored) {
          dispatch({ type: 'HYDRATE', payload: { ...initialState, isHydrated: true } });
          return;
        }
        const parsed = JSON.parse(stored) as Partial<CartState>;
        dispatch({
          type: 'HYDRATE',
          payload: {
            items: Array.isArray(parsed.items) ? parsed.items : [],
            coupon: parsed.coupon ?? null,
            isHydrated: true,
          },
        });
      })
      .catch(() => {
        if (active) {
          dispatch({ type: 'HYDRATE', payload: { ...initialState, isHydrated: true } });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!state.isHydrated) return;
    AsyncStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ items: state.items, coupon: state.coupon })
    ).catch(() => undefined);
  }, [state.items, state.coupon, state.isHydrated]);

  const totals = useMemo(() => {
    const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const productDiscount = state.items.reduce(
      (sum, item) => sum + item.price * (item.discountPercentage / 100) * item.quantity,
      0
    );
    const totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);
    const afterProductDiscount = subtotal - productDiscount;
    const coupon = state.coupon;
    const eligible = coupon !== null && afterProductDiscount >= coupon.minSubtotal;
    const couponDiscount = eligible ? afterProductDiscount * (coupon.percent / 100) : 0;
    return {
      subtotal,
      productDiscount,
      couponDiscount,
      total: afterProductDiscount - couponDiscount,
      totalQuantity,
    };
  }, [state.items, state.coupon]);

  const addItem = useCallback(
    (product: Product | ProductSummary) => {
      const existing = state.items.find((item) => item.productId === product.id);
      if (existing && existing.quantity >= existing.stock) {
        return { ok: false, message: 'Maximum stock quantity reached.' };
      }

      const items = existing
        ? state.items.map((item) =>
            item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        : [...state.items, toCartItem(product)];
      dispatch({ type: 'SET_ITEMS', payload: items });
      return { ok: true, message: 'Added to your cart.' };
    },
    [state.items]
  );

  const setQuantity = useCallback(
    (productId: number, quantity: number) => {
      const items = state.items
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) }
            : item
        );
      dispatch({ type: 'SET_ITEMS', payload: items });
    },
    [state.items]
  );

  const removeItem = useCallback(
    (productId: number) => {
      dispatch({
        type: 'SET_ITEMS',
        payload: state.items.filter((item) => item.productId !== productId),
      });
    },
    [state.items]
  );

  const clearCart = useCallback(() => {
    dispatch({ type: 'SET_ITEMS', payload: [] });
  }, []);

  const applyCoupon = useCallback(
    (code: string) => {
      const normalized = code.trim().toUpperCase();
      const coupons: Record<string, Omit<Coupon, 'code'>> = {
        SAVE10: { percent: 10, minSubtotal: 0 },
        SAVE20: { percent: 20, minSubtotal: 100 },
      };
      const coupon = coupons[normalized];
      if (!coupon) {
        return { ok: false, message: 'Invalid coupon code.' };
      }
      dispatch({ type: 'SET_COUPON', payload: { code: normalized, ...coupon } });
      return { ok: true, message: `Coupon ${normalized} applied.` };
    },
    []
  );

  const removeCoupon = useCallback(() => {
    dispatch({ type: 'SET_COUPON', payload: null });
  }, []);

  const value: CartContextType = {
    ...state,
    totals,
    couponCode: state.coupon?.code ?? null,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    totalQuantity: totals.totalQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
