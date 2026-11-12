
/**
 * Home Screen Styles - Dynamic Green Cookbook Design
 * Supports Light Mode, Dark Mode, and System Default.
 */

import { StyleSheet } from 'react-native';
import type { MD3Theme } from 'react-native-paper';

export const createHomeStyles = (colors: MD3Theme['colors']) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: colors.background,
    },

    scrollContent: {
      paddingBottom: 30,
    },

    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      backgroundColor: colors.background,
    },

    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.onSurface,
    },

    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      backgroundColor: colors.background,
    },

    errorText: {
      fontSize: 16,
      color: colors.onSurface,
      textAlign: 'center',
      marginBottom: 16,
    },

    retryButton: {
      marginTop: 8,
    },

    welcomeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 28,
      backgroundColor: colors.primary,
    },

    welcomeTextContainer: {
      flex: 1,
    },

    welcomeGreeting: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.onPrimary,
    },

    welcomeSubtitle: {
      fontSize: 23,
      fontWeight: '700',
      color: colors.onPrimary,
      marginTop: 8,
    },

    welcomeAvatar: {
      backgroundColor: colors.primaryContainer,
    },

    sectionContainer: {
      paddingHorizontal: 16,
      marginBottom: 24,
    },

    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.onSurface,
    },

    seeAll: {
      paddingVertical: 4,
    },

    seeAllText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },

    categoryList: {
      paddingHorizontal: 2,
      gap: 8,
    },

    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.primaryContainer,
    },

    categoryChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.onPrimaryContainer,
    },

    recipeCard: {
      width: 280,
      marginBottom: 8,
    },

    card: {
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },

    imageContainer: {
      position: 'relative',
      height: 160,
    },

    recipeImage: {
      width: '100%',
      height: '100%',
    },

    productImage: {
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
      backgroundColor: '#C8E6C9',
    },

    medium: {
      backgroundColor: '#FFF3CD',
    },

    hard: {
      backgroundColor: '#FFCDD2',
    },

    cardContent: {
      padding: 14,
    },

    recipeTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.onSurface,
      marginBottom: 8,
    },

    productTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.onSurface,
      marginBottom: 8,
    },

    productCategory: {
      fontSize: 12,
      color: colors.primary,
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
      fontSize: 11,
      color: colors.onSurfaceVariant,
      fontWeight: '500',
    },

    cuisineRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 8,
    },

    cuisineChip: {
      backgroundColor: colors.primaryContainer,
    },

    mealChip: {
      backgroundColor: colors.secondaryContainer,
    },

    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    ratingText: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      fontWeight: '600',
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
      color: colors.primary,
    },

    originalPrice: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textDecorationLine: 'line-through',
    },

    discountBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      zIndex: 1,
    },

    cardSeparator: {
      width: 12,
    },

    featuredList: {
      paddingBottom: 8,
    },

    emptyContainer: {
      paddingVertical: 40,
      alignItems: 'center',
    },

    emptyText: {
      fontSize: 16,
      color: colors.onSurfaceVariant,
    },
  });
