import { cookedSummary, cookingStreak, dayKey } from '../cookingStats';

const DAY = 24 * 60 * 60 * 1000;
// Midday, so adding/subtracting whole days never crosses a date boundary oddly
const NOW = new Date(2026, 10, 13, 12, 0, 0).getTime();

describe('dayKey', () => {
  it('formats a time as a local YYYY-MM-DD day', () => {
    expect(dayKey(NOW)).toBe('2026-11-13');
  });
});

describe('cookingStreak', () => {
  it('is 0 with no history', () => {
    expect(cookingStreak([], NOW)).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    const cooked = [
      { recipeId: 1, cookedAt: NOW },
      { recipeId: 2, cookedAt: NOW - DAY },
      { recipeId: 3, cookedAt: NOW - 2 * DAY },
      { recipeId: 4, cookedAt: NOW - 4 * DAY }, // gap: not part of the streak
    ];
    expect(cookingStreak(cooked, NOW)).toBe(3);
  });

  it('keeps the streak alive from yesterday if nothing was cooked today yet', () => {
    const cooked = [
      { recipeId: 1, cookedAt: NOW - DAY },
      { recipeId: 2, cookedAt: NOW - 2 * DAY },
    ];
    expect(cookingStreak(cooked, NOW)).toBe(2);
  });

  it('counts several meals on the same day once', () => {
    const cooked = [
      { recipeId: 1, cookedAt: NOW },
      { recipeId: 2, cookedAt: NOW - 1000 },
    ];
    expect(cookingStreak(cooked, NOW)).toBe(1);
  });

  it('is 0 when the last meal was two days ago', () => {
    expect(cookingStreak([{ recipeId: 1, cookedAt: NOW - 2 * DAY }], NOW)).toBe(0);
  });
});

describe('cookedSummary', () => {
  const cooked = [
    { recipeId: 7, cookedAt: NOW - 3 * DAY },
    { recipeId: 7, cookedAt: NOW - DAY },
    { recipeId: 9, cookedAt: NOW },
  ];

  it('counts how often a recipe was cooked and when last', () => {
    expect(cookedSummary(cooked, 7)).toEqual({ count: 2, lastCookedAt: NOW - DAY });
  });

  it('returns zero for recipes never cooked', () => {
    expect(cookedSummary(cooked, 1)).toEqual({ count: 0, lastCookedAt: null });
  });
});
