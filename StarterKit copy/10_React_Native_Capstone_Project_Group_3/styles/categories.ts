/**
 * Categories Screen Styles - Marketplace
 */
import { StyleSheet } from 'react-native';
import type { Palette } from '@/constants/palettes';

export const makeCategoriesStyles = (c: Palette) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 20,
      marginBottom: 12,
      backgroundColor: c.primary,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },
    pageTitle: {
      fontSize: 26,
      fontWeight: '700',
      color: c.onPrimary,
    },
    pageSubtitle: {
      fontSize: 15,
      color: c.onPrimary,
      opacity: 0.9,
      marginTop: 4,
    },
    gridContent: {
      paddingBottom: 24,
    },
    skeletonGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      paddingHorizontal: 16,
    },
    categoryCard: {
      marginBottom: 12,
    },
    card: {
      borderRadius: 12,
      backgroundColor: c.surface,
    },
    cardContent: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    iconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: c.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    categoryName: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
      textAlign: 'center',
    },
    categoryCount: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: 4,
    },
  });
