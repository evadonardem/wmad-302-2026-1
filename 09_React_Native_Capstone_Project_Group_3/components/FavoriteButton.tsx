/**
 * Heart button that adds/removes a favorite.
 * The heart "pops" with a spring animation and the phone gives a short vibration.
 */
import React, { useRef } from 'react';
import { Animated, Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCookbook } from '@/context/CookbookContext';
import { photoOverlay, useAppTheme } from '@/constants/theme';

interface FavoriteButtonProps {
  recipeId: number;
  size?: number;
  /** 'floating' = round dark button for use on top of photos */
  variant?: 'floating' | 'plain';
  style?: StyleProp<ViewStyle>;
}

export function FavoriteButton({ recipeId, size = 22, variant = 'floating', style }: FavoriteButtonProps) {
  const theme = useAppTheme();
  const { isFavorite, toggleFavorite } = useCookbook();
  const active = isFavorite(recipeId);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    toggleFavorite(recipeId);
    Haptics.impactAsync(
      active ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    ).catch(() => {
      // Haptics are not available on web - ignore
    });
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.35, useNativeDriver: true, speed: 50, bounciness: 14 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
    ]).start();
  };

  const floating = variant === 'floating';
  const color = active
    ? floating
      ? photoOverlay.heart
      : theme.colors.error
    : floating
      ? photoOverlay.text
      : theme.colors.muted;

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={active ? 'Remove from favorites' : 'Add to favorites'}
      style={[
        floating && [
          styles.floating,
          { width: size * 1.8, height: size * 1.8, borderRadius: size * 0.9 },
        ],
        style,
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <MaterialCommunityIcons name={active ? 'heart' : 'heart-outline'} size={size} color={color} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  floating: {
    backgroundColor: photoOverlay.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
