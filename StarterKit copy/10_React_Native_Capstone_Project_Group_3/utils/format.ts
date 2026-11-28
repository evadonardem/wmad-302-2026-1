/**
 * Formatting helpers shared by screens and components
 */

/** Price after applying a percentage discount. */
export function getDiscountedPrice(price: number, discountPercentage: number): number {
  return price * (1 - discountPercentage / 100);
}

export type DisplayCurrency = 'USD' | 'PHP';

/** Fixed demo exchange rate: prices from DummyJSON are in USD. */
export const PHP_PER_USD = 58;

let displayCurrency: DisplayCurrency = 'USD';

/** Set by SettingsContext so every formatPrice call follows the chosen currency. */
export function setDisplayCurrency(currency: DisplayCurrency): void {
  displayCurrency = currency;
}

export function getDisplayCurrency(): DisplayCurrency {
  return displayCurrency;
}

/** Adds thousands separators: 1234567.5 -> "1,234,567.50". */
function withSeparators(value: number): string {
  const [whole, cents] = value.toFixed(2).split('.');
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${cents}`;
}

/**
 * Formats a USD amount in the display currency, e.g. 12.5 -> "$12.50" or "₱725.00".
 * Amounts are always stored and calculated in USD.
 */
export function formatPrice(value: number, currency: DisplayCurrency = displayCurrency): string {
  if (currency === 'PHP') return `₱${withSeparators(value * PHP_PER_USD)}`;
  return `$${value.toFixed(2)}`;
}

/** Turns a category slug into a label, e.g. "home-decoration" -> "Home Decoration". */
export function formatCategory(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Formats an ISO date as e.g. "Nov 20, 2026". Returns a fallback for missing/invalid dates. */
export function formatDate(iso: string | null | undefined, fallback = '—'): string {
  if (!iso) return fallback;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Generates a reasonably unique id for locally stored records. */
export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
