import AsyncStorage from '@react-native-async-storage/async-storage';
import { authStorage, cartStorage, getStorageItem, ordersStorage, STORAGE_KEYS } from '@/utils/storage';
import type { Order } from '@/types/account';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('storage utils', () => {
  it('returns null for missing or corrupt values', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await getStorageItem(STORAGE_KEYS.SETTINGS)).toBeNull();
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, '{not json');
    expect(await getStorageItem(STORAGE_KEYS.SETTINGS)).toBeNull();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('round-trips the cart and clears it', async () => {
    const items = [
      { productId: 1, title: 'A', thumbnail: '', price: 1, discountPercentage: 0, quantity: 2, stock: 3 },
    ];
    await cartStorage.setCart(items);
    expect(await cartStorage.getCart()).toEqual(items);
    await cartStorage.clear();
    expect(await cartStorage.getCart()).toEqual([]);
  });

  it('stores and clears the auth user', async () => {
    const user = {
      id: 1,
      username: 'u',
      email: 'u@example.com',
      firstName: 'U',
      lastName: 'Ser',
      gender: 'male' as const,
      image: '',
      token: 't',
      refreshToken: 'r',
    };
    await authStorage.setUser(user);
    expect(await authStorage.getUser()).toEqual(user);
    await authStorage.clearUser();
    expect(await authStorage.getUser()).toBeNull();
  });

  it('prepends new orders', async () => {
    const order = (id: string) => ({ id }) as Order;
    await ordersStorage.add(order('first'));
    await ordersStorage.add(order('second'));
    expect((await ordersStorage.getAll()).map((o) => o.id)).toEqual(['second', 'first']);
  });
});
