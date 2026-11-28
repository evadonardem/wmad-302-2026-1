import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EMPTY_STYLEPRINT_PREFS,
  StylePrintPrefs,
  StyleProduct,
  buildStylePrint,
  loadStyleActivity,
  loadStylePrefs,
  saveStylePrefs,
  trackStylePurchase,
  trackStyleView,
} from '@/services/styleprint';

const product = (over: Partial<StyleProduct> = {}): StyleProduct => ({
  productId: 1,
  title: 'Test product',
  price: 50,
  discountPercentage: 0,
  ...over,
});

const prefs = (over: Partial<StylePrintPrefs> = {}): StylePrintPrefs => ({
  ...EMPTY_STYLEPRINT_PREFS,
  favoriteCategories: [],
  ...over,
});

const build = (over: Partial<Parameters<typeof buildStylePrint>[0]> = {}) =>
  buildStylePrint({
    activity: [],
    prefs: prefs(),
    wishlist: [],
    cart: [],
    orders: [],
    ...over,
  });

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('STYLEPRINT analysis', () => {
  it('starts as an explorer while learning', () => {
    const profile = build();
    expect(profile.personality.key).toBe('explorer');
    expect(profile.isLearning).toBe(true);
    expect(profile.confidence).toBe(0);
    expect(profile.topCategories).toHaveLength(0);
    expect(profile.tags).toContain('New Here');
  });

  it('recognises a tech shopper from saved gadgets', () => {
    const profile = build({
      wishlist: [
        product({ productId: 1, title: 'Smartphone', category: 'smartphones', price: 899, brand: 'Apple' }),
        product({ productId: 2, title: 'Laptop', category: 'laptops', price: 1299, brand: 'Apple' }),
      ],
    });
    expect(profile.personality.key).toBe('tech');
    expect(profile.topCategories[0].key).toBe('tech');
    expect(profile.tags).toContain('Tech Explorer');
    expect(profile.price.label).toBe('$150+');
    expect(profile.confidence).toBeGreaterThan(0);
    expect(profile.isLearning).toBe(false);
  });

  it('recognises a luxury shopper from fine jewellery and watches', () => {
    const profile = build({
      wishlist: [
        product({ productId: 1, title: 'Gold ring', category: 'womens-jewellery', price: 650 }),
        product({ productId: 2, title: 'Luxury watch', category: 'mens-watches', price: 1200 }),
      ],
    });
    expect(profile.personality.key).toBe('luxury');
    expect(profile.tags).toContain('Luxury Lover');
    expect(profile.tags).toContain('Investment Pieces');
  });

  it('recognises a budget shopper from low prices and big discounts', () => {
    const profile = build({
      wishlist: [
        product({ productId: 1, title: 'Snack pack', category: 'groceries', price: 12, discountPercentage: 30 }),
        product({ productId: 2, title: 'Kitchen tool', category: 'kitchen-accessories', price: 9, discountPercentage: 25 }),
      ],
    });
    expect(profile.personality.key).toBe('budget');
    expect(profile.tags).toContain('Budget Conscious');
    expect(profile.tags).toContain('Deal Hunter');
  });

  it('lets a chosen vibe override the inferred identity', () => {
    const profile = build({
      wishlist: [product({ productId: 1, title: 'Gold ring', category: 'womens-jewellery', price: 650 })],
      prefs: prefs({ vibe: 'streetwear' }),
    });
    expect(profile.personality.key).toBe('streetwear');
  });

  it('honours the chosen price comfort band', () => {
    const profile = build({
      wishlist: [product({ productId: 1, title: 'Perfume', category: 'fragrances', price: 40 })],
      prefs: prefs({ budget: 'premium' }),
    });
    expect(profile.price.key).toBe('premium');
    expect(profile.price.label).toBe('$60–$150');
  });

  it('boosts favourite categories', () => {
    const profile = build({
      wishlist: [product({ productId: 1, title: 'Perfume', category: 'fragrances', price: 40 })],
      prefs: prefs({ favoriteCategories: ['tech'] }),
    });
    expect(profile.topCategories.map((category) => category.key)).toContain('tech');
    expect(profile.personality.key).toBe('tech');
  });

  it('infers categories from older orders when there is no activity log', () => {
    const profile = build({
      orders: [
        {
          discountedTotal: 120,
          products: [
            { title: 'Running Sneakers', price: 80, quantity: 1, discountPercentage: 0 },
            { title: 'Perfume Mist', price: 40, quantity: 1, discountPercentage: 0 },
          ],
        },
      ],
    });
    const keys = profile.topCategories.map((category) => category.key);
    expect(keys).toContain('sport');
    expect(keys).toContain('beauty');
    expect(profile.orderCount).toBe(1);
    expect(profile.spend).toBe(120);
  });

  it('counts quiz personality as a signal boost', () => {
    const wishlist = [
      product({ productId: 1, title: 'Perfume', category: 'fragrances', price: 40 }),
      product({ productId: 2, title: 'Yoga mat', category: 'sports-accessories', price: 40 }),
    ];
    const withoutQuiz = build({ wishlist });
    const withQuiz = build({ wishlist, quizPersonality: 'aesthetic' });
    expect(withoutQuiz.personality.key).toBe('streetwear');
    expect(withQuiz.personality.key).toBe('minimalist');
    expect(withQuiz.confidence).toBe(withoutQuiz.confidence);
  });
});

describe('STYLEPRINT activity storage', () => {
  it('keeps only the latest view of the same product', async () => {
    await trackStyleView(7, product({ productId: 1, price: 20 }));
    await trackStyleView(7, product({ productId: 1, price: 80 }));
    const events = await loadStyleActivity(7);
    expect(events).toHaveLength(1);
    expect(events[0].source).toBe('view');
    expect(events[0].price).toBe(80);
  });

  it('records purchases from checkout', async () => {
    await trackStylePurchase(7, [product({ productId: 2, category: 'laptops' })]);
    const events = await loadStyleActivity(7);
    expect(events).toHaveLength(1);
    expect(events[0].source).toBe('purchase');
  });

  it('saves and reloads preferences', async () => {
    await saveStylePrefs(7, prefs({ vibe: 'fashion', budget: 'everyday', favoriteCategories: ['women', 'beauty'] }));
    const saved = await loadStylePrefs(7);
    expect(saved.vibe).toBe('fashion');
    expect(saved.budget).toBe('everyday');
    expect(saved.favoriteCategories).toEqual(['women', 'beauty']);
  });

  it('ignores invalid stored preferences', async () => {
    await AsyncStorage.setItem(
      'styleprint_prefs_7',
      JSON.stringify({ vibe: 'nope', budget: 'nope', favoriteCategories: ['nope'] })
    );
    const saved = await loadStylePrefs(7);
    expect(saved.vibe).toBeNull();
    expect(saved.budget).toBeNull();
    expect(saved.favoriteCategories).toEqual([]);
  });
});
