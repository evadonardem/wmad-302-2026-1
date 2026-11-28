/**
 * Frosted-glass card: blurs the lively background behind it (expo-blur; CSS
 * backdrop-filter on web) under a translucent tint and a light border.
 */
import React, { ReactNode } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '@/context/SettingsContext';

export function GlassCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { palette, isDark } = useAppTheme();
  return (
    <View style={[styles.card, { borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.7)' }, style]}>
      <BlurView
        intensity={Platform.OS === 'android' ? 60 : 40}
        tint={isDark ? 'dark' : 'light'}
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      {/* Translucent tint keeps text readable where blur is not supported */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.surface, opacity: isDark ? 0.55 : 0.6 }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    padding: 16,
    marginBottom: 16,
  },
});
