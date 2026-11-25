/**
 * Search Styles (`searchStyles.ts`)
 * Elevated Marketplace Search UI with Layered Ambient Gradient Orbs, Glassmorphic Panels,
 * Sticky Header Controls, and Fluid Multi-Column Grid across Website, Tablet, and Phones.
 */
import { Platform, StyleSheet } from 'react-native';

const glassShadow: any =
  Platform.OS === 'web'
    ? { boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)' }
    : {
        elevation: 3,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      };

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },

  // ==================== AMBIENT BACKGROUND LAYER ====================
  ambientBackgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  ambientOrbTopLeft: {
    position: 'absolute',
    top: -120,
    left: -95,
    width: 350,
    height: 350,
    borderRadius: 999,
    backgroundColor: 'rgba(254, 44, 85, 0.11)',
  },
  ambientOrbTopRight: {
    position: 'absolute',
    top: 20,
    right: -115,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
  },
  ambientOrbCenter: {
    position: 'absolute',
    top: '38%',
    left: '16%',
    width: 370,
    height: 370,
    borderRadius: 999,
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
  },
  ambientOrbBottomLeft: {
    position: 'absolute',
    bottom: 65,
    left: -100,
    width: 290,
    height: 290,
    borderRadius: 999,
    backgroundColor: 'rgba(251, 146, 60, 0.10)',
  },
  ambientOrbBottomRight: {
    position: 'absolute',
    bottom: -100,
    right: -85,
    width: 330,
    height: 330,
    borderRadius: 999,
    backgroundColor: 'rgba(99, 102, 241, 0.10)',
  },

  // ==================== STICKY SEARCH HEADER ====================
  stickyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    zIndex: 10,
    ...glassShadow,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '800',
    marginLeft: -2,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 999,
    borderWidth: 1.4,
    paddingHorizontal: 13,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  clearButton: {
    padding: 2,
  },
  filterToggleButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterActiveDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#FE2C55',
  },

  // ==================== LIST & HEADER PANELS ====================
  listContent: {
    paddingTop: 10,
    paddingBottom: 95,
    zIndex: 1,
  },
  headerContainer: {
    gap: 12,
    marginBottom: 8,
  },
  glassPanel: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    ...glassShadow,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  panelTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    flex: 1,
    letterSpacing: -0.2,
  },
  filterSection: {
    marginTop: 4,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  filterList: {
    gap: 8,
    paddingRight: 8,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipSelected: {
    backgroundColor: '#FE2C55',
    borderColor: '#FE2C55',
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  sortSection: {
    marginBottom: 14,
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  sortChipSelected: {
    backgroundColor: 'rgba(254, 44, 85, 0.14)',
    borderColor: '#FE2C55',
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sortChipTextSelected: {
    color: '#FE2C55',
    fontWeight: '800',
  },
  panelActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.18)',
  },

  // ==================== SUGGESTIONS & DISCOVERY ====================
  suggestionPanel: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...glassShadow,
  },
  suggestionLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 13.5,
    fontWeight: '600',
    flex: 1,
  },
  discoveryBlock: {
    gap: 9,
  },
  discoveryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discoveryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  discoveryTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: -0.1,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FE2C55',
  },
  chipWrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5,
    gap: 6,
  },
  recentChipTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  recentChipText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  recentChipDelete: {
    padding: 2,
  },
  popularChipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(254, 44, 85, 0.22)',
  },
  popularChipText: {
    fontSize: 12.5,
    fontWeight: '800',
  },

  // ==================== RESULTS SUMMARY BAR ====================
  resultsSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 2,
    gap: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '900',
    flex: 1,
    letterSpacing: -0.2,
  },
  resultsCountPill: {
    backgroundColor: 'rgba(254, 44, 85, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(254, 44, 85, 0.24)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  resultsCountText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#FE2C55',
  },

  // ==================== PRODUCT GRID CARDS ====================
  card: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)' } as any)
      : {
          elevation: 2,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        }),
  },
  cardImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    padding: 8,
  },
  cardImage: {
    width: '88%',
    height: '88%',
  },
  flashBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FE2C55',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  flashBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  discountCornerBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FE2C55',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  discountCornerBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  cardBody: {
    gap: 5,
  },
  productTitle: {
    fontWeight: '700',
    lineHeight: 17,
    minHeight: 34,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  currentPrice: {
    fontWeight: '900',
    color: '#FE2C55',
  },
  originalPrice: {
    fontSize: 11,
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  inlineDiscountPill: {
    backgroundColor: 'rgba(254, 44, 85, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  inlineDiscountText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FE2C55',
  },
  promoBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  flashSaleTag: {
    backgroundColor: 'rgba(254, 44, 85, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  flashSaleTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FE2C55',
  },
  freeShippingTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  freeShippingTagText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  codTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codTagText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  ratingText: {
    fontWeight: '600',
  },

  // ==================== STATES & FOOTER ====================
  loadingCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 46,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginTop: 6,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '900',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
    maxWidth: 340,
  },
  footerContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '700',
  },
});