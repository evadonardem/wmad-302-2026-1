import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Button,
  Card,
  Dialog,
  IconButton,
  Portal,
  RadioButton,
  Switch,
  TextInput,
} from 'react-native-paper';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useCurrencyFormatter } from '@/hooks/useCurrency';
import { productApi } from '@/services/productApi';
import { getSavedPaymentMethods } from '@/services/paymentStorage';
import { getStorageItem, setStorageItem } from '@/utils/storage';
import type { Product, CartItem } from '@/types/product';
import type { DeliveryAddress } from '@/types/address';
import type { OrderRecord } from '@/types/order';
import {
  getPaymentMethodLabel,
  getPaymentMethodName,
  getPaymentMethodType,
  PAYMENT_METHOD_OPTIONS,
  type OrderPaymentMethod,
  type SavedPaymentMethod,
} from '@/types/payment';
import { saveUserOrder } from '@/services/orderStorage';
import { styles } from './checkoutStyles';

const emptyAddress: Omit<DeliveryAddress, 'id'> = {
  label: 'Home',
  fullName: '',
  phone: '',
  street: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
  isDefault: false,
};

function itemFromProduct(product: Product): CartItem {
  return {
    productId: product.id,
    title: product.title,
    thumbnail: product.thumbnail,
    price: product.price,
    discountPercentage: product.discountPercentage,
    quantity: 1,
    stock: product.stock,
  };
}

