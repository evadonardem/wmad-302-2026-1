/**
 * AsyncStorage Utilities
 * Wrapper for @react-native-async-storage/async-storage with TypeScript
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { AuthUser } from '@/types/auth';
import type { Recipe, RecipesResponse } from '@/types/recipe';

const STORAGE_KEYS = {
  AUTH_USER: 'auth_user',
  FAVORITES: 'favorite_recipe_ids',
  SETTINGS: 'user_settings',
  RECIPE_CACHE: 'recipe_cache',
  USER_RECIPES: 'user_recipes',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

type StoredAuthUser = Omit<AuthUser, 'token'> & {
  token?: string;
  accessToken?: string;
};

function isStoredAuthUser(value: unknown): value is StoredAuthUser {
  if (typeof value !== 'object' || value === null) return false;
  const user = value as Record<string, unknown>;
  return typeof user.id === 'number'
    && typeof user.username === 'string'
    && typeof user.email === 'string'
    && typeof user.firstName === 'string'
    && typeof user.lastName === 'string'
    && (user.gender === 'male' || user.gender === 'female')
    && typeof user.image === 'string'
    && (typeof user.token === 'string' || typeof user.accessToken === 'string')
    && typeof user.refreshToken === 'string';
}

/**
 * Get item from storage with type safety
 */
