/**
 * Wishlist Context - saved products per user, persisted to AsyncStorage
 * Used by the heart buttons on the product page and by the Wishlist screen in the profile.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';

export interface WishItem {
    productId: number;
    title: string;
    thumbnail: string;
    price: number;
    discountPercentage: number;
    stock: number;
    category: string;
}

interface WishlistContextType {
    items: WishItem[];
    has: (productId: number) => boolean;
    /** Adds or removes the product; returns true when it was added */
    toggle: (item: WishItem) => boolean;
    remove: (productId: number) => void;
    clear: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const storageKey = (userId: number): string => `wishlist_${userId}`;

function isWishItem(value: unknown): value is WishItem {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.productId === 'number' &&
        typeof v.title === 'string' &&
        typeof v.thumbnail === 'string' &&
        typeof v.price === 'number' &&
        typeof v.discountPercentage === 'number' &&
        typeof v.stock === 'number' &&
        typeof v.category === 'string'
    );
}

export function WishlistProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const userId = user?.id ?? null;
    const [items, setItems] = useState<WishItem[]>([]);

    // Load this user's wishlist whenever the signed-in user changes
    useEffect(() => {
        if (userId === null) {
            setItems([]);
            return;
        }
        AsyncStorage.getItem(storageKey(userId))
            .then((raw) => {
                const parsed: unknown = raw ? JSON.parse(raw) : [];
                setItems(Array.isArray(parsed) ? parsed.filter(isWishItem) : []);
            })
            .catch(() => setItems([]));
    }, [userId]);

    const persist = useCallback(
        (next: WishItem[]) => {
            setItems(next);
            if (userId !== null) {
                AsyncStorage.setItem(storageKey(userId), JSON.stringify(next)).catch((error) => console.error('Failed to save wishlist:', error));
            }
        },
        [userId]
    );

    const has = useCallback((productId: number) => items.some((i) => i.productId === productId), [items]);

    const toggle = useCallback(
        (item: WishItem): boolean => {
            if (items.some((i) => i.productId === item.productId)) {
                persist(items.filter((i) => i.productId !== item.productId));
                return false;
            }
            persist([item, ...items]);
            return true;
        },
        [items, persist]
    );

    const remove = useCallback((productId: number) => persist(items.filter((i) => i.productId !== productId)), [items, persist]);
    const clear = useCallback(() => persist([]), [persist]);

    const value = useMemo<WishlistContextType>(() => ({ items, has, toggle, remove, clear }), [items, has, toggle, remove, clear]);

    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextType {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}

export { WishlistContext };