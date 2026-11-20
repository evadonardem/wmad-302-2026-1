/**
 * Search Screen Styles - Shared base
 */
import { StyleSheet } from 'react-native';
import { fontFamily, makeStyles } from '@/constants/theme';

export const useSearchStyles = makeStyles((c) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 100,
    },
    searchBarContainer: {
      marginTop: 16,
      marginBottom: 16,
    },
    searchInput: {
      fontFamily: fontFamily.regular,
      height: 52,
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 16,
      fontSize: 16,
      color: c.onSurface,
    },
    clearButton: {
      padding: 8,
    },
    searchButton: {
      backgroundColor: c.primary,
      borderRadius: 12,
      paddingHorizontal: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 4,
    },
    filterSection: {
      marginBottom: 20,
    },
    sortSection: {
      marginBottom: 20,
    },
    filterTitle: {
      fontFamily: fontFamily.semibold,
      fontSize: 16,
      color: c.onSurface,
      marginBottom: 12,
    },
    filterList: {
      paddingHorizontal: 4,
      gap: 8,
    },
    resultsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 8,
    },
    suggestions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
      marginTop: 16,
      paddingHorizontal: 16,
    },
    suggestionChip: {
      borderRadius: 999,
    },
    emptyEmoji: {
      fontFamily: fontFamily.regular,
      fontSize: 56,
    },
    retryButton: {
      marginTop: 16,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    filterChipSelected: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    filterChipText: {
      fontFamily: fontFamily.medium,
      fontSize: 13,
      color: c.primary,
    },
    filterChipTextSelected: {
      color: c.onPrimary,
    },
    sortOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    sortChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    sortChipSelected: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    sortChipText: {
      fontFamily: fontFamily.medium,
      fontSize: 13,
      color: c.primary,
    },
    sortChipTextSelected: {
      color: c.onPrimary,
    },
    resultsSection: {
      marginTop: 8,
    },
    resultsTitle: {
      fontFamily: fontFamily.bold,
      fontSize: 18,
      color: c.onSurface,
      marginBottom: 0,
    },
    resultsList: {
      paddingBottom: 20,
    },
    resultCard: {
      marginBottom: 8,
    },
    card: {
      borderRadius: 12,
      backgroundColor: c.surface,
    },
    resultContent: {
      flexDirection: 'row',
      padding: 12,
    },
    resultImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      marginRight: 12,
    },
    resultInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    resultTitle: {
      fontFamily: fontFamily.semibold,
      fontSize: 15,
      color: c.onSurface,
      marginBottom: 4,
    },
    resultMeta: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 4,
    },
    difficultyChip: {
      backgroundColor: c.primaryContainer,
    },
    cuisineChip: {
      backgroundColor: c.tertiaryContainer,
    },
    resultDetails: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      color: c.muted,
    },
    loadingCenter: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    emptyState: {
      paddingVertical: 60,
      alignItems: 'center',
    },
    emptyText: {
      fontFamily: fontFamily.semibold,
      fontSize: 18,
      color: c.onSurface,
      marginTop: 16,
    },
    emptySubtext: {
      fontFamily: fontFamily.regular,
      fontSize: 14,
      color: c.muted,
      marginTop: 4,
    },
    separator: {
      height: 8,
    },
  })
);
