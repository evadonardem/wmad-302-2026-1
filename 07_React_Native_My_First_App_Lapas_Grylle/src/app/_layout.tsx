import React, { createContext, useState } from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from '../theme';
import { Quote } from '../services/quoteService';

export const FavoritesContext = createContext<{
  favorites: Quote[];
  addFavorite: (quote: Quote) => void;
}>({
  favorites: [],
  addFavorite: () => {},
});

export default function RootLayout() {
  const [favorites, setFavorites] = useState<Quote[]>([]);

  const addFavorite = (quote: Quote) => {
    if (!favorites.some((fav) => fav._id === quote._id)) {
      setFavorites((prev) => [...prev, quote]);
    }
  };

  return (
    <ThemeProvider>
      <FavoritesContext.Provider value={{ favorites, addFavorite }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </FavoritesContext.Provider>
    </ThemeProvider>
  );
}