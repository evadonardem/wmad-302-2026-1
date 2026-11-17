import { StyleSheet, Platform } from 'react-native';

export interface ResponsiveMetrics {
  width: number;
  height: number;
  insetsTop: number;
  insetsBottom: number;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
  isSmallPhone: boolean;
  numColumns: number;
  edgePaddingX: number;
}

export const getResponsiveMetrics = (
  width: number,
  height: number,
  insetsTop: number,
  insetsBottom: number
): ResponsiveMetrics => {
  const isLargeDesktop = width >= 1400;
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;
  const isSmallPhone = width <= 375;

  const numColumns = isLargeDesktop ? 6 : isDesktop ? 4 : isTablet ? 3 : 2;
  const edgePaddingX = isDesktop ? 16 : isTablet ? 12 : 8;

  return {
    width,
    height,
    insetsTop,
    insetsBottom,
    isDesktop,
    isLargeDesktop,
    isTablet,
    isMobile,
    isSmallPhone,
    numColumns,
    edgePaddingX,
  };
};

export const createProfileStyles = (palette: any, metrics: ResponsiveMetrics) => {
  const { isDesktop, isTablet, isSmallPhone } = metrics;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      width: '100%',
      backgroundColor: palette.isDark ? palette.background : '#F1F5FB',
      position: 'relative',
    },
    scrollView: {
      flex: 1,
      width: '100%',
      zIndex: 1,
    },
    container: {
      width: '100%',
    },
    centeredState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: palette.isDark ? palette.background : '#F1F5FB',
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
      backgroundColor: palette.isDark
        ? 'rgba(254, 44, 85, 0.16)'
        : 'rgba(254, 44, 85, 0.12)',
    },
    ambientOrbTopRight: {
      position: 'absolute',
      top: 40,
      right: -110,
      width: 320,
      height: 320,
      borderRadius: 999,
      backgroundColor: palette.isDark
        ? 'rgba(59, 130, 246, 0.16)'
        : 'rgba(56, 189, 248, 0.15)',
    },
    ambientOrbCenter: {
      position: 'absolute',
      top: '38%',
      left: '16%',
      width: 380,
      height: 380,
      borderRadius: 999,
      backgroundColor: palette.isDark
        ? 'rgba(139, 92, 246, 0.12)'
        : 'rgba(168, 85, 247, 0.09)',
    },
    ambientOrbBottomLeft: {
      position: 'absolute',
      bottom: 60,
      left: -100,
      width: 300,
      height: 300,
      borderRadius: 999,
      backgroundColor: palette.isDark
        ? 'rgba(14, 165, 233, 0.12)'
        : 'rgba(251, 146, 60, 0.10)',
    },
    ambientOrbBottomRight: {
      position: 'absolute',
      bottom: -95,
      right: -85,
      width: 340,
      height: 340,
      borderRadius: 999,
      backgroundColor: palette.isDark
        ? 'rgba(16, 185, 129, 0.12)'
        : 'rgba(99, 102, 241, 0.10)',
    },
    heroCard: {
      backgroundColor: palette.glassSurface,
      borderWidth: 1,
      borderColor: palette.border,
      overflow: 'hidden',
      ...(Platform.OS === 'web'
        ? ({ boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)' } as any)
        : {
            elevation: 2,
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 10,
          }),
    },
    heroAccentBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isDesktop ? 22 : isTablet ? 16 : 14,
      paddingVertical: 9,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
      backgroundColor: palette.isDark
        ? 'rgba(254, 44, 85, 0.09)'
        : 'rgba(254, 44, 85, 0.05)',
    },
    heroBannerTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    heroBannerTagText: {
      fontSize: 10.5,
      fontWeight: '900',
      letterSpacing: 0.6,
      color: '#FE2C55',
    },
    heroBody: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: isSmallPhone ? 'wrap' : 'nowrap',
      gap: isDesktop ? 16 : 12,
    },
    avatarRing: {
      padding: 2.5,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: '#FE2C55',
    },
    profileInfoCol: {
      flex: 1,
      minWidth: isSmallPhone ? 150 : 120,
    },
    profileName: {
      fontSize: isSmallPhone ? 16 : isDesktop ? 20 : 18,
      fontWeight: '900',
      color: palette.textPrimary,
      letterSpacing: -0.2,
    },
    profileEmail: {
      fontSize: 12,
      color: palette.textSecondary,
      marginTop: 1,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 5,
    },
    usernameText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: palette.textMuted,
    },
    providerPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: palette.accentSoft,
    },
    providerPillText: {
      fontSize: 10.5,
      fontWeight: '800',
      color: palette.accent,
    },
    statIconCircle: {
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statValue: {
      fontWeight: '900',
      color: '#FE2C55',
    },
    statLabel: {
      color: palette.textSecondary,
      fontWeight: '700',
    },
    quickStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingVertical: 11,
      borderTopWidth: 1,
      borderTopColor: palette.border,
      backgroundColor: palette.glassInput,
    },
    quickStatItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    quickStatDivider: {
      width: 1,
      height: 18,
      backgroundColor: palette.border,
    },
    sectionHeadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
      paddingHorizontal: 2,
    },
    sectionAccentBar: {
      width: 4,
      height: 17,
      borderRadius: 999,
      backgroundColor: '#FE2C55',
    },
    activityCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: palette.glassSurface,
      borderWidth: 1,
      borderRadius: 18,
      paddingHorizontal: isSmallPhone ? 10 : 14,
      paddingVertical: isSmallPhone ? 12 : 14,
      ...(Platform.OS === 'web'
        ? ({ boxShadow: '0 8px 20px rgba(15, 23, 42, 0.04)' } as any)
        : {
            elevation: 1,
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
          }),
    },
    activityIconBox: {
      width: isSmallPhone ? 36 : 42,
      height: isSmallPhone ? 36 : 42,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuCard: {
      backgroundColor: palette.glassSurface,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 20,
      overflow: 'hidden',
      ...(Platform.OS === 'web'
        ? ({ boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)' } as any)
        : {
            elevation: 2,
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
          }),
    },
    supportIconBox: {
      width: 34,
      height: 34,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    divider: {
      height: 1,
      backgroundColor: palette.border,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: palette.glassOverlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalCard: {
      backgroundColor: palette.background,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 22,
      padding: 18,
      maxHeight: '88%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 10,
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '900',
      color: palette.textPrimary,
    },
  });
};