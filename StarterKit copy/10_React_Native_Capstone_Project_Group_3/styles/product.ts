/**
 * Product Detail Styles
 */
import { StyleSheet } from 'react-native';
import type { Palette } from '@/constants/palettes';

export const makeProductStyles = (c: Palette) =>
  StyleSheet.create({
    scrollContent: {
      paddingBottom: 24,
    },
    galleryItem: {
      height: 300,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    galleryImage: {
      width: '85%',
      height: '90%',
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      backgroundColor: c.surface,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.border,
    },
    dotActive: {
      width: 20,
      backgroundColor: c.primary,
    },
    wideRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 24,
      paddingHorizontal: 16,
    },
    wideBody: {
      flex: 1,
    },
    zoomHint: {
      fontSize: 12,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: 4,
    },
    body: {
      padding: 16,
      width: '100%',
      maxWidth: 760,
      alignSelf: 'center',
    },
    category: {
      fontSize: 13,
      color: c.primary,
      fontWeight: '600',
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: c.text,
      marginTop: 4,
    },
    ratingRow: {
      marginTop: 8,
      gap: 8,
    },
    ratingText: {
      fontSize: 14,
      color: c.textMuted,
    },
    priceRow: {
      marginTop: 12,
      gap: 10,
    },
    price: {
      fontSize: 28,
      fontWeight: '700',
      color: c.primary,
    },
    originalPrice: {
      fontSize: 16,
      color: c.strike,
      textDecorationLine: 'line-through',
    },
    discountTag: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: c.dangerContainer,
    },
    discountTagText: {
      color: c.danger,
      fontWeight: '700',
      fontSize: 13,
    },
    stock: {
      marginTop: 8,
      fontSize: 14,
      color: c.success,
      fontWeight: '500',
    },
    stockLow: {
      color: c.danger,
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 12,
    },
    tag: {
      backgroundColor: c.primaryContainer,
    },
    tagText: {
      fontSize: 12,
      color: c.primary,
    },
    description: {
      fontSize: 15,
      lineHeight: 22,
      color: c.text,
    },
    specRow: {
      flexDirection: 'row',
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    specLabel: {
      width: 110,
      fontSize: 14,
      color: c.textMuted,
    },
    specValue: {
      flex: 1,
      fontSize: 14,
      color: c.text,
    },
    review: {
      padding: 12,
      marginBottom: 10,
      borderRadius: 10,
      backgroundColor: c.surface,
      gap: 4,
    },
    myReview: {
      borderWidth: 1,
      borderColor: c.primary,
    },
    reviewer: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
    },
    reviewDate: {
      fontSize: 12,
      color: c.textMuted,
    },
    reviewComment: {
      fontSize: 14,
      color: c.text,
    },
    reviewForm: {
      padding: 12,
      marginBottom: 12,
      borderRadius: 10,
      backgroundColor: c.surface,
      gap: 8,
    },
    reviewInput: {
      backgroundColor: c.surface,
    },
    actionBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: c.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    actionButton: {
      flex: 1,
      borderRadius: 8,
    },
    inCartNote: {
      textAlign: 'center',
      fontSize: 12,
      color: c.textMuted,
      paddingBottom: 8,
      backgroundColor: c.surface,
    },
  });
