/**
 * Search Screen Styles - Shared base
 */
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF8',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  searchHeader: {
    marginHorizontal: -16,
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
    backgroundColor: '#F3E7D3',
  },
  searchHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchHeaderCopy: {
    flex: 1,
  },
  searchHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E85D04',
  },
  pageTitle: {
    fontSize: 25,
    fontWeight: '700',
    color: '#3E2723',
    marginTop: 0,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#8D6E63',
    marginTop: 4,
    marginBottom: 12,
  },
  offlineText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7D7C8',
    marginBottom: 0,
    shadowColor: '#6D4C41',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  filtersToggle: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0D5CC',
    backgroundColor: '#FFFFFF',
  },
  filtersToggleActive: {
    backgroundColor: '#FFF3E0',
    borderColor: '#E9A870',
  },
  filtersToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterCountBadge: {
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#E85D04',
  },
  filterCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  filtersPanel: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0E3D5',
    backgroundColor: '#F7F1EA',
  },
  searchInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#3E2723',
  },
  clearButton: {
    padding: 8,
  },
  searchButton: {
    backgroundColor: '#E85D04',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3E2723',
    marginBottom: 8,
  },
  filterList: {
    paddingHorizontal: 4,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  filterChipSelected: {
    backgroundColor: '#E85D04',
    borderColor: '#E85D04',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E85D04',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  resultsSection: {
    marginTop: 8,
  },
  resultsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3E2723',
    marginBottom: 10,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFE4D9',
  },
  resultsList: {
    paddingBottom: 20,
  },
  resultCard: {
    marginBottom: 10,
  },
  card: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0E7DD',
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  resultImage: {
    width: 88,
    height: 88,
    borderRadius: 10,
  },
  recipeImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRecipeButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  recipeForm: {
    maxHeight: 420,
  },
  recipeFormInput: {
    marginBottom: 10,
  },
  recipeNumberFields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recipeNumberInput: {
    flexGrow: 1,
    flexBasis: '45%',
    marginBottom: 4,
  },
  formLabel: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  recipeOptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  recipeFormError: {
    marginTop: 8,
    fontSize: 13,
  },
  resultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  resultCategory: {
    fontSize: 11,
    color: '#E85D04',
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3E2723',
    marginBottom: 4,
  },
  resultPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A73E8',
  },
  originalPrice: {
    fontSize: 13,
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
  },
  resultMeta: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  difficultyChip: {
    backgroundColor: '#FFF3E0',
  },
  cuisineChip: {
    backgroundColor: '#E8F5E9',
  },
  resultDetails: {
    fontSize: 12,
    color: '#8D6E63',
  },
  resultFavoriteButton: {
    margin: 0,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#3E2723',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8D6E63',
    marginTop: 4,
  },
  separator: {
    height: 8,
  },
  guideContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCC80',
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E85D04',
    marginBottom: 8,
  },
  guideText: {
    fontSize: 13,
    color: '#5D4037',
    lineHeight: 20,
  },
});