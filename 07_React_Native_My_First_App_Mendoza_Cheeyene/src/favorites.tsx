import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Quote } from '@/services/quoteService';

// Pre-built favorites infrastructure (not part of the assignment).
// The provider is mounted in src/app/_layout.tsx — screens consume it
// with useFavorites() (see TODO 24 and TODO 23). This file does not need editing.
type FavoritesValue = {
  favorites: Quote[];
  isFavorite: (quote: Quote) => boolean;
  toggleFavorite: (quote: Quote) => void;
  removeFavorite: (quote: Quote) => void;
};

const identityKey = (quote: Quote) => quote.text;

const FavoritesContext = createContext<FavoritesValue>({
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: () => {},
  removeFavorite: () => {},
});

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Quote[]>([]);

  const value = useMemo(
    () => ({
      favorites,
      isFavorite: (quote: Quote) => favorites.some((f) => identityKey(f) === identityKey(quote)),
      toggleFavorite: (quote: Quote) =>
        setFavorites((prev) =>
          prev.some((f) => identityKey(f) === identityKey(quote))
            ? prev.filter((f) => identityKey(f) !== identityKey(quote))
            : [quote, ...prev],
        ),
      removeFavorite: (quote: Quote) =>
        setFavorites((prev) => prev.filter((f) => identityKey(f) !== identityKey(quote))),
    }),
    [favorites],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => useContext(FavoritesContext);
