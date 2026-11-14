/**
 * Storage Utilities
 * - AsyncStorage wrapper (favorites, settings, profile) with TypeScript
 * - Secure storage (expo-secure-store: Keychain / Keystore) for auth tokens.
 *   Done: tokens are no longer kept in plain AsyncStorage. On web, where
 *   SecureStore does not exist, they fall back to AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '@/types/auth';

export const STORAGE_KEYS = {
  AUTH_USER: 'auth_user',
  AUTH_TOKENS: 'auth_tokens',
  FAVORITES: 'favorite_recipe_ids',
  SETTINGS: 'user_settings',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export interface AppSettings {
  notifications: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  notifications: true,
};

/**
 * Get item from storage with type safety
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
    await authStorage.clearUser();
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
}

/**
 * Get multiple items at once
 */
export async function getMultipleStorageItems(
  keys: StorageKey[]
): Promise<Partial<Record<StorageKey, unknown>>> {
  const result: Partial<Record<StorageKey, unknown>> = {};
  try {
    const pairs = await AsyncStorage.multiGet(keys);
    pairs.forEach(([key, value]) => {
      result[key as StorageKey] = value ? JSON.parse(value) : null;
    });
  } catch (error) {
    console.error('Failed to get multiple storage items:', error);
  }
  return result;
}

/**
 * Set multiple items at once
 */
export async function setMultipleStorageItems(
  items: { key: StorageKey; value: unknown }[]
): Promise<void> {
  try {
    const pairs = items.map(({ key, value }): [string, string] => [key, JSON.stringify(value)]);
    await AsyncStorage.multiSet(pairs);
  } catch (error) {
    console.error('Failed to set multiple storage items:', error);
    throw error;
  }
}

// Specific helpers for common use cases

// ---- Secure token storage -------------------------------------------------

type Tokens = { token: string; refreshToken: string };

async function secureAvailable(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function setTokens(tokens: Tokens): Promise<void> {
  const value = JSON.stringify(tokens);
  if (await secureAvailable()) {
    await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKENS, value);
  } else {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKENS, value);
  }
}

async function getTokens(): Promise<Tokens | null> {
  try {
    const value = (await secureAvailable())
      ? await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKENS)
      : await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKENS);
    return value ? (JSON.parse(value) as Tokens) : null;
  } catch (error) {
    console.error('Failed to read tokens:', error);
    return null;
  }
}

async function clearTokens(): Promise<void> {
  try {
    if (await secureAvailable()) await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKENS);
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKENS);
  } catch (error) {
    console.error('Failed to clear tokens:', error);
  }
}

// Saving or clearing a login takes several async steps, so run them one after another.
// Otherwise a late "clear" from a logout could wipe tokens saved by a quick login.
let authQueue: Promise<unknown> = Promise.resolve();
function inOrder<T>(task: () => Promise<T>): Promise<T> {
  const result = authQueue.then(task, task);
  authQueue = result.catch(() => undefined);
  return result;
}

/** The profile goes to AsyncStorage; the tokens go to secure storage. */
export const authStorage = {
  getUser: (): Promise<AuthUser | null> =>
    inOrder(async () => {
      const profile = await getStorageItem<Omit<AuthUser, 'token' | 'refreshToken'> & Partial<Tokens>>(
        STORAGE_KEYS.AUTH_USER
      );
      if (!profile) return null;
      const tokens = await getTokens();
      // Sessions saved by an older build kept the tokens inside the profile.
      const token = tokens?.token ?? profile.token ?? '';
      const refreshToken = tokens?.refreshToken ?? profile.refreshToken ?? '';
      return { ...profile, token, refreshToken };
    }),
  setUser: (user: AuthUser): Promise<void> =>
    inOrder(async () => {
      const { token, refreshToken, ...profile } = user;
      await setTokens({ token, refreshToken });
      await setStorageItem(STORAGE_KEYS.AUTH_USER, profile);
    }),
  clearUser: (): Promise<void> =>
    inOrder(async () => {
      await removeStorageItem(STORAGE_KEYS.AUTH_USER);
      await clearTokens();
    }),
};

export const favoritesStorage = {
  getIds: async (): Promise<number[]> => (await getStorageItem<number[]>(STORAGE_KEYS.FAVORITES)) ?? [],
  setIds: (ids: number[]) => setStorageItem(STORAGE_KEYS.FAVORITES, ids),
  addId: async (id: number): Promise<void> => {
    const ids = await favoritesStorage.getIds();
    if (!ids.includes(id)) await favoritesStorage.setIds([...ids, id]);
  },
  removeId: async (id: number): Promise<void> => {
    const ids = await favoritesStorage.getIds();
    await favoritesStorage.setIds(ids.filter((i) => i !== id));
  },
  /** Returns true if the recipe is now a favorite, false if it was removed. */
  toggleId: async (id: number): Promise<boolean> => {
    const ids = await favoritesStorage.getIds();
    if (ids.includes(id)) {
      await favoritesStorage.removeId(id);
      return false;
    }
    await favoritesStorage.addId(id);
    return true;
  },
};

export const settingsStorage = {
  get: async (): Promise<AppSettings> => ({
    ...DEFAULT_SETTINGS,
    ...((await getStorageItem<Partial<AppSettings>>(STORAGE_KEYS.SETTINGS)) ?? {}),
  }),
  set: (settings: AppSettings) => setStorageItem(STORAGE_KEYS.SETTINGS, settings),
};