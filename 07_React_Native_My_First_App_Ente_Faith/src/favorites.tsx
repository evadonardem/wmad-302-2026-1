import type { Quote } from '@/services/quoteService';
import { createContext, createElement, useContext, useMemo, useState, type ReactNode } from 'react';

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
      isFavorite: (quote: Quote) => favorites.some((f: Quote) => identityKey(f) === identityKey(quote)),
      toggleFavorite: (quote: Quote) =>
        setFavorites((prev: Quote[]) =>
          prev.some((f: Quote) => identityKey(f) === identityKey(quote))
            ? prev.filter((f: Quote) => identityKey(f) !== identityKey(quote))
            : [quote, ...prev],
        ),
      removeFavorite: (quote: Quote) =>
        setFavorites((prev: Quote[]) => prev.filter((f) => identityKey(f) !== identityKey(quote))),
    }),
    [favorites],
  );

  return createElement(FavoritesContext.Provider, { value }, children);
}

export const useFavorites = () => useContext(FavoritesContext);
