/**
 * Color palettes. Screens never hard-code colors: they read the active palette
 * (light / dark × season) through `useThemedStyles` or `useAppTheme`.
 *
 * "Lively" is the everyday theme: pink primary with yellow, green and sky-blue
 * accents. Every season has its own light and dark palette.
 */
import type { ThemeSeason } from '@/types/account';

export interface Palette {
  isDark: boolean;
  season: ThemeSeason;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  gold: string;
  success: string;
  successContainer: string;
  danger: string;
  dangerContainer: string;
  warning: string;
  text: string;
  textMuted: string;
  border: string;
  background: string;
  surface: string;
  /** Background behind product images. */
  surfaceMuted: string;
  skeleton: string;
  chip: string;
  strike: string;
  overlay: string;
  /** Three sub colors used by the lively background, banners and confetti. */
  accents: [string, string, string];
}

/** Colors each season must choose; the rest fall back to light/dark neutrals. */
type SeasonColors = Pick<
  Palette,
  | 'primary'
  | 'primaryContainer'
  | 'secondary'
  | 'secondaryContainer'
  | 'gold'
  | 'text'
  | 'textMuted'
  | 'border'
  | 'background'
  | 'surfaceMuted'
  | 'skeleton'
  | 'chip'
  | 'accents'
> &
  Partial<Palette>;

const lightNeutrals = {
  onPrimary: '#FFFFFF',
  success: '#2E7D32',
  successContainer: '#E8F5E9',
  danger: '#D32F2F',
  dangerContainer: '#FFEBEE',
  warning: '#E65100',
  surface: '#FFFFFF',
  strike: '#9E9E9E',
  overlay: 'rgba(255, 255, 255, 0.85)',
};

