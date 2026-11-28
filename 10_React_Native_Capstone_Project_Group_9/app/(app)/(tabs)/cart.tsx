import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, IconButton, Portal, Snackbar, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useCurrencyFormatter } from '@/hooks/useCurrency';
import type { CartItem } from '@/types/product';
import { styles } from './cartStyles';

export default function CartScreen() {
  const router = useRouter();
  const formatPrice = useCurrencyFormatter();
  const { user } = useAuth();
  const {
    items,
    itemCount,
    isLoading,
    error,
    subtotal,
    productDiscount,
    couponDiscount,
    couponCode,
    total,
    updateQuantity,
    removeItem,
    applyCoupon,
    clearCoupon,
    clearError,
  } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [cartNotice, setCartNotice] = useState('');

  const handleRemove = (item: CartItem) => {
    removeItem(item.productId);
    setCartNotice(`${item.title} was removed from your cart.`);
  };

  const handleApplyCoupon = () => {
    clearError();
    applyCoupon(couponInput);
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const discountedPrice = item.price * (1 - item.discountPercentage / 100);
    return (
      <View style={styles.cartItem}>
        <Image source={{ uri: item.thumbnail }} style={styles.itemImage} resizeMode="contain" />
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.itemPriceRow}>
            <Text style={styles.itemCurrentPrice}>{formatPrice(discountedPrice)}</Text>
            {item.discountPercentage > 0 ? (
              <Text style={styles.itemOriginalPrice}>{formatPrice(item.price)}</Text>
            ) : null}
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
          iconColor="#A66A5C"
          onPress={() => handleRemove(item)}
          accessibilityLabel={`Remove ${item.title}`}
        />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#708066" />
        <Text style={styles.loadingText}>Loading cart...</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="cart-outline" size={80} color="#C9C0B1" />
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptyText}>Add some products to get started</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Button
            mode="contained"
            onPress={() => router.push('/(app)/(tabs)/search')}
            style={styles.browseButton}
            contentStyle={styles.buttonContent}
          >
            Continue Shopping
          </Button>
        </View>
        <Snackbar
          visible={Boolean(cartNotice)}
          onDismiss={() => setCartNotice('')}
          duration={2500}
        >
          {cartNotice}
        </Snackbar>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.productId)}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Shopping Cart ({itemCount} items)</Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        }
        ListFooterComponent={
          <View style={styles.couponContainer}>
            <Text style={styles.couponTitle}>Coupon code</Text>
            <Text style={styles.couponHelp}>Try SAVE10 or WELCOME15. Coupons are applied in this app.</Text>
            <View style={styles.couponInputRow}>
              <TextInput
                mode="outlined"
                value={couponInput}
                onChangeText={setCouponInput}
                placeholder="Enter code"
                autoCapitalize="characters"
                style={styles.couponInput}
                accessibilityLabel="Coupon code"
              />
              {couponCode ? (
                <Button mode="outlined" onPress={() => { clearCoupon(); setCouponInput(''); }}>
                  Remove
                </Button>
              ) : (
                <Button mode="contained" onPress={handleApplyCoupon} disabled={!couponInput.trim()}>
                  Apply
                </Button>
              )}
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        }
      />

      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
        </View>
        {productDiscount > 0 ? (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Product discounts</Text>
            <Text style={styles.discountValue}>-{formatPrice(productDiscount)}</Text>
          </View>
        ) : null}
        {couponDiscount > 0 ? (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Coupon ({couponCode})</Text>
            <Text style={styles.discountValue}>-{formatPrice(couponDiscount)}</Text>
          </View>
        ) : null}
        <View style={styles.summaryRowDivider} />
        <View style={styles.summaryRowTotal}>
          <Text style={styles.summaryLabelTotal}>Total</Text>
          <Text style={styles.summaryValueTotal}>{formatPrice(total)}</Text>
        </View>
        <Button
          mode="contained"
          onPress={() => router.push('/(app)/checkout')}
          style={styles.checkoutButton}
          contentStyle={styles.buttonContent}
          disabled={!user}
        >
          Checkout
        </Button>
      </View>

      <Portal>
        <Snackbar
          visible={Boolean(cartNotice)}
          onDismiss={() => setCartNotice('')}
          duration={2500}
          action={{ label: 'Dismiss', onPress: () => setCartNotice('') }}
        >
          {cartNotice}
        </Snackbar>
      </Portal>
    </View>
  );
}
