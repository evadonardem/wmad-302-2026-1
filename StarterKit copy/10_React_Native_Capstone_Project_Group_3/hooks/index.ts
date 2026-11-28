/**
 * Custom Hooks
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { getStorageItem, setStorageItem, StorageKey } from '@/utils/storage';
import { getErrorMessage } from '@/utils/errors';
import { useAppTheme } from '@/context/SettingsContext';
import type { Palette } from '@/constants/palettes';

/**
 * State that is loaded from and saved to AsyncStorage.
 * Returns [value, setValue, loading, reload]. Call `reload` to pick up changes
 * another screen saved under the same key (e.g. on focus).
 */
export function useAsyncStorage<T>(key: StorageKey, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  // Ref so functional updates always see the latest value, even between renders
  const valueRef = useRef(value);
  const mountedRef = useRef(true);

  const reload = useCallback(async () => {
    const stored = await getStorageItem<T>(key);
    if (!mountedRef.current) return;
    if (stored !== null) {
      valueRef.current = stored;
      setValue(stored);
    }
    setLoading(false);
  }, [key]);

  useEffect(() => {
    mountedRef.current = true;
    reload();
    return () => {
      mountedRef.current = false;
    };
  }, [reload]);

  const updateValue = useCallback(
    async (next: T | ((prev: T) => T)) => {
      const resolved = next instanceof Function ? next(valueRef.current) : next;
      valueRef.current = resolved;
      setValue(resolved);
      try {
        await setStorageItem(key, resolved);
      } catch (error) {
        console.error(`Failed to save ${key}:`, error);
      }
    },
    [key]
  );

  return [value, updateValue, loading, reload] as const;
}

/**
 * Hook for debounced values
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export interface PageResult<T> {
  data: T[];
  hasMore: boolean;
  total?: number;
}

/**
 * Hook for infinite scroll pagination.
 *
 * `fetchFn` must be memoized (useCallback); when it changes, call `refresh()`
 * to start again from page 0. Responses from superseded requests are ignored,
 * so quickly changing filters can never show stale results.
 */
export function useInfiniteScroll<T>(
  fetchFn: (page: number, limit: number) => Promise<PageResult<T>>,
  limit: number = 20
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const inFlightRef = useRef(false);
  const requestIdRef = useRef(0);

  const load = useCallback(
    async (reset: boolean) => {
      if (!reset && (inFlightRef.current || !hasMoreRef.current)) return;

      const requestId = ++requestIdRef.current;
      const page = reset ? 0 : pageRef.current;
      inFlightRef.current = true;
      setError(null);
      if (reset) setRefreshing(true);
      else setLoading(true);

      try {
        const result = await fetchFn(page, limit);
        if (requestId !== requestIdRef.current) return;
        setData((prev) => (reset ? result.data : [...prev, ...result.data]));
        pageRef.current = page + 1;
        hasMoreRef.current = result.hasMore;
        setHasMore(result.hasMore);
        setTotal(result.total ?? null);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(getErrorMessage(err, 'Failed to load'));
      } finally {
        if (requestId === requestIdRef.current) {
          inFlightRef.current = false;
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [fetchFn, limit]
  );

  const loadMore = useCallback(() => load(false), [load]);
  const refresh = useCallback(() => load(true), [load]);

  return { data, loading, refreshing, hasMore, total, error, loadMore, refresh };
}

/**
 * Hook for network status (NetInfo works on iOS, Android and web).
 * Treats "unknown" reachability as online to avoid false offline banners.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        setIsOnline(state.isConnected !== false && state.isInternetReachable !== false);
      }),
    []
  );

  return isOnline;
}

/**
 * Memoized styles built from the active palette.
 * `factory` must be defined at module level so it stays referentially stable.
 */
export function useThemedStyles<T>(factory: (palette: Palette) => T): T {
  const { palette } = useAppTheme();
  return useMemo(() => factory(palette), [factory, palette]);
}

const GRID_GAP = 12;
const GRID_PADDING = 16;

/** Number of product-grid columns for a given window width (phone 2, tablet 3–4, desktop 5). */
export function getGridColumns(width: number): number {
  if (width >= 1200) return 5;
  if (width >= 900) return 4;
  if (width >= 600) return 3;
  return 2;
}

/** Responsive grid: column count plus the exact pixel width of each item. */
export function useGridColumns() {
  const { width } = useWindowDimensions();
  const columns = getGridColumns(width);
  const itemWidth = Math.floor((width - GRID_PADDING * 2 - GRID_GAP * (columns - 1)) / columns);
  return { columns, itemWidth, gap: GRID_GAP, padding: GRID_PADDING };
}
