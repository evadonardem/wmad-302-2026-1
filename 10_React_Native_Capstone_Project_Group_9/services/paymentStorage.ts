import type { SavedPaymentMethod } from '@/types/payment';
import { getStorageItem, setStorageItem } from '@/utils/storage';

const STORAGE_KEY = 'user_payment_methods';

export async function getSavedPaymentMethods(userId: number): Promise<SavedPaymentMethod[]> {
  const methodsByUser = await getStorageItem<Record<string, SavedPaymentMethod[]>>(STORAGE_KEY);
  const methods = methodsByUser?.[String(userId)] ?? [];
  if (!Array.isArray(methods)) {
    throw new Error('Saved payment methods have an invalid format.');
  }
  return methods;
}

export async function saveUserPaymentMethods(
  userId: number,
  methods: SavedPaymentMethod[]
): Promise<void> {
  const methodsByUser = (await getStorageItem<Record<string, SavedPaymentMethod[]>>(STORAGE_KEY)) ?? {};
  await setStorageItem(STORAGE_KEY, { ...methodsByUser, [String(userId)]: methods });
}
