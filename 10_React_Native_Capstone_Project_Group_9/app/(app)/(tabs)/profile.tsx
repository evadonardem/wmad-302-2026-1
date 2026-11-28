import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useAppSettings } from '@/context/SettingsContext';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dialog,
  Divider,
  List,
  Portal,
  RadioButton,
  Switch,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { DeliveryAddress } from '@/types/address';
import type { OrderRecord } from '@/types/order';
import {
  getPaymentMethodLabel,
  getPaymentMethodType,
  isPaymentMethodType,
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethodType,
  type SavedPaymentMethod,
} from '@/types/payment';
import { productApi } from '@/services/productApi';
import { getUserOrders } from '@/services/orderStorage';
import { favoritesStorage, getStorageItem, setStorageItem } from '@/utils/storage';
import { getSavedPaymentMethods, saveUserPaymentMethods } from '@/services/paymentStorage';
import { getCurrencyName } from '@/utils/currencyFormat';
import { useCurrencyFormatter } from '@/hooks/useCurrency';
import { UserProfileUpdate } from '@/services/userApi';
import { styles } from './profileStyles';

type Panel = 'edit' | 'orders' | 'addresses' | 'addressForm' | 'payments' | 'paymentForm' | 'settings' | 'currency' | null;

type Address = DeliveryAddress;

const paymentIcons: Record<PaymentMethodType, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  card: 'credit-card-outline',
  gcash: 'cellphone',
  maya: 'wallet-outline',
  'online-banking': 'bank-outline',
  'cash-on-delivery': 'cash',
};

