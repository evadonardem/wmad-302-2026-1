
/**
 * Order Types - Marketplace App
 *
 * Defines the structure of customer orders,
 * purchased products, delivery information,
 * and payment methods.
 */

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
}
