/**
 * Root index - entry route for "/"
 * Redirects into the protected app. (app)/_layout.tsx sends
 * unauthenticated users on to /(auth)/login.
 */
import { Redirect } from 'expo-router';

export default function Index() {
    return <Redirect href="/(app)/(tabs)/home" />;
}