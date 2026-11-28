import {
  detectBrand,
  formatCardNumber,
  formatExpiry,
  isExpiryValid,
  luhnValid,
  onlyDigits,
} from '@/services/paymentMethods';

describe('paymentMethods utils', () => {
  it('onlyDigits and formatters work', () => {
    expect(onlyDigits('4242 4242-4242')).toBe('424242424242');
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
    expect(formatExpiry('0828')).toBe('08/28');
  });

  it('detects card brands', () => {
    expect(detectBrand('4242424242424242')).toBe('Visa');
    expect(detectBrand('5555555555554444')).toBe('Mastercard');
    expect(detectBrand('378282246310005')).toBe('Amex');
    expect(detectBrand('6011111111111117')).toBe('Discover');
    expect(detectBrand('9999')).toBe('Card');
  });

  it('validates luhn and expiry', () => {
    expect(luhnValid('4242424242424242')).toBe(true);
    expect(luhnValid('4242424242424241')).toBe(false);
    expect(isExpiryValid('12/30', new Date(2026, 10, 1))).toBe(true);
    expect(isExpiryValid('01/20', new Date(2026, 10, 1))).toBe(false);
  });
});
