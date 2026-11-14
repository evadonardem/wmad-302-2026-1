
/**
 * Root Index - Initial application route
 * Redirects users based on their authentication status.
 */

import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  // Wait until authentication has been checked.
  if (isLoading) {
    return null;
  }

  // Send authenticated users to the cookbook Home screen.
  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  // Send unauthenticated users to Login.
  return <Redirect href="/(auth)/login" />;
}
