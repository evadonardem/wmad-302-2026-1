/**
 * Theme Context - light / dark mode
 *
 * The user picks 'system' (follow the phone setting), 'light' or 'dark' in
 * Settings. The choice is saved in AsyncStorage and restored on app start.
 */
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { AppTheme, darkTheme, lightTheme } from '@/constants/theme';
import { getStorageItem, setStorageItem } from '@/utils/storage';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextType {
  /** What the user chose in Settings */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  /** Whether dark mode is currently showing */
  isDark: boolean;
  /** The active Paper theme */
  theme: AppTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  // Restore the saved choice
  useEffect(() => {
    getStorageItem<ThemePreference>('theme_preference').then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setPreferenceState(saved);
      }
    });
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    setStorageItem('theme_preference', next).catch((err) =>
      console.error('Failed to save theme preference:', err)
    );
  }, []);

  const isDark = preference === 'system' ? systemScheme === 'dark' : preference === 'dark';

  const value = useMemo(
    () => ({ preference, setPreference, isDark, theme: isDark ? darkTheme : lightTheme }),
    [preference, setPreference, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemePreference must be used within an AppThemeProvider');
  }
  return context;
}
