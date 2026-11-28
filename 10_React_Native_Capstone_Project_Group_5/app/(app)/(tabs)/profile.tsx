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
 * - Loyalty Passport (levels, completeness, achievements) -> components/LoyaltyPassport.tsx
 * - Logout
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useRewards } from '@/context/RewardsContext';
import {
  Button,
  Avatar,
  Portal,
  TextInput,
  HelperText,
  Snackbar,
  SegmentedButtons,
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
  onlyDigits,
  savePaymentMethods,
} from '@/services/paymentMethods';
import { ThemeMode, useSettings } from '@/context/SettingsContext';
import { Address, loadAddresses, saveAddresses } from '@/services/addresses';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { AddressManager } from '@/components/AddressManager';
import { Screen } from '@/components/ScreenBackground';
import { WishlistDialog } from '@/components/WishlistDialog';
import { StylePrint } from '@/components/StylePrint';
import { AppDialog, DialogEmptyState, DialogRow, DialogSectionLabel, DialogToggleRow } from '@/components/AppDialog';
import { LoyaltyPassport, tierFor } from '@/components/LoyaltyPassport';
import { loadLocalOrders, OrderRecord, PAYMENT_LABELS } from '@/services/orders';
import { palette, useResponsive } from '@/constants/theme';
import { styles } from '@/styles/profile';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface PaymentErrors {
  number?: string;
  holder?: string;
  expiry?: string;
  account?: string;
}

