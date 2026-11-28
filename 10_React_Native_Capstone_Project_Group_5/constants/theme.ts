/**
 * React Native Paper Theme - Marketplace App
 * Clean, commerce-friendly color palette
 * Design tokens + Paper theme. Soft minimal: soft lavender pages, deep purple actions,
 * serif display type, rounded cards. Responsive helper (useResponsive) is at the bottom of this file.
 */
import { Platform, useWindowDimensions, ViewStyle } from 'react-native';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const lightPalette = {
  ivory: '#F4EEFB',
  surface: '#FCFAFF',
  sand: '#EADFF8',
  blush: '#EFE6FA',
  beige: '#E2D4F5',
  night: '#2E1A5C',
  night2: '#43286F',
  forest: '#3F2380',
  forestLight: '#5B35A3',
  gold: '#F2C45A',
  rose: '#8B5FD0',
  roseLight: '#E5D9F7',
  ink: '#241540',
  sage: '#4B2A94',
  maroon: '#4B2A94', // legacy key name (was brand red); now the lavender-purple primary so older style files follow
  stone: '#6E5F8A',
  mist: '#B5A7CE',
  line: '#E1D6F1',
  accent: '#6B3FC4',
  accentSoft: '#E9DFFA',
  mint: '#CFEBDD',
  star: '#E0A53A',
  success: '#4F8F6A',
  danger: '#C0475F',
} as const;

export type Palette = { [K in keyof typeof lightPalette]: string };

// Dark mode inverts the roles: "dark with light text" things (buttons, tags) become "light with dark text"
const darkPalette: Palette = {
  ivory: '#15101F',
  surface: '#1F1832',
  sand: '#2A2040',
  blush: '#241B38',
  beige: '#33284D',
  night: '#E9E0F8',
  night2: '#D7CBEF',
  forest: '#CDB8F5',
  forestLight: '#B79CE8',
  gold: '#F2C45A',
  rose: '#9B7BDA',
  roseLight: '#2E2347',
  ink: '#F1EBFA',
  sage: '#CDB8F5',
  maroon: '#CDB8F5',
  stone: '#B3A7CB',
  mist: '#6F6290',
  line: '#33284D',
  accent: '#CDB8F5',
  accentSoft: '#2A2040',
  mint: '#3E6E57',
  star: '#E0A53A',
  success: '#7BC49A',
  danger: '#E5788D',
};

/**
 * The live palette. Everything reads colors from here at render time, and applyThemeMode()
 * swaps the values (the app is remounted afterwards, see providers.tsx).
 */
export const palette: Palette = { ...lightPalette };

let paletteVersion = 0;

/** hex color + opacity -> rgba(), so animated colors can follow the live palette */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export type ResolvedMode = 'light' | 'dark';

export function applyThemeMode(mode: ResolvedMode): void {
  Object.assign(palette, mode === 'dark' ? darkPalette : lightPalette);
  paletteVersion += 1;
}

/**
 * Style sheets that depend on the palette: rebuilt lazily whenever the palette changes.
 * Use like: export const styles = themed(() => StyleSheet.create({ ... palette.ink ... }));
 */
export function themed<T extends object>(factory: () => T): T {
  let cache: T | null = null;
  let builtFor = -1;
  return new Proxy({} as T, {
    get(_target, key) {
      if (cache === null || builtFor !== paletteVersion) {
        cache = factory();
        builtFor = paletteVersion;
      }
      return (cache as Record<string | symbol, unknown>)[key];
    },
  });
}

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

export const typeface = {
  display: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }),
  body: 'System',
};

export function buildTheme(mode: ResolvedMode) {
  const base = mode === 'dark' ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    roundness: radius.sm,
    colors: {
      ...base.colors,
      primary: palette.maroon,       // Deep purple (was Google/Trust blue)
      onPrimary: palette.surface,
      primaryContainer: palette.blush,
      onPrimaryContainer: palette.maroon,
      secondary: palette.rose,       // Violet (was Indigo)
      onSecondary: palette.surface,
      secondaryContainer: palette.sand,
      tertiary: palette.success,     // Success green
      surface: palette.surface,
      surfaceVariant: palette.sand,
      background: palette.ivory,
      error: palette.danger,
      onSurface: palette.ink,
      onSurfaceVariant: palette.stone,
      onBackground: palette.ink,
      outline: palette.line,
      outlineVariant: palette.line,
    },
  };
}

