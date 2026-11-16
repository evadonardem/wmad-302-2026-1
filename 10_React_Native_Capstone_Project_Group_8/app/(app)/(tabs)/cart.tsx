
/**
 * Cart Screen - Marketplace
 * Loads and manages cart items using AsyncStorage.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button, IconButton } from 'react-native-paper';
import type { CartItem } from '@/types/product';
import { cartStorage } from '@/utils/storage';
import { styles } from './cartStyles';

export default function CartScreen() {
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCart = async () => {
    try {
      setLoading(true);
      const savedItems = await cartStorage.getCart();
      setItems(savedItems);
    } catch {
      Alert.alert('Error', 'Unable to load your cart.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, []),
  );

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

  const removeItem = (productId: number, title: string) => {
    Alert.alert(
      'Remove Product',
      `Are you sure you want to remove "${title}" from your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await cartStorage.removeItem(productId);
              await loadCart();
            } catch {
              Alert.alert(
                'Error',
                'Unable to remove this product.',
              );
            }
          },
        },
      ],
    );
  };

  const handleCheckout = () => {
    Alert.alert(
      'Checkout',
      'Your cart is ready! Checkout functionality will be implemented in the next step.',
    );
  };

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

          <View style={styles.quantityControls}>
            <IconButton
              icon="minus"
              size={18}
              mode="outlined"
              onPress={() =>
                updateQuantity(item.productId, item.quantity - 1)
              }
            />

            <Text style={styles.quantityText}>
              {item.quantity}
            </Text>

            <IconButton
              icon="plus"
              size={18}
              mode="outlined"
              disabled={item.quantity >= item.stock}
              onPress={() =>
                updateQuantity(item.productId, item.quantity + 1)
              }
            />

            <IconButton
              icon="delete-outline"
              size={20}
              iconColor="#EA4335"
              onPress={() =>
                removeItem(item.productId, item.title)
              }
            />
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A73E8" />
        <Text style={styles.loadingText}>
          Loading your cart...
        </Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <IconButton
            icon="cart-outline"
            size={65}
            iconColor="#9E9E9E"
          />

          <Text style={styles.emptyTitle}>
            Your Cart is Empty
          </Text>

          <Text style={styles.emptyText}>
            You haven&apos;t added any products to your cart yet.
            Explore our marketplace and find something you love!
          </Text>

          <Button
            mode="contained"
            onPress={() => router.push('/(app)/(tabs)/home')}
            style={styles.browseButton}
            contentStyle={styles.buttonContent}
          >
            Continue Shopping
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          My Cart ({totalQuantity} items)
        </Text>
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
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>
            ${subtotal.toFixed(2)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Discount</Text>
          <Text style={styles.discountValue}>
            -${totalDiscount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.summaryRowDivider} />

        <View style={styles.summaryRowTotal}>
          <Text style={styles.summaryLabelTotal}>Total</Text>
          <Text style={styles.summaryValueTotal}>
            ${discountedTotal.toFixed(2)}
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={handleCheckout}
          style={styles.checkoutButton}
          contentStyle={styles.buttonContent}
        >
          Proceed to Checkout
        </Button>
      </View>
    </View>
  );
}
