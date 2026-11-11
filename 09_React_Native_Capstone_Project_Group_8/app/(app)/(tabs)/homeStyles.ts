
/**
 * Home Screen Styles - Green Cookbook Design
 */

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#43A52F',
  },

  scrollContent: {
    paddingBottom: 30,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#43A52F',
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#43A52F',
  },

  errorText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },

  retryButton: {
    marginTop: 8,
  },

  welcomeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    backgroundColor: '#43A52F',
  },

  welcomeTextContainer: {
    flex: 1,
  },

  welcomeGreeting: {
    fontSize: 15,
    fontWeight: '500',
    color: '#E8F5E9',
  },

  welcomeSubtitle: {
    fontSize: 23,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },

  welcomeAvatar: {
    backgroundColor: '#2E7D32',
  },

  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  seeAll: {
    paddingVertical: 4,
  },

  seeAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  categoryList: {
    paddingHorizontal: 2,
    gap: 8,
  },

  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },

  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#43A52F',
  },

  recipeCard: {
    width: 280,
    marginBottom: 8,
  },

  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },

  imageContainer: {
    position: 'relative',
    height: 160,
  },

  recipeImage: {
    width: '100%',
    height: '100%',
  },

  productImage: {
    width: '100%',
    height: '100%',
  },

  difficultyBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },

  difficultyChip: {
    borderRadius: 12,
  },

  easy: {
    backgroundColor: '#C8E6C9',
  },

  medium: {
    backgroundColor: '#FFF3CD',
  },

  hard: {
    backgroundColor: '#FFCDD2',
  },

  cardContent: {
    padding: 14,
  },

  recipeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 8,
  },

  productTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202124',
    marginBottom: 8,
  },

  productCategory: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'capitalize',
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  metaText: {
    fontSize: 11,
    color: '#687868',
    fontWeight: '500',
  },

  cuisineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },

  cuisineChip: {
    backgroundColor: '#E8F5E9',
  },

  mealChip: {
    backgroundColor: '#F1F8E9',
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ratingText: {
    fontSize: 13,
    color: '#52634F',
    fontWeight: '600',
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },

  currentPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
  },

  originalPrice: {
    fontSize: 14,
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
  },

  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
  },

  cardSeparator: {
    width: 12,
  },

  featuredList: {
    paddingBottom: 8,
  },

  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});
