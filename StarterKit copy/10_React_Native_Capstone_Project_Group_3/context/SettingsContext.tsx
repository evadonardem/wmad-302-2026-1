/**
 * Settings Context - persisted app preferences plus everything derived from
 * them: the active season and color palette (light/dark × season), the Paper
 * and navigation themes, and the translation function.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { TextStyle, useColorScheme } from 'react-native';
import type { MD3Theme } from 'react-native-paper';
import type { Theme as NavigationTheme } from '@react-navigation/native';
import { AppSettings, DEFAULT_SETTINGS, ThemeSeason } from '@/types/account';
import { getPalette, Palette } from '@/constants/palettes';
import { resolveSeason } from '@/constants/seasons';
import { displayFont } from '@/constants/fonts';
import { setDisplayCurrency } from '@/utils/format';
import { buildNavigationTheme, buildPaperTheme } from '@/constants/theme';
import { translate, TranslateFn } from '@/i18n/translations';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/utils/storage';

interface SettingsContextType {
  settings: AppSettings;
  hydrated: boolean;
  updateSettings: (changes: Partial<AppSettings>) => void;
  palette: Palette;
  isDark: boolean;
  /** The active theme after resolving "auto". */
  season: ThemeSeason;
  /** True while the Christmas theme is active (gift wrap copy, XMAS25, gift icons). */
  isHoliday: boolean;
  paperTheme: MD3Theme;
  navigationTheme: NavigationTheme;
  t: TranslateFn;
  /** Heading style in the season's display font, e.g. heading(24). */
  heading: (size: number) => TextStyle;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    getStorageItem<Partial<AppSettings>>(STORAGE_KEYS.SETTINGS).then((stored) => {
      // Merge so settings added in later versions get their defaults
      if (stored) setSettings({ ...DEFAULT_SETTINGS, ...stored });
      setHydrated(true);
    });
  }, []);

  const updateSettings = useCallback((changes: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...changes };
      setStorageItem(STORAGE_KEYS.SETTINGS, next).catch(() => undefined);
      return next;
    });
  }, []);

  const isDark = settings.themeMode === 'system' ? systemScheme === 'dark' : settings.themeMode === 'dark';
  const season = resolveSeason(settings.seasonTheme);
  // formatPrice reads this; set during render so children format with the new currency right away
  setDisplayCurrency(settings.currency);

  const value = useMemo<SettingsContextType>(() => {
    const palette = getPalette(isDark, season);
    return {
      settings,
      hydrated,
      updateSettings,
      palette,
      isDark,
      season,
      isHoliday: season === 'christmas',
      paperTheme: buildPaperTheme(palette),
      navigationTheme: buildNavigationTheme(palette),
      t: (key, vars) => translate(settings.language, key, vars),
      heading: (size) => displayFont(season, size),
    };
  }, [settings, hydrated, updateSettings, isDark, season]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

/** Shorthand for the active palette and theme flags. */
export function useAppTheme() {
  const { palette, isDark, isHoliday, season } = useSettings();
  return { palette, isDark, isHoliday, season };
}

/** Shorthand for the translation function. */
export function useT(): TranslateFn {
  return useSettings().t;
}
