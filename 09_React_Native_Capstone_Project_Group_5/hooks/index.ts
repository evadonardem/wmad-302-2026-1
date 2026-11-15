/**
 * Custom Hooks
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getStorageItem, setStorageItem, StorageKey } from '@/utils/storage';

/** Debounce a fast-changing value (e.g. search text). */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/** useState backed by AsyncStorage. */
export function useAsyncStorage<T>(key: StorageKey, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getStorageItem<T>(key)
      .then((stored) => {
        if (active && stored !== null) setValue(stored);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [key]);

  const updateValue = useCallback(
    async (newValue: T | ((prev: T) => T)) => {
      const resolved = newValue instanceof Function ? newValue(value) : newValue;
      setValue(resolved);
      try {
        await setStorageItem(key, resolved);
      } catch (error) {
        console.error(`Failed to save ${key}:`, error);
      }
    },
    [key, value]
  );

  return [value, updateValue, loading] as const;
}

export interface PageResult<T> {
  data: T[];
  hasMore: boolean;
  total?: number;
}

/**
 * Infinite scroll pagination.
 * `resetKey` changes (e.g. new search text or filter) restart from page 0 and
 * ignore any in-flight response for the previous key.
 */
export function useInfiniteScroll<T>(
  fetchFn: (page: number, limit: number) => Promise<PageResult<T>>,
  limit: number = 10,
  resetKey: string = ''
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const pageRef = useRef(0);
  const busyRef = useRef(false);
  const hasMoreRef = useRef(true);
  const requestRef = useRef(0);
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const run = useCallback(
    async (mode: 'initial' | 'refresh' | 'more') => {
      const reset = mode !== 'more';
      if (!reset && (busyRef.current || !hasMoreRef.current)) return;

      const requestId = ++requestRef.current;
      busyRef.current = true;
      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      if (mode === 'more') setLoadingMore(true);

      const page = reset ? 0 : pageRef.current;
      try {
        const result = await fetchRef.current(page, limit);
        if (requestId !== requestRef.current) return; // stale response
        setData((prev) => (reset ? result.data : [...prev, ...result.data]));
        hasMoreRef.current = result.hasMore;
        setHasMore(result.hasMore);
        setTotal(result.total);
        pageRef.current = page + 1;
        setError(null);
      } catch (err) {
        if (requestId !== requestRef.current) return;
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        if (requestId === requestRef.current) {
          busyRef.current = false;
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [limit]
  );

  useEffect(() => {
    run('initial');
  }, [resetKey, run]);

  const loadMore = useCallback(() => run('more'), [run]);
  const refresh = useCallback(() => run('refresh'), [run]);
  const retry = useCallback(() => run('initial'), [run]);

  return { data, total, loading, loadingMore, refreshing, hasMore, error, loadMore, refresh, retry };
}