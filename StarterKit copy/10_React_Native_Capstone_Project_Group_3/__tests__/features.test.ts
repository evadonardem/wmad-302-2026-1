import {
  christmasDarkPalette,
  christmasLightPalette,
  darkPalette,
  getPalette,
  isHolidaySeason,
  lightPalette,
  SEASON_PALETTES,
} from '@/constants/palettes';
import { getParticleColors, resolveSeason, SEASONS } from '@/constants/seasons';
import { THEME_SEASONS } from '@/types/account';
import { translate, translations } from '@/i18n/translations';
import { pushRecent, toggleLimited } from '@/utils/lists';
import { daysUntilChristmas, getOrderStage, getStageTime } from '@/utils/orders';
import { calculateCartTotals, getCouponError, GIFT_WRAP_FEE } from '@/utils/cart';
import { safeRedirect } from '@/utils/navigation';
import { getGridColumns } from '@/hooks';
import type { CartItem } from '@/types/product';

describe('palettes', () => {
  it('detects the Christmas season (Nov 1 – Jan 6)', () => {
    expect(isHolidaySeason(new Date(2026, 10, 1))).toBe(true);
    expect(isHolidaySeason(new Date(2026, 11, 25))).toBe(true);
    expect(isHolidaySeason(new Date(2027, 0, 6))).toBe(true);
    expect(isHolidaySeason(new Date(2027, 0, 7))).toBe(false);
    expect(isHolidaySeason(new Date(2026, 9, 31))).toBe(false);
  });

  it('picks the palette for each mode and season', () => {
    expect(getPalette(false)).toBe(lightPalette);
    expect(getPalette(false, 'lively')).toBe(lightPalette);
    expect(getPalette(true, 'lively')).toBe(darkPalette);
    expect(getPalette(false, 'christmas')).toBe(christmasLightPalette);
    expect(getPalette(true, 'christmas')).toBe(christmasDarkPalette);
    THEME_SEASONS.forEach((season) => {
      expect(getPalette(false, season)).toMatchObject({ season, isDark: false });
      expect(getPalette(true, season)).toMatchObject({ season, isDark: true });
    });
  });

  it('uses pink as the default primary with yellow, green and sky-blue accents', () => {
    expect(lightPalette.primary).toBe('#E91E63');
    expect(lightPalette.accents).toEqual(['#FFD54F', '#66BB6A', '#4FC3F7']);
  });

  it('defines the same color keys in every palette', () => {
    const keys = Object.keys(lightPalette).sort();
    Object.values(SEASON_PALETTES).forEach(({ light, dark }) => {
      expect(Object.keys(light).sort()).toEqual(keys);
      expect(Object.keys(dark).sort()).toEqual(keys);
    });
  });
});

describe('seasons', () => {
  it('resolves auto by date and keeps manual choices', () => {
    expect(resolveSeason('auto', new Date(2026, 11, 1))).toBe('christmas');
    expect(resolveSeason('auto', new Date(2026, 9, 15))).toBe('halloween');
    expect(resolveSeason('auto', new Date(2026, 5, 1))).toBe('lively');
    expect(resolveSeason('summer', new Date(2026, 11, 1))).toBe('summer');
  });

  it('has decorations and banner text for every season', () => {
    THEME_SEASONS.forEach((season) => {
      expect(SEASONS[season].emoji).toBeTruthy();
      expect(SEASONS[season].motifs.length).toBeGreaterThanOrEqual(3);
      expect(SEASONS[season].scenery.length).toBeGreaterThanOrEqual(5);
      expect(translate('en', `banner.${season}.title`)).not.toContain('banner.');
      expect(translate('en', `greet.${season}`, { name: 'Ada' })).toContain('Ada');
      expect(translate('fil', `mood.${season}`)).not.toContain('mood.');
      expect(translate('en', `pick.${season}`)).not.toContain('pick.');
      expect(translate('fil', `season.${season}`)).not.toContain('season.');
    });
  });

  it('picks particle colors that suit the season', () => {
    expect(getParticleColors('christmas', christmasDarkPalette)).toEqual(['#FFFFFF']);
    expect(getParticleColors('lively', lightPalette)).toEqual([lightPalette.primary, ...lightPalette.accents]);
    expect(getParticleColors('rainy', getPalette(false, 'rainy'))).toHaveLength(2);
  });
});

