/**
 * Notifications service with expo-notifications mocked
 */
import * as Notifications from 'expo-notifications';
import {
  ensurePermission,
  notificationsSupported,
  notifyOrderPlaced,
  setDailyPromo,
  subscribeToNotificationTaps,
} from '@/services/notifications';
import type { Order } from '@/types/account';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('id')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  addNotificationResponseReceivedListener: jest.fn(),
}));

const mocked = Notifications as jest.Mocked<typeof Notifications>;
const permission = (granted: boolean, canAskAgain = true) =>
  ({ granted, canAskAgain, status: granted ? 'granted' : 'denied', expires: 'never' }) as unknown as Notifications.NotificationPermissionsStatus;

const order = { id: 'local-1', cartId: 51, totalQuantity: 2, grandTotal: 81 } as Order;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('notifications', () => {
  it('is supported on native platforms', () => {
    expect(notificationsSupported()).toBe(true);
  });

  it('asks for permission only when needed', async () => {
    mocked.getPermissionsAsync.mockResolvedValue(permission(true));
    expect(await ensurePermission()).toBe(true);
    expect(mocked.requestPermissionsAsync).not.toHaveBeenCalled();

    mocked.getPermissionsAsync.mockResolvedValue(permission(false));
    mocked.requestPermissionsAsync.mockResolvedValue(permission(false));
    expect(await ensurePermission()).toBe(false);

    mocked.getPermissionsAsync.mockResolvedValue(permission(false, false));
    expect(await ensurePermission()).toBe(false);
  });

  it('schedules an immediate "order placed" notification', async () => {
    mocked.getPermissionsAsync.mockResolvedValue(permission(true));
    await notifyOrderPlaced(order, true);
    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: null,
        content: expect.objectContaining({ body: expect.stringContaining('#51'), data: { url: '/orders/local-1' } }),
      })
    );
  });

  it('schedules and cancels the daily promo reminder', async () => {
    mocked.getPermissionsAsync.mockResolvedValue(permission(true));
    expect(await setDailyPromo(true, false)).toBe(true);
    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ trigger: { hour: 9, minute: 0, repeats: true } })
    );

    expect(await setDailyPromo(false, false)).toBe(true);
    expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalled();
  });

  it('opens in-app links from tapped notifications only', () => {
    let handler: ((response: Notifications.NotificationResponse) => void) | undefined;
    const remove = jest.fn();
    mocked.addNotificationResponseReceivedListener.mockImplementation((listener) => {
      handler = listener;
      return { remove } as unknown as ReturnType<typeof Notifications.addNotificationResponseReceivedListener>;
    });
    const onOpen = jest.fn();
    const unsubscribe = subscribeToNotificationTaps(onOpen);

    const tap = (url: unknown) =>
      handler?.({ notification: { request: { content: { data: { url } } } } } as unknown as Notifications.NotificationResponse);
    tap('/orders/1');
    tap('https://evil.example');
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith('/orders/1');

    unsubscribe();
    expect(remove).toHaveBeenCalled();
  });
});
