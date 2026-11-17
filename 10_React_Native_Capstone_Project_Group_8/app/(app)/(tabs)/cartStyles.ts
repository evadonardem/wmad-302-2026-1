
/**
 * Cart Screen Styles - Marketplace
 * Dynamic Light and Dark Theme Support
 */

import { StyleSheet } from 'react-native';
import type { MD3Theme } from 'react-native-paper';

export const createCartStyles = (
  colors: MD3Theme['colors'],
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingTop: 18,
      paddingBottom: 16,
      gap: 8,
    },

    backButton: {
      margin: 0,
    },

    headerTextContainer: {
      flex: 1,
      minWidth: 0,
    },

    emptyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingTop: 18,
      gap: 10,
    },

    emptyHeaderTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.onSurface,
    },

    eyebrow: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      color: colors.primary,
      marginBottom: 5,
    },

    headerTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.onBackground,
    },

    headerSubtitle: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 4,
    },

    headerIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 17,
      backgroundColor: colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },

    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },

    loadingText: {
      marginTop: 16,
      fontSize: 15,
      fontWeight: '600',
      color: colors.onSurfaceVariant,
    },

    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 30,
      backgroundColor: colors.background,
    },

    emptyIconContainer: {
      width: 115,
      height: 115,
      borderRadius: 38,
      backgroundColor: colors.primaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 22,
    },

    emptyTitle: {
      fontSize: 23,
      fontWeight: '800',
      color: colors.onSurface,
      marginBottom: 10,
    },

    emptyText: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.onSurfaceVariant,
      marginTop: 2,
      textAlign: 'center',
    },

    browseButton: {
      marginTop: 26,
      borderRadius: 13,
    },

    buttonContent: {
      height: 50,
      paddingHorizontal: 18,
    },

    listContent: {
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 330,
    },

    cartItem: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      padding: 12,
      alignItems: 'center',
    },

    itemImage: {
      width: 94,
      height: 108,
      borderRadius: 12,
      marginRight: 13,
      backgroundColor: colors.surfaceVariant,
    },

    itemInfo: {
      flex: 1,
      minWidth: 0,
    },

    itemCategory: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.7,
      color: colors.primary,
      marginBottom: 4,
    },

    itemTitle: {
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 19,
      color: colors.onSurface,
      marginBottom: 7,
    },

    itemPriceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 5,
    },

    itemCurrentPrice: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.primary,
    },

    itemOriginalPrice: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      textDecorationLine: 'line-through',
    },

    itemBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    quantityControls: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: -9,
    },

    quantityText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.onSurface,
      minWidth: 25,
      textAlign: 'center',
    },

    removeButton: {
      width: 34,
      height: 34,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.errorContainer,
    },

    stockNotice: {
      fontSize: 10,
      color: colors.error,
      marginTop: 2,
    },

    separator: {
      height: 12,
    },

    /**
     * Keeps Order Summary above the floating bottom navigation.
     */
    summaryContainer: {
      position: 'absolute',
      bottom: 92,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.outlineVariant,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingHorizontal: 20,
      paddingTop: 17,
      paddingBottom: 18,
      elevation: 10,
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: -3,
      },
      shadowOpacity: 0.08,
      shadowRadius: 10,
    },

    summaryHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },

    summaryTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.onSurface,
    },

    summaryItemCount: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.onSurfaceVariant,
    },

    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 9,
    },

    summaryLabel: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
    },

    summaryValue: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.onSurface,
    },

    discountValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.tertiary,
    },

    summaryRowDivider: {
      height: 1,
      backgroundColor: colors.outlineVariant,
      marginVertical: 11,
    },

    summaryRowTotal: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },

    summaryLabelTotal: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.onSurface,
    },

    summaryValueTotal: {
      fontSize: 21,
      fontWeight: '800',
      color: colors.primary,
    },

    checkoutButton: {
      borderRadius: 13,
    },

    checkoutButtonContent: {
      height: 52,
      flexDirection: 'row-reverse',
    },

    secureCheckout: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 12,
      gap: 6,
    },

    secureCheckoutText: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
    },
  });
