import { cartReducer, initialCartState, CartState } from '@/context/cartReducer';
import type { CartItem } from '@/types/product';

const phone: Omit<CartItem, 'quantity'> = {
  productId: 1,
  title: 'Phone',
  thumbnail: 'phone.png',
  price: 100,
  discountPercentage: 10,
  stock: 5,
};

const withItems = (items: CartItem[]): CartState => ({ ...initialCartState, hydrated: true, items });

describe('cartReducer', () => {
  it('hydrates items from storage', () => {
    const state = cartReducer(initialCartState, {
      type: 'HYDRATE',
      payload: { items: [{ ...phone, quantity: 2 }] },
    });
    expect(state.hydrated).toBe(true);
    expect(state.items).toHaveLength(1);
  });

  it('adds a new item', () => {
    const state = cartReducer(withItems([]), { type: 'ADD_ITEM', payload: { item: phone, quantity: 2 } });
    expect(state.items).toEqual([{ ...phone, quantity: 2 }]);
  });

  it('increments the quantity of an existing item', () => {
    const state = cartReducer(withItems([{ ...phone, quantity: 1 }]), {
      type: 'ADD_ITEM',
      payload: { item: phone, quantity: 2 },
    });
    expect(state.items[0].quantity).toBe(3);
  });

  it('never exceeds available stock when adding', () => {
    const state = cartReducer(withItems([{ ...phone, quantity: 4 }]), {
      type: 'ADD_ITEM',
      payload: { item: phone, quantity: 10 },
    });
    expect(state.items[0].quantity).toBe(5);
  });

  it('updates quantity and clamps it to stock', () => {
    const start = withItems([{ ...phone, quantity: 1 }]);
    expect(
      cartReducer(start, { type: 'UPDATE_QUANTITY', payload: { productId: 1, quantity: 3 } }).items[0].quantity
    ).toBe(3);
    expect(
      cartReducer(start, { type: 'UPDATE_QUANTITY', payload: { productId: 1, quantity: 99 } }).items[0].quantity
    ).toBe(5);
  });

  it('removes the item when quantity drops to zero', () => {
    const state = cartReducer(withItems([{ ...phone, quantity: 1 }]), {
      type: 'UPDATE_QUANTITY',
      payload: { productId: 1, quantity: 0 },
    });
    expect(state.items).toHaveLength(0);
  });

  it('removes an item', () => {
    const state = cartReducer(withItems([{ ...phone, quantity: 1 }]), {
      type: 'REMOVE_ITEM',
      payload: { productId: 1 },
    });
    expect(state.items).toHaveLength(0);
  });

  it('applies coupons in upper case and removes them', () => {
    const applied = cartReducer(withItems([]), { type: 'APPLY_COUPON', payload: { code: ' save10 ' } });
    expect(applied.couponCode).toBe('SAVE10');
    expect(cartReducer(applied, { type: 'REMOVE_COUPON' }).couponCode).toBeNull();
  });

  it('clears items and coupon', () => {
    const state = cartReducer(
      { ...withItems([{ ...phone, quantity: 1 }]), couponCode: 'SAVE10' },
      { type: 'CLEAR' }
    );
    expect(state.items).toHaveLength(0);
    expect(state.couponCode).toBeNull();
    expect(state.hydrated).toBe(true);
  });
});
