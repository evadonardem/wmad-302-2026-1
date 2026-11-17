
/**
 * AsyncStorage Utilities
 * Marketplace App
 *
 * Handles:
 * - Authentication storage
 * - Profile overrides
 * - Contact information
 * - Shipping addresses
 * - Account-specific favorites
 * - Account-specific shopping carts
 * - Order history
 * - Order cancellation
 * - Simulated order tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CartItem } from '@/types/product';
import type { AuthUser, UserId } from '@/types/auth';

import type {
  ContactInformation,
  SavedShippingAddress,
  Order,
  TrackingEvent,
  TrackingMilestone,
} from '@/types/order';

// =====================================================
// STORAGE KEYS
// =====================================================

const STORAGE_KEYS = {
  AUTH_USER: 'auth_user',
  FAVORITES: 'favorite_recipe_ids',
  CART: 'cart_items',
  SETTINGS: 'user_settings',
  ORDERS: 'marketplace_orders',
} as const;

export type StorageKey =
  (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export type ProfileOverrides = Pick<
  AuthUser,
  'firstName' | 'lastName' | 'username' | 'email' | 'gender'
>;

// =====================================================
// USER-SPECIFIC STORAGE KEYS
// =====================================================

const getProfileOverridesKey = (userId: UserId): string =>
  `marketplace_profile_overrides_${userId}`;

const getContactInformationKey = (userId: UserId): string =>
  `marketplace_contact_information_${userId}`;

const getShippingAddressKey = (userId: UserId): string =>
  `marketplace_shipping_address_${userId}`;

const getFavoritesKey = (userId: UserId): string =>
  `marketplace_favorites_${encodeURIComponent(String(userId))}`;

const getCartKey = (userId: UserId): string =>
  `marketplace_cart_${encodeURIComponent(String(userId))}`;

// =====================================================
// TRACKING CONFIGURATION
// =====================================================

const TRACKING_MILESTONES: TrackingMilestone[] = [
  'Order Placed',
  'Order Confirmed',
  'Preparing Shipment',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

const TRACKING_DESCRIPTIONS: Record<TrackingMilestone, string> = {
  'Order Placed': 'Your order has been successfully placed.',
  'Order Confirmed': 'Your order has been confirmed and is being processed.',
  'Preparing Shipment': 'Your items are being prepared for shipment.',
  Shipped: 'Your package has been dispatched and is on its way.',
  'Out for Delivery': 'Your package is with the delivery courier.',
  Delivered: 'Your package has been successfully delivered.',
};

function createTrackingNumber(orderId: string): string {
  return `TRK-${orderId}`;
}

function ensureTrackingData(order: Order): Order {
  const trackingNumber =
    order.trackingNumber || createTrackingNumber(order.id);

  const trackingEvents: TrackingEvent[] =
    order.trackingEvents && order.trackingEvents.length > 0
      ? order.trackingEvents
      : [
          {
            milestone: 'Order Placed',
            description: TRACKING_DESCRIPTIONS['Order Placed'],
            timestamp: order.createdAt,
          },
        ];

  return {
    ...order,
    trackingNumber,
    trackingEvents,
  };
}

// =====================================================
// GENERAL STORAGE HELPERS
// =====================================================

export async function getStorageItem<T>(
  key: StorageKey,
): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch (error) {
    console.error(`Failed to get storage item ${key}:`, error);
    return null;
  }
}

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

export async function removeStorageItem(key: StorageKey): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove storage item ${key}:`, error);
  }
}

/**
 * User-specific information is deliberately excluded.
 * Profile, contact, address, favorites, and cart data
 * remain available when the user logs out.
 */
export async function clearAllStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
}

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

// =====================================================
// AUTHENTICATION STORAGE
// =====================================================

export const authStorage = {
  getUser: (): Promise<AuthUser | null> =>
    getStorageItem<AuthUser>(STORAGE_KEYS.AUTH_USER),

  setUser: (user: AuthUser): Promise<void> =>
    setStorageItem(STORAGE_KEYS.AUTH_USER, user),

  clearUser: (): Promise<void> =>
    removeStorageItem(STORAGE_KEYS.AUTH_USER),
};

// =====================================================
// ACTIVE USER HELPERS
// =====================================================

/**
 * Gets the currently authenticated user's ID.
 *
 * This allows favorites and cart methods to remain
 * compatible with existing screens that do not pass
 * a user ID directly.
 */
async function getCurrentUserId(): Promise<UserId | null> {
  const user = await authStorage.getUser();

  return user?.id ?? null;
}

/**
 * Returns the correct account-specific key.
 *
 * When no user is authenticated, the legacy global
 * key is used for backward compatibility.
 */
