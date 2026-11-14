/**
 * React Native Paper Theme - Cookbook App
 * Warm, food-friendly color palette
 */
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const cookbookFonts = {
  ...MD3LightTheme.fonts,
  displayLarge: { fontFamily: 'System', fontWeight: '700' as const, fontSize: 57, lineHeight: 64, letterSpacing: -0.25 },
  headlineLarge: { fontFamily: 'System', fontWeight: '600' as const, fontSize: 32, lineHeight: 40 },
  headlineMedium: { fontFamily: 'System', fontWeight: '600' as const, fontSize: 28, lineHeight: 36 },
  headlineSmall: { fontFamily: 'System', fontWeight: '600' as const, fontSize: 24, lineHeight: 32 },
  titleLarge: { fontFamily: 'System', fontWeight: '600' as const, fontSize: 22, lineHeight: 28 },
  titleMedium: { fontFamily: 'System', fontWeight: '500' as const, fontSize: 16, lineHeight: 24, letterSpacing: 0.15 },
  titleSmall: { fontFamily: 'System', fontWeight: '500' as const, fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  bodyLarge: { fontFamily: 'System', fontWeight: '400' as const, fontSize: 16, lineHeight: 24, letterSpacing: 0.5 },
  bodyMedium: { fontFamily: 'System', fontWeight: '400' as const, fontSize: 14, lineHeight: 20, letterSpacing: 0.25 },
  bodySmall: { fontFamily: 'System', fontWeight: '400' as const, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
  labelLarge: { fontFamily: 'System', fontWeight: '500' as const, fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  labelMedium: { fontFamily: 'System', fontWeight: '500' as const, fontSize: 12, lineHeight: 16, letterSpacing: 0.5 },
  labelSmall: { fontFamily: 'System', fontWeight: '500' as const, fontSize: 11, lineHeight: 16, letterSpacing: 0.5 },
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#E85D04',      // Warm orange
    primaryContainer: '#FFF3E0',
    secondary: '#6D4C41',    // Brown
    secondaryContainer: '#EFEBE9',
    tertiary: '#2E7D32',     // Green (fresh ingredients)
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
  },
  roundness: 12,
  fonts: cookbookFonts,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#FFAD73',
    primaryContainer: '#5A2D0E',
    secondary: '#D9B7A0',
    secondaryContainer: '#3E3028',
    tertiary: '#8DD4A2',
    tertiaryContainer: '#1E3B2A',
    surface: '#211D1A',
    surfaceVariant: '#302923',
    background: '#14110F',
    error: '#FF8A80',
    errorContainer: '#5C1F1A',
    onPrimary: '#2D1608',
    onSecondary: '#2A1B13',
    onTertiary: '#0E2415',
    onSurface: '#F7EFE9',
    onSurfaceVariant: '#D1C2B8',
    onBackground: '#F7EFE9',
    outline: '#A18F82',
    outlineVariant: '#594B42',
  },
  roundness: 12,
  fonts: cookbookFonts,
};

export const theme = lightTheme;
