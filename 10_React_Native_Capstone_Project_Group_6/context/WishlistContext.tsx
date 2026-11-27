import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProductSummary } from '@/types/product';
import { getErrorMessage } from '@/utils/errors';

const STORAGE_KEY = 'marketplace_wishlist';

function isProductSummary(value: unknown): value is ProductSummary {
  if (typeof value !== 'object' || value === null) return false;
  const product = value as Record<string, unknown>;
  return (
    typeof product.id === 'number' &&
    typeof product.title === 'string' &&
    typeof product.category === 'string' &&
    typeof product.thumbnail === 'string' &&
    typeof product.price === 'number' &&
    typeof product.discountPercentage === 'number' &&
    typeof product.rating === 'number' &&
    typeof product.stock === 'number'
  );
}

interface WishlistContextValue {
  items: ProductSummary[];
  count: number;
  isHydrated: boolean;
  error: string | null;
  isWishlisted: (id: number) => boolean;
  toggle: (product: ProductSummary) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ProductSummary[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!active) return;
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (!Array.isArray(parsed) || !parsed.every(isProductSummary)) {
            throw new Error('Stored wishlist data is invalid.');
          }
          setItems(parsed);
        }
      } catch (caught: unknown) {
        if (active) setError(getErrorMessage(caught, 'Could not load your wishlist.'));
      } finally {
        if (active) setIsHydrated(true);
      }
    };

    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated || error) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch((caught: unknown) => {
      setError(getErrorMessage(caught, 'Could not save your wishlist.'));
    });
  }, [items, isHydrated, error]);

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

  const value = useMemo(
    () => ({ items, count: items.length, isHydrated, error, isWishlisted, toggle }),
    [items, isHydrated, error, isWishlisted, toggle],
  );
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
}
