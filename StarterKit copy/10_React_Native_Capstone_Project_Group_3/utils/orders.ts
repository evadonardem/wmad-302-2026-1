/**
 * Order tracking. DummyJSON has no shipment status, so in-app orders advance
 * through simulated stages based on how long ago they were placed.
 */
import type { Order, OrderStage } from '@/types/account';

export const ORDER_STAGES: OrderStage[] = ['placed', 'packed', 'shipped', 'delivered'];

const HOUR = 60 * 60 * 1000;

/** Hours after placing an order when each stage is reached. */
const STAGE_AFTER_HOURS: Record<OrderStage, number> = {
  placed: 0,
  packed: 2,
  shipped: 24,
  delivered: 72,
};

export function getOrderStage(order: Pick<Order, 'createdAt' | 'source'>, now: Date = new Date()): OrderStage {
  if (order.source === 'api' || !order.createdAt) return 'delivered';
  const elapsedHours = (now.getTime() - new Date(order.createdAt).getTime()) / HOUR;
  let stage: OrderStage = 'placed';
  for (const candidate of ORDER_STAGES) {
    if (elapsedHours >= STAGE_AFTER_HOURS[candidate]) stage = candidate;
  }
  return stage;
}

/** When each stage was (or will be) reached; null for API orders without a date. */
export function getStageTime(order: Pick<Order, 'createdAt'>, stage: OrderStage): Date | null {
  if (!order.createdAt) return null;
  return new Date(new Date(order.createdAt).getTime() + STAGE_AFTER_HOURS[stage] * HOUR);
}

/** Days until Dec 25 (0 on Christmas Day; counts to next year's Christmas after it). */
export function daysUntilChristmas(now: Date = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let christmas = new Date(now.getFullYear(), 11, 25);
  if (today > christmas) christmas = new Date(now.getFullYear() + 1, 11, 25);
  return Math.round((christmas.getTime() - today.getTime()) / (24 * HOUR));
}
