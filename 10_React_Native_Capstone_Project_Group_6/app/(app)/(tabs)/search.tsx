/**
 * Search Screen - query (debounced), category chips, brand / price filters, sorting, paged results.
 * DummyJSON can search and filter by category; brand, price range and sort run on the client.
 */
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Badge,
  Button,
  Chip,
  IconButton,
  Modal,
  Portal,
  Searchbar,
  Text,
  TextInput,
} from 'react-native-paper';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { GRID_PADDING, ProductGrid, useGridLayout } from '@/components/ProductGrid';
import { ProductCardSkeleton } from '@/components/ProductCard';
import { Screen } from '@/components/Screen';
import { spacing, useAppTheme } from '@/constants/theme';
import { useDebounce } from '@/hooks/useDebounce';
import { productApi } from '@/services/productApi';
import { CategoryInfo, ProductFilters, ProductSummary, SortOption } from '@/types/product';
import { getErrorMessage } from '@/utils/errors';
import { formatCategoryName } from '@/utils/format';
import { applyFilters, countActiveFilters, DEFAULT_FILTERS, extractBrands, SORT_LABELS } from '@/utils/productFilters';

const PAGE_SIZE = 20;
const SORT_OPTIONS = Object.keys(SORT_LABELS) as SortOption[];

type Status = 'loading' | 'ready' | 'error';

interface CatalogResponse {
  key: string;
  products: ProductSummary[];
  error: string | null;
}

const EMPTY_PRODUCTS: ProductSummary[] = [];

const parsePrice = (text: string): number | undefined => {
  const value = Number.parseFloat(text);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
};

