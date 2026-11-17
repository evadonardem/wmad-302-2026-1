/**
 * Shop Updates & Order Notification Storage Helpers - Marketplace
 *
 * Student Implementation Guide:
 * Complete the per-user notification engine:
 * 1. Persist notifications per authenticated customer ID in AsyncStorage
 * 2. Sync real order lifecycle events (Order Placed, Payment Confirmed, Order Processing,
 *    Order Shipped, Out for Delivery, Package Delivered, Delivery Failed, Order Cancelled, Return/Refund Update)
 * 3. Prevent duplicate notifications for the same (orderId + eventType)
 * 4. Support mark as read, mark all as read, delete single notification, and clear read notifications
 *    without altering or deleting actual order records
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ShopNotificationEventType =
  | 'order_placed'
  | 'payment_confirmed'
  | 'order_processing'
  | 'order_shipped'
  | 'out_for_delivery'
  | 'package_delivered'
  | 'delivery_failed'
  | 'order_cancelled'
  | 'return_refund_update';

export interface ShopOrderNotification {
  id: string;
  eventKey: string;
  userId: string;
  orderId: string;
  type: ShopNotificationEventType;
  title: string;
  message: string;
  trackingNumber?: string;
  courier?: string;
  imageUrl?: string;
  createdAt: number;
  dateLabel: string;
  read: boolean;
}

const getNotificationsStorageKey = (userId?: string | number) =>
  `@marketplace_user_${userId || 'guest'}_shop_notifications`;

const getOrdersStorageKey = (userId?: string | number) =>
  `@marketplace_user_${userId || 'guest'}_orders`;

export function formatShortNotificationDate(timestampMs: number): string {
  try {
    const d = new Date(timestampMs);
    if (Number.isNaN(d.getTime())) return 'Today';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Today';
  }
}

export async function getUserShopNotifications(
  userId?: string | number
): Promise<ShopOrderNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(getNotificationsStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const uid = String(userId || 'guest');
    return parsed
      .filter((n: ShopOrderNotification) => !n.userId || String(n.userId) === uid)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch {
    return [];
  }
}

async function saveUserShopNotifications(
  userId: string | number | undefined,
  items: ShopOrderNotification[]
): Promise<ShopOrderNotification[]> {
  const sorted = [...items].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  try {
    await AsyncStorage.setItem(getNotificationsStorageKey(userId), JSON.stringify(sorted));
  } catch {
    // Ignore storage write error
  }
  return sorted;
}

/**
 * Record a single real order lifecycle notification event (idempotent per orderId + type).
 */
export async function recordOrderNotificationEvent(params: {
  userId?: string | number;
  orderId: string;
  type: ShopNotificationEventType;
  title: string;
  message: string;
  trackingNumber?: string;
  courier?: string;
  imageUrl?: string;
  createdAt?: number;
}): Promise<ShopOrderNotification[]> {
  const uid = String(params.userId || 'guest');
  const eventKey = `${params.orderId}::${params.type}`;
  const existing = await getUserShopNotifications(uid);

  // Prevent duplicate notification for the same order event
  if (existing.some((n) => n.eventKey === eventKey)) {
    return existing;
  }

  const ts = params.createdAt || Date.now();
  const entry: ShopOrderNotification = {
    id: `notif-${params.orderId}-${params.type}-${ts}`,
    eventKey,
    userId: uid,
    orderId: String(params.orderId),
    type: params.type,
    title: params.title,
    message: params.message,
    trackingNumber: params.trackingNumber,
    courier: params.courier,
    imageUrl: params.imageUrl,
    createdAt: ts,
    dateLabel: formatShortNotificationDate(ts),
    read: false,
  };

  return saveUserShopNotifications(uid, [entry, ...existing]);
}

