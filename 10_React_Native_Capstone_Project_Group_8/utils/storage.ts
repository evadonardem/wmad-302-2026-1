
/**
 * AsyncStorage Utilities
 * Marketplace App
 *
 * Handles:
 * - Authentication storage
 * - Favorites storage
 * - Shopping cart storage
 * - Order history storage
 * - Order cancellation
 * - Simulated order tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CartItem } from '@/types/product';
import type { AuthUser } from '@/types/auth';
import type {
  Order,
  TrackingEvent,
  TrackingMilestone,
} from '@/types/order';

const STORAGE_KEYS = {
  AUTH_USER: 'auth_user',
  FAVORITES: 'favorite_recipe_ids',
  CART: 'cart_items',
  SETTINGS: 'user_settings',
  ORDERS: 'marketplace_orders',
} as const;

export type StorageKey =
  (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * The complete sequence of simulated tracking milestones.
 */
const TRACKING_MILESTONES: TrackingMilestone[] = [
  'Order Placed',
  'Order Confirmed',
  'Preparing Shipment',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

/**
 * Descriptions displayed for each tracking milestone.
 */
const TRACKING_DESCRIPTIONS: Record<
  TrackingMilestone,
  string
> = {
  'Order Placed':
    'Your order has been successfully placed.',
  'Order Confirmed':
    'Your order has been confirmed and is being processed.',
  'Preparing Shipment':
    'Your items are being prepared for shipment.',
  Shipped:
    'Your package has been dispatched and is on its way.',
  'Out for Delivery':
    'Your package is with the delivery courier.',
  Delivered:
    'Your package has been successfully delivered.',
};

/**
 * Creates a tracking reference number for older orders
 * that were saved before tracking was introduced.
 */
function createTrackingNumber(orderId: string): string {
  return `TRK-${orderId}`;
}

/**
 * Provides tracking information for older orders.
 *
 * Existing orders receive an initial Order Placed event
 * using their original creation timestamp.
 */
function ensureTrackingData(order: Order): Order {
  const trackingNumber =
    order.trackingNumber || createTrackingNumber(order.id);

  const trackingEvents: TrackingEvent[] =
    order.trackingEvents && order.trackingEvents.length > 0
      ? order.trackingEvents
      : [
          {
            milestone: 'Order Placed',
            description:
              TRACKING_DESCRIPTIONS['Order Placed'],
            timestamp: order.createdAt,
          },
        ];

  return {
    ...order,
    trackingNumber,
    trackingEvents,
  };
}

/**
 * Get item from storage with type safety.
 */
export async function getStorageItem<T>(
  key: StorageKey,
): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);

    return value ? JSON.parse(value) as T : null;
  } catch (error) {
    console.error(`Failed to get storage item ${key}:`, error);
    return null;
  }
}

/**
 * Set item in storage.
 */
export async function setStorageItem<T>(
  key: StorageKey,
  value: T,
): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to set storage item ${key}:`, error);
    throw error;
  }
}

/**
 * Remove item from storage.
 */
export async function removeStorageItem(
  key: StorageKey,
): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove storage item ${key}:`, error);
  }
}

/**
 * Clear all app storage.
 */
export async function clearAllStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
}

/**
 * Get multiple items at once.
 */
export async function getMultipleStorageItems<
  T extends Record<string, unknown>,
>(keys: StorageKey[]): Promise<T> {
  try {
    const pairs = await AsyncStorage.multiGet(keys);
    const result = {} as T;

    pairs.forEach(([key, value]) => {
      (result as Record<string, unknown>)[key] = value
        ? JSON.parse(value)
        : null;
    });

    return result;
  } catch (error) {
    console.error('Failed to get multiple storage items:', error);
    return {} as T;
  }
}

/**
 * Set multiple items at once.
 */
export async function setMultipleStorageItems(
  items: { key: StorageKey; value: unknown }[],
): Promise<void> {
  try {
    const pairs = items.map(
      ({ key, value }): [string, string] => [
        key,
        JSON.stringify(value),
      ],
    );

    await AsyncStorage.multiSet(pairs);
  } catch (error) {
    console.error('Failed to set multiple storage items:', error);
    throw error;
  }
}

