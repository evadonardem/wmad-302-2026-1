/**
 * Categories Screen - Marketplace
 * Browse products by category
 * 
 * Student Implementation Guide:
 * Enhance the categories screen:
 * 1. Add category images/banners
 * 2. Show product count per category
 * 3. Add sub-categories navigation
 * 4. Add "Featured Brands" section
 * 5. Implement pull-to-refresh
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  Platform,
  Image,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Title, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { productApi } from '../../../services/productApi';
import { useAppTheme } from '../../../context/ThemeContext';
import { styles, getCategoriesBreakpointMetrics } from './categoriesStyles';

interface Category {
  name: string;
  slug: string;
  count?: number;
  bannerImage?: string;
}

interface SubCategoryGroup {
  id: string;
  label: string;
  icon: IconName;
  slugs: string[];
}

const SUB_CATEGORY_GROUPS: SubCategoryGroup[] = [
  {
    id: 'all',
    label: 'All Categories',
    icon: 'view-grid',
    slugs: [],
  },
  {
    id: 'electronics',
    label: 'Electronics & Tech',
    icon: 'laptop',
    slugs: ['smartphones', 'laptops', 'tablets', 'mobile-accessories', 'electronics-accessories'],
  },
  {
    id: 'fashion',
    label: 'Fashion & Apparel',
    icon: 'tshirt-crew',
    slugs: [
      'tops',
      'womens-dresses',
      'womens-shoes',
      'mens-shirts',
      'mens-shoes',
      'mens-watches',
      'womens-watches',
      'womens-bags',
      'womens-jewellery',
      'sunglasses',
    ],
  },
  {
    id: 'home',
    label: 'Home & Kitchen',
    icon: 'home',
    slugs: ['home-decoration', 'furniture', 'kitchen-accessories', 'lighting', 'groceries'],
  },
  {
    id: 'beauty',
    label: 'Beauty & Care',
    icon: 'lipstick',
    slugs: ['beauty', 'fragrances', 'skin-care', 'skincare'],
  },
  {
    id: 'auto-sports',
    label: 'Auto & Sports',
    icon: 'car-side',
    slugs: ['automotive', 'motorcycle', 'vehicle', 'vehicle-accessories', 'sports-accessories'],
  },
];

export default function CategoriesScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { width } = useWindowDimensions();

  // Dynamic responsive columns based on screen width (Large Web: 5, Desktop: 4, Tablet: 3, Mobile Phones e.g. Realme/iPhone: 2)
  const metrics = useMemo(() => getCategoriesBreakpointMetrics(width), [width]);
  const {
    isAnyDesktop,
    isSmallPhone,
    numColumns,
    horizontalPadding,
    bannerHeight,
  } = metrics;

  // Web Glassmorphism Helper & Layered Mesh Gradient Backdrop
  const webGlassStyle: any =
    Platform.OS === 'web'
      ? { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }
      : {};

  const webAmbientBackdropStyle: any =
    Platform.OS === 'web'
      ? {
          backgroundImage: palette.isDark
            ? 'radial-gradient(circle at 12% 10%, rgba(254, 44, 85, 0.18), transparent 40%), radial-gradient(circle at 88% 18%, rgba(59, 130, 246, 0.16), transparent 42%), radial-gradient(circle at 50% 85%, rgba(16, 185, 129, 0.12), transparent 45%)'
            : 'radial-gradient(circle at 10% 8%, rgba(254, 44, 85, 0.13), transparent 42%), radial-gradient(circle at 90% 14%, rgba(56, 189, 248, 0.16), transparent 44%), radial-gradient(circle at 48% 88%, rgba(251, 146, 60, 0.12), transparent 46%)',
        }
      : {};

  // Hide browser horizontal scrollbar track/arrows on Web while preserving touch/trackpad scrolling
  const webHideScrollbarStyle: any =
    Platform.OS === 'web'
      ? { scrollbarWidth: 'none', msOverflowStyle: 'none' }
      : {};

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const doc = (globalThis as any)?.document;
    if (!doc) return;
    const styleId = 'hide-horizontal-scrollbars-style';
    if (!doc.getElementById(styleId)) {
      const styleEl = doc.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = `
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `;
      doc.head.appendChild(styleEl);
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredBrands, setFeaturedBrands] = useState<
    Array<{ name: string; count: number; sampleThumb?: string }>
  >([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories and products in 2 requests instead of 17 parallel calls to prevent 10000ms timeout
      const [rawCategories, allProductsRes] = await Promise.all([
        productApi.getCategories(),
        productApi.getProducts({ limit: 200 }).catch(() => ({ products: [] })),
      ]);

      // Count products per category, extract category banner thumbnails, and collect Featured Brands
      const countMap: Record<string, number> = {};
      const bannerMap: Record<string, string> = {};
      const brandMap: Record<string, { count: number; sampleThumb?: string }> = {};

      if (Array.isArray(allProductsRes?.products)) {
        allProductsRes.products.forEach((prod: any) => {
          if (prod.category) {
            const key = prod.category.toLowerCase();
            countMap[key] = (countMap[key] || 0) + 1;
            if (!bannerMap[key] && prod.thumbnail) {
              bannerMap[key] = prod.thumbnail;
            }
          }
          if (prod.brand && typeof prod.brand === 'string') {
            const brandName = prod.brand.trim();
            if (!brandMap[brandName]) {
              brandMap[brandName] = { count: 1, sampleThumb: prod.thumbnail };
            } else {
              brandMap[brandName].count += 1;
            }
          }
        });
      }

      // Normalize string array or object array responses from DummyJSON API
      const normalizedCategories: Category[] = rawCategories.map((cat: any) => {
        const name = typeof cat === 'string' ? cat : cat.name || cat.slug;
        const slug = typeof cat === 'string' ? cat : cat.slug || cat.name;
        const key = slug.toLowerCase();
        return {
          name,
          slug,
          count: countMap[key],
          bannerImage: bannerMap[key],
        };
      });

      const sortedBrands = Object.entries(brandMap)
        .map(([name, info]) => ({ name, count: info.count, sampleThumb: info.sampleThumb }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);

      setCategories(normalizedCategories);
      setFeaturedBrands(sortedBrands);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  // Navigate back to previous screen or Home
  const handleBackNavigation = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)/(tabs)/home' as any);
    }
  };

  // Connect search directly to search.tsx
  const handleNavigateToSearch = () => {
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/(app)/(tabs)/search?q=${encodeURIComponent(trimmed)}` as any);
    } else {
      router.push('/(app)/(tabs)/search' as any);
    }
  };

  // Filtered categories based on selected sub-category group and live search filter
  const displayedCategories = useMemo(() => {
    let list = categories;
    if (selectedGroup !== 'all') {
      const group = SUB_CATEGORY_GROUPS.find((g) => g.id === selectedGroup);
      if (group) {
        list = list.filter((c) => group.slugs.includes(c.slug.toLowerCase()));
      }
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.replace(/-/g, ' ').toLowerCase().includes(q)
      );
    }
    return list;
  }, [categories, selectedGroup, searchQuery]);

  // Ambient decorative orbs reused across loading, error, and main states
  const renderAmbientOrbs = () => (
    <View pointerEvents="none" style={styles.ambientBackgroundLayer}>
      <View
        style={[
          styles.ambientOrbTopLeft,
          {
            backgroundColor: palette.isDark
              ? 'rgba(254, 44, 85, 0.14)'
              : 'rgba(254, 44, 85, 0.10)',
          },
        ]}
      />
      <View
        style={[
          styles.ambientOrbTopRight,
          {
            backgroundColor: palette.isDark
              ? 'rgba(59, 130, 246, 0.14)'
              : 'rgba(56, 189, 248, 0.13)',
          },
        ]}
      />
      <View
        style={[
          styles.ambientOrbCenter,
          {
            backgroundColor: palette.isDark
              ? 'rgba(139, 92, 246, 0.10)'
              : 'rgba(251, 146, 60, 0.08)',
          },
        ]}
      />
      <View
        style={[
          styles.ambientOrbBottomRight,
          {
            backgroundColor: palette.isDark
              ? 'rgba(16, 185, 129, 0.10)'
              : 'rgba(99, 102, 241, 0.09)',
          },
        ]}
      />
    </View>
  );

  const renderCategory = ({ item, index }: { item: Category; index: number }) => {
    const tintPalette = [
      'rgba(254, 44, 85, 0.08)',
      'rgba(59, 130, 246, 0.08)',
      'rgba(16, 185, 129, 0.08)',
      'rgba(245, 158, 11, 0.09)',
      'rgba(139, 92, 246, 0.08)',
    ];
    const bannerTint = tintPalette[index % tintPalette.length];

    return (
      <TouchableOpacity
        style={{
          flex: 1 / numColumns,
          margin: isSmallPhone ? 4 : 5,
        }}
        onPress={() =>
          router.push(`/(app)/(tabs)/search?category=${encodeURIComponent(item.slug)}` as any)
        }
        activeOpacity={0.86}
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
          {/* Category Banner / Image Preview */}
          <View
            style={[
              styles.bannerContainer,
              {
                height: bannerHeight,
                backgroundColor: bannerTint,
              },
            ]}
          >
            {item.bannerImage ? (
              <Image
                source={{ uri: item.bannerImage }}
                style={styles.bannerImage}
                resizeMode="contain"
              />
            ) : null}

            <View
              style={[
                styles.iconContainer,
                item.bannerImage ? styles.iconFloating : styles.iconCentered,
                {
                  backgroundColor: palette.glassSurfaceElevated,
                  borderColor: palette.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={getCategoryIcon(item.slug || item.name)}
                size={item.bannerImage ? 16 : 24}
                color="#FE2C55"
              />
            </View>
          </View>

          <Card.Content style={styles.cardContent}>
            <Title
              style={[styles.categoryName, { color: palette.textPrimary }]}
              numberOfLines={1}
            >
              {item.name.charAt(0).toUpperCase() + item.name.slice(1).replace(/-/g, ' ')}
            </Title>

            {item.count !== undefined && (
              <View style={[styles.countPill, { backgroundColor: palette.accentSoft }]}>
                <Text style={[styles.categoryCount, { color: palette.accent }]}>
                  {item.count} {item.count === 1 ? 'product' : 'products'}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: palette.isDark ? palette.background : '#F3F6FB' },
          webAmbientBackdropStyle,
        ]}
      >
        {renderAmbientOrbs()}
        <ActivityIndicator size="large" color="#FE2C55" />
        <Text style={[styles.loadingText, { color: palette.textSecondary }]}>
          Loading categories...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: palette.isDark ? palette.background : '#F3F6FB' },
          webAmbientBackdropStyle,
        ]}
      >
        {renderAmbientOrbs()}
        <MaterialCommunityIcons name="wifi-off" size={42} color={palette.danger} />
        <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text>
        <Button
          mode="contained"
          onPress={loadCategories}
          style={{ marginTop: 12, borderRadius: 20 }}
          buttonColor="#FE2C55"
          textColor="#FFFFFF"
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: palette.isDark ? palette.background : '#F3F6FB' },
        webAmbientBackdropStyle,
      ]}
    >
      {renderAmbientOrbs()}

      <FlatList
        key={`cat-grid-${numColumns}`}
        data={displayedCategories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.slug || item.name}
        numColumns={numColumns}
        keyboardShouldPersistTaps="handled"
        columnWrapperStyle={{ justifyContent: 'flex-start' }}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FE2C55']} />
        }
        ListHeaderComponent={
          <View style={styles.headerWrapper}>
            {/* Glassmorphic Hero Header + Back & Search Bar Connected to search.tsx */}
            <View
              style={[
                styles.heroHeaderCard,
                {
                  backgroundColor: palette.glassSurface,
                  borderColor: palette.border,
                },
                webGlassStyle,
              ]}
            >
              <View style={styles.heroTopRow}>
                <View style={styles.heroTitleBlock}>
                  <View style={styles.heroEyebrowRow}>
                    <MaterialCommunityIcons name="shape-outline" size={13} color="#FE2C55" />
                    <Text style={styles.heroEyebrowText}>Marketplace Directory</Text>
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.heroHeadline,
                      {
                        fontSize: isAnyDesktop ? 23 : isSmallPhone ? 18 : 20,
                        color: palette.textPrimary,
                      },
                    ]}
                  >
                    Browse Categories
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.heroSubtext, { color: palette.textSecondary }]}
                  >
                    Discover curated collections, top brands & daily essentials
                  </Text>
                </View>

                <View style={styles.heroStatsPill}>
                  <MaterialCommunityIcons name="tag-multiple" size={14} color="#FE2C55" />
                  <Text style={styles.heroStatsText}>{categories.length} Departments</Text>
                </View>
              </View>

              <View style={styles.searchRow}>
                <TouchableOpacity
                  onPress={handleBackNavigation}
                  activeOpacity={0.75}
                  accessibilityLabel="Back"
                  style={[
                    styles.backButton,
                    {
                      backgroundColor: palette.isDark
                        ? 'rgba(255, 255, 255, 0.07)'
                        : '#FFFFFF',
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="chevron-left"
                    size={24}
                    color={palette.textPrimary}
                  />
                  {!isSmallPhone && (
                    <Text style={[styles.backButtonText, { color: palette.textPrimary }]}>
                      Back
                    </Text>
                  )}
                </TouchableOpacity>

                <View
                  style={[
                    styles.searchBarShell,
                    {
                      backgroundColor: palette.isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : '#FFFFFF',
                      borderColor: 'rgba(254, 44, 85, 0.28)',
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="magnify" size={20} color="#FE2C55" />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleNavigateToSearch}
                    returnKeyType="search"
                    placeholder="Search products, brands, or categories..."
                    placeholderTextColor={palette.textMuted}
                    style={[styles.searchInput, { color: palette.textPrimary }]}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      activeOpacity={0.75}
                      accessibilityLabel="Clear search"
                      style={styles.clearIconBtn}
                    >
                      <MaterialCommunityIcons
                        name="close-circle"
                        size={18}
                        color={palette.textSecondary}
                      />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={handleNavigateToSearch}
                    activeOpacity={0.82}
                    style={styles.searchActionPill}
                  >
                    <Text style={styles.searchActionPillText}>Search</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Sub-Categories Group Navigation */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={webHideScrollbarStyle}
              {...(Platform.OS === 'web' ? { className: 'no-scrollbar' } : {})}
              contentContainerStyle={styles.subGroupScrollContent}
            >
              {SUB_CATEGORY_GROUPS.map((group) => {
                const active = selectedGroup === group.id;
                return (
                  <TouchableOpacity
                    key={group.id}
                    onPress={() => setSelectedGroup(group.id)}
                    activeOpacity={0.8}
                    style={[
                      styles.subGroupPill,
                      {
                        backgroundColor: palette.glassSurface,
                        borderColor: palette.border,
                      },
                      webGlassStyle,
                      active && styles.subGroupPillSelected,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={group.icon}
                      size={16}
                      color={active ? '#FFFFFF' : '#FE2C55'}
                    />
                    <Text
                      style={[
                        styles.subGroupText,
                        { color: palette.textPrimary },
                        active && styles.subGroupTextSelected,
                      ]}
                    >
                      {group.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Featured Brands Section */}
            {featuredBrands.length > 0 && (
              <View
                style={[
                  styles.brandsSection,
                  {
                    backgroundColor: palette.glassSurface,
                    borderColor: palette.border,
                  },
                  webGlassStyle,
                ]}
              >
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTitleGroup}>
                    <View style={styles.sectionAccentBar} />
                    <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                      Featured Brands
                    </Text>
                  </View>
                  <Text style={[styles.sectionHintText, { color: palette.textMuted }]}>
                    Tap to explore
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={webHideScrollbarStyle}
                  {...(Platform.OS === 'web' ? { className: 'no-scrollbar' } : {})}
                  contentContainerStyle={styles.brandsScrollContent}
                >
                  {featuredBrands.map((brand) => (
                    <TouchableOpacity
                      key={brand.name}
                      onPress={() =>
                        router.push(
                          `/(app)/(tabs)/search?q=${encodeURIComponent(brand.name)}` as any
                        )
                      }
                      activeOpacity={0.84}
                      style={[
                        styles.brandCard,
                        {
                          backgroundColor: palette.isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : '#FFFFFF',
                          borderColor: palette.border,
                        },
                      ]}
                    >
                      <View style={styles.brandThumbWrap}>
                        {brand.sampleThumb ? (
                          <Image
                            source={{ uri: brand.sampleThumb }}
                            style={styles.brandThumb}
                            resizeMode="contain"
                          />
                        ) : (
                          <MaterialCommunityIcons name="tag-outline" size={18} color="#FE2C55" />
                        )}
                      </View>
                      <View>
                        <Text style={[styles.brandName, { color: palette.textPrimary }]}>
                          {brand.name}
                        </Text>
                        <Text style={[styles.brandCount, { color: palette.textMuted }]}>
                          {brand.count} {brand.count === 1 ? 'item' : 'items'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Active Group Section Subheader */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <View style={styles.sectionAccentBar} />
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                  {SUB_CATEGORY_GROUPS.find((g) => g.id === selectedGroup)?.label || 'All Categories'}
                </Text>
              </View>
              <View style={styles.sectionCountPill}>
                <Text style={styles.sectionCountText}>{displayedCategories.length}</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="folder-open-outline" size={44} color={palette.textMuted} />
            <Text style={[styles.emptyText, { color: palette.textSecondary }]}>
              No matching categories found.
            </Text>
            {searchQuery.trim().length > 0 && (
              <Button
                mode="contained"
                buttonColor="#FE2C55"
                textColor="#FFFFFF"
                style={{ marginTop: 12, borderRadius: 20 }}
                onPress={handleNavigateToSearch}
              >
                Search "{searchQuery.trim()}" in All Products
              </Button>
            )}
          </View>
        }
      />
    </View>
  );
}

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function getCategoryIcon(category: string): IconName {
  const normalizedCategory = category.toLowerCase().replace(/\s+/g, '-');
  const icons: Record<string, IconName> = {
    smartphones: 'cellphone',
    laptops: 'laptop',
    fragrances: 'spray',
    skincare: 'face-woman',
    'skin-care': 'face-woman',
    beauty: 'lipstick',
    groceries: 'cart',
    'home-decoration': 'home',
    furniture: 'sofa',
    'kitchen-accessories': 'silverware',
    'vehicle-accessories': 'car',
    vehicle: 'car',
    'electronics-accessories': 'headphones',
    'mobile-accessories': 'cellphone-link',
    'sports-accessories': 'basketball',
    tablets: 'tablet',
    tops: 'tshirt-v',
    'womens-dresses': 'shoe-heel',
    'womens-shoes': 'shoe-heel',
    'mens-shirts': 'tshirt-crew',
    'mens-shoes': 'shoe-formal',
    'mens-watches': 'watch',
    'womens-watches': 'watch-variant',
    'womens-bags': 'bag-personal',
    'womens-jewellery': 'diamond-stone',
    sunglasses: 'glasses',
    automotive: 'car-side',
    motorcycle: 'motorbike',
    lighting: 'lamp',
  };
  return icons[normalizedCategory] || 'package-variant';
}