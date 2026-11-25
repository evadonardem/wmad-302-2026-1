/**
 * Entry route ("/")
 * Waits for the saved session check, then opens the app or the login screen.
 * Without this file the app starts on Expo Router's "Unmatched Route" page.
 */
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return <Redirect href={isAuthenticated ? '/home' : '/login'} />;
}
