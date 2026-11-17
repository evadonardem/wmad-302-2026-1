
/**
 * Theme Context
 * Supports System, Light, and Dark appearance modes.
 * Saves the selected mode in the existing user_settings storage.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import type { MD3Theme } from 'react-native-paper';

import { lightTheme, darkTheme } from '@/constants/theme';
import {
  getStorageItem,
  setStorageItem,
} from '@/utils/storage';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  theme: MD3Theme;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isThemeLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceColorScheme = useColorScheme();

  const [mode, setMode] = useState<ThemeMode>('system');
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  // Load the saved theme preference when the app starts.
  useEffect(() => {
    let isMounted = true;

    async function loadThemePreference() {
      try {
        const settings =
          await getStorageItem<Record<string, unknown>>('user_settings');

        const savedMode = settings?.themeMode;

        if (
          isMounted &&
          (savedMode === 'system' ||
            savedMode === 'light' ||
            savedMode === 'dark')
        ) {
          setMode(savedMode);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        if (isMounted) {
          setIsThemeLoaded(true);
        }
      }
    }

    loadThemePreference();

    return () => {
      isMounted = false;
    };
  }, []);

  // Change the theme and save the preference.
  const setThemeMode = useCallback(async (newMode: ThemeMode) => {
    setMode(newMode);

    try {
      const currentSettings =
        (await getStorageItem<Record<string, unknown>>('user_settings')) ??
        {};

      await setStorageItem('user_settings', {
        ...currentSettings,
        themeMode: newMode,
      });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }, []);

  // Resolve the selected mode into the actual light or dark theme.
  const resolvedMode: 'light' | 'dark' =
    mode === 'system'
      ? deviceColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : mode;

  const selectedTheme = useMemo(
    () => (resolvedMode === 'dark' ? darkTheme : lightTheme),
    [resolvedMode],
  );

  const value = useMemo(
    () => ({
      mode,
      resolvedMode,
      theme: selectedTheme,
      setThemeMode,
      isThemeLoaded,
    }),
    [mode, resolvedMode, selectedTheme, setThemeMode, isThemeLoaded],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook for accessing the theme.
export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useAppTheme must be used inside a ThemeProvider.',
    );
  }

  return context;
}

