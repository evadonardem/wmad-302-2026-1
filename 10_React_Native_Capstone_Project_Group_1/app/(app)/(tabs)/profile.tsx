/**
 * Profile Screen - Marketplace
 * Manages user profile, local order history, More Activities grid
 * (Affiliate Program, Earn with Marketlist, Wishlist, Recently Viewed), Support section
 * (Help Centre, Community Rules, Marketplace Policies, Happy with Marketplace? Rate us!, About),
 * external Account Settings module, and infinite-scroll "You May Also Like" product recommendations.
 * Responsive across Website, Tablet, and Phones (Realme, Samsung, Xiaomi, OPPO, Vivo, iPhone).
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
  useWindowDimensions,
  DeviceEventEmitter,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Avatar,
  Title,
  Divider,
  IconButton,
  TextInput,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../context/AuthContext';
import { useAppTheme } from '../../../context/ThemeContext';
import {
  MarketplaceProduct,
  FlashSaleSchedule,
  getFlashSaleSchedules,
  evaluateProductPromotions,
} from '../../../utils/flashSaleHelpers';
import { createProfileStyles, getResponsiveMetrics } from './profileStyles';
import AccountSettingsModal, {
  SettingsRoute,
} from './AccountSettingsModal';

const RECOMMENDED_PAGE_SIZE = 12;

interface Order {
  id: number | string;
  total: number;
  discountedTotal: number;
  totalProducts: number;
}

interface WishlistItem {
  id: number;
  productId: number;
  title: string;
  price: number;
  discountPercentage?: number;
  thumbnail: string;
  category?: string;
  rating?: number;
  stock?: number;
  addedAt?: string;
}

interface RecentlyViewedItem {
  id: number;
  productId: number;
  title: string;
  price: number;
  thumbnail: string;
  discountPercentage?: number;
  viewedAt?: string;
}

type InfoModalType =
  | null
  | 'affiliate'
  | 'earn'
  | 'wishlist'
  | 'recently_viewed'
  | 'help_centre'
  | 'community_rules'
  | 'policies'
  | 'rate_us'
  | 'about';

export default function ProfileScreen() {
  const {
    user,
    isAuthenticated,
    isLoadingAuth,
  } = useAuth();
  const { palette } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ openAddresses?: string }>();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const metrics = useMemo(
    () => getResponsiveMetrics(width, height, insets.top, insets.bottom),
    [width, height, insets.top, insets.bottom]
  );
  const styles = useMemo(() => createProfileStyles(palette, metrics), [palette, metrics]);
  const { isDesktop, isTablet, isSmallPhone, numColumns, edgePaddingX } = metrics;
  const isMobile = !isDesktop && !isTablet;

  const bottomScrollSpace =
    Platform.OS === 'web'
      ? isMobile
        ? 110
        : 60
      : Math.max(insets.bottom + 110, 120);

  const webGlassStyle: any =
    Platform.OS === 'web'
      ? { backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }
      : {};

  const webAmbientBackdropStyle: any =
    Platform.OS === 'web'
      ? {
          backgroundImage: palette.isDark
            ? 'radial-gradient(circle at 12% 10%, rgba(254, 44, 85, 0.22), transparent 42%), radial-gradient(circle at 88% 16%, rgba(59, 130, 246, 0.20), transparent 44%), radial-gradient(circle at 50% 85%, rgba(16, 185, 129, 0.15), transparent 46%), linear-gradient(135deg, #0B1120 0%, #111827 50%, #17152B 100%)'
            : 'radial-gradient(circle at 10% 8%, rgba(254, 44, 85, 0.16), transparent 42%), radial-gradient(circle at 90% 14%, rgba(56, 189, 248, 0.20), transparent 44%), radial-gradient(circle at 18% 82%, rgba(168, 85, 247, 0.12), transparent 44%), radial-gradient(circle at 84% 86%, rgba(251, 146, 60, 0.14), transparent 46%), linear-gradient(135deg, #F8FAFC 0%, #EEF4FF 48%, #FFF3F6 100%)',
        }
      : {};

  const webPrimaryButtonGradient: any =
    Platform.OS === 'web'
      ? {
          backgroundImage: 'linear-gradient(90deg, #FE2C55 0%, #FF5E7E 100%)',
          boxShadow: '0 8px 20px rgba(254, 44, 85, 0.28)',
        }
      : {};

  // Per-account storage keys so each logged-in user keeps isolated data & syncs across screens
  const userPrefix = `@marketplace_user_${user?.id || 'guest'}`;
  const userKeys = {
    wishlist: `${userPrefix}_wishlist`,
    orders: `${userPrefix}_orders`,
    addresses: `${userPrefix}_addresses`,
    activeAddress: `${userPrefix}_address`,
    profileExtra: `${userPrefix}_profile_extra`,
    cart: `${userPrefix}_cart`,
    privacy: `${userPrefix}_privacy`,
    savedForLater: `${userPrefix}_saved_for_later`,
    securityPrefs: `${userPrefix}_security_prefs`,
    linkedCards: `${userPrefix}_linked_cards`,
    linkedBanks: `${userPrefix}_linked_banks`,
    activityLog: `${userPrefix}_activity_log`,
    loginDevices: `${userPrefix}_login_devices`,
    recentlyViewed: `${userPrefix}_recently_viewed`,
  };

  // ==================== DEDICATED SETTINGS MODAL STATE ====================
  const [settingsHubVisible, setSettingsHubVisible] = useState(false);
  const [settingsInitialRoute, setSettingsInitialRoute] =
    useState<SettingsRoute>('account_settings');

  const openAccountSettings = (route: SettingsRoute = 'account_settings') => {
    setSettingsInitialRoute(route);
    setSettingsHubVisible(true);
  };

  // ==================== CORE PROFILE, ORDERS, WISHLIST & RECENTLY VIEWED STATE ====================
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bio, setBio] = useState('');
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [recentlyViewedItems, setRecentlyViewedItems] = useState<RecentlyViewedItem[]>([]);

  const [ordersVisible, setOrdersVisible] = useState(false);
  const [activeInfoModal, setActiveInfoModal] = useState<InfoModalType>(null);
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [ratingFeedback, setRatingFeedback] = useState<string>('');
  const [affiliateJoined, setAffiliateJoined] = useState<boolean>(false);

  // ==================== "YOU MAY ALSO LIKE" INFINITE SCROLL PRODUCTS STATE ====================
  const [recommendedProducts, setRecommendedProducts] = useState<
    Array<MarketplaceProduct & { _renderKey?: string }>
  >([]);
  const [recSkip, setRecSkip] = useState<number>(0);
  const [loadingRec, setLoadingRec] = useState<boolean>(true);
  const [loadingMoreRec, setLoadingMoreRec] = useState<boolean>(false);
  const fetchRecLockRef = useRef<boolean>(false);
  const [flashSchedules, setFlashSchedules] = useState<Record<number, FlashSaleSchedule>>({});
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
      const schedules = await getFlashSaleSchedules();
      setFlashSchedules(schedules);
    })();
  }, []);

  const fetchRecommendedProducts = useCallback(
    async (reset = false) => {
      if (fetchRecLockRef.current && !reset) return;

      const currentSkip = reset ? 0 : recSkip;
      fetchRecLockRef.current = true;

      try {
        if (reset) {
          setLoadingRec(true);
        } else {
          setLoadingMoreRec(true);
        }

        const res = await fetch(
          `https://dummyjson.com/products?limit=${RECOMMENDED_PAGE_SIZE}&skip=${currentSkip}`
        );
        if (!res.ok) throw new Error('Failed to fetch recommended products');
        const data = await res.json();
        const incoming: MarketplaceProduct[] = data.products || [];
        const totalCount: number = data.total || 0;

        if (reset) {
          const batchStamp = Date.now();
          setRecommendedProducts(
            incoming.map((p, idx) => ({
              ...p,
              _renderKey: `rec-${p.id}-0-${idx}-${batchStamp}`,
            }))
          );
          setRecSkip(incoming.length >= totalCount ? 0 : incoming.length);
        } else if (incoming.length > 0) {
          const batchStamp = Date.now();
          setRecommendedProducts((prev) => [
            ...prev,
            ...incoming.map((p, idx) => ({
              ...p,
              _renderKey: `rec-${p.id}-${currentSkip}-${idx}-${batchStamp}`,
            })),
          ]);
          const nextSkip = currentSkip + incoming.length;
          // Wrap around to 0 when reaching catalog end so scrolling down keeps generating products endlessly
          setRecSkip(nextSkip >= totalCount ? 0 : nextSkip);
        }
      } catch (err) {
        console.error('Error fetching You May Also Like products:', err);
      } finally {
        setLoadingRec(false);
        setLoadingMoreRec(false);
        fetchRecLockRef.current = false;
      }
    },
    [recSkip]
  );

  useEffect(() => {
    fetchRecommendedProducts(true);
  }, []);

  // Scroll-bottom threshold listener for Web, Tablet & Phones (Realme, iPhone, Samsung, etc.)
  const handleListScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const distanceFromBottom =
        contentSize.height - (layoutMeasurement.height + contentOffset.y);
      if (distanceFromBottom < 460 && !fetchRecLockRef.current && !loadingRec) {
        fetchRecommendedProducts(false);
      }
    },
    [fetchRecommendedProducts, loadingRec]
  );

  const showMessage = (title: string, message: string) => {
    const webWin = (globalThis as any).window;
    if (Platform.OS === 'web' && webWin?.alert) {
      webWin.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const renderAmbientOrbs = () => (
    <View pointerEvents="none" style={styles.ambientBackgroundLayer}>
      <View style={styles.ambientOrbTopLeft} />
      <View style={styles.ambientOrbTopRight} />
      <View style={styles.ambientOrbCenter} />
      <View style={styles.ambientOrbBottomLeft} />
      <View style={styles.ambientOrbBottomRight} />
    </View>
  );

  // ==================== SYNCHRONIZED WISHLIST LOADER & ACTIONS ====================
  const loadWishlistData = useCallback(async () => {
    try {
      const [userRaw, legacyRaw] = await Promise.all([
        AsyncStorage.getItem(userKeys.wishlist),
        AsyncStorage.getItem('@marketplace_wishlist'),
      ]);
      const primaryRaw = userRaw !== null ? userRaw : legacyRaw;
      if (primaryRaw) {
        const parsed = JSON.parse(primaryRaw);
        if (Array.isArray(parsed)) {
          const seen = new Set<number>();
          const normalized: WishlistItem[] = [];
          for (const raw of parsed) {
            const prodId = Number(typeof raw === 'number' ? raw : raw?.productId ?? raw?.id);
            if (!prodId || seen.has(prodId)) continue;
            seen.add(prodId);
            if (typeof raw === 'object' && raw !== null) {
              normalized.push({
                id: prodId,
                productId: prodId,
                title: raw.title || `Product #${prodId}`,
                price: Number(raw.price) || 0,
                discountPercentage: Number(raw.discountPercentage) || 0,
                thumbnail:
                  raw.thumbnail ||
                  `https://cdn.dummyjson.com/product-images/${prodId}/thumbnail.webp`,
                category: raw.category,
                rating: Number(raw.rating) || 0,
                stock: typeof raw.stock === 'number' ? raw.stock : 99,
                addedAt: raw.addedAt,
              });
            } else {
              normalized.push({
                id: prodId,
                productId: prodId,
                title: `Saved Product #${prodId}`,
                price: 0,
                discountPercentage: 0,
                thumbnail: `https://cdn.dummyjson.com/product-images/${prodId}/thumbnail.webp`,
                stock: 99,
              });
            }
          }
          setWishlistItems(normalized);
          setWishlistCount(normalized.length);
          return;
        }
      }
      setWishlistItems([]);
      setWishlistCount(0);
    } catch {
      setWishlistItems([]);
      setWishlistCount(0);
    }
  }, [userKeys.wishlist]);

  const handleRemoveFromWishlist = async (prodId: number) => {
    try {
      const updated = wishlistItems.filter((item) => Number(item.productId ?? item.id) !== prodId);
      setWishlistItems(updated);
      setWishlistCount(updated.length);
      const serialized = JSON.stringify(updated);
      await Promise.all([
        AsyncStorage.setItem(userKeys.wishlist, serialized),
        AsyncStorage.setItem('@marketplace_wishlist', serialized),
      ]);
      DeviceEventEmitter.emit('wishlistUpdated', { count: updated.length, wishlist: updated });
    } catch (e) {
      console.error('Failed to remove wishlist item:', e);
    }
  };

  const handleClearWishlist = async () => {
    setWishlistItems([]);
    setWishlistCount(0);
    await AsyncStorage.multiRemove([userKeys.wishlist, '@marketplace_wishlist']);
    DeviceEventEmitter.emit('wishlistUpdated', { count: 0, wishlist: [] });
  };

  const handleMoveWishlistToCart = async (item: WishlistItem) => {
    try {
      const savedCart =
        (await AsyncStorage.getItem(userKeys.cart)) ||
        (await AsyncStorage.getItem('@marketplace_cart'));
      const cartItems: any[] = savedCart ? JSON.parse(savedCart) : [];
      const variationKey = `${item.productId}-Black-Standard`;
      const existingIdx = cartItems.findIndex(
        (c) => c.variationKey === variationKey || Number(c.productId) === Number(item.productId)
      );

      if (existingIdx > -1) {
        cartItems[existingIdx].quantity = Math.min(
          item.stock || 99,
          (Number(cartItems[existingIdx].quantity) || 1) + 1
        );
      } else {
        cartItems.push({
          id: Date.now(),
          variationKey,
          productId: item.productId,
          title: item.title,
          thumbnail: item.thumbnail,
          price: item.price,
          discountPercentage: item.discountPercentage || 0,
          quantity: 1,
          stock: item.stock || 99,
          selectedColor: 'Black',
          selectedSize: 'Standard',
        });
      }

      const serializedCart = JSON.stringify(cartItems);
      await Promise.all([
        AsyncStorage.setItem(userKeys.cart, serializedCart),
        AsyncStorage.setItem('@marketplace_cart', serializedCart),
      ]);

      showMessage('Added to Cart', `"${item.title}" has been added to your cart.`);
    } catch {
      showMessage('Error', 'Could not add item to cart.');
    }
  };

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.replace('/(auth)/login' as any);
    }
  }, [isLoadingAuth, isAuthenticated]);

  useEffect(() => {
    if (user) {
      loadUserOrders();
      loadProfileBio();
      loadWishlistData();
      loadRecentlyViewed();
    }
  }, [user, loadWishlistData]);

  // Listen for real-time wishlist updates emitted when Heart button is clicked on Product Details
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('wishlistUpdated', () => {
      loadWishlistData();
    });
    return () => sub.remove();
  }, [loadWishlistData]);

  // Open My Addresses inside Account Settings automatically when navigated from cart.tsx
  useEffect(() => {
    if (params?.openAddresses === 'true' && isAuthenticated) {
      openAccountSettings('my_addresses');
      router.setParams({ openAddresses: undefined } as any);
    }
  }, [params?.openAddresses, isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadUserOrders();
        loadProfileBio();
        loadWishlistData();
        loadRecentlyViewed();
      }
    }, [user, loadWishlistData])
  );

  const loadProfileBio = async () => {
    try {
      const extraRaw = await AsyncStorage.getItem(userKeys.profileExtra);
      if (extraRaw) {
        const parsed = JSON.parse(extraRaw);
        setBio(parsed.bio || '');
      }
    } catch {
      // Ignore error
    }
  };

  // ==================== RECENTLY VIEWED HISTORY ====================
  const loadRecentlyViewed = async () => {
    try {
      const saved =
        (await AsyncStorage.getItem(userKeys.recentlyViewed)) ||
        (await AsyncStorage.getItem('@marketplace_recently_viewed'));
      if (saved) {
        const parsed = JSON.parse(saved);
        setRecentlyViewedItems(Array.isArray(parsed) ? parsed : []);
      } else {
        setRecentlyViewedItems([]);
      }
    } catch {
      setRecentlyViewedItems([]);
    }
  };

  const handleClearRecentlyViewed = async () => {
    setRecentlyViewedItems([]);
    await AsyncStorage.multiRemove([userKeys.recentlyViewed, '@marketplace_recently_viewed']);
  };

  // ==================== REAL LOCAL ORDERS (STARTS AT $0.00 UNTIL CHECKOUT) ====================
  const loadUserOrders = async () => {
    setLoadingOrders(true);
    try {
      const savedOrders = await AsyncStorage.getItem(userKeys.orders);
      if (savedOrders) {
        const parsed = JSON.parse(savedOrders);
        setOrders(Array.isArray(parsed) ? parsed : []);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Failed to load user orders:', error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const onRefreshProfile = async () => {
    setRefreshing(true);
    await Promise.all([
      loadUserOrders(),
      loadProfileBio(),
      loadWishlistData(),
      loadRecentlyViewed(),
      fetchRecommendedProducts(true),
    ]);
    setRefreshing(false);
  };

  const totalSpent = useMemo(
    () =>
      orders.reduce(
        (sum, order) => sum + (Number(order.discountedTotal ?? order.total) || 0),
        0
      ),
    [orders]
  );

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.username ||
    'Marketplace User';

  const displayEmail = user?.email || 'user@example.com';

  if (isLoadingAuth) {
    return (
      <View style={[styles.centeredState, webAmbientBackdropStyle]}>
        {renderAmbientOrbs()}
        <ActivityIndicator size="large" color="#FE2C55" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.centeredState, webAmbientBackdropStyle]}>
        {renderAmbientOrbs()}
        <Text style={{ fontSize: 16, color: palette.textMuted }}>Please log in to view profile</Text>
        <Button
          mode="contained"
          onPress={() => router.replace('/(auth)/login' as any)}
          style={[{ marginTop: 12, borderRadius: 20 }, webPrimaryButtonGradient]}
          buttonColor="#FE2C55"
          textColor="#FFFFFF"
        >
          Go to Sign In
        </Button>
      </View>
    );
  }

  const activityCardWidth = isDesktop ? '49%' : isTablet ? '48.8%' : '48.4%';

  const supportMenuItems: Array<{
    key: Exclude<InfoModalType, null>;
    title: string;
    icon: any;
    iconColor: string;
    iconBg: string;
  }> = [
    {
      key: 'help_centre',
      title: 'Help Centre',
      icon: 'help-circle-outline',
      iconColor: '#0284C7',
      iconBg: 'rgba(2, 132, 199, 0.12)',
    },
    {
      key: 'community_rules',
      title: 'Community Rules',
      icon: 'account-group-outline',
      iconColor: '#7C3AED',
      iconBg: 'rgba(124, 58, 237, 0.12)',
    },
    {
      key: 'policies',
      title: 'Marketplace Policies',
      icon: 'file-document-outline',
      iconColor: '#059669',
      iconBg: 'rgba(5, 150, 105, 0.12)',
    },
    {
      key: 'rate_us',
      title: 'Happy with Marketplace? Rate us!',
      icon: 'star-outline',
      iconColor: '#D97706',
      iconBg: 'rgba(217, 119, 6, 0.12)',
    },
    {
      key: 'about',
      title: 'About',
      icon: 'information-outline',
      iconColor: '#FE2C55',
      iconBg: 'rgba(254, 44, 85, 0.12)',
    },
  ];

  // ==================== "YOU MAY ALSO LIKE" PRODUCT CARD (MATCHING home.tsx) ====================
  const renderRecommendedProductCard = ({
    item,
  }: {
    item: MarketplaceProduct & { _renderKey?: string };
  }) => {
    const promo = evaluateProductPromotions(item, flashSchedules, nowMs);

    return (
      <TouchableOpacity
        style={{
          flex: 1,
          margin: isSmallPhone ? 3.5 : 5,
        }}
        onPress={() => router.push(`/(app)/(tabs)/product/${item.id}` as any)}
        activeOpacity={0.88}
      >
        <Card
          style={[
            {
              flex: 1,
              backgroundColor: palette.glassSurface,
              borderColor: palette.border,
              borderWidth: 1,
              borderRadius: 20,
              overflow: 'hidden',
              ...(Platform.OS === 'web'
                ? ({ boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)' } as any)
                : {
                    elevation: 2,
                    shadowColor: '#0F172A',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                  }),
            },
            webGlassStyle,
          ]}
          elevation={0}
        >
          <View
            style={{
              height: isDesktop ? 180 : isTablet ? 162 : 152,
              backgroundColor: palette.isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              padding: 8,
            }}
          >
            <Image
              source={{ uri: item.thumbnail }}
              style={{ width: '88%', height: '88%' }}
              resizeMode="contain"
            />

            {promo.isFlashSale ? (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  backgroundColor: '#FE2C55',
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <MaterialCommunityIcons name="lightning-bolt" size={11} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>
                  {promo.countdownLabel}
                </Text>
              </View>
            ) : promo.hasDiscount ? (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  backgroundColor: '#FE2C55',
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>
                  {promo.effectiveDiscountPercentage}% OFF
                </Text>
              </View>
            ) : null}
          </View>

          <View style={{ padding: isSmallPhone ? 9 : 11, gap: 5 }}>
            <Text
              numberOfLines={2}
              style={{
                fontSize: isSmallPhone ? 12 : 13,
                fontWeight: '700',
                color: palette.textPrimary,
                lineHeight: 17,
                minHeight: 34,
              }}
            >
              {item.title}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 }}>
              <Text
                style={{
                  fontSize: isSmallPhone ? 15 : 16,
                  fontWeight: '900',
                  color: '#FE2C55',
                }}
              >
                ${promo.effectivePrice.toFixed(2)}
              </Text>
              {promo.hasDiscount && (
                <>
                  <Text
                    style={{
                      fontSize: 11,
                      color: palette.textMuted,
                      textDecorationLine: 'line-through',
                      fontWeight: '600',
                    }}
                  >
                    ${promo.originalPrice.toFixed(2)}
                  </Text>
                  <View
                    style={{
                      backgroundColor: 'rgba(254, 44, 85, 0.12)',
                      paddingHorizontal: 5,
                      paddingVertical: 1.5,
                      borderRadius: 5,
                    }}
                  >
                    <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#FE2C55' }}>
                      -{promo.effectiveDiscountPercentage}%
                    </Text>
                  </View>
                </>
              )}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {promo.isFlashSale && (
                <View
                  style={{
                    backgroundColor: 'rgba(254, 44, 85, 0.12)',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#FE2C55' }}>
                    Flash Sale
                  </Text>
                </View>
              )}

              {promo.isFreeShipping && (
                <View
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ fontSize: 9.5, fontWeight: '800', color: palette.success }}>
                    Free Shipping
                  </Text>
                </View>
              )}

              {promo.isCodAvailable && (
                <View
                  style={{
                    backgroundColor: palette.accentSoft,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ fontSize: 9.5, fontWeight: '700', color: palette.accent }}>
                    COD
                  </Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: isSmallPhone ? 10.5 : 11,
                  color: palette.textSecondary,
                  fontWeight: '600',
                }}
              >
                ⭐ {item.rating.toFixed(1)} | {promo.soldFormatted}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  // ==================== PROFILE TOP SECTIONS HEADER FOR FLATLIST ====================
  const renderProfileHeader = () => (
    <View
      style={[
        styles.container,
        {
          width: '100%',
          maxWidth: '100%',
          alignSelf: 'stretch',
          paddingHorizontal: 0,
          marginHorizontal: 0,
        },
      ]}
    >
      {/* ==================== FULL-WIDTH HERO PROFILE CARD ==================== */}
      <Card
        style={[
          styles.heroCard,
          {
            width: '100%',
            marginHorizontal: 0,
            borderRadius: isMobile ? 20 : 22,
          },
          webGlassStyle,
        ]}
        elevation={0}
      >
        <View style={styles.heroAccentBanner}>
          <View style={styles.heroBannerTag}>
            <MaterialCommunityIcons name="shield-check" size={13} color="#FE2C55" />
            <Text style={styles.heroBannerTagText}>MARKETPLACE MEMBER</Text>
          </View>
        </View>

        <View
          style={[
            styles.heroBody,
            {
              paddingHorizontal: isDesktop ? 24 : isTablet ? 18 : 14,
              paddingVertical: isDesktop ? 18 : 14,
            },
          ]}
        >
          <View style={styles.avatarRing}>
            <Avatar.Image
              size={isSmallPhone ? 54 : isDesktop ? 74 : 62}
              source={{
                uri:
                  user?.image ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    displayName
                  )}&background=FE2C55&color=fff&size=256`,
              }}
            />
          </View>

          <View style={styles.profileInfoCol}>
            <Text numberOfLines={1} style={styles.profileName}>
              {displayName}
            </Text>
            <Text numberOfLines={1} style={styles.profileEmail}>
              {displayEmail}
            </Text>

            <View style={styles.badgeRow}>
              <Text style={styles.usernameText}>@{user?.username || 'user'}</Text>
              <View style={styles.providerPill}>
                <MaterialCommunityIcons
                  name={
                    user?.provider === 'google'
                      ? 'google'
                      : user?.provider === 'facebook'
                      ? 'facebook'
                      : 'check-decagram'
                  }
                  size={11}
                  color={palette.accent}
                />
                <Text style={styles.providerPillText}>
                  {user?.provider === 'google'
                    ? 'Google Connected'
                    : user?.provider === 'facebook'
                    ? 'Facebook Connected'
                    : 'Verified Account'}
                </Text>
              </View>
            </View>

            {bio ? (
              <Text numberOfLines={2} style={{ fontSize: 11.5, color: palette.textSecondary, marginTop: 4 }}>
                {bio}
              </Text>
            ) : null}
          </View>

          {/* ==================== TOTAL SPENT & SETTINGS HEADER ACTIONS ==================== */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: isSmallPhone ? 8 : isDesktop ? 16 : 10,
            }}
          >
            <TouchableOpacity
              activeOpacity={0.78}
              onPress={() => setOrdersVisible(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 14,
                backgroundColor: palette.isDark
                  ? 'rgba(254, 44, 85, 0.14)'
                  : 'rgba(254, 44, 85, 0.08)',
                borderWidth: 1,
                borderColor: 'rgba(254, 44, 85, 0.20)',
              }}
            >
              <View
                style={[
                  styles.statIconCircle,
                  {
                    backgroundColor: 'rgba(254, 44, 85, 0.14)',
                    width: isSmallPhone ? 30 : 34,
                    height: isSmallPhone ? 30 : 34,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="wallet-outline"
                  size={isSmallPhone ? 15 : 17}
                  color="#FE2C55"
                />
              </View>
              <View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.statValue,
                    { fontSize: isSmallPhone ? 13.5 : 15.5 },
                  ]}
                >
                  ${totalSpent.toFixed(2)}
                </Text>
                <Text style={[styles.statLabel, { fontSize: 10.5 }]}>Total Spent</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Open Account Settings"
              testID="profile-settings-btn"
              onPress={() => openAccountSettings('account_settings')}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 52,
                minHeight: 48,
                paddingVertical: 5,
                paddingHorizontal: 8,
                borderRadius: 14,
                backgroundColor: palette.glassInput,
                borderWidth: 1,
                borderColor: palette.border,
              }}
            >
              <MaterialCommunityIcons
                name="cog-outline"
                size={isDesktop ? 22 : 20}
                color={palette.textPrimary}
              />
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: '800',
                  color: palette.textPrimary,
                  marginTop: 2,
                  textAlign: 'center',
                }}
              >
                Settings
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* QUICK SHORTCUT STRIP */}
        <View style={styles.quickStatsRow}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setOrdersVisible(true)}
            style={styles.quickStatItem}
          >
            <MaterialCommunityIcons name="package-variant-closed" size={17} color="#FE2C55" />
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: palette.textPrimary }}>
              {orders.length} Orders
            </Text>
          </TouchableOpacity>

          <View style={styles.quickStatDivider} />

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              loadWishlistData();
              setActiveInfoModal('wishlist');
            }}
            style={styles.quickStatItem}
          >
            <MaterialCommunityIcons name="heart-outline" size={17} color="#FE2C55" />
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: palette.textPrimary }}>
              {wishlistCount} Wishlist
            </Text>
          </TouchableOpacity>

          <View style={styles.quickStatDivider} />

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              loadRecentlyViewed();
              setActiveInfoModal('recently_viewed');
            }}
            style={styles.quickStatItem}
          >
            <MaterialCommunityIcons name="history" size={17} color={palette.accent} />
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: palette.textPrimary }}>
              {recentlyViewedItems.length} Viewed
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* ==================== MORE ACTIVITIES SECTION ==================== */}
      <View
        style={{
          width: '100%',
          marginTop: isDesktop ? 18 : 14,
          marginBottom: isDesktop ? 20 : 16,
        }}
      >
        <View style={styles.sectionHeadingRow}>
          <View style={styles.sectionAccentBar} />
          <Text
            style={{
              fontSize: isDesktop ? 16.5 : 15.5,
              fontWeight: '900',
              color: palette.textPrimary,
              letterSpacing: -0.2,
            }}
          >
            More Activities
          </Text>
        </View>

        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            rowGap: isDesktop ? 12 : 10,
          }}
        >
          {/* 1. Affiliate Program */}
          <TouchableOpacity
            activeOpacity={0.78}
            onPress={() => setActiveInfoModal('affiliate')}
            style={[
              styles.activityCard,
              {
                width: activityCardWidth,
                borderColor: palette.border,
              },
              webGlassStyle,
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
              <View
                style={[
                  styles.activityIconBox,
                  { backgroundColor: 'rgba(254, 44, 85, 0.12)' },
                ]}
              >
                <MaterialCommunityIcons
                  name="shopping-outline"
                  size={isSmallPhone ? 20 : 22}
                  color="#FE2C55"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={2}
                  style={{
                    fontSize: isSmallPhone ? 13 : 14,
                    fontWeight: '800',
                    color: palette.textPrimary,
                    lineHeight: 18,
                  }}
                >
                  Affiliate Program
                </Text>
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 11, color: palette.textSecondary, marginTop: 2 }}
                >
                  Share & earn commission
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={palette.textMuted}
            />
          </TouchableOpacity>

          {/* 2. Earn with Marketlist */}
          <TouchableOpacity
            activeOpacity={0.78}
            onPress={() => setActiveInfoModal('earn')}
            style={[
              styles.activityCard,
              {
                width: activityCardWidth,
                borderColor: palette.border,
              },
              webGlassStyle,
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
              <View
                style={[
                  styles.activityIconBox,
                  { backgroundColor: 'rgba(245, 158, 11, 0.14)' },
                ]}
              >
                <MaterialCommunityIcons
                  name="hand-coin-outline"
                  size={isSmallPhone ? 20 : 22}
                  color="#D97706"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={2}
                  style={{
                    fontSize: isSmallPhone ? 13 : 14,
                    fontWeight: '800',
                    color: palette.textPrimary,
                    lineHeight: 18,
                  }}
                >
                  Earn with Marketlist
                </Text>
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 11, color: palette.textSecondary, marginTop: 2 }}
                >
                  Daily rewards & vouchers
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={palette.textMuted}
            />
          </TouchableOpacity>

          {/* 3. Wishlist Card (Opens Saved Wishlist Modal) */}
          <TouchableOpacity
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel="Wishlist"
            testID="profile-wishlist-card"
            onPress={() => {
              loadWishlistData();
              setActiveInfoModal('wishlist');
            }}
            style={[
              styles.activityCard,
              {
                width: activityCardWidth,
                borderColor: wishlistCount > 0 ? '#FE2C55' : palette.border,
              },
              webGlassStyle,
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
              <View
                style={[
                  styles.activityIconBox,
                  { backgroundColor: 'rgba(254, 44, 85, 0.12)' },
                ]}
              >
                <MaterialCommunityIcons
                  name={wishlistCount > 0 ? 'heart' : 'heart-outline'}
                  size={isSmallPhone ? 20 : 22}
                  color="#FE2C55"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: isSmallPhone ? 13 : 14,
                    fontWeight: '800',
                    color: palette.textPrimary,
                  }}
                >
                  Wishlist
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 11,
                    color: wishlistCount > 0 ? '#FE2C55' : palette.textSecondary,
                    fontWeight: wishlistCount > 0 ? '700' : '400',
                    marginTop: 2,
                  }}
                >
                  {wishlistCount > 0
                    ? `${wishlistCount} saved ${wishlistCount === 1 ? 'favorite' : 'favorites'}`
                    : 'Your saved favorites'}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={palette.textMuted}
            />
          </TouchableOpacity>

          {/* 4. Recently Viewed Card */}
          <TouchableOpacity
            activeOpacity={0.78}
            onPress={() => {
              loadRecentlyViewed();
              setActiveInfoModal('recently_viewed');
            }}
            style={[
              styles.activityCard,
              {
                width: activityCardWidth,
                borderColor: palette.border,
              },
              webGlassStyle,
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
              <View
                style={[
                  styles.activityIconBox,
                  { backgroundColor: palette.accentSoft },
                ]}
              >
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={isSmallPhone ? 20 : 22}
                  color={palette.accent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: isSmallPhone ? 13 : 14,
                    fontWeight: '800',
                    color: palette.textPrimary,
                  }}
                >
                  Recently Viewed
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 11,
                    color: palette.textSecondary,
                    marginTop: 2,
                  }}
                >
                  Your browsing history
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={palette.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ==================== SUPPORT SECTION ==================== */}
      <View
        style={{
          width: '100%',
          marginBottom: isDesktop ? 22 : 18,
        }}
      >
        <View style={styles.sectionHeadingRow}>
          <View style={styles.sectionAccentBar} />
          <Text
            style={{
              fontSize: isDesktop ? 16.5 : 15.5,
              fontWeight: '900',
              color: palette.textPrimary,
              letterSpacing: -0.2,
            }}
          >
            Support
          </Text>
        </View>

        <Card
          style={[
            styles.menuCard,
            {
              width: '100%',
              marginHorizontal: 0,
            },
            webGlassStyle,
          ]}
          elevation={0}
        >
          {supportMenuItems.map((item, idx) => (
            <React.Fragment key={item.key}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setActiveInfoModal(item.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: isDesktop ? 18 : 14,
                  paddingVertical: isDesktop ? 15 : 13,
                  minHeight: 54,
                }}
              >
                <View style={[styles.supportIconBox, { backgroundColor: item.iconBg }]}>
                  <MaterialCommunityIcons name={item.icon} size={18} color={item.iconColor} />
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: palette.textPrimary,
                    flex: 1,
                  }}
                >
                  {item.title}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={palette.textMuted}
                />
              </TouchableOpacity>
              {idx < supportMenuItems.length - 1 && <Divider style={styles.divider} />}
            </React.Fragment>
          ))}
        </Card>
      </View>

      {/* ==================== DIVIDER HEADER: YOU MAY ALSO LIKE ==================== */}
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 4,
          marginBottom: 12,
          paddingHorizontal: 4,
        }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: palette.border }} />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 14,
            paddingVertical: 5,
            borderRadius: 999,
            backgroundColor: palette.glassSurface,
            borderWidth: 1,
            borderColor: palette.border,
          }}
        >
          <MaterialCommunityIcons name="heart-multiple" size={16} color="#FE2C55" />
          <Text
            style={{
              fontSize: isDesktop ? 15 : 14,
              fontWeight: '900',
              color: palette.textPrimary,
              letterSpacing: 0.2,
            }}
          >
            You May Also Like
          </Text>
        </View>
        <View style={{ flex: 1, height: 1, backgroundColor: palette.border }} />
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          flex: 1,
          minHeight: 0,
        },
        webAmbientBackdropStyle,
      ]}
      edges={['top', 'left', 'right']}
    >
      {renderAmbientOrbs()}

      <FlatList
        data={recommendedProducts}
        renderItem={renderRecommendedProductCard}
        numColumns={numColumns}
        key={`profile-recommended-grid-${numColumns}`}
        keyExtractor={(item, idx) => item._renderKey || `profile-rec-${item.id}-${idx}`}
        onEndReached={() => fetchRecommendedProducts(false)}
        onEndReachedThreshold={0.5}
        onScroll={handleListScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefreshProfile}
            colors={['#FE2C55']}
          />
        }
        columnWrapperStyle={
          numColumns > 1
            ? { width: '100%', marginHorizontal: isSmallPhone ? -3.5 : -5 }
            : undefined
        }
        ListHeaderComponent={renderProfileHeader}
        ListEmptyComponent={
          loadingRec ? (
            <View style={{ paddingVertical: 28, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#FE2C55" />
              <Text style={{ fontSize: 12.5, color: palette.textSecondary, marginTop: 8 }}>
                Loading recommended products...
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            {loadingMoreRec ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#FE2C55" />
                <Text style={{ fontSize: 12.5, color: palette.textSecondary, fontWeight: '600' }}>
                  Loading more products...
                </Text>
              </View>
            ) : recommendedProducts.length > 0 ? (
              <TouchableOpacity
                onPress={() => fetchRecommendedProducts(false)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 7,
                  borderRadius: 999,
                  backgroundColor: palette.glassSurface,
                  borderWidth: 1,
                  borderColor: palette.border,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: palette.textSecondary }}>
                  Scroll down for more products
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
        style={[
          styles.scrollView,
          {
            flex: 1,
            width: '100%',
            minHeight: 0,
          },
        ]}
        contentContainerStyle={{
          width: '100%',
          paddingHorizontal: edgePaddingX,
          paddingTop: isMobile ? 8 : 14,
          paddingBottom: bottomScrollSpace,
        }}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        keyboardShouldPersistTaps="handled"
      />

      {/* ==================== EXTERNAL DEDICATED SETTINGS MODULE ==================== */}
      <AccountSettingsModal
        palette={palette}
        styles={styles}
        isDesktop={isDesktop}
        isTablet={isTablet}
        isMobile={isMobile}
        visible={settingsHubVisible}
        initialRoute={settingsInitialRoute}
        onOpenSettings={openAccountSettings}
        onCloseSettings={() => setSettingsHubVisible(false)}
        onProfileDataUpdated={loadProfileBio}
        onAccountDeleted={() => {
          setOrders([]);
          setWishlistItems([]);
          setWishlistCount(0);
        }}
      />

      {/* ==================== ORDER HISTORY MODAL ==================== */}
      <Modal visible={ordersVisible} animationType="slide" transparent>
        <View style={[styles.modalBackdrop, isMobile && { paddingHorizontal: 10 }]}>
          <Card style={[styles.modalCard, { width: '100%', maxWidth: 600 }, webGlassStyle]}>
            <View style={styles.modalHeader}>
              <Title style={styles.modalTitle}>Order History</Title>
              <IconButton
                icon="close"
                size={20}
                iconColor={palette.textPrimary}
                onPress={() => setOrdersVisible(false)}
                style={{ margin: 0 }}
              />
            </View>
            {loadingOrders ? (
              <ActivityIndicator
                size="large"
                color={palette.success}
                style={{ marginVertical: 16 }}
              />
            ) : orders.length === 0 ? (
              <Text
                style={{
                  textAlign: 'center',
                  marginVertical: 20,
                  color: palette.textMuted,
                  fontSize: 13,
                }}
              >
                No past orders found.
              </Text>
            ) : (
              <FlatList
                data={orders}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View
                    style={{
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: palette.border,
                    }}
                  >
                    <Text style={{ fontWeight: '800', fontSize: 14, color: palette.textPrimary }}>
                      Order #{item.id}
                    </Text>
                    <Text style={{ color: palette.textMuted, fontSize: 12, marginTop: 2 }}>
                      {item.totalProducts} items · ${Number(item.discountedTotal ?? item.total).toFixed(2)}
                    </Text>
                  </View>
                )}
              />
            )}
            <Button
              mode="outlined"
              textColor={palette.textPrimary}
              onPress={() => setOrdersVisible(false)}
              style={{ marginTop: 12, borderColor: palette.border, borderRadius: 16 }}
            >
              Close
            </Button>
          </Card>
        </View>
      </Modal>

      {/* ==================== MORE ACTIVITIES & SUPPORT DETAILS MODAL ==================== */}
      <Modal
        visible={activeInfoModal !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveInfoModal(null)}
      >
        <View style={[styles.modalBackdrop, isMobile && { paddingHorizontal: 10 }]}>
          <Card
            style={[
              styles.modalCard,
              {
                width: '100%',
                maxWidth: activeInfoModal === 'wishlist' ? 640 : 560,
              },
              webGlassStyle,
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {activeInfoModal === 'wishlist' && (
                  <MaterialCommunityIcons name="heart" size={22} color="#FE2C55" />
                )}
                <Title style={styles.modalTitle}>
                  {activeInfoModal === 'affiliate' && 'Affiliate Program'}
                  {activeInfoModal === 'earn' && 'Earn with Marketlist'}
                  {activeInfoModal === 'wishlist' &&
                    `My Wishlist${wishlistCount > 0 ? ` (${wishlistCount})` : ''}`}
                  {activeInfoModal === 'recently_viewed' && 'Recently Viewed'}
                  {activeInfoModal === 'help_centre' && 'Help Centre'}
                  {activeInfoModal === 'community_rules' && 'Community Rules'}
                  {activeInfoModal === 'policies' && 'Marketplace Policies'}
                  {activeInfoModal === 'rate_us' && 'Happy with Marketplace? Rate us!'}
                  {activeInfoModal === 'about' && 'About Marketplace'}
                </Title>
              </View>
              <IconButton
                icon="close"
                size={20}
                iconColor={palette.textPrimary}
                onPress={() => setActiveInfoModal(null)}
                style={{ margin: 0 }}
              />
            </View>

            <ScrollView style={{ maxHeight: height * 0.6 }} showsVerticalScrollIndicator={false}>
              {activeInfoModal === 'wishlist' && (
                <View>
                  {wishlistItems.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 28 }}>
                      <MaterialCommunityIcons
                        name="heart-outline"
                        size={46}
                        color="#FE2C55"
                      />
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '800',
                          color: palette.textPrimary,
                          marginTop: 10,
                        }}
                      >
                        Your Wishlist is Empty
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: palette.textMuted,
                          marginTop: 4,
                          textAlign: 'center',
                          paddingHorizontal: 16,
                        }}
                      >
                        Tap the heart icon on any product page to save your favorite items here.
                      </Text>
                      <Button
                        mode="contained"
                        buttonColor="#FE2C55"
                        textColor="#FFFFFF"
                        style={[{ marginTop: 16, borderRadius: 20 }, webPrimaryButtonGradient]}
                        onPress={() => {
                          setActiveInfoModal(null);
                          router.push('/(app)/(tabs)/home' as any);
                        }}
                      >
                        Explore Products
                      </Button>
                    </View>
                  ) : (
                    <>
                      {wishlistItems.map((item) => {
                        const discountedPrice =
                          item.discountPercentage && item.discountPercentage > 0
                            ? item.price * (1 - item.discountPercentage / 100)
                            : item.price;

                        return (
                          <View
                            key={item.productId}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingVertical: 10,
                              borderBottomWidth: 1,
                              borderBottomColor: palette.border,
                              gap: 10,
                            }}
                          >
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => {
                                setActiveInfoModal(null);
                                router.push(`/(app)/(tabs)/product/${item.productId}` as any);
                              }}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                flex: 1,
                                gap: 10,
                              }}
                            >
                              <Image
                                source={{ uri: item.thumbnail }}
                                style={{
                                  width: isSmallPhone ? 48 : 56,
                                  height: isSmallPhone ? 48 : 56,
                                  borderRadius: 12,
                                  backgroundColor: '#FFFFFF',
                                  borderWidth: 1,
                                  borderColor: palette.border,
                                }}
                                resizeMode="contain"
                              />
                              <View style={{ flex: 1 }}>
                                <Text
                                  numberOfLines={2}
                                  style={{
                                    fontSize: 13,
                                    fontWeight: '700',
                                    color: palette.textPrimary,
                                  }}
                                >
                                  {item.title}
                                </Text>
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                    marginTop: 3,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 13.5,
                                      fontWeight: '900',
                                      color: '#FE2C55',
                                    }}
                                  >
                                    ${Number(discountedPrice).toFixed(2)}
                                  </Text>
                                  {item.discountPercentage && item.discountPercentage > 0 ? (
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        color: palette.textMuted,
                                        textDecorationLine: 'line-through',
                                      }}
                                    >
                                      ${Number(item.price).toFixed(2)}
                                    </Text>
                                  ) : null}
                                </View>
                                {typeof item.rating === 'number' && item.rating > 0 && (
                                  <Text
                                    style={{
                                      fontSize: 10.5,
                                      color: palette.textSecondary,
                                      marginTop: 2,
                                    }}
                                  >
                                    ⭐ {item.rating.toFixed(1)}
                                  </Text>
                                )}
                              </View>
                            </TouchableOpacity>

                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <IconButton
                                icon="cart-plus"
                                size={20}
                                iconColor={palette.accent}
                                onPress={() => handleMoveWishlistToCart(item)}
                                accessibilityLabel="Add wishlist item to cart"
                              />
                              <IconButton
                                icon="trash-can-outline"
                                size={20}
                                iconColor={palette.danger}
                                onPress={() => handleRemoveFromWishlist(item.productId)}
                                accessibilityLabel="Remove from wishlist"
                              />
                            </View>
                          </View>
                        );
                      })}

                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 10,
                          gap: 8,
                        }}
                      >
                        <Button
                          mode="text"
                          textColor={palette.danger}
                          onPress={handleClearWishlist}
                          compact
                        >
                          Clear Wishlist
                        </Button>
                        <Button
                          mode="contained"
                          buttonColor="#FE2C55"
                          textColor="#FFFFFF"
                          style={[{ borderRadius: 16 }, webPrimaryButtonGradient]}
                          compact
                          onPress={() => {
                            setActiveInfoModal(null);
                            router.push('/(app)/(tabs)/cart' as any);
                          }}
                        >
                          View Cart
                        </Button>
                      </View>
                    </>
                  )}
                </View>
              )}

              {activeInfoModal === 'affiliate' && (
                <View>
                  <Text style={{ fontSize: 13, color: palette.textSecondary, lineHeight: 20 }}>
                    Share Marketplace product links with friends and followers to earn commission on every completed order.
                  </Text>
                  <View
                    style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: 14,
                      backgroundColor: palette.glassSurfaceElevated,
                      borderWidth: 1,
                      borderColor: palette.border,
                    }}
                  >
                    <Text style={{ fontSize: 12.5, fontWeight: '800', color: palette.textPrimary }}>
                      Your Referral Code: MKT-{String(user?.id || '1001').toUpperCase()}
                    </Text>
                    <Text style={{ fontSize: 11, color: palette.textMuted, marginTop: 4 }}>
                      Status: {affiliateJoined ? 'Active Affiliate Partner' : 'Ready to Activate'}
                    </Text>
                  </View>
                  <Button
                    mode="contained"
                    buttonColor="#FE2C55"
                    textColor="#FFFFFF"
                    style={[{ marginTop: 14, borderRadius: 20 }, webPrimaryButtonGradient]}
                    onPress={() => {
                      setAffiliateJoined(true);
                      showMessage(
                        'Affiliate Activated',
                        'Your Marketplace Affiliate referral link is now active!'
                      );
                    }}
                  >
                    {affiliateJoined ? 'Affiliate Link Active' : 'Join Affiliate Program'}
                  </Button>
                </View>
              )}

              {activeInfoModal === 'earn' && (
                <View>
                  <Text style={{ fontSize: 13, color: palette.textSecondary, lineHeight: 20 }}>
                    Complete daily check-ins, write verified product reviews, and refer new shoppers to earn Marketplace rewards and vouchers.
                  </Text>
                  <View
                    style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: 14,
                      backgroundColor: palette.accentSoft,
                      borderWidth: 1,
                      borderColor: palette.borderStrong,
                    }}
                  >
                    <Text style={{ fontSize: 13.5, fontWeight: '900', color: palette.accent }}>
                      Available Rewards Balance: $0.00
                    </Text>
                    <Text style={{ fontSize: 11.5, color: palette.textSecondary, marginTop: 3 }}>
                      Shop or refer friends to unlock instant checkout discounts.
                    </Text>
                  </View>
                </View>
              )}

              {activeInfoModal === 'recently_viewed' && (
                <View>
                  {recentlyViewedItems.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={42}
                        color={palette.textMuted}
                      />
                      <Text
                        style={{
                          fontSize: 14.5,
                          fontWeight: '800',
                          color: palette.textPrimary,
                          marginTop: 8,
                        }}
                      >
                        No Recently Viewed Products
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: palette.textMuted,
                          marginTop: 4,
                          textAlign: 'center',
                        }}
                      >
                        Products you browse across Marketplace will appear here.
                      </Text>
                    </View>
                  ) : (
                    <>
                      {recentlyViewedItems.map((item) => (
                        <TouchableOpacity
                          key={item.productId}
                          onPress={() => {
                            setActiveInfoModal(null);
                            router.push(`/(app)/(tabs)/product/${item.productId}` as any);
                          }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 9,
                            borderBottomWidth: 1,
                            borderBottomColor: palette.border,
                            gap: 10,
                          }}
                        >
                          <Image
                            source={{ uri: item.thumbnail }}
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 10,
                              backgroundColor: '#FFFFFF',
                            }}
                            resizeMode="contain"
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              numberOfLines={1}
                              style={{ fontSize: 13, fontWeight: '700', color: palette.textPrimary }}
                            >
                              {item.title}
                            </Text>
                            <Text
                              style={{
                                fontSize: 12.5,
                                fontWeight: '900',
                                color: '#FE2C55',
                                marginTop: 2,
                              }}
                            >
                              ${Number(item.price).toFixed(2)}
                            </Text>
                          </View>
                          <MaterialCommunityIcons
                            name="chevron-right"
                            size={18}
                            color={palette.textMuted}
                          />
                        </TouchableOpacity>
                      ))}
                      <Button
                        mode="text"
                        textColor={palette.danger}
                        onPress={handleClearRecentlyViewed}
                        style={{ marginTop: 8 }}
                      >
                        Clear Browsing History
                      </Button>
                    </>
                  )}
                </View>
              )}

              {activeInfoModal === 'help_centre' && (
                <View style={{ gap: 10 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: '800', color: palette.textPrimary }}>
                    Frequently Asked Questions
                  </Text>
                  <Text style={{ fontSize: 12.5, color: palette.textSecondary, lineHeight: 19 }}>
                    • How do I track my order? Open Orders in your profile or check your email confirmation.{'\n'}
                    • How do I update my delivery address? Go to Settings → My Addresses.{'\n'}
                    • Need live assistance? Reach our 24/7 Marketplace Support team at support@marketplace.app.
                  </Text>
                </View>
              )}

              {activeInfoModal === 'community_rules' && (
                <Text style={{ fontSize: 12.5, color: palette.textSecondary, lineHeight: 20 }}>
                  1. Treat buyers and sellers with respect in reviews and messages.{'\n'}
                  2. Post honest, accurate product feedback based on real purchases.{'\n'}
                  3. Never share sensitive personal credentials or payment numbers publicly.{'\n'}
                  4. Prohibited or counterfeit listings are strictly disallowed on Marketplace.
                </Text>
              )}

              {activeInfoModal === 'policies' && (
                <Text style={{ fontSize: 12.5, color: palette.textSecondary, lineHeight: 20 }}>
                  • Buyer Protection: Full refund guarantee for undelivered or damaged items.{'\n'}
                  • Privacy Policy: Your personal and biometric data remains protected and encrypted.{'\n'}
                  • Return & Refund Policy: Eligible items may be returned within 7 days of receipt.
                </Text>
              )}

              {activeInfoModal === 'rate_us' && (
                <View>
                  <Text style={{ fontSize: 13, color: palette.textSecondary, marginBottom: 10 }}>
                    Tap a star below to rate your Marketplace experience:
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity key={star} onPress={() => setRatingStars(star)}>
                        <MaterialCommunityIcons
                          name={star <= ratingStars ? 'star' : 'star-outline'}
                          size={32}
                          color="#F59E0B"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    mode="outlined"
                    dense
                    label="Share your feedback (optional)"
                    value={ratingFeedback}
                    onChangeText={setRatingFeedback}
                    textColor={palette.textPrimary}
                    style={{ backgroundColor: palette.glassInput, marginBottom: 12 }}
                  />
                  <Button
                    mode="contained"
                    buttonColor="#FE2C55"
                    textColor="#FFFFFF"
                    style={[{ borderRadius: 20 }, webPrimaryButtonGradient]}
                    onPress={() => {
                      setRatingFeedback('');
                      setActiveInfoModal(null);
                      showMessage(
                        'Thank You!',
                        `We appreciate your ${ratingStars}-star rating for Marketplace!`
                      );
                    }}
                  >
                    Submit Rating
                  </Button>
                </View>
              )}

              {activeInfoModal === 'about' && (
                <Text style={{ fontSize: 12.5, color: palette.textSecondary, lineHeight: 20 }}>
                  Marketplace v1.0.0{'\n'}
                  A fast, secure, multi-platform shopping experience built with React Native, Expo, and React Native Paper across Web, Tablet, and Mobile devices.
                </Text>
              )}
            </ScrollView>

            <Button
              mode="outlined"
              textColor={palette.textPrimary}
              onPress={() => setActiveInfoModal(null)}
              style={{ marginTop: 14, borderColor: palette.border, borderRadius: 16 }}
            >
              Close
            </Button>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}