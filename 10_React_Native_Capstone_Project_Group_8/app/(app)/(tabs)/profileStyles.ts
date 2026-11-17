
/**
 * Profile Screen Styles
 * Dynamic light and dark theme support.
 */

import { StyleSheet } from 'react-native';
import type { MD3Theme } from 'react-native-paper';

export const createProfileStyles = (
  colors: MD3Theme['colors'],
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      paddingHorizontal: 18,
      paddingTop: 24,
      paddingBottom: 40,
    },

    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 24,
      gap: 14,
    },

    notLoggedIn: {
      fontSize: 16,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 26,
      gap: 17,
    },

    avatarContainer: {
      position: 'relative',
    },

    avatar: {
      backgroundColor: colors.primary,
    },

    verifiedBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 25,
      height: 25,
      borderRadius: 13,
      backgroundColor: colors.tertiary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: colors.background,
    },

    nameContainer: {
      flex: 1,
    },

    eyebrow: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.4,
      color: colors.primary,
      marginBottom: 5,
    },

    name: {
      fontSize: 23,
      fontWeight: '800',
      color: colors.onSurface,
    },

    username: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      marginTop: 3,
    },

    email: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 5,
    },

    statsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      backgroundColor: colors.surface,
      borderRadius: 18,
      paddingVertical: 19,
      paddingHorizontal: 8,
      marginBottom: 29,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },

    statItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },

    statValue: {
      fontSize: 19,
      fontWeight: '800',
      color: colors.onSurface,
    },

    statLabel: {
      fontSize: 11,
      fontWeight: '500',
      color: colors.onSurfaceVariant,
    },

    statDivider: {
      width: 1,
      height: 53,
      backgroundColor: colors.outlineVariant,
    },

    section: {
      marginBottom: 23,
    },

    sectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.1,
      color: colors.onSurfaceVariant,
      marginBottom: 11,
      marginLeft: 3,
    },

    menuCard: {
      backgroundColor: colors.surface,
      borderRadius: 17,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      elevation: 1,
    },

    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 78,
      paddingHorizontal: 15,
      paddingVertical: 12,
    },

    menuIconContainer: {
      width: 43,
      height: 43,
      borderRadius: 13,
      backgroundColor: colors.primaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 13,
    },

    menuTextContainer: {
      flex: 1,
      justifyContent: 'center',
      marginRight: 8,
    },

    menuTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.onSurface,
    },

    menuDescription: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
      marginTop: 4,
      lineHeight: 16,
    },

    divider: {
      marginLeft: 71,
      backgroundColor: colors.outlineVariant,
    },

    logoutContainer: {
      marginTop: 4,
      marginBottom: 15,
    },

    logoutButton: {
      borderRadius: 13,
      borderWidth: 1.3,
      borderColor: colors.error,
      height: 51,
    },

    logoutButtonContent: {
      height: 50,
    },

    version: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 18,
      gap: 6,
    },

    versionText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.onSurfaceVariant,
    },

    versionSubtext: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
      opacity: 0.8,
    },
  });
