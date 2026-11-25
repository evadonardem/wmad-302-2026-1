/**
 * Profile Screen - Marketplace
 * Done: Students implement
 * - Display user info from auth context
 * - Edit profile (PUT /users/{id})
 * - View order history (GET /carts/user/{id})
 * - Payment methods (add / default / remove, saved on this device)  -> services/paymentMethods.ts
 * - Settings (theme, notifications, privacy)                        -> context/SettingsContext.tsx
 * - Address management (CRUD, saved on this device, used by checkout) -> components/AddressManager.tsx
 * - Wishlist (hearts on the product page) -> context/WishlistContext.tsx
 * - Style Passport (levels, completeness, achievements) -> components/StylePassport.tsx
 * - Logout
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import {
  Button,
  List,
  Avatar,
  Divider,
  Dialog,
  Portal,
  TextInput,
  HelperText,
  Snackbar,
  SegmentedButtons,
  Switch,
  Chip,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productApi } from '@/services/productApi';
import {
  PaymentMethod,
  PaymentType,
  WALLET_PROVIDERS,
  detectBrand,
  formatCardNumber,
  formatExpiry,
  isExpiryValid,
  loadPaymentMethods,
  luhnValid,
  onlyDigits,
  savePaymentMethods,
} from '@/services/paymentMethods';
import { ThemeMode, useSettings } from '@/context/SettingsContext';
import { Address, loadAddresses, saveAddresses } from '@/services/addresses';
import { useWishlist } from '@/context/WishlistContext';
import { AddressManager } from '@/components/AddressManager';
import { Screen } from '@/components/ScreenBackground';
import { WishlistDialog } from '@/components/WishlistDialog';
import { StylePassport, tierFor } from '@/components/StylePassport';
import { Cart } from '@/types/product';
import { palette, useResponsive } from '@/constants/theme';
import { styles } from './profileStyles';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface PaymentErrors {
  number?: string;
  holder?: string;
  expiry?: string;
  account?: string;
}

// Hints shown in the Add Payment Method form
const EXAMPLE_CARD = '4242 4242 4242 4242';
const expectedDigits = (brand: string): number => (brand === 'Amex' ? 15 : 16);

const maskEmail = (email: string): string => {
  const [name, domain] = email.split('@');
  return domain ? `${name.charAt(0)}•••@${domain}` : '••••••';
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  // AuthContext exposes dispatch-backed helpers only; refreshUser re-reads GET /auth/me
  const { refreshUser } = useAuth();
  const { settings, updateSettings, resetSettings } = useSettings();
  const { items: wishItems } = useWishlist();
  const { isWide, pad } = useResponsive();

  const [orders, setOrders] = useState<Cart[]>([]);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Cart | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  // Edit profile form
  const [editOpen, setEditOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Payment methods
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [removeMethod, setRemoveMethod] = useState<PaymentMethod | null>(null);
  const [pmType, setPmType] = useState<PaymentType>('card');
  const [pmNumber, setPmNumber] = useState('');
  const [pmHolder, setPmHolder] = useState('');
  const [pmExpiry, setPmExpiry] = useState('');
  const [pmProvider, setPmProvider] = useState<string>(WALLET_PROVIDERS[0]);
  const [pmAccount, setPmAccount] = useState('');
  const [pmErrors, setPmErrors] = useState<PaymentErrors>({});

  // Settings
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Addresses + wishlist
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesOpen, setAddressesOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  // Done: order history from GET /carts/user/{id}
  const loadOrders = useCallback(async () => {
    if (!user) return;
    try {
      setOrders(await productApi.getUserCarts(user.id));
    } catch {
      setOrders([]);
    }
  }, [user?.id]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Done: saved payment methods (per user, on this device)
  useEffect(() => {
    if (!user) return;
    loadPaymentMethods(user.id).then(setMethods);
  }, [user?.id]);

  // Done: saved delivery addresses (per user, on this device)
  useEffect(() => {
    if (!user) return;
    loadAddresses(user.id).then(setAddresses);
  }, [user?.id]);

  const totalSpent = orders.reduce((sum, o) => sum + o.discountedTotal, 0);

  const handleLogout = () => setLogoutOpen(true);

  const handleEditProfile = () => {
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
    setEmail(user?.email ?? '');
    setFormError(null);
    setEditOpen(true);
  };

  // Done: PUT /users/{id}
  const saveProfile = async () => {
    if (!user) return;
    if (!firstName.trim() || !lastName.trim()) {
      setFormError('First and last name are required');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFormError('Enter a valid email address');
      return;
    }
    setSaving(true);
    try {
      const updated = await productApi.updateUser(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
      // DummyJSON only simulates the update, so apply the returned values locally
      await refreshUser();
      user.firstName = updated.firstName;
      user.lastName = updated.lastName;
      user.email = updated.email;
      setEditOpen(false);
      setSnack('Profile updated');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleOrders = () => {
    setSelectedOrder(null);
    setOrdersOpen(true);
  };

  // Done: address management (CRUD)
  const handleAddresses = () => setAddressesOpen(true);

  const changeAddresses = (next: Address[]) => {
    setAddresses(next);
    if (user) saveAddresses(user.id, next);
  };

  // Done: payment methods list
  const handlePayment = () => setPaymentOpen(true);

  const storeMethods = (next: PaymentMethod[]) => {
    setMethods(next);
    if (user) savePaymentMethods(user.id, next);
  };

  const openAddMethod = () => {
    setPmType('card');
    setPmNumber('');
    setPmHolder(user ? `${user.firstName} ${user.lastName}` : '');
    setPmExpiry('');
    setPmProvider(WALLET_PROVIDERS[0]);
    setPmAccount('');
    setPmErrors({});
    setPaymentOpen(false);
    setAddOpen(true);
  };

  const closeAddMethod = () => {
    setAddOpen(false);
    setPaymentOpen(true);
  };

  const validateMethod = (): boolean => {
    const next: PaymentErrors = {};
    if (pmHolder.trim().length < 2) next.holder = 'Enter the name on the account';
    if (pmType === 'card') {
      const digits = onlyDigits(pmNumber);
      const want = expectedDigits(detectBrand(digits));
      if (digits.length === 0) next.number = `Enter your card number: ${want} digits, e.g. ${EXAMPLE_CARD}`;
      else if (digits.length < want) next.number = `Too short: ${digits.length} of ${want} digits. Example: ${EXAMPLE_CARD}`;
      else if (digits.length > 19 || !luhnValid(digits)) next.number = 'That number does not look right. Check each digit.';
      if (!isExpiryValid(pmExpiry)) next.expiry = 'Use MM/YY and a date that has not passed, e.g. 08/28';
    } else if (pmAccount.trim().length < 4) {
      next.account = 'Enter a mobile number (e.g. 0917 123 4567) or an email';
    }
    setPmErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveMethod = () => {
    if (!validateMethod()) return;
    // Only the brand and last 4 digits are kept: the full number is never stored
    const digits = pmType === 'card' ? onlyDigits(pmNumber) : onlyDigits(pmAccount) || pmAccount.trim();
    const method: PaymentMethod = {
      id: `${Date.now()}`,
      type: pmType,
      brand: pmType === 'card' ? detectBrand(onlyDigits(pmNumber)) : pmProvider,
      last4: digits.slice(-4),
      holder: pmHolder.trim(),
      expiry: pmType === 'card' ? pmExpiry : null,
      isDefault: methods.length === 0,
    };
    storeMethods([...methods, method]);
    setPmNumber('');
    setAddOpen(false);
    setPaymentOpen(true);
    setSnack('Payment method added');
  };

  const makeDefault = (id: string) => {
    storeMethods(methods.map((m) => ({ ...m, isDefault: m.id === id })));
    setSnack('Default payment method updated');
  };

  const confirmRemoveMethod = () => {
    if (!removeMethod) return;
    const remaining = methods.filter((m) => m.id !== removeMethod.id);
    // Keep one default: promote the first remaining method if the default was removed
    if (remaining.length > 0 && !remaining.some((m) => m.isDefault)) remaining[0] = { ...remaining[0], isDefault: true };
    storeMethods(remaining);
    setRemoveMethod(null);
    setSnack('Payment method removed');
  };

  // Done: settings (theme, notifications, privacy)
  const handleSettings = () => setSettingsOpen(true);

  const clearSearchHistory = () => {
    AsyncStorage.removeItem('recent_searches').catch(() => undefined);
    setSnack('Search history cleared');
  };

  const removeAllMethods = () => {
    storeMethods([]);
    setSnack('Saved payment methods removed');
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notLoggedIn}>Please log in to view profile</Text>
      </View>
    );
  }

  const cardDigits = onlyDigits(pmNumber);
  const cardBrand = detectBrand(cardDigits);
  const cardLength = expectedDigits(cardBrand);

  const tier = tierFor(Math.round(totalSpent));
  const openProduct = (id: number) => router.push(`/(app)/(tabs)/product/${id}`);

  // One row of an icon-tile menu
  const menuItem = (icon: IconName, title: string, description: string, onPress: () => void, badge?: number) => (
    <Pressable key={title} style={styles.menuItem} onPress={onPress} accessibilityRole="button">
      <View style={styles.menuIcon}>
        <MaterialCommunityIcons name={icon} size={22} color={palette.forest} />
        {badge ? (
          <View style={styles.menuBadge}>
            <Text style={styles.menuBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuDesc}>{description}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={palette.stone} />
    </Pressable>
  );

  const stats: Array<{ icon: IconName; value: string; label: string; onPress?: () => void }> = [
    { icon: 'package-variant-closed', value: String(orders.length), label: 'Orders', onPress: handleOrders },
    { icon: 'cash-multiple', value: `$${Math.round(totalSpent).toLocaleString()}`, label: 'Spent' },
    { icon: 'heart-outline', value: String(wishItems.length), label: 'Wishlist', onPress: () => setWishlistOpen(true) },
  ];

  return (
    <Screen>
      <ScrollView style={[styles.container, { backgroundColor: 'transparent' }]} contentContainerStyle={[styles.content, { paddingHorizontal: pad }]}>
        <View style={[styles.columns, isWide && styles.columnsWide]}>
          <View style={[styles.leftCol, isWide && styles.leftColWide]}>
            {/* Profile Header */}
            <View style={styles.hero}>
              <View style={styles.heroCircleA} />
              <View style={styles.heroCircleB} />
              <Pressable style={styles.heroEdit} onPress={handleEditProfile} accessibilityLabel="Edit profile">
                <MaterialCommunityIcons name="pencil-outline" size={18} color="#FBF7FF" />
              </Pressable>
              <Avatar.Image size={92} source={{ uri: user?.image || 'https://via.placeholder.com/150' }} style={styles.avatar} />
              <Text style={styles.name}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.username}>@{user?.username}</Text>
              <Text style={styles.email}>{settings.privacy.showEmail ? user?.email : maskEmail(user?.email ?? '')}</Text>
              <View style={styles.tierPill}>
                <MaterialCommunityIcons name={tier.icon} size={16} color={palette.gold} />
                <Text style={styles.tierPillText}>{tier.name} member</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              {stats.map((st) => (
                <Pressable key={st.label} style={styles.statCard} onPress={st.onPress} disabled={!st.onPress} accessibilityRole="button">
                  <View style={styles.statIcon}>
                    <MaterialCommunityIcons name={st.icon} size={18} color={palette.forest} />
                  </View>
                  <Text style={styles.statValue}>{st.value}</Text>
                  <Text style={styles.statLabel}>{st.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Style Passport: level, completeness and achievements */}
            <StylePassport
              spent={totalSpent}
              ordersCount={orders.length}
              wishCount={wishItems.length}
              addressCount={addresses.length}
              methodCount={methods.length}
              darkMode={settings.theme === 'dark'}
            />
          </View>

          <View style={[styles.rightCol, isWide && styles.rightColWide]}>
            {/* Menu Sections */}
            <View style={styles.menuCard}>
              {menuItem('package-variant-closed', 'My Orders', 'Track and manage orders', handleOrders, orders.length)}
              <View style={styles.menuDivider} />
              {menuItem('heart-outline', 'Wishlist', wishItems.length > 0 ? `${wishItems.length} saved for later` : 'Saved items for later', () => setWishlistOpen(true))}
              <View style={styles.menuDivider} />
              {menuItem('map-marker-outline', 'Addresses', addresses.length > 0 ? `${addresses.length} saved · manage delivery addresses` : 'Manage delivery addresses', handleAddresses)}
              <View style={styles.menuDivider} />
              {menuItem('credit-card-outline', 'Payment Methods', methods.length > 0 ? `${methods.length} saved · manage cards & wallets` : 'Manage cards & wallets', handlePayment)}
            </View>

            <View style={styles.menuCard}>
              {menuItem('account-edit-outline', 'Edit Profile', 'Update your information', handleEditProfile)}
              <View style={styles.menuDivider} />
              {menuItem('cog-outline', 'Settings', 'Notifications, theme, privacy', handleSettings)}
            </View>

            {/* Logout Button */}
            <Button
              mode="outlined"
              onPress={handleLogout}
              style={styles.logoutButton}
              contentStyle={styles.logoutButtonContent}
              icon="logout"
              textColor={palette.danger}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </Button>

            {/* Student Guide */}
            <View style={styles.guideContainer}>
              <Text style={styles.guideTitle}>✅ Student Implementation Guide: completed</Text>
              <Text style={styles.guideText}>✓ 1. Edit profile: PUT /users/{'{id}'}</Text>
              <Text style={styles.guideText}>✓ 2. Order history: GET /carts/user/{'{id}'}</Text>
              <Text style={styles.guideText}>✓ 3. Address management (CRUD)</Text>
              <Text style={styles.guideText}>✓ 4. Payment methods integration</Text>
              <Text style={styles.guideText}>✓ 5. Settings: theme, notifications, privacy</Text>
            </View>

            <View style={styles.version}>
              <Text style={styles.versionText}>Marketplace v1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Address management (CRUD) + wishlist */}
        <AddressManager
          visible={addressesOpen}
          addresses={addresses}
          defaultName={user ? `${user.firstName} ${user.lastName}` : ''}
          onChange={changeAddresses}
          onClose={() => setAddressesOpen(false)}
          onMessage={setSnack}
        />
        <WishlistDialog visible={wishlistOpen} onClose={() => setWishlistOpen(false)} onOpenProduct={openProduct} onMessage={setSnack} />

        {/* Dialogs replace Alert.alert, whose buttons do nothing on web */}
        <Portal>
          <Dialog visible={logoutOpen} onDismiss={() => setLogoutOpen(false)}>
            <Dialog.Title>Logout</Dialog.Title>
            <Dialog.Content>
              <Text>Are you sure you want to logout?</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setLogoutOpen(false)}>Cancel</Button>
              <Button
                textColor={palette.danger}
                onPress={() => {
                  setLogoutOpen(false);
                  logout();
                }}
              >
                Logout
              </Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog visible={editOpen} onDismiss={saving ? undefined : () => setEditOpen(false)}>
            <Dialog.Title>Edit Profile</Dialog.Title>
            <Dialog.Content>
              <TextInput mode="outlined" label="First name" value={firstName} onChangeText={setFirstName} />
              <TextInput mode="outlined" label="Last name" value={lastName} onChangeText={setLastName} style={{ marginTop: 8 }} />
              <TextInput
                mode="outlined"
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ marginTop: 8 }}
              />
              <HelperText type="error" visible={!!formError}>{formError}</HelperText>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
              <Button onPress={saveProfile} loading={saving} disabled={saving}>Save</Button>
            </Dialog.Actions>
          </Dialog>

          {/* Order history list / order detail */}
          <Dialog visible={ordersOpen} onDismiss={() => setOrdersOpen(false)}>
            <Dialog.Title>{selectedOrder ? `Order #${selectedOrder.id}` : 'My Orders'}</Dialog.Title>
            <Dialog.ScrollArea>
              <ScrollView style={{ maxHeight: 360 }}>
                {selectedOrder ? (
                  <View style={{ paddingVertical: 8 }}>
                    {selectedOrder.products.map((p) => (
                      <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                        <Text style={{ flex: 1 }} numberOfLines={2}>{p.title} × {p.quantity}</Text>
                        <Text>${p.discountedTotal.toFixed(2)}</Text>
                      </View>
                    ))}
                    <Divider style={{ marginVertical: 8 }} />
                    <Text style={{ fontWeight: '700' }}>Total: ${selectedOrder.discountedTotal.toFixed(2)}</Text>
                  </View>
                ) : orders.length === 0 ? (
                  <Text style={{ paddingVertical: 16 }}>No orders yet.</Text>
                ) : (
                  orders.map((o) => (
                    <List.Item
                      key={o.id}
                      title={`Order #${o.id}`}
                      description={`${o.totalQuantity} items · $${o.discountedTotal.toFixed(2)}`}
                      right={(props) => <List.Icon {...props} icon="chevron-right" />}
                      onPress={() => setSelectedOrder(o)}
                    />
                  ))
                )}
              </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              {selectedOrder && <Button onPress={() => setSelectedOrder(null)}>Back</Button>}
              <Button onPress={() => setOrdersOpen(false)}>Close</Button>
            </Dialog.Actions>
          </Dialog>

          {/* Payment methods: list */}
          <Dialog visible={paymentOpen && !removeMethod} onDismiss={() => setPaymentOpen(false)}>
            <Dialog.Title>Payment Methods</Dialog.Title>
            <Dialog.ScrollArea>
              <ScrollView style={{ maxHeight: 380 }}>
                {methods.length === 0 ? (
                  <Text style={styles.emptyMethods}>No payment methods saved yet.</Text>
                ) : (
                  methods.map((m) => (
                    <List.Item
                      key={m.id}
                      title={`${m.brand} •••• ${m.last4}`}
                      description={m.type === 'card' ? `${m.holder} · Expires ${m.expiry}` : `${m.holder} · e-wallet`}
                      left={(props) => <List.Icon {...props} icon={m.type === 'card' ? 'credit-card-outline' : 'wallet-outline'} />}
                      right={() => (
                        <View style={styles.methodActions}>
                          {m.isDefault ? (
                            <Chip compact>Default</Chip>
                          ) : (
                            <Button compact onPress={() => makeDefault(m.id)}>Make default</Button>
                          )}
                          <IconButton icon="delete-outline" size={20} onPress={() => setRemoveMethod(m)} accessibilityLabel="Remove payment method" />
                        </View>
                      )}
                    />
                  ))
                )}
                <Text style={styles.dialogNote}>
                  Only the brand and last 4 digits are saved on this device. Full card numbers and security codes are never stored.
                </Text>
              </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button onPress={openAddMethod}>Add new</Button>
              <Button onPress={() => setPaymentOpen(false)}>Close</Button>
            </Dialog.Actions>
          </Dialog>

          {/* Payment methods: add a card or wallet */}
          <Dialog visible={addOpen} onDismiss={closeAddMethod}>
            <Dialog.Title>Add Payment Method</Dialog.Title>
            <Dialog.ScrollArea>
              <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 400 }}>
                <SegmentedButtons
                  value={pmType}
                  onValueChange={(v) => {
                    setPmType(v as PaymentType);
                    setPmErrors({});
                  }}
                  buttons={[
                    { value: 'card', label: 'Card', icon: 'credit-card-outline' },
                    { value: 'wallet', label: 'E-wallet', icon: 'wallet-outline' },
                  ]}
                  style={styles.formGap}
                />
                {pmType === 'card' ? (
                  <>
                    <TextInput
                      mode="outlined"
                      label="Card number"
                      placeholder={EXAMPLE_CARD}
                      value={pmNumber}
                      onChangeText={(t) => setPmNumber(formatCardNumber(t))}
                      keyboardType="number-pad"
                      maxLength={23}
                      error={!!pmErrors.number}
                      right={<TextInput.Affix text={`${cardDigits.length}/${cardLength}`} />}
                      style={styles.formGap}
                    />
                    <HelperText type={pmErrors.number ? 'error' : 'info'} visible>
                      {pmErrors.number ??
                        (cardDigits.length === 0
                          ? `${cardLength} digits, for example ${EXAMPLE_CARD}`
                          : `${cardBrand} · ${cardDigits.length} of ${cardLength} digits`)}
                    </HelperText>
                    <Button compact icon="creditcard-edit-outline" onPress={() => setPmNumber(EXAMPLE_CARD)} style={{ alignSelf: 'flex-start' }}>
                      Fill example card
                    </Button>
                    <TextInput mode="outlined" label="Name on card" placeholder="As printed on the card" value={pmHolder} onChangeText={setPmHolder} error={!!pmErrors.holder} />
                    <HelperText type="error" visible={!!pmErrors.holder}>{pmErrors.holder}</HelperText>
                    <TextInput
                      mode="outlined"
                      label="Expiry (MM/YY)"
                      placeholder="08/28"
                      value={pmExpiry}
                      onChangeText={(t) => setPmExpiry(formatExpiry(t))}
                      keyboardType="number-pad"
                      maxLength={5}
                      error={!!pmErrors.expiry}
                    />
                    <HelperText type={pmErrors.expiry ? 'error' : 'info'} visible>
                      {pmErrors.expiry ?? 'Month / year, for example 08/28'}
                    </HelperText>
                  </>
                ) : (
                  <>
                    <Text style={styles.settingsLabel}>Provider</Text>
                    <View style={styles.chipRow}>
                      {WALLET_PROVIDERS.map((provider) => (
                        <Chip key={provider} selected={pmProvider === provider} onPress={() => setPmProvider(provider)}>
                          {provider}
                        </Chip>
                      ))}
                    </View>
                    <TextInput
                      mode="outlined"
                      label="Mobile number or email"
                      placeholder="0917 123 4567"
                      value={pmAccount}
                      onChangeText={setPmAccount}
                      autoCapitalize="none"
                      error={!!pmErrors.account}
                    />
                    <HelperText type={pmErrors.account ? 'error' : 'info'} visible>
                      {pmErrors.account ?? 'For example 0917 123 4567 or name@email.com'}
                    </HelperText>
                    <TextInput mode="outlined" label="Account name" value={pmHolder} onChangeText={setPmHolder} error={!!pmErrors.holder} />
                    <HelperText type="error" visible={!!pmErrors.holder}>{pmErrors.holder}</HelperText>
                  </>
                )}
                <Text style={styles.dialogNote}>
                  {pmType === 'card'
                    ? 'Card numbers are 16 digits (Amex: 15). The full number is only used to check it and is not saved. Use the example card to try it out.'
                    : 'Only the last 4 characters of your number are saved.'}
                </Text>
              </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button onPress={closeAddMethod}>Cancel</Button>
              <Button onPress={saveMethod}>Save</Button>
            </Dialog.Actions>
          </Dialog>

          {/* Payment methods: remove confirmation */}
          <Dialog visible={!!removeMethod} onDismiss={() => setRemoveMethod(null)}>
            <Dialog.Title>Remove payment method</Dialog.Title>
            <Dialog.Content>
              <Text>Remove {removeMethod?.brand} •••• {removeMethod?.last4}?</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setRemoveMethod(null)}>Cancel</Button>
              <Button textColor={palette.danger} onPress={confirmRemoveMethod}>Remove</Button>
            </Dialog.Actions>
          </Dialog>

          {/* Settings: theme, notifications, privacy */}
          <Dialog visible={settingsOpen} onDismiss={() => setSettingsOpen(false)}>
            <Dialog.Title>Settings</Dialog.Title>
            <Dialog.ScrollArea>
              <ScrollView style={{ maxHeight: 440 }}>
                <Text style={styles.settingsLabel}>Appearance</Text>
                <SegmentedButtons
                  value={settings.theme}
                  onValueChange={(v) => updateSettings({ theme: v as ThemeMode })}
                  buttons={[
                    { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
                    { value: 'dark', label: 'Dark', icon: 'weather-night' },
                    { value: 'system', label: 'System', icon: 'cellphone' },
                  ]}
                />

                <Text style={styles.settingsLabel}>Notifications</Text>
                <List.Item
                  title="Order updates"
                  description="Status of your orders"
                  right={() => (
                    <Switch value={settings.notifications.orders} onValueChange={(v) => updateSettings({ notifications: { ...settings.notifications, orders: v } })} />
                  )}
                />
                <List.Item
                  title="Deals & promotions"
                  description="Sales and limited-time offers"
                  right={() => (
                    <Switch value={settings.notifications.promotions} onValueChange={(v) => updateSettings({ notifications: { ...settings.notifications, promotions: v } })} />
                  )}
                />
                <List.Item
                  title="New arrivals"
                  description="When new products land"
                  right={() => (
                    <Switch value={settings.notifications.arrivals} onValueChange={(v) => updateSettings({ notifications: { ...settings.notifications, arrivals: v } })} />
                  )}
                />
                <Text style={styles.dialogNote}>Preferences are saved on this device. Push delivery needs expo-notifications.</Text>

                <Text style={styles.settingsLabel}>Privacy</Text>
                <List.Item
                  title="Save recent searches"
                  description="Show them under the search bar"
                  right={() => (
                    <Switch value={settings.privacy.saveRecentSearches} onValueChange={(v) => updateSettings({ privacy: { ...settings.privacy, saveRecentSearches: v } })} />
                  )}
                />
                <List.Item
                  title="Show my email"
                  description="Hide it on this screen when off"
                  right={() => (
                    <Switch value={settings.privacy.showEmail} onValueChange={(v) => updateSettings({ privacy: { ...settings.privacy, showEmail: v } })} />
                  )}
                />
                <Button mode="outlined" icon="history" onPress={clearSearchHistory} style={styles.formGap}>Clear search history</Button>
                <Button mode="outlined" icon="credit-card-remove-outline" onPress={removeAllMethods} style={styles.formGap} disabled={methods.length === 0}>
                  Remove saved payment methods
                </Button>
              </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button onPress={() => { resetSettings(); setSnack('Settings reset'); }}>Reset</Button>
              <Button onPress={() => setSettingsOpen(false)}>Close</Button>
            </Dialog.Actions>
          </Dialog>

          <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={2500}>
            {snack}
          </Snackbar>
        </Portal>
      </ScrollView>
    </Screen>
  );
}