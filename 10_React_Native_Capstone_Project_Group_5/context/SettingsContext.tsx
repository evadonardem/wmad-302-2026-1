/**
 * Settings Context - theme, notifications and privacy preferences
 * Persisted to AsyncStorage. The theme choice (light / dark / system) swaps the live palette
 * from constants/theme.ts before the app renders, and the app is remounted when it changes.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyThemeMode, ResolvedMode } from '@/constants/theme';

const STORAGE_KEY = 'app_settings';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
    theme: ThemeMode;
    notifications: {
        orders: boolean;
        promotions: boolean;
        arrivals: boolean;
    };
    privacy: {
        saveRecentSearches: boolean;
        showEmail: boolean;
    };
}

export const DEFAULT_SETTINGS: AppSettings = {
    theme: 'light',
    notifications: { orders: true, promotions: true, arrivals: false },
    privacy: { saveRecentSearches: true, showEmail: true },
};

interface SettingsContextType {
    settings: AppSettings;
    /** 'light' or 'dark' after resolving "system" */
    resolvedMode: ResolvedMode;
    updateSettings: (patch: Partial<AppSettings>) => void;
    resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Keep only known keys with the right types, so old or broken saved data can never crash the app
function sanitize(raw: unknown): AppSettings {
    const next: AppSettings = {
        theme: DEFAULT_SETTINGS.theme,
        notifications: { ...DEFAULT_SETTINGS.notifications },
        privacy: { ...DEFAULT_SETTINGS.privacy },
    };
    if (typeof raw !== 'object' || raw === null) return next;
    const data = raw as Partial<Record<keyof AppSettings, unknown>>;
    if (data.theme === 'light' || data.theme === 'dark' || data.theme === 'system') next.theme = data.theme;
    const n = data.notifications as Partial<AppSettings['notifications']> | undefined;
    if (n && typeof n === 'object') {
        if (typeof n.orders === 'boolean') next.notifications.orders = n.orders;
        if (typeof n.promotions === 'boolean') next.notifications.promotions = n.promotions;
        if (typeof n.arrivals === 'boolean') next.notifications.arrivals = n.arrivals;
    }
    const p = data.privacy as Partial<AppSettings['privacy']> | undefined;
    if (p && typeof p === 'object') {
        if (typeof p.saveRecentSearches === 'boolean') next.privacy.saveRecentSearches = p.saveRecentSearches;
        if (typeof p.showEmail === 'boolean') next.privacy.showEmail = p.showEmail;
    }
    return next;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
    const systemScheme = useColorScheme();
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY)
            .then((raw) => {
                if (raw) setSettings(sanitize(JSON.parse(raw)));
            })
            .catch(() => undefined)
            .finally(() => setHydrated(true));
    }, []);

    const persist = useCallback((next: AppSettings) => {
        setSettings(next);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((error) => console.error('Failed to save settings:', error));
    }, []);

    const updateSettings = useCallback(
        (patch: Partial<AppSettings>) => {
            persist({
                theme: patch.theme ?? settings.theme,
                notifications: { ...settings.notifications, ...patch.notifications },
                privacy: { ...settings.privacy, ...patch.privacy },
            });
        },
        [persist, settings]
    );

    const resetSettings = useCallback(() => persist(DEFAULT_SETTINGS), [persist]);

    const resolvedMode: ResolvedMode =
        settings.theme === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : settings.theme;

    // Swap the palette before any child renders with it
    applyThemeMode(resolvedMode);

    const value = useMemo<SettingsContextType>(
        () => ({ settings, resolvedMode, updateSettings, resetSettings }),
        [settings, resolvedMode, updateSettings, resetSettings]
    );

    // Wait for the saved settings so the first paint already uses the right theme
    if (!hydrated) return null;

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextType {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}

export { SettingsContext };