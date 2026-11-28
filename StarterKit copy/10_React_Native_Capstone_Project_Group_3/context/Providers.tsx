/**
 * Providers - All context providers wrapped here
 * (Lives outside app/ because every file in app/ is treated as a route.)
 */
import { ReactNode } from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@react-navigation/native';
import { SettingsProvider, useSettings } from './SettingsContext';
import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import { WishlistProvider } from './WishlistContext';
import { ActivityProvider } from './ActivityContext';
import { RewardsProvider } from './RewardsContext';
import { GiftListsProvider } from './GiftListsContext';

/** Applies the active palette to Paper components and React Navigation (headers, backgrounds). */
function ThemedProviders({ children }: { children: ReactNode }) {
  const { paperTheme, navigationTheme } = useSettings();
  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={navigationTheme}>{children}</ThemeProvider>
    </PaperProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <ThemedProviders>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <ActivityProvider>
                  <RewardsProvider>
                    <GiftListsProvider>{children}</GiftListsProvider>
                  </RewardsProvider>
                </ActivityProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ThemedProviders>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
