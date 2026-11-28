/**
 * STYLEPRINT - the shopper's personal style identity.
 *
 * The profile is built from real activity: products viewed, saved to the wishlist,
 * added to the cart and purchased. Views and purchases are kept in a small local
 * log (per user) because the wishlist and cart already persist their own items.
 *
 * Everything here is pure data + AsyncStorage; components/StylePrint.tsx renders it.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersonalityKey } from '@/types/rewards';

export type StyleVibe = 'minimalist' | 'luxury' | 'streetwear' | 'tech' | 'fashion' | 'budget';
export type StyleIdentityKey = StyleVibe | 'explorer';
export type StyleBudget = 'value' | 'everyday' | 'premium' | 'luxury';
export type StyleCategoryKey =
    | 'beauty'
    | 'women'
    | 'men'
    | 'jewellery'
    | 'watches'
    | 'tech'
    | 'home'
    | 'grocery'
    | 'sport'
    | 'auto'
    | 'eyewear'
    | 'other';

export interface StyleProduct {
    productId: number;
    title: string;
    category?: string;
    brand?: string;
    tags?: string[];
    price: number;
    discountPercentage?: number;
}

export interface StyleCartProduct extends StyleProduct {
    quantity?: number;
}

export interface StyleOrderLike {
    discountedTotal: number;
    products: {
        title: string;
        price: number;
        quantity: number;
        discountPercentage?: number;
    }[];
}

export interface StyleActivityEvent extends StyleProduct {
    source: 'view' | 'purchase';
    quantity?: number;
    at: string;
}

export interface StylePrintPrefs {
    /** A vibe the shopper chose to lean into (boosts that identity) */
    vibe: StyleVibe | null;
    /** Their comfortable price band */
    budget: StyleBudget | null;
    /** Categories they want to see more of */
    favoriteCategories: StyleCategoryKey[];
}

export const EMPTY_STYLEPRINT_PREFS: StylePrintPrefs = {
    vibe: null,
    budget: null,
    favoriteCategories: [],
};

export interface StylePersonalityMeta {
    key: StyleIdentityKey;
    title: string;
    tagline: string;
    description: string;
}

export const STYLE_PERSONALITIES: Record<StyleIdentityKey, StylePersonalityMeta> = {
    minimalist: {
        key: 'minimalist',
        title: 'Minimalist Muse',
        tagline: 'Clean lines, calm spaces, considered pieces.',
        description:
            'You edit before you add. Neutral tones, beautiful basics and pieces that work together — your cart is proof that less really can be more.',
    },
    luxury: {
        key: 'luxury',
        title: 'Luxury Lover',
        tagline: 'You invest in pieces that feel special.',
        description:
            'You are drawn to fine details, elevated materials and the quiet confidence of a great find. For you, quality is the whole point.',
    },
    streetwear: {
        key: 'streetwear',
        title: 'Streetwear Enthusiast',
        tagline: 'Bold, easy and always in motion.',
        description:
            'Sneakers, sporty layers and statement accessories speak your language. You like your style comfortable, current and a little unexpected.',
    },
    tech: {
        key: 'tech',
        title: 'Tech Explorer',
        tagline: 'Always one upgrade ahead.',
        description:
            'You shop with specs in mind. New gadgets, smart accessories and clever tools are your version of a treat.',
    },
    fashion: {
        key: 'fashion',
        title: 'Fashion Forward',
        tagline: 'Trend-aware with a signature twist.',
        description:
            'You follow the mood of the season but make it your own. Dresses, bags and finishing pieces are where you shine.',
    },
    budget: {
        key: 'budget',
        title: 'Budget Conscious',
        tagline: 'Smart picks, serious value.',
        description:
            'You know a good deal when you see one. You compare, stack savings and still end up with pieces that look far more expensive than they cost.',
    },
    explorer: {
        key: 'explorer',
        title: 'Style Explorer',
        tagline: 'Your identity is still taking shape.',
        description:
            'Browse, save and shop a little more — STYLEPRINT learns from every product you open, love and bring home.',
    },
};

export const STYLE_VIBE_OPTIONS: { key: StyleVibe; label: string }[] = [
    { key: 'minimalist', label: 'Minimalist' },
    { key: 'luxury', label: 'Luxury' },
    { key: 'streetwear', label: 'Streetwear' },
    { key: 'tech', label: 'Tech' },
    { key: 'fashion', label: 'Fashion Forward' },
    { key: 'budget', label: 'Budget' },
];

