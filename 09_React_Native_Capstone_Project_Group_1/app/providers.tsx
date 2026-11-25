
/**
 * Providers - All context providers wrapped here
 */
import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider, useThemeMode } from '@/context/ThemeContext';
import {
  PaperProvider,
  MD3DarkTheme,
} from 'react-native-paper';
import { theme } from '@/constants/theme';

function AppProviders({ children }: { children: ReactNode }) {
  const { isDark } = useThemeMode();

  const activeTheme = isDark
    ? {
        ...MD3DarkTheme,
        colors: {
          ...MD3DarkTheme.colors,
          primary: '#78C6A3',
          secondary: '#A7D8A3',
          background: '#101C18',
          surface: '#1B2B24',
          surfaceVariant: '#293B32',
          onSurface: '#F3F7F2',
          onBackground: '#F3F7F2',
          outline: '#52675B',
        },
      }
    : theme;

  return (
    <PaperProvider theme={activeTheme}>
      <AuthProvider>{children}</AuthProvider>
    </PaperProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AppProviders>{children}</AppProviders>
    </ThemeProvider>
  );
}
