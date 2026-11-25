/**
 * Providers - All context providers wrapped here
 *
 * AppThemeProvider decides light/dark, then the same colors are given to
 * React Native Paper (components), React Navigation (headers, tab bar,
 * screen backgrounds) and the status bar.
 */
import { ReactNode, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { AuthProvider } from '@/context/AuthContext';
import { CookbookProvider } from '@/context/CookbookContext';
import { AppThemeProvider, useThemePreference } from '@/context/ThemeContext';

function ThemedProviders({ children }: { children: ReactNode }) {
  const { theme, isDark } = useThemePreference();

  const navigationTheme = useMemo(() => {
    const base = isDark ? NavigationDarkTheme : NavigationLightTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.onSurface,
        border: theme.colors.outlineVariant,
        notification: theme.colors.error,
      },
    };
  }, [theme, isDark]);

  return (
    <PaperProvider theme={theme}>
      <NavigationThemeProvider value={navigationTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AuthProvider>
          <CookbookProvider>{children}</CookbookProvider>
        </AuthProvider>
      </NavigationThemeProvider>
    </PaperProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppThemeProvider>
      <ThemedProviders>{children}</ThemedProviders>
    </AppThemeProvider>
  );
}
