/**
 * ThemeContext - light / dark / system appearance for the whole app.
 *
 * How it works (kept deliberately small so the existing screens didn't need rewriting):
 *  - Every style file declares its colours once, in the light palette, using `createStyles()`.
 *  - In dark mode `createStyles()` hands back the same styles with each colour swapped for its
 *    dark twin (see `themeColor`). Colours written inline use `tc('#3E2723')` the same way.
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
    '#2B2320': '#F7EEE4',
    '#3E2723': '#F1E6DA',
    '#4E342E': '#E3D2C3',
    '#5D4037': '#D2BDAE',
    '#6D4C41': '#C4AC9D',
    '#8D6E63': '#B09C90',
    '#A1887F': '#9A867C',
    '#BCAAA4': '#8E7C73',
    '#C62828': '#EF5350',
    '#D4500A': '#FF8A4C',
    '#EF6C00': '#FFA040',
    '#E65100': '#FFB066',
    '#2E7D32': '#81C784',
};

const BG: Record<string, string> = {
    '#F6F1EA': '#14100E', // page
    '#FFFDF8': '#1A1512', // page (alt)
    '#FFFBF5': '#1A1512',
    '#FFFFFF': '#231D1A', // cards / surfaces
    '#EFEBE9': '#2C2420',
    '#F1EBE3': '#2C2420',
    '#F1E7DC': '#2C2420',
    '#F3E9DE': '#2C2420',
    '#EADFD3': '#332A26', // skeletons
    '#2B2320': '#4A3A32', // dark bars / selected pills (white text on top)
    '#FDEDED': '#3A1F1F',
    '#FFB74D': '#7A4A12', // search banner
};

const BORDER: Record<string, string> = {
    '#2B2320': '#4A3A32',
    '#BCAAA4': '#5A4A42',
    '#E0E0E0': '#3B302A',
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
        return isBg && alpha >= 0.8 ? `rgba(35,29,26,${alpha})` : value;
    }
    if (!HEX.test(v)) return value;

    if (isBorder) {
        if (BORDER[v]) return BORDER[v];
        if (v === '#FFFFFF' || v === '#E85D04' || v === '#C62828') return value;
        return lum(v) > 0.75 ? '#3B302A' : value; // every pale beige hairline -> dark hairline
    }
    if (isBg) {
        if (BG[v]) return BG[v];
        // Pale tints (cream, peach, light yellow/green) -> deep tints; strong colours are left alone.
        return lum(v) > 0.8 ? mix(v, '#1D1512', 0.84) : value;
    }
    return TEXT[v] ?? value; // text / icon colours: white and orange stay as they are
}

/** Themed colour for inline use: `style={{ color: tc('#3E2723') }}` or `tc(c, 'backgroundColor')`. */
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