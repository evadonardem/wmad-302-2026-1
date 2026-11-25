/**
 * Payment methods - saved on this device with AsyncStorage (DummyJSON has no payment endpoint).
 * Only the brand and the LAST 4 digits are stored. Full card numbers and security codes
 * are never saved: the form reads them once to validate, then forgets them.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PaymentType = 'card' | 'wallet';

export interface PaymentMethod {
    id: string;
    type: PaymentType;
    /** Visa / Mastercard / ... for cards, GCash / Maya / PayPal for wallets */
    brand: string;
    last4: string;
    holder: string;
    /** MM/YY for cards, null for wallets */
    expiry: string | null;
    isDefault: boolean;
}

const storageKey = (userId: number): string => `payment_methods_${userId}`;

export const WALLET_PROVIDERS = ['GCash', 'Maya', 'PayPal'] as const;

export function onlyDigits(value: string): string {
    return value.replace(/\D/g, '');
}

export function detectBrand(digits: string): string {
    if (/^4/.test(digits)) return 'Visa';
    if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) return 'Mastercard';
    if (/^3[47]/.test(digits)) return 'Amex';
    if (/^6(011|5)/.test(digits)) return 'Discover';
    return 'Card';
}

// Luhn checksum: catches mistyped card numbers
export function luhnValid(digits: string): boolean {
    let sum = 0;
    let double = false;
    for (let i = digits.length - 1; i >= 0; i -= 1) {
        let n = Number(digits[i]);
        if (double) {
            n *= 2;
            if (n > 9) n -= 9;
        }
        sum += n;
        double = !double;
    }
    return digits.length > 0 && sum % 10 === 0;
}

export function formatCardNumber(input: string): string {
    return onlyDigits(input).slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
}

export function formatExpiry(input: string): string {
    const digits = onlyDigits(input).slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function isExpiryValid(expiry: string, now: Date = new Date()): boolean {
    const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(expiry);
    if (!match) return false;
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}

function isMethod(value: unknown): value is PaymentMethod {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.id === 'string' &&
        (v.type === 'card' || v.type === 'wallet') &&
        typeof v.brand === 'string' &&
        typeof v.last4 === 'string' &&
        typeof v.holder === 'string' &&
        (typeof v.expiry === 'string' || v.expiry === null) &&
        typeof v.isDefault === 'boolean'
    );
}

export async function loadPaymentMethods(userId: number): Promise<PaymentMethod[]> {
    try {
        const raw = await AsyncStorage.getItem(storageKey(userId));
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter(isMethod) : [];
    } catch {
        return [];
    }
}

export async function savePaymentMethods(userId: number, methods: PaymentMethod[]): Promise<void> {
    try {
        await AsyncStorage.setItem(storageKey(userId), JSON.stringify(methods));
    } catch (error) {
        console.error('Failed to save payment methods:', error);
    }
}