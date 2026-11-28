/**
 * Delivery scheduling for checkout: the next few days and fixed time slots.
 */

export const DELIVERY_SLOTS = ['9 AM – 12 PM', '12 – 3 PM', '3 – 6 PM', '6 – 9 PM'] as const;

/** The next `count` days starting tomorrow, at midnight local time. */
export function getDeliveryDates(now: Date = new Date(), count = 5): Date[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + index + 1);
    return date;
  });
}

/** "Sat, Nov 22" */
export function formatDeliveryDay(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
