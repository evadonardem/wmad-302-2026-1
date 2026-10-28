import { useState } from 'react';
import { Stack } from 'expo-router';
import { FavoritesProvider } from '@/favorites';
import { ThemeModeProvider, ThemeProvider, createTheme, type ThemeMode } from '@/theme';

// TODO 13 [Dynamic Themes]: Complete the theme creation arrow function.
// It should accept a 'mode' string parameter ('light' or 'dark') and return
// a theme object configuration mapping that mode (see src/theme.tsx for the shape).
const theme = (mode: ThemeMode = 'light') => createTheme({
  palette: { mode },
});

export default function RootLayout() {
  // TODO 14 [State Management]: Initialize a boolean React state hook variable named 'isDarkMode' defaulting to false.
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    // TODO 16 [Theme Binding Layout]: Wrap the <Stack /> inside BOTH providers below:
    // a. <ThemeModeProvider value={{ isDarkMode, setIsDarkMode }}> so screens can read and flip the mode.
    // b. <ThemeProvider theme={...}> passing the calculated theme object. Configure it matching: it
    //    should resolve to 'dark' if 'isDarkMode' is true, otherwise 'light'
    //    (i.e. theme(isDarkMode ? 'dark' : 'light')).
    <FavoritesProvider>
      {/* [Your ThemeModeProvider + ThemeProvider wrapper structure here] */}
      <ThemeModeProvider value={{ isDarkMode, setIsDarkMode }}>
        <ThemeProvider theme={theme(isDarkMode ? 'dark' : 'light')}>
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      </ThemeModeProvider>
    </FavoritesProvider>
  );
}