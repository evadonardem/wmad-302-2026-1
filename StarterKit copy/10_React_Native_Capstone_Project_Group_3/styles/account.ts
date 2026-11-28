/**
 * Styles for account screens (wishlist, compare, edit profile, addresses, payments, settings)
 */
import { StyleSheet } from 'react-native';
import type { Palette } from '@/constants/palettes';

export const makeAccountStyles = (c: Palette) =>
  StyleSheet.create({
    gridContent: {
      paddingTop: 16,
      paddingBottom: 24,
    },
    emptyContent: {
      flexGrow: 1,
    },
    wishlistRemove: {
      position: 'absolute',
      top: 4,
      right: 4,
      margin: 0,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    flex: {
      flex: 1,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
      marginBottom: 8,
    },
    segment: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    segmentOption: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center',
    },
    segmentOptionActive: {
      borderColor: c.primary,
      backgroundColor: c.primaryContainer,
    },
    segmentText: {
      fontSize: 14,
      fontWeight: '500',
      color: c.textMuted,
    },
    segmentTextActive: {
      color: c.primary,
      fontWeight: '700',
    },
    errorText: {
      color: c.danger,
      textAlign: 'center',
      marginBottom: 12,
    },
    itemTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
    },
    itemText: {
      fontSize: 14,
      color: c.textMuted,
      marginTop: 4,
    },
    defaultBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: c.successContainer,
    },
    defaultBadgeInset: {
      marginRight: 16,
    },
    defaultBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: c.success,
    },
    checkboxItem: {
      paddingHorizontal: 0,
    },
    checkboxLabel: {
      textAlign: 'left',
      color: c.text,
    },
    formActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 4,
    },
    groupTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
      marginLeft: 4,
    },
    settingBlock: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    settingLabel: {
      fontSize: 16,
      color: c.text,
      marginBottom: 8,
    },
    settingHint: {
      fontSize: 12,
      color: c.textMuted,
      marginTop: 6,
    },
    seasonGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    seasonCard: {
      width: '31%',
      minWidth: 92,
      flexGrow: 1,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 16,
      borderWidth: 3,
      alignItems: 'center',
      gap: 4,
    },
    seasonCardEmoji: {
      fontSize: 28,
    },
    seasonCardName: {
      fontSize: 13,
      fontWeight: '800',
    },
    swatchRow: {
      flexDirection: 'row',
      gap: 3,
    },
    swatch: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 1,
    },
    seasonCheck: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Compare
    compareHeader: {
      flexDirection: 'row',
    },
    compareLabelCell: {
      width: 110,
      paddingVertical: 10,
      paddingRight: 8,
      justifyContent: 'center',
    },
    compareCell: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    compareRow: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    compareLabel: {
      fontSize: 13,
      color: c.textMuted,
      fontWeight: '600',
    },
    compareValue: {
      fontSize: 13,
      color: c.text,
      textAlign: 'center',
    },
    compareBest: {
      color: c.success,
      fontWeight: '700',
    },
    compareImage: {
      width: 72,
      height: 72,
      borderRadius: 8,
      backgroundColor: c.surfaceMuted,
    },
    compareTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: c.text,
      textAlign: 'center',
      marginTop: 6,
    },
  });
