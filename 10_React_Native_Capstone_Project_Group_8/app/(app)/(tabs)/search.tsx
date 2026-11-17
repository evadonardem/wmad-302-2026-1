
/**
 * Search Screen - Marketplace
 *
 * Features:
 * - Search products using DummyJSON
 * - Accept search keywords from the Shop screen
 * - Automatically search when opened with a query parameter
 * - Filter products by category
 * - Sort by price, rating, discount, and newest
 * - Load more products
 * - Dynamic light and dark theme support
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import {
  TextInput as PaperTextInput,
  useTheme,
  MD3Theme,
} from 'react-native-paper';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createSearchStyles } from './searchStyles';

interface Product {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand?: string;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

type SortOption = 'price' | 'rating' | 'discount' | 'newest';

const API_URL = 'https://dummyjson.com/products';
const PAGE_SIZE = 20;

const categories = [
  'smartphones',
  'laptops',
  'fragrances',
  'skincare',
  'groceries',
  'home-decoration',
];

const sortOptions: { label: string; value: SortOption }[] = [
  { label: 'Top Rated', value: 'rating' },
  { label: 'Price', value: 'price' },
  { label: 'Discount', value: 'discount' },
  { label: 'Newest', value: 'newest' },
];

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();

  const theme = useTheme<MD3Theme>();
  const styles = createSearchStyles(theme.colors);

  const routeQuery = typeof params.q === 'string' ? params.q : '';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);

  /**
   * Fetch products from DummyJSON.
   */
  const fetchProducts = useCallback(
    async (
      searchTerm: string,
      category: string | null,
      nextSkip = 0,
      append = false,
    ) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError('');
        setHasSearched(true);
      }

      try {
        let endpoint = API_URL;

        if (category && !searchTerm.trim()) {
          endpoint += `/category/${encodeURIComponent(category)}`;
        } else if (searchTerm.trim()) {
          endpoint += `/search?q=${encodeURIComponent(searchTerm.trim())}`;
        }

        const separator = endpoint.includes('?') ? '&' : '?';

        endpoint += `${separator}limit=${PAGE_SIZE}&skip=${nextSkip}`;

        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error('Unable to load products. Please try again.');
        }

        const data: ProductsResponse = await response.json();

        const filteredProducts =
          category && searchTerm.trim()
            ? data.products.filter(
                (product) => product.category === category,
              )
            : data.products;

        setResults((previous) =>
          append ? [...previous, ...filteredProducts] : filteredProducts,
        );

        setTotal(
          category && searchTerm.trim()
            ? filteredProducts.length
            : data.total,
        );

        setSkip(nextSkip + data.products.length);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Something went wrong while loading products.';

        setError(message);

        if (!append) {
          setResults([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  /**
   * Automatically search when the Shop screen passes a query.
   */
  useEffect(() => {
    const nextQuery = routeQuery.trim();

    if (!nextQuery) {
      return;
    }

    setQuery(nextQuery);
    setSelectedCategory(null);
    setSkip(0);

    void fetchProducts(nextQuery, null, 0, false);
  }, [routeQuery, fetchProducts]);

  /**
   * Perform a manual search.
   */
  const handleSearch = () => {
    if (!query.trim() && !selectedCategory) {
      setResults([]);
      setTotal(0);
      setHasSearched(false);
      setError('');
      return;
    }

    setSkip(0);
    void fetchProducts(query, selectedCategory, 0, false);
  };

  /**
   * Select or deselect a category.
   */
  const handleCategorySelect = (category: string) => {
    const nextCategory =
      selectedCategory === category ? null : category;

    setSelectedCategory(nextCategory);
    setSkip(0);

    if (query.trim() || nextCategory) {
      void fetchProducts(query, nextCategory, 0, false);
    } else {
      setResults([]);
      setTotal(0);
      setHasSearched(false);
      setError('');
    }
  };

  /**
   * Load the next page of products.
   */
  const handleLoadMore = () => {
    if (!loadingMore && !loading && results.length < total) {
      void fetchProducts(query, selectedCategory, skip, true);
    }
  };

  /**
   * Sort the displayed products.
   */
  const sortedResults = useMemo(() => {
    const products = [...results];

    switch (sortBy) {
      case 'price':
        return products.sort((a, b) => a.price - b.price);

      case 'rating':
        return products.sort((a, b) => b.rating - a.rating);

      case 'discount':
        return products.sort(
          (a, b) => b.discountPercentage - a.discountPercentage,
        );

      case 'newest':
        return products.sort((a, b) => b.id - a.id);

      default:
        return products;
    }
  }, [results, sortBy]);

  /**
   * Format category names.
   */
  const formatCategory = (category: string) =>
    category
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  /**
   * Open product details.
   */
  const openProduct = (productId: number) => {
    router.push(`/(app)/product/${productId}`);
  };

  /**
   * Render a product result.
   */
  const renderProduct = (item: Product) => {
    const discountedPrice =
      item.price * (1 - item.discountPercentage / 100);

    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.85}
        style={styles.resultCard}
        onPress={() => openProduct(item.id)}
      >
        <View style={styles.resultImageContainer}>
          <Image
            source={{ uri: item.thumbnail }}
            style={styles.resultImage}
            resizeMode="contain"
          />

          {item.discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>
                -{Math.round(item.discountPercentage)}%
              </Text>
            </View>
          )}
        </View>

        <View style={styles.resultInfo}>
          <Text style={styles.resultCategory} numberOfLines={1}>
            {formatCategory(item.category)}
          </Text>

          <Text style={styles.resultTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {item.brand ? (
            <Text style={styles.resultBrand} numberOfLines={1}>
              {item.brand}
            </Text>
          ) : null}

          <View style={styles.resultPrice}>
            <Text style={styles.currentPrice}>
              ${discountedPrice.toFixed(2)}
            </Text>

            {item.discountPercentage > 0 && (
              <Text style={styles.originalPrice}>
                ${item.price.toFixed(2)}
              </Text>
            )}
          </View>

          <View style={styles.resultBottomRow}>
            <View style={styles.ratingContainer}>
              <MaterialCommunityIcons
                name="star"
                size={15}
                color="#F5B301"
              />

              <Text style={styles.resultDetails}>
                {item.rating.toFixed(1)}
              </Text>
            </View>

            <Text
              style={[
                styles.stockText,
                item.stock > 0 ? styles.inStock : styles.outOfStock,
              ]}
            >
              {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={theme.colors.onSurfaceVariant}
        />
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Screen Heading */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>
            DISCOVER SOMETHING NEW
          </Text>

          <Text style={styles.heading}>
            Search Products
          </Text>

          <Text style={styles.subtitle}>
            Find products you&apos;ll love.
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <MaterialCommunityIcons
            name="shopping-search"
            size={27}
            color={theme.colors.primary}
          />
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBarContainer}>
        <PaperTextInput
          mode="outlined"
          value={query}
          onChangeText={setQuery}
          placeholder="What are you looking for?"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          style={styles.searchInput}
          outlineStyle={styles.searchOutline}
          textColor={theme.colors.onSurface}
          left={
            <PaperTextInput.Icon
              icon="magnify"
              color={theme.colors.onSurfaceVariant}
            />
          }
          right={
            query.length > 0 ? (
              <PaperTextInput.Icon
                icon="close-circle"
                color={theme.colors.onSurfaceVariant}
                onPress={() => {
                  setQuery('');
                  setResults([]);
                  setTotal(0);
                  setHasSearched(false);
                  setError('');
                }}
              />
            ) : null
          }
        />

        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color="#FFFFFF"
              />

              <Text style={styles.searchButtonText}>
                Search
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Category Filters */}
      <View style={styles.filterSection}>
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionTitle}>
            Categories
          </Text>

          {selectedCategory ? (
            <TouchableOpacity
              onPress={() => handleCategorySelect(selectedCategory)}
            >
              <Text style={styles.clearFilterText}>
                Clear filter
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        >
          {categories.map((category) => {
            const selected = selectedCategory === category;

            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterChip,
                  selected && styles.filterChipSelected,
                ]}
                onPress={() => handleCategorySelect(category)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selected && styles.filterChipTextSelected,
                  ]}
                >
                  {formatCategory(category)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Sorting */}
      <View style={styles.sortSection}>
        <Text style={styles.sectionTitle}>
          Sort By
        </Text>

        <View style={styles.sortOptions}>
          {sortOptions.map((option) => {
            const selected = sortBy === option.value;

            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortChip,
                  selected && styles.sortChipSelected,
                ]}
                onPress={() => setSortBy(option.value)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.sortChipText,
                    selected && styles.sortChipTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Results */}
      <View style={styles.resultsSection}>
        <View style={styles.resultsHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {hasSearched ? 'Search Results' : 'Explore Products'}
            </Text>

            <Text style={styles.resultsSubtitle}>
              {hasSearched
                ? `${results.length} of ${total} products`
                : 'Search or choose a category to get started'}
            </Text>
          </View>

          {hasSearched && results.length > 0 ? (
            <MaterialCommunityIcons
              name="view-list"
              size={22}
              color={theme.colors.onSurfaceVariant}
            />
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator
              size="large"
              color={theme.colors.primary}
            />

            <Text style={styles.loadingText}>
              Finding products...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={54}
              color={theme.colors.error}
            />

            <Text style={styles.emptyTitle}>
              Something went wrong
            </Text>

            <Text style={styles.emptySubtext}>
              {error}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleSearch}
            >
              <Text style={styles.retryButtonText}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : sortedResults.length > 0 ? (
          <>
            <View style={styles.resultsList}>
              {sortedResults.map(renderProduct)}
            </View>

            {results.length < total ? (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={handleLoadMore}
                disabled={loadingMore}
                activeOpacity={0.85}
              >
                {loadingMore ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                ) : (
                  <Text style={styles.loadMoreText}>
                    Load More Products
                  </Text>
                )}
              </TouchableOpacity>
            ) : null}
          </>
        ) : hasSearched ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="package-variant"
              size={58}
              color={theme.colors.onSurfaceVariant}
            />

            <Text style={styles.emptyTitle}>
              No products found
            </Text>

            <Text style={styles.emptySubtext}>
              Try another search term or choose a different category.
            </Text>
          </View>
        ) : (
          <View style={styles.initialState}>
            <View style={styles.initialIcon}>
              <MaterialCommunityIcons
                name="magnify"
                size={42}
                color={theme.colors.primary}
              />
            </View>

            <Text style={styles.initialTitle}>
              What are you looking for?
            </Text>

            <Text style={styles.initialSubtitle}>
              Enter a product name above or select a category to discover
              available products.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}
