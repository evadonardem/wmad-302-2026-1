/**
 * Integration test: ActivityProvider with real AsyncStorage mock
 */
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityProvider, MAX_COMPARE, useActivity } from '@/context/ActivityContext';
import { STORAGE_KEYS } from '@/utils/storage';
import type { Product } from '@/types/product';

const makeProduct = (id: number): Product =>
  ({
    id,
    title: `Product ${id}`,
    thumbnail: '',
    category: 'beauty',
    price: 10,
    discountPercentage: 0,
    rating: 4,
    stock: 3,
    reviews: [],
  }) as unknown as Product;

const wrapper = ({ children }: { children: React.ReactNode }) => <ActivityProvider>{children}</ActivityProvider>;

/** Renders the provider and waits for it to finish loading from storage. */
async function renderActivity() {
  const utils = renderHook(() => useActivity(), { wrapper });
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
  return utils;
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('ActivityContext', () => {
  it('tracks recently viewed products and persists them', async () => {
    const { result } = await renderActivity();
    act(() => result.current.addRecentlyViewed(makeProduct(1)));
    act(() => result.current.addRecentlyViewed(makeProduct(2)));
    act(() => result.current.addRecentlyViewed(makeProduct(1)));

    expect(result.current.recentlyViewed.map((p) => p.id)).toEqual([1, 2]);
    await waitFor(async () =>
      expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.RECENTLY_VIEWED)) ?? '[]')).toHaveLength(2)
    );
  });

  it('records search history, ignoring very short terms', async () => {
    const { result } = await renderActivity();
    act(() => result.current.addSearch('phone'));
    act(() => result.current.addSearch('a'));
    act(() => result.current.addSearch('Phone'));
    expect(result.current.searchHistory).toEqual(['Phone']);
    act(() => result.current.clearSearchHistory());
    expect(result.current.searchHistory).toEqual([]);
  });

  it(`limits compare to ${MAX_COMPARE} products`, async () => {
    const { result } = await renderActivity();
    for (let id = 1; id <= MAX_COMPARE; id += 1) {
      act(() => {
        expect(result.current.toggleCompare(makeProduct(id))).toBe('added');
      });
    }
    let outcome = '';
    act(() => {
      outcome = result.current.toggleCompare(makeProduct(99));
    });
    expect(outcome).toBe('full');
    act(() => {
      expect(result.current.toggleCompare(makeProduct(1))).toBe('removed');
    });
    expect(result.current.isComparing(1)).toBe(false);
  });

  it('stores reviews per product', async () => {
    const { result } = await renderActivity();
    act(() =>
      result.current.addReview({ productId: 5, rating: 4, comment: 'Great gift', date: '2026-11-20', reviewerName: 'Ada' })
    );
    expect(result.current.getReviews(5)).toHaveLength(1);
    expect(result.current.getReviews(6)).toHaveLength(0);
  });
});
