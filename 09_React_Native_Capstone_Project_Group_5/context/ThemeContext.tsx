/**
 * ThemeContext - light / dark / system appearance for the whole app.
 *
 * How it works (kept deliberately small so the existing screens didn't need rewriting):
 *  - Every style file declares its colours once, in the light palette, using `createStyles()`.
 *  - In dark mode `createStyles()` hands back the same styles with each colour swapped for its
 *    dark twin (see `themeColor`). Colours written inline use `tc('#3C252D')` the same way.
 *  - Components call `useAppTheme()` so they re-render when the mode changes.
 *  - The chosen mode is saved with AsyncStorage so it survives restarts.
 */
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme_mode';

/** Read by `createStyles` / `tc` while rendering. Set by ThemeProvider before children render. */
let DARK = false;
export const isDark = () => DARK;

/* ------------------------------------------------------------------ */
/* Palette: light colour -> dark colour                                */
/* ------------------------------------------------------------------ */

const TEXT: Record<string, string> = {
    '#2A2124': '#F6E5EB',
    '#3C252D': '#EFDCE3',
    '#4C303A': '#E1C5CF',
    '#5A3A46': '#CFB1BC',
    '#6A4452': '#C1A0AC',
    '#8A6673': '#C4A7B3',
    '#9E828C': '#B49CA7',
    '#BAA6AD': '#A68F9A',
    '#C62828': '#EF5350',
    '#D81B60': '#FF6F9F', // main berry accent used as text / icon colour
    '#AD1457': '#FF8AB4',
    '#C2185B': '#FF7AA8',
    '#880E4F': '#F48FB1',
    '#2E7D32': '#81C784',
};

const BG: Record<string, string> = {
    '#F5EBEF': '#140E10', // page
    '#FEF9FB': '#191315', // page (alt)
    '#FEF6F9': '#191315',
    '#FFFFFF': '#221B1D', // cards / surfaces
    '#EFE9EB': '#2B2125',
    '#F0E4E8': '#2B2125',
    '#EFDEE4': '#2B2125',
    '#F1E0E6': '#2B2125',
    '#E8D5DC': '#32272B', // skeletons
    '#2A2124': '#48343B', // dark bars / selected pills (white text on top)
    '#FDEDED': '#3A1F1F',
    '#F8BBD0': '#721A3A', // search banner
};

const BORDER: Record<string, string> = {
    '#2A2124': '#48343B',
    '#BAA6AD': '#58444B',
    '#E0E0E0': '#3A2B31',
};

function lum(hex: string): number {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function mix(hex: string, toward: string, t: number): string {
    const a = parseInt(hex.slice(1), 16);
    const b = parseInt(toward.slice(1), 16);
    const ch = (shift: number) => {
        const x = (a >> shift) & 255;
        const y = (b >> shift) & 255;
        return Math.round(x + (y - x) * t)
            .toString(16)
            .padStart(2, '0');
    };
    return `#${ch(16)}${ch(8)}${ch(0)}`.toUpperCase();
}

const HEX = /^#[0-9A-F]{6}$/;
const WHITE_RGBA = /^rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*([\d.]+)\s*\)$/i;

/** Turns a light-theme colour into its dark-theme twin. `prop` is the style key it was used for. */
export function themeColor(prop: string, value: string, dark: boolean = DARK): string {
    if (!dark || typeof value !== 'string') return value;
    const p = prop.toLowerCase();
    if (p.includes('shadow')) return value;
    const v = value.toUpperCase();
    const isBg = p === 'backgroundcolor' || p === 'containercolor';
    const isBorder = p.includes('border');

    // Translucent white panels (floating buttons, badges) become translucent dark panels.
    const white = WHITE_RGBA.exec(value);
    if (white) {
        const alpha = Number(white[1]);
        if (isBg && alpha === 0.45) return 'rgba(255,255,255,0.14)'; // translucent tags on the search banner
        return isBg && alpha >= 0.8 ? `rgba(34,27,29,${alpha})` : value;
    }
    if (!HEX.test(v)) return value;

    if (isBorder) {
        if (BORDER[v]) return BORDER[v];
        if (v === '#FFFFFF' || v === '#D81B60' || v === '#C62828') return value;
        return lum(v) > 0.75 ? '#3A2B31' : value; // every pale beige hairline -> dark hairline
    }
    if (isBg) {
        if (BG[v]) return BG[v];
        // Pale tints (cream, peach, light yellow/green) -> deep tints; strong colours are left alone.
        return lum(v) > 0.8 ? mix(v, '#1C1316', 0.84) : value;
    }
    return TEXT[v] ?? value; // text / icon colours: white and the berry accent stay as they are
}

/** Themed colour for inline use: `style={{ color: tc('#3C252D') }}` or `tc(c, 'backgroundColor')`. */
export function tc(value: string, prop: string = 'color'): string {
    return themeColor(prop, value);
}

type Dict = Record<string, unknown>;

function mapStyle(style: Dict): Dict {
    const out: Dict = {};
    for (const key of Object.keys(style)) {
        const val = style[key];
        out[key] = typeof val === 'string' && /color$/i.test(key) ? themeColor(key, val, true) : val;
    }
    return out;
}

/**
 * Drop-in for `StyleSheet.create`. Write the light colours; in dark mode the colours are swapped.
 * Each entry is mapped once and cached, so style identities stay stable between renders.
 */
export function createStyles<T extends StyleSheet.NamedStyles<T>>(base: T | StyleSheet.NamedStyles<T>): T {
    const darkCache: Dict = {};
    const out = {} as Dict;
    for (const key of Object.keys(base)) {
        const light = (base as Dict)[key] as Dict;
        Object.defineProperty(out, key, {
            enumerable: true,
            get: () => {
                if (!DARK) return light;
                if (!darkCache[key]) darkCache[key] = mapStyle(light);
                return darkCache[key];
            },
        });
    }
    return out as unknown as T;
}

/* ------------------------------------------------------------------ */
/* Provider + hook                                                     */
/* ------------------------------------------------------------------ */

interface ThemeContextValue {
    mode: ThemeMode;
    dark: boolean;
    setMode: (mode: ThemeMode) => void;
    toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    mode: 'light',
    dark: false,
    setMode: () => { },
    toggle: () => { },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const system = useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>('light');
    const [ready, setReady] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY)
            .then((saved) => {
                if (saved === 'light' || saved === 'dark' || saved === 'system') setModeState(saved);
            })
            .catch(() => { })
            .finally(() => setReady(true));
    }, []);

    const dark = mode === 'dark' || (mode === 'system' && system === 'dark');
    DARK = dark; // must be set before the children render

    const setMode = useCallback((next: ThemeMode) => {
        setModeState(next);
        AsyncStorage.setItem(STORAGE_KEY, next).catch(() => { });
    }, []);

    const toggle = useCallback(() => setMode(DARK ? 'light' : 'dark'), [setMode]);

    const value = useMemo(() => ({ mode, dark, setMode, toggle }), [mode, dark, setMode, toggle]);

    if (!ready) return null;
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
    return useContext(ThemeContext);
}