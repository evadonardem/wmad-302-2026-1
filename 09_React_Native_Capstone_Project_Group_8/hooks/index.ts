
/**
 * Custom Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authStorage, getStorageItem, setStorageItem } from '@/utils/storage';

/**
 * Hook for managing authentication state with persistence
 */
export function useAuthPersistence() {
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
  } = useAuth();

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const storedUser = await authStorage.getUser();

        if (storedUser) {
          // Authentication is already hydrated in AuthContext.
        }
      } catch (error) {
        console.error('Failed to hydrate authentication:', error);
      } finally {
        setHydrated(true);
      }
    };

    hydrate();
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || !hydrated,
    login,
    logout,
    refreshUser,
  };
}

/**
 * Hook for async storage with state
 */
export function useAsyncStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const stored = await getStorageItem<T>(key as any);

        if (isMounted && stored !== null) {
          setValue(stored);
        }
      } catch (error) {
        console.error(`Failed to load ${key}:`, error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [key]);

  const updateValue = useCallback(
    async (newValue: T | ((prev: T) => T)) => {
      const resolvedValue =
        typeof newValue === 'function'
          ? (newValue as (prev: T) => T)(value)
          : newValue;

      setValue(resolvedValue);

      try {
        await setStorageItem(key as any, resolvedValue);
      } catch (error) {
        console.error(`Failed to save ${key}:`, error);
      }
    },
    [key, value]
  );

  return [value, updateValue, loading] as const;
}

/**
 * Hook for debounced values
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for infinite scroll pagination
 */
export function useInfiniteScroll<T>(
  fetchFn: (
    page: number,
    limit: number
  ) => Promise<{ data: T[]; hasMore: boolean }>,
  limit: number = 20
) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(page, limit);

      setData((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage((prev) => prev + 1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load more'
      );
    } finally {
      setLoading(false);
    }
  }, [fetchFn, page, limit, loading, hasMore]);

  const refresh = useCallback(async () => {
    setData([]);
    setPage(0);
    setHasMore(true);
    setError(null);

    setLoading(true);

    try {
      const result = await fetchFn(0, limit);

      setData(result.data);
      setHasMore(result.hasMore);
      setPage(1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to refresh'
      );
    } finally {
      setLoading(false);
    }
  }, [fetchFn, limit]);

  return {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    refresh,
  };
}

/**
 * Hook for network status in environments that expose browser connectivity events.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const networkGlobal = globalThis as unknown as {
      navigator?: { onLine?: boolean };
      addEventListener?: (event: string, listener: () => void) => void;
      removeEventListener?: (event: string, listener: () => void) => void;
    };
    const updateStatus = () => {
      setIsOnline(networkGlobal.navigator?.onLine ?? true);
    };

    updateStatus();
    networkGlobal.addEventListener?.('online', updateStatus);
    networkGlobal.addEventListener?.('offline', updateStatus);

    return () => {
      networkGlobal.removeEventListener?.('online', updateStatus);
      networkGlobal.removeEventListener?.('offline', updateStatus);
    };
  }, []);

  return isOnline;
}
