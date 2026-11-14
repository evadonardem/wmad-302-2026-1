/**
 * Home Screen Styles - Cookbook
 */
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFDF8',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  pageContent: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
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
    color: '#8D6E63',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#C62828',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
  hero: {
    position: 'relative',
    minHeight: 240,
    justifyContent: 'center',
    padding: 24,
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 32,
  },
  heroBackgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    left: 0,
    top: 0,
  },
  heroImageOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  heroWide: {
    minHeight: 280,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 32,
  },
  heroCopy: {
    width: '68%',
    maxWidth: 660,
  },
  heroCopyCompact: {
    width: '100%',
    paddingRight: 30,
    paddingBottom: 66,
  },
  heroEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },
  heroEyebrowText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontFamily: 'Sail',
    fontSize: 54,
    lineHeight: 62,
    color: '#FFFFFF',
  },
  heroTitleCompact: {
    fontSize: 36,
    lineHeight: 42,
  },
  heroSubtitle: {
    maxWidth: 470,
    color: 'rgba(255,255,255,0.94)',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 8,
  },
  heroButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 24,
    marginTop: 20,
  },
  heroButtonText: {
    color: '#E85D04',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionEyebrow: {
    color: '#E85D04',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3E2723',
    marginVertical: 0,
  },
  seeAll: {
    paddingLeft: 12,
    paddingVertical: 4,
  },
  textAction: {
    color: '#E85D04',
    fontSize: 13,
    fontWeight: '700',
    paddingVertical: 8,
  },
  categoryList: {
    gap: 10,
  },
  categoryChip: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  categoryChipGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryChipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  countryButton: {
    marginTop: 8,
    borderRadius: 18,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  countryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  countryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    paddingRight: 4,
  },
  recipeCard: {
    marginBottom: 12,
  },
  recipeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    columnGap: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0E4DA',
  },
  imageContainer: {
    position: 'relative',
    height: 144,
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
    backgroundColor: '#E8F5E9',
  },
  medium: {
    backgroundColor: '#FFF3E0',
  },
  hard: {
    backgroundColor: '#FDEDED',
  },
  cardContent: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3E2723',
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202124',
    marginBottom: 8,
  },
  productCategory: {
    fontSize: 12,
    color: '#1A73E8',
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
    backgroundColor: '#FFF3E0',
  },
  mealChip: {
    backgroundColor: '#E8F5E9',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    flexShrink: 1,
    fontSize: 11,
    color: '#8D6E63',
    fontWeight: '500',
    lineHeight: 16,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cuisineText: {
    flexShrink: 0,
    fontSize: 11,
    color: '#E85D04',
    fontWeight: '600',
    textAlign: 'right',
  },
  collectionCaption: {
    fontSize: 12,
    color: '#8D6E63',
    marginTop: 2,
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
    color: '#1A73E8',
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
    height: 8,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8D6E63',
  },
});
