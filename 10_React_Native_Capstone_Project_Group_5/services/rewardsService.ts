/**
 * Rewards service - local storage + small helpers for Play & Earn.
 *
 * A client-side cooldown is fine for a capstone demo, but it is not cheat-proof:
 * a real product would validate spins / challenges on a server.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coupon, CouponKind, CouponSource, DealDayState, QuizResult } from '@/types/rewards';

export const SPIN_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const DEAL_ATTEMPTS = 3;
export const QUIZ_REWARD_POINTS = 25;
export const DEAL_REWARD_POINTS = 100;

const storageKey = (userId: number): string => `play_earn_${userId}`;

export interface StoredRewards {
    points: number;
    coupons: Coupon[];
    lastSpinAt: string | null;
    quiz: QuizResult | null;
    deal: DealDayState | null;
}

export function emptyRewards(): StoredRewards {
    return { points: 0, coupons: [], lastSpinAt: null, quiz: null, deal: null };
}

/** Local calendar day as YYYY-MM-DD (not UTC, so "today" matches the shopper's clock) */
export function todayKey(date = new Date()): string {
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** Milliseconds until local midnight (when the next daily challenge appears) */
export function msUntilNextMidnight(now = Date.now()): number {
    const d = new Date(now);
    const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
    return Math.max(0, next.getTime() - now);
}

/** 24h cooldown helper: milliseconds left before the next free spin */
export function msUntilNextSpin(lastSpinAt: string | null, now = Date.now()): number {
    if (!lastSpinAt) return 0;
    const last = new Date(lastSpinAt).getTime();
    if (Number.isNaN(last)) return 0;
    return Math.max(0, last + SPIN_COOLDOWN_MS - now);
}

/** HH:MM:SS for countdowns */
export function formatCountdown(ms: number): string {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return [h, m, s].map((n) => `${n}`.padStart(2, '0')).join(':');
}

const SOURCE_LABEL: Record<CouponSource, string> = {
    spin: 'Earned from Spin & Win',
    quiz: 'Earned from the Shopping Quiz',
    deal: 'Earned from Deal Hunter',
};

/** Create a coupon with a readable, random code */
export function makeCoupon(
    title: string,
    kind: CouponKind,
    value: number,
    source: CouponSource,
    codePrefix: string
): Coupon {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        subtitle: SOURCE_LABEL[source],
        kind,
        value,
        code: `${codePrefix}-${suffix}`,
        source,
        earnedAt: new Date().toISOString(),
    };
}

/** Stable 0..length-1 index for a day key, so the daily challenge is the same all day */
export function dailyIndex(dayKey: string, length: number): number {
    if (length <= 0) return 0;
    let hash = 0;
    for (let i = 0; i < dayKey.length; i += 1) {
        hash = (hash * 31 + dayKey.charCodeAt(i)) % 1000003;
    }
    return hash % length;
}

function isCoupon(value: unknown): value is Coupon {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.id === 'string' &&
        typeof v.title === 'string' &&
        typeof v.subtitle === 'string' &&
        (v.kind === 'discount' || v.kind === 'shipping' || v.kind === 'points') &&
        typeof v.value === 'number' &&
        typeof v.code === 'string' &&
        (v.source === 'spin' || v.source === 'quiz' || v.source === 'deal') &&
        typeof v.earnedAt === 'string'
    );
}

function isQuiz(value: unknown): value is QuizResult {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    return (
        (v.key === 'budget' || v.key === 'fashion' || v.key === 'tech' || v.key === 'aesthetic') &&
        typeof v.completedAt === 'string' &&
        typeof v.rewardDateKey === 'string'
    );
}

function isDeal(value: unknown): value is DealDayState {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.dateKey === 'string' &&
        typeof v.challengeId === 'string' &&
        typeof v.attemptsLeft === 'number' &&
        typeof v.solved === 'boolean' &&
        typeof v.claimed === 'boolean'
    );
}

export async function loadRewards(userId: number): Promise<StoredRewards> {
    try {
        const raw = await AsyncStorage.getItem(storageKey(userId));
        if (!raw) return emptyRewards();
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null) return emptyRewards();
        const v = parsed as Record<string, unknown>;
        return {
            points: typeof v.points === 'number' && v.points >= 0 ? Math.floor(v.points) : 0,
            coupons: Array.isArray(v.coupons) ? v.coupons.filter(isCoupon) : [],
            lastSpinAt: typeof v.lastSpinAt === 'string' ? v.lastSpinAt : null,
            quiz: isQuiz(v.quiz) ? v.quiz : null,
            deal: isDeal(v.deal) ? v.deal : null,
        };
    } catch {
        return emptyRewards();
    }
}

export async function saveRewards(userId: number, rewards: StoredRewards): Promise<void> {
    try {
        await AsyncStorage.setItem(storageKey(userId), JSON.stringify(rewards));
    } catch (error) {
        console.error('Failed to save Play & Earn rewards:', error);
    }
}
