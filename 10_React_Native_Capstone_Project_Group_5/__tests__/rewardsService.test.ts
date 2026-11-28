import {
  dailyIndex,
  emptyRewards,
  formatCountdown,
  makeCoupon,
  maxRedeemablePoints,
  msUntilNextSpin,
  pointsToDollars,
  POINTS_PER_DOLLAR,
  SPIN_COOLDOWN_MS,
  todayKey,
} from '@/services/rewardsService';

describe('rewardsService', () => {
  it('emptyRewards returns clean initial state', () => {
    expect(emptyRewards()).toEqual({
      points: 0,
      coupons: [],
      lastSpinAt: null,
      quiz: null,
      deal: null,
    });
  });

  it('todayKey formats local date as YYYY-MM-DD', () => {
    expect(todayKey(new Date(2026, 10, 26))).toBe('2026-11-26');
    expect(todayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('formatCountdown formats milliseconds as HH:MM:SS', () => {
    expect(formatCountdown(0)).toBe('00:00:00');
    expect(formatCountdown(3661 * 1000)).toBe('01:01:01');
  });

  it('msUntilNextSpin returns 0 when no prior spin or cooldown passed', () => {
    expect(msUntilNextSpin(null, 1000)).toBe(0);
    const last = new Date(1000).toISOString();
    expect(msUntilNextSpin(last, 1000 + SPIN_COOLDOWN_MS + 1)).toBe(0);
  });

  it('msUntilNextSpin returns remaining cooldown', () => {
    const now = 1_000_000;
    const last = new Date(now - 1000).toISOString();
    expect(msUntilNextSpin(last, now)).toBe(SPIN_COOLDOWN_MS - 1000);
  });

  it('dailyIndex is stable for same day and within bounds', () => {
    const a = dailyIndex('2026-11-26', 8);
    const b = dailyIndex('2026-11-26', 8);
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(8);
  });

  it('makeCoupon creates a coupon with expected shape', () => {
    const coupon = makeCoupon('10% OFF', 'discount', 10, 'spin', 'SPIN10');
    expect(coupon.title).toBe('10% OFF');
    expect(coupon.kind).toBe('discount');
    expect(coupon.value).toBe(10);
    expect(coupon.source).toBe('spin');
    expect(coupon.code.startsWith('SPIN10-')).toBe(true);
    expect(coupon.id).toBeTruthy();
    expect(new Date(coupon.earnedAt).toString()).not.toBe('Invalid Date');
  });

  it('converts points to dollars at 100 points = $1', () => {
    expect(POINTS_PER_DOLLAR).toBe(100);
    expect(pointsToDollars(100)).toBe(1);
    expect(pointsToDollars(250)).toBe(2.5);
    expect(pointsToDollars(0)).toBe(0);
  });

  it('caps redeemable points at the amount due', () => {
    expect(maxRedeemablePoints(250, 10)).toBe(250);
    expect(maxRedeemablePoints(2500, 10)).toBe(1000);
    expect(maxRedeemablePoints(0, 10)).toBe(0);
    expect(maxRedeemablePoints(500, 0)).toBe(0);
  });
});
