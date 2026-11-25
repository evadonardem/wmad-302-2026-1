/**
 * ScreenBackground / Screen - the soft lavender background design behind every page
 * Large blurred-looking circles, a white glow, little four-point sparkles and faint flowers.
 * It is decoration only: it never blocks touches and it follows the light / dark palette.
 */
import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette, themed, withAlpha, NO_TOUCH } from '@/constants/theme';

interface Sparkle {
    top?: number | `${number}%`;
    bottom?: number | `${number}%`;
    left?: number | `${number}%`;
    right?: number | `${number}%`;
    size: number;
    opacity: number;
}

const SPARKLES: Sparkle[] = [
    { top: 78, left: 22, size: 34, opacity: 0.55 },
    { top: 40, left: 64, size: 14, opacity: 0.5 },
    { top: 150, left: 12, size: 12, opacity: 0.45 },
    { top: 64, right: 44, size: 20, opacity: 0.45 },
    { top: '38%', right: 22, size: 26, opacity: 0.4 },
    { top: '52%', left: 18, size: 16, opacity: 0.4 },
    { bottom: 190, right: 40, size: 30, opacity: 0.45 },
    { bottom: 120, left: '30%', size: 14, opacity: 0.4 },
];

export function ScreenBackground() {
    return (
        <View style={[styles.layer, NO_TOUCH]}>
            <View style={[styles.blob, styles.blobA, { backgroundColor: withAlpha(palette.beige, 0.75) }]} />
            <View style={[styles.blob, styles.blobB, { backgroundColor: withAlpha(palette.sand, 0.9) }]} />
            <View style={[styles.blob, styles.blobC, { backgroundColor: withAlpha(palette.beige, 0.55) }]} />
            <View style={[styles.blob, styles.glow, { backgroundColor: withAlpha(palette.surface, 0.55) }]} />
            <MaterialCommunityIcons name="flower-tulip-outline" size={150} color={withAlpha(palette.rose, 0.16)} style={styles.flowerTop} />
            <MaterialCommunityIcons name="flower-outline" size={130} color={withAlpha(palette.rose, 0.14)} style={styles.flowerBottom} />
            {SPARKLES.map((sp, i) => (
                <MaterialCommunityIcons
                    key={i}
                    name="star-four-points"
                    size={sp.size}
                    color={withAlpha(palette.rose, sp.opacity)}
                    style={{ position: 'absolute', top: sp.top, bottom: sp.bottom, left: sp.left, right: sp.right }}
                />
            ))}
        </View>
    );
}

/** Screen root: lavender page color + the background design, then the page content on top */
export function Screen({ children }: { children: ReactNode }) {
    return (
        <View style={styles.root}>
            <ScreenBackground />
            {children}
        </View>
    );
}

const styles = themed(() =>
    StyleSheet.create({
        root: { flex: 1, backgroundColor: palette.ivory, overflow: 'hidden' },
        layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
        blob: { position: 'absolute', borderRadius: 9999 },
        blobA: { top: -170, left: -140, width: 460, height: 460 },
        blobB: { top: 260, right: -220, width: 520, height: 520 },
        blobC: { bottom: -230, left: -120, width: 560, height: 560 },
        glow: { top: 90, left: '30%', width: 320, height: 320 },
        flowerTop: { position: 'absolute', top: -20, right: -30, transform: [{ rotate: '18deg' }] },
        flowerBottom: { position: 'absolute', bottom: 90, left: -36, transform: [{ rotate: '-14deg' }] },
    })
);