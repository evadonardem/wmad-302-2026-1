import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function IndexRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <Redirect
      href={isAuthenticated ? '/(app)/(tabs)/home' : '/(auth)/login'}
    />
  );
}
