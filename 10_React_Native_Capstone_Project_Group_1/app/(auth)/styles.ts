/**
 * Shared Responsive Auth Stylesheet (Login & Register)
 * Adapts seamlessly to Website (>=1024px split-screen), Tablet (768px-1023px),
 * and Phones (<768px: Realme, iPhone, Samsung, Xiaomi, OPPO, Vivo).
 */
import { Platform, StyleSheet } from 'react-native';

export interface AuthBreakpointMetrics {
  width: number;
  height: number;
  isDesktop: boolean;
  isTablet: boolean;
  isPhone: boolean;
  isCompactPhone: boolean;
}

export function getAuthBreakpointMetrics(width: number, height: number): AuthBreakpointMetrics {
  const isDesktop = width >= 1024;
  const isTablet = !isDesktop && width >= 768;
  const isPhone = !isDesktop && !isTablet;
  const isCompactPhone = isPhone && width <= 375;

  return {
    width,
    height,
    isDesktop,
    isTablet,
    isPhone,
    isCompactPhone,
  };
}

export function createAuthStyles(metrics: AuthBreakpointMetrics) {
  const { width, height, isDesktop, isTablet, isCompactPhone } = metrics;

  const mobileHeroHeight = isTablet
    ? Math.max(290, Math.min(360, height * 0.34))
    : isCompactPhone
    ? Math.max(220, Math.min(265, height * 0.3))
    : Math.max(250, Math.min(315, height * 0.32));

  const cardHorizontalPadding = isDesktop ? 34 : isTablet ? 32 : isCompactPhone ? 18 : 22;

  return StyleSheet.create({
    keyboardRoot: {
      flex: 1,
      backgroundColor: isDesktop ? '#F4F6FA' : '#F1F5F9',
    },
    scrollContent: {
      flexGrow: 1,
      flexDirection: isDesktop ? 'row' : 'column',
      minHeight: height,
      backgroundColor: isDesktop ? '#F4F6FA' : '#F1F5F9',
    },

    // ==================== HERO BANNER / LEFT SPLIT PANEL ====================
    heroContainer: {
      width: isDesktop ? '50%' : '100%',
      minHeight: isDesktop ? height : mobileHeroHeight,
      justifyContent: isDesktop ? 'flex-start' : 'center',
      backgroundColor: isDesktop ? '#FAD3C4' : '#0F172A',
      overflow: 'hidden',
      borderBottomLeftRadius: isDesktop ? 0 : isTablet ? 40 : 32,
      borderBottomRightRadius: isDesktop ? 0 : isTablet ? 40 : 32,
    },
    heroFallbackContainer: {
      width: isDesktop ? '50%' : '100%',
      minHeight: isDesktop ? height : mobileHeroHeight,
      justifyContent: isDesktop ? 'flex-start' : 'center',
      backgroundColor: isDesktop ? '#FAD3C4' : '#1E3A8A',
      borderBottomLeftRadius: isDesktop ? 0 : isTablet ? 40 : 32,
      borderBottomRightRadius: isDesktop ? 0 : isTablet ? 40 : 32,
      ...(isDesktop && Platform.OS === 'web'
        ? ({
            backgroundImage:
              'linear-gradient(145deg, #FBBFB0 0%, #FDE2CE 42%, #CBE6FB 100%)',
          } as any)
        : {}),
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroScrim: {
      flex: 1,
      width: '100%',
      justifyContent: isDesktop ? 'flex-start' : 'center',
      alignItems: 'center',
      backgroundColor: isDesktop ? 'transparent' : 'rgba(15, 23, 42, 0.42)',
      paddingHorizontal: isDesktop ? 48 : isTablet ? 40 : 24,
      paddingTop: isDesktop ? Math.max(88, height * 0.16) : Platform.OS === 'ios' ? 48 : 32,
      paddingBottom: isDesktop ? 48 : 46,
    },
    heroTextWrapper: {
      maxWidth: isDesktop ? 510 : isTablet ? 580 : 440,
      alignSelf: 'center',
      alignItems: 'center',
      width: '100%',
    },
    heroTitle: {
      fontSize: isDesktop ? 48 : isTablet ? 36 : isCompactPhone ? 28 : 31,
      fontWeight: isDesktop ? '900' : '800',
      color: isDesktop ? '#0F172A' : '#FFFFFF',
      lineHeight: isDesktop ? 56 : isTablet ? 42 : isCompactPhone ? 34 : 38,
      letterSpacing: isDesktop ? -0.9 : -0.4,
      textAlign: 'center',
      ...(isDesktop
        ? {}
        : {
            textShadowColor: 'rgba(15, 23, 42, 0.45)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 8,
          }),
    },
    heroSubtitle: {
      marginTop: isDesktop ? 14 : 11,
      fontSize: isDesktop ? 17 : isTablet ? 16.5 : isCompactPhone ? 14 : 15,
      color: isDesktop ? '#334155' : 'rgba(255, 255, 255, 0.94)',
      lineHeight: isDesktop ? 25 : isTablet ? 23 : 21,
      fontWeight: '500',
      textAlign: 'center',
      ...(isDesktop
        ? {}
        : {
            textShadowColor: 'rgba(15, 23, 42, 0.35)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 4,
          }),
    },

    // ==================== RIGHT / BOTTOM FORM SECTION ====================
    formSection: {
      flex: 1,
      width: isDesktop ? '50%' : '100%',
      alignItems: 'center',
      justifyContent: isDesktop ? 'center' : 'flex-start',
      backgroundColor: isDesktop ? '#F4F6FA' : 'transparent',
      paddingHorizontal: isDesktop ? 40 : isTablet ? 28 : isCompactPhone ? 12 : 16,
      paddingTop: isDesktop ? 56 : 0,
      paddingBottom: isDesktop ? 36 : 32,
      marginTop: isDesktop ? 0 : isTablet ? -36 : -30,
    },
    authCard: {
      width: '100%',
      maxWidth: isDesktop ? 420 : isTablet ? 520 : 440,
      backgroundColor: '#FFFFFF',
      borderRadius: isDesktop ? 22 : 26,
      paddingHorizontal: cardHorizontalPadding,
      paddingTop: isDesktop ? 44 : 42,
      paddingBottom: isDesktop ? 28 : 24,
      borderWidth: 1,
      borderColor: isDesktop ? '#EEF2F6' : '#E2E8F0',
      ...Platform.select({
        web: {
          boxShadow: isDesktop
            ? '0px 18px 44px rgba(15, 23, 42, 0.06)'
            : '0px 14px 38px rgba(15, 23, 42, 0.09)',
        },
        ios: {
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDesktop ? 0.06 : 0.09,
          shadowRadius: 22,
        },
        android: {
          elevation: 6,
        },
      }),
    },

    // Floating Glowing Cyan-to-Indigo Shopping Bag Badge
    floatingBadge: {
      position: 'absolute',
      top: isDesktop ? -28 : isCompactPhone ? -28 : -32,
      alignSelf: 'center',
      width: isDesktop ? 56 : isCompactPhone ? 56 : 64,
      height: isDesktop ? 56 : isCompactPhone ? 56 : 64,
      borderRadius: isDesktop ? 16 : isCompactPhone ? 28 : 32,
      backgroundColor: isDesktop ? '#7DD3FC' : '#E0F2FE',
      borderWidth: isDesktop ? 0 : 4,
      borderColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      ...(isDesktop && Platform.OS === 'web'
        ? ({
            backgroundImage: 'linear-gradient(135deg, #67E8F9 0%, #818CF8 100%)',
          } as any)
        : {}),
      ...Platform.select({
        web: {
          boxShadow: isDesktop
            ? '0px 10px 24px rgba(99, 102, 241, 0.36)'
            : '0px 8px 20px rgba(37, 99, 235, 0.22)',
        },
        ios: {
          shadowColor: isDesktop ? '#6366F1' : '#2563EB',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.28,
          shadowRadius: 12,
        },
        android: {
          elevation: 6,
        },
      }),
    },

    cardHeader: {
      alignItems: 'center',
      marginBottom: isDesktop ? 20 : isCompactPhone ? 14 : 18,
    },
    cardTitle: {
      fontSize: isDesktop ? 23 : isTablet ? 25 : isCompactPhone ? 21 : 23,
      fontWeight: '800',
      color: '#0F172A',
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    cardSubtitle: {
      marginTop: 3,
      fontSize: isDesktop ? 12.5 : isCompactPhone ? 12.5 : 13.5,
      color: '#64748B',
      textAlign: 'center',
      lineHeight: 18,
    },

    // ==================== STATUS NOTIFICATION BANNER ====================
    bannerBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 14,
    },
    bannerError: {
      backgroundColor: '#FEF2F2',
      borderColor: '#FECACA',
    },
    bannerSuccess: {
      backgroundColor: '#ECFDF5',
      borderColor: '#A7F3D0',
    },
    bannerText: {
      flex: 1,
      fontSize: 12.5,
      fontWeight: '600',
      lineHeight: 17,
    },

    // ==================== SOCIAL LOGIN / REGISTER BUTTONS ====================
    socialButtonsGroup: {
      gap: isDesktop ? 11 : 10,
    },
    socialButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      height: isDesktop ? 42 : isCompactPhone ? 44 : 46,
      borderRadius: isDesktop ? 12 : 999,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: isDesktop ? '#E2E8F0' : '#CBD5E1',
      paddingHorizontal: 16,
      ...(isDesktop
        ? Platform.select({
            web: {
              boxShadow: '0px 3px 10px rgba(15, 23, 42, 0.04)',
            },
            default: {},
          })
        : {}),
    },
    socialButtonText: {
      fontSize: isDesktop ? 13 : isCompactPhone ? 13.5 : 14,
      fontWeight: isDesktop ? '600' : '700',
      color: '#1E293B',
    },

    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: isDesktop ? 15 : isCompactPhone ? 14 : 16,
      gap: 10,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: '#E2E8F0',
    },
    dividerText: {
      fontSize: isDesktop ? 10 : isCompactPhone ? 9.5 : 10.5,
      fontWeight: '700',
      color: isDesktop ? '#64748B' : '#94A3B8',
      letterSpacing: 0.5,
      textAlign: 'center',
    },

    // ==================== INPUTS & FORM ROWS ====================
    inputOutline: {
      borderRadius: isDesktop ? 12 : 14,
    },
    loginInput: {
      backgroundColor: isDesktop ? '#FFFFFF' : '#F8FAFC',
      marginBottom: isDesktop ? 11 : 12,
      fontSize: isDesktop ? 13.5 : 14,
      ...(isDesktop ? { height: 44 } : {}),
    },
    loginPasswordInput: {
      backgroundColor: isDesktop ? '#FFFFFF' : '#F8FAFC',
      marginBottom: isDesktop ? 16 : 18,
      fontSize: isDesktop ? 13.5 : 14,
      ...(isDesktop ? { height: 44 } : {}),
    },

    nameRow: {
      flexDirection: width < 350 ? 'column' : 'row',
      gap: 10,
      marginBottom: 8,
    },
    registerInputWrapper: {
      marginBottom: 8,
    },
    registerConfirmWrapper: {
      marginBottom: 16,
    },
    registerInput: {
      backgroundColor: isDesktop ? '#FFFFFF' : '#F8FAFC',
      fontSize: isDesktop ? 13.5 : 14,
    },

    // ==================== PRIMARY CTA & FOOTER ====================
    primaryButton: {
      borderRadius: 999,
      marginTop: 2,
      ...(isDesktop && Platform.OS === 'web'
        ? ({
            backgroundImage: 'linear-gradient(90deg, #1E64F0 0%, #2B7FFF 100%)',
            boxShadow: '0px 6px 16px rgba(30, 100, 240, 0.28)',
          } as any)
        : {}),
    },
    primaryButtonContent: {
      height: isDesktop ? 44 : isCompactPhone ? 46 : 48,
    },
    primaryButtonLabel: {
      fontSize: isDesktop ? 13.5 : 15,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 5,
      marginTop: isDesktop ? 16 : 18,
    },
    footerText: {
      fontSize: isDesktop ? 12 : 13.5,
      color: '#64748B',
    },
    footerLink: {
      fontSize: isDesktop ? 12 : 13.5,
      fontWeight: '700',
      color: '#1E64F0',
    },

    // ==================== PORTAL MODAL ====================
    modalContainer: {
      margin: 16,
      alignSelf: 'center',
      width: '92%',
      maxWidth: 420,
      padding: 20,
      borderRadius: 18,
      borderWidth: 1,
    },
    modalHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 6,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      flexShrink: 1,
    },
    modalDescription: {
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 14,
    },
    modalActionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 4,
    },
  });
}