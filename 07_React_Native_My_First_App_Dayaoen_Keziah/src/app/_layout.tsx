import { useState } from 'react';
import { Stack } from 'expo-router';
import { FavoritesProvider } from '@/favorites';
import { ThemeModeProvider, ThemeProvider, createTheme, type ThemeMode } from '@/theme';

// TODO 13: build a theme object for the given mode.
const theme = (mode: ThemeMode = 'light') => createTheme({
  palette: { mode },
});

export default function RootLayout() {
  // TODO 14: dark mode state, defaults to false.
  const [isDarkMode, setIsDarkMode] = useState(false);

  const appTheme = theme(isDarkMode ? 'dark' : 'light');

  return (
    // TODO 16: wrap the Stack in both theme providers.
    <FavoritesProvider>
      <ThemeModeProvider value={{ isDarkMode, setIsDarkMode }}>
        <ThemeProvider theme={appTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: appTheme.colors.background },
            }}
          />
        </ThemeProvider>
      </ThemeModeProvider>
    </FavoritesProvider>
  );
}
