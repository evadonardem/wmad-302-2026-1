/**
 * Global Theme Context - Marketplace
 * Provides synchronized Light Mode, Dark Mode, and System Default
 * with translucent glassmorphic surfaces, ambient luxury backdrops,
 * responsive device helpers (Website, Tablet, Phone), and AsyncStorage persistence.
 */
import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  useColorScheme,
  useWindowDimensions,
  Platform,
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { MD3DarkTheme, MD3LightTheme, MD3Theme, Provider as PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface ResponsiveMetrics {
  width: number;
  height: number;
  deviceType: 'phone' | 'tablet' | 'desktop';
  isPhone: boolean;
  isSmallPhone: boolean; // e.g., iPhone SE / compact Realme
  isTablet: boolean;     // e.g., iPad / Galaxy Tab
  isDesktop: boolean;    // e.g., Web browser >= 1024px
  contentMaxWidth: number;
  horizontalPadding: number;
  cardRadius: number;
}

export interface GlassPalette {
  isDark: boolean;
  background: string;
  backgroundSecondary: string;
  glassSurface: string;
  glassSurfaceElevated: string;
  glassInput: string;
  glassNav: string;
  glassModal: string;
  glassOverlay: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSecondary: string;
  accentSoft: string;
  success: string;
  warning: string;
  danger: string;
  dangerSoft: string;
  orbPrimary: string;
  orbSecondary: string;
  orbTertiary: string;
  webBackdropGradient: string;
  webGlassStyle: Record<string, any>;
  webPrimaryButtonGradient: Record<string, any>;
}

interface ThemeContextValue {
  themePreference: ThemePreference;
  isDark: boolean;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
  toggleDarkMode: (enabled: boolean) => Promise<void>;
  palette: GlassPalette;
  paperTheme: MD3Theme;
  responsive: ResponsiveMetrics;
}

const THEME_STORAGE_KEY = '@marketplace_theme_preference';

const LIGHT_PALETTE: GlassPalette = {
  isDark: false,
  background: '#F4F7FC',
  backgroundSecondary: '#EBF1FB',
  glassSurface: 'rgba(255, 255, 255, 0.78)',
  glassSurfaceElevated: 'rgba(255, 255, 255, 0.92)',
  glassInput: 'rgba(248, 250, 252, 0.88)',
  glassNav: 'rgba(255, 255, 255, 0.86)',
  glassModal: 'rgba(255, 255, 255, 0.96)',
  glassOverlay: 'rgba(15, 23, 42, 0.48)',
  border: 'rgba(148, 163, 184, 0.26)',
  borderStrong: 'rgba(254, 44, 85, 0.42)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  accent: '#FE2C55',
  accentSecondary: '#2563EB',
  accentSoft: 'rgba(254, 44, 85, 0.11)',
  success: '#059669',
  warning: '#D97706',
  danger: '#E11D48',
  dangerSoft: 'rgba(225, 29, 72, 0.12)',
  orbPrimary: 'rgba(254, 44, 85, 0.15)',
  orbSecondary: 'rgba(56, 189, 248, 0.18)',
  orbTertiary: 'rgba(168, 85, 247, 0.12)',
  webBackdropGradient:
    'radial-gradient(circle at 10% 8%, rgba(254, 44, 85, 0.16), transparent 42%), radial-gradient(circle at 90% 14%, rgba(56, 189, 248, 0.20), transparent 44%), radial-gradient(circle at 20% 85%, rgba(168, 85, 247, 0.13), transparent 44%), linear-gradient(135deg, #F8FAFC 0%, #EEF4FF 50%, #FFF1F5 100%)',
  webGlassStyle:
    Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.07)',
        }
      : {},
  webPrimaryButtonGradient:
    Platform.OS === 'web'
      ? {
          backgroundImage: 'linear-gradient(135deg, #FE2C55 0%, #FF5E7E 100%)',
          boxShadow: '0 8px 22px rgba(254, 44, 85, 0.32)',
        }
      : {},
};

const DARK_PALETTE: GlassPalette = {
  isDark: true,
  background: '#070B14',
  backgroundSecondary: '#0F172A',
  glassSurface: 'rgba(17, 24, 39, 0.72)',
  glassSurfaceElevated: 'rgba(30, 41, 59, 0.84)',
  glassInput: 'rgba(15, 23, 42, 0.82)',
  glassNav: 'rgba(11, 17, 30, 0.86)',
  glassModal: 'rgba(17, 24, 39, 0.95)',
  glassOverlay: 'rgba(0, 0, 0, 0.75)',
  border: 'rgba(148, 163, 184, 0.18)',
  borderStrong: 'rgba(255, 94, 126, 0.48)',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  accent: '#FF4D6D',
  accentSecondary: '#60A5FA',
  accentSoft: 'rgba(255, 77, 109, 0.16)',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#FB7185',
  dangerSoft: 'rgba(251, 113, 133, 0.16)',
  orbPrimary: 'rgba(254, 44, 85, 0.22)',
  orbSecondary: 'rgba(59, 130, 246, 0.20)',
  orbTertiary: 'rgba(139, 92, 246, 0.16)',
  webBackdropGradient:
    'radial-gradient(circle at 12% 10%, rgba(254, 44, 85, 0.24), transparent 44%), radial-gradient(circle at 88% 16%, rgba(59, 130, 246, 0.22), transparent 45%), radial-gradient(circle at 50% 86%, rgba(139, 92, 246, 0.16), transparent 48%), linear-gradient(135deg, #070B14 0%, #0F172A 50%, #161126 100%)',
  webGlassStyle:
    Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          boxShadow: '0 14px 36px rgba(0, 0, 0, 0.36)',
        }
      : {},
  webPrimaryButtonGradient:
    Platform.OS === 'web'
      ? {
          backgroundImage: 'linear-gradient(135deg, #FE2C55 0%, #FF6B8B 100%)',
          boxShadow: '0 8px 24px rgba(254, 44, 85, 0.40)',
        }
      : {},
};

