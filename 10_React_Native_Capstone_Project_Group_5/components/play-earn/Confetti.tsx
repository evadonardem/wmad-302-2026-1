/**
 * Play & Earn - a lightweight confetti burst built with the Animated API
 * (no extra dependency). Pieces fall, drift and fade when `active` turns true.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import { palette } from '@/constants/theme';
import { playStyles as styles } from './playEarnStyles';

const COLORS = [palette.gold, palette.rose, palette.success, palette.accent, '#FBF7FF', '#E5D9F7'];

const PIECES = Array.from({ length: 30 }, (_, i) => ({
    left: (i * 37) % 100,
    size: 5 + (i % 4) * 2,
    drift: ((i % 5) - 2) * 26,
    spin: 180 + (i % 6) * 90,
    color: COLORS[i % COLORS.length],
    delay: (i % 8) * 45,
}));

export function Confetti({ active }: { active: boolean }) {
    const values = useRef(PIECES.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        if (!active) return;
        values.forEach((value) => value.setValue(0));
        const animations = values.map((value, index) =>
            Animated.timing(value, {
                toValue: 1,
                duration: 900 + (index % 5) * 130,
                delay: PIECES[index].delay,
                easing: Easing.out(Easing.quad),
                useNativeDriver: Platform.OS !== 'web',
            })
        );
        Animated.parallel(animations).start();
    }, [active, values]);

    return (
        <View style={[styles.confettiWrap, { pointerEvents: 'none' }]}>
            {PIECES.map((piece, index) => {
                const value = values[index];
                return (
                    <Animated.View
                        key={index}
                        style={{
                            position: 'absolute',
                            left: `${piece.left}%`,
                            top: 0,
                            width: piece.size,
                            height: piece.size * 0.6,
                            borderRadius: 1.5,
                            backgroundColor: piece.color,
                            opacity: value.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
                            transform: [
                                { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [-8, 128] }) },
                                { translateX: value.interpolate({ inputRange: [0, 1], outputRange: [0, piece.drift] }) },
                                { rotate: value.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${piece.spin}deg`] }) },
                            ],
                        }}
                    />
                );
            })}
        </View>
    );
}
