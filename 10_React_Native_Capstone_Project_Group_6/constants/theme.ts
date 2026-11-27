/**
 * React Native Paper Theme - Marketplace App
 * Clean, commerce-friendly color palette
 */
import { MD3DarkTheme, MD3LightTheme, useTheme } from 'react-native-paper';

const fontOverrides = {
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
    primary: '#118B8B',
    primaryContainer: '#E8F5F5',
    secondary: '#0B6666',
    secondaryContainer: '#D5ECEB',
    tertiary: '#34A853',
    tertiaryContainer: '#E6F4EA',
    surface: '#FFFFFF',
    surfaceVariant: '#F0F7F6',
    background: '#F4FAFA',
    error: '#F26B4E',
    errorContainer: '#FDEAE5',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    onSurface: '#172326',
    onSurfaceVariant: '#687A7E',
    onBackground: '#172326',
    outline: '#D1E0DE',
    outlineVariant: '#E2ECEB',
    warning: '#F9AB00',
    onError: '#FFFFFF',
    success: '#34A853',
  },
  roundness: 16,
  fonts: {
    ...MD3LightTheme.fonts,
    ...fontOverrides,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#65C8C2',
    primaryContainer: '#174A49',
    secondary: '#A6DCD8',
    secondaryContainer: '#244947',
    tertiary: '#81C995',
    tertiaryContainer: '#174D32',
    surface: '#172322',
    surfaceVariant: '#243331',
    background: '#101B1B',
    error: '#FF8D76',
    errorContainer: '#5D2A24',
    onPrimary: '#063A39',
    onSecondary: '#1B1F3B',
    onTertiary: '#003916',
    onSurface: '#E6F3F1',
    onSurfaceVariant: '#AFC1BF',
    onBackground: '#E6F3F1',
    outline: '#66817F',
    outlineVariant: '#334846',
    warning: '#FDD663',
    onError: '#601410',
    success: '#81C995',
  },
  roundness: 16,
  fonts: {
    ...MD3DarkTheme.fonts,
    ...fontOverrides,
  },
};

export const theme = lightTheme;

export type AppTheme = typeof lightTheme;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export function useAppTheme() {
  return useTheme<AppTheme>();
}