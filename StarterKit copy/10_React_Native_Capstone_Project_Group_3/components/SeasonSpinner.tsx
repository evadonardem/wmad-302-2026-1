/**
 * Loading indicator in the season's shape: a spinning ❄️ / 🎃 / ☀️ … with a
 * gentle bounce. Falls back to the regular spinner under "Reduce Motion".
 */
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '@/context/SettingsContext';
import { SEASONS } from '@/constants/seasons';

export function SeasonSpinner({ size = 'small' }: { size?: 'small' | 'large' }) {
  const { palette, season } = useAppTheme();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return undefined;
    progress.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(progress);
  }, [reduceMotion, progress]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${progress.value * 360}deg` },
      { scale: 1 + Math.sin(progress.value * Math.PI * 2) * 0.12 },
    ],
  }));

  if (reduceMotion) return <ActivityIndicator size={size} color={palette.primary} />;

  return (
    <Animated.View style={style} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <Text style={[styles.glyph, { fontSize: size === 'large' ? 40 : 24 }]}>{SEASONS[season].emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glyph: {
    textAlign: 'center',
  },
});
