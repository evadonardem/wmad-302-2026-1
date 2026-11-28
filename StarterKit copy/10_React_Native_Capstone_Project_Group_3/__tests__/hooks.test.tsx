import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAsyncStorage, useDebounce, useInfiniteScroll, PageResult } from '@/hooks';
import { STORAGE_KEYS } from '@/utils/storage';

describe('useDebounce', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('only updates after the delay has passed', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    });
    rerender({ value: 'ab' });
    expect(result.current).toBe('a');
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('ab');
  });
});

describe('useInfiniteScroll', () => {
  const makeFetch = (totalPages: number) =>
    jest.fn(
      async (page: number, limit: number): Promise<PageResult<number>> => ({
        data: Array.from({ length: limit }, (_, i) => page * limit + i),
        hasMore: page + 1 < totalPages,
      })
    );

  it('loads pages in order and stops when there is no more data', async () => {
    const fetchFn = makeFetch(2);
    const { result } = renderHook(() => useInfiniteScroll(fetchFn, 2));

    await act(() => result.current.refresh());
    expect(result.current.data).toEqual([0, 1]);

    await act(() => result.current.loadMore());
    expect(result.current.data).toEqual([0, 1, 2, 3]);
    expect(result.current.hasMore).toBe(false);

    await act(() => result.current.loadMore());
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('refresh restarts from the first page', async () => {
    const fetchFn = makeFetch(3);
    const { result } = renderHook(() => useInfiniteScroll(fetchFn, 1));

    await act(() => result.current.refresh());
    await act(() => result.current.loadMore());
    await act(() => result.current.refresh());

    expect(fetchFn).toHaveBeenLastCalledWith(0, 1);
    expect(result.current.data).toEqual([0]);
  });

  it('exposes errors', async () => {
    const fetchFn = jest.fn(async (): Promise<PageResult<number>> => {
      throw new Error('Server down');
    });
    const { result } = renderHook(() => useInfiniteScroll(fetchFn));
    await act(() => result.current.refresh());
    expect(result.current.error).toBe('Server down');
  });
});

describe('useAsyncStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('loads the stored value and persists updates', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ count: 1 }));
    const { result } = renderHook(() => useAsyncStorage(STORAGE_KEYS.SETTINGS, { count: 0 }));

    await waitFor(() => expect(result.current[2]).toBe(false));
    expect(result.current[0]).toEqual({ count: 1 });

    await act(() => result.current[1]((prev) => ({ count: prev.count + 1 })));
    expect(result.current[0]).toEqual({ count: 2 });
    expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS)) ?? 'null')).toEqual({ count: 2 });
  });
});
