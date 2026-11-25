import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  authStorage,
  clearAllStorage,
  favoritesStorage,
  getMultipleStorageItems,
  getStorageItem,
  removeStorageItem,
  setMultipleStorageItems,
  setStorageItem,
} from '../storage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('storage helpers', () => {
  it('saves and reads values as JSON', async () => {
    await setStorageItem('user_settings', { recipeReminders: true });
    expect(await getStorageItem('user_settings')).toEqual({ recipeReminders: true });
  });

  it('returns null for missing keys', async () => {
    expect(await getStorageItem('user_settings')).toBeNull();
  });

  it('removes values', async () => {
    await setStorageItem('theme_preference', 'dark');
    await removeStorageItem('theme_preference');
    expect(await getStorageItem('theme_preference')).toBeNull();
  });

  it('reads and writes several values at once', async () => {
    await setMultipleStorageItems([
      { key: 'theme_preference', value: 'light' },
      { key: 'user_settings', value: { recipeReminders: false } },
    ]);
    const values = await getMultipleStorageItems<Record<string, unknown>>(['theme_preference', 'user_settings']);
    expect(values).toEqual({ theme_preference: 'light', user_settings: { recipeReminders: false } });
  });

  it('clears all app keys', async () => {
    await setStorageItem('theme_preference', 'dark');
    await setStorageItem('favorite_recipe_ids', [1, 2]);
    await clearAllStorage();
    expect(await getStorageItem('theme_preference')).toBeNull();
    expect(await getStorageItem('favorite_recipe_ids')).toBeNull();
  });

  it('returns null instead of crashing on broken JSON', async () => {
    await AsyncStorage.setItem('user_settings', '{not json');
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(await getStorageItem('user_settings')).toBeNull();
    spy.mockRestore();
  });
});

describe('authStorage', () => {
  it('saves, reads and clears the user', async () => {
    const user = { id: 1, username: 'emilys', email: 'e@x.com', firstName: 'Emily', lastName: 'J', token: 't', refreshToken: 'r' };
    await authStorage.setUser(user);
    expect(await authStorage.getUser()).toEqual(user);
    await authStorage.clearUser();
    expect(await authStorage.getUser()).toBeNull();
  });
});

describe('favoritesStorage', () => {
  it('returns an empty list when nothing is saved', async () => {
    expect(await favoritesStorage.getIds()).toEqual([]);
  });

  it('adds, removes and toggles ids without duplicates', async () => {
    await favoritesStorage.addId(1);
    await favoritesStorage.addId(1);
    await favoritesStorage.addId(2);
    expect(await favoritesStorage.getIds()).toEqual([1, 2]);

    await favoritesStorage.removeId(1);
    expect(await favoritesStorage.getIds()).toEqual([2]);

    expect(await favoritesStorage.toggleId(3)).toBe(true);
    expect(await favoritesStorage.toggleId(3)).toBe(false);
    expect(await favoritesStorage.getIds()).toEqual([2]);
  });
});
