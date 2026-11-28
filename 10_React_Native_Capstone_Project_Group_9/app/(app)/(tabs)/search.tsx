import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, TextInput as PaperTextInput, Title } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Product, ProductSearchParams } from '@/types/product';
import { productApi } from '@/services/productApi';
import { useCurrencyFormatter } from '@/hooks/useCurrency';
import { styles } from './searchStyles';

const PAGE_SIZE = 20;
type SortOption = 'price' | 'rating' | 'discountPercentage' | 'newest';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'price', label: 'Price' },
  { value: 'rating', label: 'Rating' },
  { value: 'discountPercentage', label: 'Discount' },
  { value: 'newest', label: 'Newest' },
];

export default function SearchScreen() {
  const router = useRouter();
  const formatPrice = useCurrencyFormatter();
  const { category: routeCategory, brand: routeBrand, q: routeQuery } = useLocalSearchParams<{
    category?: string;
    brand?: string;
    q?: string;
  }>();
  const initialCategory = Array.isArray(routeCategory) ? routeCategory[0] : routeCategory;
  const initialBrand = Array.isArray(routeBrand) ? routeBrand[0] : routeBrand;
  const initialQuery = Array.isArray(routeQuery) ? routeQuery[0] : routeQuery;
  const [query, setQuery] = useState(initialQuery ?? '');
  const [categories, setCategories] = useState<string[]>([]);
  const [results, setResults] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [nextSkip, setNextSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedCategory = useRef<string | null>(null);
  const initializedBrand = useRef<string | null>(null);
  const initializedQuery = useRef<string | null>(null);
  const loadingMoreRef = useRef(false);

  const runSearch = useCallback(async (
    options: {
      category?: string | null;
      brand?: string | null;
      query?: string;
      reset?: boolean;
      sortBy?: SortOption;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ) => {
    const category = options.category === undefined ? selectedCategory : options.category;
    const brand = options.brand === undefined ? selectedBrand : options.brand;
    const reset = options.reset !== false;
    const searchTerm = (options.query ?? query).trim();
    const skip = reset ? 0 : nextSkip;
    const isLoadingMore = !reset;
    const activeSortBy = options.sortBy ?? sortBy;
    const activeSortOrder = options.sortOrder ?? sortOrder;
    const combinedTextSearch = Boolean(searchTerm && (category || brand));

    if (isLoadingMore && loadingMoreRef.current) return;
    if (isLoadingMore) loadingMoreRef.current = true;
    if (isLoadingMore) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    const params: ProductSearchParams = {
      limit: PAGE_SIZE,
      skip,
      ...(activeSortBy !== 'newest' ? { sortBy: activeSortBy, order: activeSortOrder } : {}),
    };

    try {
      let response;

      if (combinedTextSearch) {
        response = category
          ? await productApi.getProductsByCategory(category, { limit: 0 })
          : await productApi.getProductsByBrand(brand as string, { limit: 0 });
      } else if (category) {
        response = await productApi.getProductsByCategory(category, params);
      } else if (brand) {
        response = await productApi.getProductsByBrand(brand, params);
      } else if (searchTerm) {
        response = await productApi.searchProducts(searchTerm, params);
      } else {
        response = await productApi.getProducts(params);
      }

      const normalizedSearch = searchTerm.toLowerCase();
      const page = combinedTextSearch
        ? response.products.filter((product) =>
            `${product.title} ${product.description} ${product.brand || ''}`
              .toLowerCase()
              .includes(normalizedSearch)
          )
        : response.products;

      setResults((current) => reset ? page : [...current, ...page]);
      setTotal(combinedTextSearch ? page.length : response.total);
      setNextSkip(combinedTextSearch ? page.length : skip + PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load products. Please try again.');
      if (reset) {
        setResults([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      if (isLoadingMore) loadingMoreRef.current = false;
    }
  }, [nextSkip, query, selectedBrand, selectedCategory, sortBy, sortOrder]);

  useEffect(() => {
    productApi.getCategories().then(setCategories).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Unable to load categories.');
    });
  }, []);

  useEffect(() => {
    if (initialCategory && initializedCategory.current !== initialCategory) {
      initializedCategory.current = initialCategory;
      setSelectedBrand(null);
      setSelectedCategory(initialCategory);
      void runSearch({ category: initialCategory, brand: null });
    }
  }, [initialCategory, runSearch]);

  useEffect(() => {
    if (initialBrand && initializedBrand.current !== initialBrand) {
      initializedBrand.current = initialBrand;
      setSelectedCategory(null);
      setSelectedBrand(initialBrand);
      void runSearch({ category: null, brand: initialBrand });
    }
  }, [initialBrand, runSearch]);

  useEffect(() => {
    if (initialQuery && initializedQuery.current !== initialQuery) {
      initializedQuery.current = initialQuery;
      setQuery(initialQuery);
      void runSearch({ query: initialQuery });
    }
  }, [initialQuery, runSearch]);

  const filteredResults = useMemo(() => {
    const minimum = minPrice.trim() ? Number(minPrice) : null;
    const maximum = maxPrice.trim() ? Number(maxPrice) : null;
    if ((minimum !== null && (!Number.isFinite(minimum) || minimum < 0)) ||
      (maximum !== null && (!Number.isFinite(maximum) || maximum < 0)) ||
      (minimum !== null && maximum !== null && minimum > maximum)) {
      return [];
    }

    const filtered = results.filter((product) => {
      const price = product.price * (1 - product.discountPercentage / 100);
      return (minimum === null || price >= minimum) && (maximum === null || price <= maximum);
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'newest') return sortOrder === 'desc' ? b.id - a.id : a.id - b.id;
      const left = a[sortBy];
      const right = b[sortBy];
      return sortOrder === 'asc' ? left - right : right - left;
    });
  }, [maxPrice, minPrice, results, sortBy, sortOrder]);

  const toggleCategory = (category: string) => {
    const nextCategory = selectedCategory === category ? null : category;
    setSelectedBrand(null);
    setSelectedCategory(nextCategory);
    void runSearch({ category: nextCategory, brand: null });
  };

  const changeSort = (option: SortOption) => {
    const nextOrder = sortBy === option ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'desc';
    setSortBy(option);
    setSortOrder(nextOrder);
    if (hasSearch) void runSearch({ sortBy: option, sortOrder: nextOrder });
  };

  const renderResult = (item: Product) => {
    const discountedPrice = item.price * (1 - item.discountPercentage / 100);
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.resultCard}
        onPress={() => router.push(`/(app)/product/${item.id}`)}
        activeOpacity={0.8}
      >
        <Card style={styles.card} elevation={1}>
          <View style={styles.resultContent}>
            <Image source={{ uri: item.thumbnail }} style={styles.resultImage} resizeMode="contain" />
            <View style={styles.resultInfo}>
              <Text style={styles.resultCategory}>{item.category}</Text>
              <Title style={styles.resultTitle} numberOfLines={2}>{item.title}</Title>
              <View style={styles.resultPrice}>
                <Text style={styles.currentPrice}>{formatPrice(discountedPrice)}</Text>
                {item.discountPercentage > 0 && (
                  <Text style={styles.originalPrice}>{formatPrice(item.price)}</Text>
                )}
              </View>
              <Text style={styles.resultDetails}>
                ⭐ {item.rating.toFixed(1)} · {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const hasSearch = Boolean(query.trim() || selectedCategory || selectedBrand);
  const invalidPriceRange =
    (minPrice.trim() !== '' && (!Number.isFinite(Number(minPrice)) || Number(minPrice) < 0)) ||
    (maxPrice.trim() !== '' && (!Number.isFinite(Number(maxPrice)) || Number(maxPrice) < 0)) ||
    (minPrice.trim() !== '' && maxPrice.trim() !== '' && Number(minPrice) > Number(maxPrice));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={300}
      onScroll={(event) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const nearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 240;
        if (nearBottom && hasSearch && !loading && !loadingMore && nextSkip < total) {
          void runSearch({ reset: false });
        }
      }}
    >
      <View style={styles.searchBarContainer}>
        <PaperTextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => void runSearch()}
          returnKeyType="search"
          activeUnderlineColor="#708066"
          activeOutlineColor="#708066"
          underlineColor="#DED8CB"
          textColor="#332F28"
          placeholderTextColor="#625B50"
          left={<PaperTextInput.Icon icon="magnify" />}
          right={query ? (
            <PaperTextInput.Icon icon="close" onPress={() => {
              setQuery('');
              void runSearch({ query: '', reset: true });
            }} />
          ) : null}
        />
        <Button
          mode="contained"
          onPress={() => void runSearch()}
          loading={loading}
          disabled={loading}
          buttonColor="#708066"
          textColor="#FFFFFF"
        >
          Search
        </Button>
      </View>

      <View style={styles.filterSection}>
        <Title style={styles.filterTitle}>Categories</Title>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
          {categories.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.filterChip, selectedCategory === item && styles.filterChipSelected]}
              onPress={() => toggleCategory(item)}
            >
              <Text style={[styles.filterChipText, selectedCategory === item && styles.filterChipTextSelected]}>
                {item.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterSection}>
        <Title style={styles.filterTitle}>Price range</Title>
        <View style={styles.priceFilters}>
          <PaperTextInput
            label="Min price"
            value={minPrice}
            onChangeText={setMinPrice}
            keyboardType="decimal-pad"
            style={styles.priceInput}
            activeOutlineColor="#708066"
            outlineColor="#DED8CB"
            textColor="#332F28"
          />
          <PaperTextInput
            label="Max price"
            value={maxPrice}
            onChangeText={setMaxPrice}
            keyboardType="decimal-pad"
            style={styles.priceInput}
            activeOutlineColor="#708066"
            outlineColor="#DED8CB"
            textColor="#332F28"
          />
        </View>
        {invalidPriceRange ? (
          <Text style={styles.priceError}>Enter a valid range with the minimum at or below the maximum.</Text>
        ) : null}
      </View>

      <View style={styles.sortSection}>
        <Title style={styles.filterTitle}>Sort by</Title>
        <View style={styles.sortOptions}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.sortChip, sortBy === option.value && styles.sortChipSelected]}
              onPress={() => changeSort(option.value)}
            >
              <Text style={[styles.sortChipText, sortBy === option.value && styles.sortChipTextSelected]}>
                {option.label}{sortBy === option.value ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.resultsSection}>
        <Title style={styles.resultsTitle}>
          Results {searchQueryLabel(query, selectedCategory, selectedBrand)} {hasSearch ? `(${filteredResults.length}${total > filteredResults.length ? ` of ${total}` : ''})` : ''}
        </Title>
        {loading && results.length === 0 ? (
          <View style={styles.loadingCenter}><ActivityIndicator size="large" color="#708066" /></View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{error}</Text>
            <Button mode="outlined" onPress={() => void runSearch()}>Retry</Button>
          </View>
        ) : !hasSearch ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="magnify" size={56} color="#C9C0B1" />
            <Text style={styles.emptyText}>Find your next favorite</Text>
            <Text style={styles.emptySubtext}>Search by name or choose a category</Text>
          </View>
        ) : filteredResults.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="magnify" size={64} color="#C9C0B1" />
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>Try different search terms or filters</Text>
          </View>
        ) : (
          <View>
            <View style={styles.resultsGrid}>
              {filteredResults.map(renderResult)}
            </View>
            {loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#708066" />
                <Text style={styles.emptySubtext}>Loading more products...</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function searchQueryLabel(query: string, category: string | null, brand: string | null): string {
  const parts = [];
  if (query.trim()) parts.push(`for "${query.trim()}"`);
  if (category) parts.push(`in ${category.replace(/-/g, ' ')}`);
  if (brand) parts.push(`from ${brand}`);
  return parts.join(' ');
}