export async function getStorageItem<T>(key: StorageKey): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Failed to get storage item ${key}:`, error);
    throw error;
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
    throw error;
  }
}

/**
 * Clear all app storage
 */
export async function clearAllStorage(): Promise<void> {
  try {
    const keys = Object.values(STORAGE_KEYS).filter((key) => key !== STORAGE_KEYS.AUTH_USER);
    await AsyncStorage.multiRemove(keys);
    await authStorage.clearUser();
  } catch (error) {
    console.error('Failed to clear storage:', error);
    throw error;
  }
}

/**
 * Get multiple items at once
 */
export async function getMultipleStorageItems<T extends Record<string, unknown>>(
  keys: StorageKey[]
): Promise<T> {
  try {
    const pairs = await AsyncStorage.multiGet(keys);
    const result = {} as T;
    pairs.forEach(([key, value]) => {
      (result as Record<string, unknown>)[key] = value ? JSON.parse(value) : null;
    });
    return result;
  } catch (error) {
    console.error('Failed to get multiple storage items:', error);
    throw error;
  }
}

/**
 * Set multiple items at once
 */
export async function setMultipleStorageItems(
  items: { key: StorageKey; value: unknown }[]
): Promise<void> {
  try {
    const pairs: [string, string][] = items.map(({ key, value }) => [key, JSON.stringify(value)]);
    await AsyncStorage.multiSet(pairs);
  } catch (error) {
    console.error('Failed to set multiple storage items:', error);
    throw error;
  }
}

interface RecipeCache {
  responses: Record<string, RecipesResponse>;
  recipes: Record<string, Recipe>;
}

let recipeCacheWrite = Promise.resolve();
let userRecipesWrite = Promise.resolve();

async function updateRecipeCache(update: (cache: RecipeCache) => void): Promise<void> {
  const write = recipeCacheWrite.catch(() => undefined).then(async () => {
    const cache = await getStorageItem<RecipeCache>(STORAGE_KEYS.RECIPE_CACHE) ?? {
      responses: {},
      recipes: {},
    };
    update(cache);
    await setStorageItem(STORAGE_KEYS.RECIPE_CACHE, cache);
  });
  recipeCacheWrite = write;
  await write;
}

export const recipeCacheStorage = {
  getResponse: async (key: string) => {
    const cache = await getStorageItem<RecipeCache>(STORAGE_KEYS.RECIPE_CACHE);
    return cache?.responses[key] ?? null;
  },
  setResponse: (key: string, response: RecipesResponse) => (
    updateRecipeCache((cache) => { cache.responses[key] = response; })
  ),
  getRecipe: async (id: number) => {
    const cache = await getStorageItem<RecipeCache>(STORAGE_KEYS.RECIPE_CACHE);
    return cache?.recipes[String(id)] ?? null;
  },
  setRecipes: (recipes: Recipe[]) => (
    updateRecipeCache((cache) => {
      recipes.forEach((recipe) => { cache.recipes[String(recipe.id)] = recipe; });
    })
  ),
};

export interface AppSettings {
  darkMode: boolean;
}

export const settingsStorage = {
  get: async (): Promise<AppSettings> => (
    (await getStorageItem<AppSettings>(STORAGE_KEYS.SETTINGS)) ?? { darkMode: false }
  ),
  set: (settings: AppSettings) => setStorageItem(STORAGE_KEYS.SETTINGS, settings),
};

// Specific helpers for common use cases

export const authStorage = {
  getUser: async (): Promise<AuthUser | null> => {
    const raw = Platform.OS === 'web'
      ? await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER)
      : await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_USER);
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isStoredAuthUser(parsed)) {
        await authStorage.clearUser();
        return null;
      }
      const token = parsed.token ?? parsed.accessToken;
      if (!token) {
        await authStorage.clearUser();
        return null;
      }
      return {
        id: parsed.id,
        username: parsed.username,
        email: parsed.email,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        gender: parsed.gender,
        image: parsed.image,
        token,
        refreshToken: parsed.refreshToken,
      };
    } catch (error) {
      console.error('Stored authentication data is invalid:', error);
      await authStorage.clearUser();
      return null;
    }
  },
  setUser: async (user: unknown) => {
    const value = JSON.stringify(user);
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, value);
    } else {
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_USER, value);
    }
  },
  clearUser: async () => {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_USER);
    }
  },
};

export const favoritesStorage = {
  getIds: async (accountKey: string) => {
    const stored = await getStorageItem<unknown>(STORAGE_KEYS.FAVORITES);
    if (Array.isArray(stored)) return [];
    if (typeof stored !== 'object' || stored === null) return [];
    const ids = (stored as Record<string, unknown>)[accountKey];
    return Array.isArray(ids)
      ? ids.filter((id): id is number => typeof id === 'number' && Number.isInteger(id))
      : [];
  },
  setIds: async (accountKey: string, ids: number[]) => {
    const stored = await getStorageItem<unknown>(STORAGE_KEYS.FAVORITES);
    const favoritesByUser = Array.isArray(stored)
      ? {}
      : typeof stored === 'object' && stored !== null
        ? stored as Record<string, number[]>
        : {};
    await setStorageItem(STORAGE_KEYS.FAVORITES, { ...favoritesByUser, [accountKey]: ids });
  },
  addId: async (accountKey: string, id: number) => {
    const ids = await favoritesStorage.getIds(accountKey);
    if (!ids.includes(id)) {
      await favoritesStorage.setIds(accountKey, [...ids, id]);
    }
  },
  removeId: async (accountKey: string, id: number) => {
    const ids = await favoritesStorage.getIds(accountKey);
    await favoritesStorage.setIds(accountKey, ids.filter((i) => i !== id));
  },
  toggleId: async (accountKey: string, id: number) => {
    const ids = await favoritesStorage.getIds(accountKey);
    if (ids.includes(id)) {
      await favoritesStorage.removeId(accountKey, id);
      return false;
    } else {
      await favoritesStorage.addId(accountKey, id);
      return true;
    }
  },
};

export const userRecipesStorage = {
  getRecipes: async (userId: number): Promise<Recipe[]> => {
    const stored = await getStorageItem<unknown>(STORAGE_KEYS.USER_RECIPES);
    if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) return [];
    const recipes = (stored as Record<string, unknown>)[String(userId)];
    return Array.isArray(recipes) ? recipes as Recipe[] : [];
  },
  getRecipe: async (userId: number, recipeId: number): Promise<Recipe | null> => {
    const recipes = await userRecipesStorage.getRecipes(userId);
    return recipes.find((recipe) => recipe.id === recipeId) ?? null;
  },
  addRecipe: async (userId: number, recipe: Recipe): Promise<void> => {
    const write = userRecipesWrite.catch(() => undefined).then(async () => {
      const stored = await getStorageItem<unknown>(STORAGE_KEYS.USER_RECIPES);
      const recipesByUser = typeof stored === 'object' && stored !== null && !Array.isArray(stored)
        ? stored as Record<string, unknown>
        : {};
      const existing = recipesByUser[String(userId)];
      const recipes = Array.isArray(existing) ? existing as Recipe[] : [];
      await setStorageItem(STORAGE_KEYS.USER_RECIPES, {
        ...recipesByUser,
        [String(userId)]: [recipe, ...recipes],
      });
    });
    userRecipesWrite = write;
    await write;
  },
  removeRecipe: async (userId: number, recipeId: number): Promise<boolean> => {
    let removed = false;
    const write = userRecipesWrite.catch(() => undefined).then(async () => {
      const stored = await getStorageItem<unknown>(STORAGE_KEYS.USER_RECIPES);
      if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) return;
      const recipesByUser = stored as Record<string, unknown>;
      const existing = recipesByUser[String(userId)];
      if (!Array.isArray(existing)) return;

      const recipes = existing as Recipe[];
      const remaining = recipes.filter((recipe) => recipe.id !== recipeId);
      if (remaining.length === recipes.length) return;

      removed = true;
      await setStorageItem(STORAGE_KEYS.USER_RECIPES, {
        ...recipesByUser,
        [String(userId)]: remaining,
      });
    });
    userRecipesWrite = write;
    await write;
    return removed;
  },
};