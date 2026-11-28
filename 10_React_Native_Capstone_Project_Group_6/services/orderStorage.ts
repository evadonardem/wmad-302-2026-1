import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Cart } from '@/types/product';

function storageKey(userId: number) {
  return `marketplace:orders:${userId}`;
}

function isOrder(value: unknown): value is Cart {
  if (typeof value !== 'object' || value === null) return false;
  const order = value as Record<string, unknown>;
  return (
    typeof order.id === 'number' &&
    typeof order.userId === 'number' &&
    typeof order.total === 'number' &&
    typeof order.discountedTotal === 'number' &&
    typeof order.totalProducts === 'number' &&
    typeof order.totalQuantity === 'number' &&
    Array.isArray(order.products) &&
    order.products.every((value) => {
      if (typeof value !== 'object' || value === null) return false;
      const product = value as Record<string, unknown>;
      return (
        typeof product.id === 'number' &&
        typeof product.title === 'string' &&
        typeof product.price === 'number' &&
        typeof product.quantity === 'number' &&
        typeof product.total === 'number' &&
        typeof product.discountPercentage === 'number' &&
        typeof product.discountedTotal === 'number' &&
        typeof product.thumbnail === 'string'
      );
    })
  );
}

export async function getLocalOrders(userId: number): Promise<Cart[]> {
  const stored = await AsyncStorage.getItem(storageKey(userId));
  if (!stored) return [];

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed) || !parsed.every(isOrder)) {
    throw new Error('Saved order history is invalid.');
  }
  return parsed;
}

export async function saveLocalOrder(order: Cart): Promise<void> {
  const orders = await getLocalOrders(order.userId);
  await AsyncStorage.setItem(storageKey(order.userId), JSON.stringify([order, ...orders]));
}
