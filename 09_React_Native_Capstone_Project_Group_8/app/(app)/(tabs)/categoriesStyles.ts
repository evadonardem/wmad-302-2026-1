
/**
 * Categories Screen Styles
 * Supports Light Mode, Dark Mode, and System Default.
 */

import { StyleSheet } from 'react-native';
import type { MD3Theme } from 'react-native-paper';

export function createCategoriesStyles(theme: MD3Theme) {
  const colors = theme.colors;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 100,
    },

    header: {
      marginBottom: 20,
    },

    pageTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.onBackground,
      marginBottom: 4,
    },

    pageSubtitle: {
      fontSize: 15,
      color: colors.onSurfaceVariant,
      marginBottom: 14,
    },

    headerBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryContainer,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 6,
    },

    headerBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.onPrimaryContainer,
    },

    gridWrapper: {
      justifyContent: 'space-between',
    },

    gridContent: {
      paddingBottom: 24,
    },

    categoryCard: {
      width: '48%',
      marginBottom: 12,
    },

    card: {
      borderRadius: 18,
      backgroundColor: colors.surface,
      height: '100%',
      overflow: 'hidden',
    },

    cardContent: {
      paddingHorizontal: 12,
      paddingVertical: 20,
      alignItems: 'center',
    },

    iconContainer: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: colors.primaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },

    categoryName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.onSurface,
      textAlign: 'center',
      marginBottom: 4,
    },

    categoryCount: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.onSurfaceVariant,
      marginBottom: 12,
    },

    exploreContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },

    exploreText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },

    separator: {
      height: 4,
      width: '100%',
    },

    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },

    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.onSurfaceVariant,
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
      fontWeight: '600',
      color: colors.onSurface,
      textAlign: 'center',
      marginTop: 12,
    },

    errorSubtext: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: 8,
    },

    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 18,
    },

    retryButtonText: {
      color: colors.onPrimary,
      fontSize: 14,
      fontWeight: '700',
    },

    guideContainer: {
      marginTop: 24,
      padding: 16,
      backgroundColor: colors.primaryContainer,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },

    guideTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.onPrimaryContainer,
      marginBottom: 8,
    },

    guideText: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      lineHeight: 20,
    },
  });
}
