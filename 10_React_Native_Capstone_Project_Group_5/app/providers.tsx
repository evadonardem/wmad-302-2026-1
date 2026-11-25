/**
 * Providers - All context providers wrapped here
 * Settings sit outermost: the chosen theme decides the Paper theme and the palette, and the
 * subtree is remounted (key) when the theme changes so every screen picks up the new colors.
 */
import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { SettingsProvider, useSettings } from '@/context/SettingsContext';
import { PaperProvider } from 'react-native-paper';
import { buildTheme } from '@/constants/theme';

function ThemedApp({ children }: { children: ReactNode }) {
  const { resolvedMode } = useSettings();
  return (
    <PaperProvider key={resolvedMode} theme={buildTheme(resolvedMode)}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>{children}</WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </PaperProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <ThemedApp>{children}</ThemedApp>
    </SettingsProvider>
  );
}