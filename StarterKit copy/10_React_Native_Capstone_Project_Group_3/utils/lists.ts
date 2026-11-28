/**
 * Small pure helpers for "most recent first" lists (recently viewed, search history, compare).
 */

/** Moves (or inserts) `item` to the front, removes duplicates by key, and caps the length. */
export function pushRecent<T>(list: T[], item: T, keyOf: (value: T) => string | number, max: number): T[] {
  const key = keyOf(item);
  return [item, ...list.filter((existing) => keyOf(existing) !== key)].slice(0, max);
}

/**
 * Adds or removes an item; refuses to add beyond `max`.
 * Returns the new list and whether the item is now included.
 */
export function toggleLimited<T>(
  list: T[],
  item: T,
  keyOf: (value: T) => string | number,
  max: number
): { list: T[]; included: boolean; full: boolean } {
  const key = keyOf(item);
  if (list.some((existing) => keyOf(existing) === key)) {
    return { list: list.filter((existing) => keyOf(existing) !== key), included: false, full: false };
  }
  if (list.length >= max) return { list, included: false, full: true };
  return { list: [...list, item], included: true, full: false };
}
