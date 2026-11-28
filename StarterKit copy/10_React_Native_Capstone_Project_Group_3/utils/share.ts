/**
 * Encoding for shareable cart / gift list links:
 * marketplace://shared?kind=cart&items=12x2,5x1&title=...
 */

export interface SharedItem {
  id: number;
  quantity: number;
}

export type ShareKind = 'cart' | 'list';

export const MAX_SHARED_ITEMS = 30;

/** [{id: 12, quantity: 2}, {id: 5, quantity: 1}] -> "12x2,5x1" */
export function encodeShareItems(items: SharedItem[]): string {
  return items
    .slice(0, MAX_SHARED_ITEMS)
    .map((item) => `${item.id}x${Math.max(1, Math.round(item.quantity))}`)
    .join(',');
}

/** Parses the `items` param, ignoring anything malformed. Duplicate ids are merged. */
export function decodeShareItems(value: string | null | undefined): SharedItem[] {
  if (!value) return [];
  const merged = new Map<number, number>();
  for (const part of value.split(',').slice(0, MAX_SHARED_ITEMS)) {
    const match = /^(\d{1,6})(?:x(\d{1,2}))?$/.exec(part.trim());
    if (!match) continue;
    const id = Number(match[1]);
    const quantity = Math.min(99, Math.max(1, Number(match[2] ?? 1)));
    if (id > 0) merged.set(id, Math.min(99, (merged.get(id) ?? 0) + quantity));
  }
  return [...merged.entries()].map(([id, quantity]) => ({ id, quantity }));
}
