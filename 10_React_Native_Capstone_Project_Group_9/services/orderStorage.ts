import type { OrderRecord } from '@/types/order';
import { getStorageItem, setStorageItem } from '@/utils/storage';

export async function getUserOrders(userId: number): Promise<OrderRecord[]> {
  const ordersByUser = await getStorageItem<Record<string, OrderRecord[]>>('user_orders');
  return ordersByUser?.[String(userId)] ?? [];
}

export async function saveUserOrder(userId: number, order: OrderRecord): Promise<void> {
  const ordersByUser = (await getStorageItem<Record<string, OrderRecord[]>>('user_orders')) ?? {};
  const orders = ordersByUser[String(userId)] ?? [];
  await setStorageItem('user_orders', {
    ...ordersByUser,
    [String(userId)]: [order, ...orders],
  });
}
