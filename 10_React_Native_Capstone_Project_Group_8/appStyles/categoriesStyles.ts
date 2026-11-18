
/**
 * Categories Screen Styles
 * Dynamic Light and Dark Theme Support
 */

import { StyleSheet } from 'react-native';
import type { MD3Theme } from 'react-native-paper';

export const createCategoriesStyles = (
  colors: MD3Theme['colors'],
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 18,
      paddingTop: 20,
      paddingBottom: 90,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 22,
    },

    headerTextContainer: {
      flex: 1,
      paddingRight: 12,
    },

    eyebrow: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.5,
      color: colors.primary,
      marginBottom: 7,
    },

    pageTitle: {
      fontSize: 29,
      fontWeight: '800',
      color: colors.onBackground,
      marginBottom: 5,
    },

    pageSubtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.onSurfaceVariant,
    },

    headerIconContainer: {
      width: 58,
      height: 58,
      borderRadius: 19,
      backgroundColor: colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },

    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.primaryContainer,
      borderRadius: 18,
      padding: 18,
      marginBottom: 25,
      minHeight: 112,
    },

    bannerTextContainer: {
      flex: 1,
      paddingRight: 12,
    },

    bannerTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.onSurface,
      marginBottom: 6,
    },

    bannerSubtitle: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.onSurfaceVariant,
      maxWidth: 230,
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 15,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.onBackground,
    },

    sectionCount: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.onSurfaceVariant,
    },

    gridWrapper: {
      justifyContent: 'space-between',
    },

    gridContent: {
      paddingBottom: 25,
      flexGrow: 1,
    },

    categoryCard: {
      width: '48%',
      marginBottom: 14,
    },

    card: {
      minHeight: 158,
      backgroundColor: colors.surface,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      padding: 15,
      justifyContent: 'space-between',
    },

    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 15,
    },

    iconContainer: {
      width: 55,
      height: 55,
      borderRadius: 17,
      backgroundColor: colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },

    categoryName: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.onSurface,
      lineHeight: 19,
      marginBottom: 5,
    },

    categoryCount: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.onSurfaceVariant,
    },

    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 24,
    },

    loadingText: {
      marginTop: 16,
      fontSize: 16,
      fontWeight: '700',
      color: colors.onSurface,
    },

    loadingSubtext: {
      marginTop: 6,
      fontSize: 13,
      color: colors.onSurfaceVariant,
    },

    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 28,
    },

    errorIconContainer: {
      width: 76,
      height: 76,
      borderRadius: 25,
      backgroundColor: colors.errorContainer,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },

    errorTitle: {
      fontSize: 19,
      fontWeight: '800',
      color: colors.onSurface,
      textAlign: 'center',
      marginBottom: 9,
    },

    errorText: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },

    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 22,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 22,
      gap: 8,
    },

    retryButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.onPrimary,
    },

    emptyContainer: {
      flex: 1,
      minHeight: 200,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },

    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.onSurface,
      marginTop: 13,
    },

    emptyText: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      marginTop: 6,
      textAlign: 'center',
    },
  });
