import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ImageStyle, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_COLOR_MODE_KEY = 'app_color_mode';

export type AppColorMode = 'light' | 'dark';

export interface AppColors {
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  muted: string;
  border: string;
  accent: string;
  accentSurface: string;
  error: string;
}

interface AppThemeValue {
  mode: AppColorMode;
  isDark: boolean;
  colors: AppColors;
  loadError: string | null;
  setMode: (mode: AppColorMode) => Promise<void>;
}

const palettes: Record<AppColorMode, AppColors> = {
  light: {
    background: '#FFFDF8',
    surface: '#FFFFFF',
    surfaceVariant: '#F6F0EA',
    text: '#3E2723',
    textSecondary: '#5D4037',
    muted: '#6E5A50',
    border: '#D7CCC8',
    accent: '#A33F00',
    accentSurface: '#A33F00',
    error: '#9B1C1C',
  },
  dark: {
    background: '#14110F',
    surface: '#211D1A',
    surfaceVariant: '#302923',
    text: '#F7EFE9',
    textSecondary: '#D1C2B8',
    muted: '#B9A99E',
    border: '#594B42',
    accent: '#FFAD73',
    accentSurface: '#9B3D00',
    error: '#FF8A80',
  },
};

const AppThemeContext = createContext<AppThemeValue | null>(null);

function parseHexColor(value: string) {
  const hex = value.replace('#', '');
  if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return null;
  const normalized = hex.length === 3
    ? hex.split('').map((digit) => `${digit}${digit}`).join('')
    : hex;
  const channels = [0, 2, 4].map((index) => parseInt(normalized.slice(index, index + 2), 16) / 255);
  const [red, green, blue] = channels;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  let hue = 0;
  if (delta > 0) {
    if (maximum === red) hue = ((green - blue) / delta) % 6;
    else if (maximum === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  const saturation = maximum === 0 ? 0 : delta / maximum;
  const linear = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  );
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  return { luminance, saturation, hue };
}

function adaptStyleColors<T extends ViewStyle | TextStyle | ImageStyle>(
  style: T,
  colors: AppColors
): T {
  const adapted: Record<string, unknown> = { ...style };
  Object.entries(adapted).forEach(([property, value]) => {
    if (typeof value !== 'string') return;
    const color = parseHexColor(value);
    if (!color) return;

    if (property === 'backgroundColor') {
      if (color.luminance > 0.9) {
        adapted[property] = color.saturation < 0.12
          ? (color.luminance > 0.985 ? colors.surface : colors.background)
          : colors.surfaceVariant;
      } else if (color.luminance > 0.72) {
        adapted[property] = colors.surfaceVariant;
      } else if (color.luminance > 0.18 && color.luminance < 0.46 && color.saturation > 0.5) {
        adapted[property] = colors.accentSurface;
      }
      return;
    }

    if (property === 'color') {
      if (color.luminance < 0.3) {
        if (color.saturation > 0.45 && (color.hue < 12 || color.hue > 345)) {
          adapted[property] = colors.error;
        } else if (color.saturation > 0.65) {
          adapted[property] = colors.accent;
        } else {
          adapted[property] = colors.text;
        }
      } else if (color.luminance < 0.56 && color.saturation < 0.42) {
        adapted[property] = colors.textSecondary;
      }
      return;
    }

    if (property.startsWith('border') && property.endsWith('Color') && color.luminance > 0.42) {
      adapted[property] = colors.border;
    }
  });
  return adapted as T;
}

export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(baseStyles: T): T {
  const { colors, isDark } = useAppTheme();
  return useMemo(() => {
    if (!isDark) return baseStyles;

    const themed = {} as T;
    (Object.keys(baseStyles) as Array<keyof T>).forEach((key) => {
      const flattened = StyleSheet.flatten(baseStyles[key]) as ViewStyle | TextStyle | ImageStyle;
      themed[key] = adaptStyleColors(flattened, colors) as T[typeof key];
    });
    return themed;
  }, [baseStyles, colors, isDark]);
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppColorMode>('light');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(APP_COLOR_MODE_KEY)
      .then((storedMode) => {
        if (!active) return;
        const nextMode: AppColorMode = storedMode === 'dark' ? 'dark' : 'light';
        setModeState(nextMode);
        Appearance.setColorScheme(nextMode);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'Could not load appearance preferences.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const setMode = async (nextMode: AppColorMode) => {
    await AsyncStorage.setItem(APP_COLOR_MODE_KEY, nextMode);
    setModeState(nextMode);
    setLoadError(null);
    Appearance.setColorScheme(nextMode);
  };

  const value = useMemo<AppThemeValue>(() => ({
    mode,
    isDark: mode === 'dark',
    colors: palettes[mode],
    loadError,
    setMode,
  }), [loadError, mode]);

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme(): AppThemeValue {
  const context = useContext(AppThemeContext);
  if (!context) throw new Error('useAppTheme must be used within AppThemeProvider.');
  return context;
}

