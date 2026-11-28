/**
 * Entry route "/" - first launch goes to onboarding, then to the shop or login
 */
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const { settings, hydrated } = useSettings();

  // The splash screen stays visible while the session and settings are being restored
  if (isLoading || !hydrated) return null;

  if (!settings.onboarded) return <Redirect href="/onboarding" />;

  return <Redirect href={isAuthenticated ? '/home' : '/login'} />;
}
