/**
 * Home / Products Screen - Marketplace
 * Docs: https://dummyjson.com/docs/products
 * 
 * Student Implementation Guide:
 * Complete the product listing screen:
 * 1. Fetch products from https://dummyjson.com/products
 * 2. Implement search using GET /products/search?q=query
 * 3. Filter by category using GET /products/category/{category}
 * 4. Add infinite scroll / pagination (limit=10, skip=0)
 * 5. Navigate to product detail on tap
 * 6. Add pull-to-refresh
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  useWindowDimensions,
  Platform,
  ScrollView,
  Animated,
  LayoutChangeEvent,
  Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Title, Badge, IconButton, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../context/AuthContext';
import { useAppTheme } from '../../../context/ThemeContext';
import { useDesktopDrawer } from './_layout';
import BonusCenterModal from '../../../components/BonusCenterModal';
import CouponsRewardsModal from '../../../components/CouponsRewardsModal';
import {
  MarketplaceProduct,
  FlashSaleSchedule,
  getFlashSaleSchedules,
  evaluateProductPromotions,
} from '../../../utils/flashSaleHelpers';
import { syncNotificationsFromOrders } from '../../../utils/shopNotifications';
import { styles, getHomeBreakpointMetrics } from './homeStyles';

const PAGE_SIZE = 12;

interface CategoryNavItem {
  label: string;
  slug: string;
}

const EXACT_CATEGORIES: CategoryNavItem[] = [
  { label: 'All', slug: 'all' },
  { label: 'Beauty', slug: 'beauty' },
  { label: 'Fragrances', slug: 'fragrances' },
  { label: 'Furniture', slug: 'furniture' },
  { label: 'Groceries', slug: 'groceries' },
  { label: 'Home Decoration', slug: 'home-decoration' },
  { label: 'Kitchen Accessories', slug: 'kitchen-accessories' },
  { label: 'Laptops', slug: 'laptops' },
  { label: 'Mens Shirts', slug: 'mens-shirts' },
  { label: 'Mens Shoes', slug: 'mens-shoes' },
  { label: 'Mens Watches', slug: 'mens-watches' },
  { label: 'Mobile Accessories', slug: 'mobile-accessories' },
  { label: 'Motorcycle', slug: 'motorcycle' },
  { label: 'Skin Care', slug: 'skin-care' },
  { label: 'Smartphones', slug: 'smartphones' },
  { label: 'Sports Accessories', slug: 'sports-accessories' },
  { label: 'Sunglasses', slug: 'sunglasses' },
  { label: 'Tablets', slug: 'tablets' },
  { label: 'Tops', slug: 'tops' },
  { label: 'Vehicle', slug: 'vehicle' },
  { label: 'Womens Bags', slug: 'womens-bags' },
  { label: 'Womens Dresses', slug: 'womens-dresses' },
  { label: 'Womens Jewellery', slug: 'womens-jewellery' },
  { label: 'Womens Shoes', slug: 'womens-shoes' },
  { label: 'Womens Watches', slug: 'womens-watches' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { palette } = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { openDesktopDrawer, cartBadgeCount } = useDesktopDrawer();

  // Responsive Breakpoints: Website Desktop (>= 1024), Tablet (768-1023), Phones (< 768: Realme, Samsung, Xiaomi, OPPO, Vivo, iPhone)
  const metrics = useMemo(() => getHomeBreakpointMetrics(width), [width]);
  const {
    isAnyDesktop,
    isTablet,
    isSmallPhone,
    numColumns,
    horizontalPadding,
    actionIconSize,
    actionBoxSize,
    actionItemGap,
  } = metrics;

  const topSafeInset = Platform.OS === 'web' ? 14 : Math.max(insets.top, 10);

  // Per-user storage keys
  const userPrefix = `@marketplace_user_${user?.id || 'guest'}`;
  const userOrdersKey = `${userPrefix}_orders`;
  const userBonusKey = `${userPrefix}_bonus_center`;

  // Web-specific translucent glass backdrop blur & layered mesh gradient background
  const webGlassStyle: any =
    Platform.OS === 'web'
      ? { backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }
      : {};

  const webAmbientBackdropStyle: any =
    Platform.OS === 'web'
      ? {
          backgroundImage: palette.isDark
            ? 'radial-gradient(circle at 12% 10%, rgba(254, 44, 85, 0.18), transparent 40%), radial-gradient(circle at 88% 18%, rgba(59, 130, 246, 0.16), transparent 42%), radial-gradient(circle at 50% 85%, rgba(16, 185, 129, 0.12), transparent 45%)'
            : 'radial-gradient(circle at 10% 8%, rgba(254, 44, 85, 0.13), transparent 42%), radial-gradient(circle at 90% 14%, rgba(56, 189, 248, 0.16), transparent 44%), radial-gradient(circle at 48% 88%, rgba(251, 146, 60, 0.12), transparent 46%)',
        }
      : {};

  // Hide browser horizontal scrollbar track/arrows on Web while preserving touch/trackpad/wheel scrolling
  const webHideScrollbarStyle: any =
    Platform.OS === 'web'
      ? { scrollbarWidth: 'none', msOverflowStyle: 'none' }
      : {};

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const doc = (globalThis as any)?.document;
    if (!doc) return;
    const styleId = 'hide-horizontal-scrollbars-style';
    if (!doc.getElementById(styleId)) {
      const styleEl = doc.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = `
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `;
      doc.head.appendChild(styleEl);
    }
  }, []);

  // Product & Infinite Pagination States
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [skip, setSkip] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number>(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);

  // Synchronous pagination refs so scrolling down reliably loads more products without race conditions
  const isFetchingRef = useRef<boolean>(false);
  const skipRef = useRef<number>(0);
  const hasMoreRef = useRef<boolean>(true);
  const activeCategoryRef = useRef<string>('all');

  // Guard against opening duplicate Search screens when tapped repeatedly
  const isOpeningSearchRef = useRef<boolean>(false);

  // Flash Deals Horizontal Carousel & "See More" Modal States
  const [flashDealProducts, setFlashDealProducts] = useState<MarketplaceProduct[]>([]);
  const [loadingFlashDeals, setLoadingFlashDeals] = useState<boolean>(true);
  const [flashDealsModalVisible, setFlashDealsModalVisible] = useState<boolean>(false);

  // Separate Bonus Center & Coupons Modal Visibility + Badge Counts
  const [bonusModalVisible, setBonusModalVisible] = useState<boolean>(false);
  const [couponsModalVisible, setCouponsModalVisible] = useState<boolean>(false);
  const [bonusBalance, setBonusBalance] = useState<number>(0);
  const [totalCouponsCount, setTotalCouponsCount] = useState<number>(63);

  // Live Flash Sale & Promo Badge States
  const [flashSchedules, setFlashSchedules] = useState<Record<number, FlashSaleSchedule>>({});
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // Category Navigation Sliding Underline Refs
  const categoryScrollRef = useRef<ScrollView | null>(null);
  const categoryLayoutsRef = useRef<Record<string, { x: number; width: number }>>({});
  const underlineLeft = useRef(new Animated.Value(0)).current;
  const underlineWidth = useRef(new Animated.Value(24)).current;
  const [categoryBarWidth, setCategoryBarWidth] = useState<number>(width);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Animate active underline smoothly & keep selected category visible
  const animateCategoryUnderline = useCallback(
    (slug: string) => {
      const layout = categoryLayoutsRef.current[slug];
      if (!layout) return;

      Animated.parallel([
        Animated.spring(underlineLeft, {
          toValue: layout.x,
          useNativeDriver: false,
          friction: 9,
          tension: 95,
        }),
        Animated.spring(underlineWidth, {
          toValue: layout.width,
          useNativeDriver: false,
          friction: 9,
          tension: 95,
        }),
      ]).start();

      if (categoryScrollRef.current && categoryBarWidth > 0) {
        const scrollToX = Math.max(0, layout.x + layout.width / 2 - categoryBarWidth / 2);
        categoryScrollRef.current.scrollTo({ x: scrollToX, animated: true });
      }
    },
    [underlineLeft, underlineWidth, categoryBarWidth]
  );

  useEffect(() => {
    animateCategoryUnderline(selectedCategory);
  }, [selectedCategory, animateCategoryUnderline]);

  const handleCategoryItemLayout = (slug: string, e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    categoryLayoutsRef.current[slug] = { x, width: w };
    if (slug === selectedCategory) {
      underlineLeft.setValue(x);
      underlineWidth.setValue(w);
    }
  };

  // Load user-specific orders count, bonus balance, and unread Shop Updates count
  const loadHeaderBalances = useCallback(async () => {
    try {
      const [rawOrders, rawBonus, syncedNotifications] = await Promise.all([
        AsyncStorage.getItem(userOrdersKey),
        AsyncStorage.getItem(userBonusKey),
        syncNotificationsFromOrders(user?.id),
      ]);

      if (rawOrders) {
        const parsedOrders = JSON.parse(rawOrders);
        if (Array.isArray(parsedOrders)) {
          const userSpecific = parsedOrders.filter(
            (o: any) => !user?.id || String(o.userId) === String(user.id)
          );
          setActiveOrdersCount(userSpecific.length);
        } else {
          setActiveOrdersCount(0);
        }
      } else {
        setActiveOrdersCount(0);
      }

      if (rawBonus) {
        const parsedBonus = JSON.parse(rawBonus);
        if (typeof parsedBonus.bonusBalance === 'number') {
          setBonusBalance(parsedBonus.bonusBalance);
        }
      }

      const unreadTotal = syncedNotifications.filter((n) => !n.read).length;
      setUnreadMessagesCount(unreadTotal);
    } catch {
      setActiveOrdersCount(0);
      setUnreadMessagesCount(0);
    }
  }, [userOrdersKey, userBonusKey, user?.id]);

  useFocusEffect(
    useCallback(() => {
      isOpeningSearchRef.current = false;
      loadHeaderBalances();
    }, [loadHeaderBalances])
  );

  // Navigate smoothly to dedicated Search screen when Search Products bar is clicked/tapped
  const handleOpenSearchScreen = useCallback(() => {
    if (isOpeningSearchRef.current) return;
    isOpeningSearchRef.current = true;
    router.push('/(app)/(tabs)/search' as any);
    setTimeout(() => {
      isOpeningSearchRef.current = false;
    }, 600);
  }, [router]);

  // Load Flash Sale schedules & Flash Deal products for horizontal strip
  const loadFlashDeals = useCallback(async () => {
    try {
      setLoadingFlashDeals(true);
      const [schedules, res] = await Promise.all([
        getFlashSaleSchedules(),
        fetch('https://dummyjson.com/products?limit=30&skip=0'),
      ]);
      setFlashSchedules(schedules);
      if (res.ok) {
        const data = await res.json();
        const allItems: MarketplaceProduct[] = data.products || [];
        const prioritized = [...allItems].sort((a, b) => {
          const aScheduled = schedules[a.id] ? 1 : 0;
          const bScheduled = schedules[b.id] ? 1 : 0;
          if (bScheduled !== aScheduled) return bScheduled - aScheduled;
          return (b.discountPercentage || 0) - (a.discountPercentage || 0);
        });
        setFlashDealProducts(prioritized.slice(0, 16));
      }
    } catch (err) {
      console.error('Failed to load flash deals:', err);
    } finally {
      setLoadingFlashDeals(false);
    }
  }, []);

  useEffect(() => {
    loadFlashDeals();
  }, [loadFlashDeals]);

  const buildProductsUrl = useCallback(
    (nextSkip: number, category: string) => {
      if (category && category !== 'all') {
        return `https://dummyjson.com/products/category/${encodeURIComponent(
          category
        )}?limit=${PAGE_SIZE}&skip=${nextSkip}`;
      }
      return `https://dummyjson.com/products?limit=${PAGE_SIZE}&skip=${nextSkip}`;
    },
    []
  );

  const fetchProducts = useCallback(
    async (reset = false, categoryOverride?: string) => {
      const activeCategory =
        categoryOverride !== undefined ? categoryOverride : activeCategoryRef.current;

      if (reset) {
        activeCategoryRef.current = activeCategory;
        skipRef.current = 0;
        hasMoreRef.current = true;
      } else {
        if (isFetchingRef.current || !hasMoreRef.current) return;
      }

      const currentSkip = reset ? 0 : skipRef.current;
      isFetchingRef.current = true;

      try {
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const url = buildProductsUrl(currentSkip, activeCategory);
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        const incoming: MarketplaceProduct[] = data.products || [];
        const totalCount: number = data.total || 0;

        // Ignore stale response if user switched category mid-request
        if (activeCategory !== activeCategoryRef.current) return;

        const nextSkip = currentSkip + incoming.length;
        const moreAvailable = incoming.length > 0 && nextSkip < totalCount;

        skipRef.current = nextSkip;
        hasMoreRef.current = moreAvailable;
        setSkip(nextSkip);
        setHasMore(moreAvailable);

        if (reset) {
          setProducts(incoming);
        } else if (incoming.length > 0) {
          setProducts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const unique = incoming.filter((p) => !existingIds.has(p.id));
            return [...prev, ...unique];
          });
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [buildProductsUrl]
  );

  useEffect(() => {
    fetchProducts(true, 'all');
  }, [fetchProducts]);

  const handleSelectCategory = (slug: string) => {
    setSelectedCategory(slug);
    fetchProducts(true, slug);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHeaderBalances();
    loadFlashDeals();
    fetchProducts(true, selectedCategory);
  };

  const selectedCategoryLabel =
    EXACT_CATEGORIES.find((c) => c.slug === selectedCategory)?.label || 'All';

  // Connected products for Coupons & Bonus Center modals (without duplicates)
  const connectedProducts: MarketplaceProduct[] = React.useMemo(() => {
    const seen = new Set<number>();
    const combined: MarketplaceProduct[] = [];
    for (const item of [...flashDealProducts, ...products]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        combined.push(item);
      }
    }
    return combined;
  }, [flashDealProducts, products]);

  // Quick Action Items Configuration with Vivid Accent Tints
  const quickActionItems = [
    {
      key: 'bonus',
      label: 'Bonus',
      icon: 'cash-multiple' as const,
      iconColor: '#FE2C55',
      tintBg: 'rgba(254, 44, 85, 0.13)',
      tintBorder: 'rgba(254, 44, 85, 0.28)',
      bonusText: bonusBalance > 0 ? `₱${bonusBalance.toFixed(1)}` : null,
      badgeCount: 0,
      onPress: () => setBonusModalVisible(true),
    },
    {
      key: 'orders',
      label: 'Orders',
      icon: 'clipboard-text-clock-outline' as const,
      iconColor: '#2563EB',
      tintBg: 'rgba(37, 99, 235, 0.12)',
      tintBorder: 'rgba(37, 99, 235, 0.26)',
      bonusText: null,
      badgeCount: activeOrdersCount,
      onPress: () => router.push('/(app)/orders' as any),
    },
    {
      key: 'coupons',
      label: 'Coupons',
      icon: 'ticket-percent-outline' as const,
      iconColor: '#F59E0B',
      tintBg: 'rgba(245, 158, 11, 0.13)',
      tintBorder: 'rgba(245, 158, 11, 0.28)',
      bonusText: null,
      badgeCount: totalCouponsCount,
      onPress: () => setCouponsModalVisible(true),
    },
    {
      key: 'messages',
      label: 'Messages',
      icon: 'message-text-outline' as const,
      iconColor: '#8B5CF6',
      tintBg: 'rgba(139, 92, 246, 0.13)',
      tintBorder: 'rgba(139, 92, 246, 0.28)',
      bonusText: null,
      badgeCount: unreadMessagesCount,
      onPress: () => router.push('/(app)/messages' as any),
    },
    {
      key: 'paylater',
      label: 'PayLater',
      icon: 'wallet-outline' as const,
      iconColor: '#10B981',
      tintBg: 'rgba(16, 185, 129, 0.13)',
      tintBorder: 'rgba(16, 185, 129, 0.28)',
      bonusText: null,
      badgeCount: 0,
      onPress: () => router.push('/(app)/paylater' as any),
    },
    {
      key: 'help',
      label: 'Help',
      icon: 'help-circle-outline' as const,
      iconColor: '#0EA5E9',
      tintBg: 'rgba(14, 165, 233, 0.13)',
      tintBorder: 'rgba(14, 165, 233, 0.28)',
      bonusText: null,
      badgeCount: 0,
      onPress: () => router.push('/(app)/help' as any),
    },
  ];

  // ==================== HORIZONTAL FLASH DEAL CARD ====================
  const renderFlashDealCard = (item: MarketplaceProduct) => {
    const promo = evaluateProductPromotions(item, flashSchedules, nowMs);
    const cardWidth = isAnyDesktop ? 172 : isTablet ? 158 : 140;

    return (
      <TouchableOpacity
        key={`flash-deal-${item.id}`}
        onPress={() => router.push(`/(app)/(tabs)/product/${item.id}` as any)}
        activeOpacity={0.88}
        style={{ width: cardWidth }}
      >
        <Card
          style={[
            styles.flashDealCard,
            { backgroundColor: palette.glassSurface },
            webGlassStyle,
          ]}
          elevation={0}
        >
          <View
            style={[
              styles.flashDealImageBox,
              {
                height: isAnyDesktop ? 130 : 114,
                backgroundColor: palette.isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
              },
            ]}
          >
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.flashDealImage}
              resizeMode="contain"
            />
            <View style={styles.flashDealCornerBadge}>
              <MaterialCommunityIcons name="lightning-bolt" size={10} color="#FFFFFF" />
              <Text style={styles.flashDealCornerText}>
                {promo.isFlashSale
                  ? promo.countdownLabel
                  : `${Math.max(10, promo.effectiveDiscountPercentage)}% OFF`}
              </Text>
            </View>
          </View>

          <View style={styles.flashDealBody}>
            <Text
              numberOfLines={1}
              style={[styles.flashDealTitle, { color: palette.textPrimary }]}
            >
              {item.title}
            </Text>

            <View style={styles.flashDealPriceRow}>
              <Text style={styles.flashDealPrice}>${promo.effectivePrice.toFixed(2)}</Text>
              <Text style={[styles.flashDealOriginalPrice, { color: palette.textMuted }]}>
                ${promo.originalPrice.toFixed(2)}
              </Text>
            </View>

            <View style={styles.flashSoldPill}>
              <Text style={styles.flashSoldText}>{promo.soldFormatted}</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  // ==================== MAIN GRID PRODUCT CARD ====================
  const renderProductCard = ({ item }: { item: MarketplaceProduct }) => {
    const promo = evaluateProductPromotions(item, flashSchedules, nowMs);

    return (
      <TouchableOpacity
        style={{
          flex: 1 / numColumns,
          margin: isSmallPhone ? 3.5 : 5,
        }}
        onPress={() => router.push(`/(app)/(tabs)/product/${item.id}` as any)}
        activeOpacity={0.88}
      >
        <Card
          style={[
            styles.productCard,
            {
              backgroundColor: palette.glassSurface,
              borderColor: palette.border,
            },
            webGlassStyle,
          ]}
          elevation={0}
        >
          <View
            style={[
              styles.productImageBox,
              {
                height: isAnyDesktop ? 180 : isTablet ? 164 : 154,
                backgroundColor: palette.isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
              },
            ]}
          >
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.productImage}
              resizeMode="contain"
            />

            {promo.isFlashSale ? (
              <View style={styles.productFlashBadge}>
                <MaterialCommunityIcons name="lightning-bolt" size={11} color="#FFFFFF" />
                <Text style={styles.productFlashBadgeText}>{promo.countdownLabel}</Text>
              </View>
            ) : promo.hasDiscount ? (
              <View style={styles.productDiscountBadge}>
                <Text style={styles.productDiscountBadgeText}>
                  {promo.effectiveDiscountPercentage}% OFF
                </Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.productBody, { padding: isSmallPhone ? 9 : 11 }]}>
            <Text
              numberOfLines={2}
              style={[
                styles.productTitle,
                {
                  fontSize: isSmallPhone ? 12 : 13,
                  color: palette.textPrimary,
                },
              ]}
            >
              {item.title}
            </Text>

            <View style={styles.productPriceRow}>
              <Text
                style={[styles.productCurrentPrice, { fontSize: isSmallPhone ? 15 : 16.5 }]}
              >
                ${promo.effectivePrice.toFixed(2)}
              </Text>
              {promo.hasDiscount && (
                <>
                  <Text style={[styles.productOriginalPrice, { color: palette.textMuted }]}>
                    ${promo.originalPrice.toFixed(2)}
                  </Text>
                  <View style={styles.inlineDiscountTag}>
                    <Text style={styles.inlineDiscountTagText}>
                      {promo.effectiveDiscountPercentage}% OFF
                    </Text>
                  </View>
                </>
              )}
            </View>

            <View style={styles.promoTagsRow}>
              {promo.isFlashSale && (
                <View style={styles.flashSaleTag}>
                  <Text style={styles.flashSaleTagText}>Flash Sale</Text>
                </View>
              )}

              {promo.isFreeShipping && (
                <View style={styles.freeShippingTag}>
                  <Text style={[styles.freeShippingTagText, { color: palette.success }]}>
                    Free Shipping
                  </Text>
                </View>
              )}

              {promo.isCodAvailable && (
                <View style={[styles.codTag, { backgroundColor: palette.accentSoft }]}>
                  <Text style={[styles.codTagText, { color: palette.accent }]}>COD</Text>
                </View>
              )}
            </View>

            <View style={styles.ratingRow}>
              <Text
                numberOfLines={1}
                style={[
                  styles.ratingText,
                  {
                    fontSize: isSmallPhone ? 10.5 : 11.5,
                    color: palette.textSecondary,
                  },
                ]}
              >
                ⭐ {item.rating.toFixed(1)} | {promo.soldFormatted}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: palette.isDark ? palette.background : '#F3F6FB' },
        webAmbientBackdropStyle,
      ]}
    >
      {/* AMBIENT DECORATIVE GRADIENT ORBS FOR ALL PLATFORMS (WEB, TABLET, IOS, ANDROID) */}
      <View pointerEvents="none" style={styles.ambientBackgroundLayer}>
        <View
          style={[
            styles.ambientOrbTopLeft,
            {
              backgroundColor: palette.isDark
                ? 'rgba(254, 44, 85, 0.14)'
                : 'rgba(254, 44, 85, 0.10)',
            },
          ]}
        />
        <View
          style={[
            styles.ambientOrbTopRight,
            {
              backgroundColor: palette.isDark
                ? 'rgba(59, 130, 246, 0.14)'
                : 'rgba(56, 189, 248, 0.13)',
            },
          ]}
        />
        <View
          style={[
            styles.ambientOrbCenter,
            {
              backgroundColor: palette.isDark
                ? 'rgba(139, 92, 246, 0.10)'
                : 'rgba(251, 146, 60, 0.08)',
            },
          ]}
        />
        <View
          style={[
            styles.ambientOrbBottomRight,
            {
              backgroundColor: palette.isDark
                ? 'rgba(16, 185, 129, 0.10)'
                : 'rgba(99, 102, 241, 0.09)',
            },
          ]}
        />
      </View>

      <FlatList
        data={products}
        renderItem={renderProductCard}
        numColumns={numColumns}
        key={`home-products-grid-${numColumns}`}
        keyExtractor={(item) => `home-prod-${item.id}`}
        onEndReached={() => {
          if (!loading && !loadingMore && hasMoreRef.current) {
            fetchProducts(false);
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.accent]} />
        }
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: topSafeInset,
            paddingHorizontal: horizontalPadding,
          },
        ]}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* 1. GLASSMORPHIC HERO GREETING & SEARCH PRODUCTS TRIGGER BAR */}
            <View
              style={[
                styles.heroHeaderCard,
                {
                  backgroundColor: palette.glassSurface,
                  borderColor: palette.border,
                },
                webGlassStyle,
              ]}
            >
              <View style={styles.greetingRow}>
                <View style={styles.greetingTitleGroup}>
                  <View style={styles.greetingEyebrowRow}>
                    <MaterialCommunityIcons name="creation" size={13} color="#FE2C55" />
                    <Text style={styles.greetingEyebrowText}>
                      Curated Marketplace
                    </Text>
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.greetingHeadline,
                      {
                        fontSize: isAnyDesktop ? 23 : isSmallPhone ? 18 : 20,
                        color: palette.textPrimary,
                      },
                    ]}
                  >
                    Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.greetingSubtext, { color: palette.textSecondary }]}
                  >
                    Explore flash deals, daily rewards, and trending essentials
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setBonusModalVisible(true)}
                  activeOpacity={0.82}
                  style={[
                    styles.heroBalanceChip,
                    {
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      borderColor: 'rgba(16, 185, 129, 0.28)',
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="gift-outline" size={15} color="#10B981" />
                  <Text style={[styles.heroBalanceText, { color: '#059669' }]}>
                    ₱{bonusBalance.toFixed(1)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.topBarRow}>
                <TouchableOpacity
                  onPress={handleOpenSearchScreen}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Search products"
                  style={styles.searchTriggerFlex}
                >
                  <View
                    style={[
                      styles.searchBarShell,
                      {
                        backgroundColor: palette.isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : '#FFFFFF',
                        borderColor: 'rgba(254, 44, 85, 0.28)',
                      },
                    ]}
                  >
                    <MaterialCommunityIcons name="magnify" size={21} color="#FE2C55" />
                    <Text
                      numberOfLines={1}
                      style={[styles.searchPlaceholderText, { color: palette.textMuted }]}
                    >
                      Search products, brands & deals...
                    </Text>
                    <View style={styles.searchPillChip}>
                      <Text style={styles.searchPillChipText}>Search</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Hamburger Menu Button on Website Only (Contains Shop, Categories, Cart, Profile) */}
                {isAnyDesktop && (
                  <TouchableOpacity
                    onPress={openDesktopDrawer}
                    activeOpacity={0.8}
                    accessibilityLabel="Open navigation menu"
                    style={[
                      styles.desktopMenuButton,
                      {
                        backgroundColor: palette.isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : '#FFFFFF',
                        borderColor: palette.border,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons name="menu" size={24} color={palette.textPrimary} />
                    {cartBadgeCount > 0 && (
                      <Badge size={16} style={styles.desktopMenuBadge}>
                        {cartBadgeCount}
                      </Badge>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* 2. QUICK ACTION BAR (BONUS, ORDERS, COUPONS, MESSAGES, PAYLATER, HELP) - NO WHITE LONG PADDING */}
            <View style={styles.actionStripWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={webHideScrollbarStyle}
                {...(Platform.OS === 'web' ? { className: 'no-scrollbar' } : {})}
                contentContainerStyle={[
                  styles.actionScrollContent,
                  { gap: actionItemGap },
                ]}
              >
                {quickActionItems.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    onPress={item.onPress}
                    activeOpacity={0.78}
                    style={styles.actionItem}
                  >
                    <View
                      style={[
                        styles.actionIconBox,
                        {
                          width: actionBoxSize,
                          height: actionBoxSize,
                          backgroundColor: item.tintBg,
                          borderColor: item.tintBorder,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={actionIconSize}
                        color={item.iconColor}
                      />

                      {item.bonusText && (
                        <View style={styles.bonusPillBadge}>
                          <Text style={styles.bonusPillText}>{item.bonusText}</Text>
                        </View>
                      )}

                      {item.badgeCount > 0 && (
                        <Badge size={16} style={styles.actionCountBadge}>
                          {item.badgeCount}
                        </Badge>
                      )}
                    </View>

                    <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 3. REWARDS & VOUCHER HIGHLIGHT STRIP */}
            <TouchableOpacity
              onPress={() => setCouponsModalVisible(true)}
              activeOpacity={0.85}
              style={[
                styles.promoBanner,
                {
                  backgroundColor: palette.glassSurface,
                  borderColor: 'rgba(254, 44, 85, 0.28)',
                },
                webGlassStyle,
              ]}
            >
              <View style={styles.promoBannerLeft}>
                <View style={styles.promoIconCircle}>
                  <MaterialCommunityIcons name="ticket-percent" size={18} color="#FE2C55" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={[styles.promoBannerTitle, { color: palette.textPrimary }]}
                  >
                    {totalCouponsCount} Active Vouchers Ready
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.promoBannerSubtitle, { color: palette.textSecondary }]}
                  >
                    Free Shipping & Daily Bonus Rewards available
                  </Text>
                </View>
              </View>

              <View style={styles.promoBannerCta}>
                <Text style={styles.promoBannerCtaText}>Claim</Text>
                <MaterialCommunityIcons name="chevron-right" size={14} color="#FE2C55" />
              </View>
            </TouchableOpacity>

            {/* 4. HORIZONTAL TEXT CATEGORY NAVIGATION BAR */}
            <View
              onLayout={(e) => setCategoryBarWidth(e.nativeEvent.layout.width)}
              style={[styles.categoryBarWrapper, { borderBottomColor: palette.border }]}
            >
              <ScrollView
                ref={categoryScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={webHideScrollbarStyle}
                {...(Platform.OS === 'web' ? { className: 'no-scrollbar' } : {})}
                contentContainerStyle={[
                  styles.categoryScrollContent,
                  { gap: isTablet || isAnyDesktop ? 22 : 16 },
                ]}
              >
                {EXACT_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.slug;
                  return (
                    <TouchableOpacity
                      key={cat.slug}
                      onLayout={(e) => handleCategoryItemLayout(cat.slug, e)}
                      onPress={() => handleSelectCategory(cat.slug)}
                      activeOpacity={0.75}
                      style={styles.categoryTabItem}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.categoryTabText,
                          {
                            fontSize: isSmallPhone ? 13 : 14.5,
                            fontWeight: isSelected ? '800' : '600',
                            color: isSelected ? '#FE2C55' : palette.textSecondary,
                          },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {/* Smoothly Animated Active Category Underline */}
                <Animated.View
                  style={[
                    styles.categoryUnderline,
                    {
                      left: underlineLeft,
                      width: underlineWidth,
                    },
                  ]}
                />
              </ScrollView>
            </View>

            {/* 5. FLASH DEALS SECTION */}
            {flashDealProducts.length > 0 && (
              <View
                style={[
                  styles.flashSectionCard,
                  {
                    backgroundColor: palette.glassSurface,
                    borderColor: palette.border,
                  },
                  webGlassStyle,
                ]}
              >
                <View style={styles.flashHeaderRow}>
                  <View style={styles.flashTitleGroup}>
                    <MaterialCommunityIcons name="lightning-bolt" size={20} color="#FE2C55" />
                    <Text style={[styles.flashTitleText, { color: palette.textPrimary }]}>
                      Flash Deals
                    </Text>
                    <View style={styles.liveBadge}>
                      <Text style={styles.liveBadgeText}>LIVE</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => setFlashDealsModalVisible(true)}
                    activeOpacity={0.75}
                    style={styles.seeMoreButton}
                  >
                    <Text style={styles.seeMoreText}>See More</Text>
                    <MaterialCommunityIcons name="chevron-right" size={16} color="#FE2C55" />
                  </TouchableOpacity>
                </View>

                {loadingFlashDeals ? (
                  <ActivityIndicator size="small" color="#FE2C55" style={{ marginVertical: 16 }} />
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={webHideScrollbarStyle}
                    {...(Platform.OS === 'web' ? { className: 'no-scrollbar' } : {})}
                    contentContainerStyle={styles.flashDealsScrollContent}
                  >
                    {flashDealProducts.slice(0, 10).map((item) => renderFlashDealCard(item))}
                  </ScrollView>
                )}
              </View>
            )}

            {/* 6. RECOMMENDED FOR YOU / FILTERED CATEGORY HEADER */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <View style={styles.sectionAccentBar} />
                <Title style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                  {selectedCategory === 'all' ? 'Recommended for You' : selectedCategoryLabel}
                </Title>
              </View>
              <View style={[styles.sectionCountPill, { backgroundColor: palette.accentSoft }]}>
                <Text style={[styles.sectionCountText, { color: palette.accent }]}>
                  {products.length} items
                </Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#FE2C55" />
              <Text style={[styles.loadingSubtitle, { color: palette.textSecondary }]}>
                Loading products...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="magnify-close" size={54} color={palette.textMuted} />
              <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>
                No products found
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          !loading && products.length > 0 ? (
            <View style={styles.footerContainer}>
              {loadingMore ? (
                <View style={styles.footerLoadingRow}>
                  <ActivityIndicator size="small" color="#FE2C55" />
                  <Text style={[styles.footerText, { color: palette.textSecondary }]}>
                    Loading more products...
                  </Text>
                </View>
              ) : hasMore ? (
                <Button
                  mode="outlined"
                  onPress={() => fetchProducts(false)}
                  textColor="#FE2C55"
                  style={{ borderColor: '#FE2C55', borderRadius: 20 }}
                >
                  Load More Products
                </Button>
              ) : (
                <Text style={[styles.footerText, { color: palette.textMuted }]}>
                  You've reached the end of products
                </Text>
              )}
            </View>
          ) : null
        }
      />

      {/* ==================== "SEE MORE" FLASH DEALS MODAL ==================== */}
      <Modal visible={flashDealsModalVisible} animationType="slide" transparent>
        <View style={[styles.modalBackdrop, { backgroundColor: palette.glassOverlay }]}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: palette.background,
                borderColor: palette.border,
                paddingHorizontal: horizontalPadding,
              },
              webGlassStyle,
            ]}
          >
            <View style={[styles.modalHeaderRow, { borderBottomColor: palette.border }]}>
              <View style={styles.modalTitleGroup}>
                <MaterialCommunityIcons name="lightning-bolt" size={22} color="#FE2C55" />
                <Title style={[styles.modalTitle, { color: palette.textPrimary }]}>
                  All Flash Deals
                </Title>
              </View>
              <IconButton
                icon="close"
                size={22}
                iconColor={palette.textPrimary}
                onPress={() => setFlashDealsModalVisible(false)}
                style={{ margin: 0 }}
              />
            </View>

            <FlatList
              data={flashDealProducts}
              numColumns={numColumns}
              key={`modal-flash-grid-${numColumns}`}
              keyExtractor={(item) => `modal-flash-${item.id}`}
              contentContainerStyle={{ paddingTop: 8, paddingBottom: 28 }}
              renderItem={({ item }) => {
                const promo = evaluateProductPromotions(item, flashSchedules, nowMs);
                return (
                  <TouchableOpacity
                    style={{
                      flex: 1 / numColumns,
                      margin: isSmallPhone ? 3.5 : 5,
                    }}
                    onPress={() => {
                      setFlashDealsModalVisible(false);
                      router.push(`/(app)/(tabs)/product/${item.id}` as any);
                    }}
                    activeOpacity={0.88}
                  >
                    <Card
                      style={[
                        styles.productCard,
                        {
                          backgroundColor: palette.glassSurface,
                          borderColor: palette.border,
                        },
                        webGlassStyle,
                      ]}
                      elevation={0}
                    >
                      <View
                        style={[
                          styles.productImageBox,
                          {
                            height: 140,
                            backgroundColor: palette.isDark
                              ? 'rgba(255,255,255,0.06)'
                              : '#FFFFFF',
                          },
                        ]}
                      >
                        <Image
                          source={{ uri: item.thumbnail }}
                          style={styles.flashDealImage}
                          resizeMode="contain"
                        />
                        <View style={styles.productDiscountBadge}>
                          <Text style={styles.productDiscountBadgeText}>
                            {promo.isFlashSale
                              ? promo.countdownLabel
                              : `${promo.effectiveDiscountPercentage}% OFF`}
                          </Text>
                        </View>
                      </View>
                      <View style={{ padding: 9, gap: 4 }}>
                        <Text
                          numberOfLines={2}
                          style={{
                            fontSize: 12.5,
                            fontWeight: '600',
                            height: 34,
                            color: palette.textPrimary,
                          }}
                        >
                          {item.title}
                        </Text>
                        <View style={styles.flashDealPriceRow}>
                          <Text style={{ fontSize: 15, fontWeight: '900', color: '#FE2C55' }}>
                            ${promo.effectivePrice.toFixed(2)}
                          </Text>
                          <Text
                            style={[styles.productOriginalPrice, { color: palette.textMuted }]}
                          >
                            ${promo.originalPrice.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              }}
              ListFooterComponent={
                <View style={{ alignItems: 'center', paddingTop: 12 }}>
                  <Button
                    mode="outlined"
                    textColor="#FE2C55"
                    style={{ borderColor: '#FE2C55', borderRadius: 20 }}
                    onPress={() => setFlashDealsModalVisible(false)}
                  >
                    Close
                  </Button>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* ==================== SEPARATE BONUS CENTER MODAL ==================== */}
      <BonusCenterModal
        visible={bonusModalVisible}
        onClose={() => setBonusModalVisible(false)}
        userId={user?.id}
        products={connectedProducts}
        flashSchedules={flashSchedules}
        nowMs={nowMs}
        onSelectProduct={(productId) => router.push(`/(app)/(tabs)/product/${productId}` as any)}
        onBonusUpdated={(newBalance) => setBonusBalance(newBalance)}
      />

      {/* ==================== SEPARATE COUPONS / YOUR REWARDS MODAL ==================== */}
      <CouponsRewardsModal
        visible={couponsModalVisible}
        onClose={() => setCouponsModalVisible(false)}
        userId={user?.id}
        cartBadgeCount={cartBadgeCount}
        bonusBalance={bonusBalance}
        connectedProducts={connectedProducts}
        flashSchedules={flashSchedules}
        nowMs={nowMs}
        onOpenCart={() => router.push('/(app)/(tabs)/cart' as any)}
        onOpenFlashDeals={() => setFlashDealsModalVisible(true)}
        onOpenBonusCenter={() => setBonusModalVisible(true)}
        onSelectProduct={(productId) => router.push(`/(app)/(tabs)/product/${productId}` as any)}
        onTotalCouponsChange={(count) => setTotalCouponsCount(count)}
        onBonusAdded={(newBalance) => setBonusBalance(newBalance)}
      />
    </View>
  );
}