/* =====================================================
   AUTHENTICATION STORAGE
===================================================== */

export const authStorage = {
  getUser: (): Promise<AuthUser | null> =>
    getStorageItem<AuthUser>(STORAGE_KEYS.AUTH_USER),

  setUser: (user: AuthUser): Promise<void> =>
    setStorageItem(STORAGE_KEYS.AUTH_USER, user),

  clearUser: (): Promise<void> =>
    removeStorageItem(STORAGE_KEYS.AUTH_USER),
};

/* =====================================================
   FAVORITES STORAGE
===================================================== */

export const favoritesStorage = {
  getIds: async (): Promise<number[]> =>
    (await getStorageItem<number[]>(STORAGE_KEYS.FAVORITES)) ?? [],

  setIds: (ids: number[]) =>
    setStorageItem(STORAGE_KEYS.FAVORITES, ids),

  addId: async (id: number) => {
    const ids = await favoritesStorage.getIds();

    if (!ids.includes(id)) {
      await favoritesStorage.setIds([...ids, id]);
    }
  },

  removeId: async (id: number) => {
    const ids = await favoritesStorage.getIds();

    await favoritesStorage.setIds(
      ids.filter((itemId) => itemId !== id),
    );
  },

  toggleId: async (id: number) => {
    const ids = await favoritesStorage.getIds();

    if (ids.includes(id)) {
      await favoritesStorage.removeId(id);
      return false;
    }

    await favoritesStorage.addId(id);
    return true;
  },
};

/* =====================================================
   SHOPPING CART STORAGE
===================================================== */

export const cartStorage = {
  getCart: async (): Promise<CartItem[]> =>
    (await getStorageItem<CartItem[]>(STORAGE_KEYS.CART)) ?? [],

  setCart: (items: CartItem[]) =>
    setStorageItem(STORAGE_KEYS.CART, items),

  addItem: async (item: CartItem) => {
    const items = await cartStorage.getCart();

    const existingIndex = items.findIndex(
      (cartItem) => cartItem.productId === item.productId,
    );

    if (existingIndex >= 0) {
      items[existingIndex].quantity += item.quantity;
    } else {
      items.push(item);
    }

    await cartStorage.setCart(items);
  },

  updateQuantity: async (
    productId: number,
    quantity: number,
  ) => {
    const items = await cartStorage.getCart();

    const index = items.findIndex(
      (item) => item.productId === productId,
    );

    if (index >= 0) {
      if (quantity <= 0) {
        items.splice(index, 1);
      } else {
        items[index].quantity = quantity;
      }

      await cartStorage.setCart(items);
    }
  },

  removeItem: async (productId: number) => {
    const items = await cartStorage.getCart();

    await cartStorage.setCart(
      items.filter(
        (item) => item.productId !== productId,
      ),
    );
  },

  clear: () => removeStorageItem(STORAGE_KEYS.CART),
};

/* =====================================================
   ORDER HISTORY AND TRACKING STORAGE
===================================================== */

