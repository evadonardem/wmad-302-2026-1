/**
 * Deal Hunter - local daily challenge configuration.
 *
 * Each challenge has a clue and a product category. The screen finds the actual
 * DummyJSON product that matches, then hides it among two products from other
 * categories. The challenge rotates once per local day.
 */
import { Product } from '@/types/product';
import { dailyIndex } from '@/services/rewardsService';

export interface DealChallenge {
    id: string;
    clue: string;
    category: string;
    keywords: string[];
    rewardPoints: number;
    couponTitle: string;
    couponValue: number;
}

export const DEAL_CHALLENGES: DealChallenge[] = [
    {
        id: 'sneakers',
        clue: "I'm something you wear on your feet. I make walking comfortable and I'm currently on sale!",
        category: 'mens-shoes',
        keywords: ['sneaker', 'shoe', 'trainer', 'sport'],
        rewardPoints: 100,
        couponTitle: '5% OFF',
        couponValue: 5,
    },
    {
        id: 'watch',
        clue: 'I live on your wrist and I always know what time it is. Find me on sale!',
        category: 'mens-watches',
        keywords: ['watch', 'chronograph', 'timepiece'],
        rewardPoints: 100,
        couponTitle: '5% OFF',
        couponValue: 5,
    },
    {
        id: 'sunglasses',
        clue: 'I protect your eyes from the sun and make any outfit cooler. I am discounted today!',
        category: 'sunglasses',
        keywords: ['sunglass', 'shades'],
        rewardPoints: 100,
        couponTitle: '5% OFF',
        couponValue: 5,
    },
    {
        id: 'bag',
        clue: 'I carry your essentials wherever you go. I am a stylish find that is on sale!',
        category: 'womens-bags',
        keywords: ['bag', 'handbag', 'tote', 'purse'],
        rewardPoints: 100,
        couponTitle: '5% OFF',
        couponValue: 5,
    },
    {
        id: 'fragrance',
        clue: 'I make you smell amazing and I come in a beautiful bottle. Find me on sale!',
        category: 'fragrances',
        keywords: ['perfume', 'fragrance', 'eau', 'cologne', 'mist'],
        rewardPoints: 100,
        couponTitle: '5% OFF',
        couponValue: 5,
    },
    {
        id: 'laptop',
        clue: 'I am a portable computer for work and play. I am the tech deal hiding today!',
        category: 'laptops',
        keywords: ['laptop', 'macbook', 'notebook'],
        rewardPoints: 100,
        couponTitle: '5% OFF',
        couponValue: 5,
    },
    {
        id: 'dress',
        clue: 'I am a one-piece outfit that makes you feel effortlessly dressed up. Find me on sale!',
        category: 'womens-dresses',
        keywords: ['dress', 'gown'],
        rewardPoints: 100,
        couponTitle: '5% OFF',
        couponValue: 5,
    },
    {
        id: 'headphones',
        clue: 'I sit over your ears and turn music into your own little world. I am on sale today!',
        category: 'mobile-accessories',
        keywords: ['headphone', 'earbud', 'airpod', 'headset'],
        rewardPoints: 100,
        couponTitle: '5% OFF',
        couponValue: 5,
    },
];

function hashString(value: string): number {
    let hash = 7;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash * 31 + value.charCodeAt(i)) % 1000003;
    }
    return hash;
}

/** Deterministic shuffle so every reload on the same day shows the same choices */
function seededShuffle<T>(items: T[], seed: string): T[] {
    const out = [...items];
    let h = hashString(seed) || 1;
    for (let i = out.length - 1; i > 0; i -= 1) {
        h = (h * 9301 + 49297) % 233280;
        const j = Math.floor((h / 233280) * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

export interface DailyDeal {
    challenge: DealChallenge;
    answer: Product;
    choices: Product[];
}

/**
 * Choose today's challenge from the products that actually loaded.
 * Starts at a day-dependent index, then walks forward until a category exists.
 */
export function dailyDeal(dayKey: string, products: Product[]): DailyDeal | null {
    if (products.length < 3) return null;
    const start = dailyIndex(dayKey, DEAL_CHALLENGES.length);

    for (let offset = 0; offset < DEAL_CHALLENGES.length; offset += 1) {
        const challenge = DEAL_CHALLENGES[(start + offset) % DEAL_CHALLENGES.length];
        const inCategory = products.filter((p) => p.category === challenge.category && !!p.thumbnail);
        if (inCategory.length === 0) continue;

        const keywordMatches = inCategory.filter((p) => {
            const haystack = `${p.title} ${p.description} ${(p.tags ?? []).join(' ')}`.toLowerCase();
            return challenge.keywords.some((keyword) => haystack.includes(keyword));
        });
        const pool = keywordMatches.length > 0 ? keywordMatches : inCategory;
        const answer = [...pool].sort((a, b) => b.discountPercentage - a.discountPercentage)[0];

        // Two distractors from different categories, so the clue stays fair
        const usedCategories = new Set([answer.category]);
        const distractors: Product[] = [];
        for (const candidate of seededShuffle(products, `${dayKey}-${challenge.id}`)) {
            if (distractors.length >= 2) break;
            if (candidate.id === answer.id || usedCategories.has(candidate.category) || !candidate.thumbnail) continue;
            usedCategories.add(candidate.category);
            distractors.push(candidate);
        }
        if (distractors.length < 2) continue;

        return {
            challenge,
            answer,
            choices: seededShuffle([answer, ...distractors], `${dayKey}-${challenge.id}-choices`),
        };
    }

    return null;
}
