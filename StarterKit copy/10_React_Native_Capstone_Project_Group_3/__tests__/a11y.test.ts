/**
 * Accessibility checks for every theme palette (WCAG 2.1 AA contrast).
 */
import { SEASON_PALETTES } from '@/constants/palettes';
import { AA_LARGE, AA_NORMAL, contrastRatio, luminance } from '@/utils/contrast';

const palettes = Object.entries(SEASON_PALETTES).flatMap(([season, pair]) => [
  [`${season} light`, pair.light] as const,
  [`${season} dark`, pair.dark] as const,
]);

describe('contrast helpers', () => {
  it('computes known ratios', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
    expect(luminance('#FFFFFF')).toBeCloseTo(1, 5);
    expect(() => luminance('red')).toThrow();
  });
});

describe.each(palettes)('%s palette', (_name, palette) => {
  it('has readable body text on the background and on cards', () => {
    expect(contrastRatio(palette.text, palette.background)).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrastRatio(palette.text, palette.surface)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it('has readable secondary text on cards', () => {
    expect(contrastRatio(palette.textMuted, palette.surface)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it('has readable labels on primary buttons, headers and the tab bar (large / bold text)', () => {
    expect(contrastRatio(palette.onPrimary, palette.primary)).toBeGreaterThanOrEqual(AA_LARGE);
  });

  it('has a primary color that stands out on cards (links, prices, icons)', () => {
    expect(contrastRatio(palette.primary, palette.surface)).toBeGreaterThanOrEqual(AA_LARGE);
  });
});
