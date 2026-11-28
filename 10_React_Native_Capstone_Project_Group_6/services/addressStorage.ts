import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SavedAddress } from '@/types/address';

const STORAGE_KEY = 'marketplace:addresses';

function storageKey(userId: number) {
  return `${STORAGE_KEY}:${userId}`;
}

function isSavedAddress(value: unknown): value is SavedAddress {
  if (typeof value !== 'object' || value === null) return false;
  const address = value as Record<string, unknown>;
  return (
    typeof address.id === 'string' &&
    typeof address.label === 'string' &&
    typeof address.fullName === 'string' &&
    typeof address.phone === 'string' &&
    typeof address.street === 'string' &&
    typeof address.unit === 'string' &&
    typeof address.city === 'string' &&
    typeof address.region === 'string' &&
    typeof address.postalCode === 'string' &&
    typeof address.country === 'string' &&
    typeof address.isDefault === 'boolean'
  );
}

export async function getSavedAddresses(userId: number): Promise<SavedAddress[]> {
  const stored = await AsyncStorage.getItem(storageKey(userId));
  if (!stored) return [];

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed) || !parsed.every(isSavedAddress)) {
    throw new Error('Saved address data is invalid.');
  }
  return parsed;
}

export async function saveAddresses(userId: number, addresses: SavedAddress[]): Promise<void> {
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(addresses));
}
