/**
 * Product Details Screen - TikTok Shop Inspired Shopping Experience
 * Features: Full-Width Responsive Layout (Website/Tablet/Phones), Image Gallery + Zoom, Variations Selector,
 * Quantity Controls, Interactive Actions (Wishlist/Share/Comment/Search/Cart), Shipping & Protection Dialogs,
 * About This Product (Expandable See More / See Less), Ratings & Review Breakdown,
 * & Infinite-Scrolling You Might Also Like Grid,
 * Plus Real-Time Persistent Flash Sale Countdown & Dynamic Promotional Badges.
 * APIs: https://dummyjson.com/docs/products
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Share,
  useWindowDimensions,
  Platform,
  Modal,
  DeviceEventEmitter,
  Animated,
  Easing,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  Button,
  Badge,
  IconButton,
  Divider,
  TextInput,
  Portal,
  Dialog,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productApi } from '../../../../services/productApi';
import { Product } from '../../../../types/product';
import { useAuth } from '../../../../context/AuthContext';
import { useAppTheme } from '../../../../context/ThemeContext';
import {
  MarketplaceProduct,
  FlashSaleSchedule,
  getFlashSaleSchedules,
  evaluateProductPromotions,
} from '../../../../utils/flashSaleHelpers';

interface ReviewItem {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  verified?: boolean;
}

const RECOMMENDED_PAGE_SIZE = 12;

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { palette } = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive Breakpoints (Website >= 1024, Tablet 768-1023, Mobile Phones e.g. Realme/iPhone/Samsung < 768)
  const isLargeDesktop = width >= 1360;
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;
  const isSmallPhone = width <= 375;

  const topSafePadding = Platform.OS === 'web' ? 12 : Math.max(insets.top, 10);
  const bottomSafePadding = Platform.OS === 'web' ? 14 : Math.max(insets.bottom, 10);

  // Full-width edge padding (occupies all left & right space without wasted margins)
  const edgePaddingX = isDesktop ? 16 : isTablet ? 12 : 10;

  // Per-user storage keys synchronized with Home, Cart & Profile
  const userPrefix = `@marketplace_user_${user?.id || 'guest'}`;
  const cartStorageKey = `${userPrefix}_cart`;
  const wishlistStorageKey = `${userPrefix}_wishlist`;

  const webGlassStyle: any =
    Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          boxShadow: palette.isDark
            ? '0 14px 36px rgba(0, 0, 0, 0.36)'
            : '0 12px 32px rgba(15, 23, 42, 0.07)',
        }
      : {};

  const webAmbientBackdropStyle: any =
    Platform.OS === 'web'
      ? {
          backgroundImage: palette.isDark
            ? 'radial-gradient(circle at 12% 10%, rgba(254, 44, 85, 0.24), transparent 44%), radial-gradient(circle at 88% 16%, rgba(59, 130, 246, 0.22), transparent 45%), radial-gradient(circle at 50% 86%, rgba(139, 92, 246, 0.16), transparent 48%), linear-gradient(135deg, #070B14 0%, #0F172A 50%, #161126 100%)'
            : 'radial-gradient(circle at 10% 8%, rgba(254, 44, 85, 0.16), transparent 42%), radial-gradient(circle at 90% 14%, rgba(56, 189, 248, 0.20), transparent 44%), radial-gradient(circle at 20% 85%, rgba(168, 85, 247, 0.13), transparent 44%), linear-gradient(135deg, #F8FAFC 0%, #EEF4FF 50%, #FFF1F5 100%)',
        }
      : {};

  const webPrimaryButtonGradient: any =
    Platform.OS === 'web'
      ? {
          backgroundImage: 'linear-gradient(135deg, #FE2C55 0%, #FF5E7E 100%)',
          boxShadow: '0 8px 22px rgba(254, 44, 85, 0.34)',
        }
      : {};

  // Subtle Ambient Orb Breathing Animation
  const orbPulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const useNative = Platform.OS !== 'web';
    const loop = Animated.loop(
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
    loop.start();
    return () => loop.stop();
  }, [orbPulseAnim]);

  // Data States
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // About This Product Expandable State
  const [aboutExpanded, setAboutExpanded] = useState(false);

  // "You Might Also Like" Infinite Scroll States
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
  const [loadingMoreRec, setLoadingMoreRec] = useState(false);
  const [hasMoreRec, setHasMoreRec] = useState(true);
  const recPhaseRef = useRef<'category' | 'catalog'>('category');
  const recCursorRef = useRef<number>(0);
  const recLoadedIdsRef = useRef<Set<number>>(new Set());
  const recFetchLockRef = useRef<boolean>(false);

  // Real-Time Persistent Flash Sale Schedules & 1-Second Clock Tick
  const [flashSchedules, setFlashSchedules] = useState<Record<number, FlashSaleSchedule>>({});
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // Selection States
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('Black');
  const [selectedSize, setSelectedSize] = useState('Standard');
  const [isLiked, setIsLiked] = useState(false);

  // Modals & Protection Dialogs
  const [zoomModalVisible, setZoomModalVisible] = useState(false);
  const [protectionModalVisible, setProtectionModalVisible] = useState(false);
  const [shippingModalVisible, setShippingModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);

  // Review Submission States
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [localReviews, setLocalReviews] = useState<ReviewItem[]>([]);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const notifyUser = (title: string, msg: string) => {
    const webWin = (globalThis as any)?.window;
    if (Platform.OS === 'web' && webWin?.alert) {
      webWin.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  // Live 1-second timer tick
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

  // Helper to read unified wishlist array across per-user & legacy keys
  const readUnifiedWishlist = useCallback(async (): Promise<any[]> => {
    const [userRaw, legacyRaw] = await Promise.all([
      AsyncStorage.getItem(wishlistStorageKey),
      AsyncStorage.getItem('@marketplace_wishlist'),
    ]);
    const primaryRaw = userRaw !== null ? userRaw : legacyRaw;
    if (!primaryRaw) return [];
    const parsed = JSON.parse(primaryRaw);
    return Array.isArray(parsed) ? parsed : [];
  }, [wishlistStorageKey]);

  // Synchronize Wishlist IDs & Current Product Heart State
  const syncWishlistState = useCallback(
    async (currentProdId?: number) => {
      try {
        const wishlist = await readUnifiedWishlist();
        const ids = new Set<number>();
        for (const item of wishlist) {
          const pid = Number(typeof item === 'number' ? item : item?.productId ?? item?.id);
          if (pid) ids.add(pid);
        }
        setWishlistIds(ids);

        const targetId = currentProdId ?? (id ? parseInt(id, 10) : NaN);
        if (!Number.isNaN(targetId)) {
          setIsLiked(ids.has(targetId));
        }
      } catch (e) {
        console.error('Error reading wishlist:', e);
      }
    },
    [readUnifiedWishlist, id]
  );

  // Toggle Wishlist for any product (Main Product Heart or Recommended Card Heart)
  const toggleProductWishlist = async (targetProd: Product) => {
    if (!targetProd) return;
    try {
      let wishlist = await readUnifiedWishlist();
      const exists = wishlist.some((item) =>
        typeof item === 'number'
          ? item === targetProd.id
          : Number(item?.productId ?? item?.id) === targetProd.id
      );

      if (exists) {
        wishlist = wishlist.filter((item) =>
          typeof item === 'number'
            ? item !== targetProd.id
            : Number(item?.productId ?? item?.id) !== targetProd.id
        );
        if (product && targetProd.id === product.id) setIsLiked(false);
        showToast('Removed from Wishlist');
      } else {
        const promo = evaluateProductPromotions(
          targetProd as unknown as MarketplaceProduct,
          flashSchedules,
          nowMs
        );
        const wishlistEntry = {
          id: targetProd.id,
          productId: targetProd.id,
          title: targetProd.title,
          price: targetProd.price,
          discountPercentage: promo.effectiveDiscountPercentage,
          thumbnail: targetProd.thumbnail,
          category: targetProd.category,
          rating: targetProd.rating,
          stock: targetProd.stock,
          addedAt: new Date().toISOString(),
        };
        wishlist = [
          wishlistEntry,
          ...wishlist.filter((item) =>
            typeof item === 'number'
              ? item !== targetProd.id
              : Number(item?.productId ?? item?.id) !== targetProd.id
          ),
        ];
        if (product && targetProd.id === product.id) setIsLiked(true);
        showToast('Saved to Wishlist ❤️');
      }

      const serialized = JSON.stringify(wishlist);
      await Promise.all([
        AsyncStorage.setItem(wishlistStorageKey, serialized),
        AsyncStorage.setItem('@marketplace_wishlist', serialized),
      ]);

      const nextIds = new Set<number>();
      for (const item of wishlist) {
        const pid = Number(typeof item === 'number' ? item : item?.productId ?? item?.id);
        if (pid) nextIds.add(pid);
      }
      setWishlistIds(nextIds);

      DeviceEventEmitter.emit('wishlistUpdated', {
        count: wishlist.length,
        wishlist,
      });
    } catch (e) {
      console.error('Error updating wishlist:', e);
    }
  };

  // ==================== INFINITE SCROLL "YOU MIGHT ALSO LIKE" LOADER ====================
  const loadMoreRecommendations = useCallback(
    async (baseProduct?: Product | null, reset = false) => {
      const target = baseProduct ?? product;
      if (!target) return;
      if (recFetchLockRef.current && !reset) return;
      if (!hasMoreRec && !reset) return;

      recFetchLockRef.current = true;
      setLoadingMoreRec(true);

      try {
        if (reset) {
          recPhaseRef.current = 'category';
          recCursorRef.current = 0;
          recLoadedIdsRef.current = new Set([target.id]);
          setHasMoreRec(true);
        }

        const collected: Product[] = [];
        let attempts = 0;

        while (collected.length < RECOMMENDED_PAGE_SIZE && attempts < 4) {
          attempts++;

          if (recPhaseRef.current === 'category' && target.category) {
            const catRes = await productApi.getProductsByCategory(target.category, {
              limit: RECOMMENDED_PAGE_SIZE,
              skip: recCursorRef.current,
            });
            const batch = (catRes.products || []).filter(
              (p: Product) =>
                Boolean(p) &&
                p.id !== target.id &&
                !recLoadedIdsRef.current.has(p.id) &&
                p.stock > 0 &&
                !Boolean((p as any).isDeleted)
            );
            for (const item of batch) {
              recLoadedIdsRef.current.add(item.id);
              collected.push(item);
            }
            const rawCount = (catRes.products || []).length;
            recCursorRef.current += rawCount;
            if (rawCount < RECOMMENDED_PAGE_SIZE || recCursorRef.current >= (catRes.total || 0)) {
              recPhaseRef.current = 'catalog';
              recCursorRef.current = 0;
            }
          } else {
            const allRes = await productApi.getProducts({
              limit: RECOMMENDED_PAGE_SIZE,
              skip: recCursorRef.current,
            });
            const batch = (allRes.products || []).filter(
              (p: Product) =>
                Boolean(p) &&
                p.id !== target.id &&
                !recLoadedIdsRef.current.has(p.id) &&
                p.stock > 0 &&
                !Boolean((p as any).isDeleted)
            );
            for (const item of batch) {
              recLoadedIdsRef.current.add(item.id);
              collected.push(item);
            }
            const rawCount = (allRes.products || []).length;
            recCursorRef.current += rawCount;
            if (rawCount === 0 || recCursorRef.current >= (allRes.total || 0)) {
              setHasMoreRec(false);
              break;
            }
          }
        }

        if (reset) {
          setRecommendedProducts(collected);
        } else if (collected.length > 0) {
          setRecommendedProducts((prev) => [...prev, ...collected]);
        }
      } catch (err) {
        console.error('Error loading recommended products:', err);
      } finally {
        setLoadingMoreRec(false);
        recFetchLockRef.current = false;
      }
    },
    [product, hasMoreRec]
  );

  // Fetch Main Product Data
  const fetchProductData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setAboutExpanded(false);
      const numericId = parseInt(id, 10);
      const data = await productApi.getProductById(numericId);
      setProduct(data);
      setLocalReviews((data.reviews as ReviewItem[]) || []);
      setSelectedImageIndex(0);
      setQuantity(1);

      // Check Wishlist Status
      await syncWishlistState(numericId);

      // Reset & load initial page of "You Might Also Like"
      await loadMoreRecommendations(data, true);
    } catch (error) {
      console.error('Error fetching product details:', error);
      notifyUser('Error', 'Failed to load product details.');
    } finally {
      setLoading(false);
    }
  }, [id, syncWishlistState]);

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  // Re-sync heart state if wishlist changes elsewhere
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('wishlistUpdated', () => {
      syncWishlistState();
    });
    return () => sub.remove();
  }, [syncWishlistState]);

  // Scroll listener to automatically trigger infinite scroll near the bottom of the page
  const handlePageScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const distanceFromBottom =
        contentSize.height - (layoutMeasurement.height + contentOffset.y);
      if (
        distanceFromBottom < 520 &&
        !recFetchLockRef.current &&
        hasMoreRec &&
        !loading
      ) {
        loadMoreRecommendations(product, false);
      }
    },
    [hasMoreRec, loading, loadMoreRecommendations, product]
  );

  // Navigation Back Handler
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(app)/(tabs)/home' as any);
    }
  };

  // Add To Cart & Buy Now Flow
  const handleAddToCart = async (goToCheckout = false) => {
    if (!product) return;
    if (product.stock <= 0) {
      notifyUser('Out of Stock', 'This item is currently sold out.');
      return;
    }

    try {
      const promo = evaluateProductPromotions(
        product as unknown as MarketplaceProduct,
        flashSchedules,
        nowMs
      );
      const savedCart =
        (await AsyncStorage.getItem(cartStorageKey)) ||
        (await AsyncStorage.getItem('@marketplace_cart'));
      let cartItems: any[] = savedCart ? JSON.parse(savedCart) : [];

      const variationKey = `${product.id}-${selectedColor}-${selectedSize}`;
      const existingIndex = cartItems.findIndex(
        (item) =>
          item.variationKey === variationKey ||
          (!item.variationKey && item.productId === product.id)
      );

      if (existingIndex > -1) {
        const updatedQty = Math.min(product.stock || 99, cartItems[existingIndex].quantity + quantity);
        cartItems[existingIndex].quantity = updatedQty;
        cartItems[existingIndex].selectedColor = selectedColor;
        cartItems[existingIndex].selectedSize = selectedSize;
        cartItems[existingIndex].variationKey = variationKey;
        cartItems[existingIndex].discountPercentage = promo.effectiveDiscountPercentage;
      } else {
        cartItems.push({
          id: Date.now(),
          variationKey,
          productId: product.id,
          title: product.title,
          thumbnail: product.thumbnail,
          price: product.price,
          discountPercentage: promo.effectiveDiscountPercentage,
          quantity: quantity,
          stock: product.stock || 99,
          selectedColor,
          selectedSize,
        });
      }

      await AsyncStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
      await AsyncStorage.setItem('@marketplace_cart', JSON.stringify(cartItems));
      DeviceEventEmitter.emit('cartUpdated', { count: cartItems.length });

      if (goToCheckout) {
        router.push('/(app)/(tabs)/cart' as any);
      } else {
        showToast(`Added ${quantity} item(s) to Cart! 🛒`);
      }
    } catch (e) {
      notifyUser('Error', 'Failed to update shopping cart.');
    }
  };

  // Share Product Link
  const handleShare = async () => {
    if (!product) return;
    const promo = evaluateProductPromotions(
      product as unknown as MarketplaceProduct,
      flashSchedules,
      nowMs
    );
    const shareUrl = `https://marketplace.app/product/${product.id}`;
    try {
      await Share.share({
        message: `Check out ${product.title} (₱${promo.effectivePrice.toFixed(2)}) on Marketplace! ${shareUrl}`,
        url: shareUrl,
      });
    } catch (e) {
      showToast('Sharing link...');
    }
  };

  // Submit User Review / Comment
  const handleSubmitComment = () => {
    if (!userComment.trim()) {
      notifyUser('Empty Comment', 'Please enter your review text before submitting.');
      return;
    }

    const newReview: ReviewItem = {
      rating: userRating,
      comment: userComment.trim(),
      date: new Date().toISOString().split('T')[0],
      reviewerName: user?.firstName
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : 'Verified Purchaser',
      verified: true,
    };

    setLocalReviews([newReview, ...localReviews]);
    setUserComment('');
    setCommentModalVisible(false);
    showToast('Thank you for your review! ⭐');
  };

  // Dynamic Delivery Date Range based on actual product shippingInformation
  const getDeliveryWindowLabel = (shippingInfo?: string): string => {
    const base = new Date();
    const minDays = shippingInfo?.toLowerCase().includes('overnight')
      ? 1
      : shippingInfo?.toLowerCase().includes('1-2')
      ? 2
      : 3;
    const maxDays = minDays + 4;
    const d1 = new Date(base.getTime() + minDays * 86400000);
    const d2 = new Date(base.getTime() + maxDays * 86400000);
    const fmt = (d: Date) => d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${fmt(d1)}–${fmt(d2)}`;
  };

  const renderAmbientOrbs = () => (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: 0,
        transform: [{ scale: orbPulseAnim }],
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: -120,
          left: -95,
          width: 340,
          height: 340,
          borderRadius: 999,
          backgroundColor: palette.isDark
            ? 'rgba(254, 44, 85, 0.22)'
            : 'rgba(254, 44, 85, 0.14)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 40,
          right: -115,
          width: 320,
          height: 320,
          borderRadius: 999,
          backgroundColor: palette.isDark
            ? 'rgba(59, 130, 246, 0.20)'
            : 'rgba(56, 189, 248, 0.17)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: -110,
          left: '22%',
          width: 360,
          height: 360,
          borderRadius: 999,
          backgroundColor: palette.isDark
            ? 'rgba(139, 92, 246, 0.16)'
            : 'rgba(168, 85, 247, 0.11)',
        }}
      />
    </Animated.View>
  );

  if (loading) {
    return (
      <View
        style={[
          {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: palette.background,
            position: 'relative',
            overflow: 'hidden',
          },
          webAmbientBackdropStyle,
        ]}
      >
        {renderAmbientOrbs()}
        <ActivityIndicator size="large" color="#FE2C55" />
        <Text style={{ marginTop: 12, fontSize: 14, color: palette.textSecondary, fontWeight: '600' }}>
          Loading product details...
        </Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View
        style={[
          {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: palette.background,
            padding: 20,
            position: 'relative',
            overflow: 'hidden',
          },
          webAmbientBackdropStyle,
        ]}
      >
        {renderAmbientOrbs()}
        <View
          style={[
            {
              backgroundColor: palette.glassSurface,
              borderColor: palette.border,
              borderWidth: 1,
              borderRadius: 24,
              padding: 28,
              alignItems: 'center',
              maxWidth: 420,
              width: '100%',
            },
            webGlassStyle,
          ]}
        >
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color={palette.danger} />
          <Text style={{ fontSize: 18, fontWeight: '800', color: palette.textPrimary, marginTop: 12 }}>
            Product Not Found
          </Text>
          <Button
            mode="contained"
            onPress={handleBack}
            style={[{ marginTop: 16, borderRadius: 22 }, webPrimaryButtonGradient]}
            buttonColor="#FE2C55"
            textColor="#FFFFFF"
          >
            Back to Shop
          </Button>
        </View>
      </View>
    );
  }

  // Evaluate real-time Flash Sale & Promotional Offers
  const promo = evaluateProductPromotions(
    product as unknown as MarketplaceProduct,
    flashSchedules,
    nowMs
  );
  const images: string[] =
    product.images && product.images.length > 0 ? product.images : [product.thumbnail];
  const deliveryWindow = getDeliveryWindowLabel(product.shippingInformation);

  // Calculated Ratings
  const totalReviews = localReviews.length;
  const avgRating =
    totalReviews > 0
      ? (localReviews.reduce((sum: number, r: ReviewItem) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : product.rating.toFixed(1);

  // Dynamic Specification Rows for "About This Product"
  const rawProd: any = product;
  const dimensionsText = rawProd.dimensions
    ? `${rawProd.dimensions.width} × ${rawProd.dimensions.height} × ${rawProd.dimensions.depth} cm`
    : undefined;
  const tagsList: string[] = Array.isArray(rawProd.tags) ? rawProd.tags : [];

  const productSpecifications: Array<{ label: string; val: string }> = [
    ...(product.brand ? [{ label: 'Brand', val: product.brand }] : []),
    ...(product.category ? [{ label: 'Category', val: product.category }] : []),
    ...(rawProd.material || rawProd.materials
      ? [{ label: 'Materials', val: String(rawProd.material || rawProd.materials) }]
      : []),
    ...(dimensionsText ? [{ label: 'Dimensions', val: dimensionsText }] : []),
    ...(product.weight ? [{ label: 'Weight', val: `${product.weight} kg` }] : []),
    { label: 'Available Colors', val: 'Black, Silver, Blue' },
    { label: 'Available Sizes', val: 'Standard, Pro / XL, Compact' },
    ...(tagsList.length > 0 ? [{ label: 'Key Features', val: tagsList.join(' · ') }] : []),
    ...(product.sku ? [{ label: 'SKU', val: product.sku }] : []),
    { label: 'Warranty', val: product.warrantyInformation || '1 Year Official Warranty' },
    { label: 'Return Policy', val: product.returnPolicy || '7-Day Easy Return' },
    { label: 'Shipping', val: product.shippingInformation || 'Ships in 1-2 business days' },
  ];

  // Responsive Grid Columns & Full-Span Percentage Width (Zero Wasted Space on Right Side)
  const recColumns = isLargeDesktop ? 6 : isDesktop ? 4 : isTablet ? 3 : 2;
  const gridHalfGap = isMobile ? 4 : 5;
  const recCardSlotWidth: any = `${100 / recColumns}%`;

  return (
    <View
      style={[
        {
          flex: 1,
          width: '100%',
          backgroundColor: palette.background,
          position: 'relative',
          overflow: 'hidden',
        },
        webAmbientBackdropStyle,
      ]}
    >
      {renderAmbientOrbs()}

      {/* TOP GLASS HEADER / NAVBAR */}
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: isMobile ? 8 : 16,
            paddingTop: topSafePadding,
            paddingBottom: 10,
            backgroundColor: palette.glassNav,
            borderBottomWidth: 1,
            borderBottomColor: palette.border,
            zIndex: 10,
          },
          webGlassStyle,
        ]}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 4, minWidth: 54 }}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={palette.textPrimary} />
          {!isMobile && (
            <Text style={{ marginLeft: 2, fontWeight: '700', fontSize: 15, color: palette.textPrimary }}>
              Back
            </Text>
          )}
        </TouchableOpacity>

        <Text
          numberOfLines={1}
          style={{
            fontSize: 15.5,
            fontWeight: '800',
            color: palette.textPrimary,
            maxWidth: width * 0.48,
          }}
        >
          {product.title}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton
            icon="magnify"
            size={21}
            iconColor={palette.textPrimary}
            style={{ margin: 0 }}
            onPress={() => router.push('/(app)/(tabs)/search' as any)}
          />
          <IconButton
            icon="share-variant-outline"
            size={21}
            iconColor={palette.textPrimary}
            style={{ margin: 0 }}
            onPress={handleShare}
          />
          <IconButton
            icon="cart-outline"
            size={21}
            iconColor={palette.textPrimary}
            style={{ margin: 0 }}
            onPress={() => router.push('/(app)/(tabs)/cart' as any)}
          />
        </View>
      </View>

      {/* MAIN FULL-WIDTH SCROLLABLE CONTENT */}
      <ScrollView
        style={{ zIndex: 1, width: '100%' }}
        onScroll={handlePageScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={{
          width: '100%',
          paddingBottom: isMobile ? bottomSafePadding + 92 : 40,
          paddingHorizontal: isMobile ? 0 : edgePaddingX,
        }}
      >
        <View style={{ width: '100%' }}>
          <View
            style={{
              flexDirection: isDesktop || isTablet ? 'row' : 'column',
              gap: isDesktop ? 18 : 14,
              marginTop: isMobile ? 0 : 14,
              alignItems: isDesktop || isTablet ? 'flex-start' : 'stretch',
              width: '100%',
            }}
          >
            {/* PRODUCT IMAGE GALLERY WITH ZOOM */}
            <View
              style={{
                flex: isDesktop ? 1.15 : isTablet ? 1 : undefined,
                width: '100%',
              }}
            >
              <View
                style={[
                  {
                    position: 'relative',
                    backgroundColor: palette.isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                    borderRadius: isMobile ? 0 : 22,
                    overflow: 'hidden',
                    borderWidth: isMobile ? 0 : 1,
                    borderColor: palette.border,
                    paddingVertical: 14,
                    width: '100%',
                  },
                  !isMobile && webGlassStyle,
                ]}
              >
                <Image
                  source={{ uri: images[selectedImageIndex] }}
                  style={{ width: '100%', height: isDesktop ? 460 : isTablet ? 370 : 320 }}
                  resizeMode="contain"
                />

                {/* Zoom Trigger Pill */}
                <TouchableOpacity
                  onPress={() => setZoomModalVisible(true)}
                  style={{
                    position: 'absolute',
                    bottom: 14,
                    right: 14,
                    backgroundColor: 'rgba(15, 23, 42, 0.78)',
                    borderRadius: 999,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <MaterialCommunityIcons name="magnify-plus-outline" size={18} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 11.5, fontWeight: '700' }}>
                    {selectedImageIndex + 1} / {images.length}
                  </Text>
                </TouchableOpacity>

                {/* Discount Percentage Badge */}
                {promo.hasDiscount && (
                  <Badge
                    style={{
                      position: 'absolute',
                      top: 14,
                      left: 14,
                      backgroundColor: '#FE2C55',
                      color: '#FFFFFF',
                      fontWeight: '900',
                      fontSize: 12,
                      paddingHorizontal: 10,
                      height: 26,
                      borderRadius: 8,
                    }}
                  >
                    {`${promo.effectiveDiscountPercentage}% OFF`}
                  </Badge>
                )}
              </View>

              {/* Thumbnails Strip */}
              {images.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 10, paddingHorizontal: isMobile ? edgePaddingX : 2 }}
                >
                  {images.map((imgUri: string, idx: number) => {
                    const active = selectedImageIndex === idx;
                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setSelectedImageIndex(idx)}
                        style={{
                          borderWidth: 2,
                          borderColor: active ? '#FE2C55' : palette.border,
                          borderRadius: 12,
                          marginRight: 10,
                          overflow: 'hidden',
                          backgroundColor: palette.isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                          padding: 2,
                        }}
                      >
                        <Image
                          source={{ uri: imgUri }}
                          style={{ width: 62, height: 62, borderRadius: 9 }}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* PRODUCT INFORMATION, FLASH SALE COUNTDOWN & VARIATIONS */}
            <View
              style={{
                flex: 1,
                paddingHorizontal: isMobile ? edgePaddingX : 0,
                paddingTop: isMobile ? 12 : 0,
              }}
            >
              {/* FLASH SALE COUNTDOWN BANNER */}
              {promo.isFlashSale ? (
                <View
                  style={[
                    {
                      backgroundColor: '#FE2C55',
                      borderRadius: 16,
                      padding: 13,
                      marginBottom: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 8,
                    },
                    webPrimaryButtonGradient,
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons name="lightning-bolt" size={26} color="#FDE047" />
                    <View>
                      <Text style={{ color: '#FFFFFF', fontSize: 14.5, fontWeight: '900' }}>
                        FLASH SALE LIVE
                      </Text>
                      {typeof promo.promoStockRemaining === 'number' &&
                        promo.promoStockRemaining > 0 && (
                          <Text style={{ color: '#FFE4E6', fontSize: 11.5, fontWeight: '700' }}>
                            Only {promo.promoStockRemaining} promo units left
                          </Text>
                        )}
                    </View>
                  </View>

                  <View
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.88)',
                      paddingHorizontal: 13,
                      paddingVertical: 6,
                      borderRadius: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#FDE047', fontSize: 9.5, fontWeight: '800' }}>
                      ENDS IN
                    </Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 14.5, fontWeight: '900' }}>
                      {promo.countdownLabel}
                    </Text>
                  </View>
                </View>
              ) : promo.flashSaleStatus === 'upcoming' ? (
                <View
                  style={[
                    {
                      backgroundColor: palette.accentSoft,
                      borderRadius: 14,
                      padding: 12,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: '#FE2C55',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    },
                    webGlassStyle,
                  ]}
                >
                  <MaterialCommunityIcons name="clock-outline" size={20} color="#FE2C55" />
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#FE2C55' }}>
                    Scheduled Flash Sale · Starts at {promo.scheduledStartLabel}
                  </Text>
                </View>
              ) : promo.flashSaleStatus === 'ended' ? (
                <View
                  style={[
                    {
                      backgroundColor: palette.glassSurface,
                      borderRadius: 12,
                      padding: 10,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: palette.border,
                    },
                    webGlassStyle,
                  ]}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: palette.textMuted }}>
                    Flash Sale has ended · Regular product price is now displayed.
                  </Text>
                </View>
              ) : null}

              {/* Pricing, Promotional Labels, Title, Rating & Sales Count */}
              <Card
                style={[
                  {
                    backgroundColor: palette.glassSurface,
                    padding: 16,
                    borderRadius: 20,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: palette.border,
                  },
                  webGlassStyle,
                ]}
                elevation={0}
              >
                <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
                  <Text
                    style={{
                      fontSize: isSmallPhone ? 25 : 30,
                      fontWeight: '900',
                      color: '#FE2C55',
                    }}
                  >
                    ₱{promo.effectivePrice.toFixed(2)}
                  </Text>
                  {promo.hasDiscount && (
                    <>
                      <Text
                        style={{
                          fontSize: 16,
                          color: palette.textMuted,
                          textDecorationLine: 'line-through',
                        }}
                      >
                        ₱{promo.originalPrice.toFixed(2)}
                      </Text>
                      <View
                        style={{
                          backgroundColor: 'rgba(254, 44, 85, 0.14)',
                          paddingHorizontal: 8,
                          paddingVertical: 2.5,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#FE2C55' }}>
                          {promo.effectiveDiscountPercentage}% OFF
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Dynamic Promotional Labels */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
                  {promo.isFlashSale && (
                    <View
                      style={{
                        backgroundColor: 'rgba(254, 44, 85, 0.14)',
                        paddingHorizontal: 9,
                        paddingVertical: 3.5,
                        borderRadius: 7,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#FE2C55' }}>
                        ⚡ Flash Sale
                      </Text>
                    </View>
                  )}
                  {promo.isFreeShipping && (
                    <View
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.14)',
                        paddingHorizontal: 9,
                        paddingVertical: 3.5,
                        borderRadius: 7,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: palette.success }}>
                        Free Shipping
                      </Text>
                    </View>
                  )}
                  {promo.isCodAvailable && (
                    <View
                      style={{
                        backgroundColor: palette.accentSoft,
                        paddingHorizontal: 9,
                        paddingVertical: 3.5,
                        borderRadius: 7,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: palette.accent }}>
                        COD Available
                      </Text>
                    </View>
                  )}
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginTop: 10,
                  }}
                >
                  <Title
                    style={{
                      fontSize: isDesktop ? 21 : 18.5,
                      fontWeight: '800',
                      color: palette.textPrimary,
                      flex: 1,
                      lineHeight: 25,
                    }}
                  >
                    {product.title}
                  </Title>
                  <IconButton
                    icon={isLiked ? 'heart' : 'heart-outline'}
                    iconColor={isLiked ? '#FE2C55' : palette.textSecondary}
                    size={26}
                    onPress={() => toggleProductWishlist(product)}
                    accessibilityLabel={isLiked ? 'Remove from Wishlist' : 'Save to Wishlist'}
                    testID="product-heart-wishlist-btn"
                  />
                </View>

                {/* Rating, Sales Count & Stock Indicator */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 10,
                    marginTop: 6,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(245, 158, 11, 0.16)',
                      paddingHorizontal: 9,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '800',
                        color: '#F59E0B',
                        marginRight: 4,
                      }}
                    >
                      ⭐ {avgRating}
                    </Text>
                    <Text style={{ fontSize: 12, color: palette.textSecondary }}>
                      ({totalReviews} reviews)
                    </Text>
                  </View>

                  <Text
                    style={{
                      fontSize: 12.5,
                      fontWeight: '700',
                      color: palette.textSecondary,
                    }}
                  >
                    {promo.soldFormatted}
                  </Text>

                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '800',
                      color: product.stock > 0 ? palette.success : palette.danger,
                    }}
                  >
                    {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Sold Out'}
                  </Text>
                </View>
              </Card>

              {/* Variations (Color, Size, Quantity) */}
              <Card
                style={[
                  {
                    backgroundColor: palette.glassSurface,
                    padding: 16,
                    borderRadius: 20,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: palette.border,
                  },
                  webGlassStyle,
                ]}
                elevation={0}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '800',
                    color: palette.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Color Variation
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {['Black', 'Silver', 'Blue'].map((color: string) => {
                    const active = selectedColor === color;
                    return (
                      <TouchableOpacity
                        key={color}
                        onPress={() => setSelectedColor(color)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 7,
                          borderRadius: 10,
                          borderWidth: 1.5,
                          borderColor: active ? '#FE2C55' : palette.border,
                          backgroundColor: active
                            ? 'rgba(254, 44, 85, 0.14)'
                            : palette.glassInput,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12.5,
                            fontWeight: '800',
                            color: active ? '#FE2C55' : palette.textPrimary,
                          }}
                        >
                          {color}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '800',
                    color: palette.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Option / Size
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {['Standard', 'Pro / XL', 'Compact'].map((size: string) => {
                    const active = selectedSize === size;
                    return (
                      <TouchableOpacity
                        key={size}
                        onPress={() => setSelectedSize(size)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 7,
                          borderRadius: 10,
                          borderWidth: 1.5,
                          borderColor: active ? '#FE2C55' : palette.border,
                          backgroundColor: active
                            ? 'rgba(254, 44, 85, 0.14)'
                            : palette.glassInput,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12.5,
                            fontWeight: '800',
                            color: active ? '#FE2C55' : palette.textPrimary,
                          }}
                        >
                          {size}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Quantity Controls (+ and −) */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 13.5, fontWeight: '800', color: palette.textSecondary }}>
                    Quantity
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: palette.border,
                      borderRadius: 12,
                      backgroundColor: palette.glassInput,
                    }}
                  >
                    <IconButton
                      icon="minus"
                      size={18}
                      iconColor={palette.textPrimary}
                      style={{ margin: 0 }}
                      onPress={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    />
                    <Text
                      style={{
                        fontSize: 14.5,
                        fontWeight: '800',
                        paddingHorizontal: 14,
                        color: palette.textPrimary,
                      }}
                    >
                      {quantity}
                    </Text>
                    <IconButton
                      icon="plus"
                      size={18}
                      iconColor={palette.textPrimary}
                      style={{ margin: 0 }}
                      onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                    />
                  </View>
                </View>
              </Card>

              {/* Shipping & Buyer Protection Sections */}
              <Card
                style={[
                  {
                    backgroundColor: palette.glassSurface,
                    padding: 16,
                    borderRadius: 20,
                    marginBottom: 14,
                    borderWidth: 1,
                    borderColor: palette.border,
                  },
                  webGlassStyle,
                ]}
                elevation={0}
              >
                <TouchableOpacity
                  onPress={() => setShippingModalVisible(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: 11,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: 'rgba(16, 185, 129, 0.14)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialCommunityIcons
                        name="truck-fast-outline"
                        size={20}
                        color={palette.success}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13.5, fontWeight: '800', color: palette.textPrimary }}>
                        {promo.isFreeShipping ? 'Free Shipping' : 'Standard Shipping (₱4.99)'}
                      </Text>
                      <Text style={{ fontSize: 12, color: palette.textSecondary, marginTop: 2 }}>
                        Estimated delivery between {deliveryWindow} (
                        {product.shippingInformation || 'Ships in 1-2 business days'})
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
                </TouchableOpacity>

                <Divider style={{ marginVertical: 4, backgroundColor: palette.border }} />

                <TouchableOpacity
                  onPress={() => setProtectionModalVisible(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 11,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: 'rgba(254, 44, 85, 0.12)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialCommunityIcons
                        name="shield-check-outline"
                        size={20}
                        color="#FE2C55"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13.5, fontWeight: '800', color: palette.textPrimary }}>
                        Buyer Protection & Cash on Delivery
                      </Text>
                      <Text style={{ fontSize: 12, color: palette.textSecondary, marginTop: 2 }}>
                        {promo.isCodAvailable ? 'COD Available' : 'Online Payment'} ·{' '}
                        {product.returnPolicy || '7-Day Return Policy'}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
                </TouchableOpacity>
              </Card>

              {/* DESKTOP/TABLET BUY BUTTONS */}
              {!isMobile && (
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                  <Button
                    mode="outlined"
                    onPress={() => handleAddToCart(false)}
                    disabled={product.stock <= 0}
                    style={{ flex: 1, borderColor: '#FE2C55', borderRadius: 22 }}
                    contentStyle={{ height: 44 }}
                    textColor="#FE2C55"
                    icon="cart-plus"
                  >
                    Add to Cart
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => handleAddToCart(true)}
                    disabled={product.stock <= 0}
                    style={[{ flex: 1, borderRadius: 22 }, webPrimaryButtonGradient]}
                    contentStyle={{ height: 44 }}
                    buttonColor="#FE2C55"
                    textColor="#FFFFFF"
                    icon="flash"
                  >
                    Buy Now
                  </Button>
                </View>
              )}
            </View>
          </View>

          {/* SELLER INFORMATION */}
          <Card
            style={[
              {
                backgroundColor: palette.glassSurface,
                padding: 16,
                borderRadius: 20,
                marginTop: 12,
                marginHorizontal: isMobile ? edgePaddingX : 0,
                borderWidth: 1,
                borderColor: palette.border,
              },
              webGlassStyle,
            ]}
            elevation={0}
          >
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    backgroundColor: 'rgba(254, 44, 85, 0.12)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <MaterialCommunityIcons
                    name="storefront-outline"
                    size={24}
                    color="#FE2C55"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 15, fontWeight: '800', color: palette.textPrimary }}
                  >
                    {product.brand || 'Official Marketplace Merchant'}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: palette.textSecondary, marginTop: 2 }}>
                    Verified Merchant · 98.4% Positive Ratings
                  </Text>
                </View>
              </View>
              <Button
                mode="outlined"
                compact
                textColor="#FE2C55"
                style={{ borderColor: '#FE2C55', borderRadius: 20 }}
                onPress={() => router.push('/(app)/(tabs)/home' as any)}
              >
                Visit Store
              </Button>
            </View>
          </Card>

          {/* ==================== 1. ABOUT THIS PRODUCT (EXPANDABLE SEE MORE / SEE LESS) ==================== */}
          <Card
            style={[
              {
                backgroundColor: palette.glassSurface,
                padding: 16,
                borderRadius: 20,
                marginTop: 14,
                marginHorizontal: isMobile ? edgePaddingX : 0,
                borderWidth: 1,
                borderColor: palette.border,
              },
              webGlassStyle,
            ]}
            elevation={0}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 4,
                    height: 18,
                    borderRadius: 999,
                    backgroundColor: '#FE2C55',
                  }}
                />
                <Title
                  style={{
                    fontSize: 16.5,
                    fontWeight: '900',
                    color: palette.textPrimary,
                  }}
                >
                  About This Product
                </Title>
              </View>

              {product.brand && (
                <View
                  style={{
                    backgroundColor: palette.accentSoft,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderRadius: 999,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: palette.accent }}>
                    {product.brand}
                  </Text>
                </View>
              )}
            </View>

            {/* Shortened initial description when collapsed; complete description when expanded */}
            <Text
              numberOfLines={aboutExpanded ? undefined : 3}
              style={{
                fontSize: 13.5,
                color: palette.textSecondary,
                lineHeight: 21,
                marginBottom: 12,
              }}
            >
              {product.description}
            </Text>

            {/* Key Highlights / Specifications Table (Shows top 3 specs initially, full specs when expanded) */}
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: palette.border,
                paddingTop: 8,
                gap: 4,
              }}
            >
              {(aboutExpanded
                ? productSpecifications
                : productSpecifications.slice(0, 3)
              ).map((spec, idx) => (
                <View
                  key={`${spec.label}-${idx}`}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    paddingVertical: 7,
                    borderBottomWidth: 1,
                    borderBottomColor: palette.border,
                    gap: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12.5,
                      color: palette.textSecondary,
                      fontWeight: '600',
                      minWidth: 115,
                    }}
                  >
                    {spec.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12.5,
                      color: palette.textPrimary,
                      fontWeight: '700',
                      flex: 1,
                      textAlign: 'right',
                    }}
                  >
                    {spec.val}
                  </Text>
                </View>
              ))}
            </View>

            {/* See More / See Less Toggle Button */}
            <TouchableOpacity
              activeOpacity={0.78}
              onPress={() => setAboutExpanded((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel={aboutExpanded ? 'See Less' : 'See More'}
              style={{
                marginTop: 12,
                paddingVertical: 9,
                paddingHorizontal: 16,
                borderRadius: 999,
                backgroundColor: palette.isDark
                  ? 'rgba(254, 44, 85, 0.16)'
                  : 'rgba(254, 44, 85, 0.09)',
                borderWidth: 1,
                borderColor: 'rgba(254, 44, 85, 0.28)',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '800',
                  color: '#FE2C55',
                }}
              >
                {aboutExpanded ? 'See Less' : 'See More'}
              </Text>
              <MaterialCommunityIcons
                name={aboutExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#FE2C55"
              />
            </TouchableOpacity>
          </Card>

          {/* CUSTOMER REVIEWS AND RATINGS */}
          <Card
            style={[
              {
                backgroundColor: palette.glassSurface,
                padding: 16,
                borderRadius: 20,
                marginTop: 14,
                marginHorizontal: isMobile ? edgePaddingX : 0,
                borderWidth: 1,
                borderColor: palette.border,
              },
              webGlassStyle,
            ]}
            elevation={0}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 4,
                    height: 18,
                    borderRadius: 999,
                    backgroundColor: '#FE2C55',
                  }}
                />
                <Title style={{ fontSize: 16.5, fontWeight: '900', color: palette.textPrimary }}>
                  Customer Reviews ({totalReviews})
                </Title>
              </View>
              <Button
                mode="outlined"
                compact
                textColor="#FE2C55"
                style={{ borderColor: '#FE2C55', borderRadius: 20 }}
                onPress={() => setCommentModalVisible(true)}
                icon="pencil"
              >
                Write Review
              </Button>
            </View>

            {/* Rating Star Breakdown */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 20,
                marginBottom: 14,
                backgroundColor: palette.glassInput,
                padding: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: palette.border,
              }}
            >
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 34, fontWeight: '900', color: palette.textPrimary }}>
                  {avgRating}
                </Text>
                <Text style={{ fontSize: 11, color: '#F59E0B', fontWeight: '700' }}>
                  ⭐⭐⭐⭐⭐
                </Text>
                <Text style={{ fontSize: 11, color: palette.textSecondary, marginTop: 2 }}>
                  {totalReviews} ratings
                </Text>
              </View>

              <View style={{ flex: 1, gap: 5 }}>
                {[5, 4, 3, 2, 1].map((stars: number) => {
                  const count = localReviews.filter(
                    (r: ReviewItem) => Math.round(r.rating) === stars
                  ).length;
                  const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <View
                      key={stars}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    >
                      <Text style={{ fontSize: 11.5, fontWeight: '700', color: palette.textSecondary, width: 12 }}>
                        {stars}
                      </Text>
                      <View
                        style={{
                          flex: 1,
                          height: 7,
                          backgroundColor: palette.border,
                          borderRadius: 4,
                          overflow: 'hidden',
                        }}
                      >
                        <View
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            backgroundColor: '#F59E0B',
                            borderRadius: 4,
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Customer Comments */}
            {localReviews.map((rev: ReviewItem, idx: number) => (
              <View
                key={idx}
                style={{
                  paddingVertical: 11,
                  borderBottomWidth: idx === localReviews.length - 1 ? 0 : 1,
                  borderBottomColor: palette.border,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 13.5, fontWeight: '800', color: palette.textPrimary }}>
                    {rev.reviewerName}
                  </Text>
                  <Text style={{ fontSize: 11, color: palette.textMuted }}>{rev.date}</Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginVertical: 3,
                  }}
                >
                  <Text style={{ fontSize: 11, color: '#F59E0B' }}>
                    {'⭐'.repeat(Math.max(1, Math.round(rev.rating)))}
                  </Text>
                  <Text style={{ fontSize: 10.5, color: palette.success, fontWeight: '700' }}>
                    Verified Purchase
                  </Text>
                </View>
                <Text style={{ fontSize: 12.5, color: palette.textSecondary, marginTop: 4, lineHeight: 18 }}>
                  {rev.comment}
                </Text>
              </View>
            ))}
          </Card>

          {/* ==================== 2. YOU MIGHT ALSO LIKE (INFINITE FULL-WIDTH GRID) ==================== */}
          <View
            style={{
              marginTop: 22,
              paddingHorizontal: isMobile ? edgePaddingX : 0,
              width: '100%',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 4,
                    height: 18,
                    borderRadius: 999,
                    backgroundColor: '#FE2C55',
                  }}
                />
                <Title
                  style={{
                    fontSize: 17,
                    fontWeight: '900',
                    color: palette.textPrimary,
                  }}
                >
                  You Might Also Like
                </Title>
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginHorizontal: -gridHalfGap,
              }}
            >
              {recommendedProducts.map((item: Product) => {
                const p = evaluateProductPromotions(
                  item as unknown as MarketplaceProduct,
                  flashSchedules,
                  nowMs
                );
                const itemWishlisted = wishlistIds.has(item.id);

                return (
                  <View
                    key={`rec-card-${item.id}`}
                    style={{
                      width: recCardSlotWidth,
                      padding: gridHalfGap,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => router.push(`/(app)/(tabs)/product/${item.id}` as any)}
                      activeOpacity={0.88}
                      style={[
                        {
                          width: '100%',
                          backgroundColor: palette.glassSurface,
                          borderRadius: 18,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: palette.border,
                          ...(Platform.OS === 'web'
                            ? ({ boxShadow: '0 8px 22px rgba(15, 23, 42, 0.05)' } as any)
                            : {
                                elevation: 2,
                                shadowColor: '#0F172A',
                                shadowOffset: { width: 0, height: 3 },
                                shadowOpacity: 0.05,
                                shadowRadius: 8,
                              }),
                        },
                        webGlassStyle,
                      ]}
                    >
                      {/* Product Image + Discount Badge + Wishlist Heart Icon */}
                      <View
                        style={{
                          width: '100%',
                          height: isDesktop ? 168 : isTablet ? 152 : 142,
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

                        {/* Discount / Flash Sale Badge */}
                        {p.isFlashSale ? (
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
                              gap: 2,
                            }}
                          >
                            <MaterialCommunityIcons name="lightning-bolt" size={11} color="#FFFFFF" />
                            <Text style={{ color: '#FFFFFF', fontSize: 9.5, fontWeight: '900' }}>
                              -{p.effectiveDiscountPercentage}%
                            </Text>
                          </View>
                        ) : p.hasDiscount ? (
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
                            <Text style={{ color: '#FFFFFF', fontSize: 9.5, fontWeight: '900' }}>
                              -{p.effectiveDiscountPercentage}%
                            </Text>
                          </View>
                        ) : null}

                        {/* Heart Icon for Adding / Removing from Wishlist */}
                        <TouchableOpacity
                          activeOpacity={0.78}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            toggleProductWishlist(item);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={
                            itemWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'
                          }
                          style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: palette.isDark
                              ? 'rgba(15, 23, 42, 0.78)'
                              : 'rgba(255, 255, 255, 0.92)',
                            borderWidth: 1,
                            borderColor: palette.border,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <MaterialCommunityIcons
                            name={itemWishlisted ? 'heart' : 'heart-outline'}
                            size={18}
                            color={itemWishlisted ? '#FE2C55' : palette.textSecondary}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Card Details */}
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

                        {/* Current Selling Price (₱), Original Strikethrough Price & Discount % */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 5,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: isSmallPhone ? 14.5 : 15.5,
                              fontWeight: '900',
                              color: '#FE2C55',
                            }}
                          >
                            ₱{p.effectivePrice.toFixed(2)}
                          </Text>
                          {p.hasDiscount && (
                            <>
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: palette.textMuted,
                                  textDecorationLine: 'line-through',
                                  fontWeight: '600',
                                }}
                              >
                                ₱{p.originalPrice.toFixed(2)}
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
                                  -{p.effectiveDiscountPercentage}%
                                </Text>
                              </View>
                            </>
                          )}
                        </View>

                        {/* Promotional Badges */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                          {p.isFlashSale && (
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
                          {p.isFreeShipping && (
                            <View
                              style={{
                                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 6,
                              }}
                            >
                              <Text
                                style={{ fontSize: 9.5, fontWeight: '800', color: palette.success }}
                              >
                                Free Shipping
                              </Text>
                            </View>
                          )}
                          {p.isCodAvailable && (
                            <View
                              style={{
                                backgroundColor: palette.accentSoft,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 6,
                              }}
                            >
                              <Text
                                style={{ fontSize: 9.5, fontWeight: '700', color: palette.accent }}
                              >
                                COD
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Rating & Sold Count */}
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: isSmallPhone ? 10.5 : 11,
                            color: palette.textSecondary,
                            fontWeight: '600',
                            marginTop: 1,
                          }}
                        >
                          ⭐ {item.rating.toFixed(1)} | {p.soldFormatted}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {/* Infinite Scroll Footer: Loading Indicator, Load More Fallback Button, or End-of-List Message */}
            <View style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
              {loadingMoreRec ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color="#FE2C55" />
                  <Text style={{ fontSize: 12.5, color: palette.textSecondary, fontWeight: '600' }}>
                    Loading more recommendations...
                  </Text>
                </View>
              ) : hasMoreRec ? (
                <Button
                  mode="outlined"
                  onPress={() => loadMoreRecommendations(product, false)}
                  textColor="#FE2C55"
                  style={{ borderColor: '#FE2C55', borderRadius: 20 }}
                  contentStyle={{ paddingHorizontal: 12 }}
                >
                  Load More
                </Button>
              ) : recommendedProducts.length > 0 ? (
                <Text style={{ fontSize: 12, fontWeight: '700', color: palette.textMuted }}>
                  You have reached the end of recommended products.
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* MOBILE STICKY BOTTOM ACTION BAR */}
      {isMobile && (
        <View
          style={[
            {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 10,
              paddingTop: 8,
              paddingBottom: bottomSafePadding,
              backgroundColor: palette.glassNav,
              borderTopWidth: 1,
              borderTopColor: palette.border,
              elevation: 10,
              zIndex: 20,
            },
            webGlassStyle,
          ]}
        >
          <TouchableOpacity
            onPress={() => router.push('/(app)/(tabs)/home' as any)}
            style={{ alignItems: 'center', paddingHorizontal: 8 }}
          >
            <MaterialCommunityIcons
              name="storefront-outline"
              size={22}
              color={palette.textSecondary}
            />
            <Text style={{ fontSize: 10, fontWeight: '600', color: palette.textSecondary }}>
              Store
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggleProductWishlist(product)}
            style={{ alignItems: 'center', paddingHorizontal: 8 }}
          >
            <MaterialCommunityIcons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={isLiked ? '#FE2C55' : palette.textSecondary}
            />
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: isLiked ? '#FE2C55' : palette.textSecondary,
              }}
            >
              {isLiked ? 'Saved' : 'Wishlist'}
            </Text>
          </TouchableOpacity>

          <View style={{ flex: 1, flexDirection: 'row', gap: 8, marginLeft: 6 }}>
            <Button
              mode="outlined"
              onPress={() => handleAddToCart(false)}
              disabled={product.stock <= 0}
              style={{ flex: 1, borderColor: '#FE2C55', borderRadius: 20 }}
              contentStyle={{ height: 42 }}
              textColor="#FE2C55"
              labelStyle={{ fontSize: isSmallPhone ? 11 : 12, fontWeight: '800' }}
            >
              Add to Cart
            </Button>

            <Button
              mode="contained"
              onPress={() => handleAddToCart(true)}
              disabled={product.stock <= 0}
              style={[{ flex: 1, borderRadius: 20 }, webPrimaryButtonGradient]}
              contentStyle={{ height: 42 }}
              buttonColor="#FE2C55"
              textColor="#FFFFFF"
              labelStyle={{ fontSize: isSmallPhone ? 11 : 12, fontWeight: '800' }}
            >
              Buy Now
            </Button>
          </View>
        </View>
      )}

      {/* MODALS & DIALOGS */}
      <Modal visible={zoomModalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.92)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <IconButton
            icon="close"
            size={28}
            iconColor="#FFFFFF"
            style={{ position: 'absolute', top: 40, right: 20, zIndex: 10 }}
            onPress={() => setZoomModalVisible(false)}
          />
          <Image
            source={{ uri: images[selectedImageIndex] }}
            style={{ width: Math.min(width * 0.92, 640), height: Math.min(width * 0.92, 640) }}
            resizeMode="contain"
          />
        </View>
      </Modal>

      <Portal>
        <Dialog
          visible={shippingModalVisible}
          onDismiss={() => setShippingModalVisible(false)}
          style={{
            backgroundColor: palette.glassModal,
            maxWidth: 460,
            alignSelf: 'center',
            width: '92%',
            borderRadius: 22,
          }}
        >
          <Dialog.Title style={{ color: palette.textPrimary, fontWeight: '900' }}>
            Shipping Information
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ fontSize: 13.5, lineHeight: 21, color: palette.textSecondary }}>
              🚚{' '}
              <Text style={{ fontWeight: '800', color: palette.textPrimary }}>
                {promo.isFreeShipping ? 'Free Standard Delivery' : 'Standard Delivery (₱4.99)'}
              </Text>
              {'\n'}
              {product.shippingInformation || 'Orders process within 24 hours.'} Estimated delivery
              window: {deliveryWindow}.{'\n\n'}
              📦 Tracking numbers will be generated upon dispatch.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor="#FE2C55" onPress={() => setShippingModalVisible(false)}>
              Got It
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={protectionModalVisible}
          onDismiss={() => setProtectionModalVisible(false)}
          style={{
            backgroundColor: palette.glassModal,
            maxWidth: 460,
            alignSelf: 'center',
            width: '92%',
            borderRadius: 22,
          }}
        >
          <Dialog.Title style={{ color: palette.textPrimary, fontWeight: '900' }}>
            Product & Payment Protection
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ fontSize: 13.5, lineHeight: 21, color: palette.textSecondary }}>
              🛡️{' '}
              <Text style={{ fontWeight: '800', color: palette.textPrimary }}>
                Buyer Protection Policy
              </Text>
              {'\n'}- Money-back refund guarantee if the item is damaged or not as described.{'\n'}-{' '}
              {product.returnPolicy || '7-Day return period for eligible products.'}
              {'\n\n'}
              💵{' '}
              <Text style={{ fontWeight: '800', color: palette.textPrimary }}>
                Cash on Delivery (COD)
              </Text>
              {'\n'}
              {promo.isCodAvailable
                ? 'Pay directly in cash to the courier upon parcel arrival.'
                : 'Prepaid online payment required for this item.'}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor="#FE2C55" onPress={() => setProtectionModalVisible(false)}>
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={commentModalVisible}
          onDismiss={() => setCommentModalVisible(false)}
          style={{
            backgroundColor: palette.glassModal,
            maxWidth: 460,
            alignSelf: 'center',
            width: '92%',
            borderRadius: 22,
          }}
        >
          <Dialog.Title style={{ color: palette.textPrimary, fontWeight: '900' }}>
            Write a Review
          </Dialog.Title>
          <Dialog.Content>
            <Text
              style={{
                fontSize: 12.5,
                fontWeight: '700',
                color: palette.textSecondary,
                marginBottom: 6,
              }}
            >
              Rating
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
              {[1, 2, 3, 4, 5].map((star: number) => (
                <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                  <MaterialCommunityIcons
                    name={star <= userRating ? 'star' : 'star-outline'}
                    size={30}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              mode="outlined"
              label="Your Comment / Feedback"
              placeholder="How was the product quality and delivery?"
              value={userComment}
              onChangeText={setUserComment}
              textColor={palette.textPrimary}
              outlineColor={palette.border}
              activeOutlineColor="#FE2C55"
              style={{ backgroundColor: palette.glassInput }}
              multiline
              numberOfLines={3}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={palette.textSecondary} onPress={() => setCommentModalVisible(false)}>
              Cancel
            </Button>
            <Button textColor="#FE2C55" onPress={handleSubmitComment}>
              Submit
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Toast Banner */}
      {toastMessage && (
        <View
          style={{
            position: 'absolute',
            bottom: isMobile ? bottomSafePadding + 68 : 32,
            alignSelf: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            paddingHorizontal: 20,
            paddingVertical: 11,
            borderRadius: 999,
            elevation: 8,
            zIndex: 30,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' }}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}