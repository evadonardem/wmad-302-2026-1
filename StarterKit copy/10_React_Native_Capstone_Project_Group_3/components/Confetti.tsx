/**
 * One-shot confetti burst (Reanimated) for celebrations such as a placed order.
 * Skipped entirely when "Reduce Motion" is enabled.
 */
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

interface PieceConfig {
  x: number;
  delay: number;
  duration: number;
  rotation: number;
  sway: number;
  color: string;
  width: number;
  height: number;
}

function Piece({ config, fallDistance }: { config: PieceConfig; fallDistance: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      config.delay,
      withTiming(1, { duration: config.duration, easing: Easing.out(Easing.quad) })
    );
  }, [config, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value < 0.85 ? 1 : (1 - progress.value) / 0.15,
    transform: [
      { translateY: -20 + progress.value * fallDistance },
      { translateX: Math.sin(progress.value * Math.PI * 3) * config.sway },
      { rotate: `${progress.value * config.rotation}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        { left: config.x, width: config.width, height: config.height, backgroundColor: config.color },
        animatedStyle,
      ]}
    />
  );
}

export function Confetti({ colors, count = 40 }: { colors: string[]; count?: number }) {
  const reduceMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();

  const pieces = useMemo<PieceConfig[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        delay: Math.random() * 400,
        duration: 1800 + Math.random() * 1400,
        rotation: 360 + Math.random() * 720,
        sway: 10 + Math.random() * 30,
        color: colors[i % colors.length],
        width: 6 + Math.random() * 6,
        height: 10 + Math.random() * 8,
      })),
    [colors, count, width]
  );

  if (reduceMotion) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((config, index) => (
        <Piece key={index} config={config} fallDistance={height * 0.9} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
  },
});
