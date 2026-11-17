
/**
 * Marketplace App Theme
 * Light: Cool Slate + Pale Teal
 * Dark: Deep Navy + Neon Teal
 */

import {
  MD3LightTheme,
  MD3DarkTheme,
  type MD3Theme,
} from 'react-native-paper';

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,

    primary: '#0F766E',
    primaryContainer: '#D5EFEC',
    secondary: '#64748B',
    secondaryContainer: '#E2EAF0',
    tertiary: '#4D9D96',
    tertiaryContainer: '#DDF2EF',

    surface: '#FFFFFF',
    surfaceVariant: '#EAF2F2',
    background: '#F3F8F8',

    error: '#DC5757',
    errorContainer: '#FCE8E8',

    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    onSurface: '#263746',
    onSurfaceVariant: '#647782',
    onBackground: '#263746',

    outline: '#C7D6D7',
    outlineVariant: '#DFE9E9',

    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#F7FAFA',
      level3: '#F0F6F5',
      level4: '#EAF2F1',
      level5: '#E5EFEE',
    },
  },
  roundness: 16,
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,

    primary: '#2DD4BF',
    primaryContainer: '#115E59',
    secondary: '#A5B4C4',
    secondaryContainer: '#263F4A',
    tertiary: '#A3E635',
    tertiaryContainer: '#365314',

    surface: '#102B35',
    surfaceVariant: '#183944',
    background: '#071A22',

    error: '#FF8A80',
    errorContainer: '#5C2529',

    onPrimary: '#003731',
    onSecondary: '#172B3A',
    onTertiary: '#243500',
    onSurface: '#E7F4F3',
    onSurfaceVariant: '#B1C5C8',
    onBackground: '#E7F4F3',

    outline: '#45616A',
    outlineVariant: '#294650',

    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level0: 'transparent',
      level1: '#102B35',
      level2: '#14313B',
      level3: '#183944',
      level4: '#1B3E49',
      level5: '#204651',
    },
  },
  roundness: 16,
};

/**
 * Backward compatibility for any existing imports
 * that still use the old `theme` export.
 */
export const theme = lightTheme;