export default function SearchScreen() {
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ category?: string; q?: string; t?: string }>();
  const { columns, cardWidth } = useGridLayout();

  const [query, setQuery] = useState(params.q ?? '');
  const debouncedQuery = useDebounce(query, 400);
  const [category, setCategory] = useState<string | null>(params.category ?? null);
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS);
  const [reloadKey, setReloadKey] = useState(0);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);

  const [filterOpen, setFilterOpen] = useState(false);
  const [draft, setDraft] = useState<ProductFilters>(DEFAULT_FILTERS);
  const [minText, setMinText] = useState('');
  const [maxText, setMaxText] = useState('');

  // Follow navigation from Categories / Home chips. `t` changes on every navigation, so choosing
  // the same category twice still applies. State is adjusted during render, not in an effect.
  const paramKey = `${params.category ?? ''}|${params.q ?? ''}|${params.t ?? ''}`;
  const [syncedParamKey, setSyncedParamKey] = useState(paramKey);
  if (syncedParamKey !== paramKey) {
    setSyncedParamKey(paramKey);
    if (params.category !== undefined) setCategory(params.category);
    if (params.q !== undefined) setQuery(params.q);
  }

  // The catalog result is tagged with the request that produced it; anything else means "loading".
  const trimmedQuery = debouncedQuery.trim();
  const requestKey = `${trimmedQuery}|${category ?? ''}|${reloadKey}`;
  const [response, setResponse] = useState<CatalogResponse | null>(null);

  useEffect(() => {
    productApi
      .getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    productApi
      .getCatalog({ q: trimmedQuery || undefined, category: category ?? undefined })
      .then((products) => {
        if (!cancelled) setResponse({ key: requestKey, products, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResponse({ key: requestKey, products: [], error: getErrorMessage(err, 'Could not load products.') });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [trimmedQuery, category, requestKey]);

  const current = response?.key === requestKey ? response : null;
  const status: Status = current === null ? 'loading' : current.error ? 'error' : 'ready';
  const error = current?.error ?? null;
  const source = current?.products ?? EMPTY_PRODUCTS;

  // Paging resets whenever the query, category or filters change.
  const filterKey = `${requestKey}|${JSON.stringify(filters)}`;
  const [paging, setPaging] = useState({ key: filterKey, count: PAGE_SIZE });
  const visibleCount = paging.key === filterKey ? paging.count : PAGE_SIZE;

  const results = useMemo(() => applyFilters(source, filters), [source, filters]);
  const brands = useMemo(() => extractBrands(source), [source]);
  const visible = useMemo(() => results.slice(0, visibleCount), [results, visibleCount]);
  const hasMore = visible.length < results.length;
  const activeFilters = countActiveFilters(filters);

  const loadMore = () => setPaging({ key: filterKey, count: visibleCount + PAGE_SIZE });

  const openFilters = () => {
    setDraft(filters);
    setMinText(filters.minPrice !== undefined ? String(filters.minPrice) : '');
    setMaxText(filters.maxPrice !== undefined ? String(filters.maxPrice) : '');
    setFilterOpen(true);
  };

  const applyDraft = () => {
    const min = parsePrice(minText);
    const max = parsePrice(maxText);
    // A reversed range (e.g. 500 to 100) would match nothing, so put the bounds in order.
    const reversed = min !== undefined && max !== undefined && min > max;
    setFilters({ ...draft, minPrice: reversed ? max : min, maxPrice: reversed ? min : max });
    setFilterOpen(false);
  };

  const resetDraft = () => {
    setDraft(DEFAULT_FILTERS);
    setMinText('');
    setMaxText('');
  };

  const toggleBrand = (brand: string) =>
    setDraft((prev) => ({
      ...prev,
      brands: prev.brands.includes(brand) ? prev.brands.filter((b) => b !== brand) : [...prev.brands, brand],
    }));

  // Search row, chips and count stay mounted across loading / error / ready,
  // so the Searchbar keeps focus (and the keyboard) while results reload.
  const controls = (
    <View>
      <View style={styles.searchRow}>
        <Searchbar
          placeholder="Search products"
          value={query}
          onChangeText={setQuery}
          style={styles.searchbar}
          returnKeyType="search"
        />
        <View>
          <IconButton
            icon="tune-variant"
            mode="contained-tonal"
            onPress={openFilters}
            accessibilityLabel="Filters and sorting"
          />
          {activeFilters > 0 ? <Badge style={styles.badge}>{activeFilters}</Badge> : null}
        </View>
      </View>

      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item.slug}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        renderItem={({ item }) => (
          <Chip
            selected={category === item.slug}
            showSelectedOverlay
            onPress={() => setCategory(category === item.slug ? null : item.slug)}
          >
            {item.name}
          </Chip>
        )}
      />

      <Text variant="bodyMedium" style={[styles.count, { color: theme.colors.onSurfaceVariant }]}>
        {status === 'ready'
          ? `${results.length} ${results.length === 1 ? 'result' : 'results'}${
              category ? ` in ${formatCategoryName(category)}` : ''
            }`
          : ' '}
      </Text>
    </View>
  );

  let body: React.ReactElement;
  if (status === 'loading') {
    body = (
      <View style={styles.skeletonGrid}>
        {Array.from({ length: columns * 2 }, (_, index) => (
          <ProductCardSkeleton key={index} width={cardWidth} />
        ))}
      </View>
    );
  } else if (status === 'error') {
    body = <ErrorState message={error ?? 'Could not load products.'} onRetry={() => setReloadKey((key) => key + 1)} />;
  } else {
    body = (
      <ProductGrid
        data={visible}
        footer={hasMore ? <ActivityIndicator style={styles.footer} /> : null}
        empty={
          <EmptyState
            icon="magnify-close"
            title="No products found"
            message={
              activeFilters > 0
                ? 'Try removing a filter or searching for something else.'
                : 'Try a different search term or category.'
            }
            actionLabel={activeFilters > 0 ? 'Clear filters' : undefined}
            onAction={activeFilters > 0 ? () => setFilters(DEFAULT_FILTERS) : undefined}
          />
        }
        onEndReached={hasMore ? loadMore : undefined}
      />
    );
  }

  return (
    <Screen>
      {controls}
      <View style={styles.flex}>{body}</View>

      <Portal>
        <Modal
          visible={filterOpen}
          onDismiss={() => setFilterOpen(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <ScrollView style={styles.filterOptions} keyboardShouldPersistTaps="handled">
            <Text variant="titleMedium" style={styles.modalTitle}>
              Sort by
            </Text>
            <View style={styles.wrap}>
              {SORT_OPTIONS.map((option) => (
                <Chip
                  key={option}
                  selected={draft.sort === option}
                  showSelectedOverlay
                  onPress={() => setDraft((prev) => ({ ...prev, sort: option }))}
                >
                  {SORT_LABELS[option]}
                </Chip>
              ))}
            </View>

            <Text variant="titleMedium" style={styles.modalTitle}>
              Price range (USD)
            </Text>
            <View style={styles.priceRow}>
              <TextInput
                mode="outlined"
                label="Min"
                value={minText}
                onChangeText={setMinText}
                keyboardType="decimal-pad"
                style={styles.priceInput}
                dense
              />
              <TextInput
                mode="outlined"
                label="Max"
                value={maxText}
                onChangeText={setMaxText}
                keyboardType="decimal-pad"
                style={styles.priceInput}
                dense
              />
            </View>

            {brands.length > 0 ? (
              <>
                <Text variant="titleMedium" style={styles.modalTitle}>
                  Brand
                </Text>
                <View style={styles.wrap}>
                  {brands.map((brand) => (
                    <Chip
                      key={brand}
                      selected={draft.brands.includes(brand)}
                      showSelectedOverlay
                      onPress={() => toggleBrand(brand)}
                    >
                      {brand}
                    </Chip>
                  ))}
                </View>
              </>
            ) : null}
          </ScrollView>
          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={resetDraft} style={styles.flex}>
              Reset
            </Button>
            <Button mode="contained" onPress={applyDraft} style={styles.flex}>
              Show results
            </Button>
          </View>
        </Modal>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GRID_PADDING,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  searchbar: { flex: 1 },
  badge: { position: 'absolute', top: 4, right: 4 },
  chipRow: { paddingHorizontal: GRID_PADDING, paddingVertical: spacing.md, gap: spacing.sm },
  count: { paddingHorizontal: GRID_PADDING, marginBottom: spacing.md },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingHorizontal: GRID_PADDING },
  footer: { padding: spacing.lg },
  modal: {
    width: '92%',
    maxWidth: 560,
    margin: 0,
    padding: spacing.lg,
    borderRadius: 16,
    maxHeight: '85%',
    flexShrink: 1,
    alignSelf: 'center',
  },
  filterOptions: { flexShrink: 1 },
  modalTitle: { marginTop: spacing.md, marginBottom: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  priceRow: { flexDirection: 'row', gap: spacing.md },
  priceInput: { flex: 1 },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, flexShrink: 0 },
});