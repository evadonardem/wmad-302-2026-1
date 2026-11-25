/**
 * Ingredient & instruction helpers
 *
 * DummyJSON ingredients are plain text like "2 cups all-purpose flour" or
 * "1/2 teaspoon salt". These helpers read the amount at the start so we can
 * scale servings, merge duplicates in the shopping list and match ingredients
 * for "What's in my fridge?". They are pure functions, which makes them easy to test.
 */

const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 1 / 2,
  '¼': 1 / 4,
  '¾': 3 / 4,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '⅛': 1 / 8,
};

// "1 1/2", "1/2", "1.5", "2", "½" ... optionally followed by a range "-3"
const QUANTITY_PATTERN =
  /^\s*(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|[½¼¾⅓⅔⅛])(?:\s*(?:-|to)\s*(\d+(?:\.\d+)?))?\s*/;

const UNITS = [
  'cups', 'cup', 'tablespoons', 'tablespoon', 'tbsp', 'teaspoons', 'teaspoon', 'tsp',
  'grams', 'gram', 'g', 'kilograms', 'kg', 'milliliters', 'ml', 'liters', 'liter', 'l',
  'ounces', 'ounce', 'oz', 'pounds', 'pound', 'lbs', 'lb', 'cloves', 'clove', 'pinch',
  'slices', 'slice', 'cans', 'can', 'pieces', 'piece', 'bunch', 'sprigs', 'sprig',
  'stalks', 'stalk', 'leaves', 'large', 'medium', 'small', 'whole', 'fresh', 'handful',
];
const UNIT_PATTERN = new RegExp(`^(?:(?:${UNITS.join('|')})\\b\\.?\\s*(?:of\\s+)?)+`, 'i');

const DESCRIPTORS = [
  'boneless', 'skinless', 'finely', 'roughly', 'thinly', 'freshly', 'chopped', 'diced',
  'minced', 'sliced', 'grated', 'shredded', 'peeled', 'softened', 'melted', 'cubed',
  'crushed', 'halved', 'ripe', 'divided',
];
const DESCRIPTOR_PATTERN = new RegExp(`\\b(?:${DESCRIPTORS.join('|')})\\b`, 'gi');

/** Plural unit -> singular, used when a scaled amount drops to 1 or less */
const SINGULAR_UNITS: Record<string, string> = {
  cups: 'cup', tablespoons: 'tablespoon', teaspoons: 'teaspoon', cloves: 'clove',
  cans: 'can', ounces: 'ounce', pounds: 'pound', slices: 'slice', pieces: 'piece',
};

function parseNumber(text: string): number {
  const trimmed = text.trim();
  if (UNICODE_FRACTIONS[trimmed] !== undefined) return UNICODE_FRACTIONS[trimmed];
  const mixed = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  return Number(trimmed);
}

export interface ParsedIngredient {
  /** Amount at the start, e.g. 1.5 for "1 1/2 cups flour"; null when there is none */
  quantity: number | null;
  /** Upper end of a range like "2-3 cloves", otherwise null */
  quantityMax: number | null;
  /** Everything after the amount, e.g. "cups flour" */
  rest: string;
}

export function parseIngredient(text: string): ParsedIngredient {
  const match = text.match(QUANTITY_PATTERN);
  if (!match) return { quantity: null, quantityMax: null, rest: text.trim() };
  return {
    quantity: parseNumber(match[1]),
    quantityMax: match[2] ? Number(match[2]) : null,
    rest: text.slice(match[0].length).trim(),
  };
}

