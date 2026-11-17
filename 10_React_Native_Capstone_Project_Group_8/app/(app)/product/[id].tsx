
/**
 * Product Details Screen
 * Features:
 * - Dynamic light/dark theme
 * - Product image gallery
 * - Product information and specifications
 * - Wishlist functionality
 * - Quantity selector
 * - Add to cart
 * - Customer reviews
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Button,
  IconButton,
  MD3Theme,
  Text,
  useTheme,
} from 'react-native-paper';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { Product } from '@/types/product';
import { cartStorage, favoritesStorage } from '@/utils/storage';

const showBrowserAlert = (message: string): void => {
  const browser = globalThis as typeof globalThis & {
    alert?: (message: string) => void;
  };

  browser.alert?.(message);
};

const createStyles = (colors: MD3Theme['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.onBackground,
    },
    imageContainer: {
      position: 'relative',
      width: '100%',
      height: 280,
      borderRadius: 20,
      backgroundColor: colors.surfaceVariant,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    mainImage: {
      width: '100%',
      height: '100%',
    },
    favoriteButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: colors.surface,
    },
    discountBadge: {
      position: 'absolute',
      top: 14,
      left: 14,
      backgroundColor: colors.error,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    discountText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    thumbnailList: {
      flexDirection: 'row',
      marginTop: 12,
      gap: 10,
    },
    thumbnail: {
      width: 65,
      height: 65,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.outlineVariant,
      overflow: 'hidden',
    },
    selectedThumbnail: {
      borderColor: colors.primary,
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
    },
    category: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginTop: 22,
    },
    title: {
      color: colors.onBackground,
      fontSize: 25,
      fontWeight: '800',
      marginTop: 6,
    },
    brand: {
      color: colors.onSurfaceVariant,
      fontSize: 14,
      marginTop: 5,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      gap: 6,
    },
    rating: {
      color: colors.onBackground,
      fontWeight: '700',
    },
    mutedText: {
      color: colors.onSurfaceVariant,
      fontSize: 13,
    },
    stockBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primaryContainer,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      marginTop: 14,
    },
    stockText: {
      color: colors.onPrimaryContainer,
      fontSize: 12,
      fontWeight: '700',
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 18,
    },
    price: {
      color: colors.primary,
      fontSize: 28,
      fontWeight: '800',
    },
    originalPrice: {
      color: colors.onSurfaceVariant,
      fontSize: 15,
      textDecorationLine: 'line-through',
    },
    description: {
      color: colors.onSurfaceVariant,
      fontSize: 14,
      lineHeight: 22,
      marginTop: 14,
    },
    section: {
      marginTop: 26,
    },
    sectionTitle: {
      color: colors.onBackground,
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 12,
    },
    quantityCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      marginTop: 22,
    },
    quantityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    quantityControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    quantityButton: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 10,
    },
    quantity: {
      color: colors.onSurface,
      fontSize: 18,
      fontWeight: '800',
    },
    subtotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.outlineVariant,
    },
    subtotalLabel: {
      color: colors.onSurfaceVariant,
      fontSize: 14,
    },
    subtotal: {
      color: colors.onSurface,
      fontSize: 17,
      fontWeight: '800',
    },
    actionButton: {
      marginTop: 18,
      borderRadius: 12,
    },
    wishlistButton: {
      marginTop: 10,
      borderRadius: 12,
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 15,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      gap: 12,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    infoLabel: {
      color: colors.onSurfaceVariant,
      fontSize: 13,
      flex: 1,
    },
    infoValue: {
      color: colors.onSurface,
      fontSize: 13,
      fontWeight: '600',
      flex: 1,
      textAlign: 'right',
    },
    reviewCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 15,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      marginBottom: 10,
    },
    reviewName: {
      color: colors.onSurface,
      fontWeight: '700',
      fontSize: 14,
    },
    reviewRating: {
      color: colors.primary,
      fontWeight: '700',
      marginTop: 5,
      fontSize: 13,
    },
    reviewComment: {
      color: colors.onSurfaceVariant,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 8,
    },
    reviewDate: {
      color: colors.onSurfaceVariant,
      fontSize: 11,
      marginTop: 8,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    errorText: {
      color: colors.error,
      textAlign: 'center',
      fontSize: 15,
      marginBottom: 16,
    },
    loadingText: {
      color: colors.onSurfaceVariant,
      marginTop: 12,
    },
  });

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  const theme = useTheme<MD3Theme>();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const styles = useMemo(
    () => createStyles(theme.colors),
    [theme.colors],
  );

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState('');
  const [adding, setAdding] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError('');

        if (!id || !/^\d+$/.test(id)) {
          throw new Error('Invalid product ID.');
        }

        const response = await fetch(
          `https://dummyjson.com/products/${id}`,
        );

        if (!response.ok) {
          throw new Error('Unable to load this product.');
        }

        const data: Product = await response.json();

        if (!mounted) return;

        setProduct(data);
        setSelectedImage(data.thumbnail || data.images[0] || '');
        setQuantity(1);

        try {
          const favoriteIds = await favoritesStorage.getIds();

          if (mounted) {
            setIsFavorite(favoriteIds.includes(data.id));
          }
        } catch {
          if (mounted) {
            setIsFavorite(false);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Something went wrong while loading the product.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      mounted = false;
    };
  }, [id]);

  const discountedPrice = product
    ? product.price * (1 - product.discountPercentage / 100)
    : 0;

  const subtotal = discountedPrice * quantity;

  const handleQuantityChange = (change: number) => {
    if (!product) return;

    setQuantity((current) => {
      return Math.max(1, Math.min(product.stock, current + change));
    });
  };

  const handleFavorite = async () => {
    if (!product) return;

    try {
      const added = await favoritesStorage.toggleId(product.id);
      setIsFavorite(added);

      const message = added
        ? 'Product added to your wishlist.'
        : 'Product removed from your wishlist.';

      if (Platform.OS === 'web') {
        showBrowserAlert(message);
      } else {
        const { Alert } = require('react-native');
        Alert.alert('Wishlist Updated', message);
      }
    } catch {
      if (Platform.OS === 'web') {
        showBrowserAlert('Unable to update your wishlist.');
      } else {
        const { Alert } = require('react-native');
        Alert.alert('Error', 'Unable to update your wishlist.');
      }
    }
  };

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0 || adding) return;

    try {
      setAdding(true);

      const existingItems = await cartStorage.getCart();
      const existingItem = existingItems.find(
        (item) => item.productId === product.id,
      );

      if (existingItem && existingItem.quantity + quantity > product.stock) {
        const message = `Only ${product.stock} item(s) are available in stock. Your cart already contains ${existingItem.quantity}.`;

        if (Platform.OS === 'web') {
          showBrowserAlert(message);
        } else {
          const { Alert } = require('react-native');
          Alert.alert('Stock Limit', message);
        }

        return;
      }

      await cartStorage.addItem({
        productId: product.id,
        title: product.title,
        thumbnail: product.thumbnail,
        price: product.price,
        discountPercentage: product.discountPercentage,
        quantity,
        stock: product.stock,
      });

      const message = 'Product successfully added to your cart!';

      if (Platform.OS === 'web') {
        showBrowserAlert(message);
      } else {
        const { Alert } = require('react-native');
        Alert.alert('Added to Cart', message);
      }
    } catch {
      const message = 'Unable to add this product to your cart. Please try again.';

      if (Platform.OS === 'web') {
        showBrowserAlert(message);
      } else {
        const { Alert } = require('react-native');
        Alert.alert('Error', message);
      }
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error || 'Product not found.'}
        </Text>
        <Button mode="contained" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }

  const images = product.images?.length
    ? product.images
    : [product.thumbnail];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Product Details',
          headerShown: false,
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={theme.colors.onBackground}
            onPress={() => router.back()}
          />

          <Text style={styles.headerTitle}>Product Details</Text>

          <IconButton
            icon="cart-outline"
            size={24}
            iconColor={theme.colors.onBackground}
            onPress={() => router.push('/(app)/(tabs)/cart')}
          />
        </View>

        <View style={styles.imageContainer}>
          {selectedImage ? (
            <Image
              source={{ uri: selectedImage }}
              style={styles.mainImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.mutedText}>No image available</Text>
          )}

          {product.discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {Math.round(product.discountPercentage)}% OFF
              </Text>
            </View>
          )}

          <IconButton
            icon={isFavorite ? 'heart' : 'heart-outline'}
            iconColor={isFavorite ? theme.colors.error : theme.colors.primary}
            size={25}
            style={styles.favoriteButton}
            onPress={handleFavorite}
          />
        </View>

        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailList}
          >
            {images.map((image, index) => (
              <TouchableOpacity
                key={`${image}-${index}`}
                style={[
                  styles.thumbnail,
                  selectedImage === image && styles.selectedThumbnail,
                ]}
                onPress={() => setSelectedImage(image)}
              >
                <Image
                  source={{ uri: image }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={styles.category}>{product.category}</Text>

        <Text style={styles.title}>{product.title}</Text>

        {product.brand && (
          <Text style={styles.brand}>Brand: {product.brand}</Text>
        )}

        <View style={styles.ratingRow}>
          <Text style={styles.rating}>★ {product.rating.toFixed(1)}</Text>
          <Text style={styles.mutedText}>
            Customer rating
          </Text>
        </View>

        <View style={styles.stockBadge}>
          <Text style={styles.stockText}>
            {product.stock > 0
              ? `${product.stock} items available`
              : 'Out of stock'}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            ${discountedPrice.toFixed(2)}
          </Text>

          {product.discountPercentage > 0 && (
            <Text style={styles.originalPrice}>
              ${product.price.toFixed(2)}
            </Text>
          )}
        </View>

        <Text style={styles.description}>
          {product.description}
        </Text>

        <View style={styles.quantityCard}>
          <View style={styles.quantityRow}>
            <View>
              <Text style={styles.sectionTitle}>Quantity</Text>
              <Text style={styles.mutedText}>
                Select how many you want
              </Text>
            </View>

            <View style={styles.quantityControls}>
              <IconButton
                icon="minus"
                size={20}
                mode="contained"
                containerColor={theme.colors.surfaceVariant}
                iconColor={theme.colors.onSurface}
                disabled={quantity <= 1}
                onPress={() => handleQuantityChange(-1)}
              />

              <Text style={styles.quantity}>{quantity}</Text>

              <IconButton
                icon="plus"
                size={20}
                mode="contained"
                containerColor={theme.colors.surfaceVariant}
                iconColor={theme.colors.onSurface}
                disabled={quantity >= product.stock}
                onPress={() => handleQuantityChange(1)}
              />
            </View>
          </View>

          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Subtotal</Text>
            <Text style={styles.subtotal}>
              ${subtotal.toFixed(2)}
            </Text>
          </View>

          {product.minimumOrderQuantity > 1 && (
            <Text style={[styles.mutedText, { marginTop: 10 }]}>
              Minimum order quantity: {product.minimumOrderQuantity}
            </Text>
          )}
        </View>

        <Button
          mode="contained"
          icon="cart-plus"
          loading={adding}
          disabled={adding || product.stock <= 0}
          style={styles.actionButton}
          contentStyle={{ paddingVertical: 7 }}
          onPress={handleAddToCart}
        >
          {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
        </Button>

        <Button
          mode="outlined"
          icon={isFavorite ? 'heart' : 'heart-outline'}
          textColor={theme.colors.primary}
          style={styles.wishlistButton}
          contentStyle={{ paddingVertical: 5 }}
          onPress={handleFavorite}
        >
          {isFavorite ? 'Remove from Wishlist' : 'Add to Wishlist'}
        </Button>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Specifications</Text>

          <View style={styles.infoCard}>
            <InfoRow label="SKU" value={product.sku} />
            <InfoRow label="Category" value={product.category} />
            <InfoRow
              label="Availability"
              value={product.availabilityStatus}
            />
            <InfoRow
              label="Weight"
              value={`${product.weight} g`}
            />
            <InfoRow
              label="Dimensions"
              value={`${product.dimensions.width} × ${product.dimensions.height} × ${product.dimensions.depth} cm`}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery and Warranty</Text>

          <View style={styles.infoCard}>
            <InfoRow
              label="Shipping"
              value={product.shippingInformation}
            />
            <InfoRow
              label="Warranty"
              value={product.warrantyInformation}
            />
            <InfoRow
              label="Return Policy"
              value={product.returnPolicy}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Customer Reviews ({product.reviews.length})
          </Text>

          {product.reviews.length > 0 ? (
            product.reviews.map((review, index) => (
              <View
                key={`${review.reviewerName}-${index}`}
                style={styles.reviewCard}
              >
                <Text style={styles.reviewName}>
                  {review.reviewerName}
                </Text>

                <Text style={styles.reviewRating}>
                  ★ {review.rating}/5
                </Text>

                <Text style={styles.reviewComment}>
                  {review.comment}
                </Text>

                <Text style={styles.reviewDate}>
                  {new Date(review.date).toLocaleDateString()}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.mutedText}>
              No customer reviews available yet.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
