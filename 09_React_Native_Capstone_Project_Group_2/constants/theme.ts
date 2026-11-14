import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface AppColors {
  primary: string;
  primarySoft: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  error: string;
}

export const lightColors: AppColors = {
  primary: '#E85D04',
  primarySoft: '#FFF0E3',
  background: '#FFFDF8',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#2D211D',
  textMuted: '#806E66',
  border: '#E7DCD5',
  success: '#2E7D5B',
  error: '#C62828',
};

export const darkColors: AppColors = {
  primary: '#FF9A5C',
  primarySoft: '#3A261B',
  background: '#171311',
  surface: '#211B18',
  surfaceElevated: '#2A221E',
  text: '#FFF8F3',
  textMuted: '#C8B8AF',
  border: '#493B34',
  success: '#78D6A8',
  error: '#FF8A80',
};

export function getColors(isDark: boolean): AppColors {
  return isDark ? darkColors : lightColors;
}

export function createTheme(isDark: boolean): MD3Theme {
  const base = isDark ? MD3DarkTheme : MD3LightTheme;
  const colors = getColors(isDark);

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      primaryContainer: colors.primarySoft,
      secondary: isDark ? '#D8B8A4' : '#6D4C41',
      secondaryContainer: isDark ? '#382D27' : '#EFEBE9',
      tertiary: isDark ? '#9BD8B8' : '#2E7D32',
      tertiaryContainer: isDark ? '#1D3529' : '#E8F5E9',
      surface: colors.surface,
      surfaceVariant: isDark ? '#302722' : '#FFF8F0',
      background: colors.background,
      error: colors.error,
      errorContainer: isDark ? '#4A211E' : '#FDEDED',
      onPrimary: isDark ? '#3A1B08' : '#FFFFFF',
      onSecondary: isDark ? '#33251E' : '#FFFFFF',
      onTertiary: isDark ? '#123322' : '#FFFFFF',
      onSurface: colors.text,
      onSurfaceVariant: colors.textMuted,
      onBackground: colors.text,
      outline: isDark ? '#8A7569' : '#BCAAA4',
      outlineVariant: colors.border,
    },
    roundness: 16,
  };
}

export const theme = createTheme(false);
