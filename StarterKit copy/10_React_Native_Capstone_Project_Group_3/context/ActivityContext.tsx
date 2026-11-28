/**
 * Activity Context - the shopper's on-device activity:
 * recently viewed products, search history, compare list and written reviews.
 * Everything is persisted to AsyncStorage.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { Product, ProductSummary } from '@/types/product';
import type { UserReview } from '@/types/account';
import { getStorageItem, setStorageItem, StorageKey, STORAGE_KEYS } from '@/utils/storage';
import { pushRecent, toggleLimited } from '@/utils/lists';

export const MAX_RECENTLY_VIEWED = 10;
export const MAX_SEARCH_HISTORY = 8;
export const MAX_COMPARE = 3;

interface ActivityContextType {
  recentlyViewed: ProductSummary[];
  addRecentlyViewed: (product: Product) => void;
  searchHistory: string[];
  addSearch: (term: string) => void;
  clearSearchHistory: () => void;
  compare: Product[];
  isComparing: (productId: number) => boolean;
  /** Returns 'added' | 'removed' | 'full' (compare holds at most MAX_COMPARE products). */
  toggleCompare: (product: Product) => 'added' | 'removed' | 'full';
  clearCompare: () => void;
  reviews: UserReview[];
  getReviews: (productId: number) => UserReview[];
  addReview: (review: UserReview) => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

/** useState that loads from and saves to AsyncStorage. */
function usePersistentList<T>(key: StorageKey) {
  const [items, setItems] = useState<T[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    getStorageItem<T[]>(key).then((stored) => {
      if (stored) setItems(stored);
      setHydrated(true);
    });
  }, [key]);

  useEffect(() => {
    if (hydrated) setStorageItem(key, items).catch(() => undefined);
  }, [key, items, hydrated]);

  return [items, setItems] as const;
}

function toSummary(product: Product): ProductSummary {
  const { id, title, thumbnail, category, price, discountPercentage, rating, stock, brand } = product;
  return { id, title, thumbnail, category, price, discountPercentage, rating, stock, brand };
}

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [recentlyViewed, setRecentlyViewed] = usePersistentList<ProductSummary>(STORAGE_KEYS.RECENTLY_VIEWED);
  const [searchHistory, setSearchHistory] = usePersistentList<string>(STORAGE_KEYS.SEARCH_HISTORY);
  const [compare, setCompare] = usePersistentList<Product>(STORAGE_KEYS.COMPARE);
  const [reviews, setReviews] = usePersistentList<UserReview>(STORAGE_KEYS.REVIEWS);

  const addRecentlyViewed = useCallback(
    (product: Product) =>
      setRecentlyViewed((prev) => pushRecent(prev, toSummary(product), (p) => p.id, MAX_RECENTLY_VIEWED)),
    [setRecentlyViewed]
  );

  const addSearch = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (trimmed.length < 2) return;
      setSearchHistory((prev) => pushRecent(prev, trimmed, (t) => t.toLowerCase(), MAX_SEARCH_HISTORY));
    },
    [setSearchHistory]
  );

  const clearSearchHistory = useCallback(() => setSearchHistory([]), [setSearchHistory]);

  const isComparing = useCallback((productId: number) => compare.some((p) => p.id === productId), [compare]);

  const toggleCompare = useCallback(
    (product: Product) => {
      const result = toggleLimited(compare, product, (p) => p.id, MAX_COMPARE);
      if (result.full) return 'full' as const;
      setCompare(result.list);
      return result.included ? ('added' as const) : ('removed' as const);
    },
    [compare, setCompare]
  );

  const clearCompare = useCallback(() => setCompare([]), [setCompare]);

  const getReviews = useCallback(
    (productId: number) => reviews.filter((review) => review.productId === productId),
    [reviews]
  );

  const addReview = useCallback(
    (review: UserReview) => setReviews((prev) => [review, ...prev]),
    [setReviews]
  );

  const value = useMemo<ActivityContextType>(
    () => ({
      recentlyViewed,
      addRecentlyViewed,
      searchHistory,
      addSearch,
      clearSearchHistory,
      compare,
      isComparing,
      toggleCompare,
      clearCompare,
      reviews,
      getReviews,
      addReview,
    }),
    [
      recentlyViewed,
      addRecentlyViewed,
      searchHistory,
      addSearch,
      clearSearchHistory,
      compare,
      isComparing,
      toggleCompare,
      clearCompare,
      reviews,
      getReviews,
      addReview,
    ]
  );

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivity(): ActivityContextType {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
}
