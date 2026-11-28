/**
 * Profile Screen Styles - Marketplace
 */
import { StyleSheet } from 'react-native';
import type { Palette } from '@/constants/palettes';

export const makeProfileStyles = (c: Palette) =>
  StyleSheet.create({
    content: {
      padding: 16,
      paddingBottom: 32,
      width: '100%',
      maxWidth: 760,
      alignSelf: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      padding: 16,
      borderRadius: 24,
      backgroundColor: c.primary,
    },
    avatar: {
      backgroundColor: c.primaryContainer,
      borderWidth: 3,
      borderColor: c.onPrimary,
    },
    nameContainer: {
      flex: 1,
      marginLeft: 16,
    },
    name: {
      fontSize: 22,
      fontWeight: '700',
      color: c.onPrimary,
    },
    username: {
      fontSize: 14,
      color: c.onPrimary,
      fontWeight: '700',
      marginTop: 2,
    },
    email: {
      fontSize: 14,
      color: c.onPrimary,
      opacity: 0.85,
      marginTop: 2,
    },
    localNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      marginBottom: 16,
      borderRadius: 8,
      backgroundColor: c.primaryContainer,
    },
    localNoticeText: {
      flex: 1,
      fontSize: 13,
      color: c.text,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 16,
      marginBottom: 16,
      borderRadius: 12,
      backgroundColor: c.surface,
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
    },
    statLabel: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: 4,
    },
    menuCard: {
      borderRadius: 12,
      backgroundColor: c.surface,
      marginBottom: 16,
    },
    menuSection: {
      marginVertical: 0,
    },
    divider: {
      marginHorizontal: 16,
    },
    logoutButton: {
      borderRadius: 8,
      borderColor: c.danger,
      marginTop: 8,
    },
    versionText: {
      marginTop: 24,
      textAlign: 'center',
      fontSize: 12,
      color: c.textMuted,
    },
  });
