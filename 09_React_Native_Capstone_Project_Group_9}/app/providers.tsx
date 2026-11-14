/**
 * Providers - All context providers wrapped here
 */
import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { PaperProvider } from 'react-native-paper';
import { AppThemeProvider, useAppTheme } from '@/context/AppThemeContext';
import { darkTheme, lightTheme } from '@/constants/theme';

function ThemedProviders({ children }: { children: ReactNode }) {
  const { isDark } = useAppTheme();
  return (
    <PaperProvider theme={isDark ? darkTheme : lightTheme}>
      <AuthProvider>{children}</AuthProvider>
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
