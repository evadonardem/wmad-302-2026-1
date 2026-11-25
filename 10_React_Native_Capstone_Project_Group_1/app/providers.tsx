/**
 * Providers - All context providers wrapped here
 */
import React, { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { AppThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';

function ThemedPaperWrapper({ children }: { children: ReactNode }) {
  const { paperTheme } = useAppTheme();

  return (
    <PaperProvider theme={paperTheme}>
      <AuthProvider>{children}</AuthProvider>
    </PaperProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <ThemedPaperWrapper>{children}</ThemedPaperWrapper>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}