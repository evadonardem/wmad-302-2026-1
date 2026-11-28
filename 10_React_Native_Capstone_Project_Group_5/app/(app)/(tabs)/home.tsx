/**
 * Home Screen - Marketplace Shop Tab
 * Students implement: Product grid, categories, flash deals, recommendations
 * APIs: https://dummyjson.com/docs/products
 * Boutique layout, responsive for phone / tablet / web: header with search + cart, category pills,
 * best-picks banner with a limited-time offer, and a bento product grid with pagination dots.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator, RefreshControl, LayoutChangeEvent, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useRewards } from '@/context/RewardsContext';
import { useSettings } from '@/context/SettingsContext';
import { productApi } from '@/services/productApi';
import { Product } from '@/types/product';
import { BentoProducts } from '@/components/BentoProducts';
import { ShowcaseHero } from '@/components/ShowcaseHero';
import { ScreenBackground } from '@/components/ScreenBackground';
import { useResponsive, palette } from '@/constants/theme';
import { styles } from '@/styles/home';

// Types for DummyJSON Products API (shared in @/types/product)
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface CategoryPill {
  key: string;
  label: string;
  icon: IconName;
  /** DummyJSON category slugs this pill covers */
  slugs: string[];
}

const PILLS: CategoryPill[] = [
  { key: 'all', label: 'All', icon: 'view-grid-outline', slugs: [] },
  { key: 'women', label: 'Women', icon: 'human-female', slugs: ['womens-dresses', 'womens-shoes', 'tops'] },
  { key: 'men', label: 'Men', icon: 'tshirt-crew-outline', slugs: ['mens-shirts', 'mens-shoes'] },
  { key: 'bags', label: 'Bags', icon: 'bag-personal-outline', slugs: ['womens-bags'] },
  { key: 'shoes', label: 'Shoes', icon: 'shoe-sneaker', slugs: ['mens-shoes', 'womens-shoes'] },
  { key: 'jewellery', label: 'Jewellery', icon: 'diamond-stone', slugs: ['womens-jewellery'] },
  { key: 'eyewear', label: 'Eyewear', icon: 'sunglasses', slugs: ['sunglasses'] },
  { key: 'fragrance', label: 'Fragrance', icon: 'spray', slugs: ['fragrances'] },
  { key: 'watches', label: 'Watches', icon: 'watch', slugs: ['womens-watches', 'mens-watches'] },
  { key: 'beauty', label: 'Beauty', icon: 'face-woman-shimmer-outline', slugs: ['beauty', 'skin-care'] },
  { key: 'tech', label: 'Tech', icon: 'laptop', slugs: ['laptops', 'smartphones', 'tablets', 'mobile-accessories'] },
  { key: 'furniture', label: 'Furniture', icon: 'sofa-outline', slugs: ['furniture'] },
  { key: 'home', label: 'Home', icon: 'home-outline', slugs: ['home-decoration', 'kitchen-accessories'] },
  { key: 'grocery', label: 'Grocery', icon: 'basket-outline', slugs: ['groceries'] },
  { key: 'sports', label: 'Sports', icon: 'basketball', slugs: ['sports-accessories'] },
  { key: 'auto', label: 'Auto', icon: 'motorbike', slugs: ['motorcycle', 'vehicle'] },
];

// "Shop by Category" cards: one product picture per category, taken from the loaded products
const SHOP_CARDS: { label: string; slug: string }[] = [
  { label: 'Women', slug: 'womens-dresses' },
  { label: 'Men', slug: 'mens-shirts' },
  { label: 'Bags', slug: 'womens-bags' },
  { label: 'Shoes', slug: 'mens-shoes' },
  { label: 'Jewellery', slug: 'womens-jewellery' },
  { label: 'Eyewear', slug: 'sunglasses' },
  { label: 'Fragrance', slug: 'fragrances' },
  { label: 'Watches', slug: 'mens-watches' },
  { label: 'Beauty', slug: 'beauty' },
  { label: 'Tech', slug: 'laptops' },
  { label: 'Furniture', slug: 'furniture' },
  { label: 'Home', slug: 'home-decoration' },
  { label: 'Grocery', slug: 'groceries' },
  { label: 'Sports', slug: 'sports-accessories' },
];

