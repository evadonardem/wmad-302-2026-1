/**
 * Search Screen - Marketplace
 * Features: Full-Width Fluid Grid (No empty side gaps), Search, Category Filters, Sort, Recent Searches
 * APIs: https://dummyjson.com/docs/products
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  useWindowDimensions,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Card, Title, Button, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../context/AuthContext';
import { useAppTheme } from '../../../context/ThemeContext';
import {
  MarketplaceProduct,
  FlashSaleSchedule,
  getFlashSaleSchedules,
  evaluateProductPromotions,
} from '../../../utils/flashSaleHelpers';
import { styles } from './searchStyles';

type SortOption = 'relevance' | 'newest' | 'price-asc' | 'price-desc';

const PAGE_SIZE = 12;

const POPULAR_SEARCH_KEYWORDS = [
  'Smartphones',
  'Laptops',
  'Skincare',
  'Watches',
  'Shoes',
  'Sunglasses',
  'Home Decoration',
  'Bags',
];

export default function SearchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { palette } = useAppTheme();
  const searchParams = useLocalSearchParams<{
    category?: string;
    q?: string;
    focusFilter?: string;
    flashDeals?: string;
  }>();
  const { width } = useWindowDimensions();

  // Responsive Breakpoints: Website Desktop (>= 1024), Tablet (768-1023), Phones (< 768: Realme, Samsung, Xiaomi, OPPO, Vivo, iPhone)
  const isLargeDesktop = width >= 1400;
  const isDesktop = width >= 1024 && width < 1400;
  const isAnyDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isSmallPhone = width < 380;
  const numColumns = isLargeDesktop ? 6 : isDesktop ? 4 : isTablet ? 3 : 2;
  const horizontalPadding = isAnyDesktop ? 12 : isTablet ? 10 : 6;

  // Per-user recent searches storage key
  const recentSearchesKey = `@marketplace_user_${user?.id || 'guest'}_recent_searches`;

  const searchInputRef = useRef<TextInput | null>(null);
  const flatListRef = useRef<FlatList<MarketplaceProduct> | null>(null);
  const savedScrollOffsetRef = useRef<number>(0);

  const [query, setQuery] = useState<string>(searchParams.q || '');
  const [allMatchedProducts, setAllMatchedProducts] = useState<MarketplaceProduct[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.category || null
  );
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [isFlashDealsMode, setIsFlashDealsMode] = useState<boolean>(
    Boolean(searchParams.flashDeals)
  );

  // Recent Searches & Focus State
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(true);

  // Dropdown Filter Panel Toggle
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(
    Boolean(searchParams.focusFilter)
  );

  // Live Flash Sale & Promo Badge States (matching Home Page product cards)
  const [flashSchedules, setFlashSchedules] = useState<Record<number, FlashSaleSchedule>>({});
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const webGlassStyle: any =
    Platform.OS === 'web'
      ? { backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }
      : {};

  const webAmbientBackdropStyle: any =
    Platform.OS === 'web'
      ? {
          backgroundImage: palette.isDark
            ? 'radial-gradient(circle at 12% 10%, rgba(254, 44, 85, 0.22), transparent 42%), radial-gradient(circle at 88% 16%, rgba(59, 130, 246, 0.20), transparent 44%), radial-gradient(circle at 50% 85%, rgba(16, 185, 129, 0.15), transparent 46%), linear-gradient(135deg, #0B1120 0%, #111827 50%, #17152B 100%)'
            : 'radial-gradient(circle at 10% 8%, rgba(254, 44, 85, 0.16), transparent 42%), radial-gradient(circle at 90% 14%, rgba(56, 189, 248, 0.20), transparent 44%), radial-gradient(circle at 18% 82%, rgba(168, 85, 247, 0.12), transparent 44%), radial-gradient(circle at 84% 86%, rgba(251, 146, 60, 0.14), transparent 46%), linear-gradient(135deg, #F8FAFC 0%, #EEF4FF 48%, #FFF3F6 100%)',
        }
      : {};

  const webPrimaryButtonGradient: any =
    Platform.OS === 'web'
      ? {
          backgroundImage: 'linear-gradient(90deg, #FE2C55 0%, #FF5E7E 100%)',
          boxShadow: '0 8px 20px rgba(254, 44, 85, 0.28)',
        }
      : {};

  const categories = [
    'smartphones',
    'laptops',
    'fragrances',
    'skin-care',
    'groceries',
    'home-decoration',
    'furniture',
    'tops',
    'womens-dresses',
    'womens-shoes',
    'mens-shirts',
    'mens-shoes',
    'mens-watches',
    'womens-watches',
    'womens-bags',
    'sunglasses',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadRecentSearches = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(recentSearchesKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed);
        }
      } else {
        setRecentSearches([]);
      }
    } catch (e) {
      console.error('Failed to load recent searches:', e);
    }
  }, [recentSearchesKey]);

  // Auto-focus search input & restore scroll position when returning from product/[id].tsx
  useFocusEffect(
    useCallback(() => {
      loadRecentSearches();
      getFlashSaleSchedules().then(setFlashSchedules).catch(() => {});

      const focusTimer = setTimeout(() => {
        if (!query.trim()) {
          searchInputRef.current?.focus();
          setIsInputFocused(true);
        }
      }, 140);

      if (savedScrollOffsetRef.current > 0 && flatListRef.current) {
        const offsetToRestore = savedScrollOffsetRef.current;
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({
            offset: offsetToRestore,
            animated: false,
          });
        }, 80);
      }

      return () => clearTimeout(focusTimer);
    }, [loadRecentSearches, query])
  );

  useEffect(() => {
    if (searchParams.category) {
      setSelectedCategory(searchParams.category);
    }
    if (searchParams.q) {
      setQuery(searchParams.q);
    }
    if (searchParams.focusFilter) {
      setIsDropdownOpen(true);
    }
    if (searchParams.flashDeals) {
      setIsFlashDealsMode(true);
      setSortBy('price-asc');
    }
  }, [searchParams.category, searchParams.q, searchParams.focusFilter, searchParams.flashDeals]);

  const saveRecentSearch = async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    try {
      const updated = [
        trimmed,
        ...recentSearches.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, 10);
      setRecentSearches(updated);
      await AsyncStorage.setItem(recentSearchesKey, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save recent search:', e);
    }
  };

  const removeRecentSearch = async (searchTerm: string) => {
    try {
      const updated = recentSearches.filter((item) => item !== searchTerm);
      setRecentSearches(updated);
      await AsyncStorage.setItem(recentSearchesKey, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to remove recent search item:', e);
    }
  };

  const clearAllRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(recentSearchesKey);
    } catch (e) {
      console.error('Failed to clear recent searches:', e);
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web' && isDropdownOpen) {
      const globalObj = typeof globalThis !== 'undefined' ? (globalThis as any) : null;
      if (globalObj && globalObj.addEventListener) {
        const handleKeyDown = (e: any) => {
          if (e && e.key === 'Escape') {
            setIsDropdownOpen(false);
          }
        };
        globalObj.addEventListener('keydown', handleKeyDown);
        return () => globalObj.removeEventListener('keydown', handleKeyDown);
      }
    }
  }, [isDropdownOpen]);

  // Dynamic Search across product names, categories, descriptions, keywords, and brands
  const executeSearch = useCallback(async () => {
    setLoading(true);
    try {
      const trimmedQuery = query.trim();
      let endpoint = '';
      if (trimmedQuery) {
        endpoint = `https://dummyjson.com/products/search?q=${encodeURIComponent(
          trimmedQuery
        )}&limit=194`;
      } else if (selectedCategory) {
        endpoint = `https://dummyjson.com/products/category/${encodeURIComponent(
          selectedCategory
        )}?limit=194`;
      } else {
        endpoint = 'https://dummyjson.com/products?limit=194';
      }

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Search request failed');
      const data = await response.json();
      let fetchedProducts: MarketplaceProduct[] = data.products || [];

      // Augment with broad catalog matching across title, category, description, brand, and tags
      if (trimmedQuery && fetchedProducts.length < 12) {
        const catalogRes = await fetch('https://dummyjson.com/products?limit=194');
        if (catalogRes.ok) {
          const catalogData = await catalogRes.json();
          const allCatalog: MarketplaceProduct[] = catalogData.products || [];
          const qLower = trimmedQuery.toLowerCase();
          const existingIds = new Set(fetchedProducts.map((p) => p.id));

          const extraMatches = allCatalog.filter((p) => {
            if (existingIds.has(p.id)) return false;
            const searchableBlob = [
              p.title,
              p.category,
              p.description,
              (p as any).brand,
              Array.isArray((p as any).tags) ? (p as any).tags.join(' ') : '',
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();
            return searchableBlob.includes(qLower);
          });

          fetchedProducts = [...fetchedProducts, ...extraMatches];
        }
      }

      if (isFlashDealsMode) {
        fetchedProducts = fetchedProducts.filter((p) => p.discountPercentage > 10);
      }

      if (trimmedQuery && selectedCategory) {
        fetchedProducts = fetchedProducts.filter(
          (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
        );
      }

      fetchedProducts.sort((a, b) => {
        if (sortBy === 'newest') return b.id - a.id;
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        return b.rating - a.rating;
      });

      setAllMatchedProducts(fetchedProducts);
      setVisibleCount(PAGE_SIZE);
    } catch (error: any) {
      console.error('Search error:', error);
      Alert.alert('Search Error', error.message || 'Failed to fetch search results.');
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory, sortBy, isFlashDealsMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch();
    }, 280);

    return () => clearTimeout(timer);
  }, [executeSearch]);

  // Visible slice for infinite scroll pagination
  const results = useMemo(
    () => allMatchedProducts.slice(0, visibleCount),
    [allMatchedProducts, visibleCount]
  );

  const hasMoreResults = visibleCount < allMatchedProducts.length;

  const handleLoadMoreResults = useCallback(() => {
    if (loading || loadingMore || !hasMoreResults) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, allMatchedProducts.length));
      setLoadingMore(false);
    }, 220);
  }, [loading, loadingMore, hasMoreResults, allMatchedProducts.length]);

  const handleSubmitOrSelectSearch = (searchTerm?: string) => {
    const termToUse = searchTerm !== undefined ? searchTerm : query;
    if (searchTerm !== undefined) {
      setQuery(searchTerm);
    }
    if (termToUse.trim()) {
      saveRecentSearch(termToUse);
    }
    setIsDropdownOpen(false);
    setIsInputFocused(false);
    savedScrollOffsetRef.current = 0;
  };

  const handleClearSearchText = () => {
    setQuery('');
    setIsInputFocused(true);
    savedScrollOffsetRef.current = 0;
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  const handleClearAllFilters = () => {
    setQuery('');
    setSelectedCategory(null);
    setSortBy('relevance');
    setIsFlashDealsMode(false);
    savedScrollOffsetRef.current = 0;
  };

  const handleBackNavigation = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)/(tabs)/home' as any);
    }
  };

  const hasActiveFilters =
    selectedCategory !== null || sortBy !== 'relevance' || isFlashDealsMode;

  // Suggested keywords matching typed query
  const searchSuggestions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    const titleMatches = allMatchedProducts
      .filter(
        (p) =>
          p.title.toLowerCase().includes(trimmed) ||
          p.category.toLowerCase().includes(trimmed) ||
          String((p as any).brand || '')
            .toLowerCase()
            .includes(trimmed)
      )
      .slice(0, 5)
      .map((p) => p.title);
    return Array.from(new Set(titleMatches));
  }, [query, allMatchedProducts]);

  const renderAmbientOrbs = () => (
    <View pointerEvents="none" style={styles.ambientBackgroundLayer}>
      <View
        style={[
          styles.ambientOrbTopLeft,
          palette.isDark && { backgroundColor: 'rgba(254, 44, 85, 0.16)' },
        ]}
      />
      <View
        style={[
          styles.ambientOrbTopRight,
          palette.isDark && { backgroundColor: 'rgba(59, 130, 246, 0.16)' },
        ]}
      />
      <View
        style={[
          styles.ambientOrbCenter,
          palette.isDark && { backgroundColor: 'rgba(139, 92, 246, 0.12)' },
        ]}
      />
      <View
        style={[
          styles.ambientOrbBottomLeft,
          palette.isDark && { backgroundColor: 'rgba(14, 165, 233, 0.12)' },
        ]}
      />
      <View
        style={[
          styles.ambientOrbBottomRight,
          palette.isDark && { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
        ]}
      />
    </View>
  );

  // Same Product Card Design as Home Page
  const renderResultCard = ({ item }: { item: MarketplaceProduct }) => {
    const promo = evaluateProductPromotions(item, flashSchedules, nowMs);

    return (
      <TouchableOpacity
        style={{
          flex: 1 / numColumns,
          margin: isSmallPhone ? 3.5 : 4.5,
        }}
        onPress={() => router.push(`/(app)/(tabs)/product/${item.id}` as any)}
        activeOpacity={0.88}
      >
        <Card
          style={[
            styles.card,
            {
              backgroundColor: palette.glassSurface,
              borderColor: palette.border,
            },
            webGlassStyle,
          ]}
          elevation={0}
        >
          <View
            style={[
              styles.cardImageContainer,
              {
                height: isAnyDesktop ? 175 : isTablet ? 160 : 152,
                backgroundColor: palette.isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
              },
            ]}
          >
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.cardImage}
              resizeMode="contain"
            />

            {promo.isFlashSale ? (
              <View style={styles.flashBadge}>
                <MaterialCommunityIcons name="lightning-bolt" size={11} color="#FFFFFF" />
                <Text style={styles.flashBadgeText}>{promo.countdownLabel}</Text>
              </View>
            ) : promo.hasDiscount ? (
              <View style={styles.discountCornerBadge}>
                <Text style={styles.discountCornerBadgeText}>
                  {promo.effectiveDiscountPercentage}% OFF
                </Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.cardBody, { padding: isSmallPhone ? 9 : 11 }]}>
            <Text
              numberOfLines={2}
              style={[
                styles.productTitle,
                {
                  fontSize: isSmallPhone ? 12 : 13,
                  color: palette.textPrimary,
                },
              ]}
            >
              {item.title}
            </Text>

            <View style={styles.priceRow}>
              <Text style={[styles.currentPrice, { fontSize: isSmallPhone ? 15 : 16 }]}>
                ${promo.effectivePrice.toFixed(2)}
              </Text>
              {promo.hasDiscount && (
                <>
                  <Text style={[styles.originalPrice, { color: palette.textMuted }]}>
                    ${promo.originalPrice.toFixed(2)}
                  </Text>
                  <View style={styles.inlineDiscountPill}>
                    <Text style={styles.inlineDiscountText}>
                      -{promo.effectiveDiscountPercentage}%
                    </Text>
                  </View>
                </>
              )}
            </View>

            <View style={styles.promoBadgesRow}>
              {promo.isFlashSale && (
                <View style={styles.flashSaleTag}>
                  <Text style={styles.flashSaleTagText}>Flash Sale</Text>
                </View>
              )}

              {promo.isFreeShipping && (
                <View style={styles.freeShippingTag}>
                  <Text style={[styles.freeShippingTagText, { color: palette.success }]}>
                    Free Shipping
                  </Text>
                </View>
              )}

              {promo.isCodAvailable && (
                <View style={[styles.codTag, { backgroundColor: palette.accentSoft }]}>
                  <Text style={[styles.codTagText, { color: palette.accent }]}>COD</Text>
                </View>
              )}
            </View>

            <View style={styles.ratingRow}>
              <Text
                numberOfLines={1}
                style={[
                  styles.ratingText,
                  {
                    fontSize: isSmallPhone ? 10.5 : 11,
                    color: palette.textSecondary,
                  },
                ]}
              >
                ⭐ {item.rating.toFixed(1)} | {promo.soldFormatted}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: palette.isDark ? palette.background : '#F1F5FB' },
        webAmbientBackdropStyle,
      ]}
    >
      {renderAmbientOrbs()}

      {/* ==================== STICKY TOP SEARCH HEADER (< Back + Input + Clear X + Filter) ==================== */}
      <View
        style={[
          styles.stickyHeader,
          {
            backgroundColor: palette.glassSurface,
            borderBottomColor: palette.border,
            paddingHorizontal: isAnyDesktop ? 18 : 8,
          },
          webGlassStyle,
        ]}
      >
        {/* Back Button (< Back) */}
        <TouchableOpacity
          onPress={handleBackNavigation}
          activeOpacity={0.75}
          accessibilityLabel="Back to Home"
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color={palette.textPrimary} />
          {!isSmallPhone && (
            <Text style={[styles.backButtonText, { color: palette.textPrimary }]}>Back</Text>
          )}
        </TouchableOpacity>

        {/* Dedicated Search Input Field with Search Icon & Clear (X) Button */}
        <View
          style={[
            styles.searchInputWrapper,
            {
              backgroundColor: palette.glassInput,
              borderColor: isInputFocused ? '#FE2C55' : palette.border,
            },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={21} color="#FE2C55" />

          <TextInput
            ref={searchInputRef}
            autoFocus
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setIsInputFocused(true);
            }}
            onFocus={() => setIsInputFocused(true)}
            onSubmitEditing={() => handleSubmitOrSelectSearch()}
            returnKeyType="search"
            placeholder="Search products, categories, or brands..."
            placeholderTextColor={palette.textMuted}
            style={[styles.searchInput, { color: palette.textPrimary }]}
          />

          {query.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearchText}
              activeOpacity={0.75}
              accessibilityLabel="Clear search text"
              style={styles.clearButton}
            >
              <MaterialCommunityIcons
                name="close-circle"
                size={19}
                color={palette.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Drawer Toggle Button */}
        <TouchableOpacity
          onPress={() => setIsDropdownOpen((prev) => !prev)}
          activeOpacity={0.8}
          accessibilityLabel="Toggle search filters"
          style={[
            styles.filterToggleButton,
            {
              backgroundColor: isDropdownOpen ? 'rgba(254, 44, 85, 0.14)' : palette.glassInput,
              borderColor: isDropdownOpen || hasActiveFilters ? '#FE2C55' : palette.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={21}
            color={isDropdownOpen || hasActiveFilters ? '#FE2C55' : palette.textPrimary}
          />
          {hasActiveFilters && <View style={styles.filterActiveDot} />}
        </TouchableOpacity>
      </View>

      {/* ==================== MAIN RESULTS & INFINITE SCROLL GRID ==================== */}
      <FlatList
        ref={flatListRef}
        key={`search-grid-${numColumns}`}
        data={results}
        renderItem={renderResultCard}
        numColumns={numColumns}
        keyExtractor={(item) => `search-prod-${item.id}`}
        keyboardShouldPersistTaps="handled"
        onEndReached={handleLoadMoreResults}
        onEndReachedThreshold={0.4}
        onScroll={(e) => {
          savedScrollOffsetRef.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={32}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* EXPANDED FILTER PANEL */}
            {isDropdownOpen && (
              <View
                style={[
                  styles.glassPanel,
                  {
                    backgroundColor: palette.glassSurface,
                    borderColor: palette.border,
                  },
                  webGlassStyle,
                ]}
              >
                <View style={styles.panelHeaderRow}>
                  <Text style={[styles.panelTitle, { color: palette.textPrimary }]}>
                    Search & Filter Options ({allMatchedProducts.length} Products Found)
                  </Text>
                  <IconButton
                    icon="close"
                    size={20}
                    iconColor={palette.textPrimary}
                    onPress={() => setIsDropdownOpen(false)}
                    style={{ margin: 0 }}
                  />
                </View>

                <View style={styles.filterSection}>
                  <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>
                    Categories
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterList}
                  >
                    <TouchableOpacity
                      style={[
                        styles.filterChip,
                        {
                          borderColor: palette.border,
                          backgroundColor: palette.glassInput,
                        },
                        selectedCategory === null && styles.filterChipSelected,
                      ]}
                      onPress={() => setSelectedCategory(null)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          { color: palette.textPrimary },
                          selectedCategory === null && styles.filterChipTextSelected,
                        ]}
                      >
                        All Categories
                      </Text>
                    </TouchableOpacity>

                    {categories.map((cat) => {
                      const active = selectedCategory === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.filterChip,
                            {
                              borderColor: palette.border,
                              backgroundColor: palette.glassInput,
                            },
                            active && styles.filterChipSelected,
                          ]}
                          onPress={() => setSelectedCategory(active ? null : cat)}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              { color: palette.textPrimary },
                              active && styles.filterChipTextSelected,
                            ]}
                          >
                            {cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ')}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={styles.sortSection}>
                  <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>
                    Sort By
                  </Text>
                  <View style={styles.sortOptions}>
                    {[
                      { label: 'Relevance', value: 'relevance' },
                      { label: 'Newest Arrivals', value: 'newest' },
                      { label: 'Price: Low to High', value: 'price-asc' },
                      { label: 'Price: High to Low', value: 'price-desc' },
                    ].map((option) => {
                      const active = sortBy === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          onPress={() => setSortBy(option.value as SortOption)}
                          style={[
                            styles.sortChip,
                            {
                              borderColor: palette.border,
                              backgroundColor: palette.glassInput,
                            },
                            active && styles.sortChipSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.sortChipText,
                              { color: palette.textPrimary },
                              active && styles.sortChipTextSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.panelActionsRow}>
                  <Button
                    mode="outlined"
                    onPress={handleClearAllFilters}
                    textColor={palette.textSecondary}
                    style={{ borderColor: palette.border, borderRadius: 20 }}
                  >
                    Clear All
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => handleSubmitOrSelectSearch()}
                    buttonColor="#FE2C55"
                    textColor="#FFFFFF"
                    style={[{ borderRadius: 20 }, webPrimaryButtonGradient]}
                  >
                    Apply Filters
                  </Button>
                </View>
              </View>
            )}

            {/* LIVE AUTOCOMPLETE SUGGESTIONS WHILE TYPING */}
            {query.trim().length > 0 && isInputFocused && searchSuggestions.length > 0 && (
              <View
                style={[
                  styles.suggestionPanel,
                  {
                    backgroundColor: palette.glassSurface,
                    borderColor: palette.border,
                  },
                  webGlassStyle,
                ]}
              >
                <Text style={[styles.suggestionLabel, { color: palette.textMuted }]}>
                  Suggested Searches
                </Text>
                {searchSuggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion}
                    onPress={() => handleSubmitOrSelectSearch(suggestion)}
                    style={[styles.suggestionRow, { borderBottomColor: palette.border }]}
                  >
                    <MaterialCommunityIcons name="magnify" size={16} color="#FE2C55" />
                    <Text
                      numberOfLines={1}
                      style={[styles.suggestionText, { color: palette.textPrimary }]}
                    >
                      {suggestion}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* RECENT SEARCHES & POPULAR KEYWORDS WHEN SEARCH BAR IS EMPTY OR FOCUSED */}
            {!query.trim() && (
              <View
                style={[
                  styles.glassPanel,
                  {
                    backgroundColor: palette.glassSurface,
                    borderColor: palette.border,
                    gap: 14,
                  },
                  webGlassStyle,
                ]}
              >
                {/* Recent Searches Section */}
                {recentSearches.length > 0 && (
                  <View style={styles.discoveryBlock}>
                    <View style={styles.discoveryHeaderRow}>
                      <View style={styles.discoveryTitleRow}>
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={16}
                          color={palette.textSecondary}
                        />
                        <Text style={[styles.discoveryTitle, { color: palette.textPrimary }]}>
                          Recent Searches
                        </Text>
                      </View>
                      <TouchableOpacity onPress={clearAllRecentSearches} activeOpacity={0.75}>
                        <Text style={styles.clearAllText}>Clear All</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.chipWrapContainer}>
                      {recentSearches.map((term) => (
                        <View
                          key={`recent-${term}`}
                          style={[
                            styles.recentChipPill,
                            {
                              backgroundColor: palette.glassInput,
                              borderColor: palette.border,
                            },
                          ]}
                        >
                          <TouchableOpacity
                            onPress={() => handleSubmitOrSelectSearch(term)}
                            style={styles.recentChipTrigger}
                          >
                            <MaterialCommunityIcons
                              name="history"
                              size={14}
                              color={palette.textMuted}
                            />
                            <Text style={[styles.recentChipText, { color: palette.textPrimary }]}>
                              {term}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => removeRecentSearch(term)}
                            accessibilityLabel={`Delete ${term} from recent searches`}
                            style={styles.recentChipDelete}
                          >
                            <MaterialCommunityIcons
                              name="close"
                              size={14}
                              color={palette.textMuted}
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Suggested & Popular Search Keywords */}
                <View style={styles.discoveryBlock}>
                  <View style={styles.discoveryTitleRow}>
                    <MaterialCommunityIcons name="fire" size={16} color="#FE2C55" />
                    <Text style={[styles.discoveryTitle, { color: palette.textPrimary }]}>
                      Popular Searches
                    </Text>
                  </View>

                  <View style={styles.chipWrapContainer}>
                    {POPULAR_SEARCH_KEYWORDS.map((keyword) => (
                      <TouchableOpacity
                        key={`pop-${keyword}`}
                        onPress={() => handleSubmitOrSelectSearch(keyword)}
                        activeOpacity={0.78}
                        style={[
                          styles.popularChipPill,
                          {
                            backgroundColor: palette.isDark
                              ? 'rgba(254, 44, 85, 0.16)'
                              : 'rgba(254, 44, 85, 0.08)',
                          },
                        ]}
                      >
                        <Text style={[styles.popularChipText, { color: '#FE2C55' }]}>
                          {keyword}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* TOTAL RESULTS SUMMARY BAR */}
            <View style={styles.resultsSummaryBar}>
              <Title style={[styles.resultsTitle, { color: palette.textPrimary }]}>
                {isFlashDealsMode ? '⚡ Flash Deals' : 'Search Results'}{' '}
                {query.trim() ? `for "${query.trim()}"` : ''}{' '}
                {selectedCategory ? `in ${selectedCategory}` : ''}
              </Title>
              <View style={styles.resultsCountPill}>
                <Text style={styles.resultsCountText}>
                  {allMatchedProducts.length}{' '}
                  {allMatchedProducts.length === 1 ? 'result' : 'results'}
                </Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="large" color="#FE2C55" />
              <Text style={[styles.loadingText, { color: palette.textSecondary }]}>
                Searching products...
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.emptyState,
                {
                  backgroundColor: palette.glassSurface,
                  borderWidth: 1,
                  borderColor: palette.border,
                },
                webGlassStyle,
              ]}
            >
              <MaterialCommunityIcons name="magnify-close" size={58} color={palette.textMuted} />
              <Text style={[styles.emptyText, { color: palette.textPrimary }]}>
                No matching products found
              </Text>
              <Text style={[styles.emptySubtext, { color: palette.textSecondary }]}>
                We couldn't find any products matching your search. Clear your search and try
                another keyword or category.
              </Text>
              {(query.trim().length > 0 || selectedCategory !== null) && (
                <Button
                  mode="contained"
                  buttonColor="#FE2C55"
                  textColor="#FFFFFF"
                  style={[{ marginTop: 14, borderRadius: 20 }, webPrimaryButtonGradient]}
                  onPress={handleClearAllFilters}
                >
                  Clear Search & Filters
                </Button>
              )}
            </View>
          )
        }
        ListFooterComponent={
          <View style={styles.footerContainer}>
            {loadingMore ? (
              <View style={styles.footerLoadingRow}>
                <ActivityIndicator size="small" color="#FE2C55" />
                <Text style={[styles.footerText, { color: palette.textSecondary }]}>
                  Loading more products...
                </Text>
              </View>
            ) : !hasMoreResults && results.length > 0 ? (
              <Text style={[styles.footerText, { color: palette.textMuted }]}>
                You've reached the end of products
              </Text>
            ) : null}
          </View>
        }
      />
    </View>
  );
}