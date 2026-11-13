/**
 * Helpers for Cooking Mode (kitchen timer).
 */

export const DEFAULT_TIMER_SECONDS = 5 * 60;
export const MAX_TIMER_SECONDS = 4 * 60 * 60;

/**
 * Finds a duration written in a step, e.g. "12-15 minutes", "2 minutes", "30 seconds", "1 hour".
 * For a range the longer end is used. Returns null when the step has no usable time.
 */
export function detectSeconds(text: string): number | null {
  const match = text.match(/(\d+)(?:\s*(?:-|–|to)\s*(\d+))?\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)\b/i);
  if (!match) return null;
  const amount = Number(match[2] ?? match[1]);
  const unit = match[3].toLowerCase();
  const perUnit = unit.startsWith('h') ? 3600 : unit.startsWith('m') ? 60 : 1;
  const seconds = amount * perUnit;
  return seconds > 0 && seconds <= MAX_TIMER_SECONDS ? seconds : null;
}

/** 725 -> "12:05", 3725 -> "1:02:05" */
export function formatClock(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/* ------------------------------------------------------------------ */
/* Serving size calculator                                             */
/* ------------------------------------------------------------------ */

const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 1 / 2,
  '¼': 1 / 4,
  '¾': 3 / 4,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '⅛': 1 / 8,
  '⅜': 3 / 8,
  '⅝': 5 / 8,
  '⅞': 7 / 8,
};
const FRACTION_CHARS = '½¼¾⅓⅔⅛⅜⅝⅞';

// Fractions a cook can actually measure, nearest one wins
const NICE_FRACTIONS: [number, string][] = [
  [0, ''],
  [1 / 8, '⅛'],
  [1 / 4, '¼'],
  [1 / 3, '⅓'],
  [3 / 8, '⅜'],
  [1 / 2, '½'],
  [5 / 8, '⅝'],
  [2 / 3, '⅔'],
  [3 / 4, '¾'],
  [7 / 8, '⅞'],
  [1, ''],
];

const NUMBER = `(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:\\.\\d+)?\\s*[${FRACTION_CHARS}]|\\d+(?:\\.\\d+)?|[${FRACTION_CHARS}])`;
const QUANTITY_AT_START = new RegExp(`^\\s*(${NUMBER})(?:\\s*(?:-|–|to)\\s*(${NUMBER}))?`);

/** "1/2" -> 0.5, "2 1/4" -> 2.25, "1½" -> 1.5, "0.75" -> 0.75 */
export function parseQuantity(text: string): number {
  const clean = text.trim();
  const glued = clean.match(new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*([${FRACTION_CHARS}])$`));
  if (glued) return Number(glued[1]) + UNICODE_FRACTIONS[glued[2]];
  return clean.split(/\s+/).reduce((sum, part) => {
    if (UNICODE_FRACTIONS[part] !== undefined) return sum + UNICODE_FRACTIONS[part];
    const frac = part.match(/^(\d+)\/(\d+)$/);
    if (frac) return sum + Number(frac[1]) / Number(frac[2]);
    return sum + Number(part);
  }, 0);
}

/** 1.5 -> "1 ½", 0.33 -> "⅓", 2 -> "2", 2.9 -> "3". Tiny amounts show as "⅛". */
export function formatQuantity(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';
  if (value >= 100) return String(Math.round(value));
  let whole = Math.floor(value);
  const frac = value - whole;
  let best = NICE_FRACTIONS[0];
  for (const candidate of NICE_FRACTIONS) {
    if (Math.abs(frac - candidate[0]) < Math.abs(frac - best[0])) best = candidate;
  }
  let symbol = best[1];
  if (best[0] === 1) {
    whole += 1;
    symbol = '';
  }
  if (whole === 0 && symbol === '') return '⅛';
  return whole > 0 && symbol ? `${whole} ${symbol}` : `${whole > 0 ? whole : ''}${symbol}`;
}

/** Metric amounts read better as decimals ("1.5 kg") than as fractions. */
function formatMetric(value: number): string {
  return String(Number(value.toFixed(value < 10 ? 1 : 0)));
}

const METRIC_UNITS = /^(g|kg|ml|l|grams?|kilograms?|millilit(?:er|re)s?|lit(?:er|re)s?)\b/i;

// Singular -> plural for units that follow a quantity
const UNIT_PLURALS: Record<string, string> = {
  cup: 'cups',
  tablespoon: 'tablespoons',
  teaspoon: 'teaspoons',
  pound: 'pounds',
  ounce: 'ounces',
  clove: 'cloves',
  slice: 'slices',
  piece: 'pieces',
  pinch: 'pinches',
  can: 'cans',
  stick: 'sticks',
  bunch: 'bunches',
  sprig: 'sprigs',
  head: 'heads',
  stalk: 'stalks',
  fillet: 'fillets',
  package: 'packages',
  handful: 'handfuls',
  dash: 'dashes',
};
const PLURAL_TO_SINGULAR = Object.fromEntries(Object.entries(UNIT_PLURALS).map(([s, p]) => [p, s]));

export interface ScaledIngredient {
  /** The (re)calculated amount, e.g. "1 ½". Empty when the line has no amount to scale. */
  quantity: string;
  /** The rest of the line, e.g. " cups all-purpose flour" (starts with a space when quantity is set). */
  rest: string;
  /** True when the line starts with an amount and was recalculated. */
  scalable: boolean;
}

/**
 * Scales one ingredient line by `factor`. Only a leading amount is changed:
 * "2 1/4 cups flour" x2 -> "4 ½" + " cups flour". Lines without an amount
 * ("Salt to taste", "Pizza dough") are returned untouched.
 */
export function scaleIngredientParts(text: string, factor: number): ScaledIngredient {
  const match = text.match(QUANTITY_AT_START);
  const rest = match ? text.slice(match[0].length) : text;
  // "2-inch piece" / "3-4" glued to a word: that number is a size, not an amount
  if (!match || /^-/.test(rest.trim())) {
    return { quantity: '', rest: text, scalable: false };
  }
  const low = parseQuantity(match[1]);
  const high = match[2] ? parseQuantity(match[2]) : null;
  if (!(low > 0)) return { quantity: '', rest: text, scalable: false };

  const metric = METRIC_UNITS.test(rest.trim());
  const fmt = (n: number) => (metric ? formatMetric(n) : formatQuantity(n));
  const lowText = fmt(low * factor);
  let quantity = high === null ? lowText : `${lowText}–${fmt(high * factor)}`;
  if (factor === 1) quantity = match[0].trim(); // untouched: show it exactly as written

  // 1 cup / 2 cups
  const shown = (high ?? low) * factor;
  const unit = rest.match(/^(\s+)([A-Za-z]+)\b/);
  let newRest = rest;
  if (unit) {
    const word = unit[2].toLowerCase();
    const singular = UNIT_PLURALS[word] ? word : PLURAL_TO_SINGULAR[word];
    if (singular) {
      const replacement = shown > 1 ? UNIT_PLURALS[singular] : singular;
      const cased = unit[2][0] === unit[2][0].toUpperCase() ? replacement[0].toUpperCase() + replacement.slice(1) : replacement;
      newRest = `${unit[1]}${cased}${rest.slice(unit[0].length)}`;
    }
  }
  return { quantity, rest: newRest, scalable: true };
}

/** Plain-text version of `scaleIngredientParts`. */
export function scaleIngredient(text: string, factor: number): string {
  const { quantity, rest, scalable } = scaleIngredientParts(text, factor);
  return scalable ? `${quantity}${rest}` : text;
}