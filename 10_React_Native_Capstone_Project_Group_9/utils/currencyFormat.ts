export function formatCurrency(
  amountInUsd: number,
  currencyCode: string,
  rates: Record<string, number>
): string {
  if (!Number.isFinite(amountInUsd)) {
    throw new Error('Cannot format a non-finite price.');
  }
  const rate = rates[currencyCode];
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`An exchange rate for ${currencyCode} is not available.`);
  }
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: currencyCode,
  }).format(amountInUsd * rate);
}

export function getCurrencyName(currencyCode: string): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: currencyCode,
    currencyDisplay: 'name',
  }).formatToParts(1).find((part) => part.type === 'currency')?.value ?? currencyCode;
}
