/**
 * Flash Sale & TikTok Shop Promotion Engine
 * Features: Persistent Promotion Schedules (survives page refreshes & navigation),
 * Real-Time Countdown Formatting, Automatic Expiration Price Revert, and Dynamic Promotional Badges.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MarketplaceProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags?: string[];
  brand?: string;
  sku?: string;
  weight?: number;
  dimensions?: { width: number; height: number; depth: number };
  warrantyInformation?: string;
  shippingInformation?: string;
  availabilityStatus?: string;
  reviews?: Array<{ rating: number; comment: string; date: string; reviewerName: string }>;
  returnPolicy?: string;
  minimumOrderQuantity?: number;
  meta?: { createdAt: string; updatedAt: string; barcode: string; qrCode: string };
  images?: string[];
  thumbnail: string;
}

export interface FlashSaleSchedule {
  productId: number;
  startTime: number; // Unix timestamp (ms)
  endTime: number; // Unix timestamp (ms)
  promoStockLimit?: number;
}

export interface EnrichedProductPromo {
  isFlashSale: boolean;
  flashSaleStatus: 'upcoming' | 'active' | 'ended' | 'none';
  startTime?: number;
  endTime?: number;
  remainingMs: number;
  countdownLabel: string;
  scheduledStartLabel: string;
  effectiveDiscountPercentage: number;
  effectivePrice: number;
  originalPrice: number;
  hasDiscount: boolean;
  isFreeShipping: boolean;
  isCodAvailable: boolean;
  soldCount: number;
  soldFormatted: string;
  promoStockRemaining?: number;
  badges: Array<{
    key: string;
    label: string;
    type: 'flash' | 'shipping' | 'discount' | 'cod';
  }>;
}

const FLASH_SCHEDULE_STORAGE_KEY = '@marketplace_flash_sale_schedule_v1';
let memoryScheduleCache: Record<number, FlashSaleSchedule> | null = null;

/**
 * Loads or initializes deterministic Flash Sale start & end timestamps in persistent storage
 * so timers never restart on page refresh or screen navigation.
 */
export async function getFlashSaleSchedules(): Promise<Record<number, FlashSaleSchedule>> {
  if (memoryScheduleCache) {
    return memoryScheduleCache;
  }

  try {
    const raw = await AsyncStorage.getItem(FLASH_SCHEDULE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        memoryScheduleCache = parsed;
        return parsed;
      }
    }
  } catch {
    // Fallback to deterministic seed below
  }

  const hourAnchor = Math.floor(Date.now() / (60 * 60 * 1000)) * (60 * 60 * 1000);
  const seeded: Record<number, FlashSaleSchedule> = {};

  for (let id = 1; id <= 100; id++) {
    if (id % 3 === 1 || id <= 15) {
      const durationVariants = [
        1 * 60 * 60 * 1000 + 25 * 60 * 1000,
        5 * 60 * 60 * 1000 + 30 * 60 * 1000 + 45 * 1000,
        27 * 60 * 60 * 1000,
        84 * 60 * 60 * 1000 + 30 * 60 * 1000,
      ];
      const duration = durationVariants[id % durationVariants.length];
      seeded[id] = {
        productId: id,
        startTime: hourAnchor - 30 * 60 * 1000,
        endTime: hourAnchor + duration,
        promoStockLimit: id % 2 === 0 ? 50 : 30,
      };
    } else if (id % 11 === 0) {
      seeded[id] = {
        productId: id,
        startTime: hourAnchor + 2 * 60 * 60 * 1000,
        endTime: hourAnchor + 14 * 60 * 60 * 1000,
        promoStockLimit: 40,
      };
    }
  }

  memoryScheduleCache = seeded;
  try {
    await AsyncStorage.setItem(FLASH_SCHEDULE_STORAGE_KEY, JSON.stringify(seeded));
  } catch {
    // Ignore storage quota errors
  }
  return seeded;
}

/**
 * Formats remaining milliseconds into TikTok Shop countdown format:
 * e.g. "01:00:00", "05:30:45", "1 Day 03:00:00", "3 Days 12:30:00"
 */
export function formatFlashCountdown(remainingMs: number): string {
  if (remainingMs <= 0) return '00:00:00';

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const hms = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  if (days === 1) return `1 Day ${hms}`;
  if (days > 1) return `${days} Days ${hms}`;
  return hms;
}

