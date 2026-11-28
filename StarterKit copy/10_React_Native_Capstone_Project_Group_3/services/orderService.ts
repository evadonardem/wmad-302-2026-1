/**
 * Order Service - checkout and order history
 *
 * Checkout posts the cart to DummyJSON (`POST /carts/add`). DummyJSON does not
 * persist new carts, so placed orders are also saved on the device and merged
 * with the user's carts from `GET /carts/user/{id}` when showing history.
 */
import { productApi } from '@/services/productApi';
import { ordersStorage } from '@/utils/storage';
import { calculateCartTotals, findCoupon } from '@/utils/cart';
import { getDiscountedPrice } from '@/utils/format';
import type { Cart, CartItem } from '@/types/product';
import type { Order, ShippingDetails } from '@/types/account';

export interface PlaceOrderInput {
  userId: number;
  items: CartItem[];
  couponCode: string | null;
  shipping: ShippingDetails;
  paymentLabel: string;
  giftWrap?: boolean;
  giftMessage?: string;
  deliveryDate?: string;
  deliverySlot?: string;
}

const round = (value: number) => Math.round(value * 100) / 100;

export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  if (input.items.length === 0) throw new Error('Your cart is empty');

  const cart = await productApi.addCart({
    userId: input.userId,
    products: input.items.map((item) => ({ id: item.productId, quantity: item.quantity })),
  });

  const totals = calculateCartTotals(input.items, input.couponCode, input.giftWrap);
  const order: Order = {
    id: `local-${Date.now()}`,
    cartId: cart.id,
    userId: input.userId,
    source: 'local',
    createdAt: new Date().toISOString(),
    status: 'placed',
    lines: input.items.map((item) => ({
      id: item.productId,
      title: item.title,
      thumbnail: item.thumbnail,
      price: item.price,
      quantity: item.quantity,
      discountPercentage: item.discountPercentage,
      discountedTotal: round(getDiscountedPrice(item.price, item.discountPercentage) * item.quantity),
    })),
    totalQuantity: totals.totalQuantity,
    subtotal: totals.subtotal,
    productDiscount: totals.productDiscount,
    couponCode: input.couponCode ? findCoupon(input.couponCode)?.code : undefined,
    couponDiscount: totals.couponDiscount,
    shippingFee: totals.shippingFee,
    giftWrap: !!input.giftWrap,
    giftWrapFee: totals.giftWrapFee,
    giftMessage: input.giftWrap ? input.giftMessage?.trim() || undefined : undefined,
    grandTotal: totals.grandTotal,
    shipping: input.shipping,
    deliveryDate: input.deliveryDate,
    deliverySlot: input.deliverySlot,
    paymentLabel: input.paymentLabel,
  };

  await ordersStorage.add(order);
  return order;
}

/** Maps a DummyJSON cart to the app's Order shape. */
export function cartToOrder(cart: Cart): Order {
  return {
    id: `api-${cart.id}`,
    cartId: cart.id,
    userId: cart.userId,
    source: 'api',
    createdAt: null,
    status: 'completed',
    lines: cart.products.map((line) => ({
      id: line.id,
      title: line.title,
      thumbnail: line.thumbnail,
      price: line.price,
      quantity: line.quantity,
      discountPercentage: line.discountPercentage,
      discountedTotal: line.discountedTotal ?? line.discountedPrice ?? line.total,
    })),
    totalQuantity: cart.totalQuantity,
    subtotal: cart.total,
    productDiscount: round(cart.total - cart.discountedTotal),
    couponDiscount: 0,
    shippingFee: 0,
    grandTotal: cart.discountedTotal,
  };
}

/** Orders placed in the app (newest first) followed by the user's DummyJSON carts. */
export async function getOrders(userId: number): Promise<Order[]> {
  const [localOrders, remote] = await Promise.all([
    ordersStorage.getAll(),
    productApi.getUserCarts(userId),
  ]);
  return [
    ...localOrders.filter((order) => order.userId === userId),
    ...remote.carts.map(cartToOrder),
  ];
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  if (orderId.startsWith('api-')) {
    const cartId = Number(orderId.slice(4));
    if (!Number.isInteger(cartId)) return null;
    return cartToOrder(await productApi.getCartById(cartId));
  }
  const localOrders = await ordersStorage.getAll();
  return localOrders.find((order) => order.id === orderId) ?? null;
}
