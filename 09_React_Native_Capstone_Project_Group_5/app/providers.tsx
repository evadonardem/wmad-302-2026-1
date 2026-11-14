/**
 * Providers - All context providers wrapped here
 */
import { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MD3DarkTheme, PaperProvider } from 'react-native-paper';
import { AuthProvider } from '@/context/AuthContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { theme } from '@/constants/theme';

/**
 * Dark twin of your constants/theme: same fonts and roundness, same berry / plum / green accents,
 * with the surfaces and text swapped for warm dark colours.
 */
const darkTheme = {
  ...MD3DarkTheme,
  roundness: theme.roundness,
  fonts: theme.fonts,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#FF6F9F', // lighter berry pink so labels, switches and links read clearly on dark
    onPrimary: '#3B0A1D',
    primaryContainer: '#461829',
    onPrimaryContainer: '#FBCBDD',
    secondary: '#D3ACBA', // brown, lightened to read on dark
    onSecondary: '#2A2124',
    secondaryContainer: '#3A2B31',
    onSecondaryContainer: '#EDD8E0',
    tertiary: '#81C784', // green (fresh ingredients)
    onTertiary: '#0F2A12',
    tertiaryContainer: '#1F3A22',
    onTertiaryContainer: '#C8E6C9',
    background: '#140E10',
    onBackground: '#EFDCE3',
    surface: '#221B1D',
    onSurface: '#EFDCE3',
    surfaceVariant: '#32272B',
    onSurfaceVariant: '#C1A0AC',
    error: '#EF5350',
    errorContainer: '#3A1F1F',
    outline: '#69525A',
    outlineVariant: '#3A2B31',
    elevation: {
      level0: 'transparent',
      level1: '#1D1618',
      level2: '#251C1F',
      level3: '#2B2125',
      level4: '#30272B',
      level5: '#34292D',
    },
  },
};

/** Picks the light theme (from constants/theme) or the dark one. */
function ThemedPaper({ children }: { children: ReactNode }) {
  const { dark } = useAppTheme();
  return <PaperProvider theme={dark ? darkTheme : theme}>{children}</PaperProvider>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedPaper>
          <AuthProvider>
            <FavoritesProvider>{children}</FavoritesProvider>
          </AuthProvider>
        </ThemedPaper>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}