async function getAccountStorageKey(
  userKey: (userId: UserId) => string,
  legacyKey: string,
): Promise<string> {
  const userId = await getCurrentUserId();

  return userId !== null ? userKey(userId) : legacyKey;
}

/**
 * Migrates existing global favorites/cart data
 * for an existing DummyJSON demo account.
 *
 * New Supabase accounts will NOT automatically inherit
 * another account's old global data.
 */
async function getAccountData<T>(
  userKey: (userId: UserId) => string,
  legacyKey: string,
  defaultValue: T,
): Promise<T> {
  try {
    const user = await authStorage.getUser();

    if (!user) {
      const legacyValue = await AsyncStorage.getItem(legacyKey);

      return legacyValue
        ? (JSON.parse(legacyValue) as T)
        : defaultValue;
    }

    const accountKey = userKey(user.id);
    const accountValue = await AsyncStorage.getItem(accountKey);

    if (accountValue !== null) {
      return JSON.parse(accountValue) as T;
    }

    // Only migrate legacy data to an existing
    // DummyJSON account, never to a new Supabase account.
    const isLegacyDemoAccount =
      user.authProvider === 'dummyjson' ||
      (user.authProvider === undefined && typeof user.id === 'number');

    if (isLegacyDemoAccount) {
      const legacyValue = await AsyncStorage.getItem(legacyKey);

      if (legacyValue !== null) {
        await AsyncStorage.setItem(accountKey, legacyValue);
        await AsyncStorage.removeItem(legacyKey);

        return JSON.parse(legacyValue) as T;
      }
    }

    return defaultValue;
  } catch (error) {
    console.error('Failed to get account-specific storage:', error);
    return defaultValue;
  }
}

