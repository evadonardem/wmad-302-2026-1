import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { createTheme, getColors, type AppColors, type ThemeMode } from '@/constants/theme';

const THEME_STORAGE_KEY = 'cookbook_theme_mode';

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  colors: AppColors;
  paperTheme: ReturnType<typeof createTheme>;
  setMode: (mode: ThemeMode) => void;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((storedMode) => {
      if (storedMode === 'system' || storedMode === 'light' || storedMode === 'dark') {
        setModeState(storedMode);
      }
    }).catch((error) => {
      console.error('Failed to load theme preference:', error);
    });
  }, []);

  const setMode = (nextMode: ThemeMode) => {
    setModeState(nextMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode).catch((error) => {
      console.error('Failed to save theme preference:', error);
    });
  };

  const value = useMemo(() => ({
    mode,
    isDark,
    colors: getColors(isDark),
    paperTheme: createTheme(isDark),
    setMode,
    toggleDarkMode: () => setMode(isDark ? 'light' : 'dark'),
  }), [isDark, mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return context;
}
