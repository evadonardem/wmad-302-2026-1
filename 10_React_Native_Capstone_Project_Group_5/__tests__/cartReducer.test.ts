import { cartReducer, CartState } from '@/context/CartContext';
import { CartItem } from '@/types/product';

const baseItem: CartItem = {
  productId: 1,
  title: 'Test Product',
  thumbnail: 'img.jpg',
  price: 100,
  discountPercentage: 10,
  quantity: 1,
  stock: 5,
};

const baseState: CartState = {
  items: [],
  isLoading: true,
  couponCode: null,
  couponPercent: 0,
};

describe('cartReducer', () => {
  it('loads cart items', () => {
    const next = cartReducer(baseState, { type: 'CART_LOAD', payload: [baseItem] });
    expect(next.items).toHaveLength(1);
    expect(next.isLoading).toBe(false);
  });

  it('adds new item and merges existing item quantity with stock cap', () => {
    const withItem = cartReducer(baseState, { type: 'CART_ADD', payload: baseItem });
    const merged = cartReducer(withItem, { type: 'CART_ADD', payload: { ...baseItem, quantity: 10 } });
    expect(merged.items).toHaveLength(1);
    expect(merged.items[0].quantity).toBe(5);
  });

  it('updates quantity and removes when quantity <= 0', () => {
    const loaded = { ...baseState, items: [baseItem], isLoading: false };
    const updated = cartReducer(loaded, { type: 'CART_UPDATE_QTY', payload: { productId: 1, quantity: 3 } });
    expect(updated.items[0].quantity).toBe(3);
    const removed = cartReducer(updated, { type: 'CART_UPDATE_QTY', payload: { productId: 1, quantity: 0 } });
    expect(removed.items).toHaveLength(0);
  });

  it('removes item, clears cart, and handles coupons', () => {
    const loaded = { ...baseState, items: [baseItem], isLoading: false };
    expect(cartReducer(loaded, { type: 'CART_REMOVE', payload: 1 }).items).toHaveLength(0);

    const withCoupon = cartReducer(loaded, { type: 'CART_APPLY_COUPON', payload: { code: 'SAVE10', percent: 10 } });
    expect(withCoupon.couponCode).toBe('SAVE10');
    expect(cartReducer(withCoupon, { type: 'CART_REMOVE_COUPON' }).couponCode).toBeNull();

    const cleared = cartReducer(withCoupon, { type: 'CART_CLEAR' });
    expect(cleared.items).toHaveLength(0);
    expect(cleared.couponCode).toBeNull();
  });
});
