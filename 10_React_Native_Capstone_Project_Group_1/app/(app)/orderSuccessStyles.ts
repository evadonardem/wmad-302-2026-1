/**
 * Order Successful Styles - Marketplace
 * Responsive glassmorphism styling for Website Desktop, Tablet, and Mobile Phones (Realme, iPhone, Samsung).
 */
import { StyleSheet, Platform } from 'react-native';

export interface OrderSuccessBreakpointMetrics {
  isLargeDesktop: boolean;
  isDesktop: boolean;
  isAnyDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
  isSmallPhone: boolean;
  numColumns: number;
  horizontalPadding: number;
}

export const getOrderSuccessBreakpointMetrics = (
  width: number
): OrderSuccessBreakpointMetrics => {
  const isLargeDesktop = width >= 1400;
  const isDesktop = width >= 1024 && width < 1400;
  const isAnyDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;
  const isSmallPhone = width <= 375;

  const numColumns = isLargeDesktop ? 6 : isDesktop ? 4 : isTablet ? 3 : 2;
  const horizontalPadding = isAnyDesktop ? 20 : isTablet ? 14 : isSmallPhone ? 6 : 10;

  return {
    isLargeDesktop,
    isDesktop,
    isAnyDesktop,
    isTablet,
    isMobile,
    isSmallPhone,
    numColumns,
    horizontalPadding,
  };
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  ambientLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  ambientOrbTopLeft: {
    position: 'absolute',
    top: -115,
    left: -90,
    width: 340,
    height: 340,
    borderRadius: 999,
  },
  ambientOrbTopRight: {
    position: 'absolute',
    top: 30,
    right: -110,
    width: 320,
    height: 320,
    borderRadius: 999,
  },
  ambientOrbBottomCenter: {
    position: 'absolute',
    bottom: -105,
    left: '20%',
    width: 360,
    height: 360,
    borderRadius: 999,
  },

  /* ==================== TOP BAR ==================== */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    zIndex: 10,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
      },
      default: {
        elevation: 3,
      },
    }),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 58,
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 17.5,
    fontWeight: '900',
    letterSpacing: -0.2,
  },

  /* ==================== EMPTY STATE CARD ==================== */
  emptyCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    alignItems: 'center',
    zIndex: 1,
  },

  /* ==================== CELEBRATORY HERO CARD ==================== */
  thankYouCard: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
      },
    }),
  },
  confettiDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.55,
  },
  successOuterRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successInnerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 20px rgba(16, 185, 129, 0.38)',
      },
      default: {
        elevation: 4,
      },
    }),
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.13)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  verifiedPillText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  thankYouHeading: {
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  thankYouDesc: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 560,
  },
  thankYouSubNote: {
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 540,
  },

  /* ==================== PROGRESS STEPPER ==================== */
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 480,
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  stepItem: {
    alignItems: 'center',
    gap: 5,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabelActive: {
    fontSize: 11,
    fontWeight: '800',
  },
  stepLabelInactive: {
    fontSize: 11,
    fontWeight: '600',
  },
  stepLine: {
    flex: 1,
    height: 2.5,
    borderRadius: 2,
    marginHorizontal: 8,
    marginBottom: 16,
  },

  /* ==================== ORDER RECEIPT CARD ==================== */
  orderInfoCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    marginBottom: 18,
    ...Platform.select({
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
      },
    }),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  },
  statusChip: {
    backgroundColor: 'rgba(254, 44, 85, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusChipText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FE2C55',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 120,
  },
  infoValue: {
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  copyOrderIdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    flex: 1,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.13)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  paidBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  orderedItemsBox: {
    marginVertical: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  orderedItemPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orderedItemThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },

  /* ==================== RECOMMENDATIONS GRID ==================== */
  recSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  recCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
  },
  recImageBox: {
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  recImage: {
    width: '100%',
    height: '100%',
  },
  discountCornerBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FE2C55',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountCornerText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  likeHeartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recBody: {
    gap: 5,
  },
  recTitle: {
    fontWeight: '700',
    lineHeight: 17,
  },
  recPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  recCurrentPrice: {
    fontWeight: '900',
    color: '#FE2C55',
  },
  recOriginalPrice: {
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  recMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  recRatingText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  freeShipTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.13)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  freeShipTagText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 4,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(254, 44, 85, 0.11)',
    borderWidth: 1,
    borderColor: 'rgba(254, 44, 85, 0.25)',
  },
  quickAddText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FE2C55',
  },
});