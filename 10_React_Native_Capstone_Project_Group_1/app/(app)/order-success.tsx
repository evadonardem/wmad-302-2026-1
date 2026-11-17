/**
 * Order Successful Screen - Marketplace
 * Displays verified order confirmation, order summary, and infinite-scroll recommendations
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  useWindowDimensions,
  Platform,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Title, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import {
  MarketplaceProduct,
  FlashSaleSchedule,
  getFlashSaleSchedules,
  evaluateProductPromotions,
} from '../../utils/flashSaleHelpers';
import { styles, getOrderSuccessBreakpointMetrics } from './orderSuccessStyles';

interface OrderSummaryRecord {
  id: string;
  userId: string | number;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  createdAt: string;
  recipientName?: string;
  recipientPhone?: string;
  shippingAddress: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  totalAmount: number;
  items: Array<{
    productId: number;
    title: string;
    thumbnail: string;
    price: number;
    discountPercentage?: number;
    quantity: number;
    variationLabel?: string;
  }>;
}

const PAGE_SIZE = 12;
const USD_TO_PHP = 56;

const formatPeso = (amountPhp: number): string =>
  `₱${amountPhp.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { palette } = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ orderId?: string }>();

  // Responsive Breakpoints: Website Desktop (>= 1024), Tablet (768-1023), Mobile Phones (Realme, Samsung, Xiaomi, OPPO, Vivo, iPhone < 768)
  const metrics = useMemo(() => getOrderSuccessBreakpointMetrics(width), [width]);
  const {
    isAnyDesktop,
    isTablet,
    isMobile,
    isSmallPhone,
    numColumns,
    horizontalPadding,
  } = metrics;

  const topSafePadding = Platform.OS === 'web' ? 14 : Math.max(insets.top, 12);
  const bottomSafePadding = Platform.OS === 'web' ? 36 : Math.max(insets.bottom + 24, 36);

  const userPrefix = `@marketplace_user_${user?.id || 'guest'}`;
  const userOrdersStorageKey = `${userPrefix}_orders`;
  const userLastOrderKey = `${userPrefix}_last_order_success`;
  const userCartStorageKey = `${userPrefix}_cart`;
  const userWishlistStorageKey = `${userPrefix}_wishlist`;

  const webGlassStyle: any =
    Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          boxShadow: palette.isDark
            ? '0 14px 36px rgba(0, 0, 0, 0.38)'
            : '0 12px 32px rgba(15, 23, 42, 0.08)',
        }
      : {};

  const webAmbientBackdropStyle: any =
    Platform.OS === 'web'
      ? {
          backgroundImage: palette.isDark
            ? 'radial-gradient(circle at 12% 10%, rgba(16, 185, 129, 0.22), transparent 44%), radial-gradient(circle at 88% 16%, rgba(254, 44, 85, 0.22), transparent 45%), radial-gradient(circle at 50% 85%, rgba(59, 130, 246, 0.18), transparent 48%), linear-gradient(135deg, #070B14 0%, #0F172A 50%, #151226 100%)'
            : 'radial-gradient(circle at 10% 8%, rgba(16, 185, 129, 0.18), transparent 42%), radial-gradient(circle at 90% 14%, rgba(254, 44, 85, 0.15), transparent 44%), radial-gradient(circle at 20% 85%, rgba(56, 189, 248, 0.18), transparent 44%), linear-gradient(135deg, #F8FAFC 0%, #ECFDF5 46%, #FFF1F5 100%)',
        }
      : {};

  const webPrimaryButtonGradient: any =
    Platform.OS === 'web'
      ? {
          backgroundImage: 'linear-gradient(135deg, #FE2C55 0%, #FF5E7E 100%)',
          boxShadow: '0 8px 22px rgba(254, 44, 85, 0.34)',
        }
      : {};

  // Ambient Orb & Celebratory Badge Entrance Animations
  const orbPulseAnim = useRef(new Animated.Value(1)).current;
  const checkScaleAnim = useRef(new Animated.Value(0.6)).current;
  const checkOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const useNative = Platform.OS !== 'web';
    const orbLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulseAnim, {
          toValue: 1.08,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: useNative,
        }),
        Animated.timing(orbPulseAnim, {
          toValue: 0.95,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: useNative,
        }),
      ])
    );
    orbLoop.start();

    Animated.parallel([
      Animated.spring(checkScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 65,
        useNativeDriver: useNative,
      }),
      Animated.timing(checkOpacityAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: useNative,
      }),
    ]).start();

    return () => orbLoop.stop();
  }, [orbPulseAnim, checkScaleAnim, checkOpacityAnim]);

  const [orderRecord, setOrderRecord] = useState<OrderSummaryRecord | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  // Wishlist & Recommendations States
  const [likedProductIds, setLikedProductIds] = useState<number[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<MarketplaceProduct[]>([]);
  const [recSkip, setRecSkip] = useState(0);
  const [hasMoreRec, setHasMoreRec] = useState(true);
  const [loadingMoreRec, setLoadingMoreRec] = useState(false);
  const [flashSchedules, setFlashSchedules] = useState<Record<number, FlashSaleSchedule>>({});
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load confirmed order from database (persists across navigation/refresh)
  const loadConfirmedOrder = useCallback(async () => {
    try {
      setLoadingOrder(true);
      const [ordersRaw, lastOrderRaw, wishlistRaw] = await Promise.all([
        AsyncStorage.getItem(userOrdersStorageKey),
        AsyncStorage.getItem(userLastOrderKey),
        AsyncStorage.getItem(userWishlistStorageKey),
      ]);

      if (wishlistRaw) {
        const parsedWish = JSON.parse(wishlistRaw);
        if (Array.isArray(parsedWish)) {
          setLikedProductIds(parsedWish.map((w: any) => Number(w.productId || w.id)));
        }
      }

      let found: OrderSummaryRecord | null = null;
      if (ordersRaw) {
        const list: OrderSummaryRecord[] = JSON.parse(ordersRaw);
        if (Array.isArray(list) && list.length > 0) {
          found = params.orderId
            ? list.find((o) => o.id === params.orderId) || list[0]
            : list[0];
        }
      }

      if (!found && lastOrderRaw) {
        found = JSON.parse(lastOrderRaw);
      }

      setOrderRecord(found);
    } catch (err) {
      console.error('Failed to load order confirmation:', err);
    } finally {
      setLoadingOrder(false);
    }
  }, [params.orderId, userOrdersStorageKey, userLastOrderKey, userWishlistStorageKey]);

  const orderedProductIdSet = useMemo(() => {
    const set = new Set<number>();
    orderRecord?.items?.forEach((i) => set.add(Number(i.productId)));
    return set;
  }, [orderRecord]);

  const loadRecommendations = useCallback(
    async (reset = false) => {
      if (!reset && (loadingMoreRec || !hasMoreRec)) return;
      const currentSkip = reset ? 0 : recSkip;
      try {
        setLoadingMoreRec(true);
        const res = await fetch(
          `https://dummyjson.com/products?limit=${PAGE_SIZE}&skip=${currentSkip}`
        );
        if (!res.ok) throw new Error('Failed to fetch recommendations');
        const data = await res.json();
        const incoming: MarketplaceProduct[] = (data.products || []).filter(
          (p: MarketplaceProduct) => p.stock > 0 && !orderedProductIdSet.has(p.id)
        );

        if (reset) {
          setRecommendedProducts(incoming);
          setRecSkip(PAGE_SIZE);
        } else {
          setRecommendedProducts((prev) => {
            const existing = new Set(prev.map((p) => p.id));
            const unique = incoming.filter((p) => !existing.has(p.id));
            return [...prev, ...unique];
          });
          setRecSkip(currentSkip + PAGE_SIZE);
        }
        setHasMoreRec(currentSkip + PAGE_SIZE < (data.total || 0));
      } catch (e) {
        console.error('Failed to load recommendations:', e);
      } finally {
        setLoadingMoreRec(false);
      }
    },
    [loadingMoreRec, hasMoreRec, recSkip, orderedProductIdSet]
  );

  useEffect(() => {
    loadConfirmedOrder();
    getFlashSaleSchedules().then(setFlashSchedules).catch(() => {});
  }, [loadConfirmedOrder]);

  useEffect(() => {
    if (!loadingOrder) {
      loadRecommendations(true);
    }
  }, [loadingOrder]);

  const handleCopyOrderId = async (orderIdText: string) => {
    try {
      const nav = (globalThis as any)?.navigator;
      if (Platform.OS === 'web' && nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(orderIdText);
      }
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    } catch {
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    }
  };

  const handleToggleFavorite = async (product: MarketplaceProduct) => {
    try {
      const raw = await AsyncStorage.getItem(userWishlistStorageKey);
      let list: any[] = raw ? JSON.parse(raw) : [];
      const exists = list.some((w) => Number(w.productId || w.id) === product.id);
      if (exists) {
        list = list.filter((w) => Number(w.productId || w.id) !== product.id);
      } else {
        list.unshift({
          id: product.id,
          productId: product.id,
          title: product.title,
          price: product.price,
          discountPercentage: product.discountPercentage || 0,
          thumbnail: product.thumbnail,
          stock: product.stock,
        });
      }
      await AsyncStorage.setItem(userWishlistStorageKey, JSON.stringify(list));
      setLikedProductIds(list.map((w) => Number(w.productId || w.id)));
    } catch {
      // Ignore storage error
    }
  };

  // Quick Add to Cart without modifying or duplicating the placed order
  const handleQuickAddToCart = async (product: MarketplaceProduct) => {
    try {
      const raw = await AsyncStorage.getItem(userCartStorageKey);
      const currentCart: any[] = raw ? JSON.parse(raw) : [];
      const existingIndex = currentCart.findIndex((i) => Number(i.productId) === product.id);

      if (existingIndex !== -1) {
        currentCart[existingIndex].quantity = Math.min(
          product.stock,
          (currentCart[existingIndex].quantity || 1) + 1
        );
      } else {
        currentCart.unshift({
          id: Date.now(),
          productId: product.id,
          title: product.title,
          thumbnail: product.thumbnail,
          price: product.price,
          discountPercentage: product.discountPercentage || 0,
          quantity: 1,
          stock: product.stock,
        });
      }

      await AsyncStorage.setItem(userCartStorageKey, JSON.stringify(currentCart));
      await AsyncStorage.setItem('@marketplace_cart', JSON.stringify(currentCart));

      const webWin = (globalThis as any)?.window;
      if (Platform.OS === 'web' && webWin?.alert) {
        webWin.alert(`Added to Cart: "${product.title}" was added to your shopping cart.`);
      } else {
        Alert.alert('Added to Cart', `"${product.title}" was added to your shopping cart.`);
      }
    } catch {
      // Ignore storage error
    }
  };

  const renderAmbientOrbs = () => (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ambientLayer,
        { transform: [{ scale: orbPulseAnim }] },
      ]}
    >
      <View
        style={[
          styles.ambientOrbTopLeft,
          {
            backgroundColor: palette.isDark
              ? 'rgba(16, 185, 129, 0.20)'
              : 'rgba(16, 185, 129, 0.14)',
          },
        ]}
      />
      <View
        style={[
          styles.ambientOrbTopRight,
          {
            backgroundColor: palette.isDark
              ? 'rgba(254, 44, 85, 0.18)'
              : 'rgba(254, 44, 85, 0.12)',
          },
        ]}
      />
      <View
        style={[
          styles.ambientOrbBottomCenter,
          {
            backgroundColor: palette.isDark
              ? 'rgba(59, 130, 246, 0.16)'
              : 'rgba(56, 189, 248, 0.14)',
          },
        ]}
      />
    </Animated.View>
  );

  const renderRecommendationCard = ({ item }: { item: MarketplaceProduct }) => {
    const promo = evaluateProductPromotions(item, flashSchedules, nowMs);
    const isLiked = likedProductIds.includes(item.id);
    const salePhp = promo.effectivePrice * USD_TO_PHP;
    const origPhp = promo.originalPrice * USD_TO_PHP;

    return (
      <TouchableOpacity
        style={{ flex: 1 / numColumns, margin: isSmallPhone ? 3.5 : 4.5 }}
        onPress={() => router.push(`/(app)/(tabs)/product/${item.id}` as any)}
        activeOpacity={0.88}
      >
        <Card
          style={[
            styles.recCard,
            { backgroundColor: palette.glassSurface, borderColor: palette.border },
            webGlassStyle,
          ]}
          elevation={0}
        >
          <View
            style={[
              styles.recImageBox,
              {
                height: isAnyDesktop ? 174 : isTablet ? 158 : 148,
                backgroundColor: palette.isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
              },
            ]}
          >
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.recImage}
              resizeMode="contain"
            />

            {promo.isFlashSale ? (
              <View style={styles.discountCornerBadge}>
                <MaterialCommunityIcons name="lightning-bolt" size={11} color="#FFFFFF" />
                <Text style={styles.discountCornerText}>{promo.countdownLabel}</Text>
              </View>
            ) : promo.hasDiscount ? (
              <View style={styles.discountCornerBadge}>
                <Text style={styles.discountCornerText}>
                  -{promo.effectiveDiscountPercentage}%
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={() => handleToggleFavorite(item)}
              style={[
                styles.likeHeartBtn,
                {
                  backgroundColor: palette.glassSurfaceElevated,
                  borderColor: palette.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={17}
                color={isLiked ? '#FE2C55' : palette.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={[styles.recBody, { padding: isSmallPhone ? 8 : 10 }]}>
            <Text
              numberOfLines={2}
              style={[
                styles.recTitle,
                { color: palette.textPrimary, fontSize: isSmallPhone ? 12 : 13 },
              ]}
            >
              {item.title}
            </Text>

            <View style={styles.recPriceRow}>
              <Text style={[styles.recCurrentPrice, { fontSize: isSmallPhone ? 14 : 15.5 }]}>
                {formatPeso(salePhp)}
              </Text>
              {promo.hasDiscount && (
                <Text style={[styles.recOriginalPrice, { color: palette.textMuted }]}>
                  {formatPeso(origPhp)}
                </Text>
              )}
            </View>

            <View style={styles.recMetaRow}>
              <Text style={[styles.recRatingText, { color: palette.textSecondary }]}>
                ⭐ {item.rating.toFixed(1)} | {promo.soldFormatted}
              </Text>
              {promo.isFreeShipping && (
                <View style={styles.freeShipTag}>
                  <Text style={[styles.freeShipTagText, { color: palette.success }]}>
                    Free Ship
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={() => handleQuickAddToCart(item)}
              activeOpacity={0.82}
              style={styles.quickAddBtn}
            >
              <MaterialCommunityIcons name="cart-plus" size={14} color="#FE2C55" />
              <Text style={styles.quickAddText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loadingOrder) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: palette.background },
          webAmbientBackdropStyle,
        ]}
      >
        {renderAmbientOrbs()}
        <ActivityIndicator size="large" color="#FE2C55" />
        <Text style={{ marginTop: 10, color: palette.textSecondary, fontWeight: '600' }}>
          Loading order confirmation...
        </Text>
      </View>
    );
  }

  if (!orderRecord) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: palette.background, padding: 20 },
          webAmbientBackdropStyle,
        ]}
      >
        {renderAmbientOrbs()}
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: palette.glassSurface, borderColor: palette.border },
            webGlassStyle,
          ]}
        >
          <MaterialCommunityIcons name="script-text-outline" size={56} color={palette.textMuted} />
          <Text style={{ fontSize: 18, fontWeight: '900', color: palette.textPrimary, marginTop: 12 }}>
            No Confirmed Order Found
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: palette.textSecondary,
              textAlign: 'center',
              marginTop: 6,
            }}
          >
            Your recent order details will appear here as soon as checkout is completed.
          </Text>
          <Button
            mode="contained"
            buttonColor="#FE2C55"
            textColor="#FFFFFF"
            style={[{ marginTop: 18, borderRadius: 22 }, webPrimaryButtonGradient]}
            onPress={() => router.replace('/(app)/(tabs)/home' as any)}
          >
            Continue Shopping
          </Button>
        </View>
      </View>
    );
  }

  const totalUnits = orderRecord.items.reduce((sum, i) => sum + i.quantity, 0);
  const formattedDate = new Date(orderRecord.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: palette.background },
        webAmbientBackdropStyle,
      ]}
    >
      {renderAmbientOrbs()}

      {/* Top Glass Header Bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: topSafePadding,
            paddingHorizontal: isMobile ? 8 : 18,
            backgroundColor: palette.glassNav,
            borderBottomColor: palette.border,
          },
          webGlassStyle,
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(app)/(tabs)/home' as any);
            }
          }}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={palette.textPrimary} />
          {!isSmallPhone && (
            <Text style={[styles.backButtonText, { color: palette.textPrimary }]}>Back</Text>
          )}
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={[styles.topBarTitle, { color: palette.textPrimary }]}>
            Order Confirmed
          </Text>
        </View>

        <View style={{ minWidth: 58 }} />
      </View>

      {/* Scrollable Confirmation + Infinite Scroll Recommendations */}
      <FlatList
        style={{ zIndex: 1 }}
        data={recommendedProducts}
        renderItem={renderRecommendationCard}
        numColumns={numColumns}
        key={`success-rec-grid-${numColumns}`}
        keyExtractor={(item) => `success-rec-${item.id}`}
        onEndReached={() => loadRecommendations(false)}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={{
          width: '100%',
          maxWidth: isAnyDesktop ? 1320 : undefined,
          alignSelf: 'center',
          paddingHorizontal: horizontalPadding,
          paddingTop: 14,
          paddingBottom: bottomSafePadding,
        }}
        ListHeaderComponent={
          <View
            style={{
              width: '100%',
              maxWidth: isAnyDesktop ? 1040 : isTablet ? 780 : undefined,
              alignSelf: 'center',
            }}
          >
            {/* 1. CELEBRATORY HERO THANK YOU BANNER */}
            <View
              style={[
                styles.thankYouCard,
                {
                  backgroundColor: palette.glassSurface,
                  borderColor: palette.border,
                },
                webGlassStyle,
              ]}
            >
              {/* Subtle Decorative Confetti Dots */}
              <View style={[styles.confettiDot, { top: 18, left: '14%', backgroundColor: '#10B981' }]} />
              <View style={[styles.confettiDot, { top: 26, right: '16%', backgroundColor: '#FE2C55' }]} />
              <View style={[styles.confettiDot, { bottom: 22, left: '22%', backgroundColor: '#3B82F6' }]} />
              <View style={[styles.confettiDot, { bottom: 28, right: '20%', backgroundColor: '#F59E0B' }]} />

              <Animated.View
                style={[
                  styles.successOuterRing,
                  {
                    opacity: checkOpacityAnim,
                    transform: [{ scale: checkScaleAnim }],
                  },
                ]}
              >
                <View style={styles.successInnerCircle}>
                  <MaterialCommunityIcons name="check-bold" size={38} color="#FFFFFF" />
                </View>
              </Animated.View>

              <View style={styles.verifiedPill}>
                <MaterialCommunityIcons name="shield-check" size={14} color={palette.success} />
                <Text style={[styles.verifiedPillText, { color: palette.success }]}>
                  Order Verified & Confirmed
                </Text>
              </View>

              <Text
                style={[
                  styles.thankYouHeading,
                  {
                    color: palette.textPrimary,
                    fontSize: isAnyDesktop ? 26 : isTablet ? 23 : 21,
                  },
                ]}
              >
                Thank You for Your Order!
              </Text>

              <Text style={[styles.thankYouDesc, { color: palette.textSecondary }]}>
                Your order has been successfully placed. Thank you for shopping with Marketplace!
              </Text>

              <Text style={[styles.thankYouSubNote, { color: palette.textMuted }]}>
                Your order is now being processed. You can check your order details and delivery
                updates anytime in My Orders.
              </Text>

              {/* Visual Order Progress Stepper */}
              <View
                style={[
                  styles.stepperContainer,
                  {
                    backgroundColor: palette.glassInput,
                    borderColor: palette.border,
                  },
                ]}
              >
                <View style={styles.stepItem}>
                  <View style={[styles.stepDot, { backgroundColor: palette.success }]}>
                    <MaterialCommunityIcons name="check" size={13} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.stepLabelActive, { color: palette.success }]}>
                    Order Placed
                  </Text>
                </View>

                <View style={[styles.stepLine, { backgroundColor: palette.success }]} />

                <View style={styles.stepItem}>
                  <View style={[styles.stepDot, { backgroundColor: '#FE2C55' }]}>
                    <MaterialCommunityIcons name="package-variant" size={13} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.stepLabelActive, { color: '#FE2C55' }]}>
                    Processing
                  </Text>
                </View>

                <View style={[styles.stepLine, { backgroundColor: palette.border }]} />

                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepDot,
                      { backgroundColor: palette.glassSurfaceElevated, borderWidth: 1, borderColor: palette.border },
                    ]}
                  >
                    <MaterialCommunityIcons name="truck-fast-outline" size={13} color={palette.textMuted} />
                  </View>
                  <Text style={[styles.stepLabelInactive, { color: palette.textMuted }]}>
                    On the Way
                  </Text>
                </View>
              </View>
            </View>

            {/* 2. ORDER INFORMATION RECEIPT CARD */}
            <View
              style={[
                styles.orderInfoCard,
                {
                  backgroundColor: palette.glassSurface,
                  borderColor: palette.border,
                },
                webGlassStyle,
              ]}
            >
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.sectionAccentBar} />
                  <Title style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                    Order Information
                  </Title>
                </View>

                <View style={styles.statusChip}>
                  <Text style={styles.statusChipText}>{orderRecord.status || 'Confirmed'}</Text>
                </View>
              </View>

              {/* Order ID Row with Copy Action */}
              <View style={[styles.infoRow, { borderBottomColor: palette.border }]}>
                <Text style={[styles.infoLabel, { color: palette.textSecondary }]}>
                  Order ID / Number
                </Text>
                <TouchableOpacity
                  onPress={() => handleCopyOrderId(orderRecord.id)}
                  activeOpacity={0.75}
                  style={styles.copyOrderIdBtn}
                >
                  <Text style={[styles.infoValue, { color: palette.textPrimary }]}>
                    {orderRecord.id}
                  </Text>
                  <MaterialCommunityIcons
                    name={copiedOrderId ? 'check-circle' : 'content-copy'}
                    size={15}
                    color={copiedOrderId ? palette.success : '#FE2C55'}
                  />
                </TouchableOpacity>
              </View>

              <View style={[styles.infoRow, { borderBottomColor: palette.border }]}>
                <Text style={[styles.infoLabel, { color: palette.textSecondary }]}>
                  Order Date & Time
                </Text>
                <Text style={[styles.infoValue, { color: palette.textPrimary }]}>
                  {formattedDate}
                </Text>
              </View>

              <View style={[styles.infoRow, { borderBottomColor: palette.border }]}>
                <Text style={[styles.infoLabel, { color: palette.textSecondary }]}>
                  Total Amount
                </Text>
                <Text style={[styles.infoValue, { color: '#FE2C55', fontSize: 16.5, fontWeight: '900' }]}>
                  {formatPeso(orderRecord.totalAmount)}
                </Text>
              </View>

              <View style={[styles.infoRow, { borderBottomColor: palette.border }]}>
                <Text style={[styles.infoLabel, { color: palette.textSecondary }]}>
                  Payment Method
                </Text>
                <Text style={[styles.infoValue, { color: palette.textPrimary }]}>
                  {orderRecord.paymentMethod || 'GCash'}
                </Text>
              </View>

              <View style={[styles.infoRow, { borderBottomColor: palette.border }]}>
                <Text style={[styles.infoLabel, { color: palette.textSecondary }]}>
                  Payment Status
                </Text>
                <View style={styles.paidBadge}>
                  <MaterialCommunityIcons name="check-decagram" size={14} color={palette.success} />
                  <Text style={[styles.paidBadgeText, { color: palette.success }]}>
                    {orderRecord.paymentStatus || 'Paid (Verified)'}
                  </Text>
                </View>
              </View>

              <View style={[styles.infoRow, { borderBottomColor: palette.border }]}>
                <Text style={[styles.infoLabel, { color: palette.textSecondary }]}>
                  Products Ordered
                </Text>
                <Text style={[styles.infoValue, { color: palette.textPrimary }]}>
                  {orderRecord.items.length} item(s) ({totalUnits} PCS)
                </Text>
              </View>

              {/* Ordered Items Preview Strip */}
              {orderRecord.items.length > 0 && (
                <View
                  style={[
                    styles.orderedItemsBox,
                    { backgroundColor: palette.glassInput, borderColor: palette.border },
                  ]}
                >
                  {orderRecord.items.slice(0, 3).map((prod, idx) => (
                    <View
                      key={`ord-item-${prod.productId}-${idx}`}
                      style={[
                        styles.orderedItemPreviewRow,
                        idx > 0 && { borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 8 },
                      ]}
                    >
                      <Image
                        source={{ uri: prod.thumbnail }}
                        style={styles.orderedItemThumb}
                        resizeMode="contain"
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          numberOfLines={1}
                          style={{ fontSize: 13, fontWeight: '700', color: palette.textPrimary }}
                        >
                          {prod.title}
                        </Text>
                        <Text style={{ fontSize: 11.5, color: palette.textSecondary, marginTop: 2 }}>
                          {prod.variationLabel ? `${prod.variationLabel} · ` : ''}Qty: {prod.quantity}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: palette.textPrimary }}>
                        {formatPeso(prod.price * prod.quantity)}
                      </Text>
                    </View>
                  ))}
                  {orderRecord.items.length > 3 && (
                    <Text
                      style={{
                        fontSize: 11.5,
                        fontWeight: '700',
                        color: '#FE2C55',
                        textAlign: 'center',
                        marginTop: 6,
                      }}
                    >
                      +{orderRecord.items.length - 3} more item(s) in this order
                    </Text>
                  )}
                </View>
              )}

              <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 4 }]}>
                <Text style={[styles.infoLabel, { color: palette.textSecondary }]}>
                  Delivery Address
                </Text>
                <Text style={[styles.infoValue, { color: palette.textPrimary }]}>
                  {orderRecord.shippingAddress}
                </Text>
              </View>

              {/* 4. ADDITIONAL NAVIGATION ACTIONS */}
              <View style={styles.actionButtonsRow}>
                <Button
                  mode="contained"
                  icon="clipboard-list-outline"
                  buttonColor="#FE2C55"
                  textColor="#FFFFFF"
                  style={[
                    { flex: isMobile ? 1 : undefined, minWidth: 165, borderRadius: 22 },
                    webPrimaryButtonGradient,
                  ]}
                  contentStyle={{ height: 42 }}
                  onPress={() => router.push('/(app)/orders' as any)}
                >
                  View My Orders
                </Button>

                {orderRecord.trackingNumber && (
                  <Button
                    mode="outlined"
                    icon="map-marker-path"
                    textColor="#FE2C55"
                    style={{ borderColor: '#FE2C55', borderRadius: 22 }}
                    contentStyle={{ height: 42 }}
                    onPress={() => router.push('/(app)/orders' as any)}
                  >
                    Track Order
                  </Button>
                )}

                <Button
                  mode="outlined"
                  icon="shopping-outline"
                  textColor={palette.textPrimary}
                  style={{ borderColor: palette.border, borderRadius: 22 }}
                  contentStyle={{ height: 42 }}
                  onPress={() => router.replace('/(app)/(tabs)/home' as any)}
                >
                  Continue Shopping
                </Button>
              </View>
            </View>

            {/* 3. YOU MIGHT ALSO LIKE HEADER */}
            <View style={styles.recSectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.sectionAccentBar} />
                <Title style={{ fontSize: 18, fontWeight: '900', color: palette.textPrimary }}>
                  You Might Also Like
                </Title>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: palette.textMuted }}>
                Curated for you
              </Text>
            </View>
          </View>
        }
        ListFooterComponent={
          <View style={{ paddingVertical: 22, alignItems: 'center', gap: 10 }}>
            {loadingMoreRec ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#FE2C55" />
                <Text style={{ fontSize: 13, color: palette.textSecondary, fontWeight: '600' }}>
                  Loading more recommendations...
                </Text>
              </View>
            ) : hasMoreRec ? (
              <Button
                mode="outlined"
                textColor="#FE2C55"
                style={{ borderColor: '#FE2C55', borderRadius: 22 }}
                onPress={() => loadRecommendations(false)}
              >
                Load More
              </Button>
            ) : recommendedProducts.length > 0 ? (
              <Text style={{ fontSize: 12.5, color: palette.textMuted, fontWeight: '500' }}>
                You've reached the end of recommendations
              </Text>
            ) : null}
          </View>
        }
      />
    </View>
  );
}