/**
 * Providers - All context providers wrapped here
 */
import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { PaperProvider } from 'react-native-paper';
import { theme } from '@/constants/theme';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <FavoritesProvider>{children}</FavoritesProvider>
      </AuthProvider>
    </PaperProvider>
  );
}