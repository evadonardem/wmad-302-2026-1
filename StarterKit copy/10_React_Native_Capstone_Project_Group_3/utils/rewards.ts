/**
 * Rewards rules (pure functions): daily check-in streaks, the daily surprise,
 * redeeming points for coupons, the December advent calendar and badges.
 * RewardsContext stores the state; these functions compute the next state.
 */
import type { ThemeSeason } from '@/types/account';

export interface RewardsState {
  points: number;
  streak: number;
  bestStreak: number;
  /** Local dates as YYYY-MM-DD. */
  lastCheckIn: string | null;
  lastSurprise: string | null;
  /** Reward-only coupon codes the user may now use. */
  unlockedCoupons: string[];
  themesTried: ThemeSeason[];
  /** Advent doors opened this year (1–24). */
  adventOpened: number[];
  adventYear: number;
}

export const INITIAL_REWARDS: RewardsState = {
  points: 0,
  streak: 0,
  bestStreak: 0,
  lastCheckIn: null,
  lastSurprise: null,
  unlockedCoupons: [],
  themesTried: [],
  adventOpened: [],
  adventYear: 0,
};

export type Prize = { kind: 'points'; amount: number } | { kind: 'coupon'; code: string };

/** Local calendar day, e.g. "2026-11-21". */
export function dayKey(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function previousDayKey(date: Date): string {
  const yesterday = new Date(date);
  yesterday.setDate(date.getDate() - 1);
  return dayKey(yesterday);
}

function grant(state: RewardsState, prize: Prize): RewardsState {
  if (prize.kind === 'points') return { ...state, points: state.points + prize.amount };
  if (state.unlockedCoupons.includes(prize.code)) return { ...state, points: state.points + 25 };
  return { ...state, unlockedCoupons: [...state.unlockedCoupons, prize.code] };
}

// ------------------------------------------------------------ Daily check-in

/** Points for a check-in: 10, plus 2 per streak day (capped at a 7-day bonus). */
export function checkInPoints(streak: number): number {
  return 10 + Math.min(streak, 7) * 2;
}

/** Returns null when the user already checked in today. */
export function checkIn(state: RewardsState, now: Date = new Date()): { state: RewardsState; earned: number } | null {
  const today = dayKey(now);
  if (state.lastCheckIn === today) return null;
  const streak = state.lastCheckIn === previousDayKey(now) ? state.streak + 1 : 1;
  const earned = checkInPoints(streak);
  return {
    earned,
    state: {
      ...state,
      streak,
      bestStreak: Math.max(state.bestStreak, streak),
      lastCheckIn: today,
      points: state.points + earned,
    },
  };
}

/** The streak shown to the user: it is lost once a whole day is missed. */
export function currentStreak(state: RewardsState, now: Date = new Date()): number {
  if (!state.lastCheckIn) return 0;
  return state.lastCheckIn === dayKey(now) || state.lastCheckIn === previousDayKey(now) ? state.streak : 0;
}

// ------------------------------------------------------------ Daily surprise

export const SURPRISE_PRIZES: Prize[] = [
  { kind: 'points', amount: 20 },
  { kind: 'points', amount: 30 },
  { kind: 'points', amount: 50 },
  { kind: 'coupon', code: 'LUCKY12' },
];

/** Opens today's surprise box. Returns null when it was already opened today. */
export function openSurprise(
  state: RewardsState,
  now: Date = new Date(),
  random: () => number = Math.random
): { state: RewardsState; prize: Prize } | null {
  const today = dayKey(now);
  if (state.lastSurprise === today) return null;
  const prize = SURPRISE_PRIZES[Math.floor(random() * SURPRISE_PRIZES.length) % SURPRISE_PRIZES.length];
  return { prize, state: { ...grant(state, prize), lastSurprise: today } };
}

// ------------------------------------------------------------ Redeem points

export const REDEEMABLE_COUPONS = [
  { code: 'POINTS5', cost: 200 },
  { code: 'POINTS15', cost: 500 },
] as const;

export function redeemCoupon(state: RewardsState, code: string): RewardsState | 'insufficient' | 'owned' | 'unknown' {
  const item = REDEEMABLE_COUPONS.find((coupon) => coupon.code === code);
  if (!item) return 'unknown';
  if (state.unlockedCoupons.includes(code)) return 'owned';
  if (state.points < item.cost) return 'insufficient';
  return { ...state, points: state.points - item.cost, unlockedCoupons: [...state.unlockedCoupons, code] };
}

// ------------------------------------------------------------ Advent calendar

export type AdventReward = Prize | { kind: 'deal'; label: string; params: Record<string, string> };

/** What is behind each door, Dec 1 – 24. */
export const ADVENT_REWARDS: AdventReward[] = [
  { kind: 'points', amount: 50 },
  { kind: 'deal', label: 'Gifts under $25', params: { maxPrice: '25', sort: 'rating' } },
  { kind: 'points', amount: 30 },
  { kind: 'deal', label: 'Fragrances', params: { category: 'fragrances' } },
  { kind: 'coupon', code: 'ADVENT20' },
  { kind: 'points', amount: 40 },
  { kind: 'deal', label: 'Home decor', params: { category: 'home-decoration' } },
  { kind: 'points', amount: 50 },
  { kind: 'deal', label: 'Jewellery', params: { category: 'womens-jewellery' } },
  { kind: 'coupon', code: 'LUCKY12' },
  { kind: 'points', amount: 60 },
  { kind: 'deal', label: 'Biggest discounts', params: { sort: 'discount' } },
  { kind: 'points', amount: 40 },
  { kind: 'deal', label: 'Smartphones', params: { category: 'smartphones' } },
  { kind: 'coupon', code: 'POINTS5' },
  { kind: 'points', amount: 70 },
  { kind: 'deal', label: 'Skin care', params: { category: 'skin-care' } },
  { kind: 'points', amount: 50 },
  { kind: 'deal', label: 'Watches', params: { category: 'mens-watches' } },
  { kind: 'coupon', code: 'POINTS15' },
  { kind: 'points', amount: 80 },
  { kind: 'deal', label: 'Kitchen picks', params: { category: 'kitchen-accessories' } },
  { kind: 'points', amount: 100 },
  { kind: 'points', amount: 200 },
];

/** Door N opens on December N. Door 1 can be opened early as a sneak peek. */
export function canOpenAdventDoor(day: number, now: Date = new Date(), sneakPeek = false): boolean {
  if (day < 1 || day > 24) return false;
  if (now.getMonth() === 11) return now.getDate() >= day;
  return sneakPeek && day === 1;
}

/** Days until the calendar starts (0 in December). */
export function daysUntilAdvent(now: Date = new Date()): number {
  if (now.getMonth() === 11) return 0;
  const start = new Date(now.getFullYear(), 11, 1);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((start.getTime() - today.getTime()) / 86_400_000);
}

export function openAdventDoor(
  state: RewardsState,
  day: number,
  now: Date = new Date(),
  sneakPeek = false
): { state: RewardsState; reward: AdventReward } | null {
  const year = now.getFullYear();
  const opened = state.adventYear === year ? state.adventOpened : [];
  if (opened.includes(day) || !canOpenAdventDoor(day, now, sneakPeek)) return null;
  const reward = ADVENT_REWARDS[day - 1];
  const granted = reward.kind === 'deal' ? state : grant(state, reward);
  return { reward, state: { ...granted, adventYear: year, adventOpened: [...opened, day] } };
}

export function openedAdventDoors(state: RewardsState, now: Date = new Date()): number[] {
  return state.adventYear === now.getFullYear() ? state.adventOpened : [];
}

// ------------------------------------------------------------ Badges

export interface BadgeStats {
  orders: number;
  spent: number;
  bestStreak: number;
  themesTried: number;
  reviews: number;
  wishlist: number;
  adventOpened: number;
  giftLists: number;
}

export const BADGES = [
  { id: 'firstOrder', emoji: '🛍️', earned: (s: BadgeStats) => s.orders >= 1 },
  { id: 'bigSpender', emoji: '💎', earned: (s: BadgeStats) => s.spent >= 500 },
  { id: 'onFire', emoji: '🔥', earned: (s: BadgeStats) => s.bestStreak >= 5 },
  { id: 'explorer', emoji: '🧭', earned: (s: BadgeStats) => s.themesTried >= 8 },
  { id: 'reviewer', emoji: '✍️', earned: (s: BadgeStats) => s.reviews >= 1 },
  { id: 'collector', emoji: '💖', earned: (s: BadgeStats) => s.wishlist >= 5 },
  { id: 'advent', emoji: '🎄', earned: (s: BadgeStats) => s.adventOpened >= 5 },
  { id: 'gifter', emoji: '🎁', earned: (s: BadgeStats) => s.giftLists >= 1 },
] as const;

export type BadgeId = (typeof BADGES)[number]['id'];

export function getEarnedBadges(stats: BadgeStats): BadgeId[] {
  return BADGES.filter((badge) => badge.earned(stats)).map((badge) => badge.id);
}
