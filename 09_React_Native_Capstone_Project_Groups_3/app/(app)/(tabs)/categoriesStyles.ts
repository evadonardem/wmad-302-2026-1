/**
 * Categories Screen Styles
 */
import { StyleSheet } from 'react-native';
import { fontFamily, makeStyles } from '@/constants/theme';

export const useCategoriesStyles = makeStyles((c) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    pageTitle: {
      fontFamily: fontFamily.display,
      fontSize: 28,
      color: c.onSurface,
      marginBottom: 4,
    },
    pageSubtitle: {
      fontFamily: fontFamily.regular,
      fontSize: 16,
      color: c.muted,
      marginBottom: 20,
    },
    gridWrapper: {
      justifyContent: 'space-between',
    },
    gridContent: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 100,
    },
    categoryCard: {
      marginBottom: 16,
    },
    card: {
      borderRadius: 16,
      backgroundColor: c.surface,
      height: '100%',
    },
    cardContent: {
      padding: 20,
      alignItems: 'center',
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: c.primaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    categoryName: {
      fontFamily: fontFamily.bold,
      fontSize: 16,
      color: c.onSurface,
      textAlign: 'center',
      marginBottom: 4,
    },
    categoryCount: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      color: c.muted,
    },
    separator: {
      height: 8,
      width: '100%',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontFamily: fontFamily.regular,
      marginTop: 16,
      fontSize: 16,
      color: c.muted,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    errorText: {
      fontFamily: fontFamily.regular,
      fontSize: 16,
      color: c.error,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: 16,
    },
    emptyText: {
      textAlign: 'center',
      color: c.muted,
      marginTop: 40,
    },
  })
);
