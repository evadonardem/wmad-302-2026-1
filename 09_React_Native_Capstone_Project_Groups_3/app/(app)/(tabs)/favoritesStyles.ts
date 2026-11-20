/**
 * Favorites Screen Styles - Cookbook
 */
import { StyleSheet } from 'react-native';
import { fontFamily, makeStyles, spacing } from '@/constants/theme';

export const useFavoritesStyles = makeStyles((c) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      marginBottom: spacing.md,
    },
    headerTitle: {
      fontFamily: fontFamily.display,
      fontSize: 30,
      color: c.onSurface,
      paddingHorizontal: spacing.md,
    },
    headerSubtitle: {
      fontFamily: fontFamily.regular,
      fontSize: 14,
      color: c.muted,
      marginTop: 2,
      paddingHorizontal: spacing.md,
    },
    listContent: {
      paddingBottom: 110,
    },
    columns: {
      gap: 14,
      paddingHorizontal: spacing.md,
    },
    gridItem: {
      flex: 1,
      marginBottom: 14,
    },
    skeletonGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 14,
      padding: spacing.md,
    },
  })
);
