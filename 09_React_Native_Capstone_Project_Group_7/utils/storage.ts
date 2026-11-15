/**
 * AsyncStorage Utilities
 * Wrapper for @react-native-async-storage/async-storage with TypeScript
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AUTH_USER: 'auth_user',
  FAVORITES: 'favorite_recipe_ids',
  FAVORITE_NOTES: 'favorite_recipe_notes',
  SETTINGS: 'user_settings',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

export async function getStorageItem<T>(key: StorageKey): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch (error) {
    console.error(`Failed to get storage item ${key}:`, error);
    return null;
  }
}

export async function setStorageItem<T>(key: StorageKey, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to set storage item ${key}:`, error);
    throw error;
  }
}

export async function removeStorageItem(key: StorageKey): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove storage item ${key}:`, error);
  }
}

export async function clearAllStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
}

export const authStorage = {
  getUser: () =>
    getStorageItem<{
      id: number;
      username: string;
      email: string;
      firstName: string;
      lastName: string;
      token: string;
      refreshToken: string;
    }>(STORAGE_KEYS.AUTH_USER),
  setUser: (user: unknown) => setStorageItem(STORAGE_KEYS.AUTH_USER, user),
  clearUser: () => removeStorageItem(STORAGE_KEYS.AUTH_USER),
};

export const favoritesStorage = {
  getIds: async (): Promise<number[]> => {
    const ids = await getStorageItem<number[]>(STORAGE_KEYS.FAVORITES);
    return Array.isArray(ids) ? ids : [];
  },
  setIds: (ids: number[]) => setStorageItem(STORAGE_KEYS.FAVORITES, ids),
  addId: async (id: number) => {
    const ids = await favoritesStorage.getIds();
    if (!ids.includes(id)) {
      await favoritesStorage.setIds([...ids, id]);
    }
  },
  removeId: async (id: number) => {
    const ids = await favoritesStorage.getIds();
    await favoritesStorage.setIds(ids.filter((i) => i !== id));
  },
  toggleId: async (id: number): Promise<boolean> => {
    const ids = await favoritesStorage.getIds();
    if (ids.includes(id)) {
      await favoritesStorage.removeId(id);
      return false;
    }
    await favoritesStorage.addId(id);
    return true;
  },
  getNotes: async (): Promise<Record<number, string>> => {
    const notes = await getStorageItem<Record<number, string>>(STORAGE_KEYS.FAVORITE_NOTES);
    return notes ?? {};
  },
  setNote: async (id: number, note: string): Promise<void> => {
    const notes = await favoritesStorage.getNotes();
    if (note.trim()) {
      notes[id] = note.trim();
    } else {
      delete notes[id];
    }
    await setStorageItem(STORAGE_KEYS.FAVORITE_NOTES, notes);
  },
};
