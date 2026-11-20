/**
 * Cooking history helpers (pure functions, easy to unit test)
 */
import { CookedEntry } from '@/types/cookbook';

/** Local calendar day as "YYYY-MM-DD" */
export function dayKey(time: number): string {
  const d = new Date(time);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Number of days in a row with at least one recipe cooked, counting back from
 * today. If nothing was cooked today yet, the streak can still continue from yesterday.
 */
export function cookingStreak(cooked: CookedEntry[], now: number = Date.now()): number {
  if (cooked.length === 0) return 0;
  const days = new Set(cooked.map((entry) => dayKey(entry.cookedAt)));
  const oneDay = 24 * 60 * 60 * 1000;
  let cursor = now;
  if (!days.has(dayKey(cursor))) cursor -= oneDay;
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor -= oneDay;
  }
  return streak;
}

/** How many times a recipe was cooked, and when the last time was */
export function cookedSummary(
  cooked: CookedEntry[],
  recipeId: number
): { count: number; lastCookedAt: number | null } {
  const entries = cooked.filter((entry) => entry.recipeId === recipeId);
  if (entries.length === 0) return { count: 0, lastCookedAt: null };
  return { count: entries.length, lastCookedAt: Math.max(...entries.map((e) => e.cookedAt)) };
}
