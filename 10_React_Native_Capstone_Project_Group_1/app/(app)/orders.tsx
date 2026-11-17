/**
 * Orders Page - TikTok Shop-Inspired Shopping History
 * 
 * Student Implementation Guide:
 * Complete the customer order history experience:
 * 1. User-isolated order retrieval (only currently logged-in customer's orders)
 * 2. TikTok Shop header (< Back, My Orders, Search your orders)
 * 3. Horizontally scrollable text status tabs with smooth sliding underline:
 *    All | To Pay | To Ship | To Receive | To Review | Returns
 * 4. Add to Cart & Buy Again with original variation & live stock verification
 * 5. Interactive 1-5 Star Product Reviews with Photo/Video attachment & Return/Refund tracking
 * 6. Empty states with Start Shopping CTA + You Might Also Like infinite-scrolling grid
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Animated,
  Platform,
  RefreshControl,
  useWindowDimensions,
  LayoutChangeEvent,
  StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  Button,
  IconButton,
  TextInput,
  Divider,
} from 'react-native-paper';
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

export type OrderStatusTab =
  | 'All'
  | 'To Pay'
  | 'To Ship'
  | 'To Receive'
  | 'To Review'
  | 'Returns';

export type OrderLifecycleStatus =
  | 'To Pay'
  | 'To Ship'
  | 'To Receive'
  | 'Order Completed'
  | 'Return Requested'
  | 'Refund Processing'
  | 'Refunded';

export interface OrderLineItem {
  productId: number;
  title: string;
  thumbnail: string;
  price: number;
  discountPercentage?: number;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  selectedModel?: string;
  variationLabel?: string;
}

export interface ProductReviewRecord {
  rating: number;
  comment: string;
  mediaUris: string[];
  updatedAt: string;
}

export interface ReturnInfoRecord {
  reason: string;
  requestDate: string;
  refundStatus: string;
  nextSteps: string;
}

export interface MarketplaceOrder {
  id: string;
  userId: string | number;
  status: OrderLifecycleStatus;
  createdAt: string;
  shippingAddress: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  shippingFee: number;
  discountAmount?: number;
  totalAmount: number;
  currency?: string;
  items: OrderLineItem[];
  reviews?: Record<number, ProductReviewRecord>;
  returnInfo?: ReturnInfoRecord;
}

const STATUS_TABS: OrderStatusTab[] = [
  'All',
  'To Pay',
  'To Ship',
  'To Receive',
  'To Review',
  'Returns',
];

const PAGE_SIZE = 12;
const USD_TO_PHP = 56;

const formatPeso = (amountPhp: number): string =>
  `₱${amountPhp.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const showMessage = (title: string, message: string) => {
  const webWin = (globalThis as any)?.window;
  if (Platform.OS === 'web' && webWin?.alert) {
    webWin.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function OrdersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const { palette } = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive Breakpoints: Website (>= 1024), Tablet (768-1023), Phones (< 768: Realme, Samsung, Xiaomi, OPPO, Vivo, iPhone)
  const isUltraWideDesktop = width >= 1600;
  const isLargeDesktop = width >= 1280 && width < 1600;
  const isDesktop = width >= 1024 && width < 1280;
  const isAnyDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isSmallPhone = width <= 375;

  const numColumns = isUltraWideDesktop
    ? 6
    : isLargeDesktop
      ? 5
      : isDesktop
        ? 4
        : isTablet
          ? 3
          : 2;

  const horizontalPadding = isAnyDesktop ? 24 : isTablet ? 14 : isSmallPhone ? 6 : 10;
  const topSafePadding = Platform.OS === 'web' ? 12 : Math.max(insets.top, 10);
  const bottomSafePadding = Platform.OS === 'web' ? 32 : Math.max(insets.bottom + 24, 36);

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
          boxShadow: '0 8px 20px rgba(254, 44, 85, 0.30)',
        }
      : {};

  const cardShadowStyle: any =
    Platform.OS === 'web'
      ? { boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)' }
      : {
          elevation: 2,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
        };

  // Per-user storage keys isolated by logged-in customer ID
  const userPrefix = `@marketplace_user_${user?.id || 'guest'}`;
  const userOrdersKey = `${userPrefix}_orders`;
  const userCartKey = `${userPrefix}_cart`;

  // Orders & Tab Filter States
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [selectedTab, setSelectedTab] = useState<OrderStatusTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Smooth Sliding Underline Animation Refs
  const tabScrollRef = useRef<ScrollView | null>(null);
  const tabLayoutsRef = useRef<Record<string, { x: number; width: number }>>({});
  const indicatorLeft = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(40)).current;
  const [tabsContainerWidth, setTabsContainerWidth] = useState(width);

  // Variation Re-Selection Modal
  const [variationModalVisible, setVariationModalVisible] = useState(false);
  const [pendingActionMode, setPendingActionMode] = useState<'cart' | 'buyAgain'>('cart');
  const [pendingProductDetail, setPendingProductDetail] = useState<any>(null);
  const [pendingOriginalItem, setPendingOriginalItem] = useState<OrderLineItem | null>(null);
  const [chosenVariation, setChosenVariation] = useState<string>('');
  const [processingActionId, setProcessingActionId] = useState<string | null>(null);

  // Product Review Modal
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [reviewItem, setReviewItem] = useState<OrderLineItem | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewMediaUrl, setReviewMediaUrl] = useState<string>('');
  const [reviewMediaList, setReviewMediaList] = useState<string[]>([]);
  const [savingReview, setSavingReview] = useState(false);

  // Return / Refund Request Modal
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('Item damaged or defective');

  // "You Might Also Like" Infinite Scroll States
  const [recommendedProducts, setRecommendedProducts] = useState<MarketplaceProduct[]>([]);
  const [recSkip, setRecSkip] = useState(0);
  const [hasMoreRec, setHasMoreRec] = useState(true);
  const [isFetchingMoreRec, setIsFetchingMoreRec] = useState(false);
  const [flashSchedules, setFlashSchedules] = useState<Record<number, FlashSaleSchedule>>({});
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.replace('/(auth)/login' as any);
    }
  }, [isLoadingAuth, isAuthenticated]);

  useEffect(() => {
    if (params?.tab && STATUS_TABS.includes(params.tab as OrderStatusTab)) {
      setSelectedTab(params.tab as OrderStatusTab);
    }
  }, [params?.tab]);

  const animateUnderlineToTab = useCallback(
    (tab: OrderStatusTab) => {
      const layout = tabLayoutsRef.current[tab];
      if (!layout) return;

      Animated.parallel([
        Animated.spring(indicatorLeft, {
          toValue: layout.x,
          useNativeDriver: false,
          friction: 9,
          tension: 90,
        }),
        Animated.spring(indicatorWidth, {
          toValue: layout.width,
          useNativeDriver: false,
          friction: 9,
          tension: 90,
        }),
      ]).start();

      if (tabScrollRef.current && tabsContainerWidth > 0) {
        const targetScrollX = Math.max(
          0,
          layout.x + layout.width / 2 - tabsContainerWidth / 2
        );
        tabScrollRef.current.scrollTo({ x: targetScrollX, animated: true });
      }
    },
    [indicatorLeft, indicatorWidth, tabsContainerWidth]
  );

  useEffect(() => {
    animateUnderlineToTab(selectedTab);
  }, [selectedTab, animateUnderlineToTab]);

  const handleTabLayout = (tab: OrderStatusTab, e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    tabLayoutsRef.current[tab] = { x, width: w };
    if (tab === selectedTab) {
      indicatorLeft.setValue(x);
      indicatorWidth.setValue(w);
    }
  };

  // Load ONLY the currently logged-in customer's persisted orders
  const loadCustomerOrders = useCallback(async () => {
    if (!user?.id) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    try {
      setLoadingOrders(true);
      const raw = await AsyncStorage.getItem(userOrdersKey);
      if (!raw) {
        setOrders([]);
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setOrders([]);
        return;
      }

      const seenIds = new Set<string>();
      const validUserOrders: MarketplaceOrder[] = [];
      for (const ord of parsed) {
        if (!ord || !ord.id) continue;
        if (String(ord.userId) !== String(user.id)) continue;
        if (seenIds.has(String(ord.id))) continue;
        seenIds.add(String(ord.id));
        validUserOrders.push(ord);
      }

      validUserOrders.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(validUserOrders);
    } catch (err) {
      console.error('Failed to load customer orders:', err);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
      setRefreshing(false);
    }
  }, [user?.id, userOrdersKey]);

  const persistCustomerOrders = async (updatedOrders: MarketplaceOrder[]) => {
    if (!user?.id) return;
    setOrders(updatedOrders);
    await AsyncStorage.setItem(userOrdersKey, JSON.stringify(updatedOrders));
  };

  const loadInitialRecommended = useCallback(async () => {
    try {
      const [res, schedules] = await Promise.all([
        fetch(`https://dummyjson.com/products?limit=${PAGE_SIZE}&skip=0`),
        getFlashSaleSchedules(),
      ]);
      setFlashSchedules(schedules);
      if (res.ok) {
        const data = await res.json();
        const items: MarketplaceProduct[] = data.products || [];
        setRecommendedProducts(items);
        setRecSkip(PAGE_SIZE);
        setHasMoreRec(items.length < (data.total || 0));
      }
    } catch (err) {
      console.error('Failed to fetch recommended products:', err);
    }
  }, []);

  const fetchMoreRecommended = async () => {
    if (isFetchingMoreRec || !hasMoreRec) return;
    try {
      setIsFetchingMoreRec(true);
      const res = await fetch(`https://dummyjson.com/products?limit=${PAGE_SIZE}&skip=${recSkip}`);
      if (!res.ok) throw new Error('Failed to load more');
      const data = await res.json();
      const incoming: MarketplaceProduct[] = data.products || [];
      const totalCount: number = data.total || 0;

      if (incoming.length === 0) {
        setHasMoreRec(false);
      } else {
        setRecommendedProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const unique = incoming.filter((p) => !existingIds.has(p.id));
          return [...prev, ...unique];
        });
        setRecSkip((prev) => prev + PAGE_SIZE);
        setHasMoreRec(recSkip + incoming.length < totalCount);
      }
    } catch (err) {
      console.error('Error loading more recommended products:', err);
    } finally {
      setIsFetchingMoreRec(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCustomerOrders();
    }, [loadCustomerOrders])
  );

  useEffect(() => {
    loadInitialRecommended();
  }, [loadInitialRecommended]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadCustomerOrders(), loadInitialRecommended()]);
  };

  // Tab Counts for Quick Overview
  const tabCounts = useMemo(() => {
    const counts: Record<OrderStatusTab, number> = {
      All: orders.length,
      'To Pay': 0,
      'To Ship': 0,
      'To Receive': 0,
      'To Review': 0,
      Returns: 0,
    };
    orders.forEach((o) => {
      if (o.status === 'To Pay') counts['To Pay'] += 1;
      else if (o.status === 'To Ship') counts['To Ship'] += 1;
      else if (o.status === 'To Receive') counts['To Receive'] += 1;
      else if (o.status === 'Order Completed') counts['To Review'] += 1;
      else if (
        o.status === 'Return Requested' ||
        o.status === 'Refund Processing' ||
        o.status === 'Refunded'
      ) {
        counts.Returns += 1;
      }
    });
    return counts;
  }, [orders]);

  // ==================== FILTER ORDERS BY SELECTED TAB & SEARCH QUERY ====================
  const filteredOrders = orders.filter((order) => {
    const matchesTab = (() => {
      switch (selectedTab) {
        case 'All':
          return true;
        case 'To Pay':
          return order.status === 'To Pay';
        case 'To Ship':
          return order.status === 'To Ship';
        case 'To Receive':
          return order.status === 'To Receive';
        case 'To Review':
          return order.status === 'Order Completed';
        case 'Returns':
          return (
            order.status === 'Return Requested' ||
            order.status === 'Refund Processing' ||
            order.status === 'Refunded'
          );
        default:
          return true;
      }
    })();

    if (!matchesTab) return false;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    const matchesId = order.id.toLowerCase().includes(q);
    const matchesStatus = order.status.toLowerCase().includes(q);
    const matchesProduct = order.items.some(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        (it.selectedColor || '').toLowerCase().includes(q) ||
        (it.selectedSize || '').toLowerCase().includes(q) ||
        (it.variationLabel || '').toLowerCase().includes(q)
    );
    return matchesId || matchesStatus || matchesProduct;
  });

  // ==================== ORDER LIFECYCLE ACTIONS ====================
  const handlePayNow = async (orderId: string) => {
    const updated = orders.map((ord) =>
      ord.id === orderId ? { ...ord, status: 'To Ship' as OrderLifecycleStatus } : ord
    );
    await persistCustomerOrders(updated);
    showMessage('Payment Confirmed', `Order #${orderId} has been paid and moved to To Ship.`);
  };

  const handleConfirmOrderReceived = async (orderId: string) => {
    const updated = orders.map((ord) =>
      ord.id === orderId ? { ...ord, status: 'Order Completed' as OrderLifecycleStatus } : ord
    );
    await persistCustomerOrders(updated);
    showMessage(
      'Order Completed',
      `Thank you! Order #${orderId} is now completed and ready for review.`
    );
  };

  const openReturnRequestModal = (orderId: string) => {
    setReturnOrderId(orderId);
    setReturnReason('Item damaged or defective');
    setReturnModalVisible(true);
  };

  const handleSubmitReturnRequest = async () => {
    if (!returnOrderId) return;
    const updated = orders.map((ord) =>
      ord.id === returnOrderId
        ? {
            ...ord,
            status: 'Return Requested' as OrderLifecycleStatus,
            returnInfo: {
              reason: returnReason.trim() || 'Customer requested return',
              requestDate: new Date().toLocaleDateString(),
              refundStatus: 'Pending Seller Approval',
              nextSteps:
                'Pack the item in its original packaging. Drop-off instructions will be issued within 24 hours.',
            },
          }
        : ord
    );
    await persistCustomerOrders(updated);
    setReturnModalVisible(false);
    setSelectedTab('Returns');
    showMessage('Return Requested', `Return/refund request submitted for Order #${returnOrderId}.`);
  };

  // ==================== ADD TO CART & BUY AGAIN (WITH VARIATION & STOCK CHECK) ====================
  const commitProductToCart = async (
    product: any,
    lineItem: OrderLineItem,
    overrideVariation?: string,
    goDirectToCheckout = false
  ) => {
    const selectedColor = overrideVariation || lineItem.selectedColor;
    const selectedSize = lineItem.selectedSize;
    const variationKey = `${product.id}_${selectedColor || 'default'}_${selectedSize || 'default'}`;

    const rawCart =
      (await AsyncStorage.getItem(userCartKey)) ||
      (await AsyncStorage.getItem('@marketplace_cart'));
    const cartItems: any[] = rawCart ? JSON.parse(rawCart) : [];

    const existingIdx = cartItems.findIndex(
      (c) => (c.variationKey || `${c.productId}`) === variationKey
    );

    if (existingIdx > -1) {
      cartItems[existingIdx].quantity = Math.min(
        product.stock || 99,
        (cartItems[existingIdx].quantity || 1) + (lineItem.quantity || 1)
      );
    } else {
      cartItems.unshift({
        id: Date.now(),
        variationKey,
        productId: product.id,
        title: product.title,
        thumbnail: product.thumbnail,
        price: product.price,
        discountPercentage: product.discountPercentage || 0,
        quantity: Math.min(product.stock || 99, lineItem.quantity || 1),
        stock: product.stock || 99,
        selectedColor,
        selectedSize,
      });
    }

    await AsyncStorage.setItem(userCartKey, JSON.stringify(cartItems));
    await AsyncStorage.setItem('@marketplace_cart', JSON.stringify(cartItems));

    if (goDirectToCheckout) {
      router.push('/(app)/(tabs)/cart' as any);
    } else {
      showMessage('Added to Cart', `${product.title} has been added to your shopping cart.`);
    }
  };

  const handleOrderItemAction = async (
    order: MarketplaceOrder,
    lineItem: OrderLineItem,
    mode: 'cart' | 'buyAgain'
  ) => {
    const actionKey = `${order.id}-${lineItem.productId}-${mode}`;
    setProcessingActionId(actionKey);

    try {
      const res = await fetch(`https://dummyjson.com/products/${lineItem.productId}`);
      if (!res.ok) {
        showMessage('Product Unavailable', 'This product is no longer available in the catalog.');
        return;
      }
      const product = await res.json();

      const availableOptions: string[] =
        Array.isArray(product.tags) && product.tags.length > 0
          ? product.tags.map((t: string) => t.charAt(0).toUpperCase() + t.slice(1))
          : ['Standard Edition'];

      const originalVar =
        lineItem.selectedColor || lineItem.selectedSize || lineItem.variationLabel || '';

      const isOutOfStock = !product.stock || product.stock <= 0;
      const isOriginalVariationMissing =
        Boolean(originalVar) &&
        originalVar.toLowerCase() !== 'standard' &&
        originalVar.toLowerCase() !== 'standard edition' &&
        !availableOptions.some((opt) => opt.toLowerCase() === originalVar.toLowerCase());

      if (isOutOfStock || isOriginalVariationMissing) {
        setPendingActionMode(mode);
        setPendingProductDetail({ ...product, availableOptions });
        setPendingOriginalItem(lineItem);
        setChosenVariation(availableOptions[0] || 'Standard Edition');
        setVariationModalVisible(true);
        return;
      }

      await commitProductToCart(product, lineItem, originalVar || undefined, mode === 'buyAgain');
    } catch {
      showMessage('Network Error', 'Unable to verify product stock right now. Please try again.');
    } finally {
      setProcessingActionId(null);
    }
  };

  // ==================== REVIEW MODAL HANDLERS ====================
  const openReviewModal = (order: MarketplaceOrder, item: OrderLineItem) => {
    const existing = order.reviews?.[item.productId];
    setReviewOrderId(order.id);
    setReviewItem(item);
    setReviewRating(existing?.rating || 5);
    setReviewComment(existing?.comment || '');
    setReviewMediaUrl('');
    setReviewMediaList(existing?.mediaUris || []);
    setReviewModalVisible(true);
  };

  const handleAddMediaAttachment = () => {
    const trimmed = reviewMediaUrl.trim();
    if (!trimmed) {
      if (reviewItem?.thumbnail && !reviewMediaList.includes(reviewItem.thumbnail)) {
        setReviewMediaList((prev) => [...prev, reviewItem.thumbnail]);
      }
      return;
    }
    setReviewMediaList((prev) => [...prev, trimmed]);
    setReviewMediaUrl('');
  };

  const handleSubmitReview = async () => {
    if (!reviewOrderId || !reviewItem) return;
    if (!reviewComment.trim()) {
      showMessage('Review Required', 'Please write a short comment about the product.');
      return;
    }

    setSavingReview(true);
    try {
      const updated = orders.map((ord) => {
        if (ord.id !== reviewOrderId) return ord;
        return {
          ...ord,
          reviews: {
            ...(ord.reviews || {}),
            [reviewItem.productId]: {
              rating: reviewRating,
              comment: reviewComment.trim(),
              mediaUris: reviewMediaList,
              updatedAt: new Date().toLocaleDateString(),
            },
          },
        };
      });
      await persistCustomerOrders(updated);
      setReviewModalVisible(false);
      showMessage('Review Submitted', 'Thank you! Your product review has been saved.');
    } finally {
      setSavingReview(false);
    }
  };

  // ==================== STATUS BADGE STYLING ====================
  const getStatusDisplay = (status: OrderLifecycleStatus) => {
    switch (status) {
      case 'To Pay':
        return {
          label: 'To Pay',
          icon: 'wallet-outline',
          color: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.15)',
        };
      case 'To Ship':
        return {
          label: 'To Ship',
          icon: 'package-variant-closed',
          color: '#0284C7',
          bg: 'rgba(2, 132, 199, 0.15)',
        };
      case 'To Receive':
        return {
          label: 'To Receive',
          icon: 'truck-fast-outline',
          color: palette.accent,
          bg: palette.accentSoft,
        };
      case 'Order Completed':
        return {
          label: 'Order Completed',
          icon: 'check-decagram-outline',
          color: palette.success,
          bg: 'rgba(16, 185, 129, 0.15)',
        };
      case 'Return Requested':
      case 'Refund Processing':
      case 'Refunded':
        return {
          label: status,
          icon: 'undo-variant',
          color: '#FE2C55',
          bg: 'rgba(254, 44, 85, 0.15)',
        };
      default:
        return {
          label: status,
          icon: 'shopping-outline',
          color: palette.textSecondary,
          bg: palette.glassInput,
        };
    }
  };

  // Ambient Decorative Orbs
  const renderAmbientOrbs = () => (
    <View pointerEvents="none" style={localStyles.ambientLayer}>
      <View
        style={[
          localStyles.orbTopLeft,
          {
            backgroundColor: palette.isDark
              ? 'rgba(254, 44, 85, 0.16)'
              : 'rgba(254, 44, 85, 0.11)',
          },
        ]}
      />
      <View
        style={[
          localStyles.orbTopRight,
          {
            backgroundColor: palette.isDark
              ? 'rgba(59, 130, 246, 0.16)'
              : 'rgba(56, 189, 248, 0.15)',
          },
        ]}
      />
      <View
        style={[
          localStyles.orbCenter,
          {
            backgroundColor: palette.isDark
              ? 'rgba(139, 92, 246, 0.12)'
              : 'rgba(168, 85, 247, 0.09)',
          },
        ]}
      />
      <View
        style={[
          localStyles.orbBottomRight,
          {
            backgroundColor: palette.isDark
              ? 'rgba(16, 185, 129, 0.12)'
              : 'rgba(99, 102, 241, 0.10)',
          },
        ]}
      />
    </View>
  );

  // ==================== RENDER SINGLE ORDER CARD ====================
  const renderOrderCard = (order: MarketplaceOrder, isSingleFullWidth = false) => {
    const statusStyle = getStatusDisplay(order.status);
    const primaryItem = order.items[0];
    const isCompleted = order.status === 'Order Completed';
    const isPhpOrder = order.currency === 'PHP' || order.totalAmount > 500;

    return (
      <Card
        key={order.id}
        style={[
          {
            width: isAnyDesktop && !isSingleFullWidth ? '49.3%' : '100%',
            marginBottom: 12,
            borderRadius: 18,
            backgroundColor: palette.glassSurface,
            borderWidth: 1,
            borderColor: palette.border,
            padding: isSmallPhone ? 12 : 16,
          },
          cardShadowStyle,
          webGlassStyle,
        ]}
        elevation={0}
      >
        {/* Top Order Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: 'rgba(254, 44, 85, 0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="storefront-outline" size={18} color="#FE2C55" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{ fontSize: 13, fontWeight: '800', color: palette.textPrimary }}
              >
                Order #{order.id}
              </Text>
              <Text style={{ fontSize: 11, color: palette.textMuted, marginTop: 1 }}>
                {new Date(order.createdAt).toLocaleDateString()} ·{' '}
                {new Date(order.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: statusStyle.bg,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 999,
            }}
          >
            <MaterialCommunityIcons
              name={statusStyle.icon as any}
              size={13}
              color={statusStyle.color}
            />
            <Text style={{ fontSize: 11.5, fontWeight: '800', color: statusStyle.color }}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        <Divider style={{ backgroundColor: palette.border, marginBottom: 12 }} />

        {/* Line Items */}
        {order.items.map((item, idx) => {
          const rawUnit = item.price * (1 - (item.discountPercentage || 0) / 100);
          const unitPricePhp = isPhpOrder ? rawUnit : rawUnit * USD_TO_PHP;
          const variationText =
            item.variationLabel ||
            [item.selectedColor, item.selectedSize, item.selectedModel]
              .filter(Boolean)
              .join(' · ') ||
            'Standard';
          const existingReview = order.reviews?.[item.productId];

          return (
            <View key={`${order.id}-item-${item.productId}-${idx}`} style={{ marginBottom: 12 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push(`/(app)/(tabs)/product/${item.productId}` as any)}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Image
                  source={{ uri: item.thumbnail }}
                  style={{
                    width: isAnyDesktop ? 78 : 68,
                    height: isAnyDesktop ? 78 : 68,
                    borderRadius: 12,
                    backgroundColor: palette.isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                    marginRight: 11,
                  }}
                  resizeMode="contain"
                />

                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={2}
                    style={{
                      fontSize: 13.5,
                      fontWeight: '800',
                      color: palette.textPrimary,
                      lineHeight: 18,
                    }}
                  >
                    {item.title}
                  </Text>

                  <View
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: palette.glassInput,
                      paddingHorizontal: 8,
                      paddingVertical: 2.5,
                      borderRadius: 7,
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: palette.textSecondary }}>
                      Variation: {variationText}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 6,
                    }}
                  >
                    <Text style={{ fontSize: 14.5, fontWeight: '900', color: palette.textPrimary }}>
                      {formatPeso(unitPricePhp)}
                    </Text>
                    <Text style={{ fontSize: 12.5, fontWeight: '800', color: palette.textSecondary }}>
                      x{item.quantity}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {existingReview && (
                <View
                  style={{
                    marginTop: 8,
                    padding: 9,
                    borderRadius: 10,
                    backgroundColor: palette.glassInput,
                    borderWidth: 1,
                    borderColor: palette.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <MaterialCommunityIcons
                        key={star}
                        name={star <= existingReview.rating ? 'star' : 'star-outline'}
                        size={14}
                        color="#F59E0B"
                      />
                    ))}
                    <Text style={{ fontSize: 10.5, color: palette.textMuted, marginLeft: 4 }}>
                      Reviewed on {existingReview.updatedAt}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: palette.textPrimary, marginTop: 3 }}>
                    {existingReview.comment}
                  </Text>
                </View>
              )}

              {(isCompleted || selectedTab === 'To Review') && (
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 7 }}>
                  <Button
                    mode="outlined"
                    compact
                    icon="star-outline"
                    textColor="#F59E0B"
                    style={{ borderColor: '#F59E0B', borderRadius: 999 }}
                    labelStyle={{ fontSize: 11.5, fontWeight: '800' }}
                    onPress={() => openReviewModal(order, item)}
                  >
                    {existingReview ? 'Edit Review' : 'Rate & Review'}
                  </Button>
                </View>
              )}
            </View>
          );
        })}

        {/* Shipping Box */}
        <View
          style={{
            backgroundColor: palette.glassInput,
            borderRadius: 12,
            padding: 10,
            marginBottom: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons
              name="truck-delivery-outline"
              size={16}
              color={palette.accent}
            />
            <Text
              numberOfLines={1}
              style={{ fontSize: 12, color: palette.textSecondary, flex: 1, fontWeight: '600' }}
            >
              Deliver to: {order.shippingAddress}
            </Text>
          </View>
          {order.trackingNumber && (
            <Text style={{ fontSize: 11, color: palette.textMuted, marginTop: 3 }}>
              {order.shippingCarrier || 'Standard Express'} · Tracking: {order.trackingNumber}
            </Text>
          )}
        </View>

        {/* Return Info Banner */}
        {order.returnInfo && (
          <View
            style={{
              backgroundColor: 'rgba(254, 44, 85, 0.08)',
              borderColor: 'rgba(254, 44, 85, 0.35)',
              borderWidth: 1,
              borderRadius: 12,
              padding: 10,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#FE2C55' }}>
              Refund Status: {order.returnInfo.refundStatus}
            </Text>
            <Text style={{ fontSize: 11.5, color: palette.textPrimary, marginTop: 2 }}>
              Reason: {order.returnInfo.reason} (Requested: {order.returnInfo.requestDate})
            </Text>
            <Text style={{ fontSize: 11, color: palette.textSecondary, marginTop: 3 }}>
              Next Steps: {order.returnInfo.nextSteps}
            </Text>
          </View>
        )}

        {/* Total Price */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'baseline',
            gap: 6,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 12.5, color: palette.textSecondary, fontWeight: '600' }}>
            Total ({order.items.reduce((acc, i) => acc + i.quantity, 0)} item(s)):
          </Text>
          <Text style={{ fontSize: 17, fontWeight: '900', color: '#FE2C55' }}>
            {formatPeso(isPhpOrder ? order.totalAmount : order.totalAmount * USD_TO_PHP)}
          </Text>
        </View>

        {/* Action Buttons */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {order.status === 'To Pay' && (
            <Button
              mode="contained"
              compact
              buttonColor="#FE2C55"
              textColor="#FFFFFF"
              style={[{ borderRadius: 999, paddingHorizontal: 10 }, webPrimaryButtonGradient]}
              labelStyle={{ fontSize: 12, fontWeight: '800' }}
              onPress={() => handlePayNow(order.id)}
            >
              Pay Now
            </Button>
          )}

          {order.status === 'To Receive' && (
            <>
              <Button
                mode="outlined"
                compact
                textColor={palette.textSecondary}
                style={{ borderRadius: 999, borderColor: palette.border }}
                labelStyle={{ fontSize: 11.5, fontWeight: '700' }}
                onPress={() => openReturnRequestModal(order.id)}
              >
                Request Return
              </Button>
              <Button
                mode="contained"
                compact
                buttonColor="#FE2C55"
                textColor="#FFFFFF"
                style={[{ borderRadius: 999, paddingHorizontal: 8 }, webPrimaryButtonGradient]}
                labelStyle={{ fontSize: 12, fontWeight: '800' }}
                onPress={() => handleConfirmOrderReceived(order.id)}
              >
                Order Received
              </Button>
            </>
          )}

          {isCompleted && primaryItem && (
            <>
              <Button
                mode="outlined"
                compact
                textColor={palette.textSecondary}
                style={{ borderRadius: 999, borderColor: palette.border }}
                labelStyle={{ fontSize: 11.5, fontWeight: '700' }}
                onPress={() => openReturnRequestModal(order.id)}
              >
                Return/Refund
              </Button>

              <Button
                mode="outlined"
                compact
                icon="cart-plus"
                textColor={palette.textPrimary}
                loading={processingActionId === `${order.id}-${primaryItem.productId}-cart`}
                style={{ borderRadius: 999, borderColor: palette.borderStrong }}
                labelStyle={{ fontSize: 12, fontWeight: '700' }}
                onPress={() => handleOrderItemAction(order, primaryItem, 'cart')}
              >
                Add to Cart
              </Button>

              <Button
                mode="contained"
                compact
                buttonColor="#FE2C55"
                textColor="#FFFFFF"
                loading={processingActionId === `${order.id}-${primaryItem.productId}-buyAgain`}
                style={[{ borderRadius: 999, paddingHorizontal: 8 }, webPrimaryButtonGradient]}
                labelStyle={{ fontSize: 12, fontWeight: '800' }}
                onPress={() => handleOrderItemAction(order, primaryItem, 'buyAgain')}
              >
                Buy Again
              </Button>
            </>
          )}
        </View>
      </Card>
    );
  };

  // ==================== "YOU MIGHT ALSO LIKE" PRODUCT CARD ====================
  const renderRecommendedProduct = ({ item }: { item: MarketplaceProduct }) => {
    const promo = evaluateProductPromotions(item, flashSchedules, nowMs);

    return (
      <TouchableOpacity
        style={{
          flex: 1 / numColumns,
          margin: isAnyDesktop ? 5 : isSmallPhone ? 3.5 : 4.5,
        }}
        onPress={() => router.push(`/(app)/(tabs)/product/${item.id}` as any)}
        activeOpacity={0.88}
      >
        <Card
          style={[
            {
              borderRadius: 16,
              backgroundColor: palette.glassSurface,
              borderWidth: 1,
              borderColor: palette.border,
              overflow: 'hidden',
            },
            cardShadowStyle,
            webGlassStyle,
          ]}
          elevation={0}
        >
          <View
            style={{
              height: isAnyDesktop ? 175 : isTablet ? 160 : 152,
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: palette.isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
              position: 'relative',
              padding: 8,
            }}
          >
            <Image
              source={{ uri: item.thumbnail }}
              style={{ width: '100%', height: '100%' }}
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
                  borderRadius: 7,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <MaterialCommunityIcons name="lightning-bolt" size={11} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>
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
                  paddingVertical: 2.5,
                  borderRadius: 7,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>
                  {promo.effectiveDiscountPercentage}% OFF
                </Text>
              </View>
            ) : null}
          </View>

          <View style={{ padding: isSmallPhone ? 9 : 11, gap: 4 }}>
            <Text
              numberOfLines={2}
              style={{
                fontSize: isSmallPhone ? 12 : 13,
                fontWeight: '700',
                lineHeight: 17,
                minHeight: 34,
                color: palette.textPrimary,
              }}
            >
              {item.title}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 2 }}>
              <Text style={{ fontSize: isSmallPhone ? 15 : 16, fontWeight: '900', color: '#FE2C55' }}>
                {formatPeso(promo.effectivePrice * USD_TO_PHP)}
              </Text>
              {promo.hasDiscount && (
                <>
                  <Text
                    style={{
                      fontSize: 11,
                      color: palette.textMuted,
                      textDecorationLine: 'line-through',
                    }}
                  >
                    {formatPeso(promo.originalPrice * USD_TO_PHP)}
                  </Text>
                  <View
                    style={{
                      backgroundColor: 'rgba(254, 44, 85, 0.13)',
                      paddingHorizontal: 5,
                      paddingVertical: 1,
                      borderRadius: 4,
                    }}
                  >
                    <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#FE2C55' }}>
                      -{promo.effectiveDiscountPercentage}%
                    </Text>
                  </View>
                </>
              )}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 }}>
              {promo.isFlashSale && (
                <View
                  style={{
                    backgroundColor: 'rgba(254, 44, 85, 0.14)',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 5,
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
                    backgroundColor: 'rgba(16, 185, 129, 0.14)',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 5,
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
                    borderRadius: 5,
                  }}
                >
                  <Text style={{ fontSize: 9.5, fontWeight: '800', color: palette.accent }}>
                    COD
                  </Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: isSmallPhone ? 10.5 : 11,
                  color: palette.textSecondary,
                  fontWeight: '600',
                  flex: 1,
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

  return (
    <View
      style={[
        {
          flex: 1,
          width: '100%',
          backgroundColor: palette.isDark ? palette.background : '#F1F5FB',
          position: 'relative',
          overflow: 'hidden',
        },
        webAmbientBackdropStyle,
      ]}
    >
      {renderAmbientOrbs()}

      {/* ==================== FULL-WIDTH TOP HEADER (< BACK | MY ORDERS | SEARCH YOUR ORDERS) ==================== */}
      <View
        style={[
          {
            width: '100%',
            backgroundColor: palette.glassNav,
            borderBottomWidth: 1,
            borderBottomColor: palette.border,
            paddingTop: topSafePadding,
            paddingBottom: 0,
            paddingHorizontal: horizontalPadding,
            zIndex: 20,
          },
          cardShadowStyle,
          webGlassStyle,
        ]}
      >
        <View style={{ width: '100%' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.push('/(app)/(tabs)/home' as any);
                }
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 4,
                paddingRight: 8,
                minWidth: 68,
              }}
            >
              <MaterialCommunityIcons name="chevron-left" size={28} color={palette.textPrimary} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: palette.textPrimary }}>
                Back
              </Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: isSmallPhone ? 17 : 19,
                  fontWeight: '900',
                  color: palette.textPrimary,
                  textAlign: 'center',
                  letterSpacing: -0.2,
                }}
              >
                My Orders ({orders.length})
              </Text>
            </View>

            <View style={{ minWidth: 68 }} />
          </View>

          <View style={{ marginBottom: 6, width: '100%' }}>
            <TextInput
              mode="outlined"
              dense
              placeholder="Search your orders by ID, product, or variation..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              textColor={palette.textPrimary}
              placeholderTextColor={palette.textMuted}
              outlineColor={palette.border}
              activeOutlineColor="#FE2C55"
              outlineStyle={{ borderRadius: 14 }}
              style={{
                backgroundColor: palette.glassInput,
                height: 40,
                fontSize: 13,
                width: '100%',
              }}
              left={<TextInput.Icon icon="magnify" color={palette.textMuted} />}
              right={
                searchQuery ? (
                  <TextInput.Icon
                    icon="close-circle"
                    color={palette.textMuted}
                    onPress={() => setSearchQuery('')}
                  />
                ) : undefined
              }
            />
          </View>

          <View
            onLayout={(e) => setTabsContainerWidth(e.nativeEvent.layout.width)}
            style={{ width: '100%' }}
          >
            <ScrollView
              ref={tabScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 2,
                position: 'relative',
              }}
            >
              {STATUS_TABS.map((tab) => {
                const isSelected = selectedTab === tab;
                const count = tabCounts[tab];
                return (
                  <TouchableOpacity
                    key={tab}
                    onLayout={(e) => handleTabLayout(tab, e)}
                    onPress={() => setSelectedTab(tab)}
                    activeOpacity={0.75}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      paddingHorizontal: isAnyDesktop ? 22 : isSmallPhone ? 12 : 16,
                      paddingVertical: 11,
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: isSmallPhone ? 13 : 14,
                        fontWeight: isSelected ? '800' : '600',
                        color: isSelected ? '#FE2C55' : palette.textSecondary,
                      }}
                    >
                      {tab}
                    </Text>
                    {count > 0 && (
                      <View
                        style={{
                          paddingHorizontal: 6,
                          paddingVertical: 1,
                          borderRadius: 999,
                          backgroundColor: isSelected
                            ? 'rgba(254, 44, 85, 0.14)'
                            : palette.glassInput,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10.5,
                            fontWeight: '800',
                            color: isSelected ? '#FE2C55' : palette.textMuted,
                          }}
                        >
                          {count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              <Animated.View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: indicatorLeft,
                  width: indicatorWidth,
                  height: 3,
                  borderRadius: 999,
                  backgroundColor: '#FE2C55',
                }}
              />
            </ScrollView>
          </View>
        </View>
      </View>

      {/* ==================== FULL-WIDTH SCROLLABLE ORDERS LIST + YOU MIGHT ALSO LIKE ==================== */}
      <FlatList
        style={{ width: '100%', zIndex: 1 }}
        data={recommendedProducts}
        renderItem={renderRecommendedProduct}
        numColumns={numColumns}
        key={`orders-rec-grid-${numColumns}`}
        keyExtractor={(item) => `orders-rec-${item.id}`}
        onEndReached={fetchMoreRecommended}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FE2C55']} />
        }
        contentContainerStyle={{
          width: '100%',
          paddingHorizontal: horizontalPadding,
          paddingTop: 14,
          paddingBottom: bottomSafePadding,
        }}
        ListHeaderComponent={
          <View style={{ width: '100%' }}>
            {loadingOrders ? (
              <View style={{ paddingVertical: 44, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FE2C55" />
                <Text style={{ marginTop: 8, color: palette.textSecondary, fontWeight: '600' }}>
                  Loading your orders...
                </Text>
              </View>
            ) : filteredOrders.length === 0 ? (
              <View
                style={[
                  {
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: isSmallPhone ? 34 : 44,
                    paddingHorizontal: 16,
                    backgroundColor: palette.glassSurface,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: palette.border,
                    marginBottom: 14,
                  },
                  cardShadowStyle,
                  webGlassStyle,
                ]}
              >
                <View
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 999,
                    backgroundColor: 'rgba(254, 44, 85, 0.11)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 14,
                  }}
                >
                  <MaterialCommunityIcons
                    name="shopping-outline"
                    size={44}
                    color="#FE2C55"
                  />
                </View>

                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '900',
                    color: palette.textPrimary,
                    textAlign: 'center',
                  }}
                >
                  No related orders
                </Text>

                <Text
                  style={{
                    fontSize: 13.5,
                    color: palette.textSecondary,
                    marginTop: 6,
                    textAlign: 'center',
                  }}
                >
                  Start exploring and find something you love!
                </Text>

                <TouchableOpacity
                  onPress={() => router.push('/(app)/(tabs)/home' as any)}
                  activeOpacity={0.85}
                  style={[
                    {
                      marginTop: 20,
                      backgroundColor: '#FE2C55',
                      paddingHorizontal: 38,
                      paddingVertical: 13,
                      borderRadius: 999,
                    },
                    webPrimaryButtonGradient,
                  ]}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 14.5, fontWeight: '800' }}>
                    Start Shopping
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View
                style={{
                  width: '100%',
                  marginBottom: 10,
                  flexDirection: isAnyDesktop ? 'row' : 'column',
                  flexWrap: isAnyDesktop ? 'wrap' : 'nowrap',
                  justifyContent: isAnyDesktop ? 'space-between' : 'flex-start',
                }}
              >
                {filteredOrders.map((order) =>
                  renderOrderCard(order, filteredOrders.length === 1)
                )}
              </View>
            )}

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 4,
                marginTop: 6,
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  width: 4,
                  height: 18,
                  borderRadius: 999,
                  backgroundColor: '#FE2C55',
                }}
              />
              <Title style={{ fontSize: 17, fontWeight: '900', color: palette.textPrimary }}>
                You Might Also Like
              </Title>
            </View>
          </View>
        }
        ListFooterComponent={
          <View style={{ width: '100%', paddingVertical: 18, alignItems: 'center', gap: 10 }}>
            {isFetchingMoreRec ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#FE2C55" />
                <Text style={{ fontSize: 13, color: palette.textSecondary }}>
                  Loading more recommended products...
                </Text>
              </View>
            ) : hasMoreRec ? (
              <Button
                mode="outlined"
                onPress={fetchMoreRecommended}
                textColor="#FE2C55"
                style={{ borderColor: '#FE2C55', borderRadius: 999 }}
                labelStyle={{ fontWeight: '800', fontSize: 12.5 }}
              >
                Load More
              </Button>
            ) : recommendedProducts.length > 0 ? (
              <Text style={{ fontSize: 12.5, color: palette.textMuted, fontWeight: '500' }}>
                You've reached the end of recommended products
              </Text>
            ) : null}
          </View>
        }
      />

      {/* ==================== VARIATION / STOCK UNAVAILABLE SELECTION MODAL ==================== */}
      <Modal visible={variationModalVisible} animationType="fade" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: palette.glassOverlay,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 12,
          }}
        >
          <Card
            style={[
              {
                width: '100%',
                maxWidth: 440,
                borderRadius: 20,
                padding: 18,
                backgroundColor: palette.glassModal,
                borderWidth: 1,
                borderColor: palette.border,
              },
              webGlassStyle,
            ]}
          >
            <Title style={{ fontSize: 16.5, fontWeight: '900', color: palette.textPrimary }}>
              Select Available Option
            </Title>
            <Text style={{ fontSize: 12.5, color: palette.textSecondary, marginTop: 4, marginBottom: 12 }}>
              The original variation for "{pendingOriginalItem?.title}" is unavailable or out of stock. Please choose another available option:
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {(pendingProductDetail?.availableOptions || ['Standard Edition']).map((opt: string) => {
                const active = chosenVariation === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setChosenVariation(opt)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: active ? 'rgba(254, 44, 85, 0.14)' : palette.glassInput,
                      borderWidth: 1.2,
                      borderColor: active ? '#FE2C55' : palette.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12.5,
                        fontWeight: '700',
                        color: active ? '#FE2C55' : palette.textPrimary,
                      }}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <Button
                mode="outlined"
                textColor={palette.textPrimary}
                style={{ borderColor: palette.border, borderRadius: 999 }}
                onPress={() => setVariationModalVisible(false)}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                buttonColor="#FE2C55"
                textColor="#FFFFFF"
                style={{ borderRadius: 999 }}
                disabled={!pendingProductDetail?.stock || pendingProductDetail.stock <= 0}
                onPress={async () => {
                  if (pendingProductDetail && pendingOriginalItem) {
                    setVariationModalVisible(false);
                    await commitProductToCart(
                      pendingProductDetail,
                      pendingOriginalItem,
                      chosenVariation,
                      pendingActionMode === 'buyAgain'
                    );
                  }
                }}
              >
                {pendingActionMode === 'buyAgain' ? 'Proceed to Checkout' : 'Add to Cart'}
              </Button>
            </View>
          </Card>
        </View>
      </Modal>

      {/* ==================== PRODUCT REVIEW MODAL (1-5 STARS, TEXT & MEDIA) ==================== */}
      <Modal visible={reviewModalVisible} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: palette.glassOverlay,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 12,
          }}
        >
          <Card
            style={[
              {
                width: '100%',
                maxWidth: 480,
                borderRadius: 20,
                padding: 18,
                backgroundColor: palette.glassModal,
                borderWidth: 1,
                borderColor: palette.border,
              },
              webGlassStyle,
            ]}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <Title style={{ fontSize: 16.5, fontWeight: '900', color: palette.textPrimary }}>
                Rate & Review Product
              </Title>
              <IconButton
                icon="close"
                size={20}
                iconColor={palette.textPrimary}
                onPress={() => setReviewModalVisible(false)}
                style={{ margin: 0 }}
              />
            </View>

            {reviewItem && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Image
                  source={{ uri: reviewItem.thumbnail }}
                  style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: '#FFFFFF' }}
                  resizeMode="contain"
                />
                <Text
                  numberOfLines={2}
                  style={{ flex: 1, fontSize: 13, fontWeight: '700', color: palette.textPrimary }}
                >
                  {reviewItem.title}
                </Text>
              </View>
            )}

            <Text style={{ fontSize: 12, fontWeight: '700', color: palette.textSecondary, marginBottom: 6 }}>
              Overall Rating ({reviewRating}/5)
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                  <MaterialCommunityIcons
                    name={star <= reviewRating ? 'star' : 'star-outline'}
                    size={32}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              mode="outlined"
              label="Write your review"
              placeholder="Share your experience with quality, fit, and delivery..."
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={3}
              textColor={palette.textPrimary}
              style={{ backgroundColor: palette.glassInput, marginBottom: 10 }}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <TextInput
                mode="outlined"
                dense
                label="Photo / Video URL (Optional)"
                placeholder="https://..."
                value={reviewMediaUrl}
                onChangeText={setReviewMediaUrl}
                textColor={palette.textPrimary}
                style={{ flex: 1, backgroundColor: palette.glassInput }}
              />
              <Button
                mode="outlined"
                compact
                icon="camera-plus-outline"
                textColor={palette.accent}
                style={{ borderColor: palette.accent, borderRadius: 999 }}
                onPress={handleAddMediaAttachment}
              >
                Attach
              </Button>
            </View>

            {reviewMediaList.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {reviewMediaList.map((uri, i) => (
                    <View key={`${uri}-${i}`} style={{ position: 'relative' }}>
                      <Image
                        source={{ uri }}
                        style={{ width: 54, height: 54, borderRadius: 8 }}
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setReviewMediaList((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          backgroundColor: '#FE2C55',
                          borderRadius: 10,
                          padding: 2,
                        }}
                      >
                        <MaterialCommunityIcons name="close" size={11} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
              <Button
                mode="outlined"
                textColor={palette.textPrimary}
                style={{ borderColor: palette.border, borderRadius: 999 }}
                onPress={() => setReviewModalVisible(false)}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                buttonColor="#FE2C55"
                textColor="#FFFFFF"
                style={{ borderRadius: 999 }}
                loading={savingReview}
                disabled={savingReview}
                onPress={handleSubmitReview}
              >
                Submit Review
              </Button>
            </View>
          </Card>
        </View>
      </Modal>

      {/* ==================== RETURN / REFUND REQUEST MODAL ==================== */}
      <Modal visible={returnModalVisible} animationType="fade" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: palette.glassOverlay,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 12,
          }}
        >
          <Card
            style={[
              {
                width: '100%',
                maxWidth: 440,
                borderRadius: 20,
                padding: 18,
                backgroundColor: palette.glassModal,
                borderWidth: 1,
                borderColor: palette.border,
              },
              webGlassStyle,
            ]}
          >
            <Title style={{ fontSize: 16.5, fontWeight: '900', color: palette.textPrimary, marginBottom: 8 }}>
              Request Return / Refund
            </Title>
            <TextInput
              mode="outlined"
              label="Return Reason"
              value={returnReason}
              onChangeText={setReturnReason}
              textColor={palette.textPrimary}
              style={{ backgroundColor: palette.glassInput, marginBottom: 14 }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <Button
                mode="outlined"
                textColor={palette.textPrimary}
                style={{ borderColor: palette.border, borderRadius: 999 }}
                onPress={() => setReturnModalVisible(false)}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                buttonColor="#FE2C55"
                textColor="#FFFFFF"
                style={{ borderRadius: 999 }}
                onPress={handleSubmitReturnRequest}
              >
                Submit Request
              </Button>
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  ambientLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  orbTopLeft: {
    position: 'absolute',
    top: -120,
    left: -90,
    width: 340,
    height: 340,
    borderRadius: 999,
  },
  orbTopRight: {
    position: 'absolute',
    top: 30,
    right: -110,
    width: 310,
    height: 310,
    borderRadius: 999,
  },
  orbCenter: {
    position: 'absolute',
    top: '36%',
    left: '14%',
    width: 360,
    height: 360,
    borderRadius: 999,
  },
  orbBottomRight: {
    position: 'absolute',
    bottom: -95,
    right: -85,
    width: 320,
    height: 320,
    borderRadius: 999,
  },
});