/**
 * Home Screen styles - NextDoorFinds
 */
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#F7F4EC',
  },
  scrollContent: {
    paddingBottom: 100, // Space for tab bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#625B50',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#A66A5C',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
  heroContainer: {
    height: 280,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 18,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  heroImage: {
    borderRadius: 24,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(62, 53, 43, 0.20)',
  },
  heroContent: {
    width: '68%',
    maxWidth: 420,
    marginLeft: 24,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(248, 245, 237, 0.94)',
  },
  heroKicker: {
    color: '#7A6A58',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#332F28',
    fontFamily: 'Georgia',
    fontSize: 31,
    lineHeight: 36,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: '#625B50',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  heroButton: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#708066',
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  homeSearchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 2,
  },
  homeSearchInput: {
    backgroundColor: '#FFFEFA',
    borderRadius: 24,
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
    color: '#332F28',
    fontFamily: 'Georgia',
  },
  seeAll: {
    paddingVertical: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#708066',
  },
  categoryList: {
    paddingHorizontal: 4,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#FFFEFA',
    borderWidth: 1,
    borderColor: '#DED8CB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#625B50',
  },
  productCard: {
    width: '100%',
    marginBottom: 12,
  },
  productCardWide: {
    width: '50%',
    paddingHorizontal: 6,
  },
  productCardFour: {
    width: '25%',
    paddingHorizontal: 6,
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFEFA',
    borderWidth: 1,
    borderColor: '#E4DFD2',
  },
  imageContainer: {
    position: 'relative',
    height: 160,
    backgroundColor: '#F1EEE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainerWide: {
    height: 130,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  productImage: {
    width: '100%',
    height: '100%',
    maxWidth: '90%',
    maxHeight: '90%',
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
    backgroundColor: '#EDF0E3',
  },
  medium: {
    backgroundColor: '#EEE5D9',
  },
  hard: {
    backgroundColor: '#FDEDED',
  },
  cardContent: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3E2723',
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#332F28',
    marginBottom: 8,
  },
  productCategory: {
    fontSize: 12,
    color: '#708066',
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
    fontSize: 12,
    color: '#8D6E63',
    fontWeight: '500',
  },
  cuisineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  cuisineChip: {
    backgroundColor: '#EEE5D9',
  },
  mealChip: {
    backgroundColor: '#EDF0E3',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    color: '#625B50',
    fontWeight: '500',
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
    color: '#708066',
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
    backgroundColor: '#708066',
  },
  cardSeparator: {
    height: 8,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#625B50',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#625B50',
  },
  loadMoreError: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  endOfProducts: {
    color: '#625B50',
    textAlign: 'center',
    paddingVertical: 16,
  },
});