/**
 * Root Index Entry - Redirects "/" to Authenticated Home or Login after Session Hydration
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { ActivityIndicator, Text, Surface, useTheme } from 'react-native-paper';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function IndexScreen() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const { width } = useWindowDimensions();
  const paperTheme = useTheme();

  const responsiveStyles = useMemo(() => {
    const isDesktop = width >= 1024;
    const isTablet = !isDesktop && width >= 768;
    const isCompactPhone = width <= 375;

    return StyleSheet.create({
      container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: isDesktop ? 32 : isTablet ? 24 : 16,
      },
      card: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: isDesktop ? 32 : isTablet ? 28 : 24,
        paddingHorizontal: isDesktop ? 40 : isTablet ? 32 : 24,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        width: '100%',
        maxWidth: isDesktop ? 380 : isTablet ? 360 : 320,
      },
      text: {
        marginTop: 14,
        fontSize: isDesktop ? 16 : isTablet ? 15 : isCompactPhone ? 13 : 14,
        color: '#64748B',
        fontWeight: '600',
        textAlign: 'center',
      },
    });
  }, [width]);

  if (isLoadingAuth) {
    return (
      <View style={responsiveStyles.container}>
        <Surface style={responsiveStyles.card} elevation={1}>
          <ActivityIndicator
            size={width >= 768 ? 'large' : 36}
            color={paperTheme.colors.primary || '#1D63ED'}
          />
          <Text style={responsiveStyles.text}>Restoring session...</Text>
        </Surface>
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href={'/(app)/(tabs)/home' as any} />;
  }

  return <Redirect href={'/(auth)/login' as any} />;
}