const computeResponsiveMetrics = (width: number, height: number): ResponsiveMetrics => {
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isPhone = width < 768;
  const isSmallPhone = width <= 375;

  return {
    width,
    height,
    deviceType: isDesktop ? 'desktop' : isTablet ? 'tablet' : 'phone',
    isPhone,
    isSmallPhone,
    isTablet,
    isDesktop,
    contentMaxWidth: isDesktop ? 1280 : isTablet ? 860 : width,
    horizontalPadding: isDesktop ? 24 : isTablet ? 18 : isSmallPhone ? 10 : 14,
    cardRadius: isDesktop ? 22 : isTablet ? 20 : 18,
  };
};

const buildPaperTheme = (isDark: boolean, palette: GlassPalette): MD3Theme => {
  const base = isDark ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    dark: isDark,
    roundness: 14,
    colors: {
      ...base.colors,
      primary: palette.accent,
      secondary: palette.accentSecondary,
      background: palette.background,
      surface: palette.glassSurface,
      surfaceVariant: palette.glassSurfaceElevated,
      onSurface: palette.textPrimary,
      onSurfaceVariant: palette.textSecondary,
      outline: palette.border,
      error: palette.danger,
    },
  };
};

const DEFAULT_RESPONSIVE = computeResponsiveMetrics(390, 844);

// Safe default context fallback so routes outside AppThemeProvider never crash
const DEFAULT_THEME_VALUE: ThemeContextValue = {
  themePreference: 'light',
  isDark: false,
  setThemePreference: async () => {},
  toggleDarkMode: async () => {},
  palette: LIGHT_PALETTE,
  paperTheme: buildPaperTheme(false, LIGHT_PALETTE),
  responsive: DEFAULT_RESPONSIVE,
};

const ThemeContext = createContext<ThemeContextValue>(DEFAULT_THEME_VALUE);

/**
 * Reusable Ambient Backdrop Component
 * Renders subtle glowing aurora orbs across Phone, Tablet, and Desktop screens.
 */
export const AmbientBackdrop: React.FC<{
  children: React.ReactNode;
  style?: any;
}> = ({ children, style }) => {
  const { palette } = useAppTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const useNative = Platform.OS !== 'web';
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: useNative,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: useNative,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const webBgStyle: any =
    Platform.OS === 'web'
      ? {
          backgroundImage: palette.webBackdropGradient,
        }
      : {};

  return (
    <View
      style={[
        backdropStyles.root,
        { backgroundColor: palette.background },
        webBgStyle,
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          backdropStyles.orbLayer,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <View style={[backdropStyles.orbTopLeft, { backgroundColor: palette.orbPrimary }]} />
        <View style={[backdropStyles.orbTopRight, { backgroundColor: palette.orbSecondary }]} />
        <View style={[backdropStyles.orbBottomCenter, { backgroundColor: palette.orbTertiary }]} />
      </Animated.View>
      <View style={backdropStyles.content}>{children}</View>
    </View>
  );
};

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const { width, height } = useWindowDimensions();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('light');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemePreferenceState(saved);
        }
      } catch (e) {
        console.error('Failed to load theme preference:', e);
      }
    })();
  }, []);

  const setThemePreference = async (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, pref);
    } catch (e) {
      console.error('Failed to persist theme preference:', e);
    }
  };

  const toggleDarkMode = async (enabled: boolean) => {
    await setThemePreference(enabled ? 'dark' : 'light');
  };

  const isDark =
    themePreference === 'system' ? systemScheme === 'dark' : themePreference === 'dark';

  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;

  const responsive = useMemo(() => computeResponsiveMetrics(width, height), [width, height]);

  // Apply seamless ambient background & scrollbars on Web browsers
  useEffect(() => {
    const webDoc = (globalThis as any)?.document;
    if (Platform.OS === 'web' && webDoc?.body) {
      webDoc.body.style.backgroundColor = palette.background;
      webDoc.body.style.backgroundImage = palette.webBackdropGradient;
      webDoc.body.style.backgroundAttachment = 'fixed';
      webDoc.body.style.color = palette.textPrimary;
      webDoc.body.style.transition = 'background-color 0.35s ease, color 0.35s ease';
    }
  }, [palette.background, palette.webBackdropGradient, palette.textPrimary]);

  const paperTheme = useMemo<MD3Theme>(() => buildPaperTheme(isDark, palette), [isDark, palette]);

  return (
    <ThemeContext.Provider
      value={{
        themePreference,
        isDark,
        setThemePreference,
        toggleDarkMode,
        palette,
        paperTheme,
        responsive,
      }}
    >
      <PaperProvider theme={paperTheme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

const backdropStyles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  orbLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  orbTopLeft: {
    position: 'absolute',
    top: -120,
    left: -95,
    width: 340,
    height: 340,
    borderRadius: 999,
  },
  orbTopRight: {
    position: 'absolute',
    top: 40,
    right: -115,
    width: 320,
    height: 320,
    borderRadius: 999,
  },
  orbBottomCenter: {
    position: 'absolute',
    bottom: -110,
    left: '22%',
    width: 360,
    height: 360,
    borderRadius: 999,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});