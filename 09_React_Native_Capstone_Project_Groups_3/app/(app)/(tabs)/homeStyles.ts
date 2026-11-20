/**
 * Home Screen Styles - Cookbook
 */
import { StyleSheet } from 'react-native';
import { fontFamily, makeStyles, radius, spacing } from '@/constants/theme';

export const useHomeStyles = makeStyles((c) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: c.background,
    },
    scrollContent: {
      paddingBottom: 110, // Space for tab bar
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
    },
    headerText: {
      flex: 1,
      paddingRight: spacing.sm,
    },
    greeting: {
      fontFamily: fontFamily.medium,
      fontSize: 15,
      color: c.muted,
    },
    headline: {
      fontFamily: fontFamily.display,
      fontSize: 30,
      lineHeight: 36,
      color: c.onSurface,
      marginTop: 2,
    },
    diceButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginHorizontal: spacing.md,
      marginBottom: spacing.lg,
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
    searchText: {
      fontFamily: fontFamily.regular,
      fontSize: 15,
      color: c.muted,
    },
    tools: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      marginBottom: spacing.lg,
    },
    tool: {
      alignItems: 'center',
      width: 76,
    },
    toolIcon: {
      width: 58,
      height: 58,
      borderRadius: 20,
      backgroundColor: c.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    toolLabel: {
      fontFamily: fontFamily.medium,
      fontSize: 12,
      color: c.onSurface,
      textAlign: 'center',
    },
    toolBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 5,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toolBadgeText: {
      fontFamily: fontFamily.bold,
      fontSize: 11,
      color: c.onPrimary,
    },
    section: {
      paddingHorizontal: spacing.md,
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontFamily: fontFamily.display,
      fontSize: 21,
      color: c.onSurface,
      marginBottom: 12,
    },
    categoryList: {
      paddingHorizontal: spacing.md,
      gap: 8,
      marginBottom: spacing.lg,
    },
    categoryChip: {
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    categoryChipText: {
      fontFamily: fontFamily.medium,
      fontSize: 14,
      color: c.onSurface,
    },
    surpriseCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginHorizontal: spacing.md,
      marginBottom: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: c.primaryContainer,
    },
    surpriseEmoji: {
      fontSize: 40,
    },
    surpriseText: {
      flex: 1,
    },
    surpriseTitle: {
      fontFamily: fontFamily.display,
      fontSize: 18,
      color: c.onPrimaryContainer,
    },
    surpriseBody: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      color: c.onPrimaryContainer,
      marginTop: 2,
    },
  })
);
