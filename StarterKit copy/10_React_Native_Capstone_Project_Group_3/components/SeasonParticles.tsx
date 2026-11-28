/**
 * Seasonal particle overlay (Reanimated): confetti, snow, bubbles, rain or
 * emoji (petals, leaves, bats…). Fills its parent, ignores touches, and renders
 * nothing when the user has "Reduce Motion" enabled.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { ParticleSpec } from '@/constants/seasons';

interface ParticleConfig {
  x: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  spin: number;
  opacity: number;
  color: string;
  glyph?: string;
}

function Particle({ config, height, spec }: { config: ParticleConfig; height: number; spec: ParticleSpec }) {
  const progress = useSharedValue(0);
  const rise = !!spec.rise;
  const travel = height + config.size * 2 + 24;

  useEffect(() => {
    progress.value = withDelay(
      config.delay,
      withRepeat(withTiming(1, { duration: config.duration, easing: Easing.linear }), -1, false)
    );
    return () => cancelAnimation(progress);
  }, [config, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const offset = progress.value * travel;
    return {
      transform: [
        { translateY: rise ? height + 12 - offset : -config.size - 12 + offset },
        { translateX: Math.sin(progress.value * Math.PI * 4) * config.drift },
        { rotate: `${progress.value * config.spin}deg` },
      ],
    };
  });

  if (spec.kind === 'emoji') {
    return (
      <Animated.View style={[styles.particle, { left: config.x, opacity: config.opacity }, animatedStyle]}>
        <Text style={{ fontSize: config.size }}>{config.glyph}</Text>
      </Animated.View>
    );
  }

  const shape =
    spec.kind === 'rain'
      ? { width: 2, height: config.size, borderRadius: 1 }
      : spec.kind === 'confetti'
        ? { width: config.size, height: config.size * 0.6, borderRadius: 2 }
        : { width: config.size, height: config.size, borderRadius: config.size / 2 };

  return (
    <Animated.View
      style={[
        styles.particle,
        shape,
        spec.kind === 'bubbles'
          ? { borderWidth: 1.5, borderColor: config.color, backgroundColor: 'transparent' }
          : { backgroundColor: config.color },
        { left: config.x, opacity: config.opacity },
        animatedStyle,
      ]}
    />
  );
}

/** Size, speed and wobble ranges per particle kind. */
function makeConfig(spec: ParticleSpec, width: number, colors: string[], index: number): ParticleConfig {
  const pick = <T,>(list: T[]) => list[index % list.length];
  const base = {
    x: Math.random() * Math.max(width - 16, 1),
    delay: Math.random() * 4000,
    color: pick(colors),
    glyph: spec.glyphs ? pick(spec.glyphs) : undefined,
  };
  switch (spec.kind) {
    case 'rain':
      return { ...base, size: 10 + Math.random() * 10, duration: 900 + Math.random() * 700, drift: 0, spin: 0, opacity: 0.35 + Math.random() * 0.35, delay: Math.random() * 1500 };
    case 'confetti':
      return { ...base, size: 6 + Math.random() * 4, duration: 6000 + Math.random() * 5000, drift: 6 + Math.random() * 10, spin: 360 + Math.random() * 360, opacity: 0.75 + Math.random() * 0.25 };
    case 'bubbles':
      return { ...base, size: 5 + Math.random() * 8, duration: 6000 + Math.random() * 5000, drift: 4 + Math.random() * 8, spin: 0, opacity: 0.45 + Math.random() * 0.4 };
    case 'emoji':
      return { ...base, size: 12 + Math.random() * 8, duration: 7000 + Math.random() * 6000, drift: 8 + Math.random() * 14, spin: -90 + Math.random() * 180, opacity: 0.7 + Math.random() * 0.3 };
    case 'snow':
    default:
      return { ...base, size: 3 + Math.random() * 4, duration: 5000 + Math.random() * 5000, drift: 4 + Math.random() * 8, spin: 0, opacity: 0.5 + Math.random() * 0.5 };
  }
}

interface SeasonParticlesProps {
  spec: ParticleSpec;
  /** Colors cycled across dot-style particles (ignored for emoji). */
  colors: string[];
  count?: number;
}

export function SeasonParticles({ spec, colors, count = 16 }: SeasonParticlesProps) {
  const reduceMotion = useReducedMotion();
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const colorKey = colors.join(',');
  const total = spec.kind === 'rain' ? count + 8 : count;

  const particles = useMemo<ParticleConfig[]>(
    () => Array.from({ length: total }, (_, index) => makeConfig(spec, layout.width, colorKey.split(','), index)),
    [total, spec, layout.width, colorKey]
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== layout.width || height !== layout.height) setLayout({ width, height });
  };

  if (reduceMotion) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={onLayout}>
      {layout.width > 0 &&
        particles.map((config, index) => (
          <Particle key={index} config={config} height={layout.height} spec={spec} />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
  },
});
