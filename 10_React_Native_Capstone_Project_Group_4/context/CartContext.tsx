/**
 * Cart & Commerce Context with useReducer + AsyncStorage Persistence
 * Manages: Shopping Cart, Coupons, Checkout Orders, and Wishlist
 */
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, CartItem, OrderRecord } from '@/types/product';

const CART_STORAGE_KEY = 'marketplace_cart_v1';
const WISHLIST_STORAGE_KEY = 'marketplace_wishlist_v1';
const ORDERS_STORAGE_KEY = 'marketplace_orders_v1';

export const AVAILABLE_COUPONS: Record<string, { discountPct: number; label: string }> = {
  SAVE10: { discountPct: 10, label: '10% Off Your Order' },
  WELCOME20: { discountPct: 20, label: '20% New Shopper Deal' },
  DEAL15: { discountPct: 15, label: '15% Flash Voucher' },
};

export interface CartState {
  items: CartItem[];
  couponCode: string | null;
  wishlist: Product[];
  localOrders: OrderRecord[];
  isHydrated: boolean;
}

export type CartAction =
  | { type: 'HYDRATE_ALL'; payload: { items: CartItem[]; wishlist: Product[]; localOrders: OrderRecord[] } }
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: number; quantity: number } }
  | { type: 'APPLY_COUPON'; payload: string | null }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_WISHLIST'; payload: Product }
  | { type: 'ADD_ORDER'; payload: OrderRecord };

export const initialCartState: CartState = {
  items: [],
  couponCode: null,
  wishlist: [],
  localOrders: [],
  isHydrated: false,
};

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE_ALL':
      return {
        ...state,
        items: action.payload.items,
        wishlist: action.payload.wishlist,
        localOrders: action.payload.localOrders,
        isHydrated: true,
      };

    case 'ADD_ITEM': {
      const { product, quantity = 1 } = action.payload;
      const existing = state.items.find((i) => i.productId === product.id);
      const maxStock = Math.max(1, product.stock || 99);

      if (existing) {
        const nextQty = Math.min(maxStock, existing.quantity + quantity);
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === product.id ? { ...i, quantity: nextQty } : i
          ),
        };
      }

      const newItem: CartItem = {
        id: product.id,
        productId: product.id,
        title: product.title,
        thumbnail: product.thumbnail,
        price: product.price,
        discountPercentage: product.discountPercentage || 0,
        quantity: Math.min(maxStock, Math.max(1, quantity)),
        stock: maxStock,
        brand: product.brand,
        category: product.category,
      };

      return {
        ...state,
        items: [newItem, ...state.items],
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((i) => i.productId !== action.payload),
      };

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => i.productId !== productId),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.min(i.stock, quantity) }
            : i
        ),
      };
    }

    case 'APPLY_COUPON':
      return {
        ...state,
        couponCode: action.payload,
      };

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        couponCode: null,
      };

    case 'TOGGLE_WISHLIST': {
      const exists = state.wishlist.some((p) => p.id === action.payload.id);
      return {
        ...state,
        wishlist: exists
          ? state.wishlist.filter((p) => p.id !== action.payload.id)
          : [action.payload, ...state.wishlist],
      };
    }

    case 'ADD_ORDER':
      return {
        ...state,
        localOrders: [action.payload, ...state.localOrders],
      };

    default:
      return state;
  }
}

interface CartTotals {
  subtotal: number;
  productDiscount: number;
  couponDiscount: number;
  finalTotal: number;
  totalProducts: number;
  totalQuantity: number;
}

interface CartContextType extends CartState {
  totals: CartTotals;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  applyCoupon: (code: string) => { valid: boolean; message: string };
  removeCoupon: () => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  isWishlisted: (productId: number) => boolean;
  recordOrder: (order: OrderRecord) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  // Hydrate Cart, Wishlist & Local Orders from AsyncStorage
  useEffect(() => {
    const loadPersisted = async () => {
      try {
        const [rawCart, rawWish, rawOrders] = await Promise.all([
          AsyncStorage.getItem(CART_STORAGE_KEY),
          AsyncStorage.getItem(WISHLIST_STORAGE_KEY),
          AsyncStorage.getItem(ORDERS_STORAGE_KEY),
        ]);
        dispatch({
          type: 'HYDRATE_ALL',
          payload: {
            items: rawCart ? JSON.parse(rawCart) : [],
            wishlist: rawWish ? JSON.parse(rawWish) : [],
            localOrders: rawOrders ? JSON.parse(rawOrders) : [],
          },
        });
      } catch {
        dispatch({
          type: 'HYDRATE_ALL',
          payload: { items: [], wishlist: [], localOrders: [] },
        });
      }
    };
    loadPersisted();
  }, []);

  // Persist changes to AsyncStorage
  useEffect(() => {
    if (!state.isHydrated) return;
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items)).catch(() => {});
  }, [state.items, state.isHydrated]);

  useEffect(() => {
    if (!state.isHydrated) return;
    AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(state.wishlist)).catch(() => {});
  }, [state.wishlist, state.isHydrated]);

  useEffect(() => {
    if (!state.isHydrated) return;
    AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(state.localOrders)).catch(() => {});
  }, [state.localOrders, state.isHydrated]);

  const totals = useMemo<CartTotals>(() => {
    const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const afterItemDiscounts = state.items.reduce(
      (sum, item) =>
        sum + item.price * (1 - item.discountPercentage / 100) * item.quantity,
      0
    );
    const productDiscount = Math.max(0, subtotal - afterItemDiscounts);

    const couponInfo = state.couponCode ? AVAILABLE_COUPONS[state.couponCode] : null;
    const couponDiscount = couponInfo
      ? afterItemDiscounts * (couponInfo.discountPct / 100)
      : 0;

    const finalTotal = Math.max(0, afterItemDiscounts - couponDiscount);
    const totalProducts = state.items.length;
    const totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      subtotal,
      productDiscount,
      couponDiscount,
      finalTotal,
      totalProducts,
      totalQuantity,
    };
  }, [state.items, state.couponCode]);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  }, []);

  const applyCoupon = useCallback((rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      return { valid: false, message: 'Enter a promo code first.' };
    }
    const found = AVAILABLE_COUPONS[code];
    if (!found) {
      return {
        valid: false,
        message: 'Invalid code. Try SAVE10, WELCOME20, or DEAL15.',
      };
    }
    dispatch({ type: 'APPLY_COUPON', payload: code });
    return { valid: true, message: `Applied ${code}: ${found.label}!` };
  }, []);

  const removeCoupon = useCallback(() => {
    dispatch({ type: 'APPLY_COUPON', payload: null });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const toggleWishlist = useCallback((product: Product) => {
    dispatch({ type: 'TOGGLE_WISHLIST', payload: product });
  }, []);

  const isWishlisted = useCallback(
    (productId: number) => state.wishlist.some((p) => p.id === productId),
    [state.wishlist]
  );

  const recordOrder = useCallback((order: OrderRecord) => {
    dispatch({ type: 'ADD_ORDER', payload: order });
  }, []);

  return (
    <CartContext.Provider
      value={{
        ...state,
        totals,
        addToCart,
        removeFromCart,
        updateQuantity,
        applyCoupon,
        removeCoupon,
        clearCart,
        toggleWishlist,
        isWishlisted,
        recordOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}