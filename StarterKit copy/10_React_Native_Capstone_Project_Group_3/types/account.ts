/**
 * Account Types - orders, addresses, payment methods and settings
 * These are stored on the device (AsyncStorage) because DummyJSON simulates
 * writes without persisting them.
 */

export interface Address {
  id: string;
  label: string; // e.g. "Home", "Office"
  fullName: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
}

export type PaymentMethodType = 'card' | 'ewallet' | 'cod';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  /** Display label, e.g. "Visa •••• 4242" or "GCash 0917•••1234". Full card numbers are never stored. */
  label: string;
  holderName?: string;
  expiry?: string; // MM/YY
  isDefault: boolean;
}

export interface ShippingDetails {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
}

export interface OrderLine {
  id: number;
  title: string;
  thumbnail: string;
  price: number;
  quantity: number;
  discountPercentage: number;
  /** Line total after the product discount. */
  discountedTotal: number;
}

export type OrderSource = 'local' | 'api';

export interface Order {
  /** Unique key: `local-<timestamp>` for orders placed in the app, `api-<cartId>` for DummyJSON carts. */
  id: string;
  cartId: number;
  userId: number;
  source: OrderSource;
  createdAt: string | null;
  status: 'placed' | 'completed';
  lines: OrderLine[];
  totalQuantity: number;
  subtotal: number;
  productDiscount: number;
  couponCode?: string;
  couponDiscount: number;
  shippingFee: number;
  /** Optional gift wrapping (Christmas feature). */
  giftWrap?: boolean;
  giftWrapFee?: number;
  giftMessage?: string;
  grandTotal: number;
  shipping?: ShippingDetails;
  /** Chosen delivery day (ISO date) and time slot, e.g. "9 AM – 12 PM". */
  deliveryDate?: string;
  deliverySlot?: string;
  paymentLabel?: string;
}

export type ThemeMode = 'system' | 'light' | 'dark';
/** Color themes: "lively" is the everyday pink theme, the rest are seasonal. */
export type ThemeSeason = 'lively' | 'christmas' | 'winter' | 'spring' | 'summer' | 'rainy' | 'autumn' | 'halloween';
/** "auto" picks Christmas or Halloween by date, otherwise Lively. */
export type SeasonSetting = 'auto' | ThemeSeason;
export type Language = 'en' | 'fil';
export type Currency = 'USD' | 'PHP';

export const THEME_SEASONS: ThemeSeason[] = [
  'lively',
  'christmas',
  'winter',
  'spring',
  'summer',
  'rainy',
  'autumn',
  'halloween',
];

export interface AppSettings {
  orderNotifications: boolean;
  promoNotifications: boolean;
  themeMode: ThemeMode;
  seasonTheme: SeasonSetting;
  /** Floating color blobs behind the main screens. */
  livelyBackground: boolean;
  /** Prices shown in US dollars or Philippine pesos (amounts are stored in USD). */
  currency: Currency;
  /** Short theme sound when adding to cart (off by default). */
  sounds: boolean;
  /** Ask for fingerprint / Face ID before placing an order (mobile only). */
  biometricCheckout: boolean;
  /** First-launch onboarding finished. */
  onboarded: boolean;
  language: Language;
}

export const DEFAULT_SETTINGS: AppSettings = {
  orderNotifications: true,
  promoNotifications: false,
  themeMode: 'system',
  seasonTheme: 'lively',
  livelyBackground: true,
  currency: 'USD',
  sounds: false,
  biometricCheckout: false,
  onboarded: false,
  language: 'en',
};

export interface UserReview {
  productId: number;
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
}

export type OrderStage = 'placed' | 'packed' | 'shipped' | 'delivered';