function mapOrderStatusToEvent(order: any): {
  type: ShopNotificationEventType;
  title: string;
  message: string;
} | null {
  const rawStatus = String(order?.status || '').toLowerCase().trim();
  const tracking = order?.trackingNumber ? String(order.trackingNumber) : '';
  const courier = order?.courier ? String(order.courier) : 'J&T Express';
  const totalAmount = Number(order?.totalAmount ?? order?.total ?? 0);
  const paymentMethod = String(order?.paymentMethod || '').toUpperCase();

  if (!rawStatus) return null;

  if (rawStatus.includes('deliver') && !rawStatus.includes('out') && !rawStatus.includes('fail')) {
    return {
      type: 'package_delivered',
      title: 'Package Delivered',
      message: tracking
        ? `Your package with tracking number ${tracking} has been successfully delivered.`
        : `Your package for Order #${order.id} has been successfully delivered.`,
    };
  }

  if (rawStatus.includes('out for delivery') || rawStatus === 'out_for_delivery') {
    const isCod = paymentMethod.includes('COD') || paymentMethod.includes('CASH');
    return {
      type: 'out_for_delivery',
      title: isCod ? 'Your COD Package Is Out for Delivery' : 'Your Package Is Out for Delivery',
      message: isCod
        ? `Your package is on its way! Please prepare ₱${totalAmount.toFixed(0)} to pay upon delivery.`
        : `Your package is on its way with ${courier}!`,
    };
  }

  if (rawStatus.includes('ship') || rawStatus.includes('transit')) {
    return {
      type: 'order_shipped',
      title: 'Order Shipped',
      message: tracking
        ? `Your package with tracking number ${tracking} has been shipped and will be delivered by ${courier}.`
        : `Your order #${order.id} has been shipped and will be delivered by ${courier}.`,
    };
  }

  if (rawStatus.includes('fail')) {
    return {
      type: 'delivery_failed',
      title: 'Delivery Failed',
      message: tracking
        ? `Delivery attempt for tracking number ${tracking} was unsuccessful. The courier will re-attempt delivery.`
        : `Delivery attempt for Order #${order.id} was unsuccessful.`,
    };
  }

  if (rawStatus.includes('cancel')) {
    return {
      type: 'order_cancelled',
      title: 'Order Cancelled',
      message: `Your order #${order.id} has been cancelled.`,
    };
  }

  if (rawStatus.includes('return') || rawStatus.includes('refund')) {
    return {
      type: 'return_refund_update',
      title: 'Return or Refund Update',
      message: `Your return or refund request for Order #${order.id} has been updated (${order.status}).`,
    };
  }

  if (rawStatus.includes('process') || rawStatus.includes('pack') || rawStatus.includes('prepar')) {
    return {
      type: 'order_processing',
      title: 'Order Processing',
      message: `The seller is preparing your order #${order.id} for shipment.`,
    };
  }

  if (rawStatus.includes('paid') || rawStatus.includes('confirm')) {
    return {
      type: 'payment_confirmed',
      title: 'Payment Confirmed',
      message: `Payment of ₱${totalAmount.toFixed(2)} for Order #${order.id} has been verified.`,
    };
  }

  return null;
}

/**
 * Synchronize notifications from real persisted customer orders without creating duplicates
 * or fabricating fake delivery milestones.
 */
