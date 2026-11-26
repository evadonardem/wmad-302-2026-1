/**
 * useAnimatedCard - the motion shared by the category collage and banner carousel
 *
 * Three layered animations so they never fight over the same transform:
 *   1. entrance: fade in, rise and settle (staggered by `index`)
 *   2. float:    a slow, offset vertical drift so the collage feels alive
 *   3. hover:    lift, straighten the resting tilt and scale up
 * Press adds a soft squish on top of the hover scale.
 *
 * The hook also reports `active` (hovered or pressed) so a card can swap in a
 * stronger shadow without animating the shadow itself.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform } from 'react-native';

// react-native-web has no native animated module, so drive the animation with JS there
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export interface AnimatedCardOptions {
  /** Position in the group; drives the staggered entrance */
  index?: number;
  /** Delay added per index, in ms */
  stagger?: number;
  /** Slow floating loop */
  float?: boolean;
  /** How far the card drifts, in px */
  floatDistance?: number;
  /** One direction of the float loop, in ms */
  floatDuration?: number;
  /** Tilt at rest (the card straightens when hovered) */
  restRotation?: number;
  /** Scale on hover */
  hoverScale?: number;
  /** Scale while pressed */
  pressScale?: number;
  /** How far the card lifts on hover, in px */
  lift?: number;
}

export function useAnimatedCard({
  index = 0,
  stagger = 70,
  float = true,
  floatDistance = 6,
  floatDuration = 3600,
  restRotation = 0,
  hoverScale = 1.045,
  pressScale = 0.97,
  lift = 8,
}: AnimatedCardOptions = {}) {
  const entrance = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const hover = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(0)).current;
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  // Staggered entrance: fade + rise + a tiny settle
  useEffect(() => {
    const animation = Animated.timing(entrance, {
      toValue: 1,
      duration: 520,
      delay: Math.min(index, 10) * stagger,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [entrance, index, stagger]);

  // Gentle float: each card starts at a different point in the loop
  useEffect(() => {
    if (!float) return undefined;
    drift.setValue((index % 4) / 4);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: floatDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: floatDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    );
    const timer = setTimeout(() => loop.start(), (index % 4) * 180);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [drift, float, floatDistance, floatDuration, index]);

  const animateHover = (toValue: number) => {
    Animated.timing(hover, {
      toValue,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  };

  const animatePress = (toValue: number) => {
    Animated.spring(press, {
      toValue,
      speed: 30,
      bounciness: 0,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  };

  const handlers = {
    onHoverIn: () => {
      setHovered(true);
      animateHover(1);
    },
    onHoverOut: () => {
      setHovered(false);
      animateHover(0);
    },
    onPressIn: () => {
      setPressed(true);
      animatePress(1);
    },
    onPressOut: () => {
      setPressed(false);
      animatePress(0);
    },
  };

  const entranceStyle = {
    opacity: entrance,
    transform: [
      { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
      { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
    ],
  };

  const floatStyle = {
    transform: [{ translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -floatDistance] }) }],
  };

  const hoverStyle = {
    transform: [
      { translateY: hover.interpolate({ inputRange: [0, 1], outputRange: [0, -lift] }) },
      { rotate: hover.interpolate({ inputRange: [0, 1], outputRange: [`${restRotation}deg`, '0deg'] }) },
      {
        scale: Animated.multiply(
          hover.interpolate({ inputRange: [0, 1], outputRange: [1, hoverScale] }),
          press.interpolate({ inputRange: [0, 1], outputRange: [1, pressScale] })
        ),
      },
    ],
  };

  return {
    entranceStyle,
    floatStyle,
    hoverStyle,
    handlers,
    active: hovered || pressed,
    hovered,
    pressed,
  };
}