const darkNeutrals = {
  onPrimary: '#1A1A1A',
  success: '#A5D6A7',
  successContainer: '#1B3A1E',
  danger: '#FF8A80',
  dangerContainer: '#4A1C1C',
  warning: '#FFCC80',
  surface: '#1E1F22',
  strike: '#8D8D8D',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

function definePalette(season: ThemeSeason, isDark: boolean, colors: SeasonColors): Palette {
  return { ...(isDark ? darkNeutrals : lightNeutrals), ...colors, isDark, season };
}

// ---------------------------------------------------------------- Lively (default)

/** Hot pink with sunshine yellow, fresh green and sky blue. */
export const lightPalette = definePalette('lively', false, {
  primary: '#E91E63',
  primaryContainer: '#FCE4EC',
  secondary: '#0288D1',
  secondaryContainer: '#E1F5FE',
  gold: '#FFB300',
  success: '#388E3C',
  text: '#2D1B26',
  textMuted: '#6E5A66',
  border: '#F8D7E5',
  background: '#FFE6F0',
  surfaceMuted: '#FFF0F6',
  skeleton: '#F9E1EC',
  chip: '#FDE7F1',
  strike: '#A1909A',
  overlay: 'rgba(255, 245, 249, 0.85)',
  accents: ['#FFD54F', '#66BB6A', '#4FC3F7'],
});

export const darkPalette = definePalette('lively', true, {
  primary: '#F48FB1',
  onPrimary: '#3E0A22',
  primaryContainer: '#5A1E3A',
  secondary: '#81D4FA',
  secondaryContainer: '#0F3A52',
  gold: '#FFE082',
  text: '#F8EAF1',
  textMuted: '#BFA8B5',
  border: '#4A3040',
  background: '#240D1B',
  surface: '#26161F',
  surfaceMuted: '#311C28',
  skeleton: '#3A2431',
  chip: '#311C28',
  strike: '#8D7A85',
  overlay: 'rgba(26, 15, 22, 0.7)',
  accents: ['#FFE082', '#A5D6A7', '#81D4FA'],
});

// ---------------------------------------------------------------- Christmas

/** Holly red, pine green, gold and warm cream. */
export const christmasLightPalette = definePalette('christmas', false, {
  primary: '#C62828',
  primaryContainer: '#FDECEA',
  secondary: '#1B5E20',
  secondaryContainer: '#E8F5E9',
  gold: '#F9A825',
  danger: '#B71C1C',
  text: '#2B1B17',
  textMuted: '#6D5D57',
  border: '#EADBC8',
  background: '#FBEEDF',
  surfaceMuted: '#FBF3EA',
  skeleton: '#F1E6DA',
  chip: '#F6EADC',
  strike: '#A1887F',
  overlay: 'rgba(255, 248, 240, 0.85)',
  accents: ['#FFD54F', '#66BB6A', '#EF5350'],
});

/** "Silent night": deep pine background with soft red and gold. */
export const christmasDarkPalette = definePalette('christmas', true, {
  primary: '#EF9A9A',
  onPrimary: '#3B0A0A',
  primaryContainer: '#4A1C1C',
  secondary: '#A5D6A7',
  secondaryContainer: '#1B3A1E',
  gold: '#FFD54F',
  warning: '#FFD54F',
  text: '#F3EDE4',
  textMuted: '#B5ABA0',
  border: '#2F4038',
  background: '#0F1A14',
  surface: '#1A2620',
  surfaceMuted: '#22302A',
  skeleton: '#2A3832',
  chip: '#22302A',
  strike: '#8D8079',
  overlay: 'rgba(15, 26, 20, 0.7)',
  accents: ['#FFD54F', '#81C784', '#E57373'],
});

// ---------------------------------------------------------------- Winter

/** Icy blue, lavender and frost. */
const winterLight = definePalette('winter', false, {
  primary: '#1976D2',
  primaryContainer: '#E3F2FD',
  secondary: '#5E35B1',
  secondaryContainer: '#EDE7F6',
  gold: '#FFB300',
  text: '#14212E',
  textMuted: '#56677A',
  border: '#D3E2F0',
  background: '#E3F0FC',
  surfaceMuted: '#EEF4FA',
  skeleton: '#DCE8F3',
  chip: '#E6F0F9',
  accents: ['#4FC3F7', '#9FA8DA', '#80DEEA'],
});

const winterDark = definePalette('winter', true, {
  primary: '#90CAF9',
  onPrimary: '#0D2137',
  primaryContainer: '#173A5E',
  secondary: '#B39DDB',
  secondaryContainer: '#2D2350',
  gold: '#FFE082',
  text: '#E6F0FA',
  textMuted: '#9DB0C3',
  border: '#2A3D50',
  background: '#0A1A2C',
  surface: '#13212F',
  surfaceMuted: '#1B2B3B',
  skeleton: '#233547',
  chip: '#1B2B3B',
  accents: ['#4FC3F7', '#9FA8DA', '#80DEEA'],
});

// ---------------------------------------------------------------- Spring

/** Fresh leaf green with cherry-blossom pink and lilac. */
const springLight = definePalette('spring', false, {
  primary: '#388E3C',
  primaryContainer: '#E8F5E9',
  secondary: '#D81B60',
  secondaryContainer: '#FCE4EC',
  gold: '#FBC02D',
  text: '#1F2A1A',
  textMuted: '#5D6B55',
  border: '#D9E8C8',
  background: '#EAF6DC',
  surfaceMuted: '#F1F8E9',
  skeleton: '#E2EED6',
  chip: '#EAF4DF',
  accents: ['#F48FB1', '#AED581', '#CE93D8'],
});

const springDark = definePalette('spring', true, {
  primary: '#A5D6A7',
  onPrimary: '#0F2A12',
  primaryContainer: '#1E3A22',
  secondary: '#F48FB1',
  secondaryContainer: '#4A1F33',
  gold: '#FFF176',
  text: '#EEF6EA',
  textMuted: '#A9B8A3',
  border: '#2E4232',
  background: '#0E1F10',
  surface: '#18241A',
  surfaceMuted: '#203024',
  skeleton: '#2A3A2D',
  chip: '#203024',
  accents: ['#F48FB1', '#AED581', '#CE93D8'],
});

// ---------------------------------------------------------------- Summer

/** Sunset orange, ocean teal and sunshine. */
const summerLight = definePalette('summer', false, {
  primary: '#EF6C00',
  primaryContainer: '#FFF3E0',
  secondary: '#00838F',
  secondaryContainer: '#E0F7FA',
  gold: '#FFB300',
  text: '#2B1D0E',
  textMuted: '#6E5C48',
  border: '#F5DFC0',
  background: '#FFF0D2',
  surfaceMuted: '#FFF6E5',
  skeleton: '#FBE9CC',
  chip: '#FFF0D6',
  accents: ['#FFD54F', '#4DD0E1', '#FF8A65'],
});

const summerDark = definePalette('summer', true, {
  primary: '#FFB74D',
  onPrimary: '#3A1E00',
  primaryContainer: '#4D2E0A',
  secondary: '#80DEEA',
  secondaryContainer: '#0A3A40',
  gold: '#FFE082',
  text: '#FBF1E3',
  textMuted: '#C2B29C',
  border: '#463826',
  background: '#22170A',
  surface: '#241C12',
  surfaceMuted: '#2E2418',
  skeleton: '#3A2E20',
  chip: '#2E2418',
  accents: ['#FFD54F', '#4DD0E1', '#FF8A65'],
});

// ---------------------------------------------------------------- Rainy season

/** Steel blue skies, teal puddles and a yellow umbrella. */
const rainyLight = definePalette('rainy', false, {
  primary: '#37709A',
  primaryContainer: '#E3EEF6',
  secondary: '#00897B',
  secondaryContainer: '#E0F2F1',
  gold: '#FBC02D',
  text: '#1B2730',
  textMuted: '#5A6B76',
  border: '#D0DCE3',
  background: '#E1EAF0',
  surfaceMuted: '#ECF1F4',
  skeleton: '#DAE3E9',
  chip: '#E4ECF1',
  accents: ['#90CAF9', '#80CBC4', '#FFF176'],
});

const rainyDark = definePalette('rainy', true, {
  primary: '#90BCDD',
  onPrimary: '#0C2233',
  primaryContainer: '#1D3A50',
  secondary: '#80CBC4',
  secondaryContainer: '#0F3330',
  gold: '#FFF176',
  text: '#E7EEF3',
  textMuted: '#9EAFBB',
  border: '#2C3B47',
  background: '#0C1922',
  surface: '#162029',
  surfaceMuted: '#1E2A34',
  skeleton: '#27343F',
  chip: '#1E2A34',
  accents: ['#90CAF9', '#80CBC4', '#FFF176'],
});

// ---------------------------------------------------------------- Autumn

/** Burnt orange, maple red and mustard. */
const autumnLight = definePalette('autumn', false, {
  primary: '#C2410C',
  primaryContainer: '#FBE9E1',
  secondary: '#7B2D26',
  secondaryContainer: '#F3E3DF',
  gold: '#E0A100',
  text: '#2C1D12',
  textMuted: '#6E5A49',
  border: '#E8D6BF',
  background: '#F8E7D3',
  surfaceMuted: '#F8EFE3',
  skeleton: '#EEDFCB',
  chip: '#F4E8D8',
  accents: ['#FFB74D', '#D4A017', '#E57373'],
});

const autumnDark = definePalette('autumn', true, {
  primary: '#FFAB91',
  onPrimary: '#3E1405',
  primaryContainer: '#4E2412',
  secondary: '#E6A39A',
  secondaryContainer: '#3F1C18',
  gold: '#FFD54F',
  text: '#F7ECE2',
  textMuted: '#C0AC9B',
  border: '#45342A',
  background: '#20120A',
  surface: '#231811',
  surfaceMuted: '#2D2018',
  skeleton: '#3A2B20',
  chip: '#2D2018',
  accents: ['#FFB74D', '#D4A017', '#E57373'],
});

// ---------------------------------------------------------------- Halloween

/** Pumpkin orange, witchy purple and slime green. */
const halloweenLight = definePalette('halloween', false, {
  primary: '#E65100',
  primaryContainer: '#FFE0CC',
  secondary: '#6A1B9A',
  secondaryContainer: '#F3E5F5',
  gold: '#FFB300',
  success: '#558B2F',
  text: '#22142A',
  textMuted: '#655570',
  border: '#E2D3EA',
  background: '#EFE3F6',
  surfaceMuted: '#F5EEF8',
  skeleton: '#E8DDEE',
  chip: '#F0E6F5',
  accents: ['#FFA726', '#AB47BC', '#9CCC65'],
});

const halloweenDark = definePalette('halloween', true, {
  primary: '#FF9800',
  onPrimary: '#2A1200',
  primaryContainer: '#4A2600',
  secondary: '#CE93D8',
  secondaryContainer: '#3A1846',
  gold: '#FFD54F',
  success: '#AED581',
  text: '#F3EAF7',
  textMuted: '#B5A3BF',
  border: '#3B2A44',
  background: '#1A0A22',
  surface: '#1C1222',
  surfaceMuted: '#261A2D',
  skeleton: '#322339',
  chip: '#261A2D',
  accents: ['#FFA726', '#AB47BC', '#9CCC65'],
});

export const SEASON_PALETTES: Record<ThemeSeason, { light: Palette; dark: Palette }> = {
  lively: { light: lightPalette, dark: darkPalette },
  christmas: { light: christmasLightPalette, dark: christmasDarkPalette },
  winter: { light: winterLight, dark: winterDark },
  spring: { light: springLight, dark: springDark },
  summer: { light: summerLight, dark: summerDark },
  rainy: { light: rainyLight, dark: rainyDark },
  autumn: { light: autumnLight, dark: autumnDark },
  halloween: { light: halloweenLight, dark: halloweenDark },
};

export function getPalette(isDark: boolean, season: ThemeSeason = 'lively'): Palette {
  const pair = SEASON_PALETTES[season] ?? SEASON_PALETTES.lively;
  return isDark ? pair.dark : pair.light;
}

/** Christmas season: Nov 1 – Jan 6. */
export function isHolidaySeason(date: Date = new Date()): boolean {
  const month = date.getMonth(); // 0 = Jan
  return month === 10 || month === 11 || (month === 0 && date.getDate() <= 6);
}
