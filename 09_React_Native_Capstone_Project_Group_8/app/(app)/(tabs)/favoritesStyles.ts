
/**
 * Favorites Screen Styles
 * Supports Light Mode, Dark Mode, and System Default.
 */

import { StyleSheet } from 'react-native';
import type { MD3Theme } from 'react-native-paper';

export function createFavoritesStyles(theme: MD3Theme) {
  const colors = theme.colors;
  const dark = theme.dark;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: dark ? colors.background : colors.primary,
    },

    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: dark ? colors.background : colors.primary,
    },

    loadingText: {
      marginTop: 16,
      fontSize: 16,
      fontWeight: '500',
      color: dark ? colors.onBackground : '#FFFFFF',
    },

    // Empty Favorites
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },

    emptyIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
    },

    emptyTitle: {
      fontSize: 25,
      fontWeight: '700',
      color: dark ? colors.onBackground : '#FFFFFF',
      marginTop: 24,
    },

    emptyText: {
      fontSize: 15,
      lineHeight: 23,
      color: dark ? colors.onSurfaceVariant : '#F1F8E9',
      marginTop: 10,
      textAlign: 'center',
    },

    browseButton: {
      marginTop: 28,
      borderRadius: 12,
    },

    buttonContent: {
      paddingHorizontal: 28,
      height: 48,
    },

    // Favorites list
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 110,
    },

    header: {
      paddingHorizontal: 4,
      paddingTop: 20,
      paddingBottom: 22,
    },

    headerOverline: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 2,
      color: dark ? colors.onSurfaceVariant : '#D9F2D3',
      marginBottom: 6,
    },

    headerTitle: {
      fontSize: 29,
      fontWeight: '700',
      color: dark ? colors.onBackground : '#FFFFFF',
    },

    headerSubtitle: {
      fontSize: 14,
      color: dark ? colors.onSurfaceVariant : '#F1F8E9',
      marginTop: 4,
    },

    countContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: dark
        ? colors.primaryContainer
        : '#2E8B25',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      marginTop: 16,
      gap: 7,
    },

    countText: {
      fontSize: 13,
      fontWeight: '600',
      color: dark ? colors.onPrimaryContainer : '#FFFFFF',
    },

    // Recipe card
    card: {
      borderRadius: 16,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },

    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
    },

    recipeContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 0,
    },

    recipeImage: {
      width: 108,
      height: 116,
      borderRadius: 12,
      backgroundColor: colors.surfaceVariant,
    },

    info: {
      flex: 1,
      justifyContent: 'center',
      paddingLeft: 12,
      minWidth: 0,
    },

    title: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
      color: colors.onSurface,
      marginBottom: 7,
    },

    meta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 5,
      marginBottom: 8,
    },

    difficultyChip: {
      backgroundColor: colors.primaryContainer,
      height: 27,
    },

    cuisineChip: {
      backgroundColor: colors.secondaryContainer,
      height: 27,
    },

    chipText: {
      fontSize: 10,
      color: colors.onPrimaryContainer,
      marginVertical: 0,
      marginHorizontal: 7,
    },

    detailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 5,
    },

    details: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
      fontWeight: '500',
      marginRight: 5,
    },

    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 7,
      gap: 3,
    },

    ratingText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.onSurfaceVariant,
    },

    favoriteAction: {
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 2,
    },

    separator: {
      height: 12,
    },
  });
}