export const STYLE_BUDGET_OPTIONS: { key: StyleBudget; label: string }[] = [
    { key: 'value', label: 'Under $25' },
    { key: 'everyday', label: '$25–$60' },
    { key: 'premium', label: '$60–$150' },
    { key: 'luxury', label: '$150+' },
];

const BUDGET_LABELS: Record<StyleBudget, string> = {
    value: 'Under $25',
    everyday: '$25–$60',
    premium: '$60–$150',
    luxury: '$150+',
};

export const STYLE_CATEGORIES: { key: StyleCategoryKey; label: string }[] = [
    { key: 'beauty', label: 'Beauty' },
    { key: 'women', label: 'Women’s fashion' },
    { key: 'men', label: 'Men’s fashion' },
    { key: 'jewellery', label: 'Jewellery' },
    { key: 'watches', label: 'Watches' },
    { key: 'tech', label: 'Tech' },
    { key: 'home', label: 'Home' },
    { key: 'grocery', label: 'Groceries' },
    { key: 'sport', label: 'Sport' },
    { key: 'auto', label: 'Auto' },
    { key: 'eyewear', label: 'Eyewear' },
    { key: 'other', label: 'Curated finds' },
];

const CATEGORY_LABELS: Record<StyleCategoryKey, string> = STYLE_CATEGORIES.reduce(
    (acc, item) => ({ ...acc, [item.key]: item.label }),
    {} as Record<StyleCategoryKey, string>
);

const SLUG_GROUPS: Record<string, StyleCategoryKey> = {
    beauty: 'beauty',
    'skin-care': 'beauty',
    fragrances: 'beauty',
    'womens-dresses': 'women',
    'womens-bags': 'women',
    'womens-shoes': 'women',
    tops: 'women',
    'mens-shirts': 'men',
    'mens-shoes': 'men',
    'womens-jewellery': 'jewellery',
    'womens-watches': 'watches',
    'mens-watches': 'watches',
    laptops: 'tech',
    smartphones: 'tech',
    tablets: 'tech',
    'mobile-accessories': 'tech',
    furniture: 'home',
    'home-decoration': 'home',
    'kitchen-accessories': 'home',
    groceries: 'grocery',
    'sports-accessories': 'sport',
    motorcycle: 'auto',
    vehicle: 'auto',
    sunglasses: 'eyewear',
};

const TITLE_HINTS: [RegExp, StyleCategoryKey][] = [
    [/dress|skirt|blouse|top|handbag|bag|heel|sandal/i, 'women'],
    [/shirt|polo|trouser|jean|loafer/i, 'men'],
    [/ring|necklace|earring|bracelet|jewel|pendant/i, 'jewellery'],
    [/watch/i, 'watches'],
    [/laptop|phone|smartphone|tablet|earbud|headphone|charger|camera|speaker/i, 'tech'],
    [/sofa|chair|table|lamp|rug|decor|cushion|furniture|kitchen|vase/i, 'home'],
    [/sunglass|eyewear|glasses|frame/i, 'eyewear'],
    [/perfume|fragrance|cologne|lipstick|mascara|serum|cream|beauty|skin|makeup/i, 'beauty'],
    [/motorcycle|bike|car|vehicle|helmet/i, 'auto'],
    [/sport|gym|yoga|basketball|football|bicycle|sneaker|trainer/i, 'sport'],
    [/grocery|food|snack|juice|coffee|tea|oil|rice/i, 'grocery'],
];

const SHOE_HINTS = /sneaker|shoe|trainer|boot|heel|sandal|loafer/i;

const QUIZ_BOOSTS: Record<PersonalityKey, Partial<Record<StyleVibe, number>>> = {
    budget: { budget: 0.5, minimalist: 0.1 },
    fashion: { fashion: 0.5, streetwear: 0.15 },
    tech: { tech: 0.5 },
    aesthetic: { minimalist: 0.35, fashion: 0.2, luxury: 0.1 },
};

const PERSONALITY_TAGS: Record<StyleIdentityKey, string> = {
    minimalist: 'Minimalist Style',
    luxury: 'Luxury Lover',
    streetwear: 'Streetwear Enthusiast',
    tech: 'Tech Explorer',
    fashion: 'Fashion Forward',
    budget: 'Budget Conscious',
    explorer: 'Style Explorer',
};

const CATEGORY_TAGS: Record<StyleCategoryKey, string> = {
    beauty: 'Beauty Curator',
    women: 'Fashion Forward',
    men: 'Smart Casual',
    jewellery: 'Luxury Lover',
    watches: 'Timepiece Collector',
    tech: 'Tech Explorer',
    home: 'Home Stylist',
    grocery: 'Everyday Essentials',
    sport: 'Streetwear Enthusiast',
    auto: 'Rider Style',
    eyewear: 'Statement Maker',
    other: 'Curated Finds',
};

const AESTHETICS: Record<StyleCategoryKey, { title: string; note: string }> = {
    beauty: { title: 'Soft Glam', note: 'Glow, scent and self-care' },
    women: { title: 'Elevated Everyday', note: 'Dresses, bags and statement pieces' },
    men: { title: 'Smart Casual', note: 'Clean shirts and easy layers' },
    jewellery: { title: 'Quiet Luxury', note: 'Fine details that catch the light' },
    watches: { title: 'Timeless Icons', note: 'Watches that finish the look' },
    tech: { title: 'Future Ready', note: 'Smart, fast and cutting-edge' },
    home: { title: 'Warm Minimalism', note: 'Calm spaces, curated details' },
    grocery: { title: 'Everyday Essentials', note: 'Practical picks, smart value' },
    sport: { title: 'Active Street', note: 'Movement-ready pieces' },
    auto: { title: 'Rider Energy', note: 'Gear for the open road' },
    eyewear: { title: 'Statement Maker', note: 'Frames that set the tone' },
    other: { title: 'Curated Finds', note: 'A little bit of everything' },
};

const PALETTES: Record<StyleIdentityKey, { name: string; hex: string }[]> = {
    minimalist: [
        { name: 'Sand', hex: '#E7DCC8' },
        { name: 'Stone', hex: '#B9AE9C' },
        { name: 'Ivory', hex: '#FBF7FF' },
        { name: 'Sage', hex: '#9FB8A4' },
    ],
    luxury: [
        { name: 'Gold', hex: '#F2C45A' },
        { name: 'Deep plum', hex: '#3A1E70' },
        { name: 'Pearl', hex: '#F6EFE3' },
        { name: 'Emerald', hex: '#2F6B57' },
    ],
    streetwear: [
        { name: 'Ink', hex: '#241540' },
        { name: 'Concrete', hex: '#8E8A99' },
        { name: 'Neon lime', hex: '#C8F169' },
        { name: 'White', hex: '#FFFFFF' },
    ],
    tech: [
        { name: 'Graphite', hex: '#2E3440' },
        { name: 'Silver', hex: '#C9D1D9' },
        { name: 'Electric violet', hex: '#7C4DFF' },
        { name: 'Ice', hex: '#E6F0FF' },
    ],
    fashion: [
        { name: 'Rose', hex: '#E5788D' },
        { name: 'Plum', hex: '#8B5FD0' },
        { name: 'Cream', hex: '#FBF7FF' },
        { name: 'Berry', hex: '#B0477A' },
    ],
    budget: [
        { name: 'Honey', hex: '#F2C45A' },
        { name: 'Clay', hex: '#D9A08B' },
        { name: 'Slate', hex: '#6E5F8A' },
        { name: 'Cream', hex: '#FBF7FF' },
    ],
    explorer: [
        { name: 'Lilac', hex: '#CDB8F5' },
        { name: 'Gold', hex: '#F2C45A' },
        { name: 'Rose', hex: '#E5788D' },
        { name: 'Mint', hex: '#CFEBDD' },
    ],
};

export interface StyleCategoryResult {
    key: StyleCategoryKey;
    label: string;
    weight: number;
    share: number;
}

export interface StylePrintProfile {
    personality: StylePersonalityMeta;
    confidence: number;
    tags: string[];
    summary: string;
    topCategories: StyleCategoryResult[];
    brands: { name: string; count: number }[];
    palette: { name: string; hex: string }[];
    price: { key: StyleBudget; label: string; average: number };
    aesthetics: { key: StyleCategoryKey; title: string; note: string }[];
    signalCount: number;
    viewCount: number;
    wishCount: number;
    cartCount: number;
    purchaseCount: number;
    orderCount: number;
    spend: number;
    isLearning: boolean;
}

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

const activityKey = (userId: number): string => `styleprint_activity_${userId}`;
const prefsKey = (userId: number): string => `styleprint_prefs_${userId}`;
const MAX_EVENTS = 80;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