/** 1.5 -> "1 1/2", 0.33 -> "1/3", 2 -> "2", 0.4 -> "0.4" */
export function formatQuantity(value: number): string {
  if (value <= 0) return '0';
  const whole = Math.floor(value);
  const remainder = value - whole;
  const fractions: [number, string][] = [
    [0, ''],
    [1 / 8, '1/8'],
    [1 / 4, '1/4'],
    [1 / 3, '1/3'],
    [1 / 2, '1/2'],
    [2 / 3, '2/3'],
    [3 / 4, '3/4'],
    [1, ''],
  ];
  let best = fractions[0];
  for (const candidate of fractions) {
    if (Math.abs(candidate[0] - remainder) < Math.abs(best[0] - remainder)) best = candidate;
  }
  if (Math.abs(best[0] - remainder) > 0.04) {
    // Not close to a common fraction: show one decimal
    return String(Math.round(value * 10) / 10);
  }
  const wholePart = best[0] === 1 ? whole + 1 : whole;
  if (!best[1]) return String(wholePart);
  return wholePart > 0 ? `${wholePart} ${best[1]}` : best[1];
}

/** Scale the amount at the start of an ingredient line. "2 cups rice" x0.5 -> "1 cup rice"-ish */
export function scaleIngredient(text: string, factor: number): string {
  if (factor === 1) return text;
  const parsed = parseIngredient(text);
  if (parsed.quantity === null) return text;
  const scaled = parsed.quantity * factor;
  const amount = formatQuantity(scaled);
  const range = parsed.quantityMax !== null ? `-${formatQuantity(parsed.quantityMax * factor)}` : '';
  let rest = parsed.rest;
  if (parsed.quantityMax === null && scaled <= 1) {
    // "1 cups rice" -> "1 cup rice"
    rest = rest.replace(/^(\w+)/, (word) => SINGULAR_UNITS[word.toLowerCase()] ?? word);
  }
  return `${amount}${range} ${rest}`.trim();
}

/**
 * Normalized ingredient name for merging and matching.
 * "2 tablespoons Olive Oil, divided" -> "olive oil"
 */
export function ingredientKey(text: string): string {
  let rest = parseIngredient(text).rest.toLowerCase();
  rest = rest.replace(/\([^)]*\)/g, ' '); // "(optional)", "(about 2 cups)"
  rest = rest.replace(DESCRIPTOR_PATTERN, ' '); // "boneless, skinless chicken" -> " ,  chicken"
  // "onion, finely chopped" -> "onion" (first non-empty part before a comma)
  rest = rest.split(',').map((part) => part.trim()).filter(Boolean)[0] ?? '';
  rest = rest.replace(UNIT_PATTERN, '');
  rest = rest.replace(/\b(for garnish|to taste|for serving|optional)\b/g, ' ');
  return singularizeLastWord(rest.replace(/\s+/g, ' ').trim());
}

/**
 * "onions" -> "onion", "tomatoes" -> "tomato", "berries" -> "berry", so the same
 * ingredient merges in the shopping list. Words like "hummus" or "swiss" are kept.
 */
function singularizeLastWord(text: string): string {
  return text.replace(/(\w+)$/, (word) => {
    if (word.length <= 3) return word;
    if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
    if (word.endsWith('oes')) return word.slice(0, -2);
    if (word.endsWith('s') && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
    return word;
  });
}

/** "olive oil" -> "Olive oil" */
export function displayName(key: string): string {
  return key ? key.charAt(0).toUpperCase() + key.slice(1) : key;
}

/**
 * Find a cooking time in an instruction, in minutes.
 * "Bake for 25 minutes" -> 25, "Simmer for 10-15 mins" -> 15, "Cook 1 hour" -> 60
 */
export function parseDurationMinutes(step: string): number | null {
  const match = step.match(
    /(\d+(?:\.\d+)?)(?:\s*(?:-|to)\s*(\d+(?:\.\d+)?))?\s*(hours?|hrs?|minutes?|mins?)\b/i
  );
  if (!match) return null;
  const amount = Number(match[2] ?? match[1]);
  const isHours = /^h/i.test(match[3]);
  const minutes = Math.round(isHours ? amount * 60 : amount);
  return minutes > 0 ? minutes : null;
}

/** 90 -> "1:30", 3725 -> "1:02:05" */
export function formatSeconds(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
