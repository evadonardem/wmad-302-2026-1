import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
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
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const favoriteIdsRef = useRef<number[]>([]);
  const writeQueueRef = useRef(Promise.resolve());

  const reloadFavorites = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ids = await favoritesStorage.getIds();
      favoriteIdsRef.current = ids;
      setFavoriteIds(ids);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load favorites.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadFavorites();
  }, [reloadFavorites]);

  const toggleFavorite = useCallback(async (id: number) => {
    setError(null);
    const previousIds = favoriteIdsRef.current;
    const nextIds = previousIds.includes(id)
      ? previousIds.filter((favoriteId) => favoriteId !== id)
      : [...previousIds, id];
    favoriteIdsRef.current = nextIds;
    setFavoriteIds(nextIds);

    const write = writeQueueRef.current.catch(() => undefined)
      .then(() => favoritesStorage.setIds(nextIds));
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
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isLoading, error, clearError, reloadFavorites, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within a FavoritesProvider');
  return context;
}
