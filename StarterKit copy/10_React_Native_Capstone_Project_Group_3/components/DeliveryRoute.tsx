/**
 * Illustrated delivery route (not a real map): store → packing → on the road →
 * your door, with the truck moving along the dashed road to the current stage
 * and bobbing while the order is on its way. Simulated like the order timeline.
 */
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '@/context/SettingsContext';
import { getOrderStage, ORDER_STAGES } from '@/utils/orders';
import type { Order } from '@/types/account';

const STOPS = [
  { emoji: '🏬', label: 'Store' },
  { emoji: '📦', label: 'Packed' },
  { emoji: '🛣️', label: 'On the way' },
  { emoji: '🏠', label: 'Your door' },
];

export function DeliveryRoute({ order }: { order: Order }) {
  const { palette } = useAppTheme();
  const reduceMotion = useReducedMotion();
  const stageIndex = ORDER_STAGES.indexOf(getOrderStage(order));
  const progress = stageIndex / (ORDER_STAGES.length - 1);
  const position = useSharedValue(0);
  const bob = useSharedValue(0);
  const moving = stageIndex > 0 && stageIndex < ORDER_STAGES.length - 1;

  useEffect(() => {
    position.value = reduceMotion ? progress : withTiming(progress, { duration: 1200 });
    if (moving && !reduceMotion) {
      bob.value = withRepeat(withSequence(withTiming(-3, { duration: 300 }), withTiming(0, { duration: 300 })), -1, false);
    }
    return () => cancelAnimation(bob);
  }, [progress, moving, reduceMotion, position, bob]);

  const truckStyle = useAnimatedStyle(() => ({
    left: `${position.value * 100}%`,
    transform: [{ translateX: -16 }, { translateY: bob.value }],
  }));
  const fillStyle = useAnimatedStyle(() => ({ width: `${position.value * 100}%` }));

  return (
    <View accessibilityLabel={`Delivery progress: ${STOPS[stageIndex].label}`}>
      <View style={styles.track}>
        <View style={[styles.road, { borderColor: palette.border }]} />
        <Animated.View style={[styles.roadFill, { backgroundColor: palette.primary }, fillStyle]} />
        <Animated.Text style={[styles.truck, truckStyle]}>{stageIndex === ORDER_STAGES.length - 1 ? '🎉' : '🚚'}</Animated.Text>
      </View>
      <View style={styles.stops}>
        {STOPS.map((stop, index) => (
          <View key={stop.label} style={styles.stop}>
            <Text style={[styles.stopEmoji, index > stageIndex && styles.future]}>{stop.emoji}</Text>
            <Text
              style={[
                styles.stopLabel,
                { color: index <= stageIndex ? palette.primary : palette.textMuted },
                index === stageIndex && styles.current,
              ]}
            >
              {stop.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 40,
    marginHorizontal: 18,
    justifyContent: 'center',
  },
  road: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 3,
    borderStyle: 'dashed',
  },
  roadFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
  },
  truck: {
    position: 'absolute',
    fontSize: 28,
    top: 0,
  },
  stops: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  stop: {
    alignItems: 'center',
    width: 72,
  },
  stopEmoji: {
    fontSize: 24,
  },
  future: {
    opacity: 0.35,
  },
  stopLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  current: {
    fontWeight: '900',
  },
});
