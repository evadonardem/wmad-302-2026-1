/**
 * Spin & Win - animated prize wheel.
 *
 * The wheel is built from plain Views (no SVG dependency): a deep purple disc,
 * six coloured prize labels around the rim and divider lines. It rotates with
 * the Animated API and lands the winning segment under the gold pointer.
 */
import React, { useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, Text, View } from 'react-native';
import { SpinOutcome } from '@/types/rewards';
import { playStyles as styles } from './playEarnStyles';
import { WHEEL_SEGMENTS } from './spinData';

const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS.length;
const SPIN_TURNS = 5;
const DIVIDERS = [30, 90, 150];

interface SpinWheelProps {
    size: number;
    disabled?: boolean;
    /** Choose the prize. Return null to cancel (e.g. still cooling down). */
    onSpin: () => SpinOutcome | null;
    /** Called once the wheel has finished animating */
    onFinish: (outcome: SpinOutcome) => void;
    buttonLabel?: string;
    buttonSubLabel?: string;
}

export function SpinWheel({
    size,
    disabled = false,
    onSpin,
    onFinish,
    buttonLabel = 'SPIN',
    buttonSubLabel = 'FREE',
}: SpinWheelProps) {
    const rotation = useRef(new Animated.Value(0)).current;
    const currentRotation = useRef(0);
    const [spinning, setSpinning] = useState(false);

    const rotate = rotation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });

    const spin = () => {
        if (disabled || spinning) return;
        const outcome = onSpin();
        if (!outcome) return;

        setSpinning(true);

        // Land the centre of the winning segment under the top pointer
        const targetWithinTurn = 360 - outcome.index * SEGMENT_ANGLE;
        const base = currentRotation.current;
        const baseWithinTurn = ((base % 360) + 360) % 360;
        const delta = ((targetWithinTurn - baseWithinTurn) % 360 + 360) % 360;
        const finalRotation = base + SPIN_TURNS * 360 + delta;
        currentRotation.current = finalRotation;

        Animated.timing(rotation, {
            toValue: finalRotation,
            duration: 3800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
        }).start(() => {
            setSpinning(false);
            onFinish(outcome);
        });
    };

    const isDisabled = disabled || spinning;

    return (
        <View style={styles.wheelStage}>
            <View style={styles.pointer} />
            <Animated.View
                style={[styles.wheel, { width: size, height: size, borderRadius: size / 2, transform: [{ rotate }] }]}
            >
                <View style={styles.wheelRing} />
                {DIVIDERS.map((angle) => (
                    <View key={angle} style={[styles.wheelDivider, { transform: [{ rotate: `${angle}deg` }] }]} />
                ))}
                {WHEEL_SEGMENTS.map((segment, index) => (
                    <View
                        key={segment.label}
                        style={[styles.wheelLabelWrap, { transform: [{ rotate: `${index * SEGMENT_ANGLE}deg` }] }]}
                    >
                        <View
                            style={[
                                styles.wheelLabel,
                                { backgroundColor: segment.color, transform: [{ rotate: `${-index * SEGMENT_ANGLE}deg` }] },
                            ]}
                        >
                            <Text style={[styles.wheelLabelText, { color: segment.textColor }]} numberOfLines={1}>
                                {segment.label}
                            </Text>
                        </View>
                    </View>
                ))}
            </Animated.View>

            <View style={styles.wheelHub} />
            <Pressable
                style={[styles.spinBtn, isDisabled && styles.spinBtnDisabled]}
                onPress={spin}
                disabled={isDisabled}
                accessibilityRole="button"
                accessibilityLabel="Spin the prize wheel"
                accessibilityState={{ disabled: isDisabled }}
            >
                <Text style={styles.spinBtnText}>{spinning ? '···' : buttonLabel}</Text>
                <Text style={styles.spinBtnSub}>{spinning ? 'GOOD LUCK' : buttonSubLabel}</Text>
            </Pressable>
        </View>
    );
}
