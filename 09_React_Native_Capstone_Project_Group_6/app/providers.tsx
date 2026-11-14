/**
 * Providers - All context providers wrapped here
 */
import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { PaperProvider } from 'react-native-paper';
import { darkTheme, theme } from '@/constants/theme';
import { SettingsProvider, useSettings } from '@/context/SettingsContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <ThemedProviders>{children}</ThemedProviders>
    </SettingsProvider>
  );
}

function ThemedProviders({ children }: { children: ReactNode }) {
  const { darkMode } = useSettings();
  return (
    <PaperProvider theme={darkMode ? darkTheme : theme}>
      <AuthProvider>
        <FavoritesProvider>{children}</FavoritesProvider>
      </AuthProvider>
    </PaperProvider>
  );
}