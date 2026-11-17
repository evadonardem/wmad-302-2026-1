import { StyleSheet, Platform } from 'react-native';

export interface CartBreakpointMetrics {
  isAnyDesktop: boolean;
  isUltraWide: boolean;
  isTablet: boolean;
  isMobile: boolean;
  isSmallPhone: boolean;
  numColumns: number;
  horizontalPadding: number;
}

export const getCartBreakpointMetrics = (width: number): CartBreakpointMetrics => {
  const isUltraWide = width >= 1600;
  const isAnyDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;
  const isSmallPhone = width <= 375;

  const numColumns = isUltraWide ? 6 : isAnyDesktop ? 5 : isTablet ? 3 : 2;
  const horizontalPadding = isAnyDesktop ? 16 : isTablet ? 14 : 10;

  return {
    isAnyDesktop,
    isUltraWide,
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
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  checkoutContainer: {
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
    width: 340,
    height: 340,
    borderRadius: 999,
  },
  ambientOrbTopRight: {
    position: 'absolute',
    top: 40,
    right: -110,
    width: 320,
    height: 320,
    borderRadius: 999,
  },
  ambientOrbCenter: {
    position: 'absolute',
    top: '38%',
    left: '16%',
    width: 380,
    height: 380,
    borderRadius: 999,
  },
  ambientOrbBottomLeft: {
    position: 'absolute',
    bottom: 60,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 999,
  },
  ambientOrbBottomRight: {
    position: 'absolute',
    bottom: -95,
    right: -85,
    width: 340,
    height: 340,
    borderRadius: 999,
  },
  topHeaderBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 58,
    paddingVertical: 4,
  },
  headerBackText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  headerCenterBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerTitleText: {
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  headerAddressTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(254, 44, 85, 0.08)',
    maxWidth: '100%',
  },
  headerAddressText: {
    fontSize: 11.5,
    fontWeight: '600',
    flexShrink: 1,
  },
  headerRightBtn: {
    minWidth: 58,
    alignItems: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  headerEditText: {
    fontSize: 14,
    fontWeight: '800',
  },
  editActionBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    zIndex: 9,
  },
  listAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  editButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moveFavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  moveFavText: {
    fontSize: 12,
    fontWeight: '800',
  },
  deleteSelectedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FE2C55',
    backgroundColor: 'rgba(254, 44, 85, 0.1)',
  },
  deleteSelectedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FE2C55',
  },
  glassCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)' }
      : {
          elevation: 2,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
        }),
  },
  orderSummaryCardLong: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 26,
    paddingHorizontal: 24,
    marginTop: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 12px 32px rgba(15, 23, 42, 0.07)' }
      : {
          elevation: 3,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.07,
          shadowRadius: 12,
        }),
  },
  shippingProgressCard: {
    width: '100%',
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  shippingProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  shippingProgressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
    overflow: 'hidden',
  },
  shippingProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  cartItemCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.2,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    gap: 10,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)' }
      : {
          elevation: 2,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        }),
  },
  cartItemThumb: {
    borderRadius: 12,
  },
  cartItemInfo: {
    flex: 1,
    gap: 4,
  },
  cartItemTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    lineHeight: 20,
  },
  cartItemVariationPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    marginTop: 2,
  },
  cartItemVariationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cartItemBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  freeReturnBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
  },
  freeReturnBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  authenticBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: 'rgba(254, 44, 85, 0.12)',
  },
  authenticBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FE2C55',
  },
  cartItemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  cartItemPrice: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#FE2C55',
  },
  cartItemOriginalPrice: {
    fontSize: 11.5,
    textDecorationLine: 'line-through',
  },
  cartItemDiscountTag: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: 'rgba(254, 44, 85, 0.14)',
  },
  cartItemDiscountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FE2C55',
  },
  qtyStepperBox: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  qtyStepperValue: {
    fontSize: 13,
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 14,
  },
  summaryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 7,
    gap: 12,
  },
  summaryLabel: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  dividerLine: {
    height: 1,
    width: '100%',
    marginVertical: 14,
  },
  recCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 22px rgba(15, 23, 42, 0.05)' }
      : {
          elevation: 2,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        }),
  },
  recImageBox: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 10,
  },
  recImage: {
    width: '88%',
    height: '88%',
  },
  recBadgeTopLeft: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FE2C55',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  recBody: {
    gap: 4,
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
  recDiscountPill: {
    backgroundColor: 'rgba(254, 44, 85, 0.14)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  recDiscountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FE2C55',
  },
  recTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  recRatingText: {
    fontWeight: '600',
  },
  stickyBottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 14,
    zIndex: 20,
  },
  stickyBottomMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  checkoutSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  checkoutSectionTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  addressCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addressIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(254, 44, 85, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressNamePhone: {
    fontSize: 14,
    fontWeight: '800',
  },
  addressFullText: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
  },
  orderNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  protectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  protectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  protectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  protectionFeeText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FE2C55',
  },
  protectionDesc: {
    fontSize: 12,
    lineHeight: 17.5,
  },
  learnMoreLink: {
    color: '#FE2C55',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  deliveryDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  couponTriggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  paymentOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.2,
    marginBottom: 8,
    gap: 10,
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  paymentBrandBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FE2C55',
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: 'rgba(254, 44, 85, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(254, 44, 85, 0.25)',
  },
  savingsBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#FE2C55',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingTop: 14,
    paddingHorizontal: 16,
  },
  modalCenterOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalDialogBox: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: '900',
  },
});