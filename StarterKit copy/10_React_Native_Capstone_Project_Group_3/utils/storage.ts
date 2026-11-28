/**
 * AsyncStorage Utilities
 * Typed wrapper for @react-native-async-storage/async-storage.
 * AsyncStorage works on iOS, Android and web (where it is backed by localStorage).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser } from '@/types/auth';
import type { CartItem, ProductSummary } from '@/types/product';
import type { Order } from '@/types/account';

export const STORAGE_KEYS = {
  AUTH_USER: 'auth_user',
  WISHLIST: 'wishlist_items',
  CART: 'cart',
  SETTINGS: 'user_settings',
  ORDERS: 'orders',
  ADDRESSES: 'addresses',
  PAYMENT_METHODS: 'payment_methods',
  RECENTLY_VIEWED: 'recently_viewed',
  SEARCH_HISTORY: 'search_history',
  COMPARE: 'compare_products',
  REVIEWS: 'user_reviews',
  REWARDS: 'rewards',
  GIFT_LISTS: 'gift_lists',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Get item from storage. Returns null when missing or unreadable.
 */
export async function getStorageItem<T>(key: StorageKey): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch (error) {
    console.error(`Failed to get storage item ${key}:`, error);
    return null;
  }
}

/**
 * Set item in storage
 */
export async function setStorageItem<T>(key: StorageKey, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to set storage item ${key}:`, error);
    throw error;
  }
}

/**
 * Remove item from storage
 */
export async function removeStorageItem(key: StorageKey): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove storage item ${key}:`, error);
  }
}

/**
 * Clear all app storage
 */
export async function clearAllStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
}

// Specific helpers for common use cases

export const authStorage = {
  getUser: () => getStorageItem<AuthUser>(STORAGE_KEYS.AUTH_USER),
  setUser: (user: AuthUser) => setStorageItem(STORAGE_KEYS.AUTH_USER, user),
  clearUser: () => removeStorageItem(STORAGE_KEYS.AUTH_USER),
};

export const wishlistStorage = {
  getItems: async (): Promise<ProductSummary[]> =>
    (await getStorageItem<ProductSummary[]>(STORAGE_KEYS.WISHLIST)) ?? [],
  setItems: (items: ProductSummary[]) => setStorageItem(STORAGE_KEYS.WISHLIST, items),
};

export const cartStorage = {
  getCart: async (): Promise<CartItem[]> =>
    (await getStorageItem<CartItem[]>(STORAGE_KEYS.CART)) ?? [],
  setCart: (items: CartItem[]) => setStorageItem(STORAGE_KEYS.CART, items),
  clear: () => removeStorageItem(STORAGE_KEYS.CART),
};

export const ordersStorage = {
  getAll: async (): Promise<Order[]> => (await getStorageItem<Order[]>(STORAGE_KEYS.ORDERS)) ?? [],
  add: async (order: Order): Promise<void> => {
    const orders = await ordersStorage.getAll();
    await setStorageItem(STORAGE_KEYS.ORDERS, [order, ...orders]);
  },
};
