/**
 * Search Screen - Marketplace
 * Done: Students implement
 * - Search products by query (GET /products/search?q=)
 * - Filter by category, brand, price range
 * - Sort by price, rating, discount, newest
 * - Infinite scroll pagination
 * Redesigned: a discovery view (recent searches, trending, popular categories) shows until
 * the user types, picks a category or taps "See all"; then results + filters appear.
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Image,
  Platform,
  TextInput as RNTextInput,
  TextStyle,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TextInput as PaperTextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productApi } from '@/services/productApi';
import { useDebounce } from '@/hooks';
import { Product, ProductSearchParams } from '@/types/product';
import { useResponsive, palette, MAX_CONTENT_WIDTH } from '@/constants/theme';
import { SpotlightCarousel } from '@/components/SpotlightCarousel';
import { BentoCategory, BentoSpec, CategoryBento } from '@/components/CategoryBento';
import { useSettings } from '@/context/SettingsContext';
import { Screen } from '@/components/ScreenBackground';
import { styles } from '@/styles/search';

const PAGE_SIZE = 12;
const RECENT_KEY = 'recent_searches';
const MAX_RECENT = 6;
const POPULAR_CATEGORIES = ['womens-dresses', 'mens-shirts', 'mens-shoes', 'sunglasses'];

// Popular category bento: two columns, staggered sizes (columns x rows), mint and gold accents
const POPULAR_SPECS: BentoSpec[] = [
  { w: 1, h: 2, tone: 'mint' },
  { w: 1, h: 3 },
  { w: 1, h: 3 },
  { w: 1, h: 2, tone: 'gold' },
];

type SortOption = 'price' | 'rating' | 'discount' | 'newest';

// Maps the sort chips to DummyJSON's sortBy/order (newest is not supported by the API)
const SERVER_SORT: Record<Exclude<SortOption, 'newest'>, Pick<ProductSearchParams, 'sortBy' | 'order'>> = {
  price: { sortBy: 'price', order: 'asc' },
  rating: { sortBy: 'rating', order: 'desc' },
  discount: { sortBy: 'discountPercentage', order: 'desc' },
};

const pretty = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');

// Web only: remove the browser's default focus outline (the box border shows focus instead)
const noOutline = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as unknown as TextStyle;

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; brand?: string }>();
  const { pad, width, breakpoint } = useResponsive();
  // Privacy setting: recent searches are only remembered when this is on
  const { settings } = useSettings();
  const rememberSearches = settings.privacy.saveRecentSearches;
  // Results: 1 column on phones, then as many ~340px columns as fit (the page uses the whole screen)
  const pageWidth = Math.min(width, MAX_CONTENT_WIDTH);
  const numCols = breakpoint === 'phone' ? 1 : Math.min(6, Math.max(2, Math.floor((pageWidth - pad * 2) / 340)));
  const itemWidth = Math.floor((pageWidth - pad * 2 - 8 * (numCols - 1)) / numCols);
  const wideDiscovery = breakpoint !== 'phone' && width >= 900;

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim(), 400);
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [browsing, setBrowsing] = useState(false);
  // Opened from a Featured Brand on the Categories screen: /search?brand=Name
  const [routeBrand, setRouteBrand] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  // Popular categories with a product picture each (tiles show at once, pictures fill in)
  const [popular, setPopular] = useState<BentoCategory[]>(POPULAR_CATEGORIES.map((name) => ({ name, count: 0, image: '' })));

  // Discovery view until the user searches, picks a category or taps "See all"
  const discovery = !query.trim() && !selectedCategory && !browsing && !routeBrand;

  // Ignore responses from older requests (fast typing / filter changes)
  const requestId = useRef(0);
  const skipRef = useRef(0);
  // The whole catalogue, loaded once, for brand browsing (DummyJSON has no brand endpoint)
  const allProductsRef = useRef<Product[] | null>(null);
  // Synchronous lock: onEndReached can fire twice before the loadingMore state updates
  const loadingMoreRef = useRef(false);

  // Load all categories for the filter chips
  useEffect(() => {
    productApi.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  // Trending searches: the top-rated products' names
  useEffect(() => {
    productApi
      .getProducts({ limit: 5, sortBy: 'rating', order: 'desc' })
      .then((res) => setTrending(res.products.map((p) => p.title)))
      .catch(() => setTrending([]));
  }, []);

  // Popular categories: a picture and product count for each
  useEffect(() => {
    Promise.all(
      POPULAR_CATEGORIES.map(async (name): Promise<BentoCategory> => {
        try {
          const res = await productApi.getProductsByCategory(name, { limit: 1 });
          return { name, count: res.total, image: res.products[0]?.thumbnail ?? '' };
        } catch {
          return { name, count: 0, image: '' };
        }
      })
    ).then(setPopular);
  }, []);

  // Recent searches are remembered on the device
  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY)
      .then((raw) => {
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) setRecent(parsed.filter((x): x is string => typeof x === 'string'));
      })
      .catch(() => setRecent([]));
  }, []);

  const persistRecent = (list: string[]) => {
    setRecent(list);
    AsyncStorage.setItem(RECENT_KEY, JSON.stringify(list)).catch(() => undefined);
  };

  const addRecent = (term: string) => {
    const t = term.trim();
    if (t.length < 2 || !rememberSearches) return;
    persistRecent([t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENT));
  };

  // Opened from the Categories screen: /search?category=xyz
  useEffect(() => {
    if (params.category) {
      setSelectedCategory(params.category);
      setRouteBrand(null);
    }
  }, [params.category]);

  // Opened from the Categories screen: /search?brand=xyz
  useEffect(() => {
    if (params.brand) {
      setRouteBrand(params.brand);
      setSelectedCategory(null);
      setBrowsing(false);
    }
  }, [params.brand]);

  const fetchPage = useCallback(
    async (skip: number): Promise<{ products: Product[]; total: number }> => {
      const base: ProductSearchParams = { limit: PAGE_SIZE, skip };
      const serverSort = sortBy === 'newest' ? {} : SERVER_SORT[sortBy];

      if (routeBrand && !debouncedQuery) {
        if (!allProductsRef.current) allProductsRef.current = (await productApi.getProducts({ limit: 200 })).products;
        const list = allProductsRef.current.filter((p) => p.brand === routeBrand);
        return { products: list.slice(skip, skip + PAGE_SIZE), total: list.length };
      }
      if (debouncedQuery) {
        // Search endpoint; the category filter is applied locally on the results
        return productApi.searchProducts(debouncedQuery, { ...base, ...serverSort });
      }
      if (selectedCategory) {
        return productApi.getProductsByCategory(selectedCategory, { ...base, ...serverSort });
      }
      return productApi.getProducts({ ...base, ...serverSort });
    },
    [debouncedQuery, selectedCategory, sortBy, routeBrand]
  );

  // Reload from the first page whenever the query, category or sort changes
  useEffect(() => {
    if (discovery) {
      requestId.current += 1;
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    skipRef.current = 0;
    loadingMoreRef.current = false;

    fetchPage(0)
      .then((res) => {
        if (id !== requestId.current) return;
        setResults(res.products);
        skipRef.current = res.products.length;
        setHasMore(res.products.length < res.total);
      })
      .catch((err) => {
        if (id !== requestId.current) return;
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [fetchPage, discovery]);

  // Infinite scroll: next page with skip/limit
  const loadMore = async () => {
    if (discovery || loading || loadingMoreRef.current || !hasMore) return;
    const id = requestId.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const res = await fetchPage(skipRef.current);
      if (id !== requestId.current) return;
      // Never add a product twice (duplicate ids caused the same-key warning)
      setResults((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...res.products.filter((p) => !seen.has(p.id))];
      });
      skipRef.current += res.products.length;
      setHasMore(res.products.length > 0 && skipRef.current < res.total);
    } catch {
      // Keep what we have; the user can scroll again to retry
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  };

  // Brands come from the products loaded so far
  const brands = useMemo(
    () => Array.from(new Set(results.map((p) => p.brand).filter((b): b is string => !!b))).sort(),
    [results]
  );

  // Local filters: category (when searching by text), brand and price range
  const visible = useMemo(() => {
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    const list = results.filter((p) => {
      if (debouncedQuery && selectedCategory && p.category !== selectedCategory) return false;
      if (selectedBrand && p.brand !== selectedBrand) return false;
      const price = p.price * (1 - p.discountPercentage / 100);
      if (!isNaN(min) && price < min) return false;
      if (!isNaN(max) && price > max) return false;
      return true;
    });
    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.meta.createdAt).getTime() - new Date(a.meta.createdAt).getTime());
    }
    return list;
  }, [results, debouncedQuery, selectedCategory, selectedBrand, minPrice, maxPrice, sortBy]);

  // With 2+ results the spotlight carousel is the results view (no separate result rows below it)
  const showSpotlight = !discovery && !loading && visible.length >= 2;

  const runSearch = (term: string) => {
    setQuery(term);
    setBrowsing(false);
    addRecent(term);
  };

  const openProduct = (id: number) => {
    addRecent(debouncedQuery);
    router.push(`/(app)/(tabs)/product/${id}`);
  };

  const resetAll = () => {
    setQuery('');
    setSelectedCategory(null);
    setRouteBrand(null);
    setSelectedBrand(null);
    setMinPrice('');
    setMaxPrice('');
    setBrowsing(false);
    setShowFilters(false);
  };

  const renderResult = ({ item }: { item: Product }) => {
    const discountedPrice = item.price * (1 - item.discountPercentage / 100);
    return (
      <Pressable style={[styles.resultCard, numCols > 1 && { width: itemWidth }]} onPress={() => openProduct(item.id)} accessibilityRole="button" accessibilityLabel={item.title}>
        <Image source={{ uri: item.thumbnail }} style={styles.resultImage} resizeMode="contain" />
        <View style={styles.resultInfo}>
          <Text style={styles.resultCategory}>{pretty(item.category)}</Text>
          <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.resultPrice}>
            <Text style={styles.currentPrice}>${discountedPrice.toFixed(2)}</Text>
            {item.discountPercentage > 0 && (
              <Text style={styles.originalPrice}>${item.price.toFixed(2)}</Text>
            )}
          </View>
          <Text style={styles.resultDetails}>
            ★ {item.rating} · {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderChip = (label: string, selected: boolean, onPress: () => void) => (
    <Pressable style={[styles.filterChip, selected && styles.filterChipSelected]} onPress={onPress}>
      <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{label}</Text>
    </Pressable>
  );

  const sectionHeading = (icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'], title: string, linkLabel?: string, onLink?: () => void) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <MaterialCommunityIcons name={icon} size={20} color={palette.sage} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {linkLabel && onLink ? (
        <Pressable onPress={onLink}>
          <Text style={styles.sectionLink}>{linkLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  // Discovery: recent searches, trending searches, popular categories
  const discoveryView = (
    <View style={wideDiscovery ? styles.discoveryRow : undefined}>
      <View style={wideDiscovery ? styles.discoveryLeft : undefined}>
      {rememberSearches && recent.length > 0 && (
        <View style={styles.section}>
          {sectionHeading('clock-outline', 'Recent Search', 'Clear All', () => persistRecent([]))}
          <View style={styles.recentWrap}>
            {recent.map((term) => (
              <Pressable key={term} style={styles.recentChip} onPress={() => runSearch(term)}>
                <Text style={styles.recentText}>{term}</Text>
                <Pressable onPress={() => persistRecent(recent.filter((r) => r !== term))} accessibilityLabel={`Remove ${term}`}>
                  <MaterialCommunityIcons name="close" size={14} color={palette.stone} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {trending.length > 0 && (
        <View style={styles.section}>
          {sectionHeading('trending-up', 'Trending Searches', 'See all', () => setBrowsing(true))}
          {trending.map((term, i) => (
            <Pressable key={term} style={styles.trendRow} onPress={() => runSearch(term)}>
              <View style={styles.trendBadge}>
                <Text style={styles.trendBadgeText}>{i + 1}</Text>
              </View>
              <Text style={styles.trendText} numberOfLines={1}>{term}</Text>
              <MaterialCommunityIcons name="trending-up" size={18} color={palette.star} />
            </Pressable>
          ))}
        </View>
      )}

      </View>
      <View style={wideDiscovery ? styles.discoveryRight : undefined}>
      <View style={styles.section}>
        {sectionHeading('trending-up', 'Popular Category', 'See all', () => router.push('/(app)/(tabs)/categories'))}
        <CategoryBento
          items={popular}
          specs={POPULAR_SPECS}
          columns={2}
          width={Math.min(pageWidth - pad * 2, 520)}
          unit={Math.round((Math.min(pageWidth - pad * 2, 520) - 10) / 2 * 0.3)}
          showCount={false}
          serifNames
          onOpen={(name) => setSelectedCategory(name)}
        />
      </View>
      </View>
    </View>
  );

  // Results: active filters, filter panel and the result count
  const resultsHeader = (
    <View>
      <View style={styles.activeRow}>
        {browsing && (
          <Pressable style={styles.activeChip} onPress={() => setBrowsing(false)}>
            <Text style={styles.activeChipText}>All products</Text>
            <MaterialCommunityIcons name="close" size={14} color={palette.surface} />
          </Pressable>
        )}
        {routeBrand && (
          <Pressable style={styles.activeChip} onPress={() => setRouteBrand(null)}>
            <Text style={styles.activeChipText}>Brand: {routeBrand}</Text>
            <MaterialCommunityIcons name="close" size={14} color={palette.surface} />
          </Pressable>
        )}
        {selectedCategory && (
          <Pressable style={styles.activeChip} onPress={() => setSelectedCategory(null)}>
            <Text style={styles.activeChipText}>{pretty(selectedCategory)}</Text>
            <MaterialCommunityIcons name="close" size={14} color={palette.surface} />
          </Pressable>
        )}
        {selectedBrand && (
          <Pressable style={styles.activeChip} onPress={() => setSelectedBrand(null)}>
            <Text style={styles.activeChipText}>{selectedBrand}</Text>
            <MaterialCommunityIcons name="close" size={14} color={palette.surface} />
          </Pressable>
        )}
      </View>

      {showFilters && (
        <View style={styles.filterPanel}>
          {/* Category Filters */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Categories</Text>
            <FlatList
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
              renderItem={({ item }) =>
                renderChip(pretty(item), selectedCategory === item, () =>
                  setSelectedCategory(selectedCategory === item ? null : item)
                )
              }
              keyExtractor={(item) => item}
            />
          </View>

          {/* Brand Filters */}
          {brands.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Brands</Text>
              <FlatList
                data={brands}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterList}
                renderItem={({ item }) =>
                  renderChip(item, selectedBrand === item, () =>
                    setSelectedBrand(selectedBrand === item ? null : item)
                  )
                }
                keyExtractor={(item) => item}
              />
            </View>
          )}

          {/* Price Range */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Price Range ($)</Text>
            <View style={styles.priceRow}>
              <PaperTextInput
                mode="outlined"
                dense
                label="Min"
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="numeric"
                style={styles.priceInput}
              />
              <Text style={styles.priceDash}>–</Text>
              <PaperTextInput
                mode="outlined"
                dense
                label="Max"
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="numeric"
                style={styles.priceInput}
              />
            </View>
          </View>

          {/* Sort Options */}
          <View style={[styles.filterSection, styles.sortSection]}>
            <Text style={styles.filterTitle}>Sort By</Text>
            <View style={styles.sortOptions}>
              {(['price', 'rating', 'discount', 'newest'] as const).map((option) => (
                <Pressable
                  key={option}
                  style={[styles.sortChip, sortBy === option && styles.sortChipSelected]}
                  onPress={() => setSortBy(option)}
                >
                  <Text style={[styles.sortChipText, sortBy === option && styles.sortChipTextSelected]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Spotlight: pick a product card on the right to feature it in the centre */}
      {showSpotlight && (
        <SpotlightCarousel
          products={visible.slice(0, 8)}
          eyebrow={routeBrand ? routeBrand : selectedCategory ? pretty(selectedCategory) : debouncedQuery ? `Results for "${debouncedQuery}"` : 'Spotlight'}
          onOpenProduct={openProduct}
        />
      )}

      {!showSpotlight && (
        <Text style={styles.resultsTitle}>
          Results {debouncedQuery ? `for "${debouncedQuery}"` : ''} {visible.length > 0 && `(${visible.length})`}
        </Text>
      )}
    </View>
  );

  // One FlatList for everything (a FlatList inside a ScrollView can't paginate)
  const header = (
    <View>
      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBox, focused && styles.searchBoxFocused]}>
          <MaterialCommunityIcons name="magnify" size={22} color={focused ? palette.sage : palette.stone} />
          <RNTextInput
            style={[styles.searchInput, noOutline]}
            placeholder="Search Product, Brands..."
            placeholderTextColor={palette.mist}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            returnKeyType="search"
            onSubmitEditing={() => addRecent(query)}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search">
              <MaterialCommunityIcons name="close" size={20} color={palette.stone} />
            </Pressable>
          ) : null}
        </View>
        {!discovery && (
          <Pressable
            style={[styles.filterButton, !showFilters && styles.filterButtonOff]}
            onPress={() => setShowFilters((v) => !v)}
            accessibilityLabel="Toggle filters"
          >
            <MaterialCommunityIcons name="tune-variant" size={22} color={showFilters ? palette.surface : palette.ink} />
          </Pressable>
        )}
      </View>
      {discovery ? discoveryView : resultsHeader}
    </View>
  );

  return (
    <Screen>
    <FlatList
      key={numCols}
      numColumns={numCols}
      columnWrapperStyle={numCols > 1 ? styles.resultRow : undefined}
      style={[styles.container, { backgroundColor: 'transparent' }]}
      contentContainerStyle={[styles.content, { paddingHorizontal: pad }]}
      data={discovery || loading || showSpotlight ? [] : visible}
      renderItem={renderResult}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={header}
      keyboardShouldPersistTaps="handled"
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onEndReached={showSpotlight ? undefined : loadMore}
      onEndReachedThreshold={0.4}
      ListEmptyComponent={
        discovery || showSpotlight ? null : loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={palette.sage} />
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="alert-circle-outline" size={64} color={palette.mist} />
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="magnify" size={64} color={palette.mist} />
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>Try a different search term or filter</Text>
            <Pressable onPress={resetAll} style={{ marginTop: 16 }}>
              <Text style={styles.sectionLink}>Clear search</Text>
            </Pressable>
          </View>
        )
      }
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="small" color={palette.sage} />
          </View>
        ) : null
      }
    />
    </Screen>
  );
}