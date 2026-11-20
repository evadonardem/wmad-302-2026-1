/**
 * Profile Screen - Crimson Obsidian Dark Glassmorphism (2-Column Desktop Dashboard)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CrimsonAmbientBackdrop } from '@/components/CrimsonAmbientBackdrop';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { productApi } from '@/services/productApi';
import { OrderRecord } from '@/types/product';
import {
  Button,
  Avatar,
  TextInput as PaperTextInput,
  Switch,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CrimsonHeader } from '@/components/CrimsonHeader';
import { useDesignMode } from '@/context/DesignModeContext';
import { GLASS_PALETTE, glassSurface } from '@/constants/glassTheme';
import { styles } from './profileStyles';

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isCrimson } = useDesignMode();
  const { user, logout, isAuthenticated, updateUserProfile } = useAuth();
  const { wishlist, localOrders, toggleWishlist, addToCart } = useCart();

  const [apiOrders, setApiOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [ordersModalVisible, setOrdersModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [wishlistModalVisible, setWishlistModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  const [draftFirstName, setDraftFirstName] = useState(user?.firstName || '');
  const [draftLastName, setDraftLastName] = useState(user?.lastName || '');
  const [draftEmail, setDraftEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [addresses, setAddresses] = useState<string[]>([
    '123 Session Road, Baguio City, Benguet 2600 (Default)',
    '45 Burnham Park Drive, Baguio City, Benguet 2600',
  ]);
  const [newAddress, setNewAddress] = useState('');
  const [orderNotifs, setOrderNotifs] = useState(true);
  const [promoNotifs, setPromoNotifs] = useState(true);

  const isDesktop = width >= 920;

  const loadOrderHistory = useCallback(async () => {
    if (!user?.id) return;
    setLoadingOrders(true);
    try {
      const fetched = await productApi.getUserOrders(user.id);
      setApiOrders(fetched);
    } catch {
      setApiOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadOrderHistory();
  }, [loadOrderHistory]);

  const allOrders = [...localOrders, ...apiOrders];
  const totalSpent = allOrders.reduce((sum, o) => sum + (o.discountedTotal || o.total || 0), 0);

  const openEditModal = () => {
    setDraftFirstName(user?.firstName || '');
    setDraftLastName(user?.lastName || '');
    setDraftEmail(user?.email || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!draftFirstName.trim() || !draftLastName.trim() || !draftEmail.trim()) {
      const msg = 'First name, last name, and email are required.';
      if (Platform.OS === 'web') { window.alert(msg); } else { Alert.alert('Validation', msg); }
      return;
    }

    setSavingProfile(true);
    try {
      if (user?.id) {
        await productApi.updateUserProfile(user.id, {
          firstName: draftFirstName.trim(),
          lastName: draftLastName.trim(),
          email: draftEmail.trim(),
        });
      }
      await updateUserProfile({
        firstName: draftFirstName.trim(),
        lastName: draftLastName.trim(),
        email: draftEmail.trim(),
      });
      setEditModalVisible(false);
    } catch {
      await updateUserProfile({
        firstName: draftFirstName.trim(),
        lastName: draftLastName.trim(),
        email: draftEmail.trim(),
      });
      setEditModalVisible(false);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      await logout();
      router.replace('/(auth)/login');
      return;
    }

    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: isCrimson ? '#09090D' : '#F4F6FA', backgroundImage: isCrimson ? undefined : 'radial-gradient(circle at 18% 15%, rgba(251,191,36,0.22), transparent 45%), radial-gradient(circle at 85% 25%, rgba(56,189,248,0.18), transparent 48%)' } as object]}>
      <CrimsonAmbientBackdrop />
      <CrimsonHeader />
        <View style={styles.centerContainer}>
          <Text style={styles.notLoggedIn}>Please log in to view profile</Text>
        </View>
      </View>
    );
  }

  const menuItems = [
    {
      key: 'orders',
      title: 'My Orders',
      sub: 'View order history & track shipments',
      icon: 'package-variant' as const,
      active: true,
      onPress: () => setOrdersModalVisible(true),
    },
    {
      key: 'wishlist',
      title: 'Wishlist',
      sub: `${wishlist.length} saved items`,
      icon: 'heart-outline' as const,
      active: false,
      onPress: () => setWishlistModalVisible(true),
    },
    {
      key: 'addresses',
      title: 'Delivery Addresses',
      sub: `${addresses.length} saved addresses`,
      icon: 'map-marker-outline' as const,
      active: false,
      onPress: () => setAddressModalVisible(true),
    },
    {
      key: 'edit',
      title: 'Edit Profile',
      sub: 'Update your name & email (PUT /users)',
      icon: 'account-edit-outline' as const,
      active: false,
      onPress: openEditModal,
    },
    {
      key: 'settings',
      title: 'Settings',
      sub: 'Notifications & preferences',
      icon: 'cog-outline' as const,
      active: false,
      onPress: () => setSettingsModalVisible(true),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: isCrimson ? '#09090D' : '#F4F6FA', backgroundImage: isCrimson ? undefined : 'radial-gradient(circle at 18% 15%, rgba(251,191,36,0.22), transparent 45%), radial-gradient(circle at 85% 25%, rgba(56,189,248,0.18), transparent 48%)' } as object]}>
      <CrimsonHeader />

      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={{
            flexDirection: isDesktop ? 'row' : 'column',
            alignItems: 'flex-start',
            gap: 18,
          }}
        >
          {/* Left Sidebar Card (Avatar + Quick Menu + Logout) */}
          <View
            style={[
              glassSurface(0.82, 20, true),
              {
                width: isDesktop ? 290 : '100%',
                padding: 18,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
              <Avatar.Image
                size={62}
                source={{
                  uri: user?.image || 'https://dummyjson.com/icon/emilys/128',
                }}
                style={styles.avatar}
              />
              <View style={styles.nameContainer}>
                <Text style={styles.name} numberOfLines={1}>
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text style={styles.username}>@{user?.username}</Text>
                <Text style={styles.email} numberOfLines={1}>
                  {user?.email}
                </Text>
              </View>
            </View>

            <View style={{ gap: 6 }}>
              {menuItems.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  onPress={m.onPress}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 11,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    backgroundColor: m.active ? GLASS_PALETTE.crimson : 'transparent',
                  }}
                >
                  <MaterialCommunityIcons
                    name={m.icon}
                    size={20}
                    color={m.active ? '#FFFFFF' : '#E11D48'}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: m.active ? '#FFFFFF' : '#CBD5E1',
                    }}
                  >
                    {m.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: 'rgba(255,255,255,0.1)',
                marginVertical: 16,
              }}
            />

            <TouchableOpacity
              onPress={handleLogout}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 10,
                paddingHorizontal: 14,
              }}
            >
              <MaterialCommunityIcons name="logout" size={20} color="#FF1E42" />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#CBD5E1' }}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Right Dashboard Column (3 Glowing Stat Cards + Detailed Action Cards) */}
          <View style={{ flex: 1, width: '100%' }}>
            {/* 3 Stat Cards Row */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>
              <TouchableOpacity
                style={[
                  glassSurface(0.82, 18, true),
                  { flex: 1, paddingVertical: 22, alignItems: 'center' },
                ]}
                onPress={() => setOrdersModalVisible(true)}
              >
                <Text style={styles.statValue}>{allOrders.length}</Text>
                <Text style={styles.statLabel}>Orders</Text>
              </TouchableOpacity>

              <View
                style={[
                  glassSurface(0.82, 18, true),
                  { flex: 1, paddingVertical: 22, alignItems: 'center' },
                ]}
              >
                <Text style={styles.statValue}>₱{totalSpent.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Spent</Text>
              </View>

              <TouchableOpacity
                style={[
                  glassSurface(0.82, 18, true),
                  { flex: 1, paddingVertical: 22, alignItems: 'center' },
                ]}
                onPress={() => setWishlistModalVisible(true)}
              >
                <Text style={styles.statValue}>{wishlist.length}</Text>
                <Text style={styles.statLabel}>Wishlist</Text>
              </TouchableOpacity>
            </View>

            {/* Detailed Account Panels */}
            <View style={[glassSurface(0.82, 18, true), { padding: 8 }]}>
              {menuItems.map((m, idx) => (
                <React.Fragment key={m.key}>
                  <TouchableOpacity
                    onPress={m.onPress}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 14,
                      paddingHorizontal: 14,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          backgroundColor: 'rgba(225, 29, 72, 0.16)',
                          borderWidth: 1,
                          borderColor: GLASS_PALETTE.crimsonBorder,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MaterialCommunityIcons name={m.icon} size={20} color="#E11D48" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
                          {m.title}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                          {m.sub}
                        </Text>
                      </View>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
                  </TouchableOpacity>
                  {idx < menuItems.length - 1 && (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        marginHorizontal: 14,
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Order History & Order Detail Modal */}
      <Modal
        visible={ordersModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setSelectedOrder(null);
          setOrdersModalVisible(false);
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.75)',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <View
            style={[
              glassSurface(0.95, 20, true),
              { padding: 18, maxHeight: '85%', maxWidth: 540, width: '100%', alignSelf: 'center' },
            ]}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>
                {selectedOrder ? `Order #${selectedOrder.id}` : `Order History (${allOrders.length})`}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (selectedOrder) {
                    setSelectedOrder(null);
                  } else {
                    setOrdersModalVisible(false);
                  }
                }}
              >
                <MaterialCommunityIcons
                  name={selectedOrder ? 'arrow-left' : 'close'}
                  size={24}
                  color="#CBD5E1"
                />
              </TouchableOpacity>
            </View>

            {loadingOrders ? (
              <ActivityIndicator size="large" color="#E11D48" style={{ marginVertical: 24 }} />
            ) : selectedOrder ? (
              <ScrollView>
                <Text style={{ fontSize: 12, color: '#CBD5E1', marginBottom: 4 }}>
                  Status:{' '}
                  <Text style={{ fontWeight: '700', color: '#22C55E' }}>{selectedOrder.status}</Text>
                </Text>
                <Text style={{ fontSize: 12, color: '#CBD5E1', marginBottom: 4 }}>
                  Payment: {selectedOrder.paymentMethod}
                </Text>
                <Text style={{ fontSize: 12, color: '#CBD5E1', marginBottom: 12 }}>
                  Address: {selectedOrder.shippingAddress}
                </Text>

                {selectedOrder.items.map((item, idx) => (
                  <View
                    key={`${item.id}-${idx}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingVertical: 8,
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <Image
                      source={{ uri: item.thumbnail }}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        backgroundColor: 'rgba(255,255,255,0.06)',
                      }}
                      resizeMode="contain"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                        {item.title}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#94A3B8' }}>
                        Qty: {item.quantity} × ₱{item.price.toFixed(2)}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#FF1E42' }}>
                      ₱{(item.discountedTotal || item.total).toFixed(2)}
                    </Text>
                  </View>
                ))}

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: 14,
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255,255,255,0.12)',
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
                    Order Total
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#FF1E42' }}>
                    ₱{selectedOrder.discountedTotal.toFixed(2)}
                  </Text>
                </View>
              </ScrollView>
            ) : allOrders.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#94A3B8', marginVertical: 24 }}>
                No orders yet. Checkout items from your cart!
              </Text>
            ) : (
              <ScrollView contentContainerStyle={{ gap: 10 }}>
                {allOrders.map((ord) => (
                  <TouchableOpacity
                    key={`${ord.id}-${ord.date}`}
                    onPress={() => setSelectedOrder(ord)}
                    style={{
                      borderWidth: 1,
                      borderColor: GLASS_PALETTE.crimsonBorder,
                      borderRadius: 12,
                      padding: 12,
                      backgroundColor: 'rgba(255,255,255,0.04)',
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
                        Order #{ord.id}
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#22C55E' }}>
                        {ord.status}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#CBD5E1' }}>
                      {ord.totalQuantity} item(s) · Total: ₱{ord.discountedTotal.toFixed(2)}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#FF1E42', marginTop: 4 }}>
                      Tap to view items →
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Wishlist Modal */}
      <Modal
        visible={wishlistModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWishlistModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.75)',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <View
            style={[
              glassSurface(0.95, 20, true),
              { padding: 18, maxHeight: '80%', maxWidth: 540, width: '100%', alignSelf: 'center' },
            ]}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>
                My Wishlist ({wishlist.length})
              </Text>
              <TouchableOpacity onPress={() => setWishlistModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#CBD5E1" />
              </TouchableOpacity>
            </View>

            {wishlist.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#94A3B8', marginVertical: 24 }}>
                No saved wishlist items yet.
              </Text>
            ) : (
              <ScrollView contentContainerStyle={{ gap: 10 }}>
                {wishlist.map((prod) => (
                  <View
                    key={prod.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.12)',
                      borderRadius: 12,
                      padding: 10,
                    }}
                  >
                    <Image
                      source={{ uri: prod.thumbnail }}
                      style={{ width: 54, height: 54, borderRadius: 8 }}
                      resizeMode="contain"
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}
                        numberOfLines={1}
                      >
                        {prod.title}
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#FF1E42' }}>
                        ₱{prod.price.toFixed(2)}
                      </Text>
                    </View>
                    <Button
                      mode="contained"
                      buttonColor="#E11D48"
                      textColor="#FFFFFF"
                      compact
                      onPress={() => {
                        addToCart(prod, 1);
                        toggleWishlist(prod);
                      }}
                    >
                      Move to Cart
                    </Button>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.75)',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <View
            style={[
              glassSurface(0.95, 20, true),
              { padding: 20, maxWidth: 480, width: '100%', alignSelf: 'center' },
            ]}
          >
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 14 }}>
              Edit Profile
            </Text>
            <PaperTextInput
              label="First Name"
              mode="outlined"
              outlineColor="rgba(255,255,255,0.2)"
              activeOutlineColor="#E11D48"
              textColor="#FFFFFF"
              value={draftFirstName}
              onChangeText={setDraftFirstName}
              style={{ marginBottom: 12, backgroundColor: 'rgba(12, 12, 18, 0.9)' }}
            />
            <PaperTextInput
              label="Last Name"
              mode="outlined"
              outlineColor="rgba(255,255,255,0.2)"
              activeOutlineColor="#E11D48"
              textColor="#FFFFFF"
              value={draftLastName}
              onChangeText={setDraftLastName}
              style={{ marginBottom: 12, backgroundColor: 'rgba(12, 12, 18, 0.9)' }}
            />
            <PaperTextInput
              label="Email"
              mode="outlined"
              outlineColor="rgba(255,255,255,0.2)"
              activeOutlineColor="#E11D48"
              textColor="#FFFFFF"
              value={draftEmail}
              onChangeText={setDraftEmail}
              autoCapitalize="none"
              style={{ marginBottom: 16, backgroundColor: 'rgba(12, 12, 18, 0.9)' }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button
                mode="outlined"
                textColor="#CBD5E1"
                onPress={() => setEditModalVisible(false)}
                style={{ flex: 1, borderColor: 'rgba(255,255,255,0.2)' }}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                buttonColor="#E11D48"
                textColor="#FFFFFF"
                loading={savingProfile}
                disabled={savingProfile}
                onPress={handleSaveProfile}
                style={{ flex: 1 }}
              >
                Save
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Addresses Modal */}
      <Modal
        visible={addressModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.75)',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <View
            style={[
              glassSurface(0.95, 20, true),
              { padding: 20, maxWidth: 480, width: '100%', alignSelf: 'center' },
            ]}
          >
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 12 }}>
              Saved Addresses
            </Text>
            {addresses.map((addr, i) => (
              <View
                key={`${addr}-${i}`}
                style={{
                  padding: 10,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 13, color: '#CBD5E1' }}>{addr}</Text>
              </View>
            ))}
            <PaperTextInput
              label="Add New Address"
              mode="outlined"
              outlineColor="rgba(255,255,255,0.2)"
              activeOutlineColor="#E11D48"
              textColor="#FFFFFF"
              value={newAddress}
              onChangeText={setNewAddress}
              style={{ marginVertical: 10, backgroundColor: 'rgba(12, 12, 18, 0.9)' }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button
                mode="outlined"
                textColor="#CBD5E1"
                onPress={() => setAddressModalVisible(false)}
                style={{ flex: 1, borderColor: 'rgba(255,255,255,0.2)' }}
              >
                Close
              </Button>
              <Button
                mode="contained"
                buttonColor="#E11D48"
                textColor="#FFFFFF"
                onPress={() => {
                  if (newAddress.trim()) {
                    setAddresses((prev) => [...prev, newAddress.trim()]);
                    setNewAddress('');
                  }
                }}
                style={{ flex: 1 }}
              >
                Add
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.75)',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <View
            style={[
              glassSurface(0.95, 20, true),
              { padding: 20, maxWidth: 480, width: '100%', alignSelf: 'center' },
            ]}
          >
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 14 }}>
              Settings
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <Text style={{ fontSize: 14, color: '#CBD5E1' }}>Order Status Notifications</Text>
              <Switch color="#E11D48" value={orderNotifs} onValueChange={setOrderNotifs} />
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 18,
              }}
            >
              <Text style={{ fontSize: 14, color: '#CBD5E1' }}>
                Flash Deal &amp; Voucher Alerts
              </Text>
              <Switch color="#E11D48" value={promoNotifs} onValueChange={setPromoNotifs} />
            </View>
            <Button
              mode="contained"
              buttonColor="#E11D48"
              textColor="#FFFFFF"
              onPress={() => setSettingsModalVisible(false)}
            >
              Done
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}