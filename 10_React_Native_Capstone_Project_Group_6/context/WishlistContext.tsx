import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProductSummary } from '@/types/product';

const STORAGE_KEY = 'marketplace_wishlist';

interface WishlistContextValue {
  items: ProductSummary[];
  count: number;
  isWishlisted: (id: number) => boolean;
  toggle: (product: ProductSummary) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ProductSummary[]>([]);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!active || !stored) return;
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) setItems(parsed as ProductSummary[]);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => undefined);
  }, [items]);

  const isWishlisted = useCallback((id: number) => items.some((item) => item.id === id), [items]);
  const toggle = useCallback((product: ProductSummary) => {
    const saved = !items.some((item) => item.id === product.id);
    setItems((current) =>
      saved
        ? [...current, product]
        : current.filter((item) => item.id !== product.id),
    );
    return saved;
  }, [items]);

  const value = useMemo(() => ({ items, count: items.length, isWishlisted, toggle }), [items, isWishlisted, toggle]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
}
