/**
 * Gift Lists Context - several named wishlists ("For Mom", "Secret Santa"),
 * each with an emoji and a budget. Persisted to AsyncStorage.
 */
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ProductSummary } from '@/types/product';
import { createId, getDiscountedPrice } from '@/utils/format';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/utils/storage';

export interface GiftList {
  id: string;
  name: string;
  emoji: string;
  /** Budget in USD (0 = no budget). */
  budget: number;
  items: ProductSummary[];
}

interface GiftListsContextType {
  lists: GiftList[];
  createList: (name: string, budget: number, emoji?: string) => GiftList;
  deleteList: (listId: string) => void;
  /** Returns true when added, false when removed. */
  toggleItem: (listId: string, product: ProductSummary) => boolean;
  listsContaining: (productId: number) => GiftList[];
}

const GiftListsContext = createContext<GiftListsContextType | undefined>(undefined);

/** Total of the discounted prices in a list. */
export function giftListTotal(list: GiftList): number {
  return list.items.reduce((sum, item) => sum + getDiscountedPrice(item.price, item.discountPercentage), 0);
}

function toSummary(product: ProductSummary): ProductSummary {
  const { id, title, thumbnail, category, price, discountPercentage, rating, stock, brand } = product;
  return { id, title, thumbnail, category, price, discountPercentage, rating, stock, brand };
}

export function GiftListsProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<GiftList[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    getStorageItem<GiftList[]>(STORAGE_KEYS.GIFT_LISTS).then((stored) => {
      if (stored) setLists(stored);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) setStorageItem(STORAGE_KEYS.GIFT_LISTS, lists).catch(() => undefined);
  }, [lists, hydrated]);

  const createList = useCallback((name: string, budget: number, emoji = '🎁') => {
    const list: GiftList = { id: createId('gift'), name: name.trim(), emoji, budget: Math.max(0, budget), items: [] };
    setLists((prev) => [...prev, list]);
    return list;
  }, []);

  const deleteList = useCallback((listId: string) => setLists((prev) => prev.filter((list) => list.id !== listId)), []);

  const toggleItem = useCallback(
    (listId: string, product: ProductSummary) => {
      const list = lists.find((l) => l.id === listId);
      const present = !!list?.items.some((item) => item.id === product.id);
      setLists((prev) =>
        prev.map((l) =>
          l.id !== listId
            ? l
            : {
                ...l,
                items: present ? l.items.filter((item) => item.id !== product.id) : [...l.items, toSummary(product)],
              }
        )
      );
      return !present;
    },
    [lists]
  );

  const listsContaining = useCallback(
    (productId: number) => lists.filter((list) => list.items.some((item) => item.id === productId)),
    [lists]
  );

  const value = useMemo(
    () => ({ lists, createList, deleteList, toggleItem, listsContaining }),
    [lists, createList, deleteList, toggleItem, listsContaining]
  );

  return <GiftListsContext.Provider value={value}>{children}</GiftListsContext.Provider>;
}

export function useGiftLists(): GiftListsContextType {
  const context = useContext(GiftListsContext);
  if (context === undefined) {
    throw new Error('useGiftLists must be used within a GiftListsProvider');
  }
  return context;
}