function isStyleProduct(value: unknown): value is StyleProduct {
    if (!isRecord(value)) return false;
    return (
        typeof value.productId === 'number' &&
        typeof value.title === 'string' &&
        typeof value.price === 'number' &&
        Number.isFinite(value.price)
    );
}

function isActivityEvent(value: unknown): value is StyleActivityEvent {
    if (!isStyleProduct(value)) return false;
    const event = value as unknown as Record<string, unknown>;
    return (event.source === 'view' || event.source === 'purchase') && typeof event.at === 'string';
}

function isStyleVibe(value: unknown): value is StyleVibe {
    return typeof value === 'string' && STYLE_VIBE_OPTIONS.some((v) => v.key === value);
}

function isStyleBudget(value: unknown): value is StyleBudget {
    return typeof value === 'string' && STYLE_BUDGET_OPTIONS.some((b) => b.key === value);
}

function isCategoryKey(value: unknown): value is StyleCategoryKey {
    return typeof value === 'string' && STYLE_CATEGORIES.some((c) => c.key === value);
}

export async function loadStyleActivity(userId: number): Promise<StyleActivityEvent[]> {
    try {
        const raw = await AsyncStorage.getItem(activityKey(userId));
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter(isActivityEvent).slice(0, MAX_EVENTS) : [];
    } catch {
        return [];
    }
}

async function saveStyleActivity(userId: number, events: StyleActivityEvent[]): Promise<void> {
    try {
        await AsyncStorage.setItem(activityKey(userId), JSON.stringify(events.slice(0, MAX_EVENTS)));
    } catch (error) {
        console.error('Failed to save STYLEPRINT activity:', error);
    }
}

/** Record a product view. Repeat views replace the older entry so the wheel stays fresh. */
export async function trackStyleView(userId: number, product: StyleProduct): Promise<void> {
    if (!Number.isFinite(userId)) return;
    const current = await loadStyleActivity(userId);
    const event: StyleActivityEvent = {
        ...product,
        source: 'view',
        at: new Date().toISOString(),
    };
    const next = [event, ...current.filter((e) => !(e.source === 'view' && e.productId === product.productId))];
    await saveStyleActivity(userId, next);
}

/** Record the items in a completed order. */
export async function trackStylePurchase(userId: number, products: StyleProduct[]): Promise<void> {
    if (!Number.isFinite(userId) || products.length === 0) return;
    const current = await loadStyleActivity(userId);
    const at = new Date().toISOString();
    const events: StyleActivityEvent[] = products.map((product) => ({
        ...product,
        source: 'purchase',
        at,
    }));
    await saveStyleActivity(userId, [...events, ...current]);
}

export async function loadStylePrefs(userId: number): Promise<StylePrintPrefs> {
    try {
        const raw = await AsyncStorage.getItem(prefsKey(userId));
        if (!raw) return { ...EMPTY_STYLEPRINT_PREFS };
        const parsed: unknown = JSON.parse(raw);
        if (!isRecord(parsed)) return { ...EMPTY_STYLEPRINT_PREFS };
        return {
            vibe: isStyleVibe(parsed.vibe) ? parsed.vibe : null,
            budget: isStyleBudget(parsed.budget) ? parsed.budget : null,
            favoriteCategories: Array.isArray(parsed.favoriteCategories)
                ? parsed.favoriteCategories.filter(isCategoryKey).slice(0, 3)
                : [],
        };
    } catch {
        return { ...EMPTY_STYLEPRINT_PREFS };
    }
}

export async function saveStylePrefs(userId: number, prefs: StylePrintPrefs): Promise<void> {
    try {
        await AsyncStorage.setItem(
            prefsKey(userId),
            JSON.stringify({
                vibe: prefs.vibe,
                budget: prefs.budget,
                favoriteCategories: prefs.favoriteCategories.slice(0, 3),
            })
        );
    } catch (error) {
        console.error('Failed to save STYLEPRINT preferences:', error);
    }
}

/* ------------------------------------------------------------------ */
/* Analysis                                                           */
/* ------------------------------------------------------------------ */

export function categoryKey(category?: string): StyleCategoryKey {
    if (!category) return 'other';
    const slug = category.trim().toLowerCase();
    return SLUG_GROUPS[slug] ?? 'other';
}

function inferCategory(title: string): StyleCategoryKey {
    for (const [pattern, key] of TITLE_HINTS) {
        if (pattern.test(title)) return key;
    }
    return 'other';
}

