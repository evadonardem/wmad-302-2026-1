
/**
 * Search Screen Styles - Green and White Theme
 */

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FAF3',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  searchBarContainer: {
    marginBottom: 16,
  },
  searchInput: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCEBD8',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1B5E20',
  },
  clearButton: {
    padding: 8,
  },
  searchButton: {
    backgroundColor: '#43A52F',
    borderRadius: 14,
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
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 12,
  },
  filterList: {
    paddingHorizontal: 4,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C8DFC2',
    backgroundColor: '#FFFFFF',
  },
  filterChipSelected: {
    backgroundColor: '#43A52F',
    borderColor: '#43A52F',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
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
    borderColor: '#C8DFC2',
    backgroundColor: '#FFFFFF',
  },
  sortChipSelected: {
    backgroundColor: '#43A52F',
    borderColor: '#43A52F',
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2E7D32',
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
    color: '#1B5E20',
    marginBottom: 16,
  },
  resultsList: {
    paddingBottom: 20,
  },
  resultCard: {
    marginBottom: 10,
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    elevation: 2,
  },
  resultContent: {
    flexDirection: 'row',
    padding: 12,
  },
  resultImage: {
    width: 88,
    height: 88,
    borderRadius: 12,
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  resultCategory: {
    fontSize: 11,
    color: '#43A52F',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B5E20',
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
    color: '#2E7D32',
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
    backgroundColor: '#E8F5E9',
  },
  cuisineChip: {
    backgroundColor: '#F1F8EE',
  },
  resultDetails: {
    fontSize: 12,
    color: '#668064',
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
    fontWeight: '700',
    color: '#1B5E20',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#668064',
    marginTop: 4,
    textAlign: 'center',
  },
  separator: {
    height: 8,
  },
  guideContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C8DFC2',
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 8,
  },
  guideText: {
    fontSize: 13,
    color: '#426B40',
    lineHeight: 20,
  },
});
