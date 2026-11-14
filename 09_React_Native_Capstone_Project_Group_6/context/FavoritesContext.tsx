import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { favoritesStorage } from '@/utils/storage';

interface FavoritesContextValue {
  favoriteIds: number[];
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  reloadFavorites: () => Promise<void>;
  toggleFavorite: (id: number) => Promise<boolean>;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const accountKey = isAuthenticated && user
    ? user.id > 0
      ? String(user.id)
      : `username:${user.username.trim().toLowerCase()}`
    : null;
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [loadedAccountKey, setLoadedAccountKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const favoriteIdsRef = useRef<number[]>([]);
  const writeQueueRef = useRef(Promise.resolve());
  const loadRequestRef = useRef(0);

  const reloadFavorites = useCallback(async () => {
    const requestId = ++loadRequestRef.current;
    setError(null);
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (accountKey === null) {
      favoriteIdsRef.current = [];
      setFavoriteIds([]);
      setLoadedAccountKey(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const ids = await favoritesStorage.getIds(accountKey);
      if (requestId !== loadRequestRef.current) return;
      favoriteIdsRef.current = ids;
      setFavoriteIds(ids);
      setLoadedAccountKey(accountKey);
    } catch (loadError) {
      if (requestId !== loadRequestRef.current) return;
      setError(loadError instanceof Error ? loadError.message : 'Could not load favorites.');
      setLoadedAccountKey(accountKey);
    } finally {
      if (requestId === loadRequestRef.current) setIsLoading(false);
    }
  }, [accountKey, authLoading]);

  useEffect(() => {
    favoriteIdsRef.current = [];
    setFavoriteIds([]);
    setLoadedAccountKey(null);
    void reloadFavorites();
    return () => {
      loadRequestRef.current += 1;
    };
  }, [reloadFavorites]);

  const toggleFavorite = useCallback(async (id: number) => {
    if (authLoading || accountKey === null || loadedAccountKey !== accountKey) {
      throw new Error('Sign in before saving favorites.');
    }
    setError(null);
    const previousIds = favoriteIdsRef.current;
    const nextIds = previousIds.includes(id)
      ? previousIds.filter((favoriteId) => favoriteId !== id)
      : [...previousIds, id];
    favoriteIdsRef.current = nextIds;
    setFavoriteIds(nextIds);

    const write = writeQueueRef.current.catch(() => undefined)
      .then(() => favoritesStorage.setIds(accountKey, nextIds));
    writeQueueRef.current = write;
    try {
      await write;
    } catch (error) {
      if (favoriteIdsRef.current === nextIds) {
        favoriteIdsRef.current = previousIds;
        setFavoriteIds(previousIds);
      }
      throw error;
    }
    return nextIds.includes(id);
  }, [accountKey, authLoading, loadedAccountKey]);

  const clearError = useCallback(() => setError(null), []);
  const activeFavoriteIds = !authLoading && accountKey !== null && loadedAccountKey === accountKey
    ? favoriteIds
    : [];
  const activeIsLoading = authLoading || isLoading || (accountKey !== null && loadedAccountKey !== accountKey);

  return (
    <FavoritesContext.Provider value={{
      favoriteIds: activeFavoriteIds,
      isLoading: activeIsLoading,
      error,
      clearError,
      reloadFavorites,
      toggleFavorite,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within a FavoritesProvider');
  return context;
}
