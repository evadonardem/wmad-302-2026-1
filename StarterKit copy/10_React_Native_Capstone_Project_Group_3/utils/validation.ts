/**
 * Form validation helpers. Each validator returns an error message, or null when valid.
 */
import type { Gender } from '@/types/auth';
import type { ShippingDetails } from '@/types/account';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9\s-]{7,20}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  return PHONE_PATTERN.test(phone.trim());
}

export interface RegisterFormValues {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: string;
  gender: Gender;
}

export type RegisterFormErrors = Partial<Record<keyof RegisterFormValues | 'terms', string>>;

/** Validates every register field at once so the form can show inline errors. */
export function validateRegisterForm(
  values: RegisterFormValues,
  agreedToTerms: boolean
): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  if (!values.firstName.trim()) errors.firstName = 'First name is required';
  if (!values.lastName.trim()) errors.lastName = 'Last name is required';

  const username = values.username.trim();
  if (!username) errors.username = 'Username is required';
  else if (username.length < 3) errors.username = 'Username must be at least 3 characters';
  else if (!/^[a-zA-Z0-9_.]+$/.test(username))
    errors.username = 'Use only letters, numbers, dots and underscores';

  if (!values.email.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(values.email)) errors.email = 'Invalid email format';

  if (!values.password) errors.password = 'Password is required';
  else if (values.password.length < 6) errors.password = 'Password must be at least 6 characters';

  if (!values.confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (values.password !== values.confirmPassword)
    errors.confirmPassword = 'Passwords do not match';

  if (values.age.trim()) {
    const age = Number(values.age);
    if (!Number.isInteger(age) || age < 13 || age > 120) errors.age = 'Age must be between 13 and 120';
  }

  if (!agreedToTerms) errors.terms = 'You must agree to the Terms of Service';

  return errors;
}

export type ShippingErrors = Partial<Record<keyof ShippingDetails, string>>;

export function validateShipping(details: ShippingDetails): ShippingErrors {
  const errors: ShippingErrors = {};
  if (details.fullName.trim().length < 2) errors.fullName = 'Full name is required';
  if (!isValidPhone(details.phone)) errors.phone = 'Enter a valid phone number';
  if (details.street.trim().length < 5) errors.street = 'Street address is required';
  if (!details.city.trim()) errors.city = 'City is required';
  if (!/^[0-9A-Za-z\s-]{3,10}$/.test(details.postalCode.trim()))
    errors.postalCode = 'Enter a valid postal code';
  return errors;
}

/** Luhn checksum used by all major card networks. */
export function isValidCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 12 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Validates an MM/YY expiry that is not in the past. */
export function isValidExpiry(expiry: string, now: Date = new Date()): boolean {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(expiry.trim());
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return year > currentYear || (year === currentYear && month >= currentMonth);
}

export function detectCardBrand(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^6(011|5)/.test(digits)) return 'Discover';
  if (/^35/.test(digits)) return 'JCB';
  return 'Card';
}

export function hasErrors(errors: object): boolean {
  return Object.keys(errors).length > 0;
}
