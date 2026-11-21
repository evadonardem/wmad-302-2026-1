import { Stack } from 'expo-router';
import { useState } from 'react';
import { FavoritesProvider } from '@/favorites';
import { ThemeModeProvider, ThemeProvider, createTheme, type ThemeMode } from '@/theme';

const theme = (mode: ThemeMode = 'light') => createTheme({
  palette: { mode },
});

export default function RootLayout() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <FavoritesProvider>
      <ThemeModeProvider value={{ isDarkMode, setIsDarkMode }}>
        <ThemeProvider theme={theme(isDarkMode ? 'dark' : 'light')}>
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      </ThemeModeProvider>
    </FavoritesProvider>
  );
}
