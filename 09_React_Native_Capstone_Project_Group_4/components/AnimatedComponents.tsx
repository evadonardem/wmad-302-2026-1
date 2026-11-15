import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleProp, ViewStyle } from 'react-native';
import { IconButton } from 'react-native-paper';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface AnimatedCardWrapperProps {
  children: React.ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Smooth staggered fade-in & slide-up animation for recipe cards and list items
 */
export function AnimatedCardWrapper({
  children,
  index = 0,
  style,
}: AnimatedCardWrapperProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    const delay = Math.min(index * 50, 350);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 360,
        delay,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        friction: 8,
        tension: 45,
        delay,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [fadeAnim, translateYAnim, index]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

interface AnimatedHeartButtonProps {
  isFavorite: boolean;
  onPress: () => void;
  size?: number;
}

/**
 * Bouncy heart scale pulse when toggling favorite status
 */
export function AnimatedHeartButton({
  isFavorite,
  onPress,
  size = 22,
}: AnimatedHeartButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.35,
        friction: 3,
        tension: 120,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();

    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <IconButton
        icon={isFavorite ? 'heart' : 'heart-outline'}
        iconColor={isFavorite ? '#C62828' : '#8D6E63'}
        size={size}
        onPress={handlePress}
        accessibilityLabel="Toggle favorite"
      />
    </Animated.View>
  );
}

interface ScalePressableProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  hoverScale?: number;
}

/**
 * Smooth hover zoom on Web + tactile press-in shrink effect on tap/click
 */
export function ScalePressable({
  children,
  onPress,
  style,
  hoverScale = 1.04,
}: ScalePressableProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isHoveredRef = useRef(false);

  const animateTo = (toValue: number) => {
    Animated.spring(scaleAnim, {
      toValue,
      friction: 7,
      tension: 110,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  };

  const handleHoverIn = () => {
    isHoveredRef.current = true;
    animateTo(hoverScale);
  };

  const handleHoverOut = () => {
    isHoveredRef.current = false;
    animateTo(1);
  };

  const handlePressIn = () => {
    animateTo(0.97);
  };

  const handlePressOut = () => {
    animateTo(isHoveredRef.current ? hoverScale : 1);
  };

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}