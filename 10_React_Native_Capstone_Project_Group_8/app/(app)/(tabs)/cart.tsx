
/**
 * Cart Screen - Marketplace
 * Manages cart items using AsyncStorage.
 * Supports item removal on Web, Android, and iOS.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Button,
  IconButton,
  useTheme,
  type MD3Theme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { CartItem } from '@/types/product';
import { cartStorage } from '@/utils/storage';
import { createCartStyles } from './cartStyles';

/**
 * Browser confirmation and alert helpers.
 * Avoids TypeScript errors when using browser dialogs.
 */
const showBrowserConfirm = (message: string): boolean => {
  const browser = globalThis as typeof globalThis & {
    confirm?: (message: string) => boolean;
  };

  return browser.confirm ? browser.confirm(message) : false;
};

const showBrowserAlert = (message: string): void => {
  const browser = globalThis as typeof globalThis & {
    alert?: (message: string) => void;
  };

  browser.alert?.(message);
};

export default function CartScreen() {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const colors = theme.colors;
  const styles = createCartStyles(colors);

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Loads cart items from AsyncStorage.
   */
  const loadCart = useCallback(async () => {
    try {
      setLoading(true);

      const savedItems = await cartStorage.getCart();
      setItems(savedItems);
    } catch {
      Alert.alert('Error', 'Unable to load your cart.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [loadCart]),
  );

  /**
   * Calculates cart totals.
   */
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const discountedTotal = items.reduce(
    (total, item) =>
      total +
      item.price *
        (1 - item.discountPercentage / 100) *
        item.quantity,
    0,
  );

  const totalDiscount = subtotal - discountedTotal;

  const totalQuantity = items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  /**
   * Updates the quantity of a cart item.
   */
  const updateQuantity = async (
    productId: number,
    newQuantity: number,
  ) => {
    try {
      const item = items.find(
        (cartItem) => cartItem.productId === productId,
      );

      if (!item) return;

      if (newQuantity <= 0) {
        await cartStorage.removeItem(productId);
      } else {
        await cartStorage.updateQuantity(
          productId,
          Math.min(newQuantity, item.stock),
        );
      }

      await loadCart();
    } catch {
      Alert.alert('Error', 'Unable to update the cart.');
    }
  };

  /**
   * Removes a product from the cart
   * and immediately refreshes the displayed items.
   */
  const performRemoveItem = async (productId: number) => {
    try {
      await cartStorage.removeItem(productId);

      const updatedItems = await cartStorage.getCart();
      setItems(updatedItems);
    } catch {
      if (Platform.OS === 'web') {
        showBrowserAlert(
          'Unable to remove this product. Please try again.',
        );
      } else {
        Alert.alert(
          'Error',
          'Unable to remove this product.',
        );
      }
    }
  };

  /**
   * Uses the correct confirmation dialog for each platform.
   */
  const removeItem = (productId: number, title: string) => {
    const message = `Are you sure you want to remove "${title}" from your cart?`;

    // Browser confirmation for React Native Web.
    if (Platform.OS === 'web') {
      const confirmed = showBrowserConfirm(message);

      if (confirmed) {
        void performRemoveItem(productId);
      }

      return;
    }

    // Native confirmation for Android and iOS.
    Alert.alert(
      'Remove Product',
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void performRemoveItem(productId);
          },
        },
      ],
    );
  };

  /**
   * Checkout placeholder.
   */
  const handleCheckout = () => {
    Alert.alert(
      'Checkout',
      'Your cart is ready! Checkout functionality will be implemented in the next step.',
    );
  };

  /**
   * Renders each cart item.
   */
  const renderItem = ({ item }: { item: CartItem }) => {
    const itemDiscountedPrice =
      item.price * (1 - item.discountPercentage / 100);

    return (
      <View style={styles.cartItem}>
        <Image
          source={{ uri: item.thumbnail }}
          style={styles.itemImage}
          resizeMode="contain"
        />

        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.itemPriceRow}>
            <Text style={styles.itemCurrentPrice}>
              ${itemDiscountedPrice.toFixed(2)}
            </Text>

            {item.discountPercentage > 0 && (
              <Text style={styles.itemOriginalPrice}>
                ${item.price.toFixed(2)}
              </Text>
            )}
          </View>

          <View style={styles.itemBottomRow}>
            <View style={styles.quantityControls}>
              <IconButton
                icon="minus"
                size={16}
                mode="outlined"
                containerColor={colors.surface}
                iconColor={colors.onSurface}
                disabled={item.quantity <= 1}
                onPress={() =>
                  updateQuantity(
                    item.productId,
                    item.quantity - 1,
                  )
                }
                accessibilityLabel="Decrease quantity"
              />

              <Text style={styles.quantityText}>
                {item.quantity}
              </Text>

              <IconButton
                icon="plus"
                size={16}
                mode="outlined"
                containerColor={colors.surface}
                iconColor={colors.primary}
                disabled={item.quantity >= item.stock}
                onPress={() =>
                  updateQuantity(
                    item.productId,
                    item.quantity + 1,
                  )
                }
                accessibilityLabel="Increase quantity"
              />
            </View>

            <TouchableOpacity
              style={styles.removeButton}
              onPress={() =>
                removeItem(item.productId, item.title)
              }
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.title}`}
            >
              <MaterialCommunityIcons
                name="delete-outline"
                size={20}
                color={colors.error}
              />
            </TouchableOpacity>
          </View>

          {item.quantity >= item.stock && (
            <Text style={styles.stockNotice}>
              Maximum available quantity reached
            </Text>
          )}
        </View>
      </View>
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
          color={colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading your cart...
        </Text>
      </View>
    );
  }

  /**
   * Empty cart screen.
   */
  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <MaterialCommunityIcons
              name="cart-outline"
              size={58}
              color={colors.primary}
            />
          </View>

          <Text style={styles.emptyTitle}>
            Your Cart is Empty
          </Text>

          <Text style={styles.emptyText}>
            You haven&apos;t added any products to your cart yet.
            Explore our marketplace and find something you love!
          </Text>

          <Button
            mode="contained"
            onPress={() =>
              router.push('/(app)/(tabs)/home')
            }
            style={styles.browseButton}
            contentStyle={styles.buttonContent}
            icon="shopping-outline"
          >
            Continue Shopping
          </Button>
        </View>
      </View>
    );
  }

  /**
   * Main cart screen.
   */
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>
            YOUR SHOPPING BAG
          </Text>

          <Text style={styles.headerTitle}>
            My Cart
          </Text>

          <Text style={styles.headerSubtitle}>
            {totalQuantity}{' '}
            {totalQuantity === 1 ? 'item' : 'items'} in your cart
          </Text>
        </View>

        <View style={styles.headerIconContainer}>
          <MaterialCommunityIcons
            name="cart-check"
            size={28}
            color={colors.primary}
          />
        </View>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.productId.toString()}
        ItemSeparatorComponent={() => (
          <View style={styles.separator} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.summaryContainer}>
        <View style={styles.summaryHeading}>
          <Text style={styles.summaryTitle}>
            Order Summary
          </Text>

          <Text style={styles.summaryItemCount}>
            {totalQuantity}{' '}
            {totalQuantity === 1 ? 'item' : 'items'}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Subtotal
          </Text>

          <Text style={styles.summaryValue}>
            ${subtotal.toFixed(2)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Discount
          </Text>

          <Text style={styles.discountValue}>
            -${totalDiscount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.summaryRowDivider} />

        <View style={styles.summaryRowTotal}>
          <Text style={styles.summaryLabelTotal}>
            Total
          </Text>

          <Text style={styles.summaryValueTotal}>
            ${discountedTotal.toFixed(2)}
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={handleCheckout}
          style={styles.checkoutButton}
          contentStyle={styles.checkoutButtonContent}
          icon="arrow-right"
        >
          Proceed to Checkout
        </Button>

        <View style={styles.secureCheckout}>
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={15}
            color={colors.onSurfaceVariant}
          />

          <Text style={styles.secureCheckoutText}>
            Secure checkout experience
          </Text>
        </View>
      </View>
    </View>
  );
}
