/**
 * Per-season decorations: icons, falling particles and the home banner shortcut.
 * Colors live in `constants/palettes.ts`.
 */
import type { IconName } from '@/constants/categories';
import type { SeasonSetting, ThemeSeason } from '@/types/account';
import { isHolidaySeason, type Palette } from '@/constants/palettes';

export type ParticleKind = 'confetti' | 'snow' | 'bubbles' | 'rain' | 'emoji';

export interface ParticleSpec {
  kind: ParticleKind;
  /** Emoji to draw when kind is "emoji". */
  glyphs?: string[];
  /** Particles float upward instead of falling. */
  rise?: boolean;
}

export interface SeasonInfo {
  emoji: string;
  /** Home avatar and Shop tab icon. */
  icon: IconName;
  /** Large emoji drawn in the corner of the home banner. */
  decoration: string;
  particles: ParticleSpec;
  /** Emoji scattered across the background wallpaper and used in section titles. */
  motifs: string[];
  /** Emoji scene along the bottom of the home hero. */
  scenery: string[];
  /** Box the user taps open in the daily surprise game. */
  surprise: string;
  /** Search params for the banner's shop button. */
  shopParams: Record<string, string>;
}

export const SEASONS: Record<ThemeSeason, SeasonInfo> = {
  lively: {
    emoji: '🌈',
    icon: 'storefront',
    decoration: '🛍️',
    particles: { kind: 'confetti' },
    motifs: ['💖', '🌈', '⭐', '🎈', '🌼'],
    scenery: ['🎈', '🛍️', '🌈', '🎁', '💖', '🎈'],
    surprise: '🎁',
    shopParams: { sort: 'discount' },
  },
  christmas: {
    emoji: '🎄',
    icon: 'pine-tree',
    decoration: '🎄',
    particles: { kind: 'snow' },
    motifs: ['🎄', '🎁', '⭐', '🔔', '❄️'],
    scenery: ['🎄', '🎁', '⛄', '🦌', '🎁', '🎄'],
    surprise: '🎁',
    shopParams: { maxPrice: '25', sort: 'rating' },
  },
  winter: {
    emoji: '❄️',
    icon: 'snowflake',
    decoration: '⛄',
    particles: { kind: 'emoji', glyphs: ['❄️', '❅', '❆'] },
    motifs: ['❄️', '⛄', '🧣', '☃️'],
    scenery: ['🌲', '⛄', '🌲', '🏔️', '☃️', '🌲'],
    surprise: '☃️',
    shopParams: { category: 'skin-care' },
  },
  spring: {
    emoji: '🌸',
    icon: 'flower',
    decoration: '🌷',
    particles: { kind: 'emoji', glyphs: ['🌸', '🌼', '🌷'] },
    motifs: ['🌸', '🌷', '🦋', '🌼'],
    scenery: ['🌷', '🌼', '🦋', '🌸', '🐝', '🌻'],
    surprise: '🥚',
    shopParams: { category: 'womens-dresses' },
  },
  summer: {
    emoji: '☀️',
    icon: 'white-balance-sunny',
    decoration: '🏖️',
    particles: { kind: 'bubbles', rise: true },
    motifs: ['☀️', '🌴', '🍉', '🕶️', '🐚'],
    scenery: ['🌴', '🏖️', '🍉', '🌊', '🐚', '🌴'],
    surprise: '🥥',
    shopParams: { category: 'sunglasses' },
  },
  rainy: {
    emoji: '🌧️',
    icon: 'weather-pouring',
    decoration: '☔',
    particles: { kind: 'rain' },
    motifs: ['☔', '💧', '☁️', '🐸'],
    scenery: ['☔', '🐸', '💧', '🌂', '🐌', '☔'],
    surprise: '☂️',
    shopParams: { category: 'kitchen-accessories' },
  },
  autumn: {
    emoji: '🍂',
    icon: 'leaf-maple',
    decoration: '🍁',
    particles: { kind: 'emoji', glyphs: ['🍂', '🍁', '🍃'] },
    motifs: ['🍁', '🍂', '🍄', '🌰'],
    scenery: ['🍂', '🍄', '🦔', '🍁', '🌰', '🍂'],
    surprise: '🌰',
    shopParams: { category: 'home-decoration' },
  },
  halloween: {
    emoji: '🎃',
    icon: 'halloween',
    decoration: '🎃',
    particles: { kind: 'emoji', glyphs: ['🦇', '👻', '🦇'], rise: true },
    motifs: ['🎃', '🦇', '👻', '🕸️', '🍬'],
    scenery: ['🎃', '🪦', '👻', '🕸️', '🍬', '🎃'],
    surprise: '🎃',
    shopParams: { category: 'beauty' },
  },
};

/** Colors for dot-style particles drawn on the screen background. */
export function getParticleColors(season: ThemeSeason, palette: Palette): string[] {
  switch (SEASONS[season].particles.kind) {
    case 'snow':
      return [palette.isDark ? '#FFFFFF' : '#B7C9DB'];
    case 'rain':
      return [palette.accents[0], palette.secondary];
    default:
      return [palette.primary, ...palette.accents];
  }
}

/** Turns the saved setting into a concrete season. Auto: Christmas, then Halloween, else Lively. */
export function resolveSeason(setting: SeasonSetting, date: Date = new Date()): ThemeSeason {
  if (setting !== 'auto') return setting;
  if (isHolidaySeason(date)) return 'christmas';
  if (date.getMonth() === 9) return 'halloween';
  return 'lively';
}
