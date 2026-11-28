/**
 * Search Screen Styles - Marketplace
 */
import { StyleSheet } from 'react-native';
import type { Palette } from '@/constants/palettes';

export const makeSearchStyles = (c: Palette) =>
  StyleSheet.create({
    searchBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      marginBottom: 8,
      backgroundColor: c.primary,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },
    searchInput: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 24,
      elevation: 1,
    },
    filterButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
    },
    filterButtonActive: {
      backgroundColor: c.secondary,
    },
    filterBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 3,
      backgroundColor: c.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
    },
    historyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 4,
    },
    historyTitle: {
      flex: 1,
      fontSize: 13,
      fontWeight: '700',
      color: c.textMuted,
    },
    chipScroller: {
      flexGrow: 0,
    },
    chipRow: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      gap: 8,
    },
    sortChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: c.chip,
    },
    sortChipSelected: {
      backgroundColor: c.primaryContainer,
    },
    sortChipText: {
      fontSize: 13,
      color: c.textMuted,
      fontWeight: '500',
    },
    sortChipTextSelected: {
      color: c.primary,
      fontWeight: '700',
    },
    sheetWrapper: {
      justifyContent: 'flex-end',
      margin: 0,
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 10,
      width: '100%',
      maxWidth: 640,
      alignSelf: 'center',
    },
    sheetHandle: {
      alignSelf: 'center',
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: c.border,
      marginBottom: 10,
    },
    sheetTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: c.text,
      marginBottom: 4,
    },
    ratingRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    stockRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sheetActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    filterPanel: {
      marginHorizontal: 16,
      marginTop: 6,
      padding: 12,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    filterTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
      marginBottom: 8,
      marginTop: 4,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    priceInput: {
      flex: 1,
      backgroundColor: c.surface,
    },
    brandRow: {
      gap: 8,
      paddingBottom: 4,
    },
    clearFilters: {
      alignSelf: 'flex-end',
      marginTop: 4,
    },
    resultsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 10,
    },
    resultsList: {
      paddingBottom: 24,
      flexGrow: 1,
    },
  });
