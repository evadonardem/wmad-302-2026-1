/**
 * Search Screen Styles - Shared base
 */
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EC',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  searchBarContainer: {
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    height: 52,
    backgroundColor: '#FFFEFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DED8CB',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#332F28',
  },
  clearButton: {
    padding: 8,
  },
  searchButton: {
    backgroundColor: '#708066',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#332F28',
    fontFamily: 'Georgia',
    marginBottom: 12,
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
    borderColor: '#DED8CB',
    backgroundColor: '#FFFEFA',
  },
  filterChipSelected: {
    backgroundColor: '#708066',
    borderColor: '#708066',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#625B50',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceFilters: {
    flexDirection: 'row',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#FFFEFA',
  },
  priceError: {
    color: '#D93025',
    fontSize: 13,
    marginTop: 6,
  },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DED8CB',
    backgroundColor: '#FFFEFA',
  },
  sortChipSelected: {
    backgroundColor: '#708066',
    borderColor: '#708066',
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#625B50',
  },
  sortChipTextSelected: {
    color: '#FFFFFF',
  },
  resultsSection: {
    marginTop: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#332F28',
    fontFamily: 'Georgia',
    marginBottom: 16,
  },
  resultsList: {
    paddingBottom: 20,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  resultCard: {
    width: '50%',
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  card: {
    borderRadius: 12,
    backgroundColor: '#FFFEFA',
    borderWidth: 1,
    borderColor: '#E4DFD2',
  },
  resultContent: {
    padding: 10,
  },
  resultImage: {
    width: '100%',
    height: 130,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F1EEE5',
  },
  resultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  resultCategory: {
    fontSize: 11,
    color: '#708066',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#332F28',
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
    color: '#708066',
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
    backgroundColor: '#EEE5D9',
  },
  cuisineChip: {
    backgroundColor: '#EDF0E3',
  },
  resultDetails: {
    fontSize: 12,
    color: '#625B50',
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
    color: '#332F28',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#625B50',
    marginTop: 4,
  },
  separator: {
    height: 8,
  },
  loadingMore: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
});