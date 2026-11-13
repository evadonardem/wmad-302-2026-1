import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { favoritesStorage, authStorage, clearAllStorage } from '@/utils/storage';

jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    multiRemove: jest.fn((keys: string[]) => {
      keys.forEach((k) => delete store[k]);
      return Promise.resolve();
    }),
  };
});

describe('Storage Utilities', () => {
  beforeEach(async () => {
    await clearAllStorage();
    jest.clearAllMocks();
  });

  it('adds, toggles, and removes favorite recipe IDs', async () => {
    expect(await favoritesStorage.getIds()).toEqual([]);

    await favoritesStorage.addId(1);
    await favoritesStorage.addId(2);
    expect(await favoritesStorage.getIds()).toEqual([1, 2]);

    const toggledOff = await favoritesStorage.toggleId(1);
    expect(toggledOff).toBe(false);
    expect(await favoritesStorage.getIds()).toEqual([2]);

    const toggledOn = await favoritesStorage.toggleId(5);
    expect(toggledOn).toBe(true);
    expect(await favoritesStorage.getIds()).toEqual([2, 5]);
  });

  it('saves and removes personal recipe notes', async () => {
    await favoritesStorage.setNote(1, 'Use less salt');
    expect(await favoritesStorage.getNotes()).toEqual({ 1: 'Use less salt' });

    await favoritesStorage.setNote(1, '   ');
    expect(await favoritesStorage.getNotes()).toEqual({});
  });

  it('stores and clears authenticated user data', async () => {
    const mockUser = {
      id: 1,
      username: 'emilys',
      email: 'emily@example.com',
      firstName: 'Emily',
      lastName: 'Johnson',
      token: 'tok-123',
      refreshToken: 'ref-123',
    };

    await authStorage.setUser(mockUser);
    expect(await authStorage.getUser()).toEqual(mockUser);

    await authStorage.clearUser();
    expect(await authStorage.getUser()).toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
  });
});
