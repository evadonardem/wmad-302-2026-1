/**
 * Categories Screen Styles (`categoriesStyles.tsx`)
 * Elevated Marketplace UI with Layered Ambient Background Orbs, Glassmorphic Cards,
 * Responsive Scaling for Website (>=1024), Tablet (768-1023), and Phones (<768: Realme, iPhone, Samsung, Xiaomi, Oppo, Vivo).
 */
import { Platform, StyleSheet } from 'react-native';

export interface CategoriesBreakpointMetrics {
  width: number;
  isLargeDesktop: boolean;
  isDesktop: boolean;
  isAnyDesktop: boolean;
  isTablet: boolean;
  isSmallPhone: boolean;
  numColumns: number;
  horizontalPadding: number;
  bannerHeight: number;
}

export const getCategoriesBreakpointMetrics = (width: number): CategoriesBreakpointMetrics => {
  const isLargeDesktop = width >= 1400;
  const isDesktop = width >= 1024 && width < 1400;
  const isAnyDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isSmallPhone = width < 380;
  const numColumns = isLargeDesktop ? 5 : isDesktop ? 4 : isTablet ? 3 : 2;
  const horizontalPadding = isAnyDesktop ? 20 : isTablet ? 14 : 8;
  const bannerHeight = isAnyDesktop ? 104 : isTablet ? 92 : 82;

  return {
    width,
    isLargeDesktop,
    isDesktop,
    isAnyDesktop,
    isTablet,
    isSmallPhone,
    numColumns,
    horizontalPadding,
    bannerHeight,
  };
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
    left: -90,
    width: 340,
    height: 340,
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
    left: '20%',
    width: 360,
    height: 360,
    borderRadius: 999,
  },
  ambientOrbBottomRight: {
    position: 'absolute',
    bottom: -110,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 999,
  },

  // ==================== LIST & HEADER CONTAINERS ====================
  listContent: {
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: 36,
    zIndex: 1,
  },
  headerWrapper: {
    marginBottom: 8,
    gap: 12,
  },

  // ==================== HERO HEADER & SEARCH BAR ====================
  heroHeaderCard: {
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    gap: 12,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 14px 34px rgba(15, 23, 42, 0.08)',
        } as any)
      : {
          elevation: 4,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
        }),
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroTitleBlock: {
    flex: 1,
  },
  heroEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  heroEyebrowText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: '#FE2C55',
  },
  heroHeadline: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  heroSubtext: {
    fontSize: 12.5,
    marginTop: 2,
  },
  heroStatsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(254, 44, 85, 0.10)',
    borderColor: 'rgba(254, 44, 85, 0.25)',
  },
  heroStatsText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FE2C55',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    gap: 2,
  },
  backButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    paddingRight: 4,
  },
  searchBarShell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 999,
    borderWidth: 1.2,
    paddingLeft: 13,
    paddingRight: 5,
    gap: 8,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 6px 18px rgba(254, 44, 85, 0.08)',
        } as any)
      : {
          elevation: 2,
          shadowColor: '#FE2C55',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        }),
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  clearIconBtn: {
    padding: 3,
  },
  searchActionPill: {
    backgroundColor: '#FE2C55',
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? ({
          backgroundImage: 'linear-gradient(90deg, #FE2C55 0%, #FF5E7E 100%)',
          boxShadow: '0 4px 12px rgba(254, 44, 85, 0.35)',
        } as any)
      : {}),
  },
  searchActionPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // ==================== SUB-CATEGORY GROUP PILLS ====================
  subGroupScrollContent: {
    paddingHorizontal: 2,
    gap: 9,
    alignItems: 'center',
  },
  subGroupPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
        } as any)
      : {
          elevation: 1,
        }),
  },
  subGroupPillSelected: {
    backgroundColor: '#FE2C55',
    borderColor: '#FE2C55',
    ...(Platform.OS === 'web'
      ? ({
          backgroundImage: 'linear-gradient(90deg, #FE2C55 0%, #FF5E7E 100%)',
          boxShadow: '0 8px 18px rgba(254, 44, 85, 0.32)',
        } as any)
      : {
          elevation: 3,
          shadowColor: '#FE2C55',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.28,
          shadowRadius: 8,
        }),
  },
  subGroupText: {
    fontSize: 13,
    fontWeight: '700',
  },
  subGroupTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // ==================== FEATURED BRANDS SECTION ====================
  brandsSection: {
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 10px 26px rgba(15, 23, 42, 0.05)',
        } as any)
      : {
          elevation: 2,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        }),
  },
  brandsScrollContent: {
    gap: 10,
    paddingHorizontal: 2,
  },
  brandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
        } as any)
      : {
          elevation: 1,
        }),
  },
  brandThumbWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(254, 44, 85, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 4,
  },
  brandThumb: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    fontSize: 13,
    fontWeight: '800',
  },
  brandCount: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },

  // ==================== SECTION HEADERS ====================
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
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
    fontSize: 16.5,
    fontWeight: '900',
    letterSpacing: -0.25,
  },
  sectionHintText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  sectionCountPill: {
    backgroundColor: 'rgba(254, 44, 85, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 999,
  },
  sectionCountText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FE2C55',
  },

  // ==================== CATEGORY GRID CARDS ====================
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)',
        } as any)
      : {
          elevation: 2,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
        }),
  },
  bannerContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    padding: 8,
  },
  bannerImage: {
    width: '86%',
    height: '86%',
  },
  iconContainer: {
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconFloating: {
    position: 'absolute',
    bottom: -14,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 11,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 4px 10px rgba(15, 23, 42, 0.10)',
        } as any)
      : {
          elevation: 3,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 4,
        }),
  },
  iconCentered: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  cardContent: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 12,
    gap: 6,
  },
  categoryName: {
    fontSize: 14.5,
    fontWeight: '800',
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  countPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  categoryCount: {
    fontSize: 11,
    fontWeight: '800',
  },

  // ==================== LOADING, ERROR & EMPTY STATES ====================
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});