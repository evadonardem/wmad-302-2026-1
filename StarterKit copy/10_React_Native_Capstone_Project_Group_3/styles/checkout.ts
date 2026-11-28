/**
 * Checkout Styles
 */
import { StyleSheet } from 'react-native';
import type { Palette } from '@/constants/palettes';

export const makeCheckoutStyles = (c: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    flex: {
      flex: 1,
    },
    slotGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 4,
    },
    addressChips: {
      gap: 8,
      paddingBottom: 12,
    },
    radio: {
      paddingHorizontal: 0,
    },
    giftRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    giftLabel: {
      flex: 1,
      fontSize: 15,
      color: c.text,
    },
    giftInput: {
      marginTop: 8,
      backgroundColor: c.surface,
    },
    errorBox: {
      padding: 12,
      marginBottom: 12,
      borderRadius: 8,
      backgroundColor: c.dangerContainer,
    },
    errorText: {
      color: c.danger,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 8,
    },
    fullButton: {
      borderRadius: 8,
      marginTop: 8,
      alignSelf: 'stretch',
    },
    confirmation: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
    },
    successIcon: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.success,
    },
    successTitle: {
      marginTop: 20,
      fontSize: 26,
      fontWeight: '700',
      color: c.text,
    },
    successText: {
      marginTop: 8,
      marginBottom: 24,
      fontSize: 15,
      color: c.textMuted,
      textAlign: 'center',
    },
    confirmationCard: {
      alignSelf: 'stretch',
    },
    deliverTo: {
      flex: 1,
      textAlign: 'right',
      marginLeft: 16,
    },
  });
