/**
 * Cart math: totals, coupons and shipping. Pure functions so they are easy to test.
 */
import type { CartItem } from '@/types/product';
import { formatPrice, getDiscountedPrice } from './format';

export interface Coupon {
  code: string;
  description: string;
  type: 'percent' | 'fixed';
  value: number;
  minSubtotal: number;
  /** Only usable after it is unlocked in Rewards or the advent calendar. */
  rewardOnly?: boolean;
}

/**
 * Coupon codes accepted at checkout. DummyJSON has no coupon endpoint, so codes
 * are validated on the client.
 */
export const COUPONS: Coupon[] = [
  { code: 'SAVE10', description: '10% off your order', type: 'percent', value: 10, minSubtotal: 0 },
  { code: 'WELCOME5', description: '$5 off orders over $25', type: 'fixed', value: 5, minSubtotal: 25 },
  { code: 'BIGSALE20', description: '20% off orders over $200', type: 'percent', value: 20, minSubtotal: 200 },
  { code: 'XMAS25', description: '🎄 25% off orders over $100', type: 'percent', value: 25, minSubtotal: 100 },
  // Reward coupons (unlocked with points, the daily surprise or the advent calendar)
  { code: 'POINTS5', description: '$5 off (200 points)', type: 'fixed', value: 5, minSubtotal: 0, rewardOnly: true },
  { code: 'POINTS15', description: '15% off orders over $50 (500 points)', type: 'percent', value: 15, minSubtotal: 50, rewardOnly: true },
  { code: 'LUCKY12', description: '12% off from the daily surprise', type: 'percent', value: 12, minSubtotal: 0, rewardOnly: true },
  { code: 'ADVENT20', description: '20% off orders over $40 from the advent calendar', type: 'percent', value: 20, minSubtotal: 40, rewardOnly: true },
];

export const FREE_SHIPPING_THRESHOLD = 50;
export const SHIPPING_FEE = 4.99;
export const GIFT_WRAP_FEE = 2.99;

export interface CartTotals {
  /** Sum of list prices. */
  subtotal: number;
  /** Savings from product discounts. */
  productDiscount: number;
  /** Subtotal after product discounts. */
  discountedSubtotal: number;
  couponDiscount: number;
  shippingFee: number;
  giftWrapFee: number;
  grandTotal: number;
  totalQuantity: number;
  totalProducts: number;
}

const roundMoney = (value: number) => Math.round(value * 100) / 100;

export function findCoupon(code: string): Coupon | undefined {
  const normalized = code.trim().toUpperCase();
  return COUPONS.find((coupon) => coupon.code === normalized);
}

/** Returns an error message when the coupon cannot be applied to the given subtotal. */
export function getCouponError(code: string, discountedSubtotal: number, unlockedCodes: string[] = []): string | null {
  const coupon = findCoupon(code);
  if (!coupon) return 'Invalid coupon code';
  if (coupon.rewardOnly && !unlockedCodes.includes(coupon.code)) return 'Unlock this coupon in Rewards first';
  if (discountedSubtotal < coupon.minSubtotal) {
    return `${coupon.code} requires a minimum order of ${formatPrice(coupon.minSubtotal)}`;
  }
  return null;
}

export function getCouponDiscount(coupon: Coupon | undefined, discountedSubtotal: number): number {
  if (!coupon || discountedSubtotal < coupon.minSubtotal) return 0;
  const raw =
    coupon.type === 'percent' ? (discountedSubtotal * coupon.value) / 100 : coupon.value;
  return roundMoney(Math.min(raw, discountedSubtotal));
}

export function calculateCartTotals(
  items: CartItem[],
  couponCode?: string | null,
  giftWrap = false
): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountedSubtotal = items.reduce(
    (sum, item) => sum + getDiscountedPrice(item.price, item.discountPercentage) * item.quantity,
    0
  );
  const coupon = couponCode ? findCoupon(couponCode) : undefined;
  const couponDiscount = getCouponDiscount(coupon, discountedSubtotal);
  const afterCoupon = discountedSubtotal - couponDiscount;
  const shippingFee =
    items.length === 0 || discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const giftWrapFee = giftWrap && items.length > 0 ? GIFT_WRAP_FEE : 0;

  return {
    subtotal: roundMoney(subtotal),
    productDiscount: roundMoney(subtotal - discountedSubtotal),
    discountedSubtotal: roundMoney(discountedSubtotal),
    couponDiscount,
    shippingFee,
    giftWrapFee,
    grandTotal: roundMoney(afterCoupon + shippingFee + giftWrapFee),
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    totalProducts: items.length,
  };
}
