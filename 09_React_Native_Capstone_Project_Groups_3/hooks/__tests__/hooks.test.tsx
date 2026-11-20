import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useAsyncStorage, useDebounce, useInfiniteScroll } from '../index';

describe('useDebounce', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('only updates after the value stops changing for the delay', () => {
    const { result, rerender } = renderHook(({ value }: { value: string }) => useDebounce(value, 300), {
      initialProps: { value: 'c' },
    });
    expect(result.current).toBe('c');

    rerender({ value: 'ch' });
    rerender({ value: 'chi' });
    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('c');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('chi');
  });
});

describe('useAsyncStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('loads the saved value and saves updates', async () => {
    await AsyncStorage.setItem('user_settings', JSON.stringify({ recipeReminders: true }));
    const { result } = renderHook(() => useAsyncStorage('user_settings', { recipeReminders: false }));

    await waitFor(() => expect(result.current[2]).toBe(false)); // loading done
    expect(result.current[0]).toEqual({ recipeReminders: true });

    await act(async () => {
      await result.current[1]({ recipeReminders: false });
    });
    expect(result.current[0]).toEqual({ recipeReminders: false });
    expect(JSON.parse((await AsyncStorage.getItem('user_settings')) ?? 'null')).toEqual({ recipeReminders: false });
  });

  it('keeps the initial value when nothing is saved', async () => {
    const { result } = renderHook(() => useAsyncStorage('theme_preference', 'system'));
    await waitFor(() => expect(result.current[2]).toBe(false));
    expect(result.current[0]).toBe('system');
  });
});

describe('useInfiniteScroll', () => {
  it('loads pages until there are no more', async () => {
    const fetchPage = jest
      .fn<Promise<{ data: number[]; hasMore: boolean }>, [number, number]>()
      .mockResolvedValueOnce({ data: [1, 2], hasMore: true })
      .mockResolvedValueOnce({ data: [3], hasMore: false });

    const { result } = renderHook(() => useInfiniteScroll(fetchPage, 2));

    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.data).toEqual([1, 2]);
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.data).toEqual([1, 2, 3]);
    expect(result.current.hasMore).toBe(false);
    expect(fetchPage).toHaveBeenNthCalledWith(1, 0, 2);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 1, 2);
  });

  it('shows an error message when a page fails', async () => {
    const fetchPage = jest.fn().mockRejectedValue(new Error('Network down'));
    const { result } = renderHook(() => useInfiniteScroll(fetchPage));
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.error).toBe('Network down');
  });
});
