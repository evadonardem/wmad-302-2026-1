/**
 * Cart Screen - Marketplace
 * TODO: Students implement
 * - Cart state management (Context + useReducer)
 * - Add/remove/update quantities
 * - Persist cart to AsyncStorage
 * - Apply coupons/discounts
 * - Checkout flow (POST /carts)
 * - DummyJSON Carts API: https://dummyjson.com/docs/carts
 */
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Title, Button, IconButton, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './cartStyles';

interface CartItem {
  id: number;
  productId: number;
  title: string;
  thumbnail: string;
  price: number;
  discountPercentage: number;
  quantity: number;
  stock: number;
}

interface Cart {
  items: CartItem[];
  total: number;
  discountedTotal: number;
  totalProducts: number;
  totalQuantity: number;
}

export default function CartScreen() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  // TODO: Student implementation
  // 1. Load cart from AsyncStorage on mount
  // 2. Or fetch from DummyJSON: GET /carts/user/{userId}
  // 3. Implement quantity updates with persistence
  // 4. Implement checkout: POST /carts/add

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      // TODO: Load from AsyncStorage or API
      // const savedCart = await AsyncStorage.getItem('cart');
      // if (savedCart) setCart(JSON.parse(savedCart));
      // else setCart({ items: [], total: 0, discountedTotal: 0, totalProducts: 0, totalQuantity: 0 });

      // Mock empty cart for demo
      setCart({ items: [], total: 0, discountedTotal: 0, totalProducts: 0, totalQuantity: 0 });
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (!cart) return;
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }
    const item = cart.items.find((i) => i.productId === productId);
    if (item && newQuantity > item.stock) {
      Alert.alert('Out of Stock', `Only ${item.stock} items available`);
      return;
    }

    // TODO: Update AsyncStorage and state
    setCart((prev) => {
      if (!prev) return prev;
      const updatedItems = prev.items.map((i) =>
        i.productId === productId ? { ...i, quantity: newQuantity } : i
      );
      return calculateTotals({ ...prev, items: updatedItems });
    });
  };

  const removeItem = (productId: number) => {
    Alert.alert('Remove Item', 'Remove this item from cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setCart((prev) => {
            if (!prev) return prev;
            const updatedItems = prev.items.filter((i) => i.productId !== productId);
            return calculateTotals({ ...prev, items: updatedItems });
          });
        },
      },
    ]);
  };

  const calculateTotals = (cartData: Cart): Cart => {
    const total = cartData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountedTotal = cartData.items.reduce(
      (sum, item) => sum + item.price * (1 - item.discountPercentage / 100) * item.quantity,
      0
    );
    const totalProducts = cartData.items.length;
    const totalQuantity = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
    return { ...cartData, total, discountedTotal, totalProducts, totalQuantity };
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) return;

    // TODO: Student implementation
    // 1. Call POST /carts/add with userId and products
    // 2. Clear local cart on success
    // 3. Navigate to order confirmation

    Alert.alert(
      'Checkout',
      `Proceed to checkout?\nTotal: $${cart.discountedTotal.toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Place Order',
          onPress: () => {
            Alert.alert('TODO', 'Implement checkout: POST /carts/add');
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const discountedPrice = item.price * (1 - item.discountPercentage / 100);
    return (
      <View style={styles.cartItem}>
        <Image source={{ uri: item.thumbnail }} style={styles.itemImage} resizeMode="contain" />
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.itemPriceRow}>
            <Text style={styles.itemCurrentPrice}>${discountedPrice.toFixed(2)}</Text>
            {item.discountPercentage > 0 && (
              <Text style={styles.itemOriginalPrice}>${item.price.toFixed(2)}</Text>
            )}
          </View>
          <View style={styles.quantityControls}>
            <IconButton
              icon="minus"
              size={20}
              onPress={() => updateQuantity(item.productId, item.quantity - 1)}
              disabled={item.quantity <= 1}
              accessibilityLabel="Decrease quantity"
            />
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <IconButton
              icon="plus"
              size={20}
              onPress={() => updateQuantity(item.productId, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
              accessibilityLabel="Increase quantity"
            />
          </View>
        </View>
        <IconButton
          icon="delete-outline"
          size={24}
          iconColor="#EA4335"
          onPress={() => removeItem(item.productId)}
          accessibilityLabel="Remove item"
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A73E8" />
        <Text style={styles.loadingText}>Loading cart...</Text>
      </View>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <View style={styles.container}>
      {isEmpty ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="cart-outline" size={80} color="#DADCE0" />
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptyText}>Add some products to get started</Text>
          <Button
            mode="contained"
            onPress={() => router.push('/(app)/(tabs)/home')}
            style={styles.browseButton}
            contentStyle={styles.buttonContent}
          >
            <Text style={styles.buttonText}>Continue Shopping</Text>
          </Button>
        </View>
      ) : (
        <>
          <FlatList
            data={cart!.items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListHeaderComponent={
              <View style={styles.header}>
                <Title style={styles.headerTitle}>Shopping Cart ({cart!.totalQuantity} items)</Title>
              </View>
            }
          />

          {/* Order Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${cart!.total.toFixed(2)}</Text>
            </View>
            {cart!.total !== cart!.discountedTotal && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={styles.discountValue}>-${(cart!.total - cart!.discountedTotal).toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.summaryRowDivider} />
            <View style={styles.summaryRowTotal}>
              <Text style={styles.summaryLabelTotal}>Total</Text>
              <Text style={styles.summaryValueTotal}>${cart!.discountedTotal.toFixed(2)}</Text>
            </View>
            <Button
              mode="contained"
              onPress={handleCheckout}
              style={styles.checkoutButton}
              contentStyle={styles.buttonContent}
            >
              <Text style={styles.buttonText}>Checkout</Text>
            </Button>
          </View>
        </>
      )}

      {/* Student Guide */}
      <View style={styles.guideContainer}>
        <Text style={styles.guideTitle}>📝 Student Implementation Guide</Text>
        <Text style={styles.guideText}>
          Complete the cart functionality:\n
          1. Cart Context with useReducer (add, remove, update)\n
          2. Persist cart to AsyncStorage\n
          3. Sync with DummyJSON: GET/POST /carts\n
          4. Apply coupons (GET /carts/{'{id}'}/apply-coupon)\n
          5. Checkout flow with order confirmation
        </Text>
      </View>
    </View>
  );
}

import { Image } from 'react-native';