/**
 * Categories Screen - Marketplace
 * Browse products by category
 * Responsive grid of image tiles (2 columns on phones, 3 on tablets, 4 on desktop web).
 * Student guide, all done: collection banner, product counts, sub-category navigation
 * (parent groups + sub-category chips), Featured Brands and pull-to-refresh.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { productApi } from '@/services/productApi';
import { useCart } from '@/context/CartContext';
import { Screen } from '@/components/ScreenBackground';
import { BentoSpec, CategoryBento } from '@/components/CategoryBento';
import { CategoryCollage } from '@/components/CategoryCollage';
import { useResponsive, palette } from '@/constants/theme';
import { styles } from '@/styles/categories';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface Category {
  name: string;
  count: number;
  image: string;
}

interface Brand {
  name: string;
  count: number;
  image: string;
}

interface Group {
  key: string;
  label: string;
  icon: IconName;
  /** DummyJSON category slugs inside this group (null = everything) */
  slugs: string[] | null;
}

// Sub-categories navigation: DummyJSON categories are flat, so they are grouped into parents
const GROUPS: Group[] = [
  { key: 'all', label: 'All', icon: 'view-grid-outline', slugs: null },
  {
    key: 'fashion',
    label: 'Fashion',
    icon: 'hanger',
    slugs: ['womens-dresses', 'womens-shoes', 'womens-bags', 'womens-jewellery', 'womens-watches', 'tops', 'mens-shirts', 'mens-shoes', 'mens-watches', 'sunglasses'],
  },
  { key: 'beauty', label: 'Beauty', icon: 'face-woman-shimmer-outline', slugs: ['beauty', 'skin-care', 'fragrances'] },
  { key: 'home', label: 'Home & Grocery', icon: 'sofa-outline', slugs: ['furniture', 'home-decoration', 'kitchen-accessories', 'groceries'] },
  { key: 'tech', label: 'Tech', icon: 'laptop', slugs: ['laptops', 'smartphones', 'tablets', 'mobile-accessories'] },
  { key: 'sports', label: 'Sports & Auto', icon: 'motorbike', slugs: ['sports-accessories', 'motorcycle', 'vehicle'] },
];

const GAP = 10;
const COLS = 4; // phones / laptops; large monitors use 6 (see colsFor)

// Bento sizes (columns x rows), repeated down the page: one big tile, small ones, wide ones
const PAGE_PATTERN: BentoSpec[] = [
  { w: 2, h: 2 }, { w: 1, h: 1 }, { w: 1, h: 1 }, { w: 2, h: 1 },
  { w: 1, h: 1 }, { w: 1, h: 1 }, { w: 2, h: 1 }, { w: 2, h: 1 },
  { w: 1, h: 1 }, { w: 1, h: 1 }, { w: 1, h: 1 }, { w: 1, h: 1 },
];

const pretty = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');

