/**
 * Reusable UI Components & ErrorBoundary
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Card, Title, Chip, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Recipe } from '@/types/recipe';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message || 'Unexpected rendering error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#D32F2F" />
          <Text style={styles.emptyTitle}>{this.props.fallbackTitle || 'Something went wrong'}</Text>
          <Text style={styles.emptyMessage}>{this.state.errorMessage}</Text>
          <Button mode="contained" onPress={this.handleReset} style={styles.actionButton}>
            Try Again
          </Button>
        </View>
      );
    }
    return this.props.children;
  }
}

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function RecipeCard({ recipe, onPress, style }: RecipeCardProps) {
  return (
    <TouchableOpacity style={[styles.cardWrapper, style]} onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.card} elevation={2}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: recipe.image }} style={styles.recipeImage} resizeMode="cover" />
          <View style={styles.difficultyBadge}>
            <Chip
              style={[
                styles.difficultyChip,
                recipe.difficulty === 'Easy' && styles.easy,
                recipe.difficulty === 'Medium' && styles.medium,
                recipe.difficulty === 'Hard' && styles.hard,
              ]}
            >
              {recipe.difficulty}
            </Chip>
          </View>
        </View>
        <Card.Content style={styles.cardContent}>
          <Title style={styles.recipeTitle} numberOfLines={1}>
            {recipe.name}
          </Title>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              ⏱️ {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min
            </Text>
            <Text style={styles.metaText}>👥 {recipe.servings} servings</Text>
            <Text style={styles.metaText}>🔥 {recipe.caloriesPerServing} cal</Text>
          </View>
          <View style={styles.cuisineRow}>
            <Chip style={styles.cuisineChip}>{recipe.cuisine}</Chip>
          </View>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>
              ⭐ {recipe.rating.toFixed(1)} ({recipe.reviewCount} reviews)
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
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

export function CategoryChip({ label, selected, onPress, icon, style }: CategoryChipProps) {
  return (
    <TouchableOpacity
      style={[styles.categoryChip, selected && styles.categoryChipSelected, style]}
      onPress={onPress}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={16}
          color={selected ? '#FFFFFF' : '#E85D04'}
          style={{ marginRight: 4 }}
        />
      )}
      <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
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
  if (!visible) return null;

  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color="#E85D04" />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name={icon} size={80} color="#BCAAA4" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {actionLabel && onAction && (
        <Button mode="contained" onPress={onAction} style={styles.actionButton}>
          {actionLabel}
        </Button>
      )}
    </View>
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
  cardContent: {
    padding: 16,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3E2723',
    marginBottom: 8,
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
    backgroundColor: '#E85D04',
  },
});
