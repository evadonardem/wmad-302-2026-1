/**
 * Search Screen - Marketplace
 * - Debounced query search (GET /products/search?q=) with search history
 * - Category filter (GET /products/category/{slug}), brand and price-range filters
 * - Sort by relevance, price, rating, discount or name (sortBy/order query params)
 * - Infinite scroll pagination (limit/skip) in a responsive grid
 *
 * Accepts `category`, `sort`, `q`, `minPrice` and `maxPrice` route params
 * (e.g. from Categories, Home or the "Gifts under $25" holiday banner).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Modal, Portal, Searchbar, Snackbar, Switch, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { productApi } from '@/services/productApi';
import { useCart } from '@/context/CartContext';
import { useActivity } from '@/context/ActivityContext';
import { useSettings } from '@/context/SettingsContext';
import { useDebounce, useGridColumns, useInfiniteScroll, useThemedStyles, PageResult } from '@/hooks';
import {
  CategoryChip,
  EmptyState,
  ErrorState,
  ProductCard,
  ProductGridSkeleton,
} from '@/components/CommonComponents';
import { LivelyBackground } from '@/components/LivelyBackground';
import { SeasonSpinner } from '@/components/SeasonSpinner';
import { getDiscountedPrice, getDisplayCurrency, PHP_PER_USD } from '@/utils/format';
import type { Product, ProductCategory, ProductSearchParams } from '@/types/product';
import { makeCommon } from '@/styles/common';
import { makeSearchStyles } from '@/styles/search';

const PAGE_SIZE = 20;

const SORT_OPTIONS = {
  relevance: { label: 'Relevance', params: {} },
  'price-asc': { label: 'Price ↑', params: { sortBy: 'price', order: 'asc' } },
  'price-desc': { label: 'Price ↓', params: { sortBy: 'price', order: 'desc' } },
  rating: { label: 'Top Rated', params: { sortBy: 'rating', order: 'desc' } },
  discount: { label: 'Biggest Discount', params: { sortBy: 'discountPercentage', order: 'desc' } },
  name: { label: 'Name A–Z', params: { sortBy: 'title', order: 'asc' } },
} satisfies Record<string, { label: string; params: Pick<ProductSearchParams, 'sortBy' | 'order'> }>;

type SortKey = keyof typeof SORT_OPTIONS;

function isSortKey(value: string | undefined): value is SortKey {
  return !!value && value in SORT_OPTIONS;
}

const RATING_OPTIONS = [0, 3, 4, 4.5] as const;

function parsePrice(value: string): number | null {
  const n = Number(value);
  return value.trim() && Number.isFinite(n) && n >= 0 ? n : null;
}

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    category?: string;
    sort?: string;
    q?: string;
    minPrice?: string;
    maxPrice?: string;
  }>();
  const { addItem } = useCart();
  const { searchHistory, addSearch, clearSearchHistory } = useActivity();
  const { palette, t } = useSettings();
  const insets = useSafeAreaInsets();
  const common = useThemedStyles(makeCommon);
  const styles = useThemedStyles(makeSearchStyles);
  const { columns, itemWidth } = useGridColumns();

  const [query, setQuery] = useState(params.q ?? '');
  const [category, setCategory] = useState<string | null>(params.category ?? null);
  const [sortKey, setSortKey] = useState<SortKey>(isSortKey(params.sort) ? params.sort : 'relevance');
  const [brand, setBrand] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState(params.minPrice ?? '');
  const [maxPrice, setMaxPrice] = useState(params.maxPrice ?? '');
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState<(typeof RATING_OPTIONS)[number]>(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query.trim(), 400);

  // Follow navigation params (e.g. tapping another category while this tab is mounted)
  useEffect(() => {
    if (params.category !== undefined) setCategory(params.category || null);
  }, [params.category]);
  useEffect(() => {
    if (isSortKey(params.sort)) setSortKey(params.sort);
  }, [params.sort]);
  useEffect(() => {
    if (params.q !== undefined) setQuery(params.q);
  }, [params.q]);
  useEffect(() => {
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      // Links such as "Gifts under $25" carry USD amounts
      const fromUsd = (value?: string) =>
        value && getDisplayCurrency() === 'PHP' ? String(Math.round(Number(value) * PHP_PER_USD)) : (value ?? '');
      setMinPrice(fromUsd(params.minPrice));
      setMaxPrice(fromUsd(params.maxPrice));
    }
  }, [params.minPrice, params.maxPrice]);

  useEffect(() => {
    productApi.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  // A brand from a previous result set may not exist in the new one
  useEffect(() => {
    setBrand(null);
  }, [debouncedQuery, category]);

  const fetchPage = useCallback(
    async (page: number, limit: number): Promise<PageResult<Product>> => {
      const request: ProductSearchParams = { limit, skip: page * limit, ...SORT_OPTIONS[sortKey].params };
      const res = debouncedQuery
        ? await productApi.searchProducts(debouncedQuery, request)
        : category
          ? await productApi.getProductsByCategory(category, request)
          : await productApi.getProducts(request);

      // The search endpoint cannot be combined with a category, so filter those results here
      const products =
        debouncedQuery && category ? res.products.filter((p) => p.category === category) : res.products;

      return { data: products, hasMore: res.skip + res.products.length < res.total, total: res.total };
    },
    [debouncedQuery, category, sortKey]
  );

  const { data, loading, refreshing, hasMore, error, loadMore, refresh } = useInfiniteScroll(
    fetchPage,
    PAGE_SIZE
  );

  // New query / category / sort -> start again from the first page
  useEffect(() => {
    refresh();
  }, [refresh]);

  const brands = useMemo(
    () => Array.from(new Set(data.map((p) => p.brand).filter((b): b is string => !!b))).sort(),
    [data]
  );

  // Price inputs are in the display currency; products are priced in USD
  const pesos = getDisplayCurrency() === 'PHP';
  const currencySymbol = pesos ? '₱' : '$';
  const toUsd = (value: number | null) => (value === null ? null : pesos ? value / PHP_PER_USD : value);
  const min = toUsd(parsePrice(minPrice));
  const max = toUsd(parsePrice(maxPrice));
  const priceRangeInvalid = min !== null && max !== null && min > max;

  // Brand, price, rating and stock filters run on the client (DummyJSON has no API for them)
  const results = useMemo(
    () =>
      data.filter((p) => {
        const price = getDiscountedPrice(p.price, p.discountPercentage);
        if (brand && p.brand !== brand) return false;
        if (!priceRangeInvalid && min !== null && price < min) return false;
        if (!priceRangeInvalid && max !== null && price > max) return false;
        if (p.rating < minRating) return false;
        if (inStockOnly && p.stock <= 0) return false;
        return true;
      }),
    [data, brand, min, max, priceRangeInvalid, minRating, inStockOnly]
  );

  const activeFilterCount =
    (brand ? 1 : 0) + (min !== null || max !== null ? 1 : 0) + (minRating > 0 ? 1 : 0) + (inStockOnly ? 1 : 0);

  const clearFilters = () => {
    setBrand(null);
    setMinPrice('');
    setMaxPrice('');
    setMinRating(0);
    setInStockOnly(false);
  };

  const handleAddToCart = (product: Product) => {
    addItem(product);
    setSnackbar(t('common.addedToCart', { title: product.title }));
  };

  const openProduct = (product: Product) => {
    if (debouncedQuery) addSearch(debouncedQuery);
    router.push(`/product/${product.id}`);
  };

  const selectedCategoryName = categories.find((c) => c.slug === category)?.name ?? category;
  const resultsTitle = debouncedQuery
    ? t('search.resultsFor', { query: debouncedQuery })
    : (selectedCategoryName ?? t('search.allProducts'));

  const renderEmpty = () => {
    if (refreshing) return <ProductGridSkeleton count={columns * 2} itemWidth={itemWidth} />;
    if (error) return <ErrorState message={error} onRetry={refresh} />;
    if (data.length > 0 && results.length === 0) {
      return (
        <EmptyState
          icon="filter-remove-outline"
          title={t('search.noMatches')}
          message={t('search.noMatchesMessage')}
          actionLabel={t('search.clearFilters')}
          onAction={clearFilters}
        />
      );
    }
    return (
      <EmptyState
        icon="magnify"
        title={t('search.noProducts')}
        message={t('search.noProductsMessage')}
        actionLabel={query || category ? t('search.reset') : undefined}
        onAction={() => {
          setQuery('');
          setCategory(null);
          router.setParams({ category: '', q: '' });
        }}
      />
    );
  };

  const renderFooter = () => {
    if (loading) {
      return (
        <View style={common.listFooter}>
          <SeasonSpinner />
        </View>
      );
    }
    if (error && data.length > 0) {
      return (
        <TouchableOpacity style={common.listFooter} onPress={loadMore}>
          <Text style={common.footerError}>{error} · Tap to retry</Text>
        </TouchableOpacity>
      );
    }
    if (!hasMore && results.length > 0) {
      return (
        <View style={common.listFooter}>
          <Text style={common.muted}>{t('search.endOfResults')}</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={common.screen} edges={[]}>
      <LivelyBackground />
      {/* Search Bar */}
      <View style={[styles.searchBarContainer, { paddingTop: insets.top + 12 }]}>
        <Searchbar
          placeholder={t('search.placeholder')}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => addSearch(query)}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          loading={refreshing && !!query}
        />
        <TouchableOpacity
          style={[styles.filterButton, showFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters((v) => !v)}
          accessibilityLabel="Toggle filters"
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={22}
            color={showFilters ? palette.onPrimary : palette.primary}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search history (shown while the search box is empty) */}
      {!query && searchHistory.length > 0 && (
        <>
          <View style={styles.historyRow}>
            <Text style={styles.historyTitle}>{t('search.recent')}</Text>
            <Button compact onPress={clearSearchHistory}>
              {t('common.clear')}
            </Button>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            style={styles.chipScroller}
            keyboardShouldPersistTaps="handled"
          >
            {searchHistory.map((term) => (
              <CategoryChip key={term} label={term} icon="history" onPress={() => setQuery(term)} />
            ))}
          </ScrollView>
        </>
      )}

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroller}
      >
        <CategoryChip label={t('search.all')} selected={!category} onPress={() => setCategory(null)} />
        {categories.map((c) => (
          <CategoryChip
            key={c.slug}
            label={c.name}
            selected={category === c.slug}
            onPress={() => setCategory(category === c.slug ? null : c.slug)}
          />
        ))}
      </ScrollView>

      {/* Sort Options */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroller}
      >
        {(Object.keys(SORT_OPTIONS) as SortKey[]).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.sortChip, sortKey === key && styles.sortChipSelected]}
            onPress={() => setSortKey(key)}
            accessibilityRole="button"
            accessibilityState={{ selected: sortKey === key }}
          >
            <Text style={[styles.sortChipText, sortKey === key && styles.sortChipTextSelected]}>
              {SORT_OPTIONS[key].label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filters bottom sheet: price, rating, stock and brand */}
      <Portal>
        <Modal
          visible={showFilters}
          onDismiss={() => setShowFilters(false)}
          style={styles.sheetWrapper}
          contentContainerStyle={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{t('search.filters')}</Text>
          <Text style={styles.filterTitle}>{t('search.priceRange')}</Text>
          <View style={styles.priceRow}>
            <TextInput
              mode="outlined"
              dense
              label={`Min ${currencySymbol}`}
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="decimal-pad"
              style={styles.priceInput}
            />
            <Text style={common.muted}>–</Text>
            <TextInput
              mode="outlined"
              dense
              label={`Max ${currencySymbol}`}
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="decimal-pad"
              style={styles.priceInput}
            />
          </View>
          {priceRangeInvalid && <Text style={common.footerError}>{t('search.priceError')}</Text>}

          <Text style={styles.filterTitle}>{t('search.minRating')}</Text>
          <View style={styles.ratingRow}>
            {RATING_OPTIONS.map((value) => (
              <CategoryChip
                key={value}
                label={value === 0 ? t('search.all') : `⭐ ${value}+`}
                selected={minRating === value}
                onPress={() => setMinRating(value)}
              />
            ))}
          </View>

          <View style={styles.stockRow}>
            <Text style={styles.filterTitle}>{t('search.inStockOnly')}</Text>
            <Switch value={inStockOnly} onValueChange={setInStockOnly} accessibilityLabel={t('search.inStockOnly')} />
          </View>

          <Text style={styles.filterTitle}>{t('search.brand')}</Text>
          {brands.length === 0 ? (
            <Text style={common.muted}>{t('search.noBrands')}</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandRow}>
              {brands.map((b) => (
                <CategoryChip key={b} label={b} selected={brand === b} onPress={() => setBrand(brand === b ? null : b)} />
              ))}
            </ScrollView>
          )}

          <View style={styles.sheetActions}>
            <Button mode="text" onPress={clearFilters} disabled={activeFilterCount === 0}>
              {t('search.clearFilters')}
            </Button>
            <Button mode="contained" onPress={() => setShowFilters(false)}>
              {t('search.showResults', { count: results.length })}
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Results */}
      <FlatList
        key={`grid-${columns}`}
        data={results}
        keyExtractor={(item) => item.id.toString()}
        numColumns={columns}
        columnWrapperStyle={common.gridRow}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            style={{ width: itemWidth }}
            onPress={() => openProduct(item)}
            onAddToCart={() => handleAddToCart(item)}
          />
        )}
        ListHeaderComponent={
          <Text style={styles.resultsTitle}>
            {resultsTitle}
            {results.length > 0 ? ` (${results.length}${hasMore ? '+' : ''})` : ''}
          </Text>
        }
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.resultsList}
      />

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={2500}
        action={{ label: t('common.viewCart'), onPress: () => router.push('/cart') }}
      >
        {snackbar}
      </Snackbar>
    </SafeAreaView>
  );
}
