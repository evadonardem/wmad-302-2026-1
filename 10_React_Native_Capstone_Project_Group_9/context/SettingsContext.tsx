import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MD3DarkTheme, PaperProvider } from 'react-native-paper';
import { theme } from '@/constants/theme';
import { getStorageItem, setStorageItem } from '@/utils/storage';
import { getUsdExchangeRates } from '@/utils/currency';

export interface AppSettings {
  darkTheme: boolean;
  notificationsEnabled: boolean;
  shareActivity: boolean;
  currencyCode: string;
}

const defaultSettings: AppSettings = {
  darkTheme: false,
  notificationsEnabled: true,
  shareActivity: false,
  currencyCode: 'USD',
};

interface SettingsContextValue {
  settings: AppSettings;
  isLoading: boolean;
  currencyRates: Record<string, number>;
  currencyRatesLoading: boolean;
  currencyRatesError: string | null;
  currencyRatesDate: string | null;
  refreshCurrencyRates: () => Promise<boolean>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [currencyRates, setCurrencyRates] = useState<Record<string, number>>({ USD: 1 });
  const [currencyRatesLoading, setCurrencyRatesLoading] = useState(true);
  const [currencyRatesError, setCurrencyRatesError] = useState<string | null>(null);
  const [currencyRatesDate, setCurrencyRatesDate] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      const [savedSettings, ratesResult] = await Promise.all([
        getStorageItem<Partial<AppSettings>>('user_settings'),
        getUsdExchangeRates()
          .then((rates) => ({ rates }))
          .catch((error: unknown) => ({ error })),
      ]);
      if (!active) return;

      const rates = 'rates' in ratesResult ? ratesResult.rates : null;
      const nextRates = rates?.rates ?? { USD: 1 };
      const nextSettings = { ...defaultSettings, ...savedSettings };
      if (!savedSettings?.currencyCode && nextRates.PHP) {
        nextSettings.currencyCode = 'PHP';
      }
      if (!nextRates[nextSettings.currencyCode]) {
        nextSettings.currencyCode = 'USD';
      }

      setSettings(nextSettings);
      setCurrencyRates(nextRates);
      setCurrencyRatesDate(rates?.date ?? null);
      setCurrencyRatesError(
        rates?.warning ??
          ('error' in ratesResult
            ? ratesResult.error instanceof Error
              ? ratesResult.error.message
              : 'Unable to load currency exchange rates.'
            : null)
      );
      setIsLoading(false);
      setCurrencyRatesLoading(false);
    };

    void loadSettings();
    return () => { active = false; };
  }, []);

  const refreshCurrencyRates = useCallback(async (): Promise<boolean> => {
    setCurrencyRatesLoading(true);
    setCurrencyRatesError(null);
    try {
      const result = await getUsdExchangeRates();
      setCurrencyRates(result.rates);
      setCurrencyRatesDate(result.date);
      setCurrencyRatesError(result.warning ?? null);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load currency exchange rates.';
      setCurrencyRatesError(message);
      return false;
    } finally {
      setCurrencyRatesLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    if (updates.currencyCode && !currencyRates[updates.currencyCode]) {
      throw new Error(`Exchange rates for ${updates.currencyCode} are not available.`);
    }
    const nextSettings = { ...settings, ...updates };
    await setStorageItem('user_settings', nextSettings);
    setSettings(nextSettings);
  }, [currencyRates, settings]);

  const contextValue = useMemo(
    () => ({
      settings,
      isLoading,
      currencyRates,
      currencyRatesLoading,
      currencyRatesError,
      currencyRatesDate,
      refreshCurrencyRates,
      updateSettings,
    }),
    [
      settings,
      isLoading,
      currencyRates,
      currencyRatesLoading,
      currencyRatesError,
      currencyRatesDate,
      refreshCurrencyRates,
      updateSettings,
    ]
  );
  const paperTheme = settings.darkTheme
    ? { ...MD3DarkTheme, colors: { ...MD3DarkTheme.colors, primary: '#A8B394' } }
    : theme;

  return (
    <SettingsContext.Provider value={contextValue}>
      <PaperProvider theme={paperTheme}>{children}</PaperProvider>
    </SettingsContext.Provider>
  );
}

export function useAppSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useAppSettings must be used within a SettingsProvider');
  return context;
}
