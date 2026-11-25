/**
 * Providers - Root Context Providers (Paper, Auth, Cart & Wishlist)
 */
import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { PaperProvider } from 'react-native-paper';
import { theme } from '@/constants/theme';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </PaperProvider>
  );
}