/**
 * RewardsContext - one shared balance for all Play & Earn activities.
 *
 * Spin & Win, the Shopping Personality Quiz and Deal Hunter all dispatch into the
 * same reducer, so points and coupons add up in one place. The state is read from
 * and written to AsyncStorage per signed-in user.
 */
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    DEAL_ATTEMPTS,
    QUIZ_REWARD_POINTS,
    StoredRewards,
    emptyRewards,
    loadRewards,
    saveRewards,
    todayKey,
} from '@/services/rewardsService';
import { Coupon, QuizResult, RewardState, SpinOutcome } from '@/types/rewards';

const initialState: RewardState = { ...emptyRewards(), hydrated: false };

type RewardsAction =
    | { type: 'HYDRATE'; payload: StoredRewards }
    | { type: 'RESET' }
    | { type: 'ADD_POINTS'; payload: number }
    | { type: 'RECORD_SPIN'; payload: { at: string; points: number; coupon: Coupon | null } }
    | { type: 'SAVE_QUIZ'; payload: QuizResult }
    | { type: 'ENSURE_DEAL_DAY'; payload: { dateKey: string; challengeId: string } }
    | { type: 'DEAL_ATTEMPT' }
    | { type: 'DEAL_SOLVED'; payload: { points: number; coupon: Coupon | null } }
    | { type: 'REDEEM_COUPON'; payload: string }
    | { type: 'REDEEM_POINTS'; payload: number };

export function rewardsReducer(state: RewardState, action: RewardsAction): RewardState {
    switch (action.type) {
        case 'HYDRATE':
            return { ...action.payload, hydrated: true };

        case 'RESET':
            return { ...emptyRewards(), hydrated: true };

        case 'ADD_POINTS':
            return { ...state, points: Math.max(0, state.points + Math.floor(action.payload)) };

        case 'RECORD_SPIN':
            return {
                ...state,
                lastSpinAt: action.payload.at,
                points: state.points + action.payload.points,
                coupons: action.payload.coupon ? [action.payload.coupon, ...state.coupons] : state.coupons,
            };

        case 'SAVE_QUIZ': {
            // Only the first quiz finished on a given day earns points
            const earnsPoints = state.quiz?.rewardDateKey !== action.payload.rewardDateKey;
            return {
                ...state,
                quiz: action.payload,
                points: state.points + (earnsPoints ? QUIZ_REWARD_POINTS : 0),
            };
        }

        case 'ENSURE_DEAL_DAY': {
            // Keep today's progress; start a fresh challenge when the day changes
            if (state.deal?.dateKey === action.payload.dateKey) return state;
            return {
                ...state,
                deal: {
                    dateKey: action.payload.dateKey,
                    challengeId: action.payload.challengeId,
                    attemptsLeft: DEAL_ATTEMPTS,
                    solved: false,
                    claimed: false,
                },
            };
        }

        case 'DEAL_ATTEMPT': {
            if (!state.deal || state.deal.solved) return state;
            return {
                ...state,
                deal: { ...state.deal, attemptsLeft: Math.max(0, state.deal.attemptsLeft - 1) },
            };
        }

        case 'DEAL_SOLVED': {
            if (!state.deal || state.deal.solved) return state;
            return {
                ...state,
                points: state.points + action.payload.points,
                coupons: action.payload.coupon ? [action.payload.coupon, ...state.coupons] : state.coupons,
                deal: { ...state.deal, solved: true, claimed: true },
            };
        }

        case 'REDEEM_COUPON':
            return { ...state, coupons: state.coupons.filter((coupon) => coupon.id !== action.payload) };

        case 'REDEEM_POINTS':
            // Points spent at checkout are removed from the shared balance.
            return { ...state, points: Math.max(0, state.points - Math.max(0, Math.floor(action.payload))) };

        default:
            return state;
    }
}

interface RewardsContextValue {
    state: RewardState;
    addPoints: (points: number) => void;
    recordSpin: (outcome: SpinOutcome) => void;
    saveQuiz: (result: QuizResult) => void;
    ensureDealDay: (challengeId: string) => void;
    registerDealAttempt: () => void;
    solveDeal: (points: number, coupon: Coupon | null) => void;
    redeemCoupon: (couponId: string) => void;
    redeemPoints: (points: number) => void;
}

const RewardsContext = createContext<RewardsContextValue | null>(null);

export function RewardsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const userId = user?.id ?? null;
    const [state, dispatch] = useReducer(rewardsReducer, initialState);

    // Load this user's saved rewards whenever the signed-in user changes
    useEffect(() => {
        let active = true;
        if (userId === null) {
            dispatch({ type: 'RESET' });
            return () => {
                active = false;
            };
        }
        loadRewards(userId).then((saved) => {
            if (active) dispatch({ type: 'HYDRATE', payload: saved });
        });
        return () => {
            active = false;
        };
    }, [userId]);

    // Persist every change after hydration
    useEffect(() => {
        if (userId === null || !state.hydrated) return;
        void saveRewards(userId, {
            points: state.points,
            coupons: state.coupons,
            lastSpinAt: state.lastSpinAt,
            quiz: state.quiz,
            deal: state.deal,
        });
    }, [userId, state]);

    const addPoints = useCallback((points: number) => {
        dispatch({ type: 'ADD_POINTS', payload: points });
    }, []);

    const recordSpin = useCallback((outcome: SpinOutcome) => {
        dispatch({
            type: 'RECORD_SPIN',
            payload: { at: new Date().toISOString(), points: outcome.points, coupon: outcome.coupon },
        });
    }, []);

    const saveQuiz = useCallback((result: QuizResult) => {
        dispatch({ type: 'SAVE_QUIZ', payload: result });
    }, []);

    const ensureDealDay = useCallback((challengeId: string) => {
        dispatch({ type: 'ENSURE_DEAL_DAY', payload: { dateKey: todayKey(), challengeId } });
    }, []);

    const registerDealAttempt = useCallback(() => {
        dispatch({ type: 'DEAL_ATTEMPT' });
    }, []);

    const solveDeal = useCallback((points: number, coupon: Coupon | null) => {
        dispatch({ type: 'DEAL_SOLVED', payload: { points, coupon } });
    }, []);

    const redeemCoupon = useCallback((couponId: string) => {
        dispatch({ type: 'REDEEM_COUPON', payload: couponId });
    }, []);

    const redeemPoints = useCallback((points: number) => {
        dispatch({ type: 'REDEEM_POINTS', payload: points });
    }, []);

    const value = useMemo(
        () => ({ state, addPoints, recordSpin, saveQuiz, ensureDealDay, registerDealAttempt, solveDeal, redeemCoupon, redeemPoints }),
        [state, addPoints, recordSpin, saveQuiz, ensureDealDay, registerDealAttempt, solveDeal, redeemCoupon, redeemPoints]
    );

    return <RewardsContext.Provider value={value}>{children}</RewardsContext.Provider>;
}

export function useRewards(): RewardsContextValue {
    const context = useContext(RewardsContext);
    if (!context) throw new Error('useRewards must be used inside a RewardsProvider');
    return context;
}
