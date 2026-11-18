
/**
 * Search Screen Styles
 * Dynamic colors for Light and Dark themes
 */
import { StyleSheet } from 'react-native';
import type { MD3Theme } from 'react-native-paper';

export const createSearchStyles = (colors: MD3Theme['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 18,
      paddingTop: 20,
      paddingBottom: 110,
    },

    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 22,
    },
    eyebrow: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.4,
      color: colors.primary,
      marginBottom: 6,
    },
    heading: {
      fontSize: 27,
      fontWeight: '800',
      color: colors.onBackground,
      letterSpacing: -0.6,
    },
    subtitle: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      marginTop: 5,
    },
    headerIcon: {
      width: 52,
      height: 52,
      borderRadius: 17,
      backgroundColor: colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Search
    searchBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginBottom: 27,
    },
    searchInput: {
      flex: 1,
      height: 54,
      backgroundColor: colors.surface,
      fontSize: 14,
    },
    searchOutline: {
      borderRadius: 14,
      borderColor: colors.outline,
    },
    searchButton: {
      minWidth: 94,
      height: 52,
      paddingHorizontal: 13,
      borderRadius: 14,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },
    searchButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },

    // Categories
    filterSection: {
      marginBottom: 25,
    },
    sectionHeadingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 13,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.onBackground,
    },
    clearFilterText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    filterList: {
      gap: 9,
      paddingRight: 8,
    },
    filterChip: {
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.outline,
      backgroundColor: colors.surface,
    },
    filterChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterChipText: {
      color: colors.onSurfaceVariant,
      fontSize: 12,
      fontWeight: '600',
    },
    filterChipTextSelected: {
      color: colors.onPrimary,
    },

    // Sorting
    sortSection: {
      marginBottom: 26,
    },
    sortOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    sortChip: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 20,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    sortChipSelected: {
      backgroundColor: colors.primaryContainer,
      borderColor: colors.primary,
    },
    sortChipText: {
      color: colors.onSurfaceVariant,
      fontSize: 12,
      fontWeight: '600',
    },
    sortChipTextSelected: {
      color: colors.primary,
      fontWeight: '800',
    },

    // Results
    resultsSection: {
      marginTop: 2,
    },
    resultsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    resultsSubtitle: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 4,
    },
    resultsList: {
      gap: 11,
    },
    resultCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 11,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      gap: 11,
    },
    resultImageContainer: {
      width: 94,
      height: 100,
      borderRadius: 12,
      backgroundColor: colors.surfaceVariant,
      overflow: 'hidden',
      position: 'relative',
    },
    resultImage: {
      width: '100%',
      height: '100%',
    },
    discountBadge: {
      position: 'absolute',
      top: 6,
      left: 6,
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderRadius: 7,
      backgroundColor: colors.error,
    },
    discountBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    resultInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    resultCategory: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
      color: colors.primary,
      marginBottom: 4,
    },
    resultTitle: {
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 18,
      color: colors.onSurface,
      marginBottom: 3,
    },
    resultBrand: {
      fontSize: 10,
      color: colors.onSurfaceVariant,
      marginBottom: 5,
    },
    resultPrice: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 7,
      marginTop: 4,
      marginBottom: 6,
    },
    currentPrice: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.primary,
    },
    originalPrice: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
      textDecorationLine: 'line-through',
    },
    resultBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 5,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    resultDetails: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.onSurfaceVariant,
    },
    stockText: {
      fontSize: 10,
      fontWeight: '700',
    },
    inStock: {
      color: colors.primary,
    },
    outOfStock: {
      color: colors.error,
    },

    // Loading and empty states
    loadingCenter: {
      paddingVertical: 55,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      marginTop: 12,
    },
    emptyState: {
      paddingHorizontal: 20,
      paddingVertical: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.onSurface,
      marginTop: 14,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 12,
      lineHeight: 19,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: 6,
    },
    retryButton: {
      marginTop: 18,
      paddingHorizontal: 22,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.primary,
    },
    retryButtonText: {
      color: colors.onPrimary,
      fontSize: 13,
      fontWeight: '700',
    },

    // Initial search state
    initialState: {
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 38,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    initialIcon: {
      width: 76,
      height: 76,
      borderRadius: 25,
      backgroundColor: colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 15,
    },
    initialTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.onSurface,
      textAlign: 'center',
    },
    initialSubtitle: {
      fontSize: 12,
      lineHeight: 19,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: 7,
    },

    // Pagination and spacing
    loadMoreButton: {
      height: 46,
      marginTop: 17,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryContainer,
    },
    loadMoreText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.primary,
    },
    bottomSpacing: {
      height: 20,
    },
  });