// Light theme for code that still imports `theme` directly
export const theme = buildTheme('light');

/**
 * Responsive helpers - one place that decides how the layout adapts to phone / tablet / desktop (web)
 */
// Pages use the whole screen (this cap only stops absurdly wide monitors from stretching forever)
export const MAX_CONTENT_WIDTH = 2400;

// Web: a vertical scrollbar takes ~15px from every scrolling page, but window.innerWidth still
// includes it. Layouts that compute widths from the window overflowed (cut off) by that much,
// so the scrollbar width is measured once and subtracted.
interface DomLike {
  createElement(tag: string): { style: { cssText: string }; offsetWidth: number; clientWidth: number };
  body: { appendChild(node: unknown): void; removeChild(node: unknown): void };
}

function measureScrollbar(): number {
  if (Platform.OS !== 'web') return 0;
  const dom = (globalThis as unknown as { document?: DomLike }).document;
  if (!dom) return 0;
  const probe = dom.createElement('div');
  probe.style.cssText = 'width:100px;height:100px;overflow:scroll;position:absolute;top:-9999px;visibility:hidden';
  dom.body.appendChild(probe);
  const size = probe.offsetWidth - probe.clientWidth;
  dom.body.removeChild(probe);
  return size > 0 && size < 40 ? size : 0;
}

export const WEB_SCROLLBAR = measureScrollbar();

/** Soft shadow that works everywhere: boxShadow on web (shadow* props are deprecated there), shadow + elevation on phones */
export function softShadow(color: string, opacity: number, radius: number, offsetY: number, elevation = 2): ViewStyle {
  if (Platform.OS === 'web') {
    return { boxShadow: `0px ${offsetY}px ${radius}px ${withAlpha(color, opacity)}` } as unknown as ViewStyle;
  }
  return { shadowColor: color, shadowOffset: { width: 0, height: offsetY }, shadowOpacity: opacity, shadowRadius: radius, elevation };
}

// pointerEvents belongs in the style (the prop is deprecated on web)
export const NO_TOUCH = { pointerEvents: 'none' } as unknown as ViewStyle;
export const TOUCH = { pointerEvents: 'auto' } as unknown as ViewStyle;
export const touchWhen = (on: boolean): ViewStyle => (on ? TOUCH : NO_TOUCH);

export type Breakpoint = 'phone' | 'tablet' | 'desktop';

export interface ResponsiveInfo {
  width: number;
  breakpoint: Breakpoint;
  isWide: boolean;
  /** Width of the centred content column */
  contentWidth: number;
  /** Product grid columns */
  columns: number;
  /** Very wide screens (large monitors) */
  isUltra: boolean;
  /** Horizontal page padding */
  pad: number;
}

export function useResponsive(): ResponsiveInfo {
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.max(0, windowWidth - WEB_SCROLLBAR);
  const breakpoint: Breakpoint = width >= 1024 ? 'desktop' : width >= 640 ? 'tablet' : 'phone';
  const isUltra = width >= 1400;
  return {
    width,
    breakpoint,
    isWide: breakpoint !== 'phone',
    isUltra,
    contentWidth: Math.min(width, MAX_CONTENT_WIDTH),
    // more columns as the screen grows: 2 / 3 / 4 / 5 / 6
    columns: width >= 1800 ? 6 : width >= 1400 ? 5 : breakpoint === 'desktop' ? 4 : breakpoint === 'tablet' ? 3 : 2,
    pad: breakpoint === 'phone' ? 16 : breakpoint === 'tablet' ? 32 : isUltra ? 56 : 40,
  };
}