describe('translations', () => {
  it('has a Filipino string for every English key', () => {
    expect(Object.keys(translations.fil).sort()).toEqual(Object.keys(translations.en).sort());
  });

  it('interpolates variables and leaves unknown ones untouched', () => {
    expect(translate('en', 'home.welcome', { name: 'Ada' })).toBe('Welcome, Ada!');
    expect(translate('fil', 'holiday.countdown', { days: 5 })).toBe('5 araw bago ang Pasko');
    expect(translate('en', 'home.welcome')).toBe('Welcome, {name}!');
  });
});

describe('list helpers', () => {
  it('pushRecent moves items to the front, de-duplicates and caps', () => {
    expect(pushRecent([1, 2, 3], 2, (n) => n, 3)).toEqual([2, 1, 3]);
    expect(pushRecent([1, 2, 3], 4, (n) => n, 3)).toEqual([4, 1, 2]);
  });

  it('toggleLimited adds, removes and refuses when full', () => {
    expect(toggleLimited([1], 2, (n) => n, 2)).toEqual({ list: [1, 2], included: true, full: false });
    expect(toggleLimited([1, 2], 1, (n) => n, 2)).toEqual({ list: [2], included: false, full: false });
    expect(toggleLimited([1, 2], 3, (n) => n, 2)).toEqual({ list: [1, 2], included: false, full: true });
  });
});

describe('order tracking', () => {
  const placedAt = new Date(2026, 10, 20, 10, 0, 0);
  const order = { createdAt: placedAt.toISOString(), source: 'local' as const };
  const hoursLater = (h: number) => new Date(placedAt.getTime() + h * 3600 * 1000);

  it('advances through the stages over time', () => {
    expect(getOrderStage(order, hoursLater(0.5))).toBe('placed');
    expect(getOrderStage(order, hoursLater(3))).toBe('packed');
    expect(getOrderStage(order, hoursLater(30))).toBe('shipped');
    expect(getOrderStage(order, hoursLater(80))).toBe('delivered');
  });

  it('treats API orders as delivered', () => {
    expect(getOrderStage({ createdAt: null, source: 'api' })).toBe('delivered');
    expect(getStageTime({ createdAt: null }, 'shipped')).toBeNull();
  });

  it('counts the days until Christmas', () => {
    expect(daysUntilChristmas(new Date(2026, 11, 20, 15))).toBe(5);
    expect(daysUntilChristmas(new Date(2026, 11, 25, 8))).toBe(0);
    expect(daysUntilChristmas(new Date(2026, 11, 26))).toBe(364);
  });
});

describe('Christmas checkout extras', () => {
  const item: CartItem = {
    productId: 1,
    title: 'Gift',
    thumbnail: '',
    price: 200,
    discountPercentage: 0,
    quantity: 1,
    stock: 5,
  };

  it('applies XMAS25 only above $100', () => {
    expect(calculateCartTotals([item], 'XMAS25').couponDiscount).toBe(50);
    expect(getCouponError('XMAS25', 80)).toMatch(/minimum/);
  });

  it('adds the gift wrap fee to the total', () => {
    const plain = calculateCartTotals([item]);
    const wrapped = calculateCartTotals([item], null, true);
    expect(wrapped.giftWrapFee).toBe(GIFT_WRAP_FEE);
    expect(wrapped.grandTotal).toBeCloseTo(plain.grandTotal + GIFT_WRAP_FEE, 2);
    expect(calculateCartTotals([], null, true).giftWrapFee).toBe(0);
  });
});

describe('responsive grid', () => {
  it('uses more columns on wider screens', () => {
    expect(getGridColumns(390)).toBe(2);
    expect(getGridColumns(768)).toBe(3);
    expect(getGridColumns(1024)).toBe(4);
    expect(getGridColumns(1440)).toBe(5);
  });
});

describe('safeRedirect', () => {
  it('only allows in-app paths', () => {
    expect(safeRedirect('/product/12')).toBe('/product/12');
    expect(safeRedirect(undefined)).toBe('/home');
    expect(safeRedirect('https://evil.example')).toBe('/home');
    expect(safeRedirect('//evil.example')).toBe('/home');
    expect(safeRedirect('/login')).toBe('/home');
  });
});
