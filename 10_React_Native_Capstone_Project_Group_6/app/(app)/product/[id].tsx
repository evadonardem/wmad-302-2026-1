import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Badge, Button, Card, Divider, Text } from 'react-native-paper';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { useSnackbar } from '@/components/SnackbarProvider';
import { spacing, useAppTheme } from '@/constants/theme';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { productApi } from '@/services/productApi';
import type { Product } from '@/types/product';
import { getErrorMessage } from '@/utils/errors';
import { formatCategoryName, formatCurrency } from '@/utils/format';
import { routes } from '@/utils/routes';

export default function ProductDetailsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const routeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { addItem, items: cartItems, totalQuantity } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const { show } = useSnackbar();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const productId = Number(routeId);

    if (!routeId || !/^\d+$/.test(routeId) || !Number.isSafeInteger(productId) || productId <= 0) {
      setProduct(null);
      setError('Product not found.');
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);
    productApi.getProductById(productId)
      .then((result) => {
        if (!active) return;
        setProduct(result);
        setSelectedImage(result.images?.[0] || result.thumbnail);
      })
      .catch((caught: unknown) => {
        if (active) setError(getErrorMessage(caught, 'Could not load product.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [routeId, reloadKey]);

  if (loading) {
    return (
      <Screen>
        <LoadingState message="Loading product..." />
      </Screen>
    );
  }

  if (error || !product) {
    return (
      <Screen>
        <ErrorState
          message={error ?? 'Product not found.'}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      </Screen>
    );
  }

  const images = product.images.length > 0 ? product.images : [product.thumbnail];
  const discountedPrice = product.price * (1 - product.discountPercentage / 100);
  const wishlisted = isWishlisted(product.id);
  const cartItem = cartItems.find((item) => item.productId === product.id);
  const isAtStockLimit = Boolean(cartItem && cartItem.quantity >= product.stock);

  const handleAddToCart = () => {
    const result = addItem(product);
    show(result.message);
  };

  const handleToggleWishlist = () => {
    show(toggle(product) ? 'Saved to your wishlist.' : 'Removed from your wishlist.');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.hero, { backgroundColor: theme.colors.surface }]}>
          <Image
            source={{ uri: selectedImage || product.thumbnail }}
            style={styles.heroImage}
            resizeMode="contain"
            accessibilityLabel={product.title}
          />
          {cartItem ? (
            <Pressable
              style={[styles.cartShortcut, { backgroundColor: theme.colors.surface }]}
              onPress={() => router.push(routes.cart)}
              accessibilityRole="button"
              accessibilityLabel={`View cart, ${totalQuantity} ${totalQuantity === 1 ? 'item' : 'items'}`}
            >
              <MaterialCommunityIcons name="cart" size={22} color={theme.colors.primary} />
              <Badge style={styles.cartBadge}>{totalQuantity}</Badge>
            </Pressable>
          ) : null}
        </View>

        {images.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
            {images.map((image, index) => (
              <Pressable
                key={`${image}-${index}`}
                style={[
                  styles.thumbnail,
                  { borderColor: image === selectedImage ? theme.colors.primary : theme.colors.outline },
                ]}
                onPress={() => setSelectedImage(image)}
                accessibilityRole="button"
                accessibilityLabel={`View product image ${index + 1}`}
              >
                <Image source={{ uri: image }} style={styles.thumbnailImage} resizeMode="contain" />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.details}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {formatCategoryName(product.category)}
            {product.brand ? ` · ${product.brand}` : ''}
          </Text>
          <Text variant="headlineSmall">{product.title}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            ★ {product.rating.toFixed(1)} · {product.availabilityStatus}
          </Text>

          <View style={styles.price}>
            <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
              {formatCurrency(discountedPrice)}
            </Text>
            {product.discountPercentage > 0 ? (
              <Text variant="bodyMedium" style={styles.originalPrice}>
                {formatCurrency(product.price)}
              </Text>
            ) : null}
          </View>

          <Text variant="bodyMedium">{product.description}</Text>
          <Text
            variant="bodySmall"
            style={{ color: product.stock > 0 ? theme.colors.tertiary : theme.colors.error }}
          >
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </Text>

          <View style={styles.actions}>
            <Button
              mode="contained"
              icon={cartItem ? 'check' : 'cart-plus'}
              onPress={handleAddToCart}
              disabled={product.stock <= 0 || isAtStockLimit}
              style={styles.actionButton}
            >
              {cartItem ? 'Added to cart' : 'Add to cart'}
            </Button>
            <Button
              mode="outlined"
              icon={wishlisted ? 'heart' : 'heart-outline'}
              onPress={handleToggleWishlist}
              style={styles.actionButton}
            >
              {wishlisted ? 'Saved' : 'Wishlist'}
            </Button>
          </View>

          <Card mode="outlined" style={styles.infoCard}>
            <Card.Content style={styles.infoContent}>
              <Text variant="titleSmall">Shipping</Text>
              <Text variant="bodyMedium">{product.shippingInformation}</Text>
              <Divider />
              <Text variant="titleSmall">Returns and warranty</Text>
              <Text variant="bodyMedium">{product.returnPolicy}</Text>
              <Text variant="bodyMedium">{product.warrantyInformation}</Text>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  hero: { height: 320, borderRadius: 12, overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  cartShortcut: { position: 'absolute', top: spacing.sm, right: spacing.sm, padding: spacing.sm, borderRadius: 24 },
  cartBadge: { position: 'absolute', top: -4, right: -4 },
  gallery: { gap: spacing.sm },
  thumbnail: { width: 64, height: 64, borderWidth: 1, borderRadius: 8, padding: 3 },
  thumbnailImage: { width: '100%', height: '100%' },
  details: { gap: spacing.sm },
  price: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  originalPrice: { textDecorationLine: 'line-through', opacity: 0.6 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.sm },
  actionButton: { flexGrow: 1 },
  infoCard: { marginTop: spacing.sm },
  infoContent: { gap: spacing.sm },
});
