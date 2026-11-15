/**
 * DecorBackground - soft colour blobs and food icons behind a screen,
 * so large empty areas don't look flat. Sits behind everything and ignores touches.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { IconName } from '@/components';
import { createStyles, useAppTheme } from '@/context/ThemeContext';

interface Doodle {
    icon: IconName;
    top: `${number}%`;
    left: `${number}%`;
    size: number;
    rotate: string;
    opacity?: number;
}

const DOODLES: Doodle[] = [
    { icon: 'food-croissant', top: '6%', left: '6%', size: 54, rotate: '-14deg' },
    { icon: 'pizza', top: '10%', left: '46%', size: 46, rotate: '12deg' },
    { icon: 'cupcake', top: '4%', left: '84%', size: 50, rotate: '10deg' },
    { icon: 'fruit-cherries', top: '26%', left: '93%', size: 44, rotate: '-10deg' },
    { icon: 'chef-hat', top: '34%', left: '3%', size: 60, rotate: '-8deg' },
    { icon: 'coffee', top: '48%', left: '90%', size: 48, rotate: '8deg' },
    { icon: 'bread-slice', top: '58%', left: '8%', size: 50, rotate: '14deg' },
    { icon: 'silverware-fork-knife', top: '70%', left: '50%', size: 52, rotate: '-12deg' },
    { icon: 'ice-cream', top: '78%', left: '88%', size: 54, rotate: '12deg' },
    { icon: 'carrot', top: '86%', left: '14%', size: 48, rotate: '-18deg' },
    { icon: 'cookie', top: '92%', left: '66%', size: 46, rotate: '8deg' },
    { icon: 'egg-fried', top: '20%', left: '24%', size: 40, rotate: '6deg' },
];

export function DecorBackground() {
    useAppTheme();
    return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View style={[styles.blob, styles.blobTop]} />
            <View style={[styles.blob, styles.blobMid]} />
            <View style={[styles.blob, styles.blobBottom]} />
            {DOODLES.map((d, i) => (
                <MaterialCommunityIcons
                    key={i}
                    name={d.icon}
                    size={d.size}
                    color="#E85D04"
                    style={{
                        position: 'absolute',
                        top: d.top,
                        left: d.left,
                        opacity: d.opacity ?? 0.14,
                        transform: [{ rotate: d.rotate }],
                    }}
                />
            ))}
        </View>
    );
}

const styles = createStyles({
    blob: { position: 'absolute', borderRadius: 999 },
    blobTop: { width: 460, height: 460, top: -200, right: -160, backgroundColor: '#FFE9CC', opacity: 1 },
    blobMid: { width: 340, height: 340, top: '40%', left: -230, backgroundColor: '#FFF3CC', opacity: 1 },
    blobBottom: { width: 420, height: 420, bottom: -230, right: '4%', backgroundColor: '#FFE3D3', opacity: 0.9 },
});