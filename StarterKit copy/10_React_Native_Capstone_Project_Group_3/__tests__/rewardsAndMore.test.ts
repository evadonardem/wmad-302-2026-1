/**
 * Unit tests for rewards rules, share links, delivery days, receipts,
 * currency formatting, reward-only coupons and the offline API cache.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ADVENT_REWARDS,
  canOpenAdventDoor,
  checkIn,
  checkInPoints,
  currentStreak,
  daysUntilAdvent,
  getEarnedBadges,
  INITIAL_REWARDS,
  openAdventDoor,
  openedAdventDoors,
  openSurprise,
  redeemCoupon,
} from '@/utils/rewards';
import { decodeShareItems, encodeShareItems } from '@/utils/share';
import { DELIVERY_SLOTS, formatDeliveryDay, getDeliveryDates } from '@/utils/delivery';
import { buildReceiptHtml } from '@/utils/receipt';
import { formatPrice, PHP_PER_USD, setDisplayCurrency } from '@/utils/format';
import { getCouponError } from '@/utils/cart';
import { cacheKey, MAX_CACHE_ENTRIES, readCache, withOfflineCache } from '@/utils/apiCache';
import type { Order } from '@/types/account';

const day = (month: number, date: number, hour = 10) => new Date(2026, month, date, hour);

describe('daily check-in', () => {
  it('builds a streak on consecutive days and resets after a gap', () => {
    const first = checkIn(INITIAL_REWARDS, day(10, 20))!;
    expect(first.state.streak).toBe(1);
    expect(first.earned).toBe(checkInPoints(1));
    expect(checkIn(first.state, day(10, 20, 22))).toBeNull(); // same day

    const second = checkIn(first.state, day(10, 21))!;
    expect(second.state.streak).toBe(2);
    expect(second.state.points).toBe(checkInPoints(1) + checkInPoints(2));

    const afterGap = checkIn(second.state, day(10, 25))!;
    expect(afterGap.state.streak).toBe(1);
    expect(afterGap.state.bestStreak).toBe(2);
  });

  it('caps the streak bonus and reports a broken streak as 0', () => {
    expect(checkInPoints(30)).toBe(checkInPoints(7));
    const state = checkIn(INITIAL_REWARDS, day(10, 1))!.state;
    expect(currentStreak(state, day(10, 2))).toBe(1);
    expect(currentStreak(state, day(10, 4))).toBe(0);
    expect(currentStreak(INITIAL_REWARDS)).toBe(0);
  });
});

describe('daily surprise and redeeming', () => {
  it('opens once per day and grants the prize', () => {
    const points = openSurprise(INITIAL_REWARDS, day(10, 21), () => 0)!;
    expect(points.prize).toEqual({ kind: 'points', amount: 20 });
    expect(points.state.points).toBe(20);
    expect(openSurprise(points.state, day(10, 21))).toBeNull();

    const coupon = openSurprise(INITIAL_REWARDS, day(10, 22), () => 0.99)!;
    expect(coupon.prize).toEqual({ kind: 'coupon', code: 'LUCKY12' });
    expect(coupon.state.unlockedCoupons).toContain('LUCKY12');
    // Winning an owned coupon gives points instead
    const again = openSurprise(coupon.state, day(10, 23), () => 0.99)!;
    expect(again.state.points).toBe(25);
  });

  it('redeems points for coupons', () => {
    expect(redeemCoupon(INITIAL_REWARDS, 'POINTS5')).toBe('insufficient');
    expect(redeemCoupon(INITIAL_REWARDS, 'NOPE')).toBe('unknown');
    const rich = { ...INITIAL_REWARDS, points: 250 };
    const redeemed = redeemCoupon(rich, 'POINTS5');
    expect(redeemed).toMatchObject({ points: 50, unlockedCoupons: ['POINTS5'] });
    expect(redeemCoupon(redeemed as typeof rich, 'POINTS5')).toBe('owned');
  });

  it('only accepts reward coupons once they are unlocked', () => {
    expect(getCouponError('LUCKY12', 100)).toMatch(/Unlock/);
    expect(getCouponError('LUCKY12', 100, ['LUCKY12'])).toBeNull();
    expect(getCouponError('ADVENT20', 10, ['ADVENT20'])).toMatch(/minimum/);
  });
});

describe('advent calendar', () => {
  it('opens doors on their December date, with door 1 as an early sneak peek', () => {
    expect(ADVENT_REWARDS).toHaveLength(24);
    expect(canOpenAdventDoor(1, day(10, 21))).toBe(false);
    expect(canOpenAdventDoor(1, day(10, 21), true)).toBe(true);
    expect(canOpenAdventDoor(2, day(10, 21), true)).toBe(false);
    expect(canOpenAdventDoor(5, day(11, 5))).toBe(true);
    expect(canOpenAdventDoor(6, day(11, 5))).toBe(false);
    expect(canOpenAdventDoor(25, day(11, 25))).toBe(false);
    expect(daysUntilAdvent(day(10, 21))).toBe(10);
    expect(daysUntilAdvent(day(11, 3))).toBe(0);
  });

  it('grants each door once per year', () => {
    const opened = openAdventDoor(INITIAL_REWARDS, 5, day(11, 5))!;
    expect(opened.reward).toEqual({ kind: 'coupon', code: 'ADVENT20' });
    expect(opened.state.unlockedCoupons).toContain('ADVENT20');
    expect(openAdventDoor(opened.state, 5, day(11, 6))).toBeNull();
    expect(openedAdventDoors(opened.state, day(11, 6))).toEqual([5]);
    // A new year starts with a fresh calendar
    expect(openedAdventDoors(opened.state, new Date(2027, 11, 1))).toEqual([]);

    const deal = openAdventDoor(INITIAL_REWARDS, 2, day(11, 2))!;
    expect(deal.reward.kind).toBe('deal');
    expect(deal.state.points).toBe(0);
  });
});

describe('badges', () => {
  it('earns badges from activity', () => {
    const none = { orders: 0, spent: 0, bestStreak: 0, themesTried: 1, reviews: 0, wishlist: 0, adventOpened: 0, giftLists: 0 };
    expect(getEarnedBadges(none)).toEqual([]);
    expect(
      getEarnedBadges({ ...none, orders: 2, spent: 600, bestStreak: 5, themesTried: 8, reviews: 1, wishlist: 5, adventOpened: 5, giftLists: 1 })
    ).toHaveLength(8);
  });
});

describe('share links', () => {
  it('round-trips items and ignores junk', () => {
    const items = [
      { id: 12, quantity: 2 },
      { id: 5, quantity: 1 },
    ];
    expect(encodeShareItems(items)).toBe('12x2,5x1');
    expect(decodeShareItems('12x2,5x1')).toEqual(items);
    // Missing quantity = 1, duplicates merge, junk / id 0 / 3-digit quantities are dropped
    expect(decodeShareItems('7,7x3,abc,0x1,9x999,8x60,8x60, 3x1 ')).toEqual([
      { id: 7, quantity: 4 },
      { id: 8, quantity: 99 },
      { id: 3, quantity: 1 },
    ]);
    expect(decodeShareItems(undefined)).toEqual([]);
  });
});

describe('delivery scheduling', () => {
  it('offers the next five days starting tomorrow', () => {
    const dates = getDeliveryDates(new Date(2026, 10, 30, 15));
    expect(dates).toHaveLength(5);
    expect(dates[0].getDate()).toBe(1);
    expect(dates[0].getMonth()).toBe(11);
    expect(formatDeliveryDay(dates[0])).toMatch(/Dec 1/);
    expect(formatDeliveryDay('nope')).toBe('—');
    expect(DELIVERY_SLOTS.length).toBeGreaterThan(2);
  });
});

describe('currency', () => {
  afterEach(() => setDisplayCurrency('USD'));

  it('formats USD amounts as pesos when chosen', () => {
    expect(formatPrice(12.5)).toBe('$12.50');
    setDisplayCurrency('PHP');
    expect(formatPrice(12.5)).toBe(`₱${(12.5 * PHP_PER_USD).toFixed(2)}`);
    expect(formatPrice(100)).toBe('₱5,800.00');
    expect(formatPrice(100, 'USD')).toBe('$100.00');
  });
});

describe('receipt', () => {
  it('lists items, totals and escapes user text', () => {
    const order: Order = {
      id: 'local-1',
      cartId: 51,
      userId: 1,
      source: 'local',
      createdAt: '2026-11-20T10:00:00.000Z',
      status: 'placed',
      lines: [{ id: 1, title: 'Mascara <b>', thumbnail: '', price: 10, quantity: 2, discountPercentage: 0, discountedTotal: 20 }],
      totalQuantity: 2,
      subtotal: 20,
      productDiscount: 0,
      couponCode: 'SAVE10',
      couponDiscount: 2,
      shippingFee: 4.99,
      grandTotal: 22.99,
      deliveryDate: '2026-11-21T00:00:00.000Z',
      deliverySlot: '9 AM – 12 PM',
      paymentLabel: 'GCash 0917•••1234',
    };
    const html = buildReceiptHtml(order, '#E91E63');
    expect(html).toContain('Order #51');
    expect(html).toContain('Mascara &lt;b&gt;');
    expect(html).toContain('$22.99');
    expect(html).toContain('Coupon (SAVE10)');
    expect(html).toContain('9 AM – 12 PM');
    expect(html).toContain('#E91E63');
  });
});

describe('offline cache', () => {
  beforeEach(() => AsyncStorage.clear());

  const offlineError = () => Object.assign(new Error('Network Error'), { isAxiosError: true });

  it('saves responses and serves them when the network fails', async () => {
    expect(await withOfflineCache('/products/1', async () => ({ id: 1 }))).toEqual({ id: 1 });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(await readCache('/products/1')).toEqual({ id: 1 });
    expect(await withOfflineCache('/products/1', () => Promise.reject(offlineError()))).toEqual({ id: 1 });
  });

  it('rethrows when nothing is cached or the error is not a network error', async () => {
    await expect(withOfflineCache('/missing', () => Promise.reject(offlineError()))).rejects.toThrow('Network Error');
    await withOfflineCache('/products/2', async () => ({ id: 2 }));
    const notFound = Object.assign(new Error('Not found'), { isAxiosError: true, response: { status: 404 } });
    await expect(withOfflineCache('/products/2', () => Promise.reject(notFound))).rejects.toThrow('Not found');
  });

  it('builds stable keys and keeps the cache bounded', async () => {
    expect(cacheKey('/products', { skip: 20, limit: 10, q: undefined })).toBe('/products?limit=10&skip=20');
    expect(cacheKey('/products')).toBe('/products');
    for (let i = 0; i < MAX_CACHE_ENTRIES + 5; i += 1) {
      await withOfflineCache(`/p/${i}`, async () => i);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    expect(await readCache('/p/0')).toBeNull();
    expect(await readCache(`/p/${MAX_CACHE_ENTRIES + 4}`)).toBe(MAX_CACHE_ENTRIES + 4);
  });
});