export async function syncNotificationsFromOrders(
  userId?: string | number
): Promise<ShopOrderNotification[]> {
  const uid = String(userId || 'guest');
  const existing = await getUserShopNotifications(uid);
  const existingKeys = new Set(existing.map((n) => n.eventKey));

  // Track which eventKeys were intentionally deleted by the user so they aren't re-created
  const dismissedKey = `@marketplace_user_${uid}_dismissed_notif_keys`;
  let dismissedSet = new Set<string>();
  try {
    const rawDismissed = await AsyncStorage.getItem(dismissedKey);
    if (rawDismissed) {
      const parsed = JSON.parse(rawDismissed);
      if (Array.isArray(parsed)) dismissedSet = new Set(parsed);
    }
  } catch {
    // Ignore read error
  }

  try {
    const rawOrders = await AsyncStorage.getItem(getOrdersStorageKey(uid));
    if (!rawOrders) return existing;
    const parsedOrders = JSON.parse(rawOrders);
    if (!Array.isArray(parsedOrders)) return existing;

    const userOrders = parsedOrders.filter(
      (o: any) => !userId || !o?.userId || String(o.userId) === uid
    );

    const additions: ShopOrderNotification[] = [];

    for (const order of userOrders) {
      if (!order?.id) continue;
      const orderId = String(order.id);
      const firstItem = Array.isArray(order.items) ? order.items[0] : null;
      const imageUrl =
        order.thumbnail ||
        order.image ||
        firstItem?.thumbnail ||
        firstItem?.image ||
        undefined;
      const trackingNumber = order.trackingNumber ? String(order.trackingNumber) : undefined;
      const courier = order.courier ? String(order.courier) : undefined;
      const baseTs = Number(order.createdAt || order.timestamp || Date.now());

      // 1. Always ensure Order Placed notification exists for real submitted orders
      const placedKey = `${orderId}::order_placed`;
      if (!existingKeys.has(placedKey) && !dismissedSet.has(placedKey)) {
        existingKeys.add(placedKey);
        additions.push({
          id: `notif-${orderId}-order_placed-${baseTs}`,
          eventKey: placedKey,
          userId: uid,
          orderId,
          type: 'order_placed',
          title: 'Order Placed',
          message: trackingNumber
            ? `Your order with tracking number ${trackingNumber} has been successfully submitted. Thank you for shopping with Marketplace!`
            : `Your order #${orderId} has been successfully submitted. Thank you for shopping with Marketplace!`,
          trackingNumber,
          courier,
          imageUrl,
          createdAt: baseTs,
          dateLabel: formatShortNotificationDate(baseTs),
          read: false,
        });
      }

      // 2. If the order's actual recorded status reflects a verified milestone, generate its notification
      const statusEvent = mapOrderStatusToEvent(order);
      if (statusEvent && statusEvent.type !== 'order_placed') {
        const statusKey = `${orderId}::${statusEvent.type}`;
        if (!existingKeys.has(statusKey) && !dismissedSet.has(statusKey)) {
          existingKeys.add(statusKey);
          const statusTs = Number(order.updatedAt || baseTs + 1000);
          additions.push({
            id: `notif-${orderId}-${statusEvent.type}-${statusTs}`,
            eventKey: statusKey,
            userId: uid,
            orderId,
            type: statusEvent.type,
            title: statusEvent.title,
            message: statusEvent.message,
            trackingNumber,
            courier,
            imageUrl,
            createdAt: statusTs,
            dateLabel: formatShortNotificationDate(statusTs),
            read: false,
          });
        }
      }
    }

    if (additions.length === 0) return existing;
    return saveUserShopNotifications(uid, [...additions, ...existing]);
  } catch {
    return existing;
  }
}

export async function markNotificationAsRead(
  userId: string | number | undefined,
  notificationId: string
): Promise<ShopOrderNotification[]> {
  const existing = await getUserShopNotifications(userId);
  const updated = existing.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
  return saveUserShopNotifications(userId, updated);
}

export async function markAllNotificationsAsRead(
  userId?: string | number
): Promise<ShopOrderNotification[]> {
  const existing = await getUserShopNotifications(userId);
  const updated = existing.map((n) => ({ ...n, read: true }));
  return saveUserShopNotifications(userId, updated);
}

export async function deleteSingleNotification(
  userId: string | number | undefined,
  notificationId: string
): Promise<ShopOrderNotification[]> {
  const uid = String(userId || 'guest');
  const existing = await getUserShopNotifications(uid);
  const target = existing.find((n) => n.id === notificationId);

  if (target?.eventKey) {
    try {
      const dismissedKey = `@marketplace_user_${uid}_dismissed_notif_keys`;
      const raw = await AsyncStorage.getItem(dismissedKey);
      const list = raw ? JSON.parse(raw) : [];
      const nextDismissed = Array.from(new Set([...(Array.isArray(list) ? list : []), target.eventKey]));
      await AsyncStorage.setItem(dismissedKey, JSON.stringify(nextDismissed));
    } catch {
      // Ignore write error
    }
  }

  const remaining = existing.filter((n) => n.id !== notificationId);
  return saveUserShopNotifications(uid, remaining);
}

export async function clearReadNotifications(
  userId?: string | number
): Promise<ShopOrderNotification[]> {
  const uid = String(userId || 'guest');
  const existing = await getUserShopNotifications(uid);
  const readItems = existing.filter((n) => n.read);

  if (readItems.length > 0) {
    try {
      const dismissedKey = `@marketplace_user_${uid}_dismissed_notif_keys`;
      const raw = await AsyncStorage.getItem(dismissedKey);
      const list = raw ? JSON.parse(raw) : [];
      const nextDismissed = Array.from(
        new Set([
          ...(Array.isArray(list) ? list : []),
          ...readItems.map((r) => r.eventKey),
        ])
      );
      await AsyncStorage.setItem(dismissedKey, JSON.stringify(nextDismissed));
    } catch {
      // Ignore write error
    }
  }

  const remaining = existing.filter((n) => !n.read);
  return saveUserShopNotifications(uid, remaining);
}

export async function getUnreadNotificationCount(userId?: string | number): Promise<number> {
  const items = await getUserShopNotifications(userId);
  return items.filter((n) => !n.read).length;
}