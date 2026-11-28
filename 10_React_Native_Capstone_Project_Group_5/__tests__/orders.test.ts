import AsyncStorage from '@react-native-async-storage/async-storage';
import { addLocalOrder, loadLocalOrders, saveLocalOrders } from '@/services/orders';

const order = {
  id: 100,
  products: [
    {
      id: 1,
      title: 'P',
      price: 10,
      quantity: 1,
      total: 10,
      discountPercentage: 0,
      discountedTotal: 10,
      thumbnail: 't.jpg',
    },
  ],
  total: 10,
  discountedTotal: 10,
  userId: 1,
  totalProducts: 1,
  totalQuantity: 1,
};

describe('orders service', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('saves and loads orders', async () => {
    await saveLocalOrders(1, [order]);
    await expect(loadLocalOrders(1)).resolves.toEqual([order]);
  });

  it('adds new order at top and replaces duplicate id', async () => {
    await saveLocalOrders(1, [order]);
    const updated = { ...order, total: 20, discountedTotal: 20 };
    const next = await addLocalOrder(1, updated);
    expect(next).toHaveLength(1);
    expect(next[0].total).toBe(20);
  });
});
