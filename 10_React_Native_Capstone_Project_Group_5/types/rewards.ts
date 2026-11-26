/**
 * Play & Earn - shared types
 *
 * All three games (Spin & Win, Shopping Personality Quiz and Deal Hunter) feed
 * one reward balance: points plus coupons. The state is persisted per user with
 * AsyncStorage (see services/rewardsService.ts and context/RewardsContext.tsx).
 */

export type PersonalityKey = 'budget' | 'fashion' | 'tech' | 'aesthetic';

export type CouponKind = 'discount' | 'shipping' | 'points';

export type CouponSource = 'spin' | 'quiz' | 'deal';

export interface Coupon {
    id: string;
    /** Big label, e.g. "10% OFF" or "Free Shipping" */
    title: string;
    /** Where it came from, e.g. "Earned from Spin & Win" */
    subtitle: string;
    kind: CouponKind;
    /** Percent off for discount coupons, 0 otherwise */
    value: number;
    code: string;
    source: CouponSource;
    /** ISO timestamp */
    earnedAt: string;
}

export interface QuizResult {
    key: PersonalityKey;
    /** ISO timestamp of when the quiz was finished */
    completedAt: string;
    /** Local day key (YYYY-MM-DD) used to award the daily quiz points once */
    rewardDateKey: string;
}

export interface DealDayState {
    /** Local day key (YYYY-MM-DD) the challenge belongs to */
    dateKey: string;
    challengeId: string;
    attemptsLeft: number;
    solved: boolean;
    claimed: boolean;
}

export interface RewardState {
    points: number;
    coupons: Coupon[];
    /** ISO timestamp of the last spin, or null if never spun */
    lastSpinAt: string | null;
    quiz: QuizResult | null;
    deal: DealDayState | null;
    /** False until the saved state has been read from AsyncStorage */
    hydrated: boolean;
}

/** One row of the prize wheel */
export interface SpinSegment {
    label: string;
    kind: 'discount' | 'shipping' | 'points' | 'none';
    /** Percent off for discounts, 50 for points, 0 otherwise */
    value: number;
    weight: number;
    color: string;
    textColor: string;
}

/** The chosen segment plus the rewards it grants */
export interface SpinOutcome {
    index: number;
    segment: SpinSegment;
    points: number;
    coupon: Coupon | null;
}
