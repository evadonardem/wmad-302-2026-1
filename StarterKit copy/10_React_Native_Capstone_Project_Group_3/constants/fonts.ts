/**
 * Display fonts per theme (Google Fonts via @expo-google-fonts, one weight each
 * so only the needed file is bundled). Used for big headings only; body text
 * keeps the system font for readability.
 */
import { AmaticSC_700Bold } from '@expo-google-fonts/amatic-sc/700Bold';
import { Comfortaa_700Bold } from '@expo-google-fonts/comfortaa/700Bold';
import { Creepster_400Regular } from '@expo-google-fonts/creepster/400Regular';
import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { LilitaOne_400Regular } from '@expo-google-fonts/lilita-one/400Regular';
import { MountainsofChristmas_700Bold } from '@expo-google-fonts/mountains-of-christmas/700Bold';
import { Pacifico_400Regular } from '@expo-google-fonts/pacifico/400Regular';
import { Sniglet_800ExtraBold } from '@expo-google-fonts/sniglet/800ExtraBold';
import type { TextStyle } from 'react-native';
import type { ThemeSeason } from '@/types/account';

/** Passed to `useFonts` in the root layout. */
export const SEASON_FONT_ASSETS = {
  AmaticSC_700Bold,
  Comfortaa_700Bold,
  Creepster_400Regular,
  Fredoka_700Bold,
  LilitaOne_400Regular,
  MountainsofChristmas_700Bold,
  Pacifico_400Regular,
  Sniglet_800ExtraBold,
};

interface SeasonFont {
  family: keyof typeof SEASON_FONT_ASSETS;
  /** Some faces look smaller or larger than the system font at the same size. */
  scale: number;
}

export const SEASON_FONTS: Record<ThemeSeason, SeasonFont> = {
  lively: { family: 'Fredoka_700Bold', scale: 1 },
  christmas: { family: 'MountainsofChristmas_700Bold', scale: 1.15 },
  winter: { family: 'Sniglet_800ExtraBold', scale: 1 },
  spring: { family: 'Pacifico_400Regular', scale: 0.92 },
  summer: { family: 'LilitaOne_400Regular', scale: 1.05 },
  rainy: { family: 'Comfortaa_700Bold', scale: 0.95 },
  autumn: { family: 'AmaticSC_700Bold', scale: 1.35 },
  halloween: { family: 'Creepster_400Regular', scale: 1.1 },
};

let fontsReady = false;

/** Called by the root layout once fonts are loaded (or failed to load). */
export function setFontsReady(ready: boolean): void {
  fontsReady = ready;
}

/**
 * Heading style in the season's display font. Falls back to a bold system font
 * when the fonts are not loaded (iOS errors on unknown font families).
 */
export function displayFont(season: ThemeSeason, size: number): TextStyle {
  if (!fontsReady) return { fontSize: size, fontWeight: '800' };
  const font = SEASON_FONTS[season];
  return { fontFamily: font.family, fontSize: Math.round(size * font.scale), fontWeight: 'normal' };
}
