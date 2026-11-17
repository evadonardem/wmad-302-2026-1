
/**
 * Wishlist Screen - Marketplace
 *
 * Features:
 * - Load saved products using favoritesStorage
 * - Retrieve product details from DummyJSON
 * - Remove products from Wishlist
 * - Navigate to Product Details
 * - Refresh Wishlist when the screen is focused
 * - Dynamic light and dark theme support
 */

import React, { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, type MD3Theme } from 'react-native-paper';

import { favoritesStorage } from '@/utils/storage';

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

export default function FavoritesScreen() {
  const router = useRouter();
  const { colors } = useTheme<MD3Theme>();

  const styles = createStyles(colors);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState<number | null>(null);

  /**
   * Load saved products from local storage and DummyJSON.
   */
  const loadFavorites = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const favoriteIds = await favoritesStorage.getIds();

      if (favoriteIds.length === 0) {
        setProducts([]);
        return;
      }

      const productResponses = await Promise.all(
        favoriteIds.map(async (id) => {
          const response = await fetch(
            `https://dummyjson.com/products/${id}`,
          );

          if (!response.ok) {
            throw new Error(`Unable to load product ${id}.`);
          }

          return (await response.json()) as Product;
        }),
      );

      setProducts(productResponses);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load your Wishlist. Please try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * Reload the Wishlist whenever this screen becomes active.
   */
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async () => {
        try {
          setLoading(true);
          setError('');

          const favoriteIds = await favoritesStorage.getIds();

          if (!isActive) {
            return;
          }

          if (favoriteIds.length === 0) {
            setProducts([]);
            setLoading(false);
            return;
          }

          const productResponses = await Promise.all(
            favoriteIds.map(async (id) => {
              const response = await fetch(
                `https://dummyjson.com/products/${id}`,
              );

              if (!response.ok) {
                throw new Error(`Unable to load product ${id}.`);
              }

              return (await response.json()) as Product;
            }),
          );

          if (isActive) {
            setProducts(productResponses);
          }
        } catch (err) {
          if (isActive) {
            setError(
              err instanceof Error
                ? err.message
                : 'Unable to load your Wishlist.',
            );
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      void load();

      return () => {
        isActive = false;
      };
    }, []),
  );

  /**
   * Remove a product from the Wishlist.
   */
  const removeFavorite = async (productId: number) => {
    try {
      setRemovingId(productId);

      await favoritesStorage.removeId(productId);

      setProducts((previous) =>
        previous.filter((product) => product.id !== productId),
      );
    } catch {
      setError('Unable to remove this product. Please try again.');
    } finally {
      setRemovingId(null);
    }
  };

  /**
   * Open Product Details.
   */
  const openProduct = (productId: number) => {
    router.push(`/(app)/product/${productId}`);
  };

  /**
   * Format category names.
   */
  const formatCategory = (category: string) =>
    category
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  /**
   * Render a Wishlist product.
   */
  const renderProduct = (product: Product) => {
    const discountedPrice =
      product.price * (1 - product.discountPercentage / 100);

    const isRemoving = removingId === product.id;

    return (
      <View key={product.id} style={styles.productCard}>
        <TouchableOpacity
          style={styles.productMain}
          activeOpacity={0.85}
          onPress={() => openProduct(product.id)}
          disabled={isRemoving}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: product.thumbnail }}
              style={styles.productImage}
              resizeMode="contain"
            />

            {product.discountPercentage > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  -{Math.round(product.discountPercentage)}%
                </Text>
              </View>
            )}
          </View>

          <View style={styles.productInfo}>
            <Text style={styles.category} numberOfLines={1}>
              {formatCategory(product.category)}
            </Text>

            <Text style={styles.productTitle} numberOfLines={2}>
              {product.title}
            </Text>

            {product.brand ? (
              <Text style={styles.brand} numberOfLines={1}>
                {product.brand}
              </Text>
            ) : null}

            <View style={styles.priceRow}>
              <Text style={styles.currentPrice}>
                ${discountedPrice.toFixed(2)}
              </Text>

              {product.discountPercentage > 0 && (
                <Text style={styles.originalPrice}>
                  ${product.price.toFixed(2)}
                </Text>
              )}
            </View>

            <View style={styles.ratingRow}>
              <MaterialCommunityIcons
                name="star"
                size={15}
                color="#F5B301"
              />

              <Text style={styles.ratingText}>
                {product.rating.toFixed(1)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => openProduct(product.id)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="eye-outline"
              size={17}
              color={colors.primary}
            />

            <Text style={styles.viewButtonText}>
              View Product
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => void removeFavorite(product.id)}
            disabled={isRemoving}
            activeOpacity={0.8}
            accessibilityLabel={`Remove ${product.title} from Wishlist`}
          >
            {isRemoving ? (
              <ActivityIndicator
                size="small"
                color={colors.error}
              />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="heart-remove-outline"
                  size={17}
                  color={colors.error}
                />

                <Text style={styles.removeButtonText}>
                  Remove
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.eyebrow}>
            YOUR SAVED COLLECTION
          </Text>

          <Text style={styles.heading}>
            My Wishlist
          </Text>

          <Text style={styles.subtitle}>
            Keep track of products you love.
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <MaterialCommunityIcons
            name="heart"
            size={27}
            color={colors.primary}
          />
        </View>
      </View>

      {/* Wishlist Count */}
      <View style={styles.countContainer}>
        <View>
          <Text style={styles.countTitle}>
            Saved Products
          </Text>

          <Text style={styles.countSubtitle}>
            {products.length}{' '}
            {products.length === 1 ? 'product' : 'products'} in your Wishlist
          </Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countNumber}>
            {products.length}
          </Text>
        </View>
      </View>

      {/* Product List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadFavorites(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />

            <Text style={styles.loadingText}>
              Loading your Wishlist...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={58}
              color={colors.error}
            />

            <Text style={styles.emptyTitle}>
              Unable to load Wishlist
            </Text>

            <Text style={styles.emptySubtitle}>
              {error}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => void loadFavorites()}
              activeOpacity={0.85}
            >
              <Text style={styles.retryButtonText}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <MaterialCommunityIcons
                name="heart-outline"
                size={55}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              Your Wishlist is empty
            </Text>

            <Text style={styles.emptySubtitle}>
              Save products you love by tapping the heart icon
              on a product&apos;s details page.
            </Text>

            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.replace('/(app)/(tabs)/home')}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="shopping-outline"
                size={19}
                color={colors.onPrimary}
              />

              <Text style={styles.shopButtonText}>
                Explore Products
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.productsList}>
            {products.map(renderProduct)}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

/**
 * Theme-aware Wishlist styles.
 */
function createStyles(colors: MD3Theme['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 18,
    },

    headerTextContainer: {
      flex: 1,
      paddingRight: 12,
    },

    eyebrow: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.1,
      color: colors.primary,
      marginBottom: 7,
    },

    heading: {
      fontSize: 27,
      fontWeight: '800',
      color: colors.onBackground,
      letterSpacing: -0.6,
    },

    subtitle: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      marginTop: 5,
    },

    headerIcon: {
      width: 52,
      height: 52,
      borderRadius: 17,
      backgroundColor: colors.primaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
    },

    countContainer: {
      marginHorizontal: 18,
      marginBottom: 15,
      padding: 15,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    countTitle: {
      color: colors.onSurface,
      fontSize: 14,
      fontWeight: '800',
    },

    countSubtitle: {
      color: colors.onSurfaceVariant,
      fontSize: 11,
      marginTop: 4,
    },

    countBadge: {
      minWidth: 38,
      height: 38,
      paddingHorizontal: 8,
      borderRadius: 19,
      backgroundColor: colors.primaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
    },

    countNumber: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '800',
    },

    scrollView: {
      flex: 1,
    },

    scrollContent: {
      paddingHorizontal: 18,
      paddingBottom: 110,
    },

    productsList: {
      gap: 13,
    },

    productCard: {
      backgroundColor: colors.surface,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      overflow: 'hidden',
    },

    productMain: {
      flexDirection: 'row',
      padding: 11,
      gap: 12,
    },

    imageContainer: {
      width: 112,
      height: 125,
      borderRadius: 13,
      backgroundColor: colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 8,
      position: 'relative',
    },

    productImage: {
      width: '100%',
      height: '100%',
    },

    discountBadge: {
      position: 'absolute',
      top: 7,
      left: 7,
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 7,
      backgroundColor: colors.error,
    },

    discountText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '800',
    },

    productInfo: {
      flex: 1,
      justifyContent: 'center',
    },

    category: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'capitalize',
      marginBottom: 5,
    },

    productTitle: {
      color: colors.onSurface,
      fontSize: 14,
      fontWeight: '800',
      lineHeight: 19,
    },

    brand: {
      color: colors.onSurfaceVariant,
      fontSize: 10,
      marginTop: 4,
    },

    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 7,
      marginTop: 8,
    },

    currentPrice: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '800',
    },

    originalPrice: {
      color: colors.onSurfaceVariant,
      fontSize: 10,
      textDecorationLine: 'line-through',
    },

    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 7,
    },

    ratingText: {
      color: colors.onSurface,
      fontSize: 11,
      fontWeight: '700',
    },

    cardActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.outlineVariant,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 10,
    },

    viewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 5,
    },

    viewButtonText: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '700',
    },

    removeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 5,
    },

    removeButtonText: {
      color: colors.error,
      fontSize: 11,
      fontWeight: '700',
    },

    loadingContainer: {
      paddingVertical: 65,
      alignItems: 'center',
      justifyContent: 'center',
    },

    loadingText: {
      color: colors.onSurfaceVariant,
      fontSize: 13,
      marginTop: 13,
    },

    emptyState: {
      paddingHorizontal: 25,
      paddingVertical: 55,
      alignItems: 'center',
      justifyContent: 'center',
    },

    emptyIconContainer: {
      width: 95,
      height: 95,
      borderRadius: 48,
      backgroundColor: colors.primaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },

    emptyTitle: {
      color: colors.onSurface,
      fontSize: 19,
      fontWeight: '800',
      textAlign: 'center',
      marginTop: 15,
    },

    emptySubtitle: {
      color: colors.onSurfaceVariant,
      fontSize: 13,
      lineHeight: 20,
      textAlign: 'center',
      marginTop: 9,
      maxWidth: 280,
    },

    retryButton: {
      marginTop: 20,
      backgroundColor: colors.primary,
      paddingHorizontal: 25,
      paddingVertical: 12,
      borderRadius: 13,
    },

    retryButtonText: {
      color: colors.onPrimary,
      fontSize: 13,
      fontWeight: '800',
    },

    shopButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 23,
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 13,
      borderRadius: 13,
    },

    shopButtonText: {
      color: colors.onPrimary,
      fontSize: 13,
      fontWeight: '800',
    },

    bottomSpacing: {
      height: 20,
    },
  });
}
