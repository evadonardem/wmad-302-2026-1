/**
 * Search & Product Catalog Screen - Crimson Obsidian Dark Glassmorphism
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { productApi } from '@/services/productApi';
import { useCart } from '@/context/CartContext';
import { Product, CategoryItem } from '@/types/product';
import { Card, Title, TextInput as PaperTextInput, Button, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CrimsonHeader } from '@/components/CrimsonHeader';
import { useDesignMode } from '@/context/DesignModeContext';
import { CrimsonAmbientBackdrop } from '@/components/CrimsonAmbientBackdrop';
import { GLASS_PALETTE, glassSurface } from '@/constants/glassTheme';
import { styles } from './searchStyles';

type SortOption = 'rating' | 'price-asc' | 'price-desc' | 'discount';
type PriceRange = 'all' | 'under-50' | '50-200' | 'over-200';

const PRICE_RANGES: { id: PriceRange; label: string }[] = [
  { id: 'all', label: 'All Prices' },
  { id: 'under-50', label: 'Under ₱50' },
  { id: '50-200', label: '₱50 – ₱200' },
  { id: 'over-200', label: 'Over ₱200' },
];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'rating', label: 'Top Rated' },
  { id: 'price-asc', label: 'Price: Low → High' },
  { id: 'price-desc', label: 'Price: High → Low' },
  { id: 'discount', label: 'Biggest Discount' },
];

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sort?: string; category?: string }>();
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const { width } = useWindowDimensions();
  const { isCrimson } = useDesignMode();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [rawResults, setRawResults] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    params.category || null
  );
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<PriceRange>('all');
  const [sortBy, setSortBy] = useState<SortOption>(
    params.sort === 'discount' ? 'discount' : 'rating'
  );
  const [loading, setLoading] = useState(true);
  const [snackMsg, setSnackMsg] = useState('');

  const numColumns =
    width >= 1200 ? 5 : width >= 920 ? 4 : width >= 660 ? 3 : 2;
  const colWidth = `${100 / numColumns}%` as const;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    productApi
      .getCategories()
      .then((cats) => setCategories(cats))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadProducts = async () => {
      setLoading(true);
      try {
        let fetched: Product[] = [];
        if (debouncedQuery) {
          const res = await productApi.searchProducts(debouncedQuery, 50, 0);
          fetched = res.products;
        } else if (selectedCategory) {
          const res = await productApi.getProductsByCategory(selectedCategory, 50, 0);
          fetched = res.products;
        } else {
          const res = await productApi.getProducts({ limit: 40, skip: 0 });
          fetched = res.products;
        }
        if (!cancelled) {
          setRawResults(fetched);
        }
      } catch {
        if (!cancelled) setRawResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, selectedCategory]);

  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    rawResults.forEach((p) => {
      if (p.brand) brands.add(p.brand);
    });
    return Array.from(brands).slice(0, 12);
  }, [rawResults]);

  const filteredResults = useMemo(() => {
    const filtered = rawResults.filter((item) => {
      if (selectedCategory && item.category !== selectedCategory) return false;
      if (selectedBrand && item.brand !== selectedBrand) return false;

      const finalPrice = item.price * (1 - item.discountPercentage / 100);
      if (priceRange === 'under-50' && finalPrice >= 50) return false;
      if (priceRange === '50-200' && (finalPrice < 50 || finalPrice > 200)) return false;
      if (priceRange === 'over-200' && finalPrice <= 200) return false;

      return true;
    });

    return [...filtered].sort((a, b) => {
      const priceA = a.price * (1 - a.discountPercentage / 100);
      const priceB = b.price * (1 - b.discountPercentage / 100);
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'discount') return b.discountPercentage - a.discountPercentage;
      return b.rating - a.rating;
    });
  }, [rawResults, selectedCategory, selectedBrand, priceRange, sortBy]);

  const resetFilters = () => {
    setQuery('');
    setDebouncedQuery('');
    setSelectedCategory(null);
    setSelectedBrand(null);
    setPriceRange('all');
    setSortBy('rating');
  };

  return (
    <View style={[styles.container, { backgroundColor: isCrimson ? '#09090D' : '#F4F6FA', backgroundImage: isCrimson ? undefined : 'radial-gradient(circle at 18% 15%, rgba(251,191,36,0.22), transparent 45%), radial-gradient(circle at 85% 25%, rgba(56,189,248,0.18), transparent 48%)' } as object]}>
      <CrimsonAmbientBackdrop />
      <CrimsonHeader searchPlaceholder="Search phones, laptops, shoes, beauty..." />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <PaperTextInput
            mode="outlined"
            outlineColor="rgba(225, 29, 72, 0.45)"
            activeOutlineColor="#E11D48"
            textColor="#FFFFFF"
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            placeholder="Search phones, laptops, shoes, beauty..."
            value={query}
            onChangeText={setQuery}
            left={<PaperTextInput.Icon icon="magnify" color="#E11D48" />}
            right={
              query ? (
                <PaperTextInput.Icon icon="close" color="#CBD5E1" onPress={() => setQuery('')} />
              ) : undefined
            }
          />
        </View>

        {/* Dark Glass Filter Panel */}
        <View style={[glassSurface(0.78, 18, true), { padding: 16, marginBottom: 20 }]}>
          <View style={styles.filterSection}>
            <Title style={styles.filterTitle}>Category</Title>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
            >
              {categories.slice(0, 14).map((cat) => {
                const active = selectedCategory === cat.slug;
                return (
                  <TouchableOpacity
                    key={cat.slug}
                    style={[styles.filterChip, active && styles.filterChipSelected]}
                    onPress={() => {
                      setSelectedBrand(null);
                      setSelectedCategory(active ? null : cat.slug);
                    }}
                  >
                    <Text
                      style={[styles.filterChipText, active && styles.filterChipTextSelected]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {availableBrands.length > 0 && (
            <View style={styles.filterSection}>
              <Title style={styles.filterTitle}>Brand</Title>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterList}
              >
                {availableBrands.map((brand) => {
                  const active = selectedBrand === brand;
                  return (
                    <TouchableOpacity
                      key={brand}
                      style={[styles.filterChip, active && styles.filterChipSelected]}
                      onPress={() => setSelectedBrand(active ? null : brand)}
                    >
                      <Text
                        style={[styles.filterChipText, active && styles.filterChipTextSelected]}
                      >
                        {brand}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={{ flexDirection: width >= 820 ? 'row' : 'column', gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Title style={styles.filterTitle}>Price Range</Title>
              <View style={styles.sortOptions}>
                {PRICE_RANGES.map((range) => {
                  const active = priceRange === range.id;
                  return (
                    <TouchableOpacity
                      key={range.id}
                      style={[styles.sortChip, active && styles.sortChipSelected]}
                      onPress={() => setPriceRange(range.id)}
                    >
                      <Text style={[styles.sortChipText, active && styles.sortChipTextSelected]}>
                        {range.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Title style={styles.filterTitle}>Sort By</Title>
              <View style={styles.sortOptions}>
                {SORT_OPTIONS.map((opt) => {
                  const active = sortBy === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.sortChip, active && styles.sortChipSelected]}
                      onPress={() => setSortBy(opt.id)}
                    >
                      <Text style={[styles.sortChipText, active && styles.sortChipTextSelected]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Results Header */}
        <View style={styles.resultsSection}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Title style={[styles.resultsTitle, { marginBottom: 0 }]}>
                {debouncedQuery ? `Results for "${debouncedQuery}"` : 'Catalog'} (
                {filteredResults.length})
              </Title>
              <Text style={{ color: GLASS_PALETTE.crimsonBright, fontWeight: '900', fontSize: 16 }}>
                {'///'}
              </Text>
            </View>
            {(debouncedQuery || selectedCategory || selectedBrand || priceRange !== 'all') && (
              <Button
                mode="outlined"
                textColor="#FF1E42"
                style={{ borderColor: '#E11D48' }}
                compact
                onPress={resetFilters}
              >
                Reset Filters
              </Button>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="large" color="#E11D48" />
            </View>
          ) : filteredResults.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="magnify-close" size={64} color="#64748B" />
              <Text style={styles.emptyText}>No matching products found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filter criteria</Text>
              <Button
                mode="contained"
                buttonColor="#E11D48"
                textColor="#FFFFFF"
                onPress={resetFilters}
                style={{ marginTop: 14 }}
              >
                Clear All Filters
              </Button>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
              {filteredResults.map((item) => {
                const discountedPrice = item.price * (1 - item.discountPercentage / 100);
                const wished = isWishlisted(item.id);
                return (
                  <View key={item.id} style={{ width: colWidth, padding: 6 }}>
                    <TouchableOpacity
                      onPress={() => router.push(`/(app)/(tabs)/product/${item.id}`)}
                      activeOpacity={0.88}
                    >
                      <Card style={styles.card} elevation={0}>
                        <View
                          style={{
                            position: 'relative',
                            height: 150,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 8,
                          }}
                        >
                          <Image
                            source={{ uri: item.thumbnail }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                          />
                          {item.discountPercentage > 0 && (
                            <View
                              style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                backgroundColor: '#E11D48',
                                paddingHorizontal: 7,
                                paddingVertical: 3,
                                borderRadius: 6,
                              }}
                            >
                              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>
                                -{Math.round(item.discountPercentage)}%
                              </Text>
                            </View>
                          )}
                          <TouchableOpacity
                            onPress={() => toggleWishlist(item)}
                            style={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              backgroundColor: 'rgba(15, 15, 22, 0.78)',
                              borderRadius: 16,
                              padding: 6,
                            }}
                          >
                            <MaterialCommunityIcons
                              name={wished ? 'heart' : 'heart-outline'}
                              size={16}
                              color={wished ? '#E11D48' : '#CBD5E1'}
                            />
                          </TouchableOpacity>
                        </View>

                        <Card.Content style={{ padding: 12 }}>
                          <Text style={styles.resultCategory} numberOfLines={1}>
                            {item.category} {item.brand ? `· ${item.brand}` : ''}
                          </Text>
                          <Text style={[styles.resultTitle, { minHeight: 38 }]} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <View style={styles.resultPrice}>
                            <Text style={styles.currentPrice}>
                              ₱{discountedPrice.toFixed(2)}
                            </Text>
                            {item.discountPercentage > 0 && (
                              <Text style={styles.originalPrice}>₱{item.price.toFixed(2)}</Text>
                            )}
                          </View>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                              marginBottom: 10,
                            }}
                          >
                            <MaterialCommunityIcons name="star" size={14} color="#FBBF24" />
                            <Text style={styles.resultDetails}>
                              {item.rating.toFixed(1)} ·{' '}
                              {item.stock > 0 ? `${item.stock} left` : 'Out of Stock'}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => {
                              addToCart(item, 1);
                              setSnackMsg(`Added "${item.title}" to cart`);
                            }}
                            style={{
                              backgroundColor: '#E11D48',
                              borderRadius: 8,
                              paddingVertical: 8,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                            }}
                          >
                            <MaterialCommunityIcons name="cart-plus" size={15} color="#FFFFFF" />
                            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}>
                              Add to Cart
                            </Text>
                          </TouchableOpacity>
                        </Card.Content>
                      </Card>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <Snackbar
        visible={!!snackMsg}
        onDismiss={() => setSnackMsg('')}
        duration={1800}
        action={{
          label: 'Cart',
          onPress: () => router.push('/(app)/(tabs)/cart'),
        }}
      >
        {snackMsg}
      </Snackbar>
    </View>
  );
}