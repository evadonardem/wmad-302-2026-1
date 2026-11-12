
import { ReactNode } from 'react';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider, useSettings } from '@/context/SettingsContext';
import { lightTheme, darkTheme } from '@/constants/theme';

function ThemedProviders({ children }: { children: ReactNode }) {
  const { isDarkMode, isSettingsLoaded } = useSettings();

  // Avoid briefly displaying the wrong theme while settings load.
  if (!isSettingsLoaded) {
    return null;
  }

  return (
    <PaperProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <AuthProvider>{children}</AuthProvider>
    </PaperProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <ThemedProviders>{children}</ThemedProviders>
    </SettingsProvider>
  );
}
