import {
  calculateCartTotals,
  getCouponDiscount,
  getCouponError,
  findCoupon,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
} from '@/utils/cart';
import { formatCategory, formatDate, formatPrice, getDiscountedPrice } from '@/utils/format';
import {
  detectCardBrand,
  isValidCardNumber,
  isValidEmail,
  isValidExpiry,
  validateRegisterForm,
  validateShipping,
  RegisterFormValues,
} from '@/utils/validation';
import { getErrorMessage } from '@/utils/errors';
import type { CartItem } from '@/types/product';

const item = (overrides: Partial<CartItem> = {}): CartItem => ({
  productId: 1,
  title: 'Item',
  thumbnail: '',
  price: 20,
  discountPercentage: 0,
  quantity: 1,
  stock: 10,
  ...overrides,
});

describe('format utils', () => {
  it('applies percentage discounts', () => {
    expect(getDiscountedPrice(100, 25)).toBe(75);
  });

  it('formats prices and categories', () => {
    expect(formatPrice(12.5)).toBe('$12.50');
    expect(formatCategory('home-decoration')).toBe('Home Decoration');
    expect(formatCategory('womens-jewellery')).toBe('Womens Jewellery');
  });

  it('falls back for missing or invalid dates', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('not a date', 'n/a')).toBe('n/a');
    expect(formatDate('2026-11-20T10:00:00Z')).toContain('2026');
  });
});

describe('cart utils', () => {
  it('calculates totals with product discounts and shipping', () => {
    const totals = calculateCartTotals([item({ price: 10, discountPercentage: 10, quantity: 2 })]);
    expect(totals.subtotal).toBe(20);
    expect(totals.discountedSubtotal).toBe(18);
    expect(totals.productDiscount).toBe(2);
    expect(totals.shippingFee).toBe(SHIPPING_FEE);
    expect(totals.grandTotal).toBeCloseTo(18 + SHIPPING_FEE, 2);
    expect(totals.totalQuantity).toBe(2);
  });

  it('gives free shipping above the threshold and none for an empty cart', () => {
    expect(calculateCartTotals([item({ price: FREE_SHIPPING_THRESHOLD })]).shippingFee).toBe(0);
    expect(calculateCartTotals([]).grandTotal).toBe(0);
  });

  it('applies percentage and fixed coupons', () => {
    expect(calculateCartTotals([item({ price: 100 })], 'SAVE10').couponDiscount).toBe(10);
    expect(calculateCartTotals([item({ price: 30 })], 'welcome5').couponDiscount).toBe(5);
  });

  it('ignores coupons whose minimum is not met', () => {
    expect(getCouponDiscount(findCoupon('BIGSALE20'), 50)).toBe(0);
    expect(getCouponError('BIGSALE20', 50)).toMatch(/minimum/);
  });

  it('rejects unknown coupons', () => {
    expect(getCouponError('NOPE', 100)).toBe('Invalid coupon code');
    expect(getCouponError('save10', 100)).toBeNull();
  });
});

describe('validation utils', () => {
  const validForm: RegisterFormValues = {
    firstName: 'Ada',
    lastName: 'Lovelace',
    username: 'ada_l',
    email: 'ada@example.com',
    password: 'secret1',
    confirmPassword: 'secret1',
    age: '',
    gender: 'female',
  };

  it('accepts a valid registration', () => {
    expect(validateRegisterForm(validForm, true)).toEqual({});
  });

  it('reports each invalid registration field', () => {
    const errors = validateRegisterForm(
      { ...validForm, username: 'a', email: 'bad', confirmPassword: 'other', age: '5' },
      false
    );
    expect(Object.keys(errors).sort()).toEqual(['age', 'confirmPassword', 'email', 'terms', 'username']);
  });

  it('validates emails', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('a@b')).toBe(false);
  });

  it('validates shipping details', () => {
    expect(
      validateShipping({ fullName: 'Ada L', phone: '+63 917 123 4567', street: '1 Main St', city: 'Manila', postalCode: '1000' })
    ).toEqual({});
    expect(Object.keys(validateShipping({ fullName: '', phone: 'x', street: '', city: '', postalCode: '' }))).toHaveLength(5);
  });

  it('validates card numbers with the Luhn check and detects the brand', () => {
    expect(isValidCardNumber('4242 4242 4242 4242')).toBe(true);
    expect(isValidCardNumber('4242 4242 4242 4241')).toBe(false);
    expect(detectCardBrand('4242')).toBe('Visa');
    expect(detectCardBrand('5555')).toBe('Mastercard');
  });

  it('rejects expired or malformed expiry dates', () => {
    const now = new Date(2026, 10, 20); // Nov 2026
    expect(isValidExpiry('11/26', now)).toBe(true);
    expect(isValidExpiry('10/26', now)).toBe(false);
    expect(isValidExpiry('13/30', now)).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('prefers API messages, then Error messages, then the fallback', () => {
    const apiError = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status: 400, data: { message: 'Invalid credentials' } },
    });
    expect(getErrorMessage(apiError)).toBe('Invalid credentials');
    expect(getErrorMessage(new Error('Boom'))).toBe('Boom');
    expect(getErrorMessage('weird', 'Fallback')).toBe('Fallback');
  });

  it('explains network failures', () => {
    const networkError = Object.assign(new Error('Network Error'), { isAxiosError: true });
    expect(getErrorMessage(networkError)).toMatch(/Network error/);
  });
});
