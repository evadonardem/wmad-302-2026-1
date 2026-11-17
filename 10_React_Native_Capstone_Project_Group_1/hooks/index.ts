/**
 * Custom Hooks
 * Synchronized with AuthContext, ThemeContext, Offline Persistence,
 * Infinite Scroll Pagination, and Cross-Platform Responsive Breakpoints
 * (Website Desktop, Tablet, and Mobile Phones - Realme, iPhone, Samsung).
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { authStorage } from '@/utils/storage';

/**
 * Hook for managing authentication state with persistence
 */
export function useAuthPersistence() {
  const auth = useAuth();
  const { user, isAuthenticated, isLoadingAuth, loginWithEmailOrUsername, logout, updateUser } = auth;
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const storedUser = await authStorage.getUser();
        if (storedUser && !user) {
          // User hydration is handled automatically in AuthContext restoreValidSession
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
      } finally {
        setHydrated(true);
      }
    };
    hydrate();
  }, [user]);

  const refreshUser = useCallback(async () => {
    try {
      const storedUser = await authStorage.getUser();
      if (storedUser) {
        await updateUser(storedUser);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, [updateUser]);

  return {
    user,
    isAuthenticated,
    isLoading: isLoadingAuth || !hydrated,
    isLoadingAuth: isLoadingAuth || !hydrated,
    login: loginWithEmailOrUsername,
    loginWithEmailOrUsername,
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
        const storageModule = await import('@/utils/storage');
        const stored = await storageModule.getStorageItem<T>(key as any);
        if (isMounted && stored !== null && stored !== undefined) {
          setValue(stored);
        }
      } catch (error) {
        console.error(`Failed to load ${key}:`, error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [key]);

  const updateValue = useCallback(
    async (newValue: T | ((prev: T) => T)) => {
      setValue((prevValue) => {
        const resolvedValue = newValue instanceof Function ? newValue(prevValue) : newValue;
        import('@/utils/storage')
          .then((m) => m.setStorageItem(key as any, resolvedValue))
          .catch((error) => console.error(`Failed to save ${key}:`, error));
        return resolvedValue;
      });
    },
    [key]
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

  const fetchFnRef = useRef(fetchFn);
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFnRef.current(page, limit);
      setData((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setLoading(false);
    }
  }, [page, limit, loading, hasMore]);

  const refresh = useCallback(async () => {
    setPage(0);
    setData([]);
    setHasMore(true);
    setLoading(false);
    setError(null);
  }, []);

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
 * Hook for network status across Web, Tablet, and Mobile (Realme, iPhone, Android)
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    const nav = typeof globalThis !== 'undefined' ? (globalThis as any).navigator : undefined;
    if (Platform.OS === 'web' && typeof nav?.onLine === 'boolean') {
      return nav.onLine;
    }
    return true;
  });

  useEffect(() => {
    const webWindow =
      typeof globalThis !== 'undefined' && 'addEventListener' in globalThis
        ? (globalThis as unknown as {
            addEventListener: (type: string, listener: () => void) => void;
            removeEventListener: (type: string, listener: () => void) => void;
          })
        : null;

    if (Platform.OS === 'web' && webWindow) {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      webWindow.addEventListener('online', handleOnline);
      webWindow.addEventListener('offline', handleOffline);

      return () => {
        webWindow.removeEventListener('online', handleOnline);
        webWindow.removeEventListener('offline', handleOffline);
      };
    }

    // Lightweight periodic reachability check for native iOS/Android devices
    let active = true;
    const checkConnectivity = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch('https://dummyjson.com/products?limit=1', {
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (active) setIsOnline(res.ok);
      } catch {
        if (active) setIsOnline(false);
      }
    };

    checkConnectivity();
    const interval = setInterval(checkConnectivity, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return isOnline;
}

/**
 * Hook for responsive breakpoints across Website, Tablet, and Phone (Realme, iPhone, Samsung)
 */
export function useResponsiveDevice() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isLargeDesktop = width >= 1400;
    const isDesktop = width >= 1024;
    const isTablet = width >= 768 && width < 1024;
    const isPhone = width < 768;
    const isSmallPhone = width <= 375;

    return {
      width,
      height,
      deviceType: (isDesktop ? 'desktop' : isTablet ? 'tablet' : 'phone') as
        | 'phone'
        | 'tablet'
        | 'desktop',
      isLargeDesktop,
      isDesktop,
      isTablet,
      isPhone,
      isSmallPhone,
      gridColumns: isLargeDesktop ? 6 : isDesktop ? 4 : isTablet ? 3 : 2,
      contentMaxWidth: isLargeDesktop ? 1360 : isDesktop ? 1200 : isTablet ? 860 : width,
      horizontalPadding: isDesktop ? 24 : isTablet ? 16 : isSmallPhone ? 8 : 12,
    };
  }, [width, height]);
}