const byRating = (a: Product, b: Product): number => b.rating - a.rating;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { totalQuantity } = useCart();
  const { state: rewards } = useRewards();
  const { resolvedMode, updateSettings } = useSettings();
  const { isWide, isUltra, contentWidth, columns, pad } = useResponsive();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedPill, setSelectedPill] = useState<string | null>(null);
  const [pillProducts, setPillProducts] = useState<Product[]>([]);
  const [pillLoading, setPillLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pillsRef = useRef<ScrollView>(null);
  const [shopWidth, setShopWidth] = useState(0);
  const pillRequest = useRef(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      // DummyJSON returns objects ({ slug, name, url }) in newer versions, strings in older ones
      // (productApi normalises both, and the category pills use known category slugs)
      const res = await productApi.getProducts({ limit: 200 });
      setProducts(res.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Picking a category pill loads that category's products for the grid
  useEffect(() => {
    const pill = PILLS.find((p) => p.key === selectedPill);
    const id = ++pillRequest.current;
    if (!pill) {
      setPillProducts([]);
      setPillLoading(false);
      return;
    }
    setPillLoading(true);
    Promise.all(pill.slugs.map((slug) => productApi.getProductsByCategory(slug, { limit: 50 })))
      .then((results) => {
        if (id !== pillRequest.current) return;
        const seen = new Set<number>();
        const merged = results
          .flatMap((r) => r.products)
          .filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
          .sort(byRating);
        setPillProducts(merged);
      })
      .catch(() => {
        if (id === pillRequest.current) setPillProducts([]);
      })
      .finally(() => {
        if (id === pillRequest.current) setPillLoading(false);
      });
  }, [selectedPill]);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const view = useMemo(() => {
    const sorted = [...products].sort(byRating);
    // Showcase carousel: the best-rated product from five different categories
    const showcase: Product[] = [];
    const seen = new Set<string>();
    for (const p of sorted) {
      if (seen.has(p.category)) continue;
      seen.add(p.category);
      showcase.push(p);
      if (showcase.length === 5) break;
    }
    const categoryImages: Record<string, string> = {};
    for (const p of sorted) if (!categoryImages[p.category]) categoryImages[p.category] = p.thumbnail;
    return {
      bentoAll: sorted,
      categoryImages,
      showcase,
      maxDiscount: products.reduce((m, p) => Math.max(m, p.discountPercentage), 0),
    };
  }, [products]);

  const bentoSource = selectedPill ? pillProducts : view.bentoAll;

  const openProduct = (id: number) => router.push(`/(app)/(tabs)/product/${id}`);
  const openCollection = (slug: string) => router.push(`/(app)/(tabs)/search?category=${encodeURIComponent(slug)}`);
  const goSearch = () => router.push('/(app)/(tabs)/search');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={palette.forest} />
        <Text style={styles.loadingText}>Loading your selection</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={() => load()}>Retry</Button>
      </View>
    );
  }

  const innerWidth = contentWidth - pad * 2;
  const wideBanner = isWide;
  const themeButton = (
    <Pressable
      style={[styles.themeButton, !isWide && { width: 40, height: 40, borderRadius: 20 }]}
      onPress={() => updateSettings({ theme: resolvedMode === 'dark' ? 'light' : 'dark' })}
      accessibilityLabel={resolvedMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <MaterialCommunityIcons name={resolvedMode === 'dark' ? 'weather-sunny' : 'weather-night'} size={isWide ? 20 : 18} color={palette.forest} />
    </Pressable>
  );
  const cartButton = (
    <Pressable style={[styles.cartButton, !isWide && { width: 40, height: 40, borderRadius: 20 }]} onPress={() => router.push('/(app)/(tabs)/cart')} accessibilityLabel="Open cart">
      <MaterialCommunityIcons name="cart-outline" size={isWide ? 22 : 20} color={palette.surface} />
      {totalQuantity > 0 && (
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{totalQuantity}</Text>
        </View>
      )}
    </Pressable>
  );
  const accountButton = (
    <Pressable
      style={[styles.accountButton, !isWide && { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line, justifyContent: 'center' }]}
      onPress={() => router.push('/(app)/(tabs)/profile')}
      accessibilityLabel="Open profile"
    >
      <MaterialCommunityIcons name="account-circle-outline" size={isWide ? 30 : 20} color={palette.forest} />
      {isWide && user ? <Text style={styles.accountName}>Hi, {user.firstName}</Text> : null}
      {isWide && user ? <MaterialCommunityIcons name="chevron-down" size={18} color={palette.ink} /> : null}
    </Pressable>
  );
  const brand = (
    <View style={styles.brand}>
      <MaterialCommunityIcons name="shopping" size={isWide ? 38 : 28} color={palette.forest} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.brandText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>MARKETPLACE</Text>
        <Text style={styles.brandTag} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>Shop Smart. Live Better.</Text>
      </View>
    </View>
  );
  const searchPill = (
    <Pressable style={[styles.searchPill, !isWide && styles.searchPillStacked]} onPress={goSearch} accessibilityRole="search">
      <MaterialCommunityIcons name="magnify" size={20} color={palette.ink} />
      <Text style={styles.searchText}>Search products...</Text>
    </Pressable>
  );

  // Browse All Products: sits at the right end of the pagination row under the product grid
  const browseButton = (
    <Pressable style={styles.browseButton} onPress={goSearch} accessibilityRole="button">
              <MaterialCommunityIcons name="view-grid-outline" size={20} color={palette.forest} />
              <Text style={styles.browseText}>Browse All Products</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color={palette.forest} />
            </Pressable>
  );

  return (
    <View style={styles.screen}>
      <ScreenBackground />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: pad }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.forest} colors={[palette.forest]} />}
      >
        {/* Top bar + Search bar: brand, search pill, cart and account */}
        {isWide ? (
          <View style={styles.header}>
            {brand}
            {searchPill}
            <View style={styles.headerIcons}>
              {themeButton}
              {cartButton}
              <View style={styles.headerDivider} />
              {accountButton}
            </View>
          </View>
        ) : (
          <View style={[styles.headerStacked, { position: 'relative', zIndex: 20 }]}>
            <View style={styles.brandRowMobile}>
              <View style={{ flex: 1, minWidth: 0 }}>{brand}</View>
              <Pressable
                style={styles.mobileMenuToggle}
                onPress={() => setMobileMenuOpen((v) => !v)}
                accessibilityLabel={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                <MaterialCommunityIcons name={mobileMenuOpen ? 'close' : 'dots-vertical'} size={22} color={palette.ink} />
              </Pressable>
            </View>
            {mobileMenuOpen ? (
              <View style={styles.mobileMenuOverlay}>
                <View style={[styles.headerIcons, { flexDirection: 'column', alignItems: 'flex-end', gap: 8 }]}>
                  {themeButton}
                  {cartButton}
                  {accountButton}
                </View>
              </View>
            ) : null}
            {searchPill}
          </View>
        )}

        {/* Categories: pill row, picking one filters the product grid below */}
        {isWide ? (
          // Wide screens: every pill is visible, wrapped and centred
          <View style={styles.pillWrap}>
          {PILLS.map((pill) => {
            const active = pill.key === 'all' ? selectedPill === null : selectedPill === pill.key;
            return (
              <Pressable
                key={pill.key}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setSelectedPill(pill.key === 'all' ? null : pill.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <MaterialCommunityIcons name={pill.icon} size={22} color={active ? palette.surface : palette.forest} />
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{pill.label}</Text>
              </Pressable>
            );
          })}
          </View>
        ) : (
          <ScrollView ref={pillsRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {PILLS.map((pill) => {
            const active = pill.key === 'all' ? selectedPill === null : selectedPill === pill.key;
            return (
              <Pressable
                key={pill.key}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setSelectedPill(pill.key === 'all' ? null : pill.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <MaterialCommunityIcons name={pill.icon} size={22} color={active ? palette.surface : palette.forest} />
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{pill.label}</Text>
              </Pressable>
            );
          })}
          <Pressable style={styles.pillChevron} onPress={() => pillsRef.current?.scrollToEnd({ animated: true })} accessibilityLabel="More categories">
            <MaterialCommunityIcons name="chevron-right" size={22} color={palette.ink} />
          </Pressable>
          </ScrollView>
        )}

        {/* Flash Deals + Welcome Header: best-picks banner and the limited-time offer */}
        <View style={[styles.bannerRow, !wideBanner && styles.bannerRowStacked]}>
          {/* Product showcase hero carousel: auto-plays, arrows, dots and selectors, background follows the product */}
          <View style={[styles.bannerSlot, !wideBanner && styles.bannerSlotStacked]}>
            <ShowcaseHero
              products={view.showcase}
              height={isUltra ? 460 : 380}
              wideAt={560}
              eyebrowPrefix="Best Picks"
              onOpenProduct={openProduct}
              onOpenCollection={openCollection}
            />
          </View>

          {wideBanner ? (
            <View style={styles.offer}>
              <MaterialCommunityIcons name="gift-outline" size={150} color="#FFFFFF" style={styles.offerBag} />
              <View style={styles.offerTop}>
                <MaterialCommunityIcons name="lightning-bolt" size={22} color={palette.gold} />
                <Text style={styles.offerLabel}>Limited Time Offer</Text>
              </View>
              <Text style={styles.offerUpTo}>Up to</Text>
              <Text style={styles.offerBig}>{Math.round(view.maxDiscount)}% OFF</Text>
              <Text style={styles.offerSub}>On Selected Items</Text>
              <Pressable style={styles.offerButton} onPress={goSearch} accessibilityRole="button">
                <Text style={styles.offerButtonText}>Shop the Deal</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color="#FBF7FF" />
              </Pressable>
            </View>
          ) : null}
        </View>

        {!wideBanner ? (
          <View style={[styles.offer, styles.offerStacked, styles.offerMobileBelow]}>
            <MaterialCommunityIcons name="gift-outline" size={150} color="#FFFFFF" style={styles.offerBag} />
            <View style={styles.offerTop}>
              <MaterialCommunityIcons name="lightning-bolt" size={22} color={palette.gold} />
              <Text style={styles.offerLabel}>Limited Time Offer</Text>
            </View>
            <Text style={styles.offerUpTo}>Up to</Text>
            <Text style={styles.offerBig}>{Math.round(view.maxDiscount)}% OFF</Text>
            <Text style={styles.offerSub}>On Selected Items</Text>
            <Pressable style={styles.offerButton} onPress={goSearch} accessibilityRole="button">
              <Text style={styles.offerButtonText}>Shop the Deal</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color="#FBF7FF" />
            </Pressable>
          </View>
        ) : null}

        {/* Play & Earn: one shared rewards hub for three games */}
        <Pressable
          style={styles.playCard}
          onPress={() => router.push('/(app)/(tabs)/play-earn')}
          accessibilityRole="button"
          accessibilityLabel="Open Play and Earn"
        >
          <View style={styles.playGlowA} />
          <View style={styles.playGlowB} />
          <View style={styles.playRing} />
          <MaterialCommunityIcons name="star-four-points" size={22} color={palette.gold} style={styles.playSpark} />
          <View style={styles.playTop}>
            <View style={styles.playEyebrowRow}>
              <MaterialCommunityIcons name="controller-classic-outline" size={16} color={palette.gold} />
              <Text style={styles.playEyebrow}>Play &amp; Earn</Text>
            </View>
            <View style={styles.playPointsPill}>
              <Text style={styles.playPointsValue}>{rewards.points}</Text>
              <Text style={styles.playPointsLabel}>PTS</Text>
            </View>
          </View>
          <Text style={styles.playTitle}>A little fun goes a long way.</Text>
          <Text style={styles.playSub}>
            Spin the wheel, take the personality quiz or hunt today&apos;s hidden deal to earn coupons and points.
          </Text>
          <View style={styles.playActivities}>
            <View style={styles.playActivity}>
              <MaterialCommunityIcons name="chart-donut" size={15} color={palette.gold} />
              <Text style={styles.playActivityText}>Spin &amp; Win</Text>
            </View>
            <View style={styles.playActivity}>
              <MaterialCommunityIcons name="brain" size={15} color={palette.gold} />
              <Text style={styles.playActivityText}>Personality Quiz</Text>
            </View>
            <View style={styles.playActivity}>
              <MaterialCommunityIcons name="binoculars" size={15} color={palette.gold} />
              <Text style={styles.playActivityText}>Deal Hunter</Text>
            </View>
          </View>
          <View style={styles.playCta}>
            <Text style={styles.playCtaText}>Open Play &amp; Earn</Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color="#3A1E70" />
          </View>
        </Pressable>

        {/* Categories: Shop by Category cards with a product picture each */}
        <View style={styles.shopSection} onLayout={(e: LayoutChangeEvent) => setShopWidth(Math.floor(e.nativeEvent.layout.width))}>
          <View style={styles.shopHeader}>
            <View style={styles.shopAccent} />
            <Text style={styles.shopTitle}>Shop by Category</Text>
            <View style={styles.shopLine} />
            <Pressable onPress={() => router.push('/(app)/(tabs)/categories')} accessibilityRole="link">
              <Text style={styles.viewAll}>View All →</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shopRow}>
            {SHOP_CARDS.map((card) => {
              const perRow = isUltra ? 9 : 7;
              const cardWidth = isWide ? Math.max(128, Math.floor(((shopWidth || innerWidth) - 12 * (perRow - 1)) / perRow)) : 132;
              const image = view.categoryImages[card.slug];
              return (
                <Pressable
                  key={card.slug}
                  style={[styles.shopCard, { width: cardWidth }]}
                  onPress={() => openCollection(card.slug)}
                  accessibilityRole="button"
                  accessibilityLabel={card.label}
                >
                  <View style={[styles.shopImageWrap, { height: Math.round(cardWidth * 1.05) }]}>
                    {image ? <Image source={{ uri: image }} style={styles.shopImage} resizeMode="contain" /> : null}
                  </View>
                  <View style={styles.shopLabel}>
                    <Text style={styles.shopLabelText} numberOfLines={1}>{card.label}</Text>
                    <View style={styles.shopArrow}>
                      <MaterialCommunityIcons name="arrow-right" size={16} color={palette.surface} />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Recommended Products: bento grid with pagination dots */}
        <View style={styles.section}>
          {pillLoading ? (
            <View style={styles.sectionLoading}>
              <ActivityIndicator size="small" color={palette.forest} />
            </View>
          ) : bentoSource.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          ) : (
            <BentoProducts
              products={bentoSource}
              width={innerWidth}
              columns={columns}
              maxPages={12}
              onOpenProduct={openProduct}
              onOpenCollection={openCollection}
              trailing={browseButton}
            />
          )}
          {pillLoading || bentoSource.length === 0 ? <View style={styles.browseRow}>{browseButton}</View> : null}
        </View>
      </ScrollView>
    </View>
  );
}