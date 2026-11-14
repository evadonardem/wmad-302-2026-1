/**
 * Reusable UI Components
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card, Title, Chip, Badge, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';

interface RecipeCardProps {
  recipe: {
    id: number;
    name: string;
    image: string;
    difficulty: string;
    cuisine: string;
    prepTimeMinutes: number;
    cookTimeMinutes: number;
    servings: number;
    rating: number;
    reviewCount: number;
    caloriesPerServing: number;
  };
  onPress: () => void;
  style?: any;
}

export function RecipeCard({ recipe, onPress, style }: RecipeCardProps) {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      style={[styles.cardWrapper, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Card style={[styles.card, { backgroundColor: colors.surfaceElevated }]} elevation={2}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: recipe.image }}
            style={styles.recipeImage}
            resizeMode="cover"
          />
          <View style={styles.difficultyBadge}>
            <Chip style={[
              styles.difficultyChip,
              recipe.difficulty === 'Easy' && styles.easy,
              recipe.difficulty === 'Medium' && styles.medium,
              recipe.difficulty === 'Hard' && styles.hard,
            ]}>
              {recipe.difficulty}
            </Chip>
          </View>
        </View>
        <Card.Content style={styles.cardContent}>
          <Title style={[styles.recipeTitle, { color: colors.text }]} numberOfLines={1}>
            {recipe.name}
          </Title>
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              ⏱️ {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min
            </Text>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>👥 {recipe.servings} servings</Text>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>🔥 {recipe.caloriesPerServing} cal</Text>
          </View>
          <View style={styles.cuisineRow}>
            <Chip style={styles.cuisineChip}>{recipe.cuisine}</Chip>
          </View>
          <View style={styles.ratingRow}>
            <Text style={[styles.ratingText, { color: colors.textMuted }]}>
              ⭐ {recipe.rating.toFixed(1)} ({recipe.reviewCount} reviews)
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

interface ProductCardProps {
  product: {
    id: number;
    title: string;
    thumbnail: string;
    category: string;
    price: number;
    discountPercentage: number;
    rating: number;
    stock: number;
  };
  onPress: () => void;
  style?: any;
}

export function ProductCard({ product, onPress, style }: ProductCardProps) {
  const { colors } = useAppTheme();
  const discountedPrice = product.price * (1 - product.discountPercentage / 100);

  return (
    <TouchableOpacity
      style={[styles.cardWrapper, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Card style={[styles.card, { backgroundColor: colors.surfaceElevated }]} elevation={2}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.thumbnail }}
            style={styles.productImage}
            resizeMode="contain"
          />
          {product.discountPercentage > 0 && (
            <Badge style={styles.discountBadge}>
              {`-${Math.round(product.discountPercentage)}%`}
            </Badge>
          )}
        </View>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.productCategory}>{product.category}</Text>
          <Title style={[styles.productTitle, { color: colors.text }]} numberOfLines={2}>
            {product.title}
          </Title>
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>${discountedPrice.toFixed(2)}</Text>
            {product.discountPercentage > 0 && (
              <Text style={styles.originalPrice}>${product.price.toFixed(2)}</Text>
            )}
          </View>
          <View style={styles.ratingRow}>
            <Text style={[styles.ratingText, { color: colors.textMuted }]}>
              ⭐ {product.rating.toFixed(1)} · {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

interface CategoryChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: string;
  style?: any;
}

export function CategoryChip({ label, selected, onPress, icon, style }: CategoryChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selected && styles.categoryChipSelected,
        style,
      ]}
      onPress={onPress}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
          size={16}
          color={selected ? '#FFFFFF' : '#E85D04'}
          style={{ marginRight: 4 }}
        />
      )}
      <Text style={[
        styles.categoryChipText,
        selected && styles.categoryChipTextSelected,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = 'Loading...' }: LoadingOverlayProps) {
  const { colors } = useAppTheme();
  if (!visible) return null;

  return (
    <View style={[styles.loadingOverlay, { backgroundColor: `${colors.background}CC` }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.textMuted }]}>{message}</Text>
    </View>
  );
}

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name={icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']} size={80} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyMessage, { color: colors.textMuted }]}>{message}</Text>
      {actionLabel && onAction && (
        <Button mode="contained" onPress={onAction} style={styles.actionButton}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

interface SkeletonProps {
  height?: number;
  width?: number | `${number}%`;
  borderRadius?: number;
}

export function Skeleton({ height = 20, width = '100%', borderRadius = 8 }: SkeletonProps) {
  return (
    <View
      style={[
        styles.skeleton,
        { height, width, borderRadius },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  imageContainer: {
    position: 'relative',
    height: 180,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  productImage: {
    width: '100%',
    height: '100%',
    maxWidth: '90%',
    maxHeight: '90%',
  },
  difficultyBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  difficultyChip: {
    borderRadius: 12,
  },
  easy: {
    backgroundColor: '#E8F5E9',
  },
  medium: {
    backgroundColor: '#FFF3E0',
  },
  hard: {
    backgroundColor: '#FDEDED',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
  },
  cardContent: {
    padding: 16,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3E2723',
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202124',
    marginBottom: 8,
  },
  productCategory: {
    fontSize: 12,
    color: '#1A73E8',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#8D6E63',
    fontWeight: '500',
  },
  cuisineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  cuisineChip: {
    backgroundColor: '#FFF3E0',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    color: '#8D6E63',
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A73E8',
  },
  originalPrice: {
    fontSize: 14,
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChipSelected: {
    backgroundColor: '#E85D04',
    borderColor: '#E85D04',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E85D04',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8D6E63',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3E2723',
    marginTop: 20,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#8D6E63',
    marginTop: 8,
    textAlign: 'center',
  },
  actionButton: {
    marginTop: 24,
    borderRadius: 12,
    height: 52,
  },
  skeleton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
  },
});