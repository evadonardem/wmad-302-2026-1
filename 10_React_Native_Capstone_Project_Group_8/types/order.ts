import type { CartItem } from '@/types/product';

export type OrderStatus =
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod =
  | 'Cash on Delivery'
  | 'Simulated Online Payment';

export type DeliveryMethod =
  | 'Standard Delivery'
  | 'Express Delivery';

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