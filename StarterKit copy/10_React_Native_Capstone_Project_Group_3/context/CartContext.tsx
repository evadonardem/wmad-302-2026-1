/**
 * Cart Context with useReducer + AsyncStorage persistence
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, ReactNode } from 'react';
import type { CartItem, Product, ProductSummary } from '@/types/product';
import { cartStorage } from '@/utils/storage';
import { calculateCartTotals, CartTotals, getCouponError } from '@/utils/cart';
import { cartReducer, initialCartState } from './cartReducer';

interface CartContextType {
  items: CartItem[];
  couponCode: string | null;
  hydrated: boolean;
  totals: CartTotals;
  addItem: (product: ProductSummary | Product, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  /** Returns an error message, or null when the coupon was applied. */
  /** Returns an error message, or null when applied. Reward coupons need to be in `unlockedCodes`. */
  applyCoupon: (code: string, unlockedCodes?: string[]) => string | null;
  removeCoupon: () => void;
  clearCart: () => void;
  getQuantity: (productId: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  // Load the persisted cart once
  useEffect(() => {
    cartStorage.getCart().then((items) => dispatch({ type: 'HYDRATE', payload: { items } }));
  }, []);

  // Persist on every change after hydration (so we never overwrite the stored cart with [])
  useEffect(() => {
    if (!state.hydrated) return;
    cartStorage.setCart(state.items).catch(() => {
      // Logged in setStorageItem; the in-memory cart stays usable
    });
  }, [state.items, state.hydrated]);

  const totals = useMemo(
    () => calculateCartTotals(state.items, state.couponCode),
    [state.items, state.couponCode]
  );

  const addItem = useCallback((product: ProductSummary | Product, quantity = 1) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        quantity,
        item: {
          productId: product.id,
          title: product.title,
          thumbnail: product.thumbnail,
          price: product.price,
          discountPercentage: product.discountPercentage,
          stock: product.stock,
        },
      },
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  }, []);

  const removeItem = useCallback((productId: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } });
  }, []);

  const applyCoupon = useCallback(
    (code: string, unlockedCodes: string[] = []) => {
      const error = getCouponError(code, totals.discountedSubtotal, unlockedCodes);
      if (error) return error;
      dispatch({ type: 'APPLY_COUPON', payload: { code } });
      return null;
    },
    [totals.discountedSubtotal]
  );

  const removeCoupon = useCallback(() => dispatch({ type: 'REMOVE_COUPON' }), []);
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  const getQuantity = useCallback(
    (productId: number) => state.items.find((i) => i.productId === productId)?.quantity ?? 0,
    [state.items]
  );

  const value = useMemo<CartContextType>(
    () => ({
      items: state.items,
      couponCode: state.couponCode,
      hydrated: state.hydrated,
      totals,
      addItem,
      updateQuantity,
      removeItem,
      applyCoupon,
      removeCoupon,
      clearCart,
      getQuantity,
    }),
    [state, totals, addItem, updateQuantity, removeItem, applyCoupon, removeCoupon, clearCart, getQuantity]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
