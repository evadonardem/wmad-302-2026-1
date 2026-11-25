/**
 * Cart Context with useReducer + AsyncStorage persistence
 * - add / remove / update quantity
 * - totals and badge count (totalQuantity)
 * - simple coupon codes (bonus)
 */
import React, {
    createContext,
    useContext,
    useReducer,
    useEffect,
    useCallback,
    useMemo,
    ReactNode,
} from 'react';
import { CartItem } from '@/types/product';
import { cartStorage } from '@/utils/storage';

// Demo coupon codes (DummyJSON has no coupon endpoint)
export const COUPONS: Record<string, number> = {
    SAVE10: 10,
    SAVE20: 20,
};

export interface CartState {
    items: CartItem[];
    isLoading: boolean;
    couponCode: string | null;
    couponPercent: number;
}

export type CartAction =
    | { type: 'CART_LOAD'; payload: CartItem[] }
    | { type: 'CART_ADD'; payload: CartItem }
    | { type: 'CART_UPDATE_QTY'; payload: { productId: number; quantity: number } }
    | { type: 'CART_REMOVE'; payload: number }
    | { type: 'CART_CLEAR' }
    | { type: 'CART_APPLY_COUPON'; payload: { code: string; percent: number } }
    | { type: 'CART_REMOVE_COUPON' };

const initialState: CartState = {
    items: [],
    isLoading: true,
    couponCode: null,
    couponPercent: 0,
};

export function cartReducer(state: CartState, action: CartAction): CartState {
    switch (action.type) {
        case 'CART_LOAD':
            return { ...state, items: action.payload, isLoading: false };

        case 'CART_ADD': {
            const existing = state.items.find((i) => i.productId === action.payload.productId);
            if (existing) {
                // Never go above the available stock
                const quantity = Math.min(existing.quantity + action.payload.quantity, existing.stock);
                return {
                    ...state,
                    items: state.items.map((i) =>
                        i.productId === action.payload.productId ? { ...i, quantity } : i
                    ),
                };
            }
            return { ...state, items: [...state.items, action.payload] };
        }

        case 'CART_UPDATE_QTY': {
            if (action.payload.quantity <= 0) {
                return {
                    ...state,
                    items: state.items.filter((i) => i.productId !== action.payload.productId),
                };
            }
            return {
                ...state,
                items: state.items.map((i) =>
                    i.productId === action.payload.productId
                        ? { ...i, quantity: Math.min(action.payload.quantity, i.stock) }
                        : i
                ),
            };
        }

        case 'CART_REMOVE':
            return { ...state, items: state.items.filter((i) => i.productId !== action.payload) };

        case 'CART_CLEAR':
            return { ...state, items: [], couponCode: null, couponPercent: 0 };

        case 'CART_APPLY_COUPON':
            return { ...state, couponCode: action.payload.code, couponPercent: action.payload.percent };

        case 'CART_REMOVE_COUPON':
            return { ...state, couponCode: null, couponPercent: 0 };

        default:
            return state;
    }
}

interface CartContextType {
    items: CartItem[];
    isLoading: boolean;
    couponCode: string | null;
    totalQuantity: number; // used for the tab badge
    totalProducts: number;
    total: number; // before product discounts
    discountedTotal: number; // after product discounts
    couponDiscount: number;
    finalTotal: number; // after product discounts and coupon
    addItem: (item: CartItem) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    removeItem: (productId: number) => void;
    clearCart: () => void;
    applyCoupon: (code: string) => boolean;
    removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(cartReducer, initialState);

    // Load the saved cart on mount
    useEffect(() => {
        let active = true;
        cartStorage
            .getCart()
            .then((items) => {
                if (active) dispatch({ type: 'CART_LOAD', payload: items });
            })
            .catch(() => {
                if (active) dispatch({ type: 'CART_LOAD', payload: [] });
            });
        return () => {
            active = false;
        };
    }, []);

    // Persist every change (only after the first load, so we never overwrite saved data)
    useEffect(() => {
        if (state.isLoading) return;
        cartStorage.setCart(state.items).catch((error) => console.error('Failed to save cart:', error));
    }, [state.items, state.isLoading]);

    const addItem = useCallback((item: CartItem) => dispatch({ type: 'CART_ADD', payload: item }), []);
    const updateQuantity = useCallback(
        (productId: number, quantity: number) =>
            dispatch({ type: 'CART_UPDATE_QTY', payload: { productId, quantity } }),
        []
    );
    const removeItem = useCallback(
        (productId: number) => dispatch({ type: 'CART_REMOVE', payload: productId }),
        []
    );
    const clearCart = useCallback(() => dispatch({ type: 'CART_CLEAR' }), []);
    const applyCoupon = useCallback((code: string): boolean => {
        const key = code.trim().toUpperCase();
        const percent = COUPONS[key];
        if (!percent) return false;
        dispatch({ type: 'CART_APPLY_COUPON', payload: { code: key, percent } });
        return true;
    }, []);
    const removeCoupon = useCallback(() => dispatch({ type: 'CART_REMOVE_COUPON' }), []);

    const value = useMemo<CartContextType>(() => {
        const total = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const discountedTotal = state.items.reduce(
            (sum, i) => sum + i.price * (1 - i.discountPercentage / 100) * i.quantity,
            0
        );
        const couponDiscount = discountedTotal * (state.couponPercent / 100);
        return {
            items: state.items,
            isLoading: state.isLoading,
            couponCode: state.couponCode,
            totalQuantity: state.items.reduce((sum, i) => sum + i.quantity, 0),
            totalProducts: state.items.length,
            total,
            discountedTotal,
            couponDiscount,
            finalTotal: discountedTotal - couponDiscount,
            addItem,
            updateQuantity,
            removeItem,
            clearCart,
            applyCoupon,
            removeCoupon,
        };
    }, [state, addItem, updateQuantity, removeItem, clearCart, applyCoupon, removeCoupon]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}

export { CartContext };