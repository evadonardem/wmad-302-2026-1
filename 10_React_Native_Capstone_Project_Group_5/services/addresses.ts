/**
 * Delivery addresses - saved on this device with AsyncStorage (DummyJSON has no address endpoint).
 * Full CRUD lives in components/AddressManager.tsx; checkout pre-fills from the default address.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AddressLabel = 'Home' | 'Work' | 'Other';

export const ADDRESS_LABELS: AddressLabel[] = ['Home', 'Work', 'Other'];

// Same rule the checkout form uses for phone numbers
export const PHONE_PATTERN = /^[0-9+\-\s]{7,15}$/;

export interface Address {
    id: string;
    label: AddressLabel;
    fullName: string;
    phone: string;
    street: string;
    city: string;
    region: string;
    postalCode: string;
    isDefault: boolean;
}

const storageKey = (userId: number): string => `addresses_${userId}`;

export function formatAddress(a: Address): string {
    return `${a.street}, ${a.city}, ${a.region} ${a.postalCode}`.trim();
}

function isAddress(value: unknown): value is Address {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.id === 'string' &&
        (v.label === 'Home' || v.label === 'Work' || v.label === 'Other') &&
        typeof v.fullName === 'string' &&
        typeof v.phone === 'string' &&
        typeof v.street === 'string' &&
        typeof v.city === 'string' &&
        typeof v.region === 'string' &&
        typeof v.postalCode === 'string' &&
        typeof v.isDefault === 'boolean'
    );
}

export async function loadAddresses(userId: number): Promise<Address[]> {
    try {
        const raw = await AsyncStorage.getItem(storageKey(userId));
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter(isAddress) : [];
    } catch {
        return [];
    }
}

export async function saveAddresses(userId: number, addresses: Address[]): Promise<void> {
    try {
        await AsyncStorage.setItem(storageKey(userId), JSON.stringify(addresses));
    } catch (error) {
        console.error('Failed to save addresses:', error);
    }
}