export function formatScheduledStartTime(startTimeMs: number): string {
  const date = new Date(startTimeMs);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Derives realistic sales count from actual product metrics (reviews, rating, id, stock)
 */
export function computeProductSoldCount(product: MarketplaceProduct): {
  soldCount: number;
  soldFormatted: string;
} {
  const reviewCount = Array.isArray(product.reviews) ? product.reviews.length : 1;
  const ratingFactor = Math.max(1, Math.round((product.rating || 4) * 10));
  const rawSold = reviewCount * 240 + ((product.id * 137 + ratingFactor * 43) % 14500) + 120;

  if (rawSold >= 1000) {
    const kVal = (rawSold / 1000).toFixed(1).replace(/\.0$/, '');
    return { soldCount: rawSold, soldFormatted: `${kVal}k sold` };
  }
  return { soldCount: rawSold, soldFormatted: `${rawSold} sold` };
}

/**
 * Computes accurate promotional state, active/expired Flash Sale pricing, and applicable badges
 * strictly from the product's actual attributes and promotion schedule.
 */
export function evaluateProductPromotions(
  product: MarketplaceProduct,
  schedules: Record<number, FlashSaleSchedule>,
  nowMs: number
): EnrichedProductPromo {
  const schedule = schedules[product.id];
  const hasBaseDiscount = (product.discountPercentage || 0) >= 1;

  let flashSaleStatus: 'upcoming' | 'active' | 'ended' | 'none' = 'none';
  let remainingMs = 0;

  if (schedule && product.discountPercentage > 10) {
    if (nowMs < schedule.startTime) {
      flashSaleStatus = 'upcoming';
      remainingMs = schedule.startTime - nowMs;
    } else if (nowMs >= schedule.startTime && nowMs < schedule.endTime) {
      flashSaleStatus = 'active';
      remainingMs = schedule.endTime - nowMs;
    } else {
      flashSaleStatus = 'ended';
      remainingMs = 0;
    }
  }

  const isFlashSale = flashSaleStatus === 'active';

  // When Flash Sale expires, remove the expired Flash Sale discount and revert to regular price
  let effectiveDiscountPercentage = 0;
  if (flashSaleStatus === 'active') {
    effectiveDiscountPercentage = Math.round(product.discountPercentage);
  } else if (flashSaleStatus === 'ended') {
    effectiveDiscountPercentage = 0;
  } else if (hasBaseDiscount) {
    effectiveDiscountPercentage = Math.round(product.discountPercentage);
  }

  const originalPrice = Number(product.price || 0);
  const effectivePrice =
    effectiveDiscountPercentage > 0
      ? Number((originalPrice * (1 - effectiveDiscountPercentage / 100)).toFixed(2))
      : originalPrice;

  const shippingText = (product.shippingInformation || '').toLowerCase();
  const isFreeShipping =
    effectivePrice >= 15 ||
    shippingText.includes('overnight') ||
    shippingText.includes('1-2 business') ||
    shippingText.includes('free');

  const isCodAvailable =
    product.stock > 0 &&
    effectivePrice <= 1500 &&
    !(product.tags || []).some((t) => t.toLowerCase() === 'digital');

  const { soldCount, soldFormatted } = computeProductSoldCount(product);

  const promoStockRemaining =
    isFlashSale && schedule?.promoStockLimit
      ? Math.min(product.stock, schedule.promoStockLimit)
      : undefined;

  const badges: EnrichedProductPromo['badges'] = [];

  if (isFlashSale) {
    badges.push({
      key: 'flash-countdown',
      label: `⚡ Flash Sale · ${formatFlashCountdown(remainingMs)}`,
      type: 'flash',
    });
  } else if (flashSaleStatus === 'upcoming' && schedule) {
    badges.push({
      key: 'flash-upcoming',
      label: `Starts at ${formatScheduledStartTime(schedule.startTime)}`,
      type: 'flash',
    });
  }

  if (isFreeShipping) {
    badges.push({
      key: 'free-shipping',
      label: 'Free Shipping',
      type: 'shipping',
    });
  }

  if (effectiveDiscountPercentage > 0) {
    badges.push({
      key: 'discount-off',
      label: `${effectiveDiscountPercentage}% OFF`,
      type: 'discount',
    });
  }

  if (isCodAvailable) {
    badges.push({
      key: 'cod',
      label: 'COD',
      type: 'cod',
    });
  }

  return {
    isFlashSale,
    flashSaleStatus,
    startTime: schedule?.startTime,
    endTime: schedule?.endTime,
    remainingMs,
    countdownLabel: formatFlashCountdown(remainingMs),
    scheduledStartLabel: schedule ? formatScheduledStartTime(schedule.startTime) : '',
    effectiveDiscountPercentage,
    effectivePrice,
    originalPrice,
    hasDiscount: effectiveDiscountPercentage > 0,
    isFreeShipping,
    isCodAvailable,
    soldCount,
    soldFormatted,
    promoStockRemaining,
    badges,
  };
}