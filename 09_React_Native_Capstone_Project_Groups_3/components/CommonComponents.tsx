/**
 * Reusable UI Components
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  DimensionValue,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Recipe } from '@/types/recipe';
import { fontFamily, makeStyles, radius, useAppTheme } from '@/constants/theme';
import { RecipeTile } from './RecipeTile';

/** Any valid MaterialCommunityIcons icon name */
export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Full-width photo card used in lists */
export function RecipeCard({ recipe, onPress, style }: RecipeCardProps) {
  return <RecipeTile recipe={recipe} onPress={onPress} size="wide" style={[{ marginBottom: 14 }, style]} />;
}

interface CategoryChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

export function CategoryChip({ label, selected, onPress, icon, style }: CategoryChipProps) {
  const styles = useStyles();
  const theme = useAppTheme();
  return (
    <TouchableOpacity
      style={[styles.categoryChip, selected && styles.categoryChipSelected, style]}
      onPress={onPress}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={16}
          color={selected ? theme.colors.onPrimary : theme.colors.primary}
          style={{ marginRight: 4 }}
        />
      )}
      <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = 'Loading...' }: LoadingOverlayProps) {
  const styles = useStyles();
  const theme = useAppTheme();
  if (!visible) return null;

  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

interface EmptyStateProps {
  /** Big emoji used as a friendly illustration, e.g. "🍳" */
  emoji?: string;
  /** Icon used when no emoji is given */
  icon?: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Friendly empty screen with an illustration and a clear next step */
export function EmptyState({ emoji, icon = 'silverware-fork-knife', title, message, actionLabel, onAction }: EmptyStateProps) {
  const styles = useStyles();
  const theme = useAppTheme();
  return (
    <View style={styles.emptyState}>
      <View style={styles.illustration}>
        <View style={styles.illustrationRing} />
        {emoji ? (
          <Text style={styles.emoji}>{emoji}</Text>
        ) : (
          <MaterialCommunityIcons name={icon} size={56} color={theme.colors.primary} />
        )}
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {actionLabel && onAction && (
        <Button mode="contained" onPress={onAction} style={styles.actionButton} contentStyle={styles.actionContent}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

interface SkeletonProps {
  height?: number;
  width?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Grey placeholder that gently pulses while content loads */
export function Skeleton({ height = 20, width = '100%', borderRadius = 8, style }: SkeletonProps) {
  const styles = useStyles();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[styles.skeleton, { height, width, borderRadius, opacity }, style]} />;
}

/** Placeholder shaped like a list of recipe cards */
export function RecipeListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} height={220} borderRadius={radius.lg} style={{ marginBottom: 14 }} />
      ))}
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryChipSelected: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    categoryChipText: {
      fontFamily: fontFamily.medium,
      fontSize: 13,
      color: c.primary,
    },
    categoryChipTextSelected: {
      color: c.onPrimary,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.overlay,
      zIndex: 100,
    },
    loadingText: {
      marginTop: 12,
      fontFamily: fontFamily.regular,
      fontSize: 16,
      color: c.muted,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingVertical: 48,
    },
    illustration: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: c.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    illustrationRing: {
      position: 'absolute',
      width: 172,
      height: 172,
      borderRadius: 86,
      borderWidth: 2,
      borderColor: c.primaryContainer,
      borderStyle: 'dashed',
    },
    emoji: {
      fontSize: 60,
    },
    emptyTitle: {
      fontFamily: fontFamily.display,
      fontSize: 24,
      color: c.onSurface,
      marginTop: 28,
      textAlign: 'center',
    },
    emptyMessage: {
      fontFamily: fontFamily.regular,
      fontSize: 15,
      lineHeight: 22,
      color: c.muted,
      marginTop: 8,
      textAlign: 'center',
    },
    actionButton: {
      marginTop: 24,
      borderRadius: radius.pill,
    },
    actionContent: {
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    skeleton: {
      backgroundColor: c.border,
    },
  })
);
