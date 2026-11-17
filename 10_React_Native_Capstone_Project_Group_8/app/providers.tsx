
/**
 * Application-wide Providers
 * Handles theme and authentication providers.
 */

import React, { type ReactNode } from 'react';
import { PaperProvider } from 'react-native-paper';

import { AuthProvider } from '@/context/AuthContext';
import {
  ThemeProvider,
  useAppTheme,
} from '@/context/ThemeContext';

function AppProviders({ children }: { children: ReactNode }) {
  const { theme } = useAppTheme();

  return (
    <PaperProvider theme={theme}>
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

