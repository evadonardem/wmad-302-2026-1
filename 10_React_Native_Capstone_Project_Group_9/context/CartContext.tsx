import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import type { CartItem } from '@/types/product';
import { productApi } from '@/services/productApi';
import { getStorageItem, setStorageItem } from '@/utils/storage';
import { useAuth } from '@/context/AuthContext';

interface PersistedCart {
  items: CartItem[];
  couponCode: string | null;
  couponPercent: number;
  remoteCartId: number | null;
}

interface CartState extends PersistedCart {
  ownerId: number | null;
  isLoading: boolean;
  error: string | null;
}

type CartAction =
  | { type: 'LOAD_START'; ownerId: number | null }
  | { type: 'HYDRATE'; ownerId: number | null; cart: PersistedCart; error: string | null }
  | { type: 'ADD'; item: CartItem }
  | { type: 'UPDATE_QUANTITY'; productId: number; quantity: number }
  | { type: 'REMOVE'; productId: number }
  | { type: 'APPLY_COUPON'; code: string; percent: number }
  | { type: 'CLEAR_COUPON' }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_ERROR'; error: string | null };

const emptyPersistedCart: PersistedCart = {
  items: [],
  couponCode: null,
  couponPercent: 0,
  remoteCartId: null,
};

const initialState: CartState = {
  ...emptyPersistedCart,
  ownerId: null,
  isLoading: true,
  error: null,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'LOAD_START':
      return {
        ...state,
        ...emptyPersistedCart,
        ownerId: action.ownerId,
        isLoading: true,
        error: null,
      };
    case 'HYDRATE':
      return {
        ...action.cart,
        ownerId: action.ownerId,
        isLoading: false,
        error: action.error,
      };
    case 'ADD': {
      const currentItem = state.items.find((item) => item.productId === action.item.productId);
      if (currentItem) {
        const quantity = Math.min(currentItem.quantity + action.item.quantity, currentItem.stock);
        return {
          ...state,
          items: state.items.map((item) =>
            item.productId === action.item.productId ? { ...item, quantity } : item
          ),
          error: null,
        };
      }
      return { ...state, items: [...state.items, action.item], error: null };
    }
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items
          .map((item) => item.productId === action.productId
            ? { ...item, quantity: Math.min(action.quantity, item.stock) }
            : item)
          .filter((item) => item.quantity > 0),
        error: null,
      };
    case 'REMOVE':
      return {
        ...state,
        items: state.items.filter((item) => item.productId !== action.productId),
        error: null,
      };
    case 'APPLY_COUPON':
      return { ...state, couponCode: action.code, couponPercent: action.percent, error: null };
    case 'CLEAR_COUPON':
      return { ...state, couponCode: null, couponPercent: 0, error: null };
    case 'CLEAR_CART':
      return { ...state, ...emptyPersistedCart, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    default:
      return state;
  }
}

