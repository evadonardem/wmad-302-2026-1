/**
 * Search Screen Styles - Dynamic Green Theme
 * Supports Light Mode and Dark Mode.
 */

import { StyleSheet } from 'react-native';
import type { MD3Theme } from 'react-native-paper';

export const createStyles = (
  colors: MD3Theme['colors']
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      paddingHorizontal: 16,
      paddingBottom: 100,
    },

    searchBarContainer: {
      marginBottom: 16,
    },

    searchInput: {
      height: 52,
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      paddingHorizontal: 16,
      fontSize: 16,
      color: colors.onSurface,
    },

    clearButton: {
      padding: 8,
    },

    searchButton: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingHorizontal: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 4,
    },

    filterSection: {
      marginBottom: 20,
    },

    sortSection: {
      marginBottom: 20,
    },

    filterTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.onSurface,
      marginBottom: 12,
    },

    filterList: {
      paddingHorizontal: 4,
      gap: 8,
    },

    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surface,
    },

    filterChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    filterChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.onSurface,
    },

    filterChipTextSelected: {
      color: colors.onPrimary,
    },

    sortOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    sortChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surface,
    },

    sortChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    sortChipText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.onSurface,
    },

    sortChipTextSelected: {
      color: colors.onPrimary,
    },

    resultsSection: {
      marginTop: 8,
    },

    resultsTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.onSurface,
      marginBottom: 16,
    },

    resultsList: {
      paddingBottom: 20,
    },

    resultCard: {
      marginBottom: 10,
    },

    card: {
      borderRadius: 16,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      elevation: 2,
    },

    resultContent: {
      flexDirection: 'row',
      padding: 12,
    },

    resultImage: {
      width: 88,
      height: 88,
      borderRadius: 12,
      marginRight: 12,
    },

    resultInfo: {
      flex: 1,
      justifyContent: 'center',
    },

    resultCategory: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginBottom: 4,
    },

    resultTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.onSurface,
      marginBottom: 4,
    },

    resultPrice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },

    currentPrice: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
    },

    originalPrice: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      textDecorationLine: 'line-through',
    },

    resultMeta: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 4,
    },

    difficultyChip: {
      backgroundColor: colors.secondaryContainer,
    },

    cuisineChip: {
      backgroundColor: colors.tertiaryContainer,
    },

    resultDetails: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },

    loadingCenter: {
      paddingVertical: 40,
      alignItems: 'center',
    },

    loadingText: {
      marginTop: 10,
      color: colors.onSurfaceVariant,
    },

    loadMoreButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
      marginVertical: 16,
    },

    loadMoreText: {
      color: colors.onPrimary,
      fontWeight: 'bold',
    },

    showingText: {
      textAlign: 'center',
      color: colors.onSurfaceVariant,
      marginVertical: 10,
    },

    emptyState: {
      paddingVertical: 60,
      alignItems: 'center',
    },

    emptyText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.onSurface,
      marginTop: 16,
    },

    emptySubtext: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginTop: 4,
      textAlign: 'center',
    },

    separator: {
      height: 8,
    },

    guideContainer: {
      marginTop: 24,
      padding: 16,
      backgroundColor: colors.secondaryContainer,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },

    guideTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.onSecondaryContainer,
      marginBottom: 8,
    },

    guideText: {
      fontSize: 13,
      color: colors.onSecondaryContainer,
      lineHeight: 20,
    },
  });