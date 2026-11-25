/**
 * Providers - All context providers wrapped here
 */
import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { PaperProvider } from 'react-native-paper';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ThemedProviders>{children}</ThemedProviders>
    </ThemeProvider>
  );
}

function ThemedProviders({ children }: { children: ReactNode }) {
  const { paperTheme } = useAppTheme();

  return (
    <PaperProvider theme={paperTheme}>
      <AuthProvider>{children}</AuthProvider>
    </PaperProvider>
  );
}