import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Quote } from '@/services/quoteService';

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
