/**
 * Local notifications (expo-notifications).
 * Works in Expo Go and builds on iOS/Android; on web every call is a no-op.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { formatPrice } from '@/utils/format';
import type { Order } from '@/types/account';

const PROMO_ID = 'daily-deal-reminder';
const isSupported = Platform.OS !== 'web';

if (isSupported) {
  // Show notifications even while the app is in the foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export function notificationsSupported(): boolean {
  return isSupported;
}

/** Calls `onOpen` with the in-app path stored on a notification when the user taps it. */
export function subscribeToNotificationTaps(onOpen: (url: string) => void): () => void {
  if (!isSupported) return () => undefined;
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const url = response.notification.request.content.data?.url;
    if (typeof url === 'string' && url.startsWith('/')) onOpen(url);
  });
  return () => subscription.remove();
}

/** Asks for permission if needed. Returns true when notifications may be shown. */
export async function ensurePermission(): Promise<boolean> {
  if (!isSupported) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

export async function notifyOrderPlaced(order: Order, holiday: boolean): Promise<void> {
  if (!(await ensurePermission())) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: holiday ? '🎄 Order placed — ho ho ho!' : '✅ Order placed',
      body: `Order #${order.cartId} · ${order.totalQuantity} items · ${formatPrice(order.grandTotal)}`,
      data: { url: `/orders/${order.id}` },
    },
    trigger: null, // deliver immediately
  });
}

/** Schedules (or cancels) a daily 9:00 AM deal reminder. Returns false if permission was denied. */
export async function setDailyPromo(enabled: boolean, holiday: boolean): Promise<boolean> {
  if (!isSupported) return false;
  await Notifications.cancelScheduledNotificationAsync(PROMO_ID).catch(() => undefined);
  if (!enabled) return true;
  if (!(await ensurePermission())) return false;
  await Notifications.scheduleNotificationAsync({
    identifier: PROMO_ID,
    content: {
      title: holiday ? '🎁 Holiday deals are live' : '⚡ Today\'s flash deals',
      body: holiday ? 'Use XMAS25 for 25% off orders over $100.' : 'Check out the biggest discounts of the day.',
      data: { url: '/home' },
    },
    trigger: { hour: 9, minute: 0, repeats: true },
  });
  return true;
}
