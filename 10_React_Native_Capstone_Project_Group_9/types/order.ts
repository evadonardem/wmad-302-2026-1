import type { Cart } from '@/types/product';
import type { DeliveryAddress } from '@/types/address';
import type { OrderPaymentMethod } from '@/types/payment';

export interface OrderRecord extends Cart {
  deliveryAddress?: DeliveryAddress;
  paymentMethod?: OrderPaymentMethod;
  placedAt?: string;
}