export const ordersStorage = {
  /**
   * Retrieves all saved orders.
   */
  getOrders: async (): Promise<Order[]> =>
    (await getStorageItem<Order[]>(STORAGE_KEYS.ORDERS)) ?? [],

  /**
   * Retrieves orders belonging to a specific user.
   */
  getUserOrders: async (userId: number): Promise<Order[]> => {
    const orders = await ordersStorage.getOrders();

    return orders
      .filter((order) => order.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      );
  },

  /**
   * Saves a new order without deleting previous orders.
   */
  saveOrder: async (order: Order): Promise<void> => {
    const orders = await ordersStorage.getOrders();

    await setStorageItem(
      STORAGE_KEYS.ORDERS,
      [order, ...orders],
    );
  },

  /**
   * Saves a completed order and clears the cart.
   *
   * The order is saved before the cart is emptied.
   * If saving fails, the cart remains untouched.
   */
  completeOrder: async (order: Order): Promise<void> => {
    const orders = await ordersStorage.getOrders();

    const updatedOrders = [order, ...orders];

    try {
      await AsyncStorage.multiSet([
        [
          STORAGE_KEYS.ORDERS,
          JSON.stringify(updatedOrders),
        ],
        [
          STORAGE_KEYS.CART,
          JSON.stringify([]),
        ],
      ]);
    } catch (error) {
      console.error('Failed to complete order:', error);
      throw error;
    }
  },

  /**
   * Retrieves a specific order.
   *
   * Also provides fallback tracking information for
   * older orders without changing their saved data.
   */
  getOrderById: async (
    orderId: string,
  ): Promise<Order | null> => {
    const orders = await ordersStorage.getOrders();

    const order = orders.find(
      (item) => item.id === orderId,
    );

    return order ? ensureTrackingData(order) : null;
  },

  /**
   * Advances an order to its next tracking milestone.
   *
   * Requirements:
   * - The order must exist.
   * - The order must belong to the requesting user.
   * - The order must not be Cancelled.
   * - The order must not already be Delivered.
   *
   * Each milestone is saved with its own timestamp.
   * The updated order is returned on success.
   * Returns null if the update is not allowed.
   */
  advanceTracking: async (
    orderId: string,
    userId: number,
  ): Promise<Order | null> => {
    const orders = await ordersStorage.getOrders();

    const orderIndex = orders.findIndex(
      (item) => item.id === orderId,
    );

    if (orderIndex === -1) {
      return null;
    }

    const selectedOrder = orders[orderIndex];

    if (
      selectedOrder.userId !== userId ||
      selectedOrder.status === 'Cancelled' ||
      selectedOrder.status === 'Delivered'
    ) {
      return null;
    }

    const orderWithTracking = ensureTrackingData(selectedOrder);
    const trackingEvents = [
      ...(orderWithTracking.trackingEvents ?? []),
    ];

    const lastEvent = trackingEvents[trackingEvents.length - 1];

    const lastMilestoneIndex = TRACKING_MILESTONES.indexOf(
      lastEvent.milestone,
    );

    if (
      lastMilestoneIndex === -1 ||
      lastMilestoneIndex >= TRACKING_MILESTONES.length - 1
    ) {
      return null;
    }

    const nextMilestone =
      TRACKING_MILESTONES[lastMilestoneIndex + 1];

    const newEvent: TrackingEvent = {
      milestone: nextMilestone,
      description: TRACKING_DESCRIPTIONS[nextMilestone],
      timestamp: new Date().toISOString(),
    };

    trackingEvents.push(newEvent);

    let updatedStatus = orderWithTracking.status;

    if (
      nextMilestone === 'Shipped' ||
      nextMilestone === 'Out for Delivery'
    ) {
      updatedStatus = 'Shipped';
    }

    if (nextMilestone === 'Delivered') {
      updatedStatus = 'Delivered';
    }

    const updatedOrder: Order = {
      ...orderWithTracking,
      status: updatedStatus,
      trackingEvents,
    };

    const updatedOrders = [...orders];

    updatedOrders[orderIndex] = updatedOrder;

    await setStorageItem(
      STORAGE_KEYS.ORDERS,
      updatedOrders,
    );

    return updatedOrder;
  },

  /**
   * Cancels an order only when:
   * - The order exists.
   * - The order belongs to the requesting user.
   * - The current status is Processing.
   *
   * Returns the updated order when successful.
   * Returns null when cancellation is not allowed.
   */
  cancelOrder: async (
    orderId: string,
    userId: number,
  ): Promise<Order | null> => {
    const orders = await ordersStorage.getOrders();

    const orderIndex = orders.findIndex(
      (item) => item.id === orderId,
    );

    if (orderIndex === -1) {
      return null;
    }

    const selectedOrder = orders[orderIndex];

    if (
      selectedOrder.userId !== userId ||
      selectedOrder.status !== 'Processing'
    ) {
      return null;
    }

    const updatedOrder: Order = {
      ...selectedOrder,
      status: 'Cancelled',
    };

    const updatedOrders = [...orders];

    updatedOrders[orderIndex] = updatedOrder;

    await setStorageItem(
      STORAGE_KEYS.ORDERS,
      updatedOrders,
    );

    return updatedOrder;
  },
};
