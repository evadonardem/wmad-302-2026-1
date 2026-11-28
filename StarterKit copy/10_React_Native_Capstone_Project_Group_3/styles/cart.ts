/**
 * Cart Screen Styles - Marketplace
 */
import { StyleSheet } from 'react-native';
import type { Palette } from '@/constants/palettes';

export const makeCartStyles = (c: Palette) =>
  StyleSheet.create({
    listContent: {
      padding: 16,
      paddingBottom: 32,
      width: '100%',
      maxWidth: 760,
      alignSelf: 'center',
    },
    header: {
      marginBottom: 12,
    },
    headerTitle: {
      flex: 1,
      fontSize: 24,
      fontWeight: '800',
      color: c.primary,
    },
    cartItem: {
      flexDirection: 'row',
      padding: 12,
      borderRadius: 12,
      backgroundColor: c.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
    },
    itemImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      backgroundColor: c.surfaceMuted,
    },
    itemInfo: {
      flex: 1,
      marginLeft: 12,
    },
    itemTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
      marginBottom: 4,
    },
    itemPriceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    itemCurrentPrice: {
      fontSize: 16,
      fontWeight: '700',
      color: c.primary,
    },
    itemOriginalPrice: {
      fontSize: 13,
      color: c.strike,
      textDecorationLine: 'line-through',
    },
    lineTotal: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    stockNote: {
      marginTop: 4,
      fontSize: 12,
      color: c.warning,
    },
    removeButton: {
      margin: 0,
      marginLeft: 4,
    },
    separator: {
      height: 12,
    },
    couponCard: {
      marginTop: 16,
      borderRadius: 12,
      backgroundColor: c.surface,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
      marginBottom: 8,
    },
    couponRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    couponInput: {
      flex: 1,
      backgroundColor: c.surface,
    },
    appliedCoupon: {
      fontSize: 15,
      fontWeight: '600',
      color: c.success,
    },
    summaryContainer: {
      marginTop: 16,
      padding: 16,
      borderRadius: 12,
      backgroundColor: c.surface,
    },
    shippingHint: {
      fontSize: 13,
      color: c.primary,
      marginBottom: 4,
    },
    checkoutButton: {
      marginTop: 16,
      borderRadius: 8,
    },
  });
