/**
 * Profile Screen Styles - Cookbook
 */
import { StyleSheet } from 'react-native';
import { fontFamily, makeStyles, radius, spacing } from '@/constants/theme';

export const useProfileStyles = makeStyles((c) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      paddingHorizontal: spacing.md,
      paddingBottom: 120,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.background,
    },
    notLoggedIn: {
      fontFamily: fontFamily.regular,
      fontSize: 16,
      color: c.muted,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    avatar: {
      marginRight: spacing.md,
      backgroundColor: c.primaryContainer,
    },
    nameContainer: {
      flex: 1,
    },
    name: {
      fontFamily: fontFamily.display,
      fontSize: 26,
      color: c.onSurface,
    },
    username: {
      fontFamily: fontFamily.semibold,
      fontSize: 14,
      color: c.primary,
      marginTop: 2,
    },
    email: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      color: c.muted,
      marginTop: 2,
    },
    statsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.primaryContainer,
      borderRadius: radius.lg,
      paddingVertical: 20,
      marginBottom: spacing.lg,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statDivider: {
      width: 1,
      height: 36,
      backgroundColor: c.accentBorder,
    },
    statValue: {
      fontFamily: fontFamily.display,
      fontSize: 26,
      color: c.primary,
    },
    statLabel: {
      fontFamily: fontFamily.medium,
      fontSize: 12,
      color: c.onPrimaryContainer,
      marginTop: 4,
    },
    sectionTitle: {
      fontFamily: fontFamily.display,
      fontSize: 20,
      color: c.onSurface,
      marginBottom: 10,
      marginTop: 4,
    },
    menuCard: {
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      marginBottom: spacing.lg,
      overflow: 'hidden',
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
    },
    menuRowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.outlineVariant,
    },
    menuIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: c.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuText: {
      flex: 1,
    },
    menuTitle: {
      fontFamily: fontFamily.semibold,
      fontSize: 15,
      color: c.onSurface,
    },
    menuDescription: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      color: c.muted,
      marginTop: 1,
    },
    historyThumb: {
      width: 40,
      height: 40,
      borderRadius: 12,
    },
    historyEmpty: {
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      marginBottom: spacing.lg,
    },
    historyEmptyText: {
      fontFamily: fontFamily.regular,
      fontSize: 14,
      lineHeight: 20,
      color: c.muted,
    },
    logoutButton: {
      borderRadius: radius.pill,
      borderColor: c.error,
    },
    logoutButtonContent: {
      paddingVertical: 6,
    },
    version: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    versionText: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      color: c.outline,
    },
  })
);
