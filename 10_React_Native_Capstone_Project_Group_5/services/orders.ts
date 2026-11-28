/**
 * Orders - the orders placed in the app, saved on this device with AsyncStorage.
 *
 * DummyJSON's POST /carts/add only simulates a checkout: the new cart is never
 * returned by GET /carts/user/{id}. To make "My orders" and the spent total
 * reflect what the shopper actually bought, every placed order is stored here
 * (per user) and merged with the API history when the profile loads.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cart } from '@/types/product';

export type PaymentChoice = 'card' | 'wallet' | 'cod';

export const PAYMENT_LABELS: Record<PaymentChoice, string> = {
    card: 'Credit / debit card',
    wallet: 'E-payment',
    cod: 'Cash on delivery',
};

export interface OrderRecord extends Cart {
    /** ISO timestamp of when the order was placed in the app */
    placedAt?: string;
    paymentMethod?: PaymentChoice;
    shippingName?: string;
    shippingAddress?: string;
    shippingPhone?: string;
}

const storageKey = (userId: number): string => `orders_${userId}`;

function isOrder(value: unknown): value is OrderRecord {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    if (typeof v.id !== 'number' || !Array.isArray(v.products)) return false;
    if (
        typeof v.total !== 'number' ||
        typeof v.discountedTotal !== 'number' ||
        typeof v.totalProducts !== 'number' ||
        typeof v.totalQuantity !== 'number' ||
        typeof v.userId !== 'number'
    ) {
        return false;
    }
    return v.products.every((p) => {
        if (typeof p !== 'object' || p === null) return false;
        const item = p as Record<string, unknown>;
        return (
            typeof item.id === 'number' &&
            typeof item.title === 'string' &&
            typeof item.price === 'number' &&
            typeof item.quantity === 'number' &&
            typeof item.total === 'number' &&
            typeof item.discountPercentage === 'number' &&
            typeof item.discountedTotal === 'number' &&
            typeof item.thumbnail === 'string'
        );
    });
}

export async function loadLocalOrders(userId: number): Promise<OrderRecord[]> {
    try {
        const raw = await AsyncStorage.getItem(storageKey(userId));
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter(isOrder) : [];
    } catch {
        return [];
    }
}

export async function saveLocalOrders(userId: number, orders: OrderRecord[]): Promise<void> {
    try {
        await AsyncStorage.setItem(storageKey(userId), JSON.stringify(orders));
    } catch (error) {
        console.error('Failed to save orders:', error);
    }
}

/** Store a newly placed order at the top of the list (newest first). */
export async function addLocalOrder(userId: number, order: OrderRecord): Promise<OrderRecord[]> {
    const current = await loadLocalOrders(userId);
    const next = [order, ...current.filter((o) => o.id !== order.id)];
    await saveLocalOrders(userId, next);
    return next;
}
