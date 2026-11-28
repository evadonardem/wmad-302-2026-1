/**
 * Rewards Context - points, check-in streak, daily surprise, unlocked reward
 * coupons, advent calendar doors and the themes the user has tried.
 * Rules live in utils/rewards.ts; state is persisted to AsyncStorage.
 */
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from './SettingsContext';
import {
  AdventReward,
  checkIn as checkInRule,
  currentStreak,
  dayKey,
  INITIAL_REWARDS,
  openAdventDoor as openAdventDoorRule,
  openSurprise as openSurpriseRule,
  Prize,
  redeemCoupon as redeemCouponRule,
  RewardsState,
} from '@/utils/rewards';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/utils/storage';

interface RewardsContextType {
  rewards: RewardsState;
  hydrated: boolean;
  streak: number;
  checkedInToday: boolean;
  surpriseOpenedToday: boolean;
  /** Points earned, or null if already checked in today. */
  checkIn: () => number | null;
  openSurprise: () => Prize | null;
  redeemCoupon: (code: string) => 'ok' | 'insufficient' | 'owned' | 'unknown';
  openAdventDoor: (day: number, sneakPeek?: boolean) => AdventReward | null;
}

const RewardsContext = createContext<RewardsContextType | undefined>(undefined);

export function RewardsProvider({ children }: { children: ReactNode }) {
  const { season } = useSettings();
  const [rewards, setRewards] = useState<RewardsState>(INITIAL_REWARDS);
  const [hydrated, setHydrated] = useState(false);
  // Latest state for the synchronous actions below (they return what was won)
  const latest = useRef(rewards);
  latest.current = rewards;

  useEffect(() => {
    getStorageItem<Partial<RewardsState>>(STORAGE_KEYS.REWARDS).then((stored) => {
      if (stored) setRewards({ ...INITIAL_REWARDS, ...stored });
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) setStorageItem(STORAGE_KEYS.REWARDS, rewards).catch(() => undefined);
  }, [rewards, hydrated]);

  // Remember every theme the user has tried (for the "Theme explorer" badge)
  useEffect(() => {
    if (!hydrated) return;
    setRewards((prev) => (prev.themesTried.includes(season) ? prev : { ...prev, themesTried: [...prev.themesTried, season] }));
  }, [season, hydrated]);

  const commit = useCallback((next: RewardsState) => {
    latest.current = next;
    setRewards(next);
  }, []);

  const checkIn = useCallback(() => {
    const result = checkInRule(latest.current);
    if (!result) return null;
    commit(result.state);
    return result.earned;
  }, [commit]);

  const openSurprise = useCallback(() => {
    const result = openSurpriseRule(latest.current);
    if (!result) return null;
    commit(result.state);
    return result.prize;
  }, [commit]);

  const redeemCoupon = useCallback(
    (code: string) => {
      const result = redeemCouponRule(latest.current, code);
      if (typeof result === 'string') return result;
      commit(result);
      return 'ok' as const;
    },
    [commit]
  );

  const openAdventDoor = useCallback(
    (day: number, sneakPeek = false) => {
      const result = openAdventDoorRule(latest.current, day, new Date(), sneakPeek);
      if (!result) return null;
      commit(result.state);
      return result.reward;
    },
    [commit]
  );

  const value = useMemo<RewardsContextType>(() => {
    const today = dayKey();
    return {
      rewards,
      hydrated,
      streak: currentStreak(rewards),
      checkedInToday: rewards.lastCheckIn === today,
      surpriseOpenedToday: rewards.lastSurprise === today,
      checkIn,
      openSurprise,
      redeemCoupon,
      openAdventDoor,
    };
  }, [rewards, hydrated, checkIn, openSurprise, redeemCoupon, openAdventDoor]);

  return <RewardsContext.Provider value={value}>{children}</RewardsContext.Provider>;
}

export function useRewards(): RewardsContextType {
  const context = useContext(RewardsContext);
  if (context === undefined) {
    throw new Error('useRewards must be used within a RewardsProvider');
  }
  return context;
}
