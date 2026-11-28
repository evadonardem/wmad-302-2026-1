import { describe, expect, it } from '@jest/globals';
import { formatCurrency } from './currencyFormat';

describe('formatCurrency', () => {
  it('converts a USD amount using the selected currency rate', () => {
    expect(formatCurrency(10, 'PHP', { USD: 1, PHP: 63.78 })).toBe('₱637.80');
  });

  it('rejects currencies without an available exchange rate', () => {
    expect(() => formatCurrency(10, 'EUR', { USD: 1 })).toThrow(
      'An exchange rate for EUR is not available.'
    );
  });
});
