
/**
 * Home Screen Styles - Marketplace
 *
 * Dynamic styles that follow the active React Native Paper theme.
 */

import { StyleSheet } from 'react-native';
import type { MD3Theme } from 'react-native-paper';

export function createHomeStyles(colors: MD3Theme['colors']) {
  return StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: colors.background,
    },

    scrollContent: {
      paddingBottom: 110,
    },

    // Loading
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 24,
    },

    loadingText: {
      marginTop: 16,
      fontSize: 15,
      color: colors.onSurfaceVariant,
      fontWeight: '500',
    },

    // Error
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 28,
      backgroundColor: colors.background,
    },

    errorIcon: {
      width: 58,
      height: 58,
      lineHeight: 58,
      borderRadius: 29,
      overflow: 'hidden',
      textAlign: 'center',
      fontSize: 30,
      fontWeight: '700',
      color: colors.error,
      backgroundColor: colors.errorContainer,
      marginBottom: 18,
    },

    errorTitle: {
      fontSize: 21,
      fontWeight: '800',
      color: colors.onBackground,
      marginBottom: 8,
      textAlign: 'center',
    },

    errorText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 21,
      marginBottom: 20,
    },

    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 28,
      paddingVertical: 13,
      borderRadius: 14,
    },

    retryButtonText: {
      color: colors.onPrimary,
      fontSize: 14,
      fontWeight: '700',
    },

    // Search and cart header
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 12,
      gap: 12,
    },

    searchBox: {
      flex: 1,
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      gap: 9,
    },

    searchInput: {
      flex: 1,
      height: 50,
      paddingVertical: 0,
      fontSize: 14,
      color: colors.onSurface,
    },

    cartButton: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },

    cartBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      minWidth: 19,
      height: 19,
      borderRadius: 10,
      paddingHorizontal: 4,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.error,
      borderWidth: 1.5,
      borderColor: colors.background,
    },

    cartBadgeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '800',
      textAlign: 'center',
    },

    // Welcome header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 20,
    },

    headerTextContainer: {
      flex: 1,
      paddingRight: 12,
    },

    headerEyebrow: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.1,
      color: colors.primary,
      marginBottom: 7,
    },

    welcomeGreeting: {
      fontSize: 27,
      fontWeight: '800',
      color: colors.onBackground,
      letterSpacing: -0.6,
    },

    welcomeSubtitle: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      marginTop: 5,
    },

    // Promotional banner
    promoBanner: {
      marginHorizontal: 16,
      marginBottom: 27,
      padding: 20,
      minHeight: 205,
      borderRadius: 23,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      overflow: 'hidden',
      position: 'relative',
    },

    promoTextContainer: {
      flex: 1,
      zIndex: 1,
      paddingRight: 3,
    },

    promoEyebrow: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.4,
      color: colors.onPrimary,
      opacity: 0.85,
      marginBottom: 10,
    },

    promoTitle: {
      fontSize: 25,
      lineHeight: 31,
      fontWeight: '800',
      color: colors.onPrimary,
      letterSpacing: -0.5,
    },

    promoSubtitle: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.onPrimary,
      opacity: 0.85,
      marginTop: 8,
      maxWidth: 210,
    },

    promoButton: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
      paddingHorizontal: 15,
      paddingVertical: 11,
      borderRadius: 12,
      marginTop: 15,
    },

    promoButtonText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '800',
    },

    promoDecoration: {
      width: 78,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: -8,
    },

    promoEmoji: {
      fontSize: 57,
    },

    promoSmallEmoji: {
      fontSize: 22,
      position: 'absolute',
      top: 24,
      right: 0,
    },

    // Sections
    sectionContainer: {
      marginBottom: 27,
    },

    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 18,
      marginBottom: 14,
    },

    sectionTitle: {
      fontSize: 19,
      fontWeight: '800',
      color: colors.onBackground,
      letterSpacing: -0.3,
    },

    sectionSubtitle: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
      marginTop: 4,
    },

    seeAllText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '800',
    },

    // Categories
    categoryList: {
      paddingHorizontal: 18,
      gap: 9,
    },

    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 11,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },

    categoryChipText: {
      color: colors.onSurface,
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'capitalize',
    },

    // Flash deals
    flashTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    flashIcon: {
      fontSize: 18,
    },

    flashDealsList: {
      paddingHorizontal: 18,
      gap: 12,
      paddingBottom: 3,
    },

    // Product cards
    productCard: {
      width: '48%',
      backgroundColor: colors.surface,
      borderRadius: 17,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },

    compactProductCard: {
      width: 205,
    },

    productImageContainer: {
      height: 145,
      backgroundColor: colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      padding: 10,
    },

    productImage: {
      width: '100%',
      height: '100%',
    },

    discountBadge: {
      position: 'absolute',
      top: 10,
      left: 10,
      backgroundColor: colors.error,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 8,
    },

    discountBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },

    productInfo: {
      paddingHorizontal: 11,
      paddingTop: 11,
      paddingBottom: 13,
    },

    productCategory: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'capitalize',
      marginBottom: 5,
    },

    productTitle: {
      color: colors.onSurface,
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 18,
      minHeight: 36,
    },

    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 10,
    },

    currentPrice: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '800',
    },

    originalPrice: {
      color: colors.onSurfaceVariant,
      fontSize: 11,
      textDecorationLine: 'line-through',
    },

    productMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 9,
    },

    ratingText: {
      color: colors.onSurface,
      fontSize: 11,
      fontWeight: '700',
    },

    stockText: {
      fontSize: 9,
      fontWeight: '700',
    },

    inStockText: {
      color: colors.primary,
    },

    outOfStockText: {
      color: colors.error,
    },

    // Recommended product grid
    productGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      rowGap: 13,
    },

    // Empty states
    emptyDealsContainer: {
      marginHorizontal: 18,
      padding: 20,
      borderRadius: 14,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
    },

    emptyContainer: {
      paddingVertical: 35,
      alignItems: 'center',
    },

    emptyText: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },

    bottomSpacing: {
      height: 15,
    },
  });
}
