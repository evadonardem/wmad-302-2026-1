/**
 * Integration test: checkout + order history (API mocked, real storage + cart math)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOrderById, getOrders, placeOrder } from '@/services/orderService';
import { productApi } from '@/services/productApi';
import type { Cart } from '@/types/product';

jest.mock('@/services/productApi', () => ({
  productApi: { addCart: jest.fn(), getUserCarts: jest.fn(), getCartById: jest.fn() },
}));

const api = productApi as jest.Mocked<typeof productApi>;

const remoteCart: Cart = {
  id: 7,
  userId: 1,
  products: [
    { id: 3, title: 'Lamp', price: 50, quantity: 2, total: 100, discountPercentage: 10, discountedTotal: 90, thumbnail: '' },
  ],
  total: 100,
  discountedTotal: 90,
  totalProducts: 1,
  totalQuantity: 2,
};

const shipping = { fullName: 'Ada L', phone: '0917 123 4567', street: '1 Main St', city: 'Manila', postalCode: '1000' };

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe('orderService', () => {
  it('posts the cart, computes totals and saves the order locally', async () => {
    api.addCart.mockResolvedValue({ ...remoteCart, id: 51 });

    const order = await placeOrder({
      userId: 1,
      items: [{ productId: 3, title: 'Lamp', thumbnail: '', price: 50, discountPercentage: 10, quantity: 2, stock: 9 }],
      couponCode: 'SAVE10',
      shipping,
      paymentLabel: 'Cash on Delivery',
    });

    expect(api.addCart).toHaveBeenCalledWith({ userId: 1, products: [{ id: 3, quantity: 2 }] });
    expect(order).toMatchObject({ cartId: 51, source: 'local', couponCode: 'SAVE10', couponDiscount: 9, grandTotal: 81 });
    expect(await getOrderById(order.id)).toEqual(order);
  });

  it('refuses to place an empty order', async () => {
    await expect(
      placeOrder({ userId: 1, items: [], couponCode: null, shipping, paymentLabel: 'COD' })
    ).rejects.toThrow('Your cart is empty');
    expect(api.addCart).not.toHaveBeenCalled();
  });

  it('merges local orders with the user carts from the API', async () => {
    api.addCart.mockResolvedValue({ ...remoteCart, id: 52 });
    api.getUserCarts.mockResolvedValue({ carts: [remoteCart], total: 1 });
    await placeOrder({
      userId: 1,
      items: [{ productId: 3, title: 'Lamp', thumbnail: '', price: 50, discountPercentage: 0, quantity: 1, stock: 9 }],
      couponCode: null,
      shipping,
      paymentLabel: 'COD',
    });

    const orders = await getOrders(1);
    expect(orders.map((o) => o.source)).toEqual(['local', 'api']);
    expect(orders[1]).toMatchObject({ id: 'api-7', grandTotal: 90, productDiscount: 10 });
  });

  it('loads API orders by id', async () => {
    api.getCartById.mockResolvedValue(remoteCart);
    expect(await getOrderById('api-7')).toMatchObject({ cartId: 7, lines: [expect.objectContaining({ discountedTotal: 90 })] });
  });
});
