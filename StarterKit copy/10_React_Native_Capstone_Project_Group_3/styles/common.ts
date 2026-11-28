/**
 * Styles shared by several app screens. Use with `useThemedStyles(makeCommon)`.
 */
import { StyleSheet } from 'react-native';
import type { Palette } from '@/constants/palettes';

export const makeCommon = (c: Palette) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: c.background,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
      width: '100%',
      maxWidth: 760,
      alignSelf: 'center',
    },
    card: {
      borderRadius: 12,
      backgroundColor: c.surface,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
      marginBottom: 12,
    },
    text: {
      fontSize: 14,
      color: c.text,
    },
    muted: {
      fontSize: 14,
      color: c.textMuted,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    input: {
      backgroundColor: c.surface,
    },
    primaryButton: {
      borderRadius: 8,
    },
    buttonContent: {
      paddingVertical: 6,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 15,
      color: c.textMuted,
    },
    listFooter: {
      paddingVertical: 24,
      alignItems: 'center',
    },
    footerError: {
      fontSize: 13,
      color: c.danger,
    },
    gridRow: {
      paddingHorizontal: 16,
      gap: 12,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 15,
      color: c.textMuted,
    },
    summaryValue: {
      fontSize: 15,
      color: c.text,
      fontWeight: '500',
    },
    summaryDiscount: {
      fontSize: 15,
      color: c.success,
      fontWeight: '600',
    },
    summaryTotalLabel: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
    },
    summaryTotalValue: {
      fontSize: 20,
      fontWeight: '700',
      color: c.primary,
    },
    divider: {
      marginVertical: 12,
    },
  });
