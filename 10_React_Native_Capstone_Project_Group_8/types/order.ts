
import type { CartItem } from '@/types/product';

/**
 * Order status values.
 */
export type OrderStatus =
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

/**
 * Available payment methods.
 */
export type PaymentMethod =
  | 'Cash on Delivery'
  | 'Simulated Online Payment';

/**
 * Available delivery methods.
 */
export type DeliveryMethod =
  | 'Standard Delivery'
  | 'Express Delivery';

/**
 * Contact information saved separately in the user's profile.
 */
export interface ContactInformation {
  fullName: string;
  email: string;
  phone: string;
}

/**
 * Shipping address saved separately in the user's profile.
 */
export interface SavedShippingAddress {
  address: string;
  city: string;
  province: string;
  postalCode: string;
}

/**
 * Tracking milestones for the simulated order-tracking system.
 */
export type TrackingMilestone =
  | 'Order Placed'
  | 'Order Confirmed'
  | 'Preparing Shipment'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered';

/**
 * A saved tracking event with its description and timestamp.
 */
export interface TrackingEvent {
  milestone: TrackingMilestone;
  description: string;
  timestamp: string;
}

/**
 * Combined customer information stored as an order snapshot.
 *
 * Keeping this interface preserves compatibility with existing
 * checkout and order-details functionality.
 */
export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  notes: string;
}

/**
 * Complete marketplace order.
 */
export interface Order {
  id: string;
  userId: number;
  username: string;
  customer: ShippingAddress;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  status: OrderStatus;
  createdAt: string;

  /**
   * Optional for compatibility with orders saved before
   * the tracking system was introduced.
   */
  trackingNumber?: string;
  trackingEvents?: TrackingEvent[];
}
