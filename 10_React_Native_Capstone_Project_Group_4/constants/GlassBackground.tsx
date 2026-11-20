import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GLASS_PALETTE } from '@/constants/glassTheme';

interface GlassBackgroundProps {
  children: React.ReactNode;
}

export function GlassBackground({ children }: GlassBackgroundProps) {
  return (
    <View style={styles.container}>
      {/* Ambient Soft Light Orbs */}
      <View pointerEvents="none" style={styles.orbLayer}>
        <View style={styles.orbTopLeft} />
        <View style={styles.orbTopRight} />
        <View style={styles.orbBottomCenter} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GLASS_PALETTE.canvasBg,
    position: 'relative',
  },
  orbLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orbTopLeft: {
    position: 'absolute',
    top: -90,
    left: -70,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: GLASS_PALETTE.orbAmber,
  },
  orbTopRight: {
    position: 'absolute',
    top: 120,
    right: -80,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: GLASS_PALETTE.orbSky,
  },
  orbBottomCenter: {
    position: 'absolute',
    bottom: -100,
    left: '28%',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: GLASS_PALETTE.orbMint,
  },
});