
import type { CartItem } from '@/types/product';
import type { UserId } from '@/types/auth';

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

export interface ContactInformation {
  fullName: string;
  email: string;
  phone: string;
}

export interface SavedShippingAddress {
  address: string;
  city: string;
  province: string;
  postalCode: string;
}

export type TrackingMilestone =
  | 'Order Placed'
  | 'Order Confirmed'
  | 'Preparing Shipment'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered';

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
  userId: UserId;
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
  trackingNumber?: string;
  trackingEvents?: TrackingEvent[];
}
