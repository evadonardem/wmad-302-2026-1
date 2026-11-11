
/**
 * Favorites Screen Styles
 * Fresh green and white Cookbook design.
 */

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#43A52F',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#43A52F',
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },

  // Empty Favorites
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },

  emptyTitle: {
    fontSize: 25,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
  },

  emptyText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#F1F8E9',
    marginTop: 10,
    textAlign: 'center',
  },

  browseButton: {
    marginTop: 28,
    borderRadius: 12,
  },

  buttonContent: {
    paddingHorizontal: 28,
    height: 48,
  },

  // Favorites list
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },

  header: {
    paddingHorizontal: 4,
    paddingTop: 20,
    paddingBottom: 22,
  },

  headerOverline: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#D9F2D3',
    marginBottom: 6,
  },

  headerTitle: {
    fontSize: 29,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  headerSubtitle: {
    fontSize: 14,
    color: '#F1F8E9',
    marginTop: 4,
  },

  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#2E8B25',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    gap: 7,
  },

  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Recipe card
  card: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },

  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },

  recipeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },

  recipeImage: {
    width: 108,
    height: 116,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
  },

  info: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 12,
    minWidth: 0,
  },

  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 7,
  },

  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 8,
  },

  difficultyChip: {
    backgroundColor: '#E8F5E9',
    height: 27,
  },

  cuisineChip: {
    backgroundColor: '#F1F8E9',
    height: 27,
  },

  chipText: {
    fontSize: 10,
    color: '#2E7D32',
    marginVertical: 0,
    marginHorizontal: 7,
  },

  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },

  details: {
    fontSize: 11,
    color: '#687868',
    fontWeight: '500',
    marginRight: 5,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
    gap: 3,
  },

  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#52634F',
  },

  favoriteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },

  separator: {
    height: 12,
  },
});
