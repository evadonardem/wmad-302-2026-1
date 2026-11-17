
/**
 * Home Screen - Marketplace Shop Tab
 *
 * Features:
 * - Shop search bar with navigation to Search
 * - Cart shortcut with live quantity badge
 * - Personalized welcome header
 * - Promotional banner
 * - Product categories
 * - Horizontal flash deals
 * - Two-column recommended products
 * - Pull-to-refresh
 * - Dynamic Light and Dark Mode
 */

import React, { useCallback, useEffect, useState } from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';

import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { cartStorage } from '@/utils/storage';
import { useTheme, type MD3Theme } from 'react-native-paper';

import { createHomeStyles } from './homeStyles';

// Product type from DummyJSON Products API
interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand?: string;
  sku: string;
  weight: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: {
    rating: number;
    comment: string;
    date: string;
    reviewerName: string;
  }[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: {
    createdAt: string;
    updatedAt: string;
    barcode: string;
    qrCode: string;
  };
  images: string[];
  thumbnail: string;
}

// Category type from DummyJSON Categories API
interface ProductCategory {
  slug: string;
  name: string;
  url: string;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const theme = useTheme<MD3Theme>();

  const styles = createHomeStyles(theme.colors);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);

  /**
   * Load the current cart quantity whenever the Shop screen
   * becomes active again.
   */
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadCartCount = async () => {
        try {
          const items = await cartStorage.getCart();

          if (isActive) {
            const totalQuantity = items.reduce(
              (total, item) => total + item.quantity,
              0,
            );

            setCartCount(totalQuantity);
          }
        } catch {
          if (isActive) {
            setCartCount(0);
          }
        }
      };

      void loadCartCount();

      return () => {
        isActive = false;
      };
    }, []),
  );

  /**
   * Fetch products and categories.
   */
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }

      setError(null);

      const [productsRes, categoriesRes] = await Promise.all([
        fetch('https://dummyjson.com/products?limit=20'),
        fetch('https://dummyjson.com/products/categories'),
      ]);

      if (!productsRes.ok || !categoriesRes.ok) {
        throw new Error('Unable to load marketplace data. Please try again.');
      }

      const productsData: ProductsResponse = await productsRes.json();
      const categoriesData: ProductCategory[] = await categoriesRes.json();

      setProducts(productsData.products);
      setCategories(categoriesData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while loading products.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  /**
   * Pull-to-refresh.
   */
  const onRefresh = () => {
    setRefreshing(true);
    void fetchData(true);
  };

  /**
   * Navigate to Search with the entered search term.
   */
  const openSearch = () => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery) {
      router.push({
        pathname: '/(app)/(tabs)/search',
        params: { q: trimmedQuery },
      });
    } else {
      router.push('/(app)/(tabs)/search');
    }
  };

  /**
   * Navigate to the Cart screen.
   */
  const openCart = () => {
    router.push('/(app)/(tabs)/cart');
  };

  /**
   * Open product details.
   */
  const openProduct = (productId: number) => {
    router.push(`/(app)/product/${productId}`);
  };

  /**
   * Render an individual product card.
   */
  const renderProductCard = (item: Product, compact = false) => {
    const discountedPrice =
      item.price * (1 - item.discountPercentage / 100);

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.productCard,
          compact && styles.compactProductCard,
        ]}
        onPress={() => openProduct(item.id)}
        activeOpacity={0.85}
      >
        <View style={styles.productImageContainer}>
          <Image
            source={{ uri: item.thumbnail }}
            style={styles.productImage}
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

        <View style={styles.productInfo}>
          <Text style={styles.productCategory} numberOfLines={1}>
            {item.category}
          </Text>

          <Text style={styles.productTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>
              ${discountedPrice.toFixed(2)}
            </Text>

            {item.discountPercentage > 0 && (
              <Text style={styles.originalPrice}>
                ${item.price.toFixed(2)}
              </Text>
            )}
          </View>

          <View style={styles.productMetaRow}>
            <Text style={styles.ratingText}>
              ★ {item.rating.toFixed(1)}
            </Text>

            <Text
              style={[
                styles.stockText,
                item.stock > 0
                  ? styles.inStockText
                  : styles.outOfStockText,
              ]}
            >
              {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Loading screen.
   */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
        />

        <Text style={styles.loadingText}>
          Preparing your marketplace...
        </Text>
      </View>
    );
  }

  /**
   * Error screen.
   */
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>!</Text>

        <Text style={styles.errorTitle}>
          Something went wrong
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => void fetchData()}
          activeOpacity={0.85}
        >
          <Text style={styles.retryButtonText}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const flashDeals = products
    .filter((product) => product.discountPercentage > 20)
    .slice(0, 8);

  const recommendedProducts = products.slice(0, 10);

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Search Bar and Cart Button */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons
            name="magnify"
            size={22}
            color={theme.colors.onSurfaceVariant}
          />

          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
            returnKeyType="search"
            onSubmitEditing={openSearch}
            accessibilityLabel="Search products"
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              activeOpacity={0.7}
              accessibilityLabel="Clear search"
            >
              <MaterialCommunityIcons
                name="close-circle"
                size={19}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.cartButton}
          onPress={openCart}
          activeOpacity={0.8}
          accessibilityLabel={`Open cart, ${cartCount} items`}
        >
          <MaterialCommunityIcons
            name="cart-outline"
            size={25}
            color={theme.colors.onSurface}
          />

          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartCount > 99 ? '99+' : cartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Welcome Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerEyebrow}>
            YOUR DAILY SHOPPING DESTINATION
          </Text>

          <Text style={styles.welcomeGreeting}>
            Hello, {user?.firstName || 'Shopper'}!
          </Text>

          <Text style={styles.welcomeSubtitle}>
            What are you looking for today?
          </Text>
        </View>
      </View>

      {/* Promotional Banner */}
      <View style={styles.promoBanner}>
        <View style={styles.promoTextContainer}>
          <Text style={styles.promoEyebrow}>
            SPECIAL OFFERS
          </Text>

          <Text style={styles.promoTitle}>
            Find your next{'\n'}favorite thing.
          </Text>

          <Text style={styles.promoSubtitle}>
            Discover products and amazing deals.
          </Text>

          <TouchableOpacity
            style={styles.promoButton}
            onPress={() => router.push('/(app)/(tabs)/search')}
            activeOpacity={0.85}
          >
            <Text style={styles.promoButtonText}>
              Explore Products →
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.promoDecoration}>
          <Text style={styles.promoEmoji}>🎁</Text>
          <Text style={styles.promoSmallEmoji}>✨</Text>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Shop by Category
            </Text>

            <Text style={styles.sectionSubtitle}>
              Explore your favorite collections
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(app)/(tabs)/categories')}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {categories.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            {categories.slice(0, 10).map((item) => (
              <TouchableOpacity
                key={item.slug}
                style={styles.categoryChip}
                onPress={() =>
                  router.push(
                    `/(app)/(tabs)/categories?category=${encodeURIComponent(item.slug)}`,
                  )
                }
                activeOpacity={0.8}
              >
                <Text style={styles.categoryChipText}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.emptyText}>
            No categories available.
          </Text>
        )}
      </View>

      {/* Flash Deals */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View>
            <View style={styles.flashTitleRow}>
              <Text style={styles.flashIcon}>⚡</Text>

              <Text style={styles.sectionTitle}>
                Flash Deals
              </Text>
            </View>

            <Text style={styles.sectionSubtitle}>
              Limited-time discounts you might love
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(app)/(tabs)/search')}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {flashDeals.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.flashDealsList}
          >
            {flashDeals.map((product) =>
              renderProductCard(product, true),
            )}
          </ScrollView>
        ) : (
          <View style={styles.emptyDealsContainer}>
            <Text style={styles.emptyText}>
              No flash deals available right now.
            </Text>
          </View>
        )}
      </View>

      {/* Recommended Products */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Recommended for You
            </Text>

            <Text style={styles.sectionSubtitle}>
              Products worth checking out
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(app)/(tabs)/search')}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {recommendedProducts.length > 0 ? (
          <View style={styles.productGrid}>
            {recommendedProducts.map((product) =>
              renderProductCard(product),
            )}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No products found.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}
