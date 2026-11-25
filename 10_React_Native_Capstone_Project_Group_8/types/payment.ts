
/**
 * Payment Method Types
 *
 * CartlyX - Local payment-method management.
 * Never store full card numbers or CVV values.
 */

export type CardBrand =
  | 'Visa'
  | 'Mastercard'
  | 'American Express'
  | 'Discover'
  | 'Other';

export interface PaymentMethod {
  id: string;
  cardholderName: string;
  brand: CardBrand;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
  createdAt: string;
}
