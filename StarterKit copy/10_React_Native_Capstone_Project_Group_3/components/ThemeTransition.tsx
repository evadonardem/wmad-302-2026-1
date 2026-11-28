/**
 * Theme-switch animation: when the season changes, a circle in the new theme
 * color ripples out from the center with the season's emoji, then fades away
 * to reveal the recolored app. Skipped under "Reduce Motion".
 */
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSettings } from '@/context/SettingsContext';
import { SEASONS } from '@/constants/seasons';

export function ThemeTransition() {
  const { season, palette, hydrated } = useSettings();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const previous = useRef<string | null>(null);
  const [active, setActive] = useState<{ color: string; emoji: string } | null>(null);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const emojiScale = useSharedValue(0);

  useEffect(() => {
    if (!hydrated) return;
    // The first season after loading settings is not a "switch"
    if (previous.current === null || previous.current === season || reduceMotion) {
      previous.current = season;
      return;
    }
    previous.current = season;
    setActive({ color: palette.primary, emoji: SEASONS[season].emoji });
    scale.value = 0;
    opacity.value = 1;
    emojiScale.value = 0;
    scale.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) });
    emojiScale.value = withSequence(withTiming(1.3, { duration: 300 }), withTiming(1, { duration: 150 }));
    opacity.value = withDelay(
      600,
      withTiming(0, { duration: 350 }, (finished) => {
        if (finished) runOnJS(setActive)(null);
      })
    );
  }, [season, hydrated, reduceMotion, palette.primary, scale, opacity, emojiScale]);

  // Big enough to cover the screen from the center
  const diameter = Math.hypot(width, height) * 1.05;

  const circleStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
  const emojiStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: emojiScale.value }] }));

  if (!active) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
      <Animated.View
        style={[
          { width: diameter, height: diameter, borderRadius: diameter / 2, backgroundColor: active.color },
          styles.circle,
          circleStyle,
        ]}
      />
      <Animated.Text style={[styles.emoji, emojiStyle]}>{active.emoji}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
  },
  emoji: {
    fontSize: 96,
  },
});