function itemCategory(product: StyleProduct): StyleCategoryKey {
    const key = categoryKey(product.category);
    return key === 'other' ? inferCategory(product.title) : key;
}

interface WeightedItem {
    product: StyleProduct;
    weight: number;
    category: StyleCategoryKey;
}

const priceOf = (product: StyleProduct): number => {
    const discount = Math.min(100, Math.max(0, product.discountPercentage ?? 0));
    return Math.max(0, product.price * (1 - discount / 100));
};

function budgetForPrice(price: number): StyleBudget {
    if (price < 25) return 'value';
    if (price < 60) return 'everyday';
    if (price < 150) return 'premium';
    return 'luxury';
}

export interface StylePrintInput {
    activity: StyleActivityEvent[];
    prefs: StylePrintPrefs;
    wishlist: StyleProduct[];
    cart: StyleCartProduct[];
    orders: StyleOrderLike[];
    quizPersonality?: PersonalityKey | null;
}

export function buildStylePrint({
    activity,
    prefs,
    wishlist,
    cart,
    orders,
    quizPersonality,
}: StylePrintInput): StylePrintProfile {
    const items: WeightedItem[] = [];
    const add = (product: StyleProduct, weight: number) => {
        if (!Number.isFinite(product.price) || weight <= 0) return;
        items.push({ product, weight, category: itemCategory(product) });
    };

    wishlist.forEach((product) => add(product, 4));
    cart.forEach((product) => add(product, 3 + Math.min(2, Math.max(1, product.quantity ?? 1) - 1)));

    const views = activity.filter((event) => event.source === 'view');
    const purchases = activity.filter((event) => event.source === 'purchase');
    views.forEach((event) => add(event, 1));
    purchases.forEach((event) => add(event, 6 + Math.min(6, Math.max(1, event.quantity ?? 1) - 1) * 2));

    // Older orders placed before STYLEPRINT existed still count: infer their category from the title.
    if (purchases.length === 0) {
        orders.forEach((order) => {
            order.products.forEach((product) => {
                const key = inferCategory(product.title);
                const productLike: StyleProduct = {
                    productId: 0,
                    title: product.title,
                    price: product.price,
                    discountPercentage: product.discountPercentage,
                };
                items.push({ product: productLike, weight: 4, category: key });
            });
        });
    }

    const groupWeights = STYLE_CATEGORIES.reduce(
        (acc, category) => ({ ...acc, [category.key]: 0 }),
        {} as Record<StyleCategoryKey, number>
    );
    items.forEach(({ weight, category }) => {
        groupWeights[category] += weight;
    });
    prefs.favoriteCategories.forEach((key) => {
        groupWeights[key] += 2;
    });

    const totalGroupWeight = Object.values(groupWeights).reduce((sum, value) => sum + value, 0);
    const shareOf = (key: StyleCategoryKey): number =>
        totalGroupWeight > 0 ? groupWeights[key] / totalGroupWeight : 0;

    const totalItemWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const weightedAverage = (pick: (product: StyleProduct) => number): number =>
        totalItemWeight > 0
            ? items.reduce((sum, item) => sum + pick(item.product) * item.weight, 0) / totalItemWeight
            : 0;

    const averagePrice = weightedAverage(priceOf);
    const averageDiscount = weightedAverage((product) => product.discountPercentage ?? 0);

    const brandWeights = new Map<string, number>();
    items.forEach(({ product, weight }) => {
        const brand = product.brand?.trim();
        if (brand) brandWeights.set(brand, (brandWeights.get(brand) ?? 0) + weight);
    });
    const brands = [...brandWeights.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count: Math.round(count) }));

    const shoeShare = items.reduce((sum, item) => {
        const haystack = `${item.product.title} ${(item.product.tags ?? []).join(' ')}`;
        return SHOE_HINTS.test(haystack) ? sum + item.weight : sum;
    }, 0) / Math.max(1, totalItemWeight);

    const scores: Record<StyleVibe, number> = {
        minimalist:
            0.12 +
            shareOf('home') * 1.1 +
            shareOf('beauty') * 0.45 +
            shareOf('jewellery') * 0.3 +
            shareOf('eyewear') * 0.15 +
            (averagePrice >= 30 && averagePrice <= 130 ? 0.2 : 0),
        luxury:
            0.08 +
            shareOf('jewellery') * 1.8 +
            shareOf('watches') * 1.6 +
            (averagePrice >= 180 ? 0.7 : averagePrice >= 90 ? 0.3 : 0) +
            shareOf('home') * 0.2,
        streetwear:
            0.08 +
            shareOf('sport') * 1.5 +
            shareOf('auto') * 0.5 +
            shareOf('eyewear') * 0.5 +
            shareOf('men') * 0.5 +
            shoeShare * 0.8,
        tech: 0.08 + shareOf('tech') * 2,
        fashion:
            0.12 +
            shareOf('women') * 1.3 +
            shareOf('men') * 0.45 +
            shareOf('eyewear') * 0.45 +
            shareOf('watches') * 0.35 +
            shareOf('beauty') * 0.3,
        budget:
            0.1 +
            shareOf('grocery') * 0.5 +
            (averageDiscount / 20) * 0.9 +
            (averagePrice < 35 ? 0.8 : averagePrice < 60 ? 0.35 : 0),
    };

    if (quizPersonality) {
        const boosts = QUIZ_BOOSTS[quizPersonality];
        (Object.keys(boosts) as StyleVibe[]).forEach((key) => {
            scores[key] += boosts[key] ?? 0;
        });
    }

    const isLearning = totalItemWeight < 3;
    const bestVibe = (Object.keys(scores) as StyleVibe[]).reduce(
        (best, key) => (scores[key] > scores[best] ? key : best),
        'minimalist'
    );
    // A chosen vibe is an explicit preference, so it wins over the inferred one.
    const personality = prefs.vibe
        ? STYLE_PERSONALITIES[prefs.vibe]
        : isLearning
          ? STYLE_PERSONALITIES.explorer
          : STYLE_PERSONALITIES[bestVibe];

    const confidence =
        totalItemWeight === 0 ? 0 : Math.min(97, Math.round(30 + Math.log2(1 + totalItemWeight) * 10));

    const topCategories: StyleCategoryResult[] = STYLE_CATEGORIES.map((category) => ({
        key: category.key,
        label: CATEGORY_LABELS[category.key],
        weight: groupWeights[category.key],
        share: shareOf(category.key),
    }))
        .filter((category) => category.weight > 0)
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 4);

    const tags: string[] = [PERSONALITY_TAGS[personality.key]];
    topCategories.forEach((category) => tags.push(CATEGORY_TAGS[category.key]));
    if (averageDiscount >= 14) tags.push('Deal Hunter');
    if (brandWeights.size >= 3) tags.push('Brand Explorer');
    if (averagePrice >= 180) tags.push('Investment Pieces');
    if (averagePrice > 0 && averagePrice < 35) tags.push('Budget Conscious');
    if (isLearning) tags.push('New Here');
    const uniqueTags = [...new Set(tags)].slice(0, 6);

    const priceKey = prefs.budget ?? budgetForPrice(averagePrice);
    const lead = topCategories[0];
    const second = topCategories[1];
    const brand = brands[0]?.name;
    const summary = isLearning
        ? prefs.vibe
            ? `You are leaning into ${personality.title}. Browse, save and shop a little more to sharpen the details.`
            : 'Your STYLEPRINT is just getting started. Browse products, save the ones you love and place an order — your identity updates automatically.'
        : `${lead ? `Your ${lead.label.toLowerCase()} picks lead the way` : 'Your picks are taking shape'}${
              second ? `, with ${second.label.toLowerCase()} close behind` : ''
          }. ${brand ? `${brand} shows up most in your world. ` : ''}You are most comfortable in the ${
              BUDGET_LABELS[priceKey]
          } range and your identity sharpens with every view, save and order.`;

    const purchaseCount = purchases.length > 0
        ? purchases.length
        : orders.reduce((count, order) => count + order.products.length, 0);
    const spend = orders.reduce((sum, order) => sum + order.discountedTotal, 0);
    const cartCount = cart.reduce((count, item) => count + Math.max(1, item.quantity ?? 1), 0);

    return {
        personality,
        confidence,
        tags: uniqueTags,
        summary,
        topCategories,
        brands,
        palette: PALETTES[personality.key],
        price: { key: priceKey, label: BUDGET_LABELS[priceKey], average: averagePrice },
        aesthetics: topCategories.slice(0, 3).map((category) => ({
            key: category.key,
            ...AESTHETICS[category.key],
        })),
        signalCount: views.length + wishlist.length + cartCount + purchaseCount,
        viewCount: views.length,
        wishCount: wishlist.length,
        cartCount,
        purchaseCount,
        orderCount: orders.length,
        spend,
        isLearning,
    };
}