interface CartContextValue extends CartState {
  itemCount: number;
  subtotal: number;
  productDiscount: number;
  couponDiscount: number;
  total: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  applyCoupon: (code: string) => void;
  clearCoupon: () => void;
  clearCart: () => void;
  clearError: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function cartItemFromApiProduct(product: Awaited<ReturnType<typeof productApi.getProductById>>): CartItem {
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

async function loadCartForUser(ownerId: number | null, isLocalUser: boolean): Promise<PersistedCart> {
  if (ownerId === null) {
    return emptyPersistedCart;
  }

  const savedCarts = await getStorageItem<Record<string, PersistedCart>>('user_carts');
  const savedCart = savedCarts?.[String(ownerId)];
  if (savedCart) return savedCart;
  if (isLocalUser) return emptyPersistedCart;

  const response = await productApi.getUserCart(ownerId);
  const remoteCart = response.carts[0];
  if (!remoteCart) return emptyPersistedCart;

  const items = await Promise.all(remoteCart.products.map(async (remoteItem) => {
    const product = await productApi.getProductById(remoteItem.id);
    return { ...cartItemFromApiProduct(product), quantity: remoteItem.quantity };
  }));
  return {
    ...emptyPersistedCart,
    items,
    remoteCartId: remoteCart.id,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const persistQueue = useRef(Promise.resolve());
  const ownerId = user?.id ?? null;
  const isLocalUser = user?.token?.startsWith('local-access-') ?? false;

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    dispatch({ type: 'LOAD_START', ownerId });
    const hydrate = async () => {
      try {
        const result = await loadCartForUser(ownerId, isLocalUser);
        if (active) {
          dispatch({ type: 'HYDRATE', ownerId, cart: result, error: null });
        }
      } catch (error) {
        if (active) {
          const message = error instanceof Error ? error.message : 'Unable to load your cart.';
          dispatch({ type: 'HYDRATE', ownerId, cart: emptyPersistedCart, error: message });
        }
      }
    };
    void hydrate();
    return () => {
      active = false;
    };
  }, [authLoading, isLocalUser, ownerId]);

  useEffect(() => {
    if (state.isLoading || state.error || ownerId === null || state.ownerId !== ownerId) return;
    const snapshot: PersistedCart = {
      items: state.items,
      couponCode: state.couponCode,
      couponPercent: state.couponPercent,
      remoteCartId: state.remoteCartId,
    };
    persistQueue.current = persistQueue.current
      .then(async () => {
        const savedCarts = (await getStorageItem<Record<string, PersistedCart>>('user_carts')) ?? {};
        await setStorageItem('user_carts', { ...savedCarts, [String(ownerId)]: snapshot });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unable to save your cart.';
        dispatch({ type: 'SET_ERROR', error: message });
      });
  }, [
    ownerId,
    state.couponCode,
    state.couponPercent,
    state.error,
    state.isLoading,
    state.items,
    state.ownerId,
    state.remoteCartId,
  ]);

  const addItem = useCallback((item: CartItem) => {
    if (item.stock <= 0) {
      dispatch({ type: 'SET_ERROR', error: `${item.title} is out of stock.` });
      return;
    }
    dispatch({ type: 'ADD', item });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', productId, quantity });
  }, []);

  const removeItem = useCallback((productId: number) => {
    dispatch({ type: 'REMOVE', productId });
  }, []);

  const applyCoupon = useCallback((input: string) => {
    const code = input.trim().toUpperCase();
    const coupons: Record<string, number> = { SAVE10: 10, WELCOME15: 15 };
    const percent = coupons[code];
    if (!percent) {
      dispatch({ type: 'SET_ERROR', error: 'Invalid coupon. Try SAVE10 or WELCOME15.' });
      return;
    }
    dispatch({ type: 'APPLY_COUPON', code, percent });
  }, []);

  const clearCoupon = useCallback(() => dispatch({ type: 'CLEAR_COUPON' }), []);
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);
  const clearError = useCallback(() => dispatch({ type: 'SET_ERROR', error: null }), []);

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const productDiscountedTotal = state.items.reduce(
    (sum, item) => sum + item.price * (1 - item.discountPercentage / 100) * item.quantity,
    0
  );
  const productDiscount = subtotal - productDiscountedTotal;
  const couponDiscount = productDiscountedTotal * state.couponPercent / 100;
  const total = Math.max(0, productDiscountedTotal - couponDiscount);

  const contextValue = useMemo(() => ({
    ...state,
    itemCount,
    subtotal,
    productDiscount,
    couponDiscount,
    total,
    addItem,
    updateQuantity,
    removeItem,
    applyCoupon,
    clearCoupon,
    clearCart,
    clearError,
  }), [
    state, itemCount, subtotal, productDiscount, couponDiscount, total,
    addItem, updateQuantity, removeItem, applyCoupon, clearCoupon, clearCart, clearError,
  ]);

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
