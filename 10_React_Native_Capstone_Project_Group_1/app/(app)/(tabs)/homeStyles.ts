/**
 * Home / Products Screen Styles - Marketplace
 * Responsive Breakpoints & Glassmorphic Styles for Website, Tablet & Phones (Realme, iPhone, Samsung, etc.)
 */
import { StyleSheet, Platform } from 'react-native';

export interface HomeBreakpointMetrics {
  isLargeDesktop: boolean;
  isAnyDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
  isSmallPhone: boolean;
  numColumns: number;
  horizontalPadding: number;
  actionIconSize: number;
  actionBoxSize: number;
  actionItemGap: number;
}

export function getHomeBreakpointMetrics(width: number): HomeBreakpointMetrics {
  const isLargeDesktop = width >= 1400;
  const isAnyDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;
  const isSmallPhone = width <= 375;

  const numColumns = isLargeDesktop ? 6 : isAnyDesktop ? 4 : isTablet ? 3 : 2;
  const horizontalPadding = isAnyDesktop ? 18 : isTablet ? 14 : isSmallPhone ? 8 : 10;
  const actionIconSize = isAnyDesktop ? 24 : isTablet ? 23 : isSmallPhone ? 20 : 22;
  const actionBoxSize = isAnyDesktop ? 52 : isTablet ? 48 : isSmallPhone ? 42 : 46;
  const actionItemGap = isAnyDesktop ? 24 : isTablet ? 18 : isSmallPhone ? 10 : 14;

  return {
    isLargeDesktop,
    isAnyDesktop,
    isTablet,
    isMobile,
    isSmallPhone,
    numColumns,
    horizontalPadding,
    actionIconSize,
    actionBoxSize,
    actionItemGap,
  };
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  ambientBackgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  ambientOrbTopLeft: {
    position: 'absolute',
    top: -110,
    left: -90,
    width: 320,
    height: 320,
    borderRadius: 999,
  },
  ambientOrbTopRight: {
    position: 'absolute',
    top: 40,
    right: -110,
    width: 300,
    height: 300,
    borderRadius: 999,
  },
  ambientOrbCenter: {
    position: 'absolute',
    top: '42%',
    left: '28%',
    width: 340,
    height: 340,
    borderRadius: 999,
  },
  ambientOrbBottomRight: {
    position: 'absolute',
    bottom: -100,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 999,
  },

  listContent: {
    paddingTop: Platform.OS === 'web' ? 14 : 10,
    paddingBottom: 34,
    width: '100%',
  },
  headerSection: {
    width: '100%',
    marginBottom: 6,
  },

  // 1. Hero Greeting & Search Products Trigger Bar
  heroHeaderCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  greetingTitleGroup: {
    flex: 1,
  },
  greetingEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  greetingEyebrowText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FE2C55',
    letterSpacing: 0.3,
  },
  greetingHeadline: {
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  greetingSubtext: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  heroBalanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  heroBalanceText: {
    fontSize: 12.5,
    fontWeight: '900',
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchTriggerFlex: {
    flex: 1,
  },
  searchBarShell: {
    height: 44,
    borderRadius: 999,
    borderWidth: 1.3,
    paddingLeft: 14,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchPlaceholderText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
  },
  searchPillChip: {
    backgroundColor: '#FE2C55',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  searchPillChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  desktopMenuButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  desktopMenuBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FE2C55',
    color: '#FFFFFF',
    fontWeight: '900',
  },

  // 2. Quick Action Bar (NO long white container behind the buttons)
  actionStripWrapper: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: 4,
    marginBottom: 12,
  },
  actionScrollContent: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    backgroundColor: 'transparent',
  },
  actionItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    backgroundColor: 'transparent',
  },
  actionIconBox: {
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bonusPillBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#FE2C55',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 999,
  },
  bonusPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  actionCountBadge: {
    position: 'absolute',
    top: -5,
    right: -6,
    backgroundColor: '#FE2C55',
    color: '#FFFFFF',
    fontWeight: '900',
  },
  actionLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },

  // 3. Rewards & Voucher Highlight Strip
  promoBanner: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  promoBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  promoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(254, 44, 85, 0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoBannerTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  promoBannerSubtitle: {
    fontSize: 11.5,
    marginTop: 1,
  },
  promoBannerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(254, 44, 85, 0.12)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  promoBannerCtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FE2C55',
  },

  // 4. Horizontal Category Navigation Bar
  categoryBarWrapper: {
    borderBottomWidth: 1,
    marginBottom: 14,
    position: 'relative',
  },
  categoryScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    paddingHorizontal: 2,
    position: 'relative',
  },
  categoryTabItem: {
    paddingVertical: 4,
  },
  categoryTabText: {
    letterSpacing: -0.1,
  },
  categoryUnderline: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#FE2C55',
  },

  // 5. Flash Deals Section
  flashSectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 13,
    marginBottom: 16,
  },
  flashHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  flashTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flashTitleText: {
    fontSize: 16,
    fontWeight: '900',
  },
  liveBadge: {
    backgroundColor: '#FE2C55',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeMoreText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FE2C55',
  },
  flashDealsScrollContent: {
    gap: 10,
    paddingRight: 4,
  },
  flashDealCard: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
    overflow: 'hidden',
  },
  flashDealImageBox: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    position: 'relative',
  },
  flashDealImage: {
    width: '86%',
    height: '86%',
  },
  flashDealCornerBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#FE2C55',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  flashDealCornerText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  flashDealBody: {
    padding: 9,
    gap: 4,
  },
  flashDealTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  flashDealPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  flashDealPrice: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#FE2C55',
  },
  flashDealOriginalPrice: {
    fontSize: 10.5,
    textDecorationLine: 'line-through',
  },
  flashSoldPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(254, 44, 85, 0.11)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  flashSoldText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FE2C55',
  },

  // 6. Recommended for You Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 2,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionAccentBar: {
    width: 4,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#FE2C55',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  sectionCountPill: {
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 999,
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: '800',
  },

  // Product Grid Card
  productCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 8px 22px rgba(15, 23, 42, 0.05)' } as any)
      : {
          elevation: 2,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        }),
  },
  productImageBox: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    position: 'relative',
  },
  productImage: {
    width: '88%',
    height: '88%',
  },
  productFlashBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FE2C55',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  productFlashBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  productDiscountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FE2C55',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  productDiscountBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  productBody: {
    gap: 5,
  },
  productTitle: {
    fontWeight: '700',
    lineHeight: 17,
    minHeight: 34,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 5,
  },
  productCurrentPrice: {
    fontWeight: '900',
    color: '#FE2C55',
  },
  productOriginalPrice: {
    fontSize: 11,
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  inlineDiscountTag: {
    backgroundColor: 'rgba(254, 44, 85, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  inlineDiscountTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FE2C55',
  },
  promoTagsRow: {
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
    marginTop: 1,
  },
  ratingText: {
    fontWeight: '600',
  },

  // Empty & Infinite Scroll Footer States
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingSubtitle: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  footerContainer: {
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 12.5,
    fontWeight: '600',
  },

  // Flash Deals Modal
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    paddingTop: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  modalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
});