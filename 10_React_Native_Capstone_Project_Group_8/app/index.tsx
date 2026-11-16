
/**
 * Root Index - Redirect users based on authentication status
 *
 * Authenticated users go to the Marketplace Home screen.
 * Logged-out users go to the Login screen.
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  // Wait until authentication status has been checked.
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#43A52F" />
      </View>
    );
  }

  // Send authenticated users to the Marketplace Home screen.
  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  // Send logged-out users to Login.
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