async function setAccountData<T>(
  userKey: (userId: UserId) => string,
  legacyKey: string,
  value: T,
): Promise<void> {
  try {
    const storageKey = await getAccountStorageKey(
      userKey,
      legacyKey,
    );

    await AsyncStorage.setItem(storageKey, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save account-specific storage:', error);
    throw error;
  }
}

// =====================================================
// PROFILE OVERRIDES STORAGE
// =====================================================

export const profileOverridesStorage = {
  get: async (userId: UserId): Promise<ProfileOverrides | null> => {
    try {
      const value = await AsyncStorage.getItem(
        getProfileOverridesKey(userId),
      );

      return value ? (JSON.parse(value) as ProfileOverrides) : null;
    } catch (error) {
      console.error('Failed to get profile overrides:', error);
      return null;
    }
  },

  save: async (
    userId: UserId,
    profile: ProfileOverrides,
  ): Promise<void> => {
    try {
      await AsyncStorage.setItem(
        getProfileOverridesKey(userId),
        JSON.stringify(profile),
      );
    } catch (error) {
      console.error('Failed to save profile overrides:', error);
      throw error;
    }
  },

  clear: async (userId: UserId): Promise<void> => {
    try {
      await AsyncStorage.removeItem(getProfileOverridesKey(userId));
    } catch (error) {
      console.error('Failed to clear profile overrides:', error);
      throw error;
    }
  },
};

// =====================================================
// CONTACT INFORMATION STORAGE
// =====================================================

export const contactInformationStorage = {
  get: async (
    userId: UserId,
  ): Promise<ContactInformation | null> => {
    try {
      const value = await AsyncStorage.getItem(
        getContactInformationKey(userId),
      );

      return value ? (JSON.parse(value) as ContactInformation) : null;
    } catch (error) {
      console.error('Failed to get contact information:', error);
      return null;
    }
  },

  save: async (
    userId: UserId,
    information: ContactInformation,
  ): Promise<void> => {
    try {
      await AsyncStorage.setItem(
        getContactInformationKey(userId),
        JSON.stringify(information),
      );
    } catch (error) {
      console.error('Failed to save contact information:', error);
      throw error;
    }
  },

  clear: async (userId: UserId): Promise<void> => {
    try {
      await AsyncStorage.removeItem(
        getContactInformationKey(userId),
      );
    } catch (error) {
      console.error('Failed to clear contact information:', error);
      throw error;
    }
  },
};

// =====================================================
// SHIPPING ADDRESS STORAGE
// =====================================================

export const shippingAddressStorage = {
  get: async (
    userId: UserId,
  ): Promise<SavedShippingAddress | null> => {
    try {
      const value = await AsyncStorage.getItem(
        getShippingAddressKey(userId),
      );

      return value
        ? (JSON.parse(value) as SavedShippingAddress)
        : null;
    } catch (error) {
      console.error('Failed to get shipping address:', error);
      return null;
    }
  },

  save: async (
    userId: UserId,
    address: SavedShippingAddress,
  ): Promise<void> => {
    try {
      await AsyncStorage.setItem(
        getShippingAddressKey(userId),
        JSON.stringify(address),
      );
    } catch (error) {
      console.error('Failed to save shipping address:', error);
      throw error;
    }
  },

  clear: async (userId: UserId): Promise<void> => {
    try {
      await AsyncStorage.removeItem(
        getShippingAddressKey(userId),
      );
    } catch (error) {
      console.error('Failed to clear shipping address:', error);
      throw error;
    }
  },
};

// =====================================================
// ACCOUNT-SPECIFIC FAVORITES STORAGE
// =====================================================

export const favoritesStorage = {
  getIds: async (): Promise<number[]> =>
    getAccountData<number[]>(
      getFavoritesKey,
      STORAGE_KEYS.FAVORITES,
      [],
    ),

  setIds: async (ids: number[]): Promise<void> =>
    setAccountData(
      getFavoritesKey,
      STORAGE_KEYS.FAVORITES,
      ids,
    ),

  addId: async (id: number): Promise<void> => {
    const ids = await favoritesStorage.getIds();

    if (!ids.includes(id)) {
      await favoritesStorage.setIds([...ids, id]);
    }
  },

  removeId: async (id: number): Promise<void> => {
    const ids = await favoritesStorage.getIds();

    await favoritesStorage.setIds(
      ids.filter((itemId) => itemId !== id),
    );
  },

  toggleId: async (id: number): Promise<boolean> => {
    const ids = await favoritesStorage.getIds();

    if (ids.includes(id)) {
      await favoritesStorage.removeId(id);
      return false;
    }

    await favoritesStorage.addId(id);
    return true;
  },
};

// =====================================================
// ACCOUNT-SPECIFIC SHOPPING CART STORAGE
// =====================================================

export const cartStorage = {
  getCart: async (): Promise<CartItem[]> =>
    getAccountData<CartItem[]>(
      getCartKey,
      STORAGE_KEYS.CART,
      [],
    ),

  setCart: async (items: CartItem[]): Promise<void> =>
    setAccountData(
      getCartKey,
      STORAGE_KEYS.CART,
      items,
    ),

  addItem: async (item: CartItem): Promise<void> => {
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
  ): Promise<void> => {
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

  removeItem: async (productId: number): Promise<void> => {
    const items = await cartStorage.getCart();

    await cartStorage.setCart(
      items.filter((item) => item.productId !== productId),
    );
  },

  clear: async (): Promise<void> => {
    const storageKey = await getAccountStorageKey(
      getCartKey,
      STORAGE_KEYS.CART,
    );

    try {
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to clear shopping cart:', error);
    }
  },
};

// =====================================================
// ORDER HISTORY AND TRACKING STORAGE
// =====================================================

export const ordersStorage = {
  getOrders: async (): Promise<Order[]> =>
    (await getStorageItem<Order[]>(STORAGE_KEYS.ORDERS)) ?? [],

  getUserOrders: async (userId: UserId): Promise<Order[]> => {
    const orders = await ordersStorage.getOrders();

    return orders
      .filter((order) => order.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      );
  },

  saveOrder: async (order: Order): Promise<void> => {
    const orders = await ordersStorage.getOrders();

    await setStorageItem(
      STORAGE_KEYS.ORDERS,
      [order, ...orders],
    );
  },

  completeOrder: async (order: Order): Promise<void> => {
    const orders = await ordersStorage.getOrders();
    const updatedOrders = [order, ...orders];

    const cartKey = await getAccountStorageKey(
      getCartKey,
      STORAGE_KEYS.CART,
    );

    try {
      await AsyncStorage.multiSet([
        [
          STORAGE_KEYS.ORDERS,
          JSON.stringify(updatedOrders),
        ],
        [
          cartKey,
          JSON.stringify([]),
        ],
      ]);
    } catch (error) {
      console.error('Failed to complete order:', error);
      throw error;
    }
  },

  getOrderById: async (
    orderId: string,
  ): Promise<Order | null> => {
    const orders = await ordersStorage.getOrders();

    const order = orders.find((item) => item.id === orderId);

    return order ? ensureTrackingData(order) : null;
  },

  advanceTracking: async (
    orderId: string,
    userId: UserId,
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

    await setStorageItem(STORAGE_KEYS.ORDERS, updatedOrders);

    return updatedOrder;
  },

  cancelOrder: async (
    orderId: string,
    userId: UserId,
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

    await setStorageItem(STORAGE_KEYS.ORDERS, updatedOrders);

    return updatedOrder;
  },
};
