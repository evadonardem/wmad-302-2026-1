/**
 * Custom Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authStorage, getStorageItem, setStorageItem, StorageKey } from '@/utils/storage';

/**
 * Hook for managing authentication state with persistence
 */
export function useAuthPersistence() {
  const { user, isAuthenticated, isLoading, login, logout, refreshUser } = useAuth();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      await authStorage.getUser();
      setHydrated(true);
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
export function useAsyncStorage<T>(key: StorageKey, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await getStorageItem<T>(key);
        if (stored !== null) setValue(stored);
      } catch (error) {
        console.error(`Failed to load ${key}:`, error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [key]);

  const updateValue = useCallback(
    async (newValue: T | ((prev: T) => T)) => {
      const resolvedValue = newValue instanceof Function ? newValue(value) : newValue;
      setValue(resolvedValue);
      try {
        await setStorageItem(key, resolvedValue);
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
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for infinite scroll pagination
 */
export function useInfiniteScroll<T>(
  fetchFn: (page: number, limit: number) => Promise<{ data: T[]; hasMore: boolean }>,
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
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setLoading(false);
    }
  }, [fetchFn, page, limit, loading, hasMore]);

  const refresh = useCallback(async () => {
    setPage(0);
    setData([]);
    setHasMore(true);
    await loadMore();
  }, [loadMore]);

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
 * Hook for network status
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.addEventListener) return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}