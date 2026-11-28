export const PAYMENT_METHOD_OPTIONS = [
  { type: 'card', label: 'Credit or debit card' },
  { type: 'gcash', label: 'GCash' },
  { type: 'maya', label: 'Maya (PayMaya)' },
  { type: 'online-banking', label: 'Online banking' },
  { type: 'cash-on-delivery', label: 'Cash on delivery' },
] as const;

export type PaymentMethodType = typeof PAYMENT_METHOD_OPTIONS[number]['type'];

export interface SavedPaymentMethod {
  id: string;
  type?: PaymentMethodType;
  nickname?: string;
  brand?: string;
  last4?: string;
  expiry?: string;
  holder?: string;
}

export interface OrderPaymentMethod {
  type: PaymentMethodType;
  label: string;
  savedMethodId?: string;
}

export function isPaymentMethodType(value: string): value is PaymentMethodType {
  return PAYMENT_METHOD_OPTIONS.some(({ type }) => type === value);
}

export function getPaymentMethodType(method: SavedPaymentMethod): PaymentMethodType {
  return method.type ?? 'card';
}

export function getPaymentMethodName(type: PaymentMethodType): string {
  return PAYMENT_METHOD_OPTIONS.find((option) => option.type === type)?.label ?? 'Payment method';
}

export function getPaymentMethodLabel(method: SavedPaymentMethod): string {
  const type = getPaymentMethodType(method);
  if (method.nickname?.trim()) return `${getPaymentMethodName(type)} · ${method.nickname.trim()}`;
  if (method.brand && method.last4) return `${method.brand} ending in ${method.last4}`;
  if (method.holder) return `${method.brand ?? 'Card'} for ${method.holder}`;
  return getPaymentMethodName(type);
}
