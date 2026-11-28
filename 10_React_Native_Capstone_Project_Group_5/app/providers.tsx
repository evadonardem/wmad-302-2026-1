/**
 * Providers - All context providers wrapped here
 * Settings sit outermost: the chosen theme decides the Paper theme and palette.
 * Only the UI subtree is remounted (key) on theme change so screens pick up new colors,
 * while auth/cart/rewards/wishlist state is preserved.
 */
import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { RewardsProvider } from '@/context/RewardsContext';
import { SettingsProvider, useSettings } from '@/context/SettingsContext';
import { PaperProvider } from 'react-native-paper';
import { buildTheme } from '@/constants/theme';

function ThemedPaper({ children }: { children: ReactNode }) {
  const { resolvedMode } = useSettings();
  return (
    <PaperProvider key={resolvedMode} theme={buildTheme(resolvedMode)}>
      {children}
    </PaperProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <AuthProvider>
        <RewardsProvider>
          <CartProvider>
            <WishlistProvider>
              <ThemedPaper>{children}</ThemedPaper>
            </WishlistProvider>
          </CartProvider>
        </RewardsProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}