/**
 * Themed screen background, three layers deep:
 *  1. big soft blobs in the theme's primary and accent colors (pink, yellow,
 *     green, sky blue in the default theme) that drift slowly,
 *  2. a wallpaper of the season's emoji (🎃🦇, ❄️⛄, 🌸🦋 …),
 *  3. the season's particles (confetti, snow, rain, leaves …) across the screen.
 * Place it as the first child of a screen root; it fills the parent and ignores
 * touches. Static under "Reduce Motion", hidden when turned off in Settings.
 */
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View, ViewStyle } from 'react-native';
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
import { useSettings } from '@/context/SettingsContext';
import { getParticleColors, SEASONS } from '@/constants/seasons';
import { SeasonParticles } from './SeasonParticles';

interface BlobProps {
  color: string;
  size: number;
  position: ViewStyle;
  opacity: number;
  duration: number;
  delay: number;
  dx: number;
  dy: number;
}

function Blob({ color, size, position, opacity, duration, delay, dx, dy }: BlobProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return undefined;
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
    return () => cancelAnimation(progress);
  }, [reduceMotion, delay, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * dx },
      { translateY: progress.value * dy },
      { scale: 1 + progress.value * 0.08 },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.blob,
        position,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity },
        animatedStyle,
      ]}
    >
      {/* A lighter core gives each blob a soft, gradient-like glow */}
      <View style={[styles.core, { borderRadius: size / 2, backgroundColor: color }]} />
    </Animated.View>
  );
}

const TILE_WIDTH = 104;
const TILE_HEIGHT = 120;

/** Static, staggered grid of the season's emoji. */
function Wallpaper({ motifs, width, height, opacity }: { motifs: string[]; width: number; height: number; opacity: number }) {
  const tiles = useMemo(() => {
    const columns = Math.ceil(width / TILE_WIDTH) + 1;
    const rows = Math.ceil(height / TILE_HEIGHT) + 1;
    return Array.from({ length: columns * rows }, (_, index) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      return {
        key: index,
        glyph: motifs[(row * 2 + column) % motifs.length],
        left: column * TILE_WIDTH + (row % 2 ? TILE_WIDTH / 2 : 0) - 24,
        top: row * TILE_HEIGHT + 12,
        rotate: `${(index % 3) * 14 - 14}deg`,
        size: 26 + ((row + column) % 3) * 6,
      };
    });
  }, [motifs, width, height]);

  return (
    <View style={[StyleSheet.absoluteFill, { opacity }]}>
      {tiles.map((tile) => (
        <Text
          key={tile.key}
          style={[styles.tile, { left: tile.left, top: tile.top, fontSize: tile.size, transform: [{ rotate: tile.rotate }] }]}
        >
          {tile.glyph}
        </Text>
      ))}
    </View>
  );
}

export function LivelyBackground({ particles = true }: { particles?: boolean }) {
  const { palette, settings, season } = useSettings();
  const { width, height } = useWindowDimensions();

  if (!settings.livelyBackground) return null;

  const info = SEASONS[season];
  const base = Math.min(width, 520);
  const opacity = palette.isDark ? 0.22 : 0.3;
  const [yellow, green, sky] = palette.accents;

  return (
    <View style={styles.container} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Blob color={palette.primary} size={base * 0.95} position={{ top: -base * 0.35, left: -base * 0.35 }} opacity={opacity} duration={9000} delay={0} dx={30} dy={24} />
      <Blob color={yellow} size={base * 0.7} position={{ top: height * 0.22, right: -base * 0.32 }} opacity={opacity + 0.06} duration={11000} delay={600} dx={-26} dy={30} />
      <Blob color={green} size={base * 0.75} position={{ bottom: -base * 0.25, left: -base * 0.28 }} opacity={opacity} duration={10000} delay={1200} dx={24} dy={-28} />
      <Blob color={sky} size={base * 0.6} position={{ bottom: height * 0.18, right: -base * 0.18 }} opacity={opacity + 0.04} duration={12000} delay={300} dx={-20} dy={-24} />
      <Blob color={palette.primary} size={base * 0.3} position={{ top: height * 0.5, left: width * 0.3 }} opacity={opacity * 0.6} duration={8000} delay={900} dx={18} dy={-16} />
      <Wallpaper motifs={info.motifs} width={width} height={height} opacity={palette.isDark ? 0.16 : 0.2} />
      {particles && <SeasonParticles spec={info.particles} colors={getParticleColors(season, palette)} count={12} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
  },
  core: {
    ...StyleSheet.absoluteFillObject,
    margin: '18%',
    opacity: 0.5,
  },
  tile: {
    position: 'absolute',
  },
});