const emptyAddress: Omit<Address, 'id'> = {
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

async function loadUserData<T>(key: 'user_addresses' | 'user_payment_methods', userId: number): Promise<T[]> {
  const allUsers = await getStorageItem<Record<string, T[]>>(key);
  return allUsers?.[String(userId)] ?? [];
}

async function saveUserData<T>(
  key: 'user_addresses' | 'user_payment_methods',
  userId: number,
  value: T[]
): Promise<void> {
  const allUsers = (await getStorageItem<Record<string, T[]>>(key)) ?? {};
  await setStorageItem(key, { ...allUsers, [String(userId)]: value });
}

export default function ProfileScreen() {
  const { panel: requestedPanel } = useLocalSearchParams<{ panel?: string }>();
  const { user, logout, isAuthenticated, updateUser } = useAuth();
  const {
    settings,
    updateSettings,
    currencyRates,
    currencyRatesLoading,
    currencyRatesError,
    currencyRatesDate,
    refreshCurrencyRates,
  } = useAppSettings();
  const formatPrice = useCurrencyFormatter();
  const paperTheme = useTheme();
  const [panel, setPanel] = useState<Panel>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [payments, setPayments] = useState<SavedPaymentMethod[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [profileDraft, setProfileDraft] = useState<UserProfileUpdate>({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
  });
  const [addressDraft, setAddressDraft] = useState<Omit<Address, 'id'>>(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentMethodType>('gcash');
  const [paymentNickname, setPaymentNickname] = useState('');
  const [currencySearch, setCurrencySearch] = useState('');

  useEffect(() => {
    if (requestedPanel === 'orders' || requestedPanel === 'payments') {
      setFormError(null);
      setPanel(requestedPanel);
    }
  }, [requestedPanel]);

  const spent = useMemo(
    () => orders.reduce((sum, order) => sum + order.discountedTotal, 0),
    [orders]
  );

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setOrdersLoading(true);
    setOrderError(null);
    try {
      const savedOrders = await getUserOrders(user.id);
      if (user.token.startsWith('local-access-')) {
        setOrders(savedOrders);
        return;
      }
      const response = await productApi.getUserCart(user.id);
      const savedOrderIds = new Set(savedOrders.map((order) => order.id));
      setOrders([...savedOrders, ...response.carts.filter((order) => !savedOrderIds.has(order.id))]);
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Unable to load order history.');
    } finally {
      setOrdersLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadUserData<Address>('user_addresses', user.id).then(setAddresses);
    getSavedPaymentMethods(user.id)
      .then(setPayments)
      .catch((err: unknown) => setFormError(err instanceof Error ? err.message : 'Unable to load payment methods.'));
    favoritesStorage.getIds().then((ids) => setWishlistCount(ids.length));
    void loadOrders();
  }, [loadOrders, user]);

  const currencyOptions = useMemo(
    () => Object.keys(currencyRates)
      .filter((code) => code.toLowerCase().includes(currencySearch.trim().toLowerCase()) ||
        getCurrencyName(code).toLowerCase().includes(currencySearch.trim().toLowerCase()))
      .sort(),
    [currencyRates, currencySearch]
  );

  const openProfileEditor = () => {
    if (!user) return;
    setProfileDraft({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
    });
    setFormError(null);
    setPanel('edit');
  };

  const saveProfile = async () => {
    if (!profileDraft.firstName.trim() || !profileDraft.lastName.trim() ||
      !profileDraft.username.trim() || !/^\S+@\S+\.\S+$/.test(profileDraft.email)) {
      setFormError('Enter your first name, last name, username, and a valid email address.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await updateUser({
        firstName: profileDraft.firstName.trim(),
        lastName: profileDraft.lastName.trim(),
        username: profileDraft.username.trim(),
        email: profileDraft.email.trim(),
      });
      setPanel(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to update your profile.');
    } finally {
      setSaving(false);
    }
  };

  const openNewAddress = () => {
    setEditingAddressId(null);
    setAddressDraft(emptyAddress);
    setFormError(null);
    setPanel('addressForm');
  };

  const openAddressEditor = (address: Address) => {
    const { id: _id, ...draft } = address;
    setEditingAddressId(address.id);
    setAddressDraft(draft);
    setFormError(null);
    setPanel('addressForm');
  };

  const saveAddress = async () => {
    if (!user) return;
    const required = [addressDraft.fullName, addressDraft.phone, addressDraft.street,
      addressDraft.city, addressDraft.postalCode, addressDraft.country];
    if (required.some((value) => !value.trim())) {
      setFormError('Complete the name, phone, street, city, postal code, and country fields.');
      return;
    }

    const id = editingAddressId ?? `${Date.now()}`;
    const nextAddresses = addresses.some((address) => address.id === id)
      ? addresses.map((address) => address.id === id ? { ...addressDraft, id } : address)
      : [...addresses, { ...addressDraft, id }];
    const normalized = addressDraft.isDefault
      ? nextAddresses.map((address) => ({ ...address, isDefault: address.id === id }))
      : nextAddresses;

    setSaving(true);
    try {
      await saveUserData('user_addresses', user.id, normalized);
      setAddresses(normalized);
      setPanel('addresses');
      setFormError(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save address.');
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!user) return;
    const nextAddresses = addresses.filter((address) => address.id !== id);
    try {
      await saveUserData('user_addresses', user.id, nextAddresses);
      setAddresses(nextAddresses);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to delete address.');
    }
  };

  const savePayment = async () => {
    if (!user) return;
    const method: SavedPaymentMethod = {
      id: `${Date.now()}`,
      type: paymentType,
      ...(paymentNickname.trim() ? { nickname: paymentNickname.trim() } : {}),
    };

    setSaving(true);
    try {
      const nextPayments = [...payments, method];
      await saveUserPaymentMethods(user.id, nextPayments);
      setPayments(nextPayments);
      setPaymentNickname('');
      setPanel('payments');
      setFormError(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save payment method.');
    } finally {
      setSaving(false);
    }
  };

  const deletePayment = async (id: string) => {
    if (!user) return;
    const nextPayments = payments.filter((payment) => payment.id !== id);
    try {
      await saveUserPaymentMethods(user.id, nextPayments);
      setPayments(nextPayments);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to delete payment method.');
    }
  };

  const saveSettings = async (updates: Parameters<typeof updateSettings>[0]) => {
    try {
      await updateSettings(updates);
      setFormError(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save settings.');
    }
  };

  const selectCurrency = async (currencyCode: string) => {
    try {
      await updateSettings({ currencyCode });
      setPanel('settings');
      setFormError(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save currency preference.');
    }
  };

  const dismissPanel = () => {
    if (saving) return;
    setPanel(null);
    setPaymentNickname('');
  };

  const confirmLogout = async () => {
    try {
      await logout();
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'Unable to sign out.');
    }
  };

  const handleLogout = () => {
    setLogoutError(null);
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        void confirmLogout();
      }
      return;
    }

    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void confirmLogout() },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notLoggedIn}>Please log in to view profile</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: paperTheme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Avatar.Image size={88} source={{ uri: user?.image || 'https://dummyjson.com/icon/user/128' }} style={styles.avatar} />
        <View style={styles.nameContainer}>
          <Text style={[styles.name, { color: paperTheme.colors.onSurface }]}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.username}>@{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatPrice(spent)}</Text>
          <Text style={styles.statLabel}>Spent</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{wishlistCount}</Text>
          <Text style={styles.statLabel}>Wishlist</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Card style={styles.menuCard} elevation={1}>
          <List.Section>
            <List.Item
              title="My Orders"
              description="Track and manage orders"
              left={(props) => <MaterialCommunityIcons name="package-variant" size={24} color="#708066" style={props.style} />}
              right={(props) => (
                <View style={props.style}>
                  <Badge size={18} style={{ backgroundColor: '#708066' }}>{orders.length}</Badge>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#8C8171" />
                </View>
              )}
              onPress={() => { setFormError(null); setPanel('orders'); }}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Wishlist"
              description={`${wishlistCount} saved items`}
              left={(props) => <MaterialCommunityIcons name="heart" size={24} color="#708066" style={props.style} />}
              right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#8C8171" style={props.style} />}
              onPress={() => Alert.alert('Wishlist', `${wishlistCount} saved ${wishlistCount === 1 ? 'item' : 'items'} on this account.`)}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Addresses"
              description={`${addresses.length} saved delivery ${addresses.length === 1 ? 'address' : 'addresses'}`}
              left={(props) => <MaterialCommunityIcons name="map-marker" size={24} color="#708066" style={props.style} />}
              right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#8C8171" style={props.style} />}
              onPress={() => { setFormError(null); setPanel('addresses'); }}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Payment Methods"
              description={`${payments.length} saved payment ${payments.length === 1 ? 'method' : 'methods'}`}
              left={(props) => <MaterialCommunityIcons name="credit-card" size={24} color="#708066" style={props.style} />}
              right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#8C8171" style={props.style} />}
              onPress={() => { setFormError(null); setPanel('payments'); }}
            />
          </List.Section>
        </Card>
      </View>

      <View style={styles.section}>
        <Card style={styles.menuCard} elevation={1}>
          <List.Section>
            <List.Item
              title="Edit Profile"
              description="Update your information"
              left={(props) => <MaterialCommunityIcons name="account-edit" size={24} color="#708066" style={props.style} />}
              right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#8C8171" style={props.style} />}
              onPress={openProfileEditor}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Settings"
              description="Currency, notifications, theme, privacy"
              left={(props) => <MaterialCommunityIcons name="cog" size={24} color="#708066" style={props.style} />}
              right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#8C8171" style={props.style} />}
              onPress={() => { setFormError(null); setPanel('settings'); }}
            />
          </List.Section>
        </Card>
      </View>

      <View style={styles.logoutContainer}>
        {logoutError ? <Text style={styles.formError}>{logoutError}</Text> : null}
        <Button mode="contained" onPress={handleLogout} style={styles.logoutButton}
          contentStyle={styles.logoutButtonContent} icon="logout" buttonColor="#708066" textColor="#FFFFFF">
          Sign out
        </Button>
      </View>

      <View style={styles.version}>
        <Text style={styles.versionText}>NextDoorFinds v1.0.0</Text>
      </View>

      <Portal>
        <Dialog visible={panel !== null} onDismiss={dismissPanel} style={styles.dialog}>
          <Dialog.Title>{getPanelTitle(panel, editingAddressId !== null)}</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {panel === 'edit' && (
                <View style={styles.form}>
                  <TextInput label="First name" value={profileDraft.firstName}
                    onChangeText={(firstName) => setProfileDraft({ ...profileDraft, firstName })} />
                  <TextInput label="Last name" value={profileDraft.lastName}
                    onChangeText={(lastName) => setProfileDraft({ ...profileDraft, lastName })} />
                  <TextInput label="Username" value={profileDraft.username} autoCapitalize="none"
                    onChangeText={(username) => setProfileDraft({ ...profileDraft, username })} />
                  <TextInput label="Email" value={profileDraft.email} keyboardType="email-address" autoCapitalize="none"
                    onChangeText={(email) => setProfileDraft({ ...profileDraft, email })} />
                </View>
              )}

              {panel === 'orders' && (
                <View style={styles.form}>
                  {ordersLoading ? <Text>Loading order history...</Text> : null}
                  {orderError ? <Text style={styles.formError}>{orderError}</Text> : null}
                  {!ordersLoading && !orderError && orders.length === 0
                    ? <Text>No order history was found for this account.</Text>
                    : null}
                  {orders.map((order) => (
                    <Card key={order.id} style={styles.orderCard}>
                      <Card.Content>
                        <Text style={styles.rowTitle}>Order #{order.id}</Text>
                        <Text>{order.totalProducts} products · {order.totalQuantity} items</Text>
                        <Text style={styles.orderTotal}>{formatPrice(order.discountedTotal)}</Text>
                        {order.paymentMethod ? (
                          <Text>Payment: {order.paymentMethod.label}</Text>
                        ) : null}
                        {order.products.map((item) => (
                          <Text key={item.id} style={styles.orderProduct}>
                            {item.title} × {item.quantity}
                          </Text>
                        ))}
                      </Card.Content>
                    </Card>
                  ))}
                </View>
              )}

              {panel === 'addresses' && (
                <View style={styles.form}>
                  {addresses.length === 0 ? <Text>No saved addresses yet.</Text> : null}
                  {addresses.map((address) => (
                    <Card key={address.id} style={styles.orderCard}>
                      <Card.Content>
                        <View style={styles.cardRow}>
                          <Text style={styles.rowTitle}>{address.label}{address.isDefault ? ' · Default' : ''}</Text>
                          <View style={styles.cardActions}>
                            <Button compact onPress={() => openAddressEditor(address)}>Edit</Button>
                            <Button compact textColor="#D93025" onPress={() => void deleteAddress(address.id)}>Delete</Button>
                          </View>
                        </View>
                        <Text>{address.fullName} · {address.phone}</Text>
                        <Text>{address.street}, {address.city}{address.region ? `, ${address.region}` : ''}</Text>
                        <Text>{address.postalCode}, {address.country}</Text>
                      </Card.Content>
                    </Card>
                  ))}
                  <Button mode="contained" icon="plus" onPress={openNewAddress}>Add address</Button>
                </View>
              )}

              {panel === 'addressForm' && (
                <View style={styles.form}>
                  <TextInput label="Label (Home, Work...)" value={addressDraft.label}
                    onChangeText={(label) => setAddressDraft({ ...addressDraft, label })} />
                  <TextInput label="Full name" value={addressDraft.fullName}
                    onChangeText={(fullName) => setAddressDraft({ ...addressDraft, fullName })} />
                  <TextInput label="Phone" value={addressDraft.phone} keyboardType="phone-pad"
                    onChangeText={(phone) => setAddressDraft({ ...addressDraft, phone })} />
                  <TextInput label="Street address" value={addressDraft.street}
                    onChangeText={(street) => setAddressDraft({ ...addressDraft, street })} />
                  <TextInput label="City" value={addressDraft.city}
                    onChangeText={(city) => setAddressDraft({ ...addressDraft, city })} />
                  <TextInput label="State / Province" value={addressDraft.region}
                    onChangeText={(region) => setAddressDraft({ ...addressDraft, region })} />
                  <TextInput label="Postal code" value={addressDraft.postalCode}
                    onChangeText={(postalCode) => setAddressDraft({ ...addressDraft, postalCode })} />
                  <TextInput label="Country" value={addressDraft.country}
                    onChangeText={(country) => setAddressDraft({ ...addressDraft, country })} />
                  <List.Item title="Set as default address" right={() => (
                    <Switch value={addressDraft.isDefault}
                      onValueChange={(isDefault) => setAddressDraft({ ...addressDraft, isDefault })} />
                  )} />
                </View>
              )}

              {panel === 'payments' && (
                <View style={styles.form}>
                  <Text style={styles.helperText}>
                    Saved methods are stored on this device for checkout. This demo does not process payments or store card or account numbers.
                  </Text>
                  {payments.length === 0 ? <Text>No saved payment methods yet.</Text> : null}
                  {payments.map((payment) => (
                    <Card key={payment.id} style={styles.orderCard}>
                      <Card.Content>
                        <View style={styles.cardRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                            <MaterialCommunityIcons
                              name={paymentIcons[getPaymentMethodType(payment)]}
                              size={24}
                              color="#708066"
                            />
                            <View>
                            <Text style={styles.rowTitle}>{getPaymentMethodLabel(payment)}</Text>
                            {payment.expiry ? <Text>Expires {payment.expiry}</Text> : null}
                            </View>
                          </View>
                          <Button compact textColor="#D93025" onPress={() => void deletePayment(payment.id)}>Delete</Button>
                        </View>
                      </Card.Content>
                    </Card>
                  ))}
                  <Button mode="contained" icon="plus" onPress={() => {
                    setFormError(null);
                    setPaymentType('gcash');
                    setPaymentNickname('');
                    setPanel('paymentForm');
                  }}>
                    Add payment method
                  </Button>
                </View>
              )}

              {panel === 'paymentForm' && (
                <View style={styles.form}>
                  <Text style={styles.helperText}>
                    Choose a method for checkout. Only its type and optional nickname are saved; do not enter card, wallet, or bank account details.
                  </Text>
                  <RadioButton.Group
                    value={paymentType}
                    onValueChange={(value) => {
                      if (isPaymentMethodType(value)) setPaymentType(value);
                    }}
                  >
                    {PAYMENT_METHOD_OPTIONS.map(({ type, label }) => (
                      <List.Item
                        key={type}
                        title={label}
                        left={(props) => (
                          <MaterialCommunityIcons
                            name={paymentIcons[type]}
                            size={22}
                            color="#708066"
                            style={props.style}
                          />
                        )}
                        right={() => <RadioButton value={type} />}
                        onPress={() => setPaymentType(type)}
                      />
                    ))}
                  </RadioButton.Group>
                  <TextInput
                    label="Nickname (optional)"
                    value={paymentNickname}
                    onChangeText={setPaymentNickname}
                    placeholder="e.g. My GCash"
                    maxLength={40}
                  />
                </View>
              )}

              {panel === 'settings' && (
                <View>
                  <List.Item
                    title="Currency"
                    description={`${settings.currencyCode} · ${getCurrencyName(settings.currencyCode)}`}
                    left={(props) => <MaterialCommunityIcons name="currency-usd" size={22} color="#708066" style={props.style} />}
                    right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#8C8171" style={props.style} />}
                    onPress={() => {
                      setCurrencySearch('');
                      setPanel('currency');
                    }}
                  />
                  <Divider />
                  <List.Item title="Dark theme" description="Use a dark color scheme"
                    right={() => <Switch value={settings.darkTheme}
                      onValueChange={(darkTheme) => void saveSettings({ darkTheme })} />} />
                  <Divider />
                  <List.Item title="Notifications" description="Enable app notifications"
                    right={() => <Switch value={settings.notificationsEnabled}
                      onValueChange={(notificationsEnabled) => void saveSettings({ notificationsEnabled })} />} />
                  <Divider />
                  <List.Item title="Share activity" description="Allow activity-based recommendations"
                    right={() => <Switch value={settings.shareActivity}
                      onValueChange={(shareActivity) => void saveSettings({ shareActivity })} />} />
                  <Text style={styles.helperText}>
                    Preferences are saved on this device. Currency rates are indicative daily conversions from USD; notifications are a preference only.
                  </Text>
                  {currencyRatesDate ? (
                    <Text style={styles.helperText}>Exchange rates dated {currencyRatesDate}.</Text>
                  ) : null}
                  {currencyRatesError ? <Text style={styles.formError}>{currencyRatesError}</Text> : null}
                  <Button
                    mode="outlined"
                    loading={currencyRatesLoading}
                    disabled={currencyRatesLoading}
                    onPress={() => void refreshCurrencyRates()}
                  >
                    Refresh exchange rates
                  </Button>
                </View>
              )}

              {panel === 'currency' && (
                <View style={styles.form}>
                  <Text style={styles.helperText}>
                    Product prices are stored in US dollars and converted using the latest available daily rates.
                  </Text>
                  <TextInput
                    label="Search currencies"
                    value={currencySearch}
                    onChangeText={setCurrencySearch}
                    autoCapitalize="characters"
                    left={<TextInput.Icon icon="magnify" />}
                  />
                  {currencyRatesLoading ? <Text style={styles.helperText}>Updating exchange rates...</Text> : null}
                  {currencyRatesError ? <Text style={styles.formError}>{currencyRatesError}</Text> : null}
                  {currencyOptions.map((code) => (
                    <List.Item
                      key={code}
                      title={`${code} · ${getCurrencyName(code)}`}
                      description={`1 USD = ${currencyRates[code].toLocaleString('en-PH')} ${code}`}
                      right={() => settings.currencyCode === code
                        ? <MaterialCommunityIcons name="check-circle" size={22} color="#708066" />
                        : null}
                      onPress={() => void selectCurrency(code)}
                    />
                  ))}
                  {currencyOptions.length === 0 ? <Text>No matching currencies.</Text> : null}
                </View>
              )}

              {formError ? <Text style={styles.formError}>{formError}</Text> : null}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            {panel === 'addressForm' && (
              <Button onPress={() => setPanel('addresses')}>Cancel</Button>
            )}
            {panel === 'edit' && <Button onPress={() => setPanel(null)}>Cancel</Button>}
            {panel === 'paymentForm' && <Button onPress={() => { setPaymentNickname(''); setPanel('payments'); }}>Cancel</Button>}
            {panel === 'currency' && <Button onPress={() => setPanel('settings')}>Back</Button>}
            {panel === 'orders' && orderError && <Button onPress={() => void loadOrders()}>Retry</Button>}
            {panel === 'edit' && <Button loading={saving} disabled={saving} onPress={() => void saveProfile()}>Save</Button>}
            {panel === 'addressForm' && <Button loading={saving} disabled={saving} onPress={() => void saveAddress()}>Save</Button>}
            {panel === 'paymentForm' && <Button loading={saving} disabled={saving} onPress={() => void savePayment()}>Save</Button>}
            {panel !== 'edit' && panel !== 'addressForm' && panel !== 'paymentForm' && panel !== 'currency' && (
              <Button onPress={() => setPanel(null)}>Done</Button>
            )}
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

function getPanelTitle(panel: Panel, editingAddress: boolean): string {
  switch (panel) {
    case 'edit': return 'Edit profile';
    case 'orders': return 'Order history';
    case 'addresses': return 'Delivery addresses';
    case 'addressForm': return editingAddress ? 'Edit address' : 'Add address';
    case 'payments': return 'Payment methods';
    case 'paymentForm': return 'Add payment method';
    case 'settings': return 'Settings';
    default: return '';
  }
}
