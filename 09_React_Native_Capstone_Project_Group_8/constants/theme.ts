
/**
 * React Native Paper Theme - Cookbook App
 * Fresh green and white food-inspired design
 */

import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,

    primary: '#43A52F',
    primaryContainer: '#E8F5E9',

    secondary: '#2E7D32',
    secondaryContainer: '#C8E6C9',

    tertiary: '#8BC34A',
    tertiaryContainer: '#DCEDC8',

    surface: '#FFFFFF',
    surfaceVariant: '#F1F8EF',
    background: '#F5FAF3',

    error: '#D32F2F',
    errorContainer: '#FFEBEE',

    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#1B5E20',

    onSurface: '#202B20',
    onSurfaceVariant: '#52634F',
    onBackground: '#202B20',

    outline: '#A5B99F',
    outlineVariant: '#D5E3D0',

    inverseSurface: '#263326',
    inverseOnSurface: '#F1F8EF',
    inversePrimary: '#A5D6A7',
  },

  roundness: 14,

  fonts: {
    ...MD3LightTheme.fonts,
    displayLarge: {
      fontFamily: 'System',
      fontWeight: '700' as const,
      fontSize: 57,
      lineHeight: 64,
      letterSpacing: -0.25,
    },
    headlineLarge: {
      fontFamily: 'System',
      fontWeight: '700' as const,
      fontSize: 32,
      lineHeight: 40,
    },
    headlineMedium: {
      fontFamily: 'System',
      fontWeight: '700' as const,
      fontSize: 28,
      lineHeight: 36,
    },
    headlineSmall: {
      fontFamily: 'System',
      fontWeight: '700' as const,
      fontSize: 24,
      lineHeight: 32,
    },
    titleLarge: {
      fontFamily: 'System',
      fontWeight: '700' as const,
      fontSize: 22,
      lineHeight: 28,
    },
    titleMedium: {
      fontFamily: 'System',
      fontWeight: '600' as const,
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0.15,
    },
    titleSmall: {
      fontFamily: 'System',
      fontWeight: '600' as const,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    bodyLarge: {
      fontFamily: 'System',
      fontWeight: '400' as const,
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0.5,
    },
    bodyMedium: {
      fontFamily: 'System',
      fontWeight: '400' as const,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.25,
    },
    bodySmall: {
      fontFamily: 'System',
      fontWeight: '400' as const,
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.4,
    },
    labelLarge: {
      fontFamily: 'System',
      fontWeight: '600' as const,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    labelMedium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.5,
    },
    labelSmall: {
      fontFamily: 'System',
      fontWeight: '500' as const,
      fontSize: 11,
      lineHeight: 16,
      letterSpacing: 0.5,
    },
  },
};
