
import { ReactNode, useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';

import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider, useSettings } from '@/context/SettingsContext';
import { lightTheme, darkTheme } from '@/constants/theme';

function ThemedProviders({ children }: { children: ReactNode }) {
  const { isDarkMode, isSettingsLoaded } = useSettings();

  // Hide the splash screen after settings have finished loading.
  useEffect(() => {
    if (isSettingsLoaded) {
      SplashScreen.hideAsync().catch((error) => {
        console.warn('Unable to hide splash screen:', error);
      });
    }
  }, [isSettingsLoaded]);

  // Avoid displaying the wrong theme while settings load.
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