// Card length by brand (Amex has 15 digits, others 16)
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
  const { items: cartItems } = useCart();
  const { state: rewardsState } = useRewards();
  const { isWide, pad } = useResponsive();
  const userId = user?.id;

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);
  // Bumped whenever Profile regains focus so STYLEPRINT reloads its activity log
  const [stylePrintTick, setStylePrintTick] = useState(0);

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

  // Order history: the API carts plus the orders placed in this app (DummyJSON does not persist checkouts)
  const loadOrders = useCallback(async () => {
    if (userId === undefined) return;
    setOrdersLoading(true);
    try {
      const [serverOrders, localOrders] = await Promise.all([
        productApi.getUserCarts(userId).catch((): OrderRecord[] => []),
        loadLocalOrders(userId),
      ]);
      // Local orders win on an id clash so the payment method and date are kept
      const seen = new Set<number>();
      const merged = [...localOrders, ...serverOrders].filter((order) => {
        if (seen.has(order.id)) return false;
        seen.add(order.id);
        return true;
      });
      setOrders(merged);
    } finally {
      setOrdersLoading(false);
    }
  }, [userId]);

  // Tabs stay mounted, so refresh whenever Profile gets focus (for example after a checkout)
  useFocusEffect(
    useCallback(() => {
      loadOrders();
      setStylePrintTick((tick) => tick + 1);
    }, [loadOrders])
  );

  // Done: saved payment methods (per user, on this device)
  useEffect(() => {
    if (!user) return;
    loadPaymentMethods(user.id).then(setMethods);
  }, [user]);

  // Done: saved delivery addresses (per user, on this device)
  useEffect(() => {
    if (!user) return;
    loadAddresses(user.id).then(setAddresses);
  }, [user]);

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
    loadOrders();
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
      if (digits.length === 0) next.number = `Enter your ${want}-digit card number`;
      else if (digits.length !== want) next.number = `Card number must be ${want} digits (currently ${digits.length})`;
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

  const stats: { icon: IconName; value: string; label: string; onPress?: () => void }[] = [
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

            {/* STYLEPRINT: a living style identity built from real shopping activity */}
            <StylePrint
              userId={user?.id}
              wishlist={wishItems}
              cart={cartItems}
              orders={orders}
              quizPersonality={rewardsState.quiz?.key ?? null}
              refreshKey={stylePrintTick}
              onExplore={() => router.push('/(app)/(tabs)/home')}
            />

            {/* Loyalty Passport: level, completeness and achievements */}
            <LoyaltyPassport
              spent={totalSpent}
              ordersCount={orders.length}
              wishCount={wishItems.length}
              addressCount={addresses.length}
              methodCount={methods.length}
              darkMode={settings.theme === 'dark'}
              quizPersonality={rewardsState.quiz?.key ?? null}
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
          <AppDialog
            visible={logoutOpen}
            onDismiss={() => setLogoutOpen(false)}
            icon="logout-variant"
            eyebrow="Account"
            title="Log out?"
            subtitle="You can sign back in any time."
            tone="danger"
            scroll={false}
            actions={[
              { label: 'Stay signed in', onPress: () => setLogoutOpen(false) },
              {
                label: 'Log out',
                tone: 'danger',
                icon: 'logout',
                onPress: () => {
                  setLogoutOpen(false);
                  logout();
                },
              },
            ]}
          >
            <View style={styles.logoutNote}>
              <MaterialCommunityIcons name="shield-check-outline" size={20} color={palette.forest} />
              <Text style={styles.logoutNoteText}>Your cart and wishlist stay saved on this device.</Text>
            </View>
          </AppDialog>

          <AppDialog
            visible={editOpen}
            onDismiss={saving ? undefined : () => setEditOpen(false)}
            dismissable={!saving}
            icon="account-edit-outline"
            eyebrow="Your details"
            title="Edit profile"
            subtitle="Keep your account information up to date."
            actions={[
              { label: 'Cancel', onPress: () => setEditOpen(false), disabled: saving },
              { label: 'Save changes', onPress: saveProfile, loading: saving, disabled: saving, icon: 'check' },
            ]}
          >
            <View style={styles.editIdentity}>
              <Avatar.Image size={48} source={{ uri: user?.image || 'https://via.placeholder.com/150' }} />
              <View style={styles.editIdentityText}>
                <Text style={styles.editName} numberOfLines={1}>
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text style={styles.editHandle}>@{user?.username}</Text>
              </View>
            </View>
            <TextInput
              mode="outlined"
              label="First name"
              value={firstName}
              onChangeText={setFirstName}
              left={<TextInput.Icon icon="account-outline" />}
              style={styles.dialogInput}
              outlineStyle={styles.dialogOutline}
            />
            <TextInput
              mode="outlined"
              label="Last name"
              value={lastName}
              onChangeText={setLastName}
              left={<TextInput.Icon icon="account-outline" />}
              style={styles.dialogInput}
              outlineStyle={styles.dialogOutline}
            />
            <TextInput
              mode="outlined"
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              left={<TextInput.Icon icon="email-outline" />}
              style={styles.dialogInput}
              outlineStyle={styles.dialogOutline}
            />
            <HelperText type="error" visible={!!formError}>{formError}</HelperText>
          </AppDialog>

          {/* Order history list / order detail */}
          <AppDialog
            visible={ordersOpen}
            onDismiss={() => setOrdersOpen(false)}
            icon={selectedOrder ? 'receipt' : 'package-variant-closed'}
            eyebrow="History"
            title={selectedOrder ? `Order #${selectedOrder.id}` : 'My orders'}
            subtitle={
              selectedOrder
                ? `${selectedOrder.totalQuantity} items · $${selectedOrder.discountedTotal.toFixed(2)}`
                : orders.length > 0
                  ? `${orders.length} ${orders.length === 1 ? 'order' : 'orders'} placed`
                  : 'Your purchases will appear here'
            }
            actions={
              selectedOrder
                ? [
                    { label: 'Back to orders', mode: 'outlined', icon: 'arrow-left', onPress: () => setSelectedOrder(null) },
                    { label: 'Close', onPress: () => setOrdersOpen(false) },
                  ]
                : [{ label: 'Close', onPress: () => setOrdersOpen(false) }]
            }
          >
            {ordersLoading && orders.length === 0 ? (
              <View style={styles.ordersLoading}>
                <ActivityIndicator color={palette.forest} />
                <Text style={styles.ordersLoadingText}>Loading your orders…</Text>
              </View>
            ) : selectedOrder ? (
              <>
                <View style={styles.orderSummary}>
                  <View style={styles.orderStat}>
                    <Text style={styles.orderStatLabel}>Total</Text>
                    <Text style={styles.orderStatValue}>${selectedOrder.discountedTotal.toFixed(2)}</Text>
                  </View>
                  <View style={styles.orderStat}>
                    <Text style={styles.orderStatLabel}>Items</Text>
                    <Text style={styles.orderStatValue}>{selectedOrder.totalQuantity}</Text>
                  </View>
                  <View style={styles.orderStat}>
                    <Text style={styles.orderStatLabel}>Saved</Text>
                    <Text style={styles.orderStatValue}>${(selectedOrder.total - selectedOrder.discountedTotal).toFixed(2)}</Text>
                  </View>
                </View>

                {selectedOrder.paymentMethod || selectedOrder.placedAt || selectedOrder.shippingAddress ? (
                  <View style={styles.orderMeta}>
                    {selectedOrder.paymentMethod ? (
                      <View style={styles.orderMetaRow}>
                        <MaterialCommunityIcons
                          name={selectedOrder.paymentMethod === 'cod' ? 'cash-multiple' : selectedOrder.paymentMethod === 'wallet' ? 'wallet-outline' : 'credit-card-outline'}
                          size={16}
                          color={palette.forest}
                        />
                        <Text style={styles.orderMetaText}>{PAYMENT_LABELS[selectedOrder.paymentMethod]}</Text>
                      </View>
                    ) : null}
                    {selectedOrder.placedAt ? (
                      <View style={styles.orderMetaRow}>
                        <MaterialCommunityIcons name="calendar-clock" size={16} color={palette.forest} />
                        <Text style={styles.orderMetaText}>{new Date(selectedOrder.placedAt).toLocaleString()}</Text>
                      </View>
                    ) : null}
                    {selectedOrder.shippingAddress ? (
                      <View style={styles.orderMetaRow}>
                        <MaterialCommunityIcons name="map-marker-outline" size={16} color={palette.forest} />
                        <Text style={styles.orderMetaText} numberOfLines={2}>{selectedOrder.shippingAddress}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                <DialogSectionLabel>Items in this order</DialogSectionLabel>
                {selectedOrder.products.map((p) => (
                  <DialogRow
                    key={p.id}
                    image={p.thumbnail}
                    title={p.title}
                    subtitle={`Qty ${p.quantity} · $${p.price.toFixed(2)} each`}
                    meta={`$${p.discountedTotal.toFixed(2)}`}
                  />
                ))}
              </>
            ) : orders.length === 0 ? (
              <DialogEmptyState
                icon="package-variant"
                title="No orders yet"
                message="When you place your first order it will show up here with its items and total."
                action={
                  <Button
                    mode="contained"
                    icon="shopping-outline"
                    onPress={() => {
                      setOrdersOpen(false);
                      router.push('/(app)/(tabs)/home');
                    }}
                  >
                    Start shopping
                  </Button>
                }
              />
            ) : (
              orders.map((o) => (
                <DialogRow
                  key={o.id}
                  icon="package-variant-closed"
                  title={`Order #${o.id}`}
                  subtitle={`${o.totalProducts} ${o.totalProducts === 1 ? 'product' : 'products'} · ${o.totalQuantity} items${o.paymentMethod ? ` · ${PAYMENT_LABELS[o.paymentMethod]}` : ''}`}
                  meta={`$${o.discountedTotal.toFixed(2)}`}
                  onPress={() => setSelectedOrder(o)}
                  actions={<MaterialCommunityIcons name="chevron-right" size={22} color={palette.stone} />}
                />
              ))
            )}
          </AppDialog>

          {/* Payment methods: list */}
          <AppDialog
            visible={paymentOpen && !removeMethod}
            onDismiss={() => setPaymentOpen(false)}
            icon="credit-card-multiple-outline"
            eyebrow="Wallet"
            title="Payment methods"
            subtitle={
              methods.length === 0
                ? 'Add a card or e-wallet for faster checkout'
                : `${methods.length} saved ${methods.length === 1 ? 'method' : 'methods'}`
            }
            actions={[
              { label: 'Add new', mode: 'outlined', icon: 'plus', onPress: openAddMethod },
              { label: 'Done', onPress: () => setPaymentOpen(false) },
            ]}
            footerNote="Only the brand and last 4 digits are saved on this device."
          >
            {methods.length === 0 ? (
              <DialogEmptyState
                icon="credit-card-off-outline"
                title="No payment methods"
                message="Save a card or e-wallet and checkout will remember it for next time."
                action={
                  <Button mode="contained" icon="plus" onPress={openAddMethod}>
                    Add a payment method
                  </Button>
                }
              />
            ) : (
              methods.map((m) => (
                <DialogRow
                  key={m.id}
                  icon={m.type === 'card' ? 'credit-card-outline' : 'wallet-outline'}
                  title={`${m.brand} •••• ${m.last4}`}
                  subtitle={m.type === 'card' ? `${m.holder} · expires ${m.expiry}` : `${m.holder} · e-wallet`}
                  badge={m.isDefault ? 'Default' : undefined}
                  actions={
                    <IconButton
                      icon="delete-outline"
                      size={20}
                      iconColor={palette.danger}
                      onPress={() => setRemoveMethod(m)}
                      accessibilityLabel="Remove payment method"
                    />
                  }
                  footer={
                    !m.isDefault ? (
                      <Button mode="text" compact icon="star-outline" onPress={() => makeDefault(m.id)} labelStyle={styles.smallLabel}>
                        Make default
                      </Button>
                    ) : undefined
                  }
                />
              ))
            )}
          </AppDialog>

          {/* Payment methods: add a card or wallet */}
          <AppDialog
            visible={addOpen}
            onDismiss={closeAddMethod}
            icon="credit-card-plus-outline"
            eyebrow="Wallet"
            title="Add payment method"
            subtitle="Cards are checked once and never stored in full."
            actions={[
              { label: 'Cancel', onPress: closeAddMethod },
              { label: 'Save method', onPress: saveMethod, icon: 'check' },
            ]}
            footerNote={
              pmType === 'card'
                ? 'The full number is only used to validate the card and is not saved.'
                : 'Only the last 4 characters of your number are saved.'
            }
          >
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
            />
            {pmType === 'card' ? (
              <>
                <TextInput
                  mode="outlined"
                  label="Card number"
                  placeholder={cardLength === 15 ? '1234 567890 12345' : '1234 5678 9012 3456'}
                  value={pmNumber}
                  onChangeText={(t) => setPmNumber(formatCardNumber(t))}
                  keyboardType="number-pad"
                  maxLength={23}
                  error={!!pmErrors.number}
                  left={<TextInput.Icon icon="credit-card-outline" />}
                  right={<TextInput.Affix text={`${cardDigits.length}/${cardLength}`} />}
                  style={styles.dialogInput}
                  outlineStyle={styles.dialogOutline}
                />
                <HelperText type={pmErrors.number ? 'error' : 'info'} visible>
                  {pmErrors.number ??
                    (cardDigits.length === 0
                      ? `Enter your ${cardLength}-digit ${cardBrand !== 'Card' ? cardBrand : 'card'} number`
                      : `${cardBrand} · ${cardDigits.length} of ${cardLength} digits`)}
                </HelperText>
                <TextInput
                  mode="outlined"
                  label="Name on card"
                  placeholder="As printed on the card"
                  value={pmHolder}
                  onChangeText={setPmHolder}
                  error={!!pmErrors.holder}
                  left={<TextInput.Icon icon="account-outline" />}
                  style={styles.dialogInput}
                  outlineStyle={styles.dialogOutline}
                />
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
                  left={<TextInput.Icon icon="calendar-blank-outline" />}
                  style={styles.dialogInput}
                  outlineStyle={styles.dialogOutline}
                />
                <HelperText type={pmErrors.expiry ? 'error' : 'info'} visible>
                  {pmErrors.expiry ?? 'Month / year, for example 08/28'}
                </HelperText>
              </>
            ) : (
              <>
                <DialogSectionLabel>Provider</DialogSectionLabel>
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
                  left={<TextInput.Icon icon="cellphone" />}
                  style={styles.dialogInput}
                  outlineStyle={styles.dialogOutline}
                />
                <HelperText type={pmErrors.account ? 'error' : 'info'} visible>
                  {pmErrors.account ?? 'For example 0917 123 4567 or name@email.com'}
                </HelperText>
                <TextInput
                  mode="outlined"
                  label="Account name"
                  value={pmHolder}
                  onChangeText={setPmHolder}
                  error={!!pmErrors.holder}
                  left={<TextInput.Icon icon="account-outline" />}
                  style={styles.dialogInput}
                  outlineStyle={styles.dialogOutline}
                />
                <HelperText type="error" visible={!!pmErrors.holder}>{pmErrors.holder}</HelperText>
              </>
            )}
          </AppDialog>

          {/* Payment methods: remove confirmation */}
          <AppDialog
            visible={!!removeMethod}
            onDismiss={() => setRemoveMethod(null)}
            icon="credit-card-remove-outline"
            eyebrow="Remove"
            title="Remove payment method?"
            subtitle="You can add it again whenever you need it."
            tone="danger"
            scroll={false}
            actions={[
              { label: 'Keep it', onPress: () => setRemoveMethod(null) },
              { label: 'Remove', tone: 'danger', icon: 'trash-can-outline', onPress: confirmRemoveMethod },
            ]}
          >
            {removeMethod ? (
              <DialogRow
                icon={removeMethod.type === 'card' ? 'credit-card-outline' : 'wallet-outline'}
                title={`${removeMethod.brand} •••• ${removeMethod.last4}`}
                subtitle={removeMethod.type === 'card' ? `${removeMethod.holder} · expires ${removeMethod.expiry}` : `${removeMethod.holder} · e-wallet`}
                badge={removeMethod.isDefault ? 'Default' : undefined}
              />
            ) : null}
          </AppDialog>

          {/* Settings: theme, notifications, privacy */}
          <AppDialog
            visible={settingsOpen}
            onDismiss={() => setSettingsOpen(false)}
            icon="cog-outline"
            eyebrow="Preferences"
            title="Settings"
            subtitle="Make the app feel like yours."
            actions={[
              {
                label: 'Reset',
                tone: 'danger',
                onPress: () => {
                  resetSettings();
                  setSnack('Settings reset');
                },
              },
              { label: 'Done', onPress: () => setSettingsOpen(false) },
            ]}
            footerNote="Preferences are saved on this device."
          >
            <DialogSectionLabel>Appearance</DialogSectionLabel>
            <SegmentedButtons
              value={settings.theme}
              onValueChange={(v) => updateSettings({ theme: v as ThemeMode })}
              buttons={[
                { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
                { value: 'dark', label: 'Dark', icon: 'weather-night' },
                { value: 'system', label: 'System', icon: 'cellphone' },
              ]}
            />

            <DialogSectionLabel>Notifications</DialogSectionLabel>
            <DialogToggleRow
              icon="truck-delivery-outline"
              title="Order updates"
              description="Status of your orders"
              value={settings.notifications.orders}
              onValueChange={(v) => updateSettings({ notifications: { ...settings.notifications, orders: v } })}
            />
            <DialogToggleRow
              icon="tag-outline"
              title="Deals & promotions"
              description="Sales and limited-time offers"
              value={settings.notifications.promotions}
              onValueChange={(v) => updateSettings({ notifications: { ...settings.notifications, promotions: v } })}
            />
            <DialogToggleRow
              icon="package-variant-closed"
              title="New arrivals"
              description="When new products land"
              value={settings.notifications.arrivals}
              onValueChange={(v) => updateSettings({ notifications: { ...settings.notifications, arrivals: v } })}
            />

            <DialogSectionLabel>Privacy</DialogSectionLabel>
            <DialogToggleRow
              icon="magnify"
              title="Save recent searches"
              description="Show them under the search bar"
              value={settings.privacy.saveRecentSearches}
              onValueChange={(v) => updateSettings({ privacy: { ...settings.privacy, saveRecentSearches: v } })}
            />
            <DialogToggleRow
              icon="email-outline"
              title="Show my email"
              description="Hide it on this screen when off"
              value={settings.privacy.showEmail}
              onValueChange={(v) => updateSettings({ privacy: { ...settings.privacy, showEmail: v } })}
            />

            <Button mode="outlined" icon="history" onPress={clearSearchHistory} style={styles.dialogWideButton} contentStyle={styles.dialogWideButtonContent}>
              Clear search history
            </Button>
            <Button
              mode="outlined"
              icon="credit-card-remove-outline"
              onPress={removeAllMethods}
              style={styles.dialogWideButton}
              contentStyle={styles.dialogWideButtonContent}
              disabled={methods.length === 0}
            >
              Remove saved payment methods
            </Button>
          </AppDialog>

          <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={2500}>
            {snack}
          </Snackbar>
        </Portal>
      </ScrollView>
    </Screen>
  );
}