import { FavoritesProvider } from '@/favorites';
import { ThemeModeProvider, ThemeProvider, createTheme } from '@/theme';
import { Stack } from 'expo-router';
import React, { useState } from 'react';

export default function RootLayout() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  
  const currentTheme = createTheme({
    palette: { mode: isDarkMode ? 'dark' : 'light' },
  });

  return (
    <FavoritesProvider>
      <ThemeModeProvider value={{ isDarkMode, setIsDarkMode }}>
        {}
        <ThemeProvider key={isDarkMode ? 'dark' : 'light'} theme={currentTheme}>
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      </ThemeModeProvider>
    </FavoritesProvider>
  );
}