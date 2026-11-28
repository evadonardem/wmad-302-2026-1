import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  authStorage,
  cartStorage,
  clearAllStorage,
  favoritesStorage,
  getMultipleStorageItems,
  getStorageItem,
  removeStorageItem,
  setMultipleStorageItems,
  setStorageItem,
} from '@/utils/storage';

describe('storage utils', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('sets, gets, and removes items', async () => {
    await setStorageItem('favorite_recipe_ids', [1, 2]);
    await expect(getStorageItem<number[]>('favorite_recipe_ids')).resolves.toEqual([1, 2]);
    await removeStorageItem('favorite_recipe_ids');
    await expect(getStorageItem<number[]>('favorite_recipe_ids')).resolves.toBeNull();
  });

  it('favoritesStorage toggles ids', async () => {
    await expect(favoritesStorage.toggleId(5)).resolves.toBe(true);
    await expect(favoritesStorage.getIds()).resolves.toEqual([5]);
    await expect(favoritesStorage.toggleId(5)).resolves.toBe(false);
    await expect(favoritesStorage.getIds()).resolves.toEqual([]);
  });

  it('cartStorage adds, updates, removes and clears', async () => {
    await cartStorage.addItem({
      productId: 1,
      title: 'P',
      thumbnail: 't',
      price: 10,
      discountPercentage: 0,
      quantity: 1,
      stock: 5,
    });
    await cartStorage.addItem({
      productId: 1,
      title: 'P',
      thumbnail: 't',
      price: 10,
      discountPercentage: 0,
      quantity: 2,
      stock: 5,
    });
    let cart = await cartStorage.getCart();
    expect(cart[0].quantity).toBe(3);

    await cartStorage.updateQuantity(1, 5);
    cart = await cartStorage.getCart();
    expect(cart[0].quantity).toBe(5);

    await cartStorage.removeItem(1);
    await expect(cartStorage.getCart()).resolves.toEqual([]);
  });

  it('authStorage and clearAllStorage work', async () => {
    await authStorage.setUser({ id: 1, username: 'u' });
    await expect(authStorage.getUser()).resolves.toEqual({ id: 1, username: 'u' });
    await clearAllStorage();
    await expect(authStorage.getUser()).resolves.toBeNull();
  });

  it('handles multiple items and cart edge cases', async () => {
    await setMultipleStorageItems([
      { key: 'favorite_recipe_ids', value: [1] },
      { key: 'cart_items', value: [] },
    ]);
    const multi = await getMultipleStorageItems<Record<string, unknown>>(['favorite_recipe_ids', 'cart_items']);
    expect(multi.favorite_recipe_ids).toEqual([1]);

    await cartStorage.addItem({ productId: 2, title: 'X', thumbnail: 't', price: 1, discountPercentage: 0, quantity: 1, stock: 5 });
    await cartStorage.updateQuantity(2, 0);
    await expect(cartStorage.getCart()).resolves.toEqual([]);
    await cartStorage.clear();
  });
});
