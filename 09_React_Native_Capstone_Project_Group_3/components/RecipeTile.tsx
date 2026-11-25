/**
 * Photo-first recipe card: the food photo fills the card, and the name sits
 * on a soft dark gradient at the bottom (Tasty / NYT Cooking style).
 *
 * Sizes:
 *  - hero:  big full-width card (Recipe of the day)
 *  - wide:  full-width list card
 *  - shelf: tall card for horizontal shelves
 *  - grid:  card for 2-column grids
 */
import React from 'react';
import { DimensionValue, Image, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Recipe } from '@/types/recipe';
import { fontFamily, photoOverlay, radius } from '@/constants/theme';
import { FavoriteButton } from './FavoriteButton';

type TileSize = 'hero' | 'wide' | 'shelf' | 'grid';

const SIZES: Record<TileSize, { width: DimensionValue; height: number; title: number }> = {
  hero: { width: '100%', height: 300, title: 26 },
  wide: { width: '100%', height: 220, title: 21 },
  shelf: { width: 210, height: 250, title: 17 },
  grid: { width: '100%', height: 230, title: 16 },
};

interface RecipeTileProps {
  recipe: Recipe;
  onPress: () => void;
  size?: TileSize;
  /** Small label in the top-left corner, e.g. "Recipe of the day" (defaults to the difficulty) */
  badge?: string;
  /** Extra line under the title, e.g. "Matches 4 of 6 ingredients" */
  caption?: string;
  showFavorite?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function RecipeTile({
  recipe,
  onPress,
  size = 'wide',
  badge,
  caption,
  showFavorite = true,
  style,
}: RecipeTileProps) {
  const dims = SIZES[size];
  const minutes = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${recipe.name}, ${minutes} minutes, rated ${recipe.rating.toFixed(1)}`}
      style={({ pressed }) => [
        styles.card,
        { width: dims.width, height: dims.height, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}
    >
      <Image source={{ uri: recipe.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient colors={photoOverlay.gradient} locations={[0.35, 0.6, 1]} style={StyleSheet.absoluteFill} />

      <View style={styles.topRow}>
        <View style={styles.pill}>
          <Text style={styles.pillText} numberOfLines={1}>
            {badge ?? recipe.difficulty}
          </Text>
        </View>
        {showFavorite && <FavoriteButton recipeId={recipe.id} size={size === 'hero' ? 24 : 20} />}
      </View>

      <View style={styles.bottom}>
        <Text style={[styles.title, { fontSize: dims.title }]} numberOfLines={2}>
          {recipe.name}
        </Text>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={photoOverlay.textSoft} />
          <Text style={styles.meta}>{minutes} min</Text>
          <Text style={styles.dot}>·</Text>
          <MaterialCommunityIcons name="star" size={14} color={photoOverlay.textSoft} />
          <Text style={styles.meta}>{recipe.rating.toFixed(1)}</Text>
          {size !== 'shelf' && size !== 'grid' && (
            <>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.meta} numberOfLines={1}>
                {recipe.cuisine}
              </Text>
            </>
          )}
        </View>
        {caption ? (
          <Text style={styles.caption} numberOfLines={1}>
            {caption}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
  },
  pill: {
    backgroundColor: photoOverlay.pill,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: '70%',
  },
  pillText: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    color: photoOverlay.pillText,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bottom: {
    padding: 14,
  },
  title: {
    fontFamily: fontFamily.display,
    color: photoOverlay.text,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: photoOverlay.textSoft,
  },
  dot: {
    color: photoOverlay.textSoft,
    marginHorizontal: 2,
  },
  caption: {
    marginTop: 4,
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    color: photoOverlay.text,
  },
});
