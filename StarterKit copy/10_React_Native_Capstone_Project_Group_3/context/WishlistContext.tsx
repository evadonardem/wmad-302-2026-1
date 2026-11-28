/**
 * Wishlist Context - saved products, persisted to AsyncStorage
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { Product, ProductSummary } from '@/types/product';
import { wishlistStorage } from '@/utils/storage';

interface WishlistContextType {
  items: ProductSummary[];
  isInWishlist: (productId: number) => boolean;
  /** Adds or removes the product. Returns true when it is now in the wishlist. */
  toggle: (product: ProductSummary | Product) => boolean;
  remove: (productId: number) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

function toSummary(product: ProductSummary | Product): ProductSummary {
  const { id, title, thumbnail, category, price, discountPercentage, rating, stock, brand } = product;
  return { id, title, thumbnail, category, price, discountPercentage, rating, stock, brand };
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ProductSummary[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    wishlistStorage.getItems().then((stored) => {
      setItems(stored);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) wishlistStorage.setItems(items).catch(() => undefined);
  }, [items, hydrated]);

  const isInWishlist = useCallback((productId: number) => items.some((i) => i.id === productId), [items]);

  const toggle = useCallback(
    (product: ProductSummary | Product) => {
      const exists = items.some((i) => i.id === product.id);
      setItems((prev) =>
        exists ? prev.filter((i) => i.id !== product.id) : [toSummary(product), ...prev]
      );
      return !exists;
    },
    [items]
  );

  const remove = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.id !== productId));
  }, []);

  const value = useMemo(() => ({ items, isInWishlist, toggle, remove }), [items, isInWishlist, toggle, remove]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextType {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
