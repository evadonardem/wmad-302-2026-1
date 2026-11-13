/**
 * AsyncStorage Utilities
 * Wrapper for AsyncStorage with TypeScript support.
 * Includes authentication, local accounts, favorites,
 * meal planning, recently viewed recipes, cart, and settings.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface CartItem {
  productId: number;
  quantity: number;
}

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner';

export interface MealPlanEntry {
  date: string;
  mealType: MealType;
  recipeId: number;
}

const STORAGE_KEYS = {
  AUTH_USER: 'auth_user',
  PROFILE_OVERRIDES: 'profile_overrides',
  LOCAL_ACCOUNTS: 'local_registered_accounts',
  FAVORITES: 'favorite_recipe_ids',
  CART: 'cart_items',
  SETTINGS: 'user_settings',
  MEAL_PLAN: 'meal_plan_entries',
  RECENTLY_VIEWED: 'recently_viewed_recipe_ids',
} as const;

export type StorageKey =
  typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

export async function getStorageItem<T>(
  key: StorageKey
): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch (error) {
    console.error(`Failed to get storage item ${key}:`, error);
    return null;
  }
}

export async function setStorageItem<T>(
  key: StorageKey,
  value: T
): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to set storage item ${key}:`, error);
    throw error;
  }
}

export async function removeStorageItem(
  key: StorageKey
): Promise<void> {
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

export async function getMultipleStorageItems<
  T extends Record<string, unknown>
>(keys: StorageKey[]): Promise<T> {
  try {
    const pairs = await AsyncStorage.multiGet(keys);
    const result = {} as T;

    pairs.forEach(([key, value]) => {
      (result as Record<string, unknown>)[key] = value
        ? JSON.parse(value)
        : null;
    });

    return result;
  } catch (error) {
    console.error('Failed to get multiple storage items:', error);
    return {} as T;
  }
}

export async function setMultipleStorageItems(
  items: { key: StorageKey; value: unknown }[]
): Promise<void> {
  try {
    const pairs: [string, string][] = items.map(({ key, value }) => [
      key,
      JSON.stringify(value),
    ]);

    await AsyncStorage.multiSet(pairs);
  } catch (error) {
    console.error('Failed to set multiple storage items:', error);
    throw error;
  }
}

// ======================================
// AUTH STORAGE
// ======================================

export interface ProfileOverrides {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

// Locally registered account information.
export interface LocalAccount {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  email: string;
  age?: number;
  gender: 'male' | 'female';
  createdAt: string;
}

export const authStorage = {
  // Get the currently authenticated user.
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

  // Save the currently authenticated user.
  setUser: (user: unknown) =>
    setStorageItem(STORAGE_KEYS.AUTH_USER, user),

  // Get locally registered accounts.
  getLocalAccounts: async (): Promise<LocalAccount[]> => {
    return (
      (await getStorageItem<LocalAccount[]>(
        STORAGE_KEYS.LOCAL_ACCOUNTS
      )) ?? []
    );
  },

  // Register and save a new local account.
  registerLocalAccount: async (
    data: Omit<LocalAccount, 'id' | 'createdAt'>
  ): Promise<LocalAccount> => {
    const accounts = await authStorage.getLocalAccounts();

    const usernameExists = accounts.some(
      (account) =>
        account.username.toLowerCase() ===
        data.username.toLowerCase()
    );

    if (usernameExists) {
      throw new Error('This username is already registered.');
    }

    const emailExists = accounts.some(
      (account) =>
        account.email.toLowerCase() ===
        data.email.toLowerCase()
    );

    if (emailExists) {
      throw new Error('This email is already registered.');
    }

    const newAccount: LocalAccount = {
      ...data,
      id: -Date.now(),
      createdAt: new Date().toISOString(),
    };

    await setStorageItem(
      STORAGE_KEYS.LOCAL_ACCOUNTS,
      [...accounts, newAccount]
    );

    return newAccount;
  },

  // Find a locally registered account by username.
  findLocalAccount: async (
    username: string
  ): Promise<LocalAccount | null> => {
    const accounts = await authStorage.getLocalAccounts();

    return (
      accounts.find(
        (account) =>
          account.username.toLowerCase() ===
          username.trim().toLowerCase()
      ) ?? null
    );
  },

  // Get profile changes saved for a particular user.
  getProfileOverrides: async (
    userId: number
  ): Promise<ProfileOverrides | null> => {
    const saved = await getStorageItem<
      ProfileOverrides & { userId: number }
    >(STORAGE_KEYS.PROFILE_OVERRIDES);

    if (!saved || saved.userId !== userId) {
      return null;
    }

    return {
      firstName: saved.firstName,
      lastName: saved.lastName,
      username: saved.username,
      email: saved.email,
    };
  },

  // Save profile changes separately from API data.
  setProfileOverrides: (
    userId: number,
    updates: ProfileOverrides
  ) =>
    setStorageItem(STORAGE_KEYS.PROFILE_OVERRIDES, {
      userId,
      ...updates,
    }),

  // Remove saved profile changes.
  clearProfileOverrides: () =>
    removeStorageItem(STORAGE_KEYS.PROFILE_OVERRIDES),

  // Clear the current session without deleting registered accounts.
  clearUser: () => removeStorageItem(STORAGE_KEYS.AUTH_USER),
};

// ======================================
// FAVORITES STORAGE
// ======================================

export const favoritesStorage = {
  getIds: async (): Promise<number[]> => {
    return (
      (await getStorageItem<number[]>(STORAGE_KEYS.FAVORITES)) ?? []
    );
  },

  setIds: (ids: number[]) =>
    setStorageItem(STORAGE_KEYS.FAVORITES, ids),

  addId: async (id: number) => {
    const ids = await favoritesStorage.getIds();

    if (!ids.includes(id)) {
      await favoritesStorage.setIds([...ids, id]);
    }
  },

  removeId: async (id: number) => {
    const ids = await favoritesStorage.getIds();

    await favoritesStorage.setIds(
      ids.filter((i) => i !== id)
    );
  },

  toggleId: async (id: number) => {
    const ids = await favoritesStorage.getIds();

    if (ids.includes(id)) {
      await favoritesStorage.removeId(id);
      return false;
    }

    await favoritesStorage.addId(id);
    return true;
  },
};

// ======================================
// MEAL PLAN STORAGE
// ======================================

export const mealPlanStorage = {
  getEntries: async (date?: string): Promise<MealPlanEntry[]> => {
    const entries =
      (await getStorageItem<MealPlanEntry[]>(
        STORAGE_KEYS.MEAL_PLAN
      )) ?? [];

    if (!date) {
      return entries;
    }

    return entries.filter((entry) => entry.date === date);
  },

  addEntry: async (
    date: string,
    mealType: MealType,
    recipeId: number
  ): Promise<boolean> => {
    const entries = await mealPlanStorage.getEntries();

    const alreadyExists = entries.some(
      (entry) =>
        entry.date === date &&
        entry.mealType === mealType &&
        entry.recipeId === recipeId
    );

    if (alreadyExists) {
      return false;
    }

    const newEntry: MealPlanEntry = {
      date,
      mealType,
      recipeId,
    };

    await setStorageItem(STORAGE_KEYS.MEAL_PLAN, [
      ...entries,
      newEntry,
    ]);

    return true;
  },

  removeEntry: async (
    date: string,
    mealType: MealType,
    recipeId: number
  ): Promise<void> => {
    const entries = await mealPlanStorage.getEntries();

    const updatedEntries = entries.filter(
      (entry) =>
        !(
          entry.date === date &&
          entry.mealType === mealType &&
          entry.recipeId === recipeId
        )
    );

    await setStorageItem(
      STORAGE_KEYS.MEAL_PLAN,
      updatedEntries
    );
  },
};

// ======================================
// RECENTLY VIEWED RECIPES STORAGE
// ======================================

export const recentlyViewedStorage = {
  // Get recently viewed recipe IDs, newest first.
  getIds: async (): Promise<number[]> => {
    return (
      (await getStorageItem<number[]>(
        STORAGE_KEYS.RECENTLY_VIEWED
      )) ?? []
    );
  },

  // Add a recipe to the beginning of the history.
  // Remove duplicates and keep only the latest 10.
  addId: async (id: number): Promise<void> => {
    const ids = await recentlyViewedStorage.getIds();

    const updatedIds = [
      id,
      ...ids.filter((existingId) => existingId !== id),
    ].slice(0, 10);

    await setStorageItem(
      STORAGE_KEYS.RECENTLY_VIEWED,
      updatedIds
    );
  },

  // Clear recently viewed history if needed.
  clear: () =>
    removeStorageItem(STORAGE_KEYS.RECENTLY_VIEWED),
};

// ======================================
// CART STORAGE
// ======================================

export const cartStorage = {
  getCart: async (): Promise<CartItem[]> => {
    return (
      (await getStorageItem<CartItem[]>(STORAGE_KEYS.CART)) ?? []
    );
  },

  setCart: (items: CartItem[]) =>
    setStorageItem(STORAGE_KEYS.CART, items),

  addItem: async (item: CartItem) => {
    const items = await cartStorage.getCart();

    const existingIndex = items.findIndex(
      (i) => i.productId === item.productId
    );

    if (existingIndex >= 0) {
      items[existingIndex].quantity += item.quantity;
    } else {
      items.push(item);
    }

    await cartStorage.setCart(items);
  },

  updateQuantity: async (
    productId: number,
    quantity: number
  ) => {
    const items = await cartStorage.getCart();

    const index = items.findIndex(
      (i) => i.productId === productId
    );

    if (index >= 0) {
      if (quantity <= 0) {
        items.splice(index, 1);
      } else {
        items[index].quantity = quantity;
      }

      await cartStorage.setCart(items);
    }
  },

  removeItem: async (productId: number) => {
    const items = await cartStorage.getCart();

    await cartStorage.setCart(
      items.filter((i) => i.productId !== productId)
    );
  },

  clear: () => removeStorageItem(STORAGE_KEYS.CART),
};