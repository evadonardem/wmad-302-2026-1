/**
 * React Native Paper + React Navigation themes, built from the active palette
 */
import { MD3DarkTheme, MD3LightTheme, MD3Theme } from 'react-native-paper';
import { DarkTheme, DefaultTheme, Theme as NavigationTheme } from '@react-navigation/native';
import { lightPalette, Palette } from './palettes';

const fonts = {
  displayLarge: { fontFamily: 'System', fontWeight: '700' as const, fontSize: 57, lineHeight: 64, letterSpacing: -0.25 },
  headlineLarge: { fontFamily: 'System', fontWeight: '600' as const, fontSize: 32, lineHeight: 40, letterSpacing: 0 },
  headlineMedium: { fontFamily: 'System', fontWeight: '600' as const, fontSize: 28, lineHeight: 36, letterSpacing: 0 },
  headlineSmall: { fontFamily: 'System', fontWeight: '600' as const, fontSize: 24, lineHeight: 32, letterSpacing: 0 },
  titleLarge: { fontFamily: 'System', fontWeight: '600' as const, fontSize: 22, lineHeight: 28, letterSpacing: 0 },
  titleMedium: { fontFamily: 'System', fontWeight: '500' as const, fontSize: 16, lineHeight: 24, letterSpacing: 0.15 },
  titleSmall: { fontFamily: 'System', fontWeight: '500' as const, fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  bodyLarge: { fontFamily: 'System', fontWeight: '400' as const, fontSize: 16, lineHeight: 24, letterSpacing: 0.5 },
  bodyMedium: { fontFamily: 'System', fontWeight: '400' as const, fontSize: 14, lineHeight: 20, letterSpacing: 0.25 },
  bodySmall: { fontFamily: 'System', fontWeight: '400' as const, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
  labelLarge: { fontFamily: 'System', fontWeight: '500' as const, fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  labelMedium: { fontFamily: 'System', fontWeight: '500' as const, fontSize: 12, lineHeight: 16, letterSpacing: 0.5 },
  labelSmall: { fontFamily: 'System', fontWeight: '500' as const, fontSize: 11, lineHeight: 16, letterSpacing: 0.5 },
};

export function buildPaperTheme(palette: Palette): MD3Theme {
  const base = palette.isDark ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    roundness: 8,
    fonts: { ...base.fonts, ...fonts },
    colors: {
      ...base.colors,
      primary: palette.primary,
      onPrimary: palette.onPrimary,
      primaryContainer: palette.primaryContainer,
      onPrimaryContainer: palette.text,
      secondary: palette.secondary,
      secondaryContainer: palette.secondaryContainer,
      onSecondaryContainer: palette.text,
      tertiary: palette.success,
      tertiaryContainer: palette.successContainer,
      surface: palette.surface,
      surfaceVariant: palette.surfaceMuted,
      background: palette.background,
      error: palette.danger,
      errorContainer: palette.dangerContainer,
      onSurface: palette.text,
      onSurfaceVariant: palette.textMuted,
      onBackground: palette.text,
      outline: palette.border,
      outlineVariant: palette.border,
    },
  };
}

export function buildNavigationTheme(palette: Palette): NavigationTheme {
  const base = palette.isDark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
      notification: palette.danger,
    },
  };
}

/** Default (light) Paper theme, e.g. for components rendered outside the providers. */
export const theme = buildPaperTheme(lightPalette);
