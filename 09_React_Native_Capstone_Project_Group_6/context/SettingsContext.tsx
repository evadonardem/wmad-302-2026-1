import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { settingsStorage } from '@/utils/storage';

interface SettingsContextValue {
  darkMode: boolean;
  isLoading: boolean;
  error: string | null;
  setDarkMode: (enabled: boolean) => Promise<void>;
  clearError: () => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkModeState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    settingsStorage.get()
      .then((settings) => {
        if (active) setDarkModeState(settings.darkMode);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load app settings.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const setDarkMode = useCallback(async (enabled: boolean) => {
    const previous = darkMode;
    setDarkModeState(enabled);
    setError(null);
    try {
      await settingsStorage.set({ darkMode: enabled });
    } catch (saveError) {
      setDarkModeState(previous);
      const message = saveError instanceof Error ? saveError.message : 'Could not save your appearance setting.';
      setError(message);
      throw saveError;
    }
  }, [darkMode]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <SettingsContext.Provider value={{ darkMode, isLoading, error, setDarkMode, clearError }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
}
