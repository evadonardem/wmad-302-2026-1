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
 * Dark twin of your constants/theme: same fonts and roundness, same orange / brown / green accents,
 * with the surfaces and text swapped for warm dark colours.
 */
const darkTheme = {
  ...MD3DarkTheme,
  roundness: theme.roundness,
  fonts: theme.fonts,
  colors: {
    ...MD3DarkTheme.colors,
    primary: theme.colors.primary, // warm orange
    onPrimary: '#FFFFFF',
    primaryContainer: '#4A2A14',
    onPrimaryContainer: '#FFDBC7',
    secondary: '#D7B9A8', // brown, lightened to read on dark
    onSecondary: '#2B2320',
    secondaryContainer: '#3B2F2A',
    onSecondaryContainer: '#EFE0D6',
    tertiary: '#81C784', // green (fresh ingredients)
    onTertiary: '#0F2A12',
    tertiaryContainer: '#1F3A22',
    onTertiaryContainer: '#C8E6C9',
    background: '#14100E',
    onBackground: '#F1E6DA',
    surface: '#231D1A',
    onSurface: '#F1E6DA',
    surfaceVariant: '#332A26',
    onSurfaceVariant: '#C4AC9D',
    error: '#EF5350',
    errorContainer: '#3A1F1F',
    outline: '#6B5A50',
    outlineVariant: '#3B302A',
    elevation: {
      level0: 'transparent',
      level1: '#1E1815',
      level2: '#261F1B',
      level3: '#2C2420',
      level4: '#30272B',
      level5: '#352C28',
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