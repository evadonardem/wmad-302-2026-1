import { useState } from 'react';
import { Stack } from 'expo-router';
import { FavoritesProvider } from '@/favorites';
import { ThemeModeProvider, ThemeProvider, createTheme, type ThemeMode } from '@/theme';

// TODO 13
const theme = (mode: ThemeMode = 'light') => createTheme({
  palette: {
    mode,
  },
});

export default function RootLayout() {
  // TODO 14
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    // TODO 16
    <FavoritesProvider>
      <ThemeModeProvider value={{ isDarkMode, setIsDarkMode }}>
        <ThemeProvider theme={theme(isDarkMode ? 'dark' : 'light')}>
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      </ThemeModeProvider>
    </FavoritesProvider>
  );
}