export default function CheckoutScreen() {
  const router = useRouter();
  const formatPrice = useCurrencyFormatter();
  const { productId: routeProductId } = useLocalSearchParams<{ productId?: string | string[] }>();
  const productIdValue = Array.isArray(routeProductId) ? routeProductId[0] : routeProductId;
  const directProductId = productIdValue ? Number(productIdValue) : null;
  const isDirectOrder = productIdValue !== undefined;
  const { user } = useAuth();
  const { items: cartItems, couponCode, couponDiscount, clearCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(isDirectOrder);
  const [productError, setProductError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedPaymentOption, setSelectedPaymentOption] = useState('');
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  const [addressDialogVisible, setAddressDialogVisible] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressDraft, setAddressDraft] = useState<Omit<DeliveryAddress, 'id'>>(emptyAddress);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    if (!isDirectOrder || !directProductId || !Number.isInteger(directProductId)) {
      if (isDirectOrder) {
        setProductError('This product link is invalid.');
        setProductLoading(false);
      }
      return;
    }

    let active = true;
    setProductLoading(true);
    setProductError(null);
    productApi.getProductById(directProductId)
      .then((loadedProduct) => {
        if (active) setProduct(loadedProduct);
      })
      .catch((error: unknown) => {
        if (active) {
          setProductError(error instanceof Error ? error.message : 'Unable to load this product.');
        }
      })
      .finally(() => {
        if (active) setProductLoading(false);
      });

    return () => {
      active = false;
    };
  }, [directProductId, isDirectOrder]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const loadAddresses = async () => {
      const addressesByUser = await getStorageItem<Record<string, DeliveryAddress[]>>('user_addresses');
      const savedAddresses = addressesByUser?.[String(user.id)] ?? [];
      if (!active) return;
      setAddresses(savedAddresses);
      setSelectedAddressId(
        savedAddresses.find((address) => address.isDefault)?.id ?? savedAddresses[0]?.id ?? ''
      );
    };
    void loadAddresses();
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSavedPaymentMethods([]);
      setPaymentMethodsLoading(false);
      return;
    }

    let active = true;
    setPaymentMethodsLoading(true);
    getSavedPaymentMethods(user.id)
      .then((methods) => {
        if (active) setSavedPaymentMethods(methods);
      })
      .catch((error: unknown) => {
        if (active) {
          setOrderError(error instanceof Error ? error.message : 'Unable to load saved payment methods.');
        }
      })
      .finally(() => {
        if (active) setPaymentMethodsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const orderItems = useMemo(() => {
    if (!isDirectOrder) return cartItems;
    return product ? [itemFromProduct(product)] : [];
  }, [cartItems, isDirectOrder, product]);
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId) ?? null;
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountedSubtotal = orderItems.reduce(
    (sum, item) => sum + item.price * (1 - item.discountPercentage / 100) * item.quantity,
    0
  );
  const productDiscount = subtotal - discountedSubtotal;
  const appliedCouponDiscount = isDirectOrder ? 0 : couponDiscount;
  const total = Math.max(0, discountedSubtotal - appliedCouponDiscount);
  const selectedSavedMethod = savedPaymentMethods.find(
    (method) => selectedPaymentOption === `saved:${method.id}`
  );
  const selectedMethodType = PAYMENT_METHOD_OPTIONS.find(
    ({ type }) => selectedPaymentOption === `type:${type}`
  )?.type;
  const selectedPaymentMethod: OrderPaymentMethod | null = selectedSavedMethod
    ? {
        type: getPaymentMethodType(selectedSavedMethod),
        label: getPaymentMethodLabel(selectedSavedMethod),
        savedMethodId: selectedSavedMethod.id,
      }
    : selectedMethodType && selectedMethodType !== 'card'
      ? { type: selectedMethodType, label: getPaymentMethodName(selectedMethodType) }
      : null;

  const openNewAddress = () => {
    setEditingAddressId(null);
    setAddressDraft({
      ...emptyAddress,
      fullName: user ? `${user.firstName} ${user.lastName}`.trim() : '',
      isDefault: addresses.length === 0,
    });
    setAddressError(null);
    setAddressDialogVisible(true);
  };

  const openAddressEditor = (address: DeliveryAddress) => {
    const { id: _id, ...draft } = address;
    setEditingAddressId(address.id);
    setAddressDraft(draft);
    setAddressError(null);
    setAddressDialogVisible(true);
  };

  const saveAddress = async () => {
    if (!user) return;
    const required = [
      addressDraft.fullName,
      addressDraft.phone,
      addressDraft.street,
      addressDraft.city,
      addressDraft.postalCode,
      addressDraft.country,
    ];
    if (required.some((value) => !value.trim())) {
      setAddressError('Complete the name, phone, street, city, postal code, and country fields.');
      return;
    }

    const id = editingAddressId ?? `${Date.now()}`;
    const nextAddresses = addresses.some((address) => address.id === id)
      ? addresses.map((address) => address.id === id ? { ...addressDraft, id } : address)
      : [...addresses, { ...addressDraft, id }];
    const normalizedAddresses = addressDraft.isDefault
      ? nextAddresses.map((address) => ({ ...address, isDefault: address.id === id }))
      : nextAddresses;

    try {
      const addressesByUser = (await getStorageItem<Record<string, DeliveryAddress[]>>('user_addresses')) ?? {};
      await setStorageItem('user_addresses', {
        ...addressesByUser,
        [String(user.id)]: normalizedAddresses,
      });
      setAddresses(normalizedAddresses);
      setSelectedAddressId(id);
      setAddressDialogVisible(false);
      setAddressError(null);
    } catch (error) {
      setAddressError(error instanceof Error ? error.message : 'Unable to save this address.');
    }
  };

  const handlePlaceOrder = async () => {
    if (!user || orderItems.length === 0) return;
    if (!selectedAddress) {
      setOrderError('Add or select a delivery address before placing your order.');
      return;
    }
    if (!selectedPaymentMethod) {
      setOrderError('Choose a payment method before placing your order.');
      return;
    }

    setPlacingOrder(true);
    setOrderError(null);
    try {
      let orderId = Date.now();
      if (!user.token.startsWith('local-access-')) {
        const remoteOrder = await productApi.addCart({
          userId: user.id,
          products: orderItems.map((item) => ({ id: item.productId, quantity: item.quantity })),
        });
        orderId = remoteOrder.id;
      }

      const order: OrderRecord = {
        id: orderId,
        products: orderItems.map((item) => ({
          id: item.productId,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
          discountPercentage: item.discountPercentage,
          discountedTotal: item.price * (1 - item.discountPercentage / 100) * item.quantity,
          thumbnail: item.thumbnail,
        })),
        total: subtotal,
        discountedTotal: total,
        totalProducts: orderItems.length,
        totalQuantity: orderItems.reduce((sum, item) => sum + item.quantity, 0),
        userId: user.id,
        deliveryAddress: selectedAddress,
        paymentMethod: selectedPaymentMethod,
        placedAt: new Date().toISOString(),
      };
      await saveUserOrder(user.id, order);
      if (!isDirectOrder) clearCart();
      setPlacedOrder(order);
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : 'Unable to place your order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (productLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#708066" />
        <Text style={styles.mutedText}>Loading order details...</Text>
      </View>
    );
  }

  if (productError || (!isDirectOrder && cartItems.length === 0)) {
    return (
      <View style={styles.centered}>
        <Text style={styles.pageTitle}>Checkout</Text>
        <Text style={styles.errorText}>{productError ?? 'Your cart is empty.'}</Text>
        <Button mode="contained" onPress={() => router.back()}>Go back</Button>
      </View>
    );
  }

  if (placedOrder) {
    return (
      <View style={styles.centered}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.pageTitle}>Order placed!</Text>
        <Text style={styles.mutedText}>Order #{placedOrder.id}</Text>
        <Text style={styles.confirmationTotal}>Order total: {formatPrice(placedOrder.discountedTotal)}</Text>
        {placedOrder.paymentMethod ? (
          <Text style={styles.mutedText}>Payment method: {placedOrder.paymentMethod.label}</Text>
        ) : null}
        <Text style={styles.mutedText}>Your order is going to {placedOrder.deliveryAddress?.fullName}.</Text>
        <Button
          mode="contained"
          style={styles.confirmationButton}
          onPress={() => router.replace('/(app)/(tabs)/profile?panel=orders')}
        >
          View my orders
        </Button>
        <Button onPress={() => router.replace('/(app)/(tabs)/home')}>Continue shopping</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} accessibilityLabel="Go back" />
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Order summary</Text>
        {orderItems.map((item) => {
          const itemTotal = item.price * (1 - item.discountPercentage / 100) * item.quantity;
          return (
            <Card key={item.productId} style={styles.itemCard}>
              <Card.Content style={styles.itemRow}>
                <Text style={styles.itemTitle}>{item.title} × {item.quantity}</Text>
                <Text style={styles.itemPrice}>{formatPrice(itemTotal)}</Text>
              </Card.Content>
            </Card>
          );
        })}
        <Card style={styles.card}>
          <Card.Content>
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
            {appliedCouponDiscount > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Coupon ({couponCode})</Text>
                <Text style={styles.discountValue}>-{formatPrice(appliedCouponDiscount)}</Text>
              </View>
            ) : null}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={styles.summaryValue}>Free</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total to pay</Text>
              <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.addressHeader}>
          <Text style={styles.sectionTitle}>Delivery address</Text>
          {selectedAddress ? (
            <Button compact onPress={() => openAddressEditor(selectedAddress)}>Edit</Button>
          ) : null}
        </View>
        {addresses.length === 0 ? (
          <Text style={styles.mutedText}>Add a delivery address to continue.</Text>
        ) : (
          addresses.map((address) => (
            <Pressable
              key={address.id}
              onPress={() => setSelectedAddressId(address.id)}
              style={[styles.addressCard, selectedAddressId === address.id && styles.selectedAddressCard]}
            >
              <RadioButton
                value={address.id}
                status={selectedAddressId === address.id ? 'checked' : 'unchecked'}
                onPress={() => setSelectedAddressId(address.id)}
              />
              <View style={styles.addressDetails}>
                <Text style={styles.addressTitle}>
                  {address.label}{address.isDefault ? ' · Default' : ''}
                </Text>
                <Text style={styles.addressText}>{address.fullName} · {address.phone}</Text>
                <Text style={styles.addressText}>
                  {address.street}, {address.city}{address.region ? `, ${address.region}` : ''}
                </Text>
                <Text style={styles.addressText}>{address.postalCode}, {address.country}</Text>
              </View>
            </Pressable>
          ))
        )}
        <Button mode="outlined" icon="plus" onPress={openNewAddress} style={styles.addAddressButton}>
          {addresses.length ? 'Add another address' : 'Add delivery address'}
        </Button>

        <Text style={styles.sectionTitle}>Payment method</Text>
        {paymentMethodsLoading ? <Text style={styles.mutedText}>Loading saved methods...</Text> : null}
        <RadioButton.Group
          value={selectedPaymentOption}
          onValueChange={(value) => {
            setSelectedPaymentOption(value);
            setOrderError(null);
          }}
        >
          {savedPaymentMethods.map((method) => {
            const optionValue = `saved:${method.id}`;
            return (
              <Pressable
                key={optionValue}
                onPress={() => {
                  setSelectedPaymentOption(optionValue);
                  setOrderError(null);
                }}
                style={[
                  styles.paymentOption,
                  selectedPaymentOption === optionValue && styles.selectedPaymentOption,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedPaymentOption === optionValue }}
              >
                <RadioButton value={optionValue} />
                <View style={styles.paymentDetails}>
                  <Text style={styles.addressTitle}>{getPaymentMethodLabel(method)}</Text>
                  <Text style={styles.addressText}>Saved payment method</Text>
                </View>
              </Pressable>
            );
          })}
          {PAYMENT_METHOD_OPTIONS.filter(({ type }) => type !== 'card').map(({ type, label }) => {
            const optionValue = `type:${type}`;
            return (
              <Pressable
                key={optionValue}
                onPress={() => {
                  setSelectedPaymentOption(optionValue);
                  setOrderError(null);
                }}
                style={[
                  styles.paymentOption,
                  selectedPaymentOption === optionValue && styles.selectedPaymentOption,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedPaymentOption === optionValue }}
              >
                <RadioButton value={optionValue} />
                <View style={styles.paymentDetails}>
                  <Text style={styles.addressTitle}>{label}</Text>
                  <Text style={styles.addressText}>Demo selection · no payment is processed</Text>
                </View>
              </Pressable>
            );
          })}
        </RadioButton.Group>
        <Button
          mode="outlined"
          onPress={() => router.push('/(app)/(tabs)/profile?panel=payments')}
          style={styles.addAddressButton}
        >
          Manage saved payment methods
        </Button>

        {orderError ? <Text style={styles.errorText}>{orderError}</Text> : null}
        <Button
          mode="contained"
          icon="check"
          onPress={() => void handlePlaceOrder()}
          loading={placingOrder}
          disabled={placingOrder || !selectedAddress || !selectedPaymentMethod || orderItems.length === 0}
          style={styles.placeOrderButton}
        >
          Place order · {formatPrice(total)}
        </Button>
        <Text style={styles.demoNotice}>
          Demo checkout only. Payment selections are saved with the order; no payment is processed.
        </Text>
      </ScrollView>

      <Portal>
        <Dialog visible={addressDialogVisible} onDismiss={() => setAddressDialogVisible(false)}>
          <Dialog.Title>{editingAddressId ? 'Edit delivery address' : 'Add delivery address'}</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput
                label="Address label"
                value={addressDraft.label}
                onChangeText={(label) => setAddressDraft({ ...addressDraft, label })}
                style={styles.addressInput}
              />
              <TextInput
                label="Full name"
                value={addressDraft.fullName}
                onChangeText={(fullName) => setAddressDraft({ ...addressDraft, fullName })}
                style={styles.addressInput}
              />
              <TextInput
                label="Phone"
                value={addressDraft.phone}
                onChangeText={(phone) => setAddressDraft({ ...addressDraft, phone })}
                keyboardType="phone-pad"
                style={styles.addressInput}
              />
              <TextInput
                label="Street address"
                value={addressDraft.street}
                onChangeText={(street) => setAddressDraft({ ...addressDraft, street })}
                style={styles.addressInput}
              />
              <TextInput
                label="City"
                value={addressDraft.city}
                onChangeText={(city) => setAddressDraft({ ...addressDraft, city })}
                style={styles.addressInput}
              />
              <TextInput
                label="State / Province"
                value={addressDraft.region}
                onChangeText={(region) => setAddressDraft({ ...addressDraft, region })}
                style={styles.addressInput}
              />
              <TextInput
                label="Postal code"
                value={addressDraft.postalCode}
                onChangeText={(postalCode) => setAddressDraft({ ...addressDraft, postalCode })}
                style={styles.addressInput}
              />
              <TextInput
                label="Country"
                value={addressDraft.country}
                onChangeText={(country) => setAddressDraft({ ...addressDraft, country })}
                style={styles.addressInput}
              />
              <View style={styles.defaultAddressRow}>
                <Text style={styles.addressText}>Set as default address</Text>
                <Switch
                  value={addressDraft.isDefault}
                  onValueChange={(isDefault) => setAddressDraft({ ...addressDraft, isDefault })}
                />
              </View>
              {addressError ? <Text style={styles.errorText}>{addressError}</Text> : null}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setAddressDialogVisible(false)}>Cancel</Button>
            <Button onPress={() => void saveAddress()}>Save address</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
