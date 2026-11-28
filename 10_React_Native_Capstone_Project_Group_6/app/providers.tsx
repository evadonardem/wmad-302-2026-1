/**
 * Providers - All context providers wrapped here
 */
import type { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { AppThemeProvider } from '@/context/ThemeContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { SnackbarProvider } from '@/components/SnackbarProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <SnackbarProvider>{children}</SnackbarProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}