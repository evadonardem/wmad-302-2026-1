
/**
 * Profile Screen Styles
 * Dynamic Green Theme for Light Mode and Dark Mode.
 */

import { StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const createStyles = (colors: MD3Theme['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 120,
    },

    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },

    notLoggedIn: {
      fontSize: 16,
      color: colors.onSurfaceVariant,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      paddingVertical: 8,
    },

    avatar: {
      marginRight: 16,
      backgroundColor: colors.secondaryContainer,
    },

    nameContainer: {
      flex: 1,
    },

    name: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.onSurface,
    },

    username: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
      marginTop: 2,
    },

    email: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },

    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: colors.secondaryContainer,
      borderRadius: 16,
      paddingVertical: 20,
      marginBottom: 24,
    },

    statItem: {
      alignItems: 'center',
    },

    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
    },

    statLabel: {
      fontSize: 12,
      color: colors.onSecondaryContainer,
      marginTop: 4,
    },

    section: {
      marginBottom: 16,
    },

    menuCard: {
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },

    menuTitle: {
      color: colors.onSurface,
    },

    menuDescription: {
      color: colors.onSurfaceVariant,
    },

    divider: {
      marginLeft: 56,
      backgroundColor: colors.outlineVariant,
    },

    logoutContainer: {
      marginTop: 24,
      marginBottom: 24,
    },

    logoutButton: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary,
      height: 52,
    },

    logoutButtonContent: {
      paddingHorizontal: 24,
    },

    version: {
      alignItems: 'center',
      paddingVertical: 24,
    },

    versionText: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },

    dialog: {
      backgroundColor: colors.surface,
    },

    dialogTitle: {
      color: colors.onSurface,
    },

    input: {
      marginBottom: 12,
      backgroundColor: colors.surface,
    },

    dialogNote: {
      color: colors.onSurfaceVariant,
      fontSize: 12,
      marginTop: 4,
    },
  });
