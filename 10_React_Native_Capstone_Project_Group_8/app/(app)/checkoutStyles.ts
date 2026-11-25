
/**
 * Checkout Styles - Marketplace App
 *
 * Theme-aware styles for the checkout screen.
 */

import { StyleSheet } from 'react-native';
import type { MD3Theme } from 'react-native-paper';

export const createCheckoutStyles = (theme: MD3Theme) => {
  const colors = theme.colors;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    scrollContent: {
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 35,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 22,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },

    headerTextContainer: {
      flex: 1,
    },

    headerTitle: {
      fontSize: 23,
      fontWeight: '800',
      color: colors.onBackground,
    },

    headerSubtitle: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      marginTop: 3,
    },

    section: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
    },

    sectionIcon: {
      marginRight: 9,
    },

    sectionTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.onSurface,
    },

    sectionDescription: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginBottom: 15,
      lineHeight: 18,
    },

    field: {
      marginBottom: 13,
      backgroundColor: colors.surface,
    },

    fieldLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 6,
    },

    fieldRow: {
      flexDirection: 'row',
      gap: 10,
    },

    halfField: {
      flex: 1,
    },

    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 13,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      marginTop: 10,
      backgroundColor: colors.surface,
    },

    optionCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryContainer,
    },

    optionIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 11,
    },

    optionTextContainer: {
      flex: 1,
    },

    optionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.onSurface,
    },

    optionDescription: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
      marginTop: 4,
      lineHeight: 16,
    },

    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.outline,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },

    radioOuterSelected: {
      borderColor: colors.primary,
    },

    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },

    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 11,
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
      color: colors.primary,
    },

    summaryDivider: {
      height: 1,
      backgroundColor: colors.outlineVariant,
      marginVertical: 10,
    },

    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },

    totalLabel: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.onSurface,
    },

    totalValue: {
      fontSize: 21,
      fontWeight: '900',
      color: colors.primary,
    },

    notice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.secondaryContainer,
      padding: 12,
      borderRadius: 12,
      marginBottom: 15,
    },

    noticeText: {
      flex: 1,
      fontSize: 12,
      color: colors.onSecondaryContainer,
      marginLeft: 8,
      lineHeight: 18,
    },

    placeOrderButton: {
      marginTop: 4,
      borderRadius: 12,
      paddingVertical: 5,
    },

    buttonContent: {
      height: 48,
    },

    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 30,
    },

    emptyTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.onBackground,
      marginTop: 16,
    },

    emptyText: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
      marginTop: 8,
      marginBottom: 20,
    },

    successContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 28,
    },

    successIconContainer: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 22,
    },

    successTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.onBackground,
      textAlign: 'center',
    },

    successText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 21,
      marginTop: 10,
      marginBottom: 18,
    },

    orderNumber: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.primary,
      marginBottom: 24,
    },

    continueButton: {
      width: '100%',
      borderRadius: 12,
    },
  });
};
