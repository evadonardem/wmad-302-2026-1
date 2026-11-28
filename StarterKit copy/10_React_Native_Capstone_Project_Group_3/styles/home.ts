/**
 * Home Screen Styles - Marketplace
 */
import { StyleSheet } from 'react-native';
import type { Palette } from '@/constants/palettes';

export const makeHomeStyles = (c: Palette) =>
  StyleSheet.create({
    listContent: {
      paddingBottom: 24,
    },
    sectionContainer: {
      marginTop: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    gridHeader: {
      marginTop: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
    },
    seeAllText: {
      fontSize: 14,
      color: c.primary,
      fontWeight: '600',
    },
    chipRow: {
      paddingHorizontal: 16,
      gap: 8,
    },
    countdown: {
      marginLeft: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: c.dangerContainer,
    },
    countdownText: {
      fontSize: 12,
      fontWeight: '700',
      color: c.danger,
      fontVariant: ['tabular-nums'],
    },
    dealsRow: {
      paddingHorizontal: 16,
      gap: 12,
    },
    dealCard: {
      width: 160,
      marginBottom: 4,
    },
    recentCard: {
      width: 140,
      marginBottom: 4,
    },
  });