export default function CategoriesScreen() {
  const router = useRouter();
  const { totalQuantity } = useCart();
  const { contentWidth, pad, isUltra, breakpoint } = useResponsive();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [groupKey, setGroupKey] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      // One request with only the fields we need gives every count, picture and brand
      const [names, res] = await Promise.all([
        productApi.getCategories(),
        productApi.getProducts({ limit: 200, select: 'category,brand,thumbnail' }),
      ]);
      // Get count (and a picture) for each category
      const stats = new Map<string, { count: number; image: string }>();
      const brandStats = new Map<string, { count: number; image: string }>();
      for (const p of res.products) {
        const c = stats.get(p.category) ?? { count: 0, image: p.thumbnail };
        c.count += 1;
        stats.set(p.category, c);
        if (p.brand) {
          const b = brandStats.get(p.brand) ?? { count: 0, image: p.thumbnail };
          b.count += 1;
          brandStats.set(p.brand, b);
        }
      }
      setCategories(names.map((name) => ({ name, count: stats.get(name)?.count ?? 0, image: stats.get(name)?.image ?? '' })));
      setBrands(
        Array.from(brandStats.entries())
          .map(([name, v]) => ({ name, count: v.count, image: v.image }))
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
          .slice(0, 14)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Done: pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const group = GROUPS.find((g) => g.key === groupKey) ?? GROUPS[0];

  const view = useMemo(() => {
    const inGroup = categories.filter((c) => !group.slugs || group.slugs.includes(c.name));
    const byCount = [...inGroup].sort((a, b) => b.count - a.count);
    return {
      inGroup,
      subChips: byCount.slice(0, 10),
      top: byCount[0] ?? null,
      products: inGroup.reduce((sum, c) => sum + c.count, 0),
    };
  }, [categories, group]);

  // Fixed route: it was /app/(tabs)/search, the group is (app)
  const openCategory = (slug: string) => router.push(`/(app)/(tabs)/search?category=${encodeURIComponent(slug)}`);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={palette.forest} />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={() => load()}>
          <Text style={styles.retry}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  // Bento layout: sizes follow PAGE_PATTERN and are packed into 4 columns
  const bentoWidth = contentWidth - pad * 2;
  const cols = breakpoint === 'phone' ? 2 : isUltra ? 6 : COLS;
  const colWidth = (bentoWidth - GAP * (cols - 1)) / cols;
  const allProducts = categories.reduce((sum, c) => sum + c.count, 0);
  // Side-by-side banner only when the copy and the carousel both have room
  const bannerRow = contentWidth >= 900;

  return (
    <Screen>
      <ScrollView
        style={[styles.container, { backgroundColor: 'transparent' }]}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: pad }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.forest]} tintColor={palette.forest} />}
      >
        <View style={styles.bgDecor} pointerEvents="none">
          <View style={styles.bgTopBand} />
          <View style={styles.bgSoftArc} />
          <View style={styles.bgAccentStrip} />
        </View>
        <View>
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Categories</Text>
            <View style={styles.headerButtons}>
              <Pressable style={styles.roundButton} onPress={() => router.push('/(app)/(tabs)/search')} accessibilityLabel="Search">
                <MaterialCommunityIcons name="magnify" size={22} color={palette.ink} />
              </Pressable>
              <Pressable style={styles.roundButton} onPress={() => router.push('/(app)/(tabs)/cart')} accessibilityLabel="Open cart">
                <MaterialCommunityIcons name="cart-outline" size={22} color={palette.ink} />
                {totalQuantity > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{totalQuantity}</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>

          {/* Sub-categories navigation: parent groups */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupRow}>
            {GROUPS.map((g) => {
              const active = g.key === groupKey;
              return (
                <Pressable
                  key={g.key}
                  style={[styles.group, active && styles.groupActive]}
                  onPress={() => setGroupKey(g.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <MaterialCommunityIcons name={g.icon} size={18} color={active ? palette.surface : palette.forest} />
                  <Text style={[styles.groupText, active && styles.groupTextActive]}>{g.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Featured collection: a dark hero with a layered, abstract background */}
          <View style={[styles.banner, bannerRow && styles.bannerWide]}>
            {/* Background art (sits behind the copy) */}
            <View style={styles.bannerCircle} />
            <View style={styles.bannerGlow} />
            <View style={styles.bannerRingGold} />
            <View style={styles.bannerRingLight} />
            <View style={styles.bannerTile} />
            <View style={styles.bannerDot} />
            <MaterialCommunityIcons name="star-four-points" size={30} color={palette.gold} style={styles.bannerSparkA} />
            <MaterialCommunityIcons name="star-four-points" size={16} color="rgba(251,247,255,0.72)" style={styles.bannerSparkB} />
            <MaterialCommunityIcons name="star-four-points" size={12} color="rgba(251,247,255,0.5)" style={styles.bannerSparkC} />

            <View style={[styles.bannerText, bannerRow && styles.bannerTextWide]}>
              <Text style={styles.bannerEyebrow}>Featured collection</Text>
              <Text style={styles.bannerTitle}>{group.key === 'all' ? 'All Categories' : group.label}</Text>
              <Text style={styles.bannerSub}>{view.inGroup.length} sub-categories · {view.products} products</Text>
              {view.top ? (
                <Pressable style={styles.bannerButton} onPress={() => openCategory(view.top!.name)} accessibilityRole="button">
                  <Text style={styles.bannerButtonText} numberOfLines={1}>Shop {pretty(view.top.name)}</Text>
                  <MaterialCommunityIcons name="arrow-right" size={16} color="#3A1E70" />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Category collage: a tilted, snap-scrolling rail of the top sub-categories */}
          <CategoryCollage
            key={groupKey}
            items={view.subChips}
            width={bentoWidth}
            subtitle={`${view.inGroup.length} sub-categories · ${view.products} pieces to explore`}
            onOpen={openCategory}
            onSeeAll={() => router.push('/(app)/(tabs)/search')}
          />

          <Text style={styles.sectionTitle}>All {group.key === 'all' ? 'categories' : group.label.toLowerCase()}</Text>
        </View>

        {view.inGroup.length === 0 ? (
          <Text style={styles.emptyText}>No categories in this group.</Text>
        ) : (
          <CategoryBento
            key={groupKey}
            items={view.inGroup}
            specs={view.inGroup.map((_, i) => PAGE_PATTERN[i % PAGE_PATTERN.length])}
            columns={cols}
            width={bentoWidth}
            unit={Math.round(colWidth * 1.08)}
            gap={GAP}
            onOpen={openCategory}
            footer={{
              title: 'All categories',
              subtitle: `${categories.length} categories · ${allProducts} products`,
              span: { w: 2, h: 1, tone: 'mint' },
              onPress: () => (groupKey === 'all' ? router.push('/(app)/(tabs)/search') : setGroupKey('all')),
            }}
          />
        )}

        {/* Student Guide */}
        <View>
          {/* Featured Brands */}
          {brands.length > 0 && (
            <View style={styles.brandsSection}>
              <Text style={styles.sectionTitle}>Featured Brands</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandRow}>
                {brands.map((b) => (
                  <Pressable
                    key={b.name}
                    style={styles.brandCard}
                    onPress={() => router.push(`/(app)/(tabs)/search?brand=${encodeURIComponent(b.name)}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`${b.name}, ${b.count} products`}
                  >
                    <View style={styles.brandCircle}>
                      {b.image ? <Image source={{ uri: b.image }} style={styles.brandImage} resizeMode="contain" /> : null}
                    </View>
                    <Text style={styles.brandName} numberOfLines={1}>{b.name}</Text>
                    <Text style={styles.brandCount}>{b.count} products</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

        </View>
      </ScrollView>
    </Screen>
  );
}