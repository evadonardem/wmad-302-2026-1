import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PaperProvider } from 'react-native-paper';
import { darkTheme, lightTheme } from '@/constants/theme';

const THEME_STORAGE_KEY = 'app_theme_mode';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  isReady: boolean;
  error: string | null;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((storedMode) => {
        if (!active || storedMode === null) return;
        if (!isThemeMode(storedMode)) throw new Error('Saved appearance setting is invalid.');
        setModeState(storedMode);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : 'Could not load the appearance setting.');
        }
      })
      .finally(() => {
        if (active) setIsReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback(async (nextMode: ThemeMode) => {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
    setModeState(nextMode);
    setError(null);
  }, []);

  const value = useMemo(() => ({ mode, isReady, error, setMode }), [mode, isReady, error, setMode]);
  return (
    <ThemeContext.Provider value={value}>
      <PaperProvider theme={mode === 'dark' ? darkTheme : lightTheme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeMode must be used within AppThemeProvider.');
  return context;
}
