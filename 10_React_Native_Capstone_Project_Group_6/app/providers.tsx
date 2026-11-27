/**
 * Providers - All context providers wrapped here
 */
import type { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { PaperProvider } from 'react-native-paper';
import { SnackbarProvider } from '@/components/SnackbarProvider';
import { theme } from '@/constants/theme';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <SnackbarProvider>{children}</SnackbarProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </PaperProvider>
  );
}