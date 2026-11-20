/**
 * React Native Paper Themes - Cookbook App
 * Warm, food-friendly palettes for light and dark mode.
 *
 * Screens never hardcode colors: they read them from the active theme with
 * useAppTheme() (in components) or makeStyles() (in *Styles.ts files), so
 * switching between light and dark updates the whole app.
 */
import { useMemo } from 'react';
import { MD3DarkTheme, MD3LightTheme, MD3Theme, useTheme } from 'react-native-paper';

/** Extra colors the app uses on top of the Material 3 set */
interface CustomColors {
  /** Secondary text (subtitles, meta info) */
  muted: string;
  /** Light borders around inputs and chips */
  border: string;
  /** Border for highlighted boxes (e.g. tips) */
  accentBorder: string;
  /** Star rating icon */
  star: string;
  /** Semi-transparent layer over content while loading */
  overlay: string;
}

export type AppColors = MD3Theme['colors'] & CustomColors;
export type AppTheme = Omit<MD3Theme, 'colors'> & { colors: AppColors };

/**
 * Font families (loaded in app/_layout.tsx with @expo-google-fonts).
 * Custom fonts carry their weight in the family name, so use these instead of fontWeight.
 */
export const fontFamily = {
  /** Warm serif for big titles */
  display: 'Fraunces_700Bold',
  displaySemi: 'Fraunces_600SemiBold',
  /** Clean sans for everything else */
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

/**
 * Colors for content drawn on top of food photos. Photos look the same in
 * light and dark mode, so these do not change with the theme.
 */
export const photoOverlay = {
  /** Bottom fade so white text is readable on any photo */
  gradient: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.82)'] as const,
  /** Round button background on photos */
  button: 'rgba(0,0,0,0.38)',
  text: '#FFFFFF',
  textSoft: 'rgba(255,255,255,0.85)',
  pill: 'rgba(255,255,255,0.92)',
  pillText: '#3E2723',
  heart: '#FF6B6B',
};

/** Softer, rounder shapes */
export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
};

/** Spacing scale - use these instead of random numbers */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const type = (family: string, fontSize: number, lineHeight: number, letterSpacing = 0) => ({
  fontFamily: family,
  fontWeight: '400' as const,
  fontSize,
  lineHeight,
  letterSpacing,
});

const fonts = {
  ...MD3LightTheme.fonts,
  default: { fontFamily: fontFamily.regular, fontWeight: '400' as const, letterSpacing: 0 },
  displayLarge: type(fontFamily.display, 57, 64, -0.25),
  displayMedium: type(fontFamily.display, 45, 52),
  displaySmall: type(fontFamily.display, 36, 44),
  headlineLarge: type(fontFamily.display, 32, 40),
  headlineMedium: type(fontFamily.display, 28, 36),
  headlineSmall: type(fontFamily.display, 24, 32),
  titleLarge: type(fontFamily.displaySemi, 22, 28),
  titleMedium: type(fontFamily.semibold, 16, 24, 0.15),
  titleSmall: type(fontFamily.semibold, 14, 20, 0.1),
  bodyLarge: type(fontFamily.regular, 16, 24, 0.15),
  bodyMedium: type(fontFamily.regular, 14, 20, 0.25),
  bodySmall: type(fontFamily.regular, 12, 16, 0.4),
  labelLarge: type(fontFamily.semibold, 14, 20, 0.1),
  labelMedium: type(fontFamily.medium, 12, 16, 0.5),
  labelSmall: type(fontFamily.medium, 11, 16, 0.5),
};

export const lightTheme: AppTheme = {
  ...MD3LightTheme,
  roundness: 16,
  fonts,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#E85D04', // Warm orange
    primaryContainer: '#FFF3E0',
    onPrimaryContainer: '#5A2400',
    secondary: '#6D4C41', // Brown
    secondaryContainer: '#EFEBE9',
    tertiary: '#2E7D32', // Green (fresh ingredients)
    tertiaryContainer: '#E8F5E9',
    surface: '#FFFFFF',
    surfaceVariant: '#FFF8F0',
    background: '#FFFDF8',
    error: '#C62828',
    errorContainer: '#FDEDED',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    onSurface: '#3E2723',
    onSurfaceVariant: '#5D4037',
    onBackground: '#3E2723',
    outline: '#BCAAA4',
    outlineVariant: '#D7CCC8',
    muted: '#8D6E63',
    border: '#E0E0E0',
    accentBorder: '#FFCC80',
    star: '#F9A825',
    overlay: 'rgba(255, 255, 255, 0.8)',
  },
};

export const darkTheme: AppTheme = {
  ...MD3DarkTheme,
  roundness: 16,
  fonts,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#FF8A3D', // Brighter orange so it stands out on dark backgrounds
    primaryContainer: '#4A2511',
    onPrimaryContainer: '#FFDBC8',
    secondary: '#D7B9AE',
    secondaryContainer: '#3B2C27',
    tertiary: '#81C784',
    tertiaryContainer: '#1F3A22',
    surface: '#251B18',
    surfaceVariant: '#2F2420',
    background: '#1A1210',
    error: '#FF8A80',
    errorContainer: '#4A1C1C',
    onPrimary: '#2B1300',
    onSecondary: '#2B1300',
    onTertiary: '#0B2010',
    onSurface: '#F3E9E4',
    onSurfaceVariant: '#D7C2B9',
    onBackground: '#F3E9E4',
    outline: '#8C766E',
    outlineVariant: '#4A3B36',
    muted: '#B39A90',
    border: '#3D302B',
    accentBorder: '#7A3D14',
    star: '#FFC94D',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
};

/** Kept for backwards compatibility with the starter code */
export const theme = lightTheme;

/** The active theme (light or dark) with the app's extra colors */
export function useAppTheme(): AppTheme {
  return useTheme<AppTheme>();
}

/**
 * Turn a style factory into a hook that rebuilds the styles when the theme changes.
 *
 * Usage in a *Styles.ts file:
 *   export const useHomeStyles = makeStyles((c) => StyleSheet.create({ ... c.primary ... }));
 * and in the screen:
 *   const styles = useHomeStyles();
 */
export function makeStyles<T>(factory: (colors: AppColors) => T): () => T {
  return function useStyles(): T {
    const appTheme = useAppTheme();
    return useMemo(() => factory(appTheme.colors), [appTheme]);
  };
}
