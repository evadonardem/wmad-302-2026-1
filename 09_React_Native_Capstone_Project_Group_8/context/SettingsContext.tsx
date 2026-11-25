
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { getStorageItem, setStorageItem } from '@/utils/storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export type CookingDifficulty = 'Any' | 'Easy' | 'Medium' | 'Hard';

export interface NotificationSettings {
  recipeRecommendations: boolean;
  mealPlanReminders: boolean;
  newRecipes: boolean;
}

export interface AppSettings {
  themeMode: ThemeMode;
  notifications: NotificationSettings;
  dietaryPreferences: string[];
  preferredCuisines: string[];
  cookingDifficulty: CookingDifficulty;
}

interface SettingsContextType {
  settings: AppSettings;
  isSettingsLoaded: boolean;
  isDarkMode: boolean;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'light',
  notifications: {
    recipeRecommendations: true,
    mealPlanReminders: true,
    newRecipes: false,
  },
  dietaryPreferences: [],
  preferredCuisines: [],
  cookingDifficulty: 'Any',
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        const savedSettings =
          await getStorageItem<Partial<AppSettings>>('user_settings');

        if (!mounted) return;

        if (savedSettings) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...savedSettings,
            notifications: {
              ...DEFAULT_SETTINGS.notifications,
              ...(savedSettings.notifications ?? {}),
            },
            dietaryPreferences:
              savedSettings.dietaryPreferences ?? [],
            preferredCuisines:
              savedSettings.preferredCuisines ?? [],
          });
        }
      } catch (error) {
        console.error('Failed to load app settings:', error);
      } finally {
        if (mounted) {
          setIsSettingsLoaded(true);
        }
      }
    };

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      const updatedSettings: AppSettings = {
        ...settings,
        ...updates,
        notifications: {
          ...settings.notifications,
          ...(updates.notifications ?? {}),
        },
      };

      await setStorageItem('user_settings', updatedSettings);
      setSettings(updatedSettings);
    },
    [settings]
  );

  const isDarkMode =
    settings.themeMode === 'dark' ||
    (settings.themeMode === 'system' && colorScheme === 'dark');

  const value = useMemo(
    () => ({
      settings,
      isSettingsLoaded,
      isDarkMode,
      updateSettings,
    }),
    [settings, isSettingsLoaded, isDarkMode, updateSettings]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error(
      'useSettings must be used inside a SettingsProvider'
    );
  }

  return context;
}
