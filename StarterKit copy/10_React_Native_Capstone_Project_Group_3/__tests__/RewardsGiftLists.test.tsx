/**
 * Integration tests: RewardsProvider and GiftListsProvider with the AsyncStorage mock
 */
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SettingsProvider, useSettings } from '@/context/SettingsContext';
import { RewardsProvider, useRewards } from '@/context/RewardsContext';
import { GiftListsProvider, giftListTotal, useGiftLists } from '@/context/GiftListsContext';
import { STORAGE_KEYS } from '@/utils/storage';
import type { ProductSummary } from '@/types/product';

const product = (id: number, price = 10): ProductSummary => ({
  id,
  title: `Product ${id}`,
  thumbnail: '',
  category: 'beauty',
  price,
  discountPercentage: 0,
  rating: 4.6,
  stock: 5,
});

const stored = async (key: string) => JSON.parse((await AsyncStorage.getItem(key)) ?? 'null');

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('RewardsContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SettingsProvider>
      <RewardsProvider>{children}</RewardsProvider>
    </SettingsProvider>
  );
  const useAll = () => ({ rewards: useRewards(), settings: useSettings() });

  it('checks in once a day, opens the surprise once and persists', async () => {
    const { result } = renderHook(useAll, { wrapper });
    await waitFor(() => expect(result.current.rewards.hydrated).toBe(true));

    let earned: number | null = null;
    act(() => {
      earned = result.current.rewards.checkIn();
    });
    expect(earned).toBeGreaterThan(0);
    expect(result.current.rewards.checkedInToday).toBe(true);
    expect(result.current.rewards.streak).toBe(1);
    act(() => {
      expect(result.current.rewards.checkIn()).toBeNull();
    });

    act(() => {
      expect(result.current.rewards.openSurprise()).not.toBeNull();
    });
    expect(result.current.rewards.surpriseOpenedToday).toBe(true);
    act(() => {
      expect(result.current.rewards.openSurprise()).toBeNull();
    });

    await waitFor(async () => expect((await stored(STORAGE_KEYS.REWARDS))?.streak).toBe(1));
  });

  it('records the themes the user tries and redeems coupons', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify({ points: 600 }));
    const { result } = renderHook(useAll, { wrapper });
    await waitFor(() => expect(result.current.rewards.rewards.points).toBe(600));

    act(() => result.current.settings.updateSettings({ seasonTheme: 'halloween' }));
    await waitFor(() => expect(result.current.rewards.rewards.themesTried).toEqual(['lively', 'halloween']));

    act(() => {
      expect(result.current.rewards.redeemCoupon('POINTS15')).toBe('ok');
    });
    expect(result.current.rewards.rewards.points).toBe(100);
    act(() => {
      expect(result.current.rewards.redeemCoupon('POINTS15')).toBe('owned');
    });
  });
});

describe('GiftListsContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <GiftListsProvider>{children}</GiftListsProvider>;

  it('creates lists, toggles items and tracks the budget', async () => {
    const { result } = renderHook(() => useGiftLists(), { wrapper });
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));

    let listId = '';
    act(() => {
      listId = result.current.createList('  For Mom ', 50, '👩').id;
    });
    expect(result.current.lists[0]).toMatchObject({ name: 'For Mom', budget: 50, emoji: '👩' });

    act(() => {
      expect(result.current.toggleItem(listId, product(1, 20))).toBe(true);
    });
    act(() => {
      expect(result.current.toggleItem(listId, product(2, 15))).toBe(true);
    });
    expect(giftListTotal(result.current.lists[0])).toBe(35);
    expect(result.current.listsContaining(1)).toHaveLength(1);

    act(() => {
      expect(result.current.toggleItem(listId, product(1))).toBe(false);
    });
    expect(result.current.listsContaining(1)).toHaveLength(0);

    await waitFor(async () => expect(await stored(STORAGE_KEYS.GIFT_LISTS)).toHaveLength(1));
    act(() => result.current.deleteList(listId));
    expect(result.current.lists).toHaveLength(0);
  });
});
