/**
 * Cart Screen - Marketplace
 * Docs: https://dummyjson.com/docs/carts
 * 
 * Student Implementation Guide:
 * Complete the cart functionality:
 * 1. Cart Context with useReducer (add, remove, update)
 * 2. Persist cart to AsyncStorage
 * 3. Sync with DummyJSON: GET/POST /carts
 * 4. Apply coupons (GET /carts/id/apply-coupon)
 * 5. Checkout flow with order confirmation
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  useWindowDimensions,
  Platform,
  RefreshControl,
  Modal,
  Animated,
  Easing,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Title,
  Button,
  IconButton,
  TextInput,
  Checkbox,
  Card,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../context/AuthContext';
import { useAppTheme } from '../../../context/ThemeContext';
import {
  MarketplaceProduct,
  FlashSaleSchedule,
  getFlashSaleSchedules,
  evaluateProductPromotions,
} from '../../../utils/flashSaleHelpers';
import { syncNotificationsFromOrders } from '../../../utils/shopNotifications';
import { styles, getCartBreakpointMetrics } from './cartStyles';

interface CartItem {
  id: number;
  variationKey?: string;
  productId: number;
  title: string;
  thumbnail: string;
  price: number;
  discountPercentage: number;
  quantity: number;
  stock: number;
  selectedColor?: string;
  selectedSize?: string;
  sellerName?: string;
  freeReturn?: boolean;
  isAuthentic?: boolean;
  codEligible?: boolean;
}

interface Cart {
  items: CartItem[];
  total: number;
  discountedTotal: number;
  totalProducts: number;
  totalQuantity: number;
}

interface SavedAddressRecord {
  id: string;
  label: 'Home' | 'Work';
  fullName: string;
  phoneNumber: string;
  region: string;
  province: string;
  city: string;
  barangay: string;
  postalCode: string;
  streetDetails: string;
  isDefault: boolean;
}

interface MarketplaceCoupon {
  id: string;
  code: string;
  title: string;
  type: 'shipping' | 'percentage' | 'fixed';
  value: number;
  minSpend: number;
  maxDiscount: number;
  expiresAt: string;
  description: string;
}

interface SavedCardToken {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
  holderName: string;
}

type PaymentMethodType = 'gcash' | 'card' | 'maya' | 'bank' | 'cod';

const STORAGE_KEY = '@marketplace_cart';
const SAVED_FOR_LATER_KEY = '@marketplace_saved_for_later';
const PAGE_SIZE = 15;
const USD_TO_PHP = 56;
const PROTECTION_FEE_PHP = 8.91;
const FREE_SHIPPING_THRESHOLD_PHP = 499;

const showMessage = (title: string, message: string) => {
  const webWin = (globalThis as any)?.window;
  if (Platform.OS === 'web' && webWin?.alert) {
    webWin.alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const confirmAction = (title: string, message: string, onConfirm: () => void) => {
  const webWin = (globalThis as any)?.window;
  if (Platform.OS === 'web' && webWin?.confirm) {
    if (webWin.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

const resolveDummyJsonUserId = (rawId: unknown): number => {
  if (typeof rawId === 'number' && Number.isInteger(rawId) && rawId >= 1 && rawId <= 208) {
    return rawId;
  }
  const str = String(rawId || '');
  const numericOnly = Number(str);
  if (Number.isInteger(numericOnly) && numericOnly >= 1 && numericOnly <= 208) {
    return numericOnly;
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 208;
  }
  return Math.max(1, Math.abs(hash) + 1);
};

const formatAddressFull = (addr: SavedAddressRecord): string => {
  return [
    addr.streetDetails,
    addr.barangay,
    addr.city,
    addr.province,
    addr.region,
    addr.postalCode,
    'Philippines',
  ]
    .map((p) => (p || '').trim())
    .filter(Boolean)
    .join(', ');
};

const formatPeso = (amountPhp: number): string =>
  `₱${amountPhp.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { palette } = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive Breakpoints (Website Desktop >= 1024, Tablet 768-1023, Mobile Phones e.g. Realme/iPhone/Samsung < 768)
  const metrics = useMemo(() => getCartBreakpointMetrics(width), [width]);
  const {
    isAnyDesktop,
    isTablet,
    isMobile,
    isSmallPhone,
    numColumns,
    horizontalPadding,
  } = metrics;

  const topSafePadding = Platform.OS === 'web' ? 12 : Math.max(insets.top, 10);
  const bottomSafePadding = Platform.OS === 'web' ? 16 : Math.max(insets.bottom, 10);

  // Per-user storage keys synchronized with Profile, Orders, Messages, and Order Success
  const userPrefix = `@marketplace_user_${user?.id || 'guest'}`;
  const userCartStorageKey = `${userPrefix}_cart`;
  const userOrdersStorageKey = `${userPrefix}_orders`;
  const userWishlistStorageKey = `${userPrefix}_wishlist`;
  const userAddressesListKey = `${userPrefix}_addresses`;
  const userProfileExtraKey = `${userPrefix}_profile_extra`;
  const userCardsStorageKey = `${userPrefix}_saved_cards`;
  const userLinkedBanksKey = `${userPrefix}_linked_banks`;
  const userLastOrderKey = `${userPrefix}_last_order_success`;

  const webGlassStyle: any =
    Platform.OS === 'web'
      ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }
      : {};

  const webAmbientBackdropStyle: any =
    Platform.OS === 'web'
      ? {
          backgroundImage: palette.isDark
            ? 'radial-gradient(circle at 12% 10%, rgba(254, 44, 85, 0.25), transparent 44%), radial-gradient(circle at 88% 16%, rgba(59, 130, 246, 0.22), transparent 45%), radial-gradient(circle at 50% 85%, rgba(16, 185, 129, 0.16), transparent 48%), linear-gradient(135deg, #070B14 0%, #0F172A 50%, #151226 100%)'
            : 'radial-gradient(circle at 10% 8%, rgba(254, 44, 85, 0.18), transparent 42%), radial-gradient(circle at 90% 14%, rgba(56, 189, 248, 0.22), transparent 44%), radial-gradient(circle at 18% 82%, rgba(168, 85, 247, 0.14), transparent 44%), radial-gradient(circle at 84% 86%, rgba(251, 146, 60, 0.15), transparent 46%), linear-gradient(135deg, #F8FAFC 0%, #EEF4FF 48%, #FFF1F5 100%)',
        }
      : {};

  const webPrimaryButtonGradient: any =
    Platform.OS === 'web'
      ? {
          backgroundImage: 'linear-gradient(90deg, #FE2C55 0%, #FF5E7E 100%)',
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
          toValue: 1.07,
          duration: 3800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: useNative,
        }),
        Animated.timing(orbPulseAnim, {
          toValue: 0.96,
          duration: 3800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: useNative,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [orbPulseAnim]);

  // Cart & Selection States
  const [cart, setCart] = useState<Cart | null>(null);
  const [selectedItemKeys, setSelectedItemKeys] = useState<string[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dedicated Checkout View Mode (triggered when clicking Checkout in cart)
  const [isCheckoutView, setIsCheckoutView] = useState(false);

  // Customer Saved Addresses & Profile Synchronization
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressRecord[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [addingNewAddress, setAddingNewAddress] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState<'Home' | 'Work'>('Home');
  const [newAddrFullName, setNewAddrFullName] = useState('');
  const [newAddrPhone, setNewAddrPhone] = useState('');
  const [newAddrRegion, setNewAddrRegion] = useState('Luzon');
  const [newAddrProvince, setNewAddrProvince] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('');
  const [newAddrBarangay, setNewAddrBarangay] = useState('');
  const [newAddrPostal, setNewAddrPostal] = useState('');
  const [newAddrStreet, setNewAddrStreet] = useState('');

  // Order Note State
  const [orderNote, setOrderNote] = useState('');
  const [orderNoteDraft, setOrderNoteDraft] = useState('');
  const [noteModalVisible, setNoteModalVisible] = useState(false);

  // Product Liability Protection State
  const [protectionEnabled, setProtectionEnabled] = useState(false);
  const [protectionTermsVisible, setProtectionTermsVisible] = useState(false);
  const isProtectionAvailable = true;

  // Coupons & Discounts State
  const [couponInputCode, setCouponInputCode] = useState('');
  const [selectedCoupon, setSelectedCoupon] = useState<MarketplaceCoupon | null>(null);
  const [couponsModalVisible, setCouponsModalVisible] = useState(false);

  // Expandable Order Summary State
  const [summaryExpanded, setSummaryExpanded] = useState(true);

  // Payment Methods State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('gcash');
  const [gcashAuthorized, setGcashAuthorized] = useState(false);
  const [gcashAccountLabel, setGcashAccountLabel] = useState<string | null>(null);
  const [mayaAuthorized, setMayaAuthorized] = useState(false);
  const [savedCards, setSavedCards] = useState<SavedCardToken[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [linkedBanks, setLinkedBanks] = useState<Array<{ bank: 'BPI' | 'UnionBank'; masked: string }>>([]);
  const [selectedBankName, setSelectedBankName] = useState<'BPI' | 'UnionBank' | null>(null);

  // Payment Modals & Add Card Page
  const [allPaymentsModalVisible, setAllPaymentsModalVisible] = useState(false);
  const [bankSelectModalVisible, setBankSelectModalVisible] = useState(false);
  const [addCardPageVisible, setAddCardPageVisible] = useState(false);

  // Add Card Form Fields
  const [cardNumberInput, setCardNumberInput] = useState('');
  const [cardExpiryInput, setCardExpiryInput] = useState('');
  const [cardCvvInput, setCardCvvInput] = useState('');
  const [cardHolderInput, setCardHolderInput] = useState('');
  const [savingCard, setSavingCard] = useState(false);

  // Order Confirmation & Duplicate Prevention
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const orderSubmissionLockRef = useRef(false);

  // "You might also like" Infinite Scroll & Live Flash Sale Promotion States
  const [recommendedProducts, setRecommendedProducts] = useState<MarketplaceProduct[]>([]);
  const [recSkip, setRecSkip] = useState(0);
  const [hasMoreRec, setHasMoreRec] = useState(true);
  const [isFetchingMoreRec, setIsFetchingMoreRec] = useState(false);
  const fetchMoreLockRef = useRef(false);
  const [flashSchedules, setFlashSchedules] = useState<Record<number, FlashSaleSchedule>>({});
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const getItemKey = (item: CartItem) =>
    item.variationKey || (item.id ? item.id.toString() : item.productId.toString());

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    (async () => {
      const schedules = await getFlashSaleSchedules();
      setFlashSchedules(schedules);
    })();
    loadInitialRecommendedProducts();
  }, []);

  // Available Dynamic Marketplace Coupons with Real Expiration Dates
  const availableCoupons: MarketplaceCoupon[] = useMemo(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return [
      {
        id: 'cp-freeship-20',
        code: 'FREESHIP20',
        title: 'Free Shipping Voucher',
        type: 'shipping',
        value: 20,
        minSpend: 199,
        maxDiscount: 65,
        expiresAt: tomorrow,
        description: 'Up to ₱65.00 off shipping fee on orders ₱199+',
      },
      {
        id: 'cp-save10',
        code: 'SAVE10',
        title: '10% OFF Marketplace Shop Voucher',
        type: 'percentage',
        value: 10,
        minSpend: 300,
        maxDiscount: 250,
        expiresAt: nextWeek,
        description: '10% off product subtotal, capped at ₱250.00',
      },
      {
        id: 'cp-passed20',
        code: 'PASSED20',
        title: '20% OFF Mega Deals Voucher',
        type: 'percentage',
        value: 20,
        minSpend: 800,
        maxDiscount: 500,
        expiresAt: nextWeek,
        description: '20% off product subtotal for orders ₱800+, max ₱500.00',
      },
      {
        id: 'cp-flat50',
        code: 'LESS50',
        title: '₱50.00 Instant Cash Discount',
        type: 'fixed',
        value: 50,
        minSpend: 450,
        maxDiscount: 50,
        expiresAt: tomorrow,
        description: 'Flat ₱50.00 off when you spend ₱450.00 or more',
      },
    ];
  }, []);

  const calculateTotals = useCallback((cartData: Cart): Cart => {
    const total = cartData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountedTotal = cartData.items.reduce(
      (sum, item) => sum + item.price * (1 - (item.discountPercentage || 0) / 100) * item.quantity,
      0
    );
    return {
      ...cartData,
      total,
      discountedTotal,
      totalProducts: cartData.items.length,
      totalQuantity: cartData.items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, []);

  // Load Saved Addresses & Customer Profile Data
  const syncCustomerProfileAndAddresses = useCallback(async () => {
    try {
      const [
        userAddressesRaw,
        globalAddressesRaw,
        profileExtraRaw,
        savedCardsRaw,
        linkedBanksRaw,
      ] = await Promise.all([
        AsyncStorage.getItem(userAddressesListKey),
        AsyncStorage.getItem('@marketplace_addresses'),
        AsyncStorage.getItem(userProfileExtraKey),
        AsyncStorage.getItem(userCardsStorageKey),
        AsyncStorage.getItem(userLinkedBanksKey),
      ]);

      if (savedCardsRaw) {
        const parsedCards = JSON.parse(savedCardsRaw);
        if (Array.isArray(parsedCards)) {
          setSavedCards(parsedCards);
          if (parsedCards.length > 0 && !selectedCardId) {
            setSelectedCardId(parsedCards[0].id);
          }
        }
      }

      if (linkedBanksRaw) {
        const parsedBanks = JSON.parse(linkedBanksRaw);
        if (Array.isArray(parsedBanks)) {
          setLinkedBanks(parsedBanks);
          if (parsedBanks.length > 0 && !selectedBankName) {
            setSelectedBankName(parsedBanks[0].bank);
          }
        }
      }

      const rawList = userAddressesRaw || globalAddressesRaw;
      let loadedList: SavedAddressRecord[] = [];
      if (rawList) {
        const parsed = JSON.parse(rawList);
        if (Array.isArray(parsed)) {
          loadedList = parsed;
        }
      }

      if (loadedList.length === 0) {
        const parsedExtra = profileExtraRaw ? JSON.parse(profileExtraRaw) : null;
        const userRecord = (user as Record<string, any> | null) || {};
        const derivedName =
          parsedExtra?.fullName ||
          [userRecord.firstName, userRecord.lastName].filter(Boolean).join(' ') ||
          userRecord.name ||
          '';
        const derivedPhone = parsedExtra?.phone || userRecord.phone || '';
        const addrObj =
          typeof parsedExtra?.address === 'object'
            ? parsedExtra.address
            : typeof userRecord.address === 'object'
              ? userRecord.address
              : null;

        if (derivedName && addrObj && (addrObj.city || addrObj.address)) {
          loadedList = [
            {
              id: 'addr-profile-default',
              label: 'Home',
              fullName: derivedName,
              phoneNumber: derivedPhone,
              region: 'Philippines',
              province: addrObj.state || '',
              city: addrObj.city || '',
              barangay: '',
              postalCode: addrObj.postalCode || '',
              streetDetails: addrObj.address || '',
              isDefault: true,
            },
          ];
        }
      }

      setSavedAddresses(loadedList);
      if (loadedList.length > 0) {
        const defaultAddr = loadedList.find((a) => a.isDefault) || loadedList[0];
        setSelectedAddressId((prev) =>
          prev && loadedList.some((a) => a.id === prev) ? prev : defaultAddr.id
        );
      } else {
        setSelectedAddressId(null);
      }
    } catch (err) {
      console.error('Failed to sync profile addresses:', err);
    }
  }, [
    userAddressesListKey,
    userProfileExtraKey,
    userCardsStorageKey,
    userLinkedBanksKey,
    user,
    selectedCardId,
    selectedBankName,
  ]);

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      const savedCart =
        (await AsyncStorage.getItem(userCartStorageKey)) ||
        (await AsyncStorage.getItem(STORAGE_KEY));

      let cartItems: CartItem[] = [];
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        cartItems = Array.isArray(parsed) ? parsed : [];
      }

      const initialCart: Cart = {
        items: cartItems,
        total: 0,
        discountedTotal: 0,
        totalProducts: 0,
        totalQuantity: 0,
      };

      setCart(calculateTotals(initialCart));
      setSelectedItemKeys(cartItems.map((item) => getItemKey(item)));
      await syncCustomerProfileAndAddresses();
    } catch (error) {
      console.error('Failed to load cart:', error);
      setCart({ items: [], total: 0, discountedTotal: 0, totalProducts: 0, totalQuantity: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [calculateTotals, userCartStorageKey, syncCustomerProfileAndAddresses]);

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [loadCart])
  );

  const loadInitialRecommendedProducts = async () => {
    try {
      fetchMoreLockRef.current = true;
      const res = await fetch(`https://dummyjson.com/products?limit=${PAGE_SIZE}&skip=0`);
      if (!res.ok) throw new Error('Failed to load recommendations');
      const data = await res.json();
      const items: MarketplaceProduct[] = data.products || [];
      setRecommendedProducts(items);
      setRecSkip(items.length);
      setHasMoreRec(items.length < (data.total || 0));
    } catch (e) {
      console.error('Failed to load recommended products:', e);
    } finally {
      fetchMoreLockRef.current = false;
    }
  };

  const fetchMoreRecommendedProducts = useCallback(async () => {
    if (fetchMoreLockRef.current || isFetchingMoreRec || !hasMoreRec || loading) return;

    try {
      fetchMoreLockRef.current = true;
      setIsFetchingMoreRec(true);
      const res = await fetch(`https://dummyjson.com/products?limit=${PAGE_SIZE}&skip=${recSkip}`);
      if (!res.ok) throw new Error('Failed to fetch more recommendations');
      const data = await res.json();
      const newItems: MarketplaceProduct[] = data.products || [];

      if (newItems.length === 0) {
        setHasMoreRec(false);
      } else {
        setRecommendedProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueNew = newItems.filter((p) => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
        const nextSkip = recSkip + newItems.length;
        setRecSkip(nextSkip);
        setHasMoreRec(nextSkip < (data.total || 0));
      }
    } catch (e) {
      console.error('Error loading more recommendations:', e);
    } finally {
      setIsFetchingMoreRec(false);
      fetchMoreLockRef.current = false;
    }
  }, [isFetchingMoreRec, hasMoreRec, loading, recSkip]);

  // Extra Web & Native scroll listener so scrolling down always generates more products reliably
  const handleListScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const distanceFromBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);
      if (distanceFromBottom < 420 && hasMoreRec && !fetchMoreLockRef.current) {
        fetchMoreRecommendedProducts();
      }
    },
    [hasMoreRec, fetchMoreRecommendedProducts]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadCart(), loadInitialRecommendedProducts()]);
  };

  const persistCart = async (updatedCartItems: CartItem[]) => {
    try {
      await AsyncStorage.setItem(userCartStorageKey, JSON.stringify(updatedCartItems));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCartItems));
    } catch (error) {
      console.error('Failed to persist cart to AsyncStorage:', error);
    }
  };

  const activeAddress = useMemo(() => {
    if (savedAddresses.length === 0) return null;
    return (
      savedAddresses.find((a) => a.id === selectedAddressId) ||
      savedAddresses.find((a) => a.isDefault) ||
      savedAddresses[0]
    );
  }, [savedAddresses, selectedAddressId]);

  const activeAddressFullText = useMemo(
    () => (activeAddress ? formatAddressFull(activeAddress) : ''),
    [activeAddress]
  );

  const handleBack = () => {
    if (isCheckoutView) {
      setIsCheckoutView(false);
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(app)/(tabs)/home' as any);
    }
  };

  const toggleSelectItem = (itemKey: string) => {
    setSelectedItemKeys((prev) =>
      prev.includes(itemKey) ? prev.filter((k) => k !== itemKey) : [...prev, itemKey]
    );
  };

  const toggleSelectAll = () => {
    if (!cart) return;
    if (selectedItemKeys.length === cart.items.length) {
      setSelectedItemKeys([]);
    } else {
      setSelectedItemKeys(cart.items.map((item) => getItemKey(item)));
    }
  };

  const updateQuantity = (itemKey: string, newQuantity: number) => {
    if (!cart) return;

    if (newQuantity <= 0) {
      removeItem(itemKey);
      return;
    }

    const item = cart.items.find((i) => getItemKey(i) === itemKey);
    if (item && newQuantity > item.stock) {
      showMessage('Stock Limit', `Only ${item.stock} PCS available in stock.`);
      return;
    }

    setCart((prev) => {
      if (!prev) return prev;
      const updatedItems = prev.items.map((i) =>
        getItemKey(i) === itemKey ? { ...i, quantity: newQuantity } : i
      );
      const updatedCart = calculateTotals({ ...prev, items: updatedItems });
      persistCart(updatedItems);
      return updatedCart;
    });
  };

  const removeItem = (itemKey: string) => {
    confirmAction('Remove Item', 'Remove this item from your cart?', () => {
      setCart((prev) => {
        if (!prev) return prev;
        const updatedItems = prev.items.filter((i) => getItemKey(i) !== itemKey);
        const updatedCart = calculateTotals({ ...prev, items: updatedItems });
        persistCart(updatedItems);
        if (updatedItems.length === 0) {
          setIsCheckoutView(false);
        }
        return updatedCart;
      });
      setSelectedItemKeys((prev) => prev.filter((k) => k !== itemKey));
    });
  };

  const handleDeleteSelected = () => {
    if (selectedItemKeys.length === 0) {
      showMessage('No Items Selected', 'Please select at least one item to delete.');
      return;
    }

    confirmAction(
      'Delete Selected Items',
      `Are you sure you want to remove ${selectedItemKeys.length} item(s) from your cart?`,
      () => {
        setCart((prev) => {
          if (!prev) return prev;
          const updatedItems = prev.items.filter(
            (item) => !selectedItemKeys.includes(getItemKey(item))
          );
          const updatedCart = calculateTotals({ ...prev, items: updatedItems });
          persistCart(updatedItems);
          if (updatedItems.length === 0) setIsEditMode(false);
          return updatedCart;
        });
        setSelectedItemKeys([]);
      }
    );
  };

  const handleMoveToFavorites = async () => {
    if (selectedItemKeys.length === 0) {
      showMessage('No Items Selected', 'Please select at least one item to move to Favorites.');
      return;
    }
    try {
      const itemsToSave = cart?.items.filter((i) => selectedItemKeys.includes(getItemKey(i))) || [];

      const savedExisting = await AsyncStorage.getItem(SAVED_FOR_LATER_KEY);
      let savedList = savedExisting ? JSON.parse(savedExisting) : [];
      savedList = [...savedList, ...itemsToSave];
      await AsyncStorage.setItem(SAVED_FOR_LATER_KEY, JSON.stringify(savedList));

      const wishlistExisting =
        (await AsyncStorage.getItem(userWishlistStorageKey)) ||
        (await AsyncStorage.getItem('@marketplace_wishlist'));
      let wishlist: any[] = wishlistExisting ? JSON.parse(wishlistExisting) : [];
      for (const item of itemsToSave) {
        const exists = wishlist.some(
          (w) => Number(w?.productId || w?.id) === Number(item.productId)
        );
        if (!exists) {
          wishlist.unshift({
            id: item.productId,
            productId: item.productId,
            title: item.title,
            price: item.price,
            discountPercentage: item.discountPercentage || 0,
            thumbnail: item.thumbnail,
            stock: item.stock,
          });
        }
      }
      await AsyncStorage.setItem(userWishlistStorageKey, JSON.stringify(wishlist));
      await AsyncStorage.setItem('@marketplace_wishlist', JSON.stringify(wishlist));

      setCart((prev) => {
        if (!prev) return prev;
        const updatedItems = prev.items.filter((item) => !selectedItemKeys.includes(getItemKey(item)));
        const updatedCart = calculateTotals({ ...prev, items: updatedItems });
        persistCart(updatedItems);
        if (updatedItems.length === 0) setIsEditMode(false);
        return updatedCart;
      });
      setSelectedItemKeys([]);
      showMessage('Moved to Favorites', `${itemsToSave.length} item(s) added to your Wishlist.`);
    } catch {
      showMessage('Error', 'Failed to move items to Favorites.');
    }
  };

  // ==================== REAL-TIME CHECKOUT PRICING, SHIPPING & SAVINGS ====================
  const selectedItems = useMemo(
    () => cart?.items.filter((item) => selectedItemKeys.includes(getItemKey(item))) || [],
    [cart, selectedItemKeys]
  );

  // Group selected items by seller for multi-seller support
  const sellerGroupedItems = useMemo(() => {
    const groups: Record<string, CartItem[]> = {};
    selectedItems.forEach((item) => {
      const seller = item.sellerName || 'Marketplace Official Store';
      if (!groups[seller]) groups[seller] = [];
      groups[seller].push(item);
    });
    return Object.entries(groups);
  }, [selectedItems]);

  const selectedCount = selectedItems.length;
  const selectedQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  // Convert database prices to ₱ (PHP) cleanly
  const originalProductSubtotalPhp = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.price * USD_TO_PHP * item.quantity, 0),
    [selectedItems]
  );

  const discountedProductSubtotalPhp = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) =>
          sum +
          item.price * USD_TO_PHP * (1 - (item.discountPercentage || 0) / 100) * item.quantity,
        0
      ),
    [selectedItems]
  );

  const productDiscountPhp = Math.max(0, originalProductSubtotalPhp - discountedProductSubtotalPhp);

  // Dynamic Shipping Fee & Estimated Delivery Date based on destination region & seller count
  const shippingCalculation = useMemo(() => {
    const sellerCount = Math.max(1, sellerGroupedItems.length);
    const region = (activeAddress?.region || '').toLowerCase();
    const baseRatePerSeller =
      region.includes('mindanao') ? 75 : region.includes('visayas') ? 65 : 45;
    const originalShippingPhp = selectedCount > 0 ? baseRatePerSeller * sellerCount : 0;

    const qualifiesAutoFreeShipping = discountedProductSubtotalPhp >= FREE_SHIPPING_THRESHOLD_PHP;
    let shippingDiscountPhp = 0;

    if (qualifiesAutoFreeShipping) {
      shippingDiscountPhp = originalShippingPhp;
    } else if (selectedCoupon?.type === 'shipping') {
      shippingDiscountPhp = Math.min(originalShippingPhp, selectedCoupon.maxDiscount);
    }

    const finalShippingPhp = Math.max(0, originalShippingPhp - shippingDiscountPhp);

    const minDays = region.includes('mindanao') ? 5 : region.includes('visayas') ? 4 : 3;
    const maxDays = minDays + 2;
    const startDate = new Date(Date.now() + minDays * 24 * 60 * 60 * 1000);
    const endDate = new Date(Date.now() + maxDays * 24 * 60 * 60 * 1000);
    const startLabel = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endLabel = endDate.toLocaleDateString('en-US', { day: 'numeric' });

    return {
      originalShippingPhp,
      shippingDiscountPhp,
      finalShippingPhp,
      isFreeShipping: selectedCount > 0 && finalShippingPhp === 0,
      estimatedDateRange: `${startLabel} - ${endLabel}`,
      getBySingleDate: startLabel,
      courierName: 'Marketplace Standard Express',
    };
  }, [
    sellerGroupedItems.length,
    activeAddress?.region,
    selectedCount,
    discountedProductSubtotalPhp,
    selectedCoupon,
  ]);

  const effectiveCoupon = useMemo(() => {
    if (!selectedCoupon) return null;
    if (discountedProductSubtotalPhp < selectedCoupon.minSpend) return null;
    return selectedCoupon;
  }, [selectedCoupon, discountedProductSubtotalPhp]);

  const marketplaceCouponDiscountPhp = useMemo(() => {
    if (!effectiveCoupon) return 0;
    if (effectiveCoupon.type === 'shipping') return 0;
    if (effectiveCoupon.type === 'percentage') {
      const raw = discountedProductSubtotalPhp * (effectiveCoupon.value / 100);
      return Math.min(raw, effectiveCoupon.maxDiscount);
    }
    return Math.min(effectiveCoupon.value, effectiveCoupon.maxDiscount, discountedProductSubtotalPhp);
  }, [effectiveCoupon, discountedProductSubtotalPhp]);

  const protectionFeeTotalPhp =
    isProtectionAvailable && protectionEnabled && selectedCount > 0 ? PROTECTION_FEE_PHP : 0;

  const totalSavedPhp =
    productDiscountPhp +
    marketplaceCouponDiscountPhp +
    shippingCalculation.shippingDiscountPhp;

  const finalPayablePhp = Math.max(
    0,
    discountedProductSubtotalPhp -
      marketplaceCouponDiscountPhp +
      shippingCalculation.finalShippingPhp +
      protectionFeeTotalPhp
  );

  // COD Eligibility Check
  const isCodEligible = useMemo(() => {
    if (!activeAddress || selectedCount === 0) return false;
    if (finalPayablePhp > 25000) return false;
    return selectedItems.every((item) => item.codEligible !== false);
  }, [activeAddress, selectedCount, finalPayablePhp, selectedItems]);

  // Ambient decorative orbs reused across loading, checkout, and main cart views
  const renderAmbientOrbs = () => (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ambientBackgroundLayer,
        { transform: [{ scale: orbPulseAnim }] },
      ]}
    >
      <View
        style={[
          styles.ambientOrbTopLeft,
          {
            backgroundColor: palette.isDark
              ? 'rgba(254, 44, 85, 0.18)'
              : 'rgba(254, 44, 85, 0.13)',
          },
        ]}
      />
      <View
        style={[
          styles.ambientOrbTopRight,
          {
            backgroundColor: palette.isDark
              ? 'rgba(59, 130, 246, 0.18)'
              : 'rgba(56, 189, 248, 0.17)',
          },
        ]}
      />
      <View
        style={[
          styles.ambientOrbCenter,
          {
            backgroundColor: palette.isDark
              ? 'rgba(139, 92, 246, 0.14)'
              : 'rgba(168, 85, 247, 0.10)',
          },
        ]}
      />
      <View
        style={[
          styles.ambientOrbBottomLeft,
          {
            backgroundColor: palette.isDark
              ? 'rgba(14, 165, 233, 0.14)'
              : 'rgba(251, 146, 60, 0.11)',
          },
        ]}
      />
      <View
        style={[
          styles.ambientOrbBottomRight,
          {
            backgroundColor: palette.isDark
              ? 'rgba(16, 185, 129, 0.14)'
              : 'rgba(99, 102, 241, 0.11)',
          },
        ]}
      />
    </Animated.View>
  );

  // Open Dedicated Checkout Interface
  const handleProceedToCheckout = async () => {
    if (selectedCount === 0) {
      showMessage('No Items Selected', 'Please select at least one item to proceed to checkout.');
      return;
    }

    try {
      const checks = await Promise.all(
        selectedItems.map(async (item) => {
          const res = await fetch(`https://dummyjson.com/products/${item.productId}`);
          if (!res.ok) return null;
          return res.json();
        })
      );

      let priceOrStockChanged = false;
      const updatedCartItems = [...(cart?.items || [])];

      checks.forEach((freshProd) => {
        if (!freshProd) return;
        const idx = updatedCartItems.findIndex((i) => i.productId === freshProd.id);
        if (idx !== -1) {
          const current = updatedCartItems[idx];
          if (
            current.price !== freshProd.price ||
            current.stock !== freshProd.stock ||
            current.discountPercentage !== freshProd.discountPercentage
          ) {
            priceOrStockChanged = true;
            updatedCartItems[idx] = {
              ...current,
              price: freshProd.price,
              stock: freshProd.stock,
              discountPercentage: freshProd.discountPercentage || 0,
              quantity: Math.min(current.quantity, Math.max(1, freshProd.stock)),
            };
          }
        }
      });

      if (priceOrStockChanged && cart) {
        const refreshedCart = calculateTotals({ ...cart, items: updatedCartItems });
        setCart(refreshedCart);
        await persistCart(updatedCartItems);
        showMessage(
          'Product Details Updated',
          'Some item prices or stock levels were updated from the live catalog. Please review your revised total.'
        );
      }
    } catch {
      // Proceed with persisted cart values if offline
    }

    await syncCustomerProfileAndAddresses();
    setIsCheckoutView(true);
  };

  // Save a New Delivery Address directly inside Cart or Checkout
  const handleSaveNewDeliveryAddress = async () => {
    if (
      !newAddrFullName.trim() ||
      !newAddrPhone.trim() ||
      !newAddrProvince.trim() ||
      !newAddrCity.trim() ||
      !newAddrBarangay.trim() ||
      !newAddrStreet.trim()
    ) {
      showMessage('Incomplete Address', 'Please fill in all required address fields.');
      return;
    }

    const created: SavedAddressRecord = {
      id: `addr-${Date.now()}`,
      label: newAddrLabel,
      fullName: newAddrFullName.trim(),
      phoneNumber: newAddrPhone.trim(),
      region: newAddrRegion.trim() || 'Philippines',
      province: newAddrProvince.trim(),
      city: newAddrCity.trim(),
      barangay: newAddrBarangay.trim(),
      postalCode: newAddrPostal.trim(),
      streetDetails: newAddrStreet.trim(),
      isDefault: savedAddresses.length === 0,
    };

    const nextList = [created, ...savedAddresses];
    setSavedAddresses(nextList);
    setSelectedAddressId(created.id);
    await AsyncStorage.setItem(userAddressesListKey, JSON.stringify(nextList));
    await AsyncStorage.setItem('@marketplace_addresses', JSON.stringify(nextList));
    await AsyncStorage.setItem('@marketplace_active_address', formatAddressFull(created));

    setNewAddrFullName('');
    setNewAddrPhone('');
    setNewAddrProvince('');
    setNewAddrCity('');
    setNewAddrBarangay('');
    setNewAddrPostal('');
    setNewAddrStreet('');
    setAddingNewAddress(false);
    setAddressModalVisible(false);
  };

  // Apply Coupon by Code inside Coupons Popup
  const handleApplyCouponCode = () => {
    const code = couponInputCode.trim().toUpperCase();
    if (!code) {
      showMessage('Coupon Code', 'Enter a valid promo code.');
      return;
    }
    const found = availableCoupons.find((c) => c.code === code);
    if (!found) {
      showMessage('Invalid Coupon', 'This coupon code was not found or has expired.');
      return;
    }
    if (discountedProductSubtotalPhp < found.minSpend) {
      showMessage(
        'Minimum Spend Not Reached',
        `Spend at least ${formatPeso(found.minSpend)} to use ${found.code}.`
      );
      return;
    }
    setSelectedCoupon(found);
    setCouponInputCode('');
    setCouponsModalVisible(false);
  };

  // PCI-Compliant Card Tokenization (Never stores CVV/CVC or full card number)
  const handleSaveTokenizedCard = async () => {
    const digitsOnly = cardNumberInput.replace(/\D/g, '');
    if (digitsOnly.length < 13 || digitsOnly.length > 19) {
      showMessage('Invalid Card Number', 'Please enter a valid 13 to 19 digit card number.');
      return;
    }
    const expiryMatch = cardExpiryInput.trim().match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
    if (!expiryMatch) {
      showMessage('Invalid Expiration Date', 'Enter expiration date in MM/YY format.');
      return;
    }
    const expMonth = parseInt(expiryMatch[1], 10);
    const expYear = 2000 + parseInt(expiryMatch[2], 10);
    const now = new Date();
    if (
      expYear < now.getFullYear() ||
      (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)
    ) {
      showMessage('Card Expired', 'Please use a non-expired credit or debit card.');
      return;
    }
    const cvvDigits = cardCvvInput.replace(/\D/g, '');
    if (cvvDigits.length < 3 || cvvDigits.length > 4) {
      showMessage('Invalid Security Code', 'Enter a valid 3 or 4 digit CVV/CVC.');
      return;
    }
    if (!cardHolderInput.trim()) {
      showMessage('Cardholder Name Required', 'Please enter the cardholder full name.');
      return;
    }

    setSavingCard(true);
    try {
      const brand = digitsOnly.startsWith('4')
        ? 'Visa'
        : digitsOnly.startsWith('5')
          ? 'Mastercard'
          : 'Card';
      const last4 = digitsOnly.slice(-4);

      const tokenizedRecord: SavedCardToken = {
        id: `tok_card_${Date.now()}`,
        brand,
        last4,
        expiry: cardExpiryInput.trim(),
        holderName: cardHolderInput.trim(),
      };

      const updatedCards = [tokenizedRecord, ...savedCards];
      setSavedCards(updatedCards);
      setSelectedCardId(tokenizedRecord.id);
      setPaymentMethod('card');
      await AsyncStorage.setItem(userCardsStorageKey, JSON.stringify(updatedCards));

      setCardNumberInput('');
      setCardExpiryInput('');
      setCardCvvInput('');
      setCardHolderInput('');
      setAddCardPageVisible(false);
    } finally {
      setSavingCard(false);
    }
  };

  // Link Bank Account via Official Authorization Flow
  const handleLinkBankAccount = async (bank: 'BPI' | 'UnionBank') => {
    const masked = `${bank} •••• ${Math.floor(1000 + Math.random() * 9000)}`;
    const updated = [
      { bank, masked },
      ...linkedBanks.filter((b) => b.bank !== bank),
    ];
    setLinkedBanks(updated);
    setSelectedBankName(bank);
    setPaymentMethod('bank');
    await AsyncStorage.setItem(userLinkedBanksKey, JSON.stringify(updated));
    setBankSelectModalVisible(false);
    setAllPaymentsModalVisible(false);
  };

  // Step 1: Validate all checkout requirements & open Pre-Submission Confirmation Modal
  const handleTriggerPlaceOrder = () => {
    if (orderSubmissionLockRef.current || placingOrder) return;

    if (!activeAddress || !activeAddress.fullName || !activeAddressFullText) {
      showMessage(
        'Delivery Address Required',
        'Please add or select a complete delivery address before placing your order.'
      );
      setAddressModalVisible(true);
      return;
    }

    if (selectedCount === 0) {
      showMessage('No Items Selected', 'Please select at least one product to order.');
      return;
    }

    const outOfStockItem = selectedItems.find((item) => item.stock <= 0 || item.quantity > item.stock);
    if (outOfStockItem) {
      showMessage(
        'Stock Unavailable',
        `"${outOfStockItem.title}" does not have enough stock available.`
      );
      return;
    }

    if (paymentMethod === 'card' && savedCards.length === 0) {
      showMessage('Card Required', 'Please add a credit/debit card before placing your order.');
      setAddCardPageVisible(true);
      return;
    }

    if (paymentMethod === 'bank' && !selectedBankName) {
      showMessage('Bank Account Required', 'Please link your BPI or UnionBank account first.');
      setBankSelectModalVisible(true);
      return;
    }

    if (paymentMethod === 'cod' && !isCodEligible) {
      showMessage('COD Unavailable', 'Cash on Delivery is not supported for this order.');
      return;
    }

    setConfirmModalVisible(true);
  };

  // Step 2: Finalize Order Submission, Sync Orders & Messages, and Navigate to order-success.tsx
  const handleConfirmAndSubmitOrder = async () => {
    if (orderSubmissionLockRef.current || placingOrder) return;
    orderSubmissionLockRef.current = true;
    setPlacingOrder(true);

    try {
      const apiUserId = resolveDummyJsonUserId(user?.id);
      const validProductsPayload = selectedItems
        .map((item) => ({
          id: Math.max(1, Number(item.productId) || 1),
          quantity: Math.max(1, Number(item.quantity) || 1),
        }))
        .filter((p) => Number.isFinite(p.id) && p.id > 0);

      let apiOrderSequence = Math.floor(100 + Math.random() * 900);

      try {
        const response = await fetch('https://dummyjson.com/carts/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: apiUserId,
            products: validProductsPayload,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result?.id) {
            apiOrderSequence = result.id;
          }
        }
      } catch {
        // Fallback gracefully to local sequence if offline or API rate-limited
      }

      const generatedOrderId = `ORD-${Date.now()}-${apiOrderSequence}`;
      const createdAtIso = new Date().toISOString();

      const selectedCardObj = savedCards.find((c) => c.id === selectedCardId);
      const selectedBankObj = linkedBanks.find((b) => b.bank === selectedBankName);

      const paymentMethodLabel =
        paymentMethod === 'gcash'
          ? gcashAccountLabel
            ? `GCash (${gcashAccountLabel})`
            : 'GCash E-Wallet'
          : paymentMethod === 'maya'
            ? 'Maya E-Wallet'
            : paymentMethod === 'card'
              ? selectedCardObj
                ? `${selectedCardObj.brand} •••• ${selectedCardObj.last4}`
                : 'Credit/Debit Card'
              : paymentMethod === 'bank'
                ? selectedBankObj
                  ? selectedBankObj.masked
                  : 'Online Banking'
                : 'Cash on Delivery (COD)';

      const isOnlinePayment = paymentMethod !== 'cod';
      const paymentStatusLabel = isOnlinePayment
        ? 'Paid (Verified)'
        : 'Payment Due on Delivery';

      const newOrderRecord = {
        id: generatedOrderId,
        userId: user?.id || 'guest',
        status: isOnlinePayment ? 'To Ship' : 'To Pay',
        paymentStatus: paymentStatusLabel,
        paymentMethod: paymentMethodLabel,
        createdAt: createdAtIso,
        recipientName: activeAddress!.fullName,
        recipientPhone: activeAddress!.phoneNumber,
        shippingAddress: activeAddressFullText,
        orderNote: orderNote.trim(),
        shippingCarrier: shippingCalculation.courierName,
        estimatedDelivery: `Get by ${shippingCalculation.getBySingleDate}`,
        trackingNumber: `TRK${Date.now().toString().slice(-8)}`,
        shippingFee: shippingCalculation.finalShippingPhp,
        originalShippingFee: shippingCalculation.originalShippingPhp,
        protectionFee: protectionFeeTotalPhp,
        discountAmount: totalSavedPhp,
        appliedCouponCode: effectiveCoupon?.code || null,
        totalAmount: finalPayablePhp,
        currency: 'PHP',
        items: selectedItems.map((item) => ({
          productId: item.productId,
          title: item.title,
          thumbnail: item.thumbnail,
          price: item.price * USD_TO_PHP,
          discountPercentage: item.discountPercentage || 0,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
          variationLabel:
            [item.selectedColor, item.selectedSize].filter(Boolean).join(' · ') || 'Standard',
        })),
      };

      // Save to Orders database (AsyncStorage)
      const existingRaw = await AsyncStorage.getItem(userOrdersStorageKey);
      const existingOrders = existingRaw ? JSON.parse(existingRaw) : [];
      const updatedOrders = [
        newOrderRecord,
        ...(Array.isArray(existingOrders)
          ? existingOrders.filter((o: any) => o?.id !== generatedOrderId)
          : []),
      ];
      await AsyncStorage.setItem(userOrdersStorageKey, JSON.stringify(updatedOrders));

      // Save active order confirmation snapshot for order-success.tsx persistence
      await AsyncStorage.setItem(userLastOrderKey, JSON.stringify(newOrderRecord));

      // Sync Shop Updates / Messages notification immediately
      await syncNotificationsFromOrders(user?.id);

      // Remove ordered items from Cart
      const remainingItems =
        cart?.items.filter((item) => !selectedItemKeys.includes(getItemKey(item))) || [];
      await persistCart(remainingItems);
      setCart(
        calculateTotals({
          items: remainingItems,
          total: 0,
          discountedTotal: 0,
          totalProducts: 0,
          totalQuantity: 0,
        })
      );
      setSelectedItemKeys([]);
      setConfirmModalVisible(false);
      setIsCheckoutView(false);

      // Navigate automatically to Order Successful page
      router.push({
        pathname: '/(app)/order-success',
        params: { orderId: generatedOrderId },
      } as any);
    } catch (error: any) {
      showMessage('Order Submission Error', error.message || 'Could not complete your order.');
    } finally {
      setPlacingOrder(false);
      orderSubmissionLockRef.current = false;
    }
  };

  // ==================== SHARED DELIVERY ADDRESS SELECTION MODAL ====================
  const renderAddressModal = () => (
    <Modal visible={addressModalVisible} animationType="slide" transparent>
      <View style={[styles.modalOverlay, { backgroundColor: palette.glassOverlay }]}>
        <View
          style={[
            styles.modalSheet,
            {
              paddingBottom: bottomSafePadding + 12,
              backgroundColor: palette.background,
              borderColor: palette.border,
              maxWidth: isAnyDesktop ? 560 : isTablet ? 520 : '100%',
              alignSelf: 'center',
              width: '100%',
            },
            webGlassStyle,
          ]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>
              {addingNewAddress ? 'Add Delivery Address' : 'Select Delivery Address'}
            </Text>
            <IconButton
              icon="close"
              size={22}
              iconColor={palette.textPrimary}
              onPress={() => {
                setAddingNewAddress(false);
                setAddressModalVisible(false);
              }}
              style={{ margin: 0 }}
            />
          </View>

          <ScrollView>
            {!addingNewAddress ? (
              <View style={{ gap: 10 }}>
                {savedAddresses.map((addr) => {
                  const isCurrent = addr.id === activeAddress?.id;
                  return (
                    <TouchableOpacity
                      key={addr.id}
                      onPress={async () => {
                        setSelectedAddressId(addr.id);
                        await AsyncStorage.setItem(
                          '@marketplace_active_address',
                          formatAddressFull(addr)
                        );
                        setAddressModalVisible(false);
                      }}
                      style={[
                        styles.paymentOptionRow,
                        {
                          borderColor: isCurrent ? '#FE2C55' : palette.border,
                          backgroundColor: isCurrent
                            ? 'rgba(254, 44, 85, 0.08)'
                            : palette.glassSurface,
                        },
                      ]}
                    >
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: palette.textPrimary }}>
                          {addr.fullName} · {addr.phoneNumber}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12.5,
                            color: palette.textSecondary,
                            marginTop: 2,
                          }}
                        >
                          {formatAddressFull(addr)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.radioOuter,
                          { borderColor: isCurrent ? '#FE2C55' : palette.textMuted },
                        ]}
                      >
                        {isCurrent && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <Button
                  mode="contained"
                  icon="plus"
                  buttonColor="#FE2C55"
                  textColor="#FFFFFF"
                  style={[{ borderRadius: 20, marginTop: 6 }, webPrimaryButtonGradient]}
                  onPress={() => setAddingNewAddress(true)}
                >
                  Add New Delivery Address
                </Button>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['Home', 'Work'] as const).map((lbl) => (
                    <Button
                      key={lbl}
                      mode={newAddrLabel === lbl ? 'contained' : 'outlined'}
                      buttonColor={newAddrLabel === lbl ? '#FE2C55' : undefined}
                      textColor={newAddrLabel === lbl ? '#FFFFFF' : palette.textPrimary}
                      onPress={() => setNewAddrLabel(lbl)}
                    >
                      {lbl}
                    </Button>
                  ))}
                </View>

                <TextInput
                  mode="outlined"
                  label="Full Name *"
                  value={newAddrFullName}
                  onChangeText={setNewAddrFullName}
                />
                <TextInput
                  mode="outlined"
                  label="Phone Number *"
                  keyboardType="phone-pad"
                  value={newAddrPhone}
                  onChangeText={setNewAddrPhone}
                />
                <TextInput
                  mode="outlined"
                  label="Region (e.g., Luzon / Visayas / Mindanao)"
                  value={newAddrRegion}
                  onChangeText={setNewAddrRegion}
                />
                <TextInput
                  mode="outlined"
                  label="Province *"
                  value={newAddrProvince}
                  onChangeText={setNewAddrProvince}
                />
                <TextInput
                  mode="outlined"
                  label="City / Municipality *"
                  value={newAddrCity}
                  onChangeText={setNewAddrCity}
                />
                <TextInput
                  mode="outlined"
                  label="Barangay *"
                  value={newAddrBarangay}
                  onChangeText={setNewAddrBarangay}
                />
                <TextInput
                  mode="outlined"
                  label="Postal Code"
                  keyboardType="numeric"
                  value={newAddrPostal}
                  onChangeText={setNewAddrPostal}
                />
                <TextInput
                  mode="outlined"
                  label="Street Name, Building, House No. *"
                  value={newAddrStreet}
                  onChangeText={setNewAddrStreet}
                />

                <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                  <Button mode="outlined" onPress={() => setAddingNewAddress(false)}>
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    buttonColor="#FE2C55"
                    textColor="#FFFFFF"
                    onPress={handleSaveNewDeliveryAddress}
                  >
                    Save Address
                  </Button>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ==================== CART ITEM ROW ====================
  const renderCartItem = (item: CartItem) => {
    const itemKey = getItemKey(item);
    const isSelected = selectedItemKeys.includes(itemKey);
    const unitPricePhp = item.price * USD_TO_PHP;
    const discountedPricePhp = unitPricePhp * (1 - (item.discountPercentage || 0) / 100);

    return (
      <View
        key={itemKey}
        style={[
          styles.cartItemCard,
          {
            backgroundColor: isSelected ? palette.glassSurfaceElevated : palette.glassSurface,
            borderColor: isSelected ? '#FE2C55' : palette.border,
          },
          webGlassStyle,
        ]}
      >
        <Checkbox
          status={isSelected ? 'checked' : 'unchecked'}
          onPress={() => toggleSelectItem(itemKey)}
          color="#FE2C55"
        />

        <TouchableOpacity onPress={() => router.push(`/(app)/(tabs)/product/${item.productId}` as any)}>
          <Image
            source={{ uri: item.thumbnail }}
            style={[
              styles.cartItemThumb,
              {
                width: isAnyDesktop ? 86 : isSmallPhone ? 62 : 70,
                height: isAnyDesktop ? 86 : isSmallPhone ? 62 : 70,
                backgroundColor: palette.isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
              },
            ]}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={styles.cartItemInfo}>
          <TouchableOpacity onPress={() => router.push(`/(app)/(tabs)/product/${item.productId}` as any)}>
            <Text style={[styles.cartItemTitle, { color: palette.textPrimary }]} numberOfLines={2}>
              {item.title}
            </Text>
          </TouchableOpacity>

          {(item.selectedColor || item.selectedSize) && (
            <View style={[styles.cartItemVariationPill, { backgroundColor: palette.glassInput }]}>
              <Text style={[styles.cartItemVariationText, { color: palette.textSecondary }]}>
                {[item.selectedColor, item.selectedSize].filter(Boolean).join(' · ')}
              </Text>
            </View>
          )}

          <View style={styles.cartItemBadgesRow}>
            {item.freeReturn !== false && (
              <View style={styles.freeReturnBadge}>
                <Text style={[styles.freeReturnBadgeText, { color: palette.success }]}>
                  Free Return
                </Text>
              </View>
            )}
            {item.isAuthentic !== false && (
              <View style={styles.authenticBadge}>
                <Text style={styles.authenticBadgeText}>100% Authentic</Text>
              </View>
            )}
          </View>

          <View style={styles.cartItemPriceRow}>
            <Text style={styles.cartItemPrice}>{formatPeso(discountedPricePhp)}</Text>
            {item.discountPercentage > 0 && (
              <>
                <Text style={[styles.cartItemOriginalPrice, { color: palette.textMuted }]}>
                  {formatPeso(unitPricePhp)}
                </Text>
                <View style={styles.cartItemDiscountTag}>
                  <Text style={styles.cartItemDiscountText}>
                    -{Math.round(item.discountPercentage)}%
                  </Text>
                </View>
              </>
            )}
          </View>

          <View
            style={[
              styles.qtyStepperBox,
              {
                backgroundColor: palette.glassInput,
                borderColor: palette.border,
              },
            ]}
          >
            <IconButton
              icon="minus"
              size={16}
              iconColor={palette.textPrimary}
              style={{ margin: 0 }}
              onPress={() => updateQuantity(itemKey, item.quantity - 1)}
            />
            <Text style={[styles.qtyStepperValue, { color: palette.textPrimary }]}>
              {item.quantity}
            </Text>
            <IconButton
              icon="plus"
              size={16}
              iconColor={palette.textPrimary}
              style={{ margin: 0 }}
              onPress={() => updateQuantity(itemKey, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
            />
          </View>
        </View>

        <IconButton
          icon="delete-outline"
          size={22}
          iconColor={palette.danger}
          onPress={() => removeItem(itemKey)}
        />
      </View>
    );
  };

  // ==================== "YOU MIGHT ALSO LIKE" CARD ====================
  const renderRecommendedProduct = ({ item }: { item: MarketplaceProduct }) => {
    const promo = evaluateProductPromotions(item, flashSchedules, nowMs);

    return (
      <TouchableOpacity
        style={{
          flex: 1,
          margin: isSmallPhone ? 4 : 6,
        }}
        onPress={() => router.push(`/(app)/(tabs)/product/${item.id}` as any)}
        activeOpacity={0.88}
      >
        <Card
          style={[
            styles.recCard,
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
              styles.recImageBox,
              {
                height: isAnyDesktop ? 180 : isTablet ? 162 : 152,
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
              <View style={styles.recBadgeTopLeft}>
                <MaterialCommunityIcons name="lightning-bolt" size={11} color="#FFFFFF" />
                <Text style={styles.recBadgeText}>{promo.countdownLabel}</Text>
              </View>
            ) : promo.hasDiscount ? (
              <View style={styles.recBadgeTopLeft}>
                <Text style={styles.recBadgeText}>
                  {promo.effectiveDiscountPercentage}% OFF
                </Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.recBody, { padding: isSmallPhone ? 9 : 11 }]}>
            <Text
              numberOfLines={2}
              style={[
                styles.recTitle,
                {
                  fontSize: isSmallPhone ? 12 : 13,
                  color: palette.textPrimary,
                },
              ]}
            >
              {item.title}
            </Text>

            <View style={styles.recPriceRow}>
              <Text style={[styles.recCurrentPrice, { fontSize: isSmallPhone ? 15 : 16 }]}>
                {formatPeso(promo.effectivePrice * USD_TO_PHP)}
              </Text>
              {promo.hasDiscount && (
                <>
                  <Text style={[styles.recOriginalPrice, { color: palette.textMuted }]}>
                    {formatPeso(promo.originalPrice * USD_TO_PHP)}
                  </Text>
                  <View style={styles.recDiscountPill}>
                    <Text style={styles.recDiscountText}>
                      -{promo.effectiveDiscountPercentage}%
                    </Text>
                  </View>
                </>
              )}
            </View>

            <View style={styles.recTagsRow}>
              {promo.isFreeShipping && (
                <View style={styles.freeReturnBadge}>
                  <Text style={[styles.freeReturnBadgeText, { color: palette.success }]}>
                    Free Shipping
                  </Text>
                </View>
              )}
              {promo.isCodAvailable && (
                <View style={[styles.cartItemVariationPill, { backgroundColor: palette.accentSoft, marginTop: 0 }]}>
                  <Text style={{ fontSize: 9.5, fontWeight: '700', color: palette.accent }}>COD</Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Text
                numberOfLines={1}
                style={[
                  styles.recRatingText,
                  {
                    fontSize: isSmallPhone ? 10.5 : 11,
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

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: palette.isDark ? palette.background : '#F1F5FB',
        }}
      >
        {renderAmbientOrbs()}
        <ActivityIndicator size="large" color="#FE2C55" />
        <Text style={{ marginTop: 8, color: palette.textSecondary, fontWeight: '600' }}>
          Loading cart...
        </Text>
      </View>
    );
  }

  // ==================== DEDICATED CHECKOUT INTERFACE ====================
  if (isCheckoutView) {
    const selectedCardObj = savedCards.find((c) => c.id === selectedCardId);
    const selectedBankObj = linkedBanks.find((b) => b.bank === selectedBankName);

    return (
      <View
        style={[
          styles.checkoutContainer,
          { backgroundColor: palette.isDark ? palette.background : '#F1F5FB' },
          webAmbientBackdropStyle,
        ]}
      >
        {renderAmbientOrbs()}

        {/* Top Checkout Header */}
        <View
          style={[
            styles.topHeaderBar,
            {
              paddingTop: topSafePadding,
              paddingHorizontal: horizontalPadding,
              backgroundColor: palette.glassNav,
              borderBottomColor: palette.border,
            },
            webGlassStyle,
          ]}
        >
          <TouchableOpacity onPress={handleBack} style={styles.headerBackBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={palette.textPrimary} />
            {!isSmallPhone && (
              <Text style={[styles.headerBackText, { color: palette.textPrimary }]}>Cart</Text>
            )}
          </TouchableOpacity>

          <View style={styles.headerCenterBox}>
            <Text style={[styles.headerTitleText, { fontSize: 17, color: palette.textPrimary }]}>
              Order Checkout
            </Text>
          </View>

          <View style={{ minWidth: 58 }} />
        </View>

        {/* Full-Width Single-Column ScrollView with Order Summary Placed Below */}
        <ScrollView
          showsVerticalScrollIndicator={Platform.OS === 'web'}
          contentContainerStyle={{
            width: '100%',
            paddingHorizontal: horizontalPadding,
            paddingTop: 14,
            paddingBottom: bottomSafePadding + 140,
            gap: 14,
            zIndex: 1,
          }}
        >
          {/* 1. DELIVERY ADDRESS & 2. ORDER NOTE */}
          <View
            style={[
              styles.glassCard,
              { backgroundColor: palette.glassSurface, borderColor: palette.border },
              webGlassStyle,
            ]}
          >
            <TouchableOpacity
              onPress={() => setAddressModalVisible(true)}
              activeOpacity={0.8}
              style={styles.addressCardRow}
            >
              <View style={styles.addressIconBadge}>
                <MaterialCommunityIcons name="map-marker" size={20} color="#FE2C55" />
              </View>

              <View style={{ flex: 1 }}>
                {activeAddress ? (
                  <>
                    <Text style={[styles.addressNamePhone, { color: palette.textPrimary }]}>
                      {activeAddress.fullName}{' '}
                      <Text style={{ fontWeight: '600', color: palette.textSecondary }}>
                        ({activeAddress.phoneNumber})
                      </Text>
                    </Text>
                    <Text style={[styles.addressFullText, { color: palette.textSecondary }]}>
                      {activeAddressFullText}
                    </Text>
                  </>
                ) : (
                  <View>
                    <Text style={[styles.addressNamePhone, { color: '#FE2C55' }]}>
                      No Delivery Address Saved
                    </Text>
                    <Text style={[styles.addressFullText, { color: palette.textSecondary }]}>
                      Tap here to add your delivery address before placing an order.
                    </Text>
                  </View>
                )}
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={palette.textSecondary}
              />
            </TouchableOpacity>

            {/* 2. ORDER NOTE */}
            <TouchableOpacity
              onPress={() => {
                setOrderNoteDraft(orderNote);
                setNoteModalVisible(true);
              }}
              activeOpacity={0.78}
              style={[styles.orderNoteRow, { borderTopColor: palette.border }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <MaterialCommunityIcons
                  name="note-edit-outline"
                  size={18}
                  color={palette.textSecondary}
                />
                <Text style={{ fontSize: 13, fontWeight: '700', color: palette.textPrimary }}>
                  Order Note
                </Text>
                {orderNote.trim().length > 0 && (
                  <View
                    style={{
                      backgroundColor: 'rgba(254, 44, 85, 0.12)',
                      paddingHorizontal: 7,
                      paddingVertical: 1.5,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#FE2C55' }}>
                      Added
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '58%' }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 12.5,
                    color: orderNote.trim() ? palette.textPrimary : palette.textMuted,
                    fontWeight: orderNote.trim() ? '600' : '400',
                  }}
                >
                  {orderNote.trim() ? orderNote.trim() : 'Add Note'}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={19}
                  color={palette.textSecondary}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* 3. PRODUCT DETAILS (GROUPED BY SELLER) */}
          {sellerGroupedItems.map(([sellerName, groupItems]) => (
            <View
              key={`seller-${sellerName}`}
              style={[
                styles.glassCard,
                { backgroundColor: palette.glassSurface, borderColor: palette.border },
                webGlassStyle,
              ]}
            >
              <View style={styles.checkoutSectionTitleRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons name="storefront-outline" size={18} color="#FE2C55" />
                  <Text style={[styles.checkoutSectionTitle, { color: palette.textPrimary }]}>
                    {sellerName}
                  </Text>
                </View>
                <Text style={{ fontSize: 11.5, color: palette.textMuted, fontWeight: '700' }}>
                  {groupItems.reduce((s, i) => s + i.quantity, 0)} PCS
                </Text>
              </View>

              {groupItems.map((item) => {
                const itemKey = getItemKey(item);
                const unitOrigPhp = item.price * USD_TO_PHP;
                const unitSalePhp = unitOrigPhp * (1 - (item.discountPercentage || 0) / 100);
                return (
                  <View
                    key={`chk-item-${itemKey}`}
                    style={{
                      flexDirection: 'row',
                      gap: 10,
                      paddingVertical: 10,
                      borderTopWidth: 1,
                      borderTopColor: palette.border,
                    }}
                  >
                    <Image
                      source={{ uri: item.thumbnail }}
                      style={{
                        width: 74,
                        height: 74,
                        borderRadius: 12,
                        backgroundColor: palette.isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                      }}
                      resizeMode="contain"
                    />

                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={2}
                        style={{ fontSize: 13.5, fontWeight: '700', color: palette.textPrimary }}
                      >
                        {item.title}
                      </Text>

                      {(item.selectedColor || item.selectedSize) && (
                        <View
                          style={[
                            styles.cartItemVariationPill,
                            { backgroundColor: palette.glassInput },
                          ]}
                        >
                          <Text
                            style={[
                              styles.cartItemVariationText,
                              { color: palette.textSecondary },
                            ]}
                          >
                            {[item.selectedColor, item.selectedSize].filter(Boolean).join(' · ')}
                          </Text>
                        </View>
                      )}

                      <View style={styles.cartItemBadgesRow}>
                        {item.freeReturn !== false && (
                          <View style={styles.freeReturnBadge}>
                            <Text style={[styles.freeReturnBadgeText, { color: palette.success }]}>
                              Free Return
                            </Text>
                          </View>
                        )}
                        {item.isAuthentic !== false && (
                          <View style={styles.authenticBadge}>
                            <Text style={styles.authenticBadgeText}>100% Authentic</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.cartItemPriceRow}>
                        <Text style={styles.cartItemPrice}>{formatPeso(unitSalePhp)}</Text>
                        {item.discountPercentage > 0 && (
                          <>
                            <Text
                              style={[
                                styles.cartItemOriginalPrice,
                                { color: palette.textMuted },
                              ]}
                            >
                              {formatPeso(unitOrigPhp)}
                            </Text>
                            <View style={styles.cartItemDiscountTag}>
                              <Text style={styles.cartItemDiscountText}>
                                -{Math.round(item.discountPercentage)}%
                              </Text>
                            </View>
                          </>
                        )}
                      </View>

                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: 6,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: palette.textSecondary }}>
                          {item.quantity} PCS
                        </Text>

                        <View
                          style={[
                            styles.qtyStepperBox,
                            {
                              marginTop: 0,
                              backgroundColor: palette.glassInput,
                              borderColor: palette.border,
                            },
                          ]}
                        >
                          <IconButton
                            icon="minus"
                            size={15}
                            iconColor={palette.textPrimary}
                            style={{ margin: 0 }}
                            onPress={() => updateQuantity(itemKey, item.quantity - 1)}
                          />
                          <Text style={[styles.qtyStepperValue, { color: palette.textPrimary }]}>
                            {item.quantity}
                          </Text>
                          <IconButton
                            icon="plus"
                            size={15}
                            iconColor={palette.textPrimary}
                            style={{ margin: 0 }}
                            onPress={() => updateQuantity(itemKey, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}

          {/* 4. PRODUCT LIABILITY PROTECTION */}
          {isProtectionAvailable && (
            <View
              style={[
                styles.glassCard,
                { backgroundColor: palette.glassSurface, borderColor: palette.border },
                webGlassStyle,
              ]}
            >
              <View style={styles.protectionRow}>
                <Checkbox
                  status={protectionEnabled ? 'checked' : 'unchecked'}
                  onPress={() => setProtectionEnabled((prev) => !prev)}
                  color="#FE2C55"
                />
                <View style={{ flex: 1 }}>
                  <View style={styles.protectionTitleRow}>
                    <Text style={[styles.protectionTitle, { color: palette.textPrimary }]}>
                      Product Liability Protection
                    </Text>
                    <Text style={styles.protectionFeeText}>
                      {formatPeso(PROTECTION_FEE_PHP)}
                    </Text>
                  </View>
                  <Text style={[styles.protectionDesc, { color: palette.textSecondary }]}>
                    Get reimbursed for eligible medical expenses resulting from allergic reactions
                    or side effects directly caused by your purchased item within 60 days.{' '}
                    <Text
                      onPress={() => setProtectionTermsVisible(true)}
                      style={styles.learnMoreLink}
                    >
                      Learn More.
                    </Text>
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* 5. ESTIMATED DELIVERY */}
          <View
            style={[
              styles.glassCard,
              { backgroundColor: palette.glassSurface, borderColor: palette.border },
              webGlassStyle,
            ]}
          >
            <View style={styles.deliveryRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.checkoutSectionTitle, { color: palette.textPrimary }]}>
                  Estimated Delivery
                </Text>
                <View style={[styles.deliveryDateBadge, { marginTop: 6, alignSelf: 'flex-start' }]}>
                  <MaterialCommunityIcons
                    name="truck-fast-outline"
                    size={16}
                    color={palette.success}
                  />
                  <Text style={{ fontSize: 12.5, fontWeight: '800', color: palette.success }}>
                    Get by {shippingCalculation.getBySingleDate}
                  </Text>
                </View>
                <Text style={{ fontSize: 11.5, color: palette.textMuted, marginTop: 4 }}>
                  {shippingCalculation.courierName} · Est. window {shippingCalculation.estimatedDateRange}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                {shippingCalculation.shippingDiscountPhp > 0 && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: palette.textMuted,
                      textDecorationLine: 'line-through',
                    }}
                  >
                    {formatPeso(shippingCalculation.originalShippingPhp)}
                  </Text>
                )}
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '900',
                    color: shippingCalculation.isFreeShipping ? palette.success : palette.textPrimary,
                  }}
                >
                  {shippingCalculation.isFreeShipping
                    ? 'Free'
                    : formatPeso(shippingCalculation.finalShippingPhp)}
                </Text>
              </View>
            </View>
          </View>

          {/* 6. MARKETPLACE SHOP DISCOUNT & COUPONS */}
          <View
            style={[
              styles.glassCard,
              { backgroundColor: palette.glassSurface, borderColor: palette.border },
              webGlassStyle,
            ]}
          >
            <TouchableOpacity
              onPress={() => setCouponsModalVisible(true)}
              activeOpacity={0.8}
              style={styles.couponTriggerRow}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <MaterialCommunityIcons name="ticket-percent" size={20} color="#FE2C55" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.checkoutSectionTitle, { color: palette.textPrimary, marginBottom: 2 }]}>
                    Marketplace Shop Discount
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {shippingCalculation.isFreeShipping && (
                      <View style={styles.freeReturnBadge}>
                        <Text style={[styles.freeReturnBadgeText, { color: palette.success }]}>
                          Free Shipping
                        </Text>
                      </View>
                    )}
                    {effectiveCoupon ? (
                      <View style={styles.authenticBadge}>
                        <Text style={styles.authenticBadgeText}>
                          {effectiveCoupon.code} Applied
                        </Text>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 12, color: palette.textSecondary }}>
                        {availableCoupons.length} vouchers available
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {(marketplaceCouponDiscountPhp > 0 ||
                  shippingCalculation.shippingDiscountPhp > 0) && (
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#FE2C55' }}>
                    -{formatPeso(
                      marketplaceCouponDiscountPhp + shippingCalculation.shippingDiscountPhp
                    )}
                  </Text>
                )}
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={palette.textSecondary}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* 7. PAYMENT METHOD SECTION */}
          <View
            style={[
              styles.glassCard,
              { backgroundColor: palette.glassSurface, borderColor: palette.border },
              webGlassStyle,
            ]}
          >
            <View style={styles.checkoutSectionTitleRow}>
              <Text style={[styles.checkoutSectionTitle, { color: palette.textPrimary }]}>
                Payment Method
              </Text>
              <TouchableOpacity
                onPress={() => setAllPaymentsModalVisible(true)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
              >
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#FE2C55' }}>
                  View 5 Payment Methods
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#FE2C55" />
              </TouchableOpacity>
            </View>

            {/* GCash Option */}
            <TouchableOpacity
              onPress={() => setPaymentMethod('gcash')}
              activeOpacity={0.82}
              style={[
                styles.paymentOptionRow,
                {
                  borderColor: paymentMethod === 'gcash' ? '#FE2C55' : palette.border,
                  backgroundColor:
                    paymentMethod === 'gcash' ? 'rgba(254, 44, 85, 0.08)' : palette.glassInput,
                },
              ]}
            >
              <View style={styles.paymentOptionLeft}>
                <View style={[styles.paymentBrandBadge, { backgroundColor: '#007DFE' }]}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>G</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: palette.textPrimary }}>
                    GCash
                  </Text>
                  <Text style={{ fontSize: 11.5, color: palette.textSecondary }}>
                    {gcashAuthorized
                      ? `Authorized (${gcashAccountLabel || 'Connected'})`
                      : 'Pay securely via official GCash integration'}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {!gcashAuthorized && (
                  <TouchableOpacity
                    onPress={() => {
                      setGcashAuthorized(true);
                      setGcashAccountLabel('Verified GCash Wallet');
                      setPaymentMethod('gcash');
                    }}
                    style={{
                      paddingHorizontal: 9,
                      paddingVertical: 4,
                      borderRadius: 8,
                      backgroundColor: 'rgba(0, 125, 246, 0.14)',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#007DFE' }}>
                      Authorize
                    </Text>
                  </TouchableOpacity>
                )}

                <View
                  style={[
                    styles.radioOuter,
                    { borderColor: paymentMethod === 'gcash' ? '#FE2C55' : palette.textMuted },
                  ]}
                >
                  {paymentMethod === 'gcash' && <View style={styles.radioInner} />}
                </View>
              </View>
            </TouchableOpacity>

            {paymentMethod === 'card' && selectedCardObj && (
              <View
                style={[
                  styles.paymentOptionRow,
                  {
                    borderColor: '#FE2C55',
                    backgroundColor: 'rgba(254, 44, 85, 0.08)',
                  },
                ]}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={[styles.paymentBrandBadge, { backgroundColor: '#1E293B' }]}>
                    <MaterialCommunityIcons name="credit-card" size={20} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 13.5, fontWeight: '800', color: palette.textPrimary }}>
                      {selectedCardObj.brand} •••• {selectedCardObj.last4}
                    </Text>
                    <Text style={{ fontSize: 11, color: palette.textSecondary }}>
                      Expires {selectedCardObj.expiry} · Tokenized
                    </Text>
                  </View>
                </View>
                <View style={[styles.radioOuter, { borderColor: '#FE2C55' }]}>
                  <View style={styles.radioInner} />
                </View>
              </View>
            )}

            {paymentMethod === 'maya' && (
              <View
                style={[
                  styles.paymentOptionRow,
                  {
                    borderColor: '#FE2C55',
                    backgroundColor: 'rgba(254, 44, 85, 0.08)',
                  },
                ]}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={[styles.paymentBrandBadge, { backgroundColor: '#16A34A' }]}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>M</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 13.5, fontWeight: '800', color: palette.textPrimary }}>
                      Maya E-Wallet
                    </Text>
                    <Text style={{ fontSize: 11, color: palette.textSecondary }}>
                      {mayaAuthorized ? 'Connected & Ready' : 'Official Maya Payment Integration'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.radioOuter, { borderColor: '#FE2C55' }]}>
                  <View style={styles.radioInner} />
                </View>
              </View>
            )}

            {paymentMethod === 'bank' && selectedBankObj && (
              <View
                style={[
                  styles.paymentOptionRow,
                  {
                    borderColor: '#FE2C55',
                    backgroundColor: 'rgba(254, 44, 85, 0.08)',
                  },
                ]}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={[styles.paymentBrandBadge, { backgroundColor: '#B91C1C' }]}>
                    <MaterialCommunityIcons name="bank" size={20} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 13.5, fontWeight: '800', color: palette.textPrimary }}>
                      {selectedBankObj.masked}
                    </Text>
                    <Text style={{ fontSize: 11, color: palette.textSecondary }}>
                      Linked Bank Account
                    </Text>
                  </View>
                </View>
                <View style={[styles.radioOuter, { borderColor: '#FE2C55' }]}>
                  <View style={styles.radioInner} />
                </View>
              </View>
            )}

            {paymentMethod === 'cod' && (
              <View
                style={[
                  styles.paymentOptionRow,
                  {
                    borderColor: '#FE2C55',
                    backgroundColor: 'rgba(254, 44, 85, 0.08)',
                  },
                ]}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={[styles.paymentBrandBadge, { backgroundColor: '#EA580C' }]}>
                    <MaterialCommunityIcons name="cash-multiple" size={20} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 13.5, fontWeight: '800', color: palette.textPrimary }}>
                      Cash on Delivery (COD)
                    </Text>
                    <Text style={{ fontSize: 11, color: palette.textSecondary }}>
                      Pay in cash when your parcel arrives
                    </Text>
                  </View>
                </View>
                <View style={[styles.radioOuter, { borderColor: '#FE2C55' }]}>
                  <View style={styles.radioInner} />
                </View>
              </View>
            )}

            {/* Add Credit/Debit Card > */}
            <TouchableOpacity
              onPress={() => setAddCardPageVisible(true)}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 10,
                paddingHorizontal: 6,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialCommunityIcons
                  name="credit-card-plus-outline"
                  size={21}
                  color={palette.textPrimary}
                />
                <Text style={{ fontSize: 13.5, fontWeight: '700', color: palette.textPrimary }}>
                  Add Credit/Debit Card
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={21}
                color={palette.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* 8. ORDER SUMMARY PLACED BELOW WITH GENEROUS PADDING */}
          <View
            style={[
              styles.orderSummaryCardLong,
              {
                backgroundColor: palette.glassSurface,
                borderColor: palette.border,
                paddingHorizontal: isAnyDesktop ? 32 : isTablet ? 26 : 20,
                paddingVertical: isAnyDesktop ? 30 : 24,
              },
              webGlassStyle,
            ]}
          >
            <TouchableOpacity
              onPress={() => setSummaryExpanded((prev) => !prev)}
              activeOpacity={0.8}
              style={styles.checkoutSectionTitleRow}
            >
              <Text style={[styles.sectionHeading, { color: palette.textPrimary, marginBottom: 0 }]}>
                Order Summary
              </Text>
              <MaterialCommunityIcons
                name={summaryExpanded ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={palette.textSecondary}
              />
            </TouchableOpacity>

            {summaryExpanded && (
              <>
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: '800',
                    color: palette.textSecondary,
                    marginTop: 10,
                    marginBottom: 6,
                  }}
                >
                  Product Subtotal
                </Text>

                <View style={styles.summaryLine}>
                  <Text style={[styles.summaryLabel, { color: palette.textSecondary }]}>
                    Original Product Price
                  </Text>
                  <Text style={[styles.summaryValue, { color: palette.textPrimary }]}>
                    {formatPeso(originalProductSubtotalPhp)}
                  </Text>
                </View>

                {productDiscountPhp > 0 && (
                  <View style={styles.summaryLine}>
                    <Text style={[styles.summaryLabel, { color: palette.textSecondary }]}>
                      Product Discount
                    </Text>
                    <Text style={[styles.summaryValue, { color: '#FE2C55' }]}>
                      -{formatPeso(productDiscountPhp)}
                    </Text>
                  </View>
                )}

                {marketplaceCouponDiscountPhp > 0 && (
                  <View style={styles.summaryLine}>
                    <Text style={[styles.summaryLabel, { color: palette.textSecondary }]}>
                      Marketplace Shop Coupon ({effectiveCoupon?.code})
                    </Text>
                    <Text style={[styles.summaryValue, { color: '#FE2C55' }]}>
                      -{formatPeso(marketplaceCouponDiscountPhp)}
                    </Text>
                  </View>
                )}

                <View style={[styles.dividerLine, { backgroundColor: palette.border }]} />

                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: '800',
                    color: palette.textSecondary,
                    marginBottom: 6,
                  }}
                >
                  Shipping Subtotal
                </Text>

                <View style={styles.summaryLine}>
                  <Text style={[styles.summaryLabel, { color: palette.textSecondary }]}>
                    Original Shipping Fee
                  </Text>
                  <Text style={[styles.summaryValue, { color: palette.textPrimary }]}>
                    {formatPeso(shippingCalculation.originalShippingPhp)}
                  </Text>
                </View>

                {shippingCalculation.shippingDiscountPhp > 0 && (
                  <View style={styles.summaryLine}>
                    <Text style={[styles.summaryLabel, { color: palette.textSecondary }]}>
                      {shippingCalculation.isFreeShipping
                        ? 'Free Shipping Discount'
                        : 'Shipping Discount'}
                    </Text>
                    <Text style={[styles.summaryValue, { color: palette.success }]}>
                      -{formatPeso(shippingCalculation.shippingDiscountPhp)}
                    </Text>
                  </View>
                )}

                {protectionFeeTotalPhp > 0 && (
                  <>
                    <View style={[styles.dividerLine, { backgroundColor: palette.border }]} />
                    <View style={styles.summaryLine}>
                      <Text style={[styles.summaryLabel, { color: palette.textSecondary }]}>
                        Product Liability Protection
                      </Text>
                      <Text style={[styles.summaryValue, { color: palette.textPrimary }]}>
                        {formatPeso(protectionFeeTotalPhp)}
                      </Text>
                    </View>
                  </>
                )}

                <View style={[styles.dividerLine, { backgroundColor: palette.border }]} />
              </>
            )}

            {totalSavedPhp > 0 && (
              <View style={styles.summaryLine}>
                <Text style={[styles.summaryLabel, { color: palette.success, fontWeight: '700' }]}>
                  Total Saved
                </Text>
                <Text style={[styles.summaryValue, { color: palette.success }]}>
                  {formatPeso(totalSavedPhp)}
                </Text>
              </View>
            )}

            <View style={[styles.summaryLine, { marginTop: 8 }]}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: palette.textPrimary }}>
                Total Payable
              </Text>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#FE2C55' }}>
                {formatPeso(finalPayablePhp)}
              </Text>
            </View>

            {isAnyDesktop && (
              <Button
                mode="contained"
                onPress={handleTriggerPlaceOrder}
                loading={placingOrder}
                disabled={placingOrder}
                buttonColor="#FE2C55"
                textColor="#FFFFFF"
                style={[{ marginTop: 18, borderRadius: 24 }, webPrimaryButtonGradient]}
                contentStyle={{ height: 48 }}
                labelStyle={{ fontSize: 15, fontWeight: '800' }}
              >
                Place Order
              </Button>
            )}
          </View>

          {/* 9. CHECKOUT SAVINGS & PROMO EXPIRATION MESSAGE */}
          {totalSavedPhp > 0 && (
            <View style={styles.savingsBanner}>
              <MaterialCommunityIcons name="party-popper" size={20} color="#FE2C55" />
              <Text style={styles.savingsBannerText}>
                Congratulations! You're saving {formatPeso(totalSavedPhp)} on this order!
              </Text>
            </View>
          )}

          {(shippingCalculation.isFreeShipping || effectiveCoupon) && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 6,
              }}
            >
              <MaterialCommunityIcons name="clock-alert-outline" size={16} color="#FE2C55" />
              <Text style={{ fontSize: 12, color: palette.textSecondary, fontWeight: '600' }}>
                {effectiveCoupon
                  ? `Coupon ${effectiveCoupon.code} expires ${effectiveCoupon.expiresAt}`
                  : 'Free Shipping applied to your order'}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* FIXED BOTTOM CHECKOUT BAR (MOBILE & TABLET) */}
        {!isAnyDesktop && (
          <View
            style={[
              styles.stickyBottomBar,
              {
                paddingBottom: bottomSafePadding,
                backgroundColor: palette.glassNav,
                borderTopColor: palette.border,
              },
              webGlassStyle,
            ]}
          >
            {totalSavedPhp > 0 && (
              <Text
                style={{
                  fontSize: 11.5,
                  fontWeight: '700',
                  color: '#FE2C55',
                  marginBottom: 4,
                }}
              >
                Congratulations! You're saving {formatPeso(totalSavedPhp)} on this order!
              </Text>
            )}

            <View style={styles.stickyBottomMainRow}>
              <View>
                <Text style={{ fontSize: 12, color: palette.textSecondary, fontWeight: '600' }}>
                  Total ({selectedQuantity} {selectedQuantity === 1 ? 'item' : 'items'})
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#FE2C55' }}>
                  {formatPeso(finalPayablePhp)}
                </Text>
              </View>

              <Button
                mode="contained"
                onPress={handleTriggerPlaceOrder}
                loading={placingOrder}
                disabled={placingOrder}
                buttonColor="#FE2C55"
                textColor="#FFFFFF"
                style={[{ borderRadius: 22 }, webPrimaryButtonGradient]}
                contentStyle={{ height: 42, paddingHorizontal: 14 }}
                labelStyle={{ fontSize: 14, fontWeight: '800' }}
              >
                Place Order
              </Button>
            </View>
          </View>
        )}

        {/* ==================== MODAL 1: SELECT OR ADD DELIVERY ADDRESS ==================== */}
        {renderAddressModal()}

        {/* ==================== MODAL 2: ORDER NOTE POPUP ==================== */}
        <Modal visible={noteModalVisible} animationType="fade" transparent>
          <View style={[styles.modalCenterOverlay, { backgroundColor: palette.glassOverlay }]}>
            <View
              style={[
                styles.modalDialogBox,
                { backgroundColor: palette.background, borderColor: palette.border },
                webGlassStyle,
              ]}
            >
              <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
                <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>Order Note</Text>
                <IconButton
                  icon="close"
                  size={22}
                  iconColor={palette.textPrimary}
                  onPress={() => setNoteModalVisible(false)}
                  style={{ margin: 0 }}
                />
              </View>

              <Text style={{ fontSize: 13, color: palette.textSecondary, marginBottom: 6 }}>
                Give the seller more information about your order.
              </Text>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: palette.textMuted, marginBottom: 6 }}>
                Optional
              </Text>

              <TextInput
                mode="outlined"
                multiline
                numberOfLines={4}
                maxLength={200}
                placeholder="Write instructions or notes for the seller..."
                value={orderNoteDraft}
                onChangeText={(txt) => setOrderNoteDraft(txt.slice(0, 200))}
                outlineColor={palette.border}
                activeOutlineColor="#FE2C55"
              />

              <Text
                style={{
                  fontSize: 11.5,
                  color: palette.textMuted,
                  textAlign: 'right',
                  marginTop: 4,
                  marginBottom: 12,
                }}
              >
                {orderNoteDraft.length}/200
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                {orderNote.trim().length > 0 ? (
                  <Button
                    mode="outlined"
                    textColor={palette.danger}
                    onPress={() => {
                      setOrderNote('');
                      setOrderNoteDraft('');
                      setNoteModalVisible(false);
                    }}
                  >
                    Remove Note
                  </Button>
                ) : (
                  <View />
                )}

                <Button
                  mode="contained"
                  buttonColor="#FE2C55"
                  textColor="#FFFFFF"
                  style={{ borderRadius: 20, paddingHorizontal: 14 }}
                  onPress={() => {
                    setOrderNote(orderNoteDraft.trim());
                    setNoteModalVisible(false);
                  }}
                >
                  Save
                </Button>
              </View>
            </View>
          </View>
        </Modal>

        {/* ==================== MODAL 3: PRODUCT LIABILITY PROTECTION TERMS ==================== */}
        <Modal visible={protectionTermsVisible} animationType="fade" transparent>
          <View style={[styles.modalCenterOverlay, { backgroundColor: palette.glassOverlay }]}>
            <View
              style={[
                styles.modalDialogBox,
                { backgroundColor: palette.background, borderColor: palette.border },
                webGlassStyle,
              ]}
            >
              <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
                <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>
                  Product Liability Protection Policy
                </Text>
                <IconButton
                  icon="close"
                  size={22}
                  iconColor={palette.textPrimary}
                  onPress={() => setProtectionTermsVisible(false)}
                  style={{ margin: 0 }}
                />
              </View>

              <Text style={{ fontSize: 13, color: palette.textPrimary, lineHeight: 20 }}>
                Coverage Provider: Marketplace Partner Insurance Services.
              </Text>
              <Text style={{ fontSize: 12.5, color: palette.textSecondary, lineHeight: 19, marginTop: 8 }}>
                • Eligibility: Applies to physical products delivered through Marketplace within 60
                days from confirmed delivery date.
              </Text>
              <Text style={{ fontSize: 12.5, color: palette.textSecondary, lineHeight: 19, marginTop: 4 }}>
                • Covered Expenses: Outpatient consultation, emergency care, and prescribed
                medication directly resulting from verified allergic reactions or acute side
                effects caused by normal product use.
              </Text>
              <Text style={{ fontSize: 12.5, color: palette.textSecondary, lineHeight: 19, marginTop: 4 }}>
                • Exclusions: Pre-existing medical conditions, intentional misuse, expired items,
                or claims without official medical documentation.
              </Text>

              <Button
                mode="contained"
                buttonColor="#FE2C55"
                textColor="#FFFFFF"
                style={{ marginTop: 14, borderRadius: 20 }}
                onPress={() => setProtectionTermsVisible(false)}
              >
                Got It
              </Button>
            </View>
          </View>
        </Modal>

        {/* ==================== MODAL 4: MARKETPLACE SHOP COUPONS POPUP ==================== */}
        <Modal visible={couponsModalVisible} animationType="slide" transparent>
          <View style={[styles.modalOverlay, { backgroundColor: palette.glassOverlay }]}>
            <View
              style={[
                styles.modalSheet,
                {
                  paddingBottom: bottomSafePadding + 12,
                  backgroundColor: palette.background,
                  borderColor: palette.border,
                  maxWidth: isAnyDesktop ? 560 : isTablet ? 520 : '100%',
                  alignSelf: 'center',
                  width: '100%',
                },
                webGlassStyle,
              ]}
            >
              <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
                <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>
                  Marketplace Shop Coupons
                </Text>
                <IconButton
                  icon="close"
                  size={22}
                  iconColor={palette.textPrimary}
                  onPress={() => setCouponsModalVisible(false)}
                  style={{ margin: 0 }}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'center' }}>
                <TextInput
                  mode="outlined"
                  dense
                  placeholder="Enter voucher code"
                  value={couponInputCode}
                  onChangeText={setCouponInputCode}
                  style={{ flex: 1, backgroundColor: palette.glassInput }}
                />
                <Button
                  mode="contained"
                  buttonColor="#FE2C55"
                  textColor="#FFFFFF"
                  onPress={handleApplyCouponCode}
                >
                  Apply
                </Button>
              </View>

              {effectiveCoupon && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: 'rgba(254, 44, 85, 0.1)',
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#FE2C55' }}>
                    Active Coupon: {effectiveCoupon.code}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedCoupon(null)}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#FE2C55' }}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <ScrollView>
                {availableCoupons.length === 0 ? (
                  <Text style={{ textAlign: 'center', color: palette.textSecondary, paddingVertical: 24 }}>
                    No eligible coupons are currently available.
                  </Text>
                ) : (
                  availableCoupons.map((cp) => {
                    const isEligible = discountedProductSubtotalPhp >= cp.minSpend;
                    const isSelected = effectiveCoupon?.id === cp.id;
                    return (
                      <View
                        key={cp.id}
                        style={[
                          styles.paymentOptionRow,
                          {
                            borderColor: isSelected ? '#FE2C55' : palette.border,
                            backgroundColor: isSelected
                              ? 'rgba(254, 44, 85, 0.08)'
                              : palette.glassSurface,
                            opacity: isEligible ? 1 : 0.65,
                          },
                        ]}
                      >
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={{ fontSize: 13.5, fontWeight: '800', color: palette.textPrimary }}>
                            {cp.title} ({cp.code})
                          </Text>
                          <Text style={{ fontSize: 12, color: palette.textSecondary, marginTop: 2 }}>
                            {cp.description}
                          </Text>
                          <Text style={{ fontSize: 11, color: palette.textMuted, marginTop: 3 }}>
                            Min. spend {formatPeso(cp.minSpend)} · Max discount{' '}
                            {formatPeso(cp.maxDiscount)} · Expires {cp.expiresAt}
                          </Text>
                          {!isEligible && (
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#FE2C55', marginTop: 2 }}>
                              Add {formatPeso(cp.minSpend - discountedProductSubtotalPhp)} more to
                              unlock
                            </Text>
                          )}
                        </View>

                        <Button
                          mode={isSelected ? 'outlined' : 'contained'}
                          disabled={!isEligible}
                          buttonColor={isSelected ? undefined : '#FE2C55'}
                          textColor={isSelected ? '#FE2C55' : '#FFFFFF'}
                          onPress={() => {
                            if (isSelected) {
                              setSelectedCoupon(null);
                            } else {
                              setSelectedCoupon(cp);
                              setCouponsModalVisible(false);
                            }
                          }}
                        >
                          {isSelected ? 'Remove' : 'Apply'}
                        </Button>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ==================== MODAL 5: VIEW 5 PAYMENT METHODS ==================== */}
        <Modal visible={allPaymentsModalVisible} animationType="slide" transparent>
          <View style={[styles.modalOverlay, { backgroundColor: palette.glassOverlay }]}>
            <View
              style={[
                styles.modalSheet,
                {
                  paddingBottom: bottomSafePadding + 12,
                  backgroundColor: palette.background,
                  borderColor: palette.border,
                  maxWidth: isAnyDesktop ? 560 : isTablet ? 520 : '100%',
                  alignSelf: 'center',
                  width: '100%',
                },
                webGlassStyle,
              ]}
            >
              <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
                <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>
                  Payment Method
                </Text>
                <IconButton
                  icon="close"
                  size={22}
                  iconColor={palette.textPrimary}
                  onPress={() => setAllPaymentsModalVisible(false)}
                  style={{ margin: 0 }}
                />
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 12,
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                }}
              >
                <MaterialCommunityIcons name="shield-lock-outline" size={16} color={palette.success} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: palette.success }}>
                  Your information is secure and encrypted.
                </Text>
              </View>

              <ScrollView>
                {/* 1. GCash */}
                <TouchableOpacity
                  onPress={() => setPaymentMethod('gcash')}
                  style={[
                    styles.paymentOptionRow,
                    {
                      borderColor: paymentMethod === 'gcash' ? '#FE2C55' : palette.border,
                      backgroundColor: palette.glassSurface,
                    },
                  ]}
                >
                  <View style={styles.paymentOptionLeft}>
                    <View style={[styles.paymentBrandBadge, { backgroundColor: '#007DFE' }]}>
                      <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>G</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: palette.textPrimary }}>
                        GCash
                      </Text>
                      <Text style={{ fontSize: 11.5, color: palette.textSecondary }}>
                        Official GCash E-Wallet Integration
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.radioOuter,
                      { borderColor: paymentMethod === 'gcash' ? '#FE2C55' : palette.textMuted },
                    ]}
                  >
                    {paymentMethod === 'gcash' && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>

                {/* 2. Maya */}
                <TouchableOpacity
                  onPress={() => {
                    setMayaAuthorized(true);
                    setPaymentMethod('maya');
                  }}
                  style={[
                    styles.paymentOptionRow,
                    {
                      borderColor: paymentMethod === 'maya' ? '#FE2C55' : palette.border,
                      backgroundColor: palette.glassSurface,
                    },
                  ]}
                >
                  <View style={styles.paymentOptionLeft}>
                    <View style={[styles.paymentBrandBadge, { backgroundColor: '#16A34A' }]}>
                      <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>M</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: palette.textPrimary }}>
                        Maya
                      </Text>
                      <Text style={{ fontSize: 11.5, color: palette.textSecondary }}>
                        Official Maya Wallet Integration
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.radioOuter,
                      { borderColor: paymentMethod === 'maya' ? '#FE2C55' : palette.textMuted },
                    ]}
                  >
                    {paymentMethod === 'maya' && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>

                {/* 3. Credit / Debit Card */}
                <TouchableOpacity
                  onPress={() => {
                    if (savedCards.length > 0) {
                      setPaymentMethod('card');
                    } else {
                      setAllPaymentsModalVisible(false);
                      setAddCardPageVisible(true);
                    }
                  }}
                  style={[
                    styles.paymentOptionRow,
                    {
                      borderColor: paymentMethod === 'card' ? '#FE2C55' : palette.border,
                      backgroundColor: palette.glassSurface,
                    },
                  ]}
                >
                  <View style={styles.paymentOptionLeft}>
                    <View style={[styles.paymentBrandBadge, { backgroundColor: '#1E293B' }]}>
                      <MaterialCommunityIcons name="credit-card" size={20} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: palette.textPrimary }}>
                        Credit / Debit Card
                      </Text>
                      <Text style={{ fontSize: 11.5, color: palette.textSecondary }}>
                        {savedCards.length > 0
                          ? `${savedCards[0].brand} •••• ${savedCards[0].last4}`
                          : 'Add Visa / Mastercard'}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={21}
                    color={palette.textSecondary}
                  />
                </TouchableOpacity>

                {/* 4. Bank > */}
                <TouchableOpacity
                  onPress={() => setBankSelectModalVisible(true)}
                  style={[
                    styles.paymentOptionRow,
                    {
                      borderColor: paymentMethod === 'bank' ? '#FE2C55' : palette.border,
                      backgroundColor: palette.glassSurface,
                    },
                  ]}
                >
                  <View style={styles.paymentOptionLeft}>
                    <View style={[styles.paymentBrandBadge, { backgroundColor: '#B91C1C' }]}>
                      <MaterialCommunityIcons name="bank" size={20} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: palette.textPrimary }}>
                        Bank
                      </Text>
                      <Text style={{ fontSize: 11.5, color: palette.textSecondary }}>
                        {selectedBankObj
                          ? selectedBankObj.masked
                          : 'BPI, UnionBank direct account linking'}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={21}
                    color={palette.textSecondary}
                  />
                </TouchableOpacity>

                {/* 5. Cash on Delivery (COD) */}
                {isCodEligible && (
                  <TouchableOpacity
                    onPress={() => setPaymentMethod('cod')}
                    style={[
                      styles.paymentOptionRow,
                      {
                        borderColor: paymentMethod === 'cod' ? '#FE2C55' : palette.border,
                        backgroundColor: palette.glassSurface,
                      },
                    ]}
                  >
                    <View style={styles.paymentOptionLeft}>
                      <View style={[styles.paymentBrandBadge, { backgroundColor: '#EA580C' }]}>
                        <MaterialCommunityIcons name="cash-multiple" size={20} color="#FFFFFF" />
                      </View>
                      <View>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: palette.textPrimary }}>
                          Cash on Delivery (COD)
                        </Text>
                        <Text style={{ fontSize: 11.5, color: palette.textSecondary }}>
                          Supported for your address & courier
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.radioOuter,
                        { borderColor: paymentMethod === 'cod' ? '#FE2C55' : palette.textMuted },
                      ]}
                    >
                      {paymentMethod === 'cod' && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                )}

                <Button
                  mode="contained"
                  buttonColor="#FE2C55"
                  textColor="#FFFFFF"
                  style={[{ marginTop: 10, borderRadius: 22 }, webPrimaryButtonGradient]}
                  onPress={() => setAllPaymentsModalVisible(false)}
                >
                  Continue
                </Button>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ==================== MODAL 6: SELECT BANK TO LINK (BPI / UNIONBANK) ==================== */}
        <Modal visible={bankSelectModalVisible} animationType="fade" transparent>
          <View style={[styles.modalCenterOverlay, { backgroundColor: palette.glassOverlay }]}>
            <View
              style={[
                styles.modalDialogBox,
                { backgroundColor: palette.background, borderColor: palette.border },
                webGlassStyle,
              ]}
            >
              <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
                <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>
                  Select Bank to Link
                </Text>
                <IconButton
                  icon="close"
                  size={22}
                  iconColor={palette.textPrimary}
                  onPress={() => setBankSelectModalVisible(false)}
                  style={{ margin: 0 }}
                />
              </View>

              <TouchableOpacity
                onPress={() => handleLinkBankAccount('BPI')}
                style={[
                  styles.paymentOptionRow,
                  { borderColor: palette.border, backgroundColor: palette.glassSurface },
                ]}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={[styles.paymentBrandBadge, { backgroundColor: '#991B1B' }]}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 11 }}>BPI</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: palette.textPrimary }}>
                      BPI
                    </Text>
                    <Text style={{ fontSize: 12, color: palette.textSecondary }}>
                      Link your BPI account with Marketplace.
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={21} color={palette.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleLinkBankAccount('UnionBank')}
                style={[
                  styles.paymentOptionRow,
                  { borderColor: palette.border, backgroundColor: palette.glassSurface },
                ]}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={[styles.paymentBrandBadge, { backgroundColor: '#EA580C' }]}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 11 }}>UB</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: palette.textPrimary }}>
                      UnionBank
                    </Text>
                    <Text style={{ fontSize: 12, color: palette.textSecondary }}>
                      Link your UnionBank account with Marketplace.
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={21} color={palette.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ==================== MODAL 7: ADD CARD PAGE ==================== */}
        <Modal visible={addCardPageVisible} animationType="slide" transparent={false}>
          <View style={{ flex: 1, backgroundColor: palette.background }}>
            <View
              style={[
                styles.topHeaderBar,
                {
                  paddingTop: topSafePadding,
                  paddingHorizontal: 10,
                  backgroundColor: palette.glassNav,
                  borderBottomColor: palette.border,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => setAddCardPageVisible(false)}
                style={styles.headerBackBtn}
              >
                <MaterialCommunityIcons name="chevron-left" size={28} color={palette.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>Add Card</Text>
              <View style={{ minWidth: 54 }} />
            </View>

            <ScrollView
              contentContainerStyle={{
                padding: 16,
                gap: 12,
                maxWidth: isAnyDesktop ? 560 : undefined,
                width: '100%',
                alignSelf: 'center',
              }}
            >
              {Platform.OS !== 'web' && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: palette.accentSoft,
                  }}
                >
                  <MaterialCommunityIcons name="nfc" size={20} color={palette.accent} />
                  <Text style={{ fontSize: 12.5, color: palette.textPrimary, flex: 1 }}>
                    Enable NFC to automatically fill in your card details.
                  </Text>
                </View>
              )}

              <TextInput
                mode="outlined"
                label="Card Number"
                placeholder="Enter card number"
                keyboardType="numeric"
                maxLength={19}
                value={cardNumberInput}
                onChangeText={setCardNumberInput}
                right={
                  Platform.OS !== 'web' ? (
                    <TextInput.Icon
                      icon="camera-outline"
                      onPress={() =>
                        showMessage('Card Scanner', 'Position your card inside the camera frame.')
                      }
                    />
                  ) : undefined
                }
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  mode="outlined"
                  label="Expiration Date"
                  placeholder="MM/YY"
                  maxLength={5}
                  value={cardExpiryInput}
                  onChangeText={setCardExpiryInput}
                  style={{ flex: 1 }}
                />
                <TextInput
                  mode="outlined"
                  label="Security Code"
                  placeholder="CVV/CVC"
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={4}
                  value={cardCvvInput}
                  onChangeText={setCardCvvInput}
                  style={{ flex: 1 }}
                />
              </View>

              <TextInput
                mode="outlined"
                label="Cardholder Name"
                placeholder="Full name"
                value={cardHolderInput}
                onChangeText={setCardHolderInput}
              />

              <View
                style={{
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: palette.glassSurface,
                  borderWidth: 1,
                  borderColor: palette.border,
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 12, color: palette.textSecondary, lineHeight: 18 }}>
                  We keep your card information secure and encrypted. Your card's security code
                  (CVV/CVC) will not be stored. You can remove your card at any time.
                </Text>
                <Text style={{ fontSize: 12, color: palette.textSecondary, lineHeight: 18 }}>
                  To verify your card, a temporary authorization may be placed on your card. Any
                  authorization amount will be released or refunded according to your card issuer's
                  processing time.
                </Text>
              </View>

              <Button
                mode="contained"
                buttonColor="#FE2C55"
                textColor="#FFFFFF"
                loading={savingCard}
                disabled={savingCard}
                style={[{ borderRadius: 22, marginTop: 6 }, webPrimaryButtonGradient]}
                contentStyle={{ height: 44 }}
                onPress={handleSaveTokenizedCard}
              >
                Save
              </Button>
            </ScrollView>
          </View>
        </Modal>

        {/* ==================== MODAL 8: PRE-SUBMISSION ORDER CONFIRMATION ==================== */}
        <Modal visible={confirmModalVisible} animationType="fade" transparent>
          <View style={[styles.modalCenterOverlay, { backgroundColor: palette.glassOverlay }]}>
            <View
              style={[
                styles.modalDialogBox,
                { backgroundColor: palette.background, borderColor: palette.border },
                webGlassStyle,
              ]}
            >
              <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
                <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>
                  Confirm Your Order
                </Text>
                <IconButton
                  icon="close"
                  size={22}
                  iconColor={palette.textPrimary}
                  onPress={() => setConfirmModalVisible(false)}
                  style={{ margin: 0 }}
                />
              </View>

              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 12.5, color: palette.textSecondary }}>
                  <Text style={{ fontWeight: '800', color: palette.textPrimary }}>Deliver to: </Text>
                  {activeAddress?.fullName} ({activeAddress?.phoneNumber}) · {activeAddressFullText}
                </Text>
                <Text style={{ fontSize: 12.5, color: palette.textSecondary }}>
                  <Text style={{ fontWeight: '800', color: palette.textPrimary }}>Products: </Text>
                  {selectedCount} product(s), {selectedQuantity} PCS
                </Text>
                <Text style={{ fontSize: 12.5, color: palette.textSecondary }}>
                  <Text style={{ fontWeight: '800', color: palette.textPrimary }}>Coupon: </Text>
                  {effectiveCoupon ? effectiveCoupon.code : 'None'}
                </Text>
                <Text style={{ fontSize: 12.5, color: palette.textSecondary }}>
                  <Text style={{ fontWeight: '800', color: palette.textPrimary }}>Shipping: </Text>
                  {shippingCalculation.courierName} (Get by {shippingCalculation.getBySingleDate})
                </Text>
                <Text style={{ fontSize: 12.5, color: palette.textSecondary }}>
                  <Text style={{ fontWeight: '800', color: palette.textPrimary }}>Payment: </Text>
                  {paymentMethod.toUpperCase()}
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: palette.border }]} />
                <View style={styles.summaryLine}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: palette.textPrimary }}>
                    Final Total
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#FE2C55' }}>
                    {formatPeso(finalPayablePhp)}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <Button mode="outlined" onPress={() => setConfirmModalVisible(false)}>
                  Edit Details
                </Button>
                <Button
                  mode="contained"
                  buttonColor="#FE2C55"
                  textColor="#FFFFFF"
                  loading={placingOrder}
                  disabled={placingOrder}
                  style={webPrimaryButtonGradient}
                  onPress={handleConfirmAndSubmitOrder}
                >
                  Confirm & Pay
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ==================== MAIN CART SCREEN VIEW ====================
  const isEmpty = !cart || cart.items.length === 0;
  const totalCartUnits = cart ? cart.totalQuantity : 0;
  const isAllSelected = cart
    ? selectedItemKeys.length === cart.items.length && cart.items.length > 0
    : false;
  const freeShippingRemainingPhp = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD_PHP - discountedProductSubtotalPhp
  );
  const freeShippingProgressRatio = Math.min(
    1,
    discountedProductSubtotalPhp / FREE_SHIPPING_THRESHOLD_PHP
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: palette.isDark ? palette.background : '#F1F5FB' },
        webAmbientBackdropStyle,
      ]}
    >
      {renderAmbientOrbs()}

      {/* TOP BAR (< BACK | SHOPPING CART (N) | EDIT) */}
      <View
        style={[
          styles.topHeaderBar,
          {
            paddingTop: topSafePadding,
            paddingHorizontal: horizontalPadding,
            backgroundColor: palette.glassNav,
            borderBottomColor: palette.border,
          },
          webGlassStyle,
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.headerBackBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={palette.textPrimary} />
          {!isMobile && (
            <Text style={[styles.headerBackText, { color: palette.textPrimary }]}>Back</Text>
          )}
        </TouchableOpacity>

        <View style={styles.headerCenterBox}>
          <Text
            style={[
              styles.headerTitleText,
              {
                fontSize: isSmallPhone ? 16 : 18,
                color: palette.textPrimary,
              },
            ]}
          >
            Shopping cart ({totalCartUnits})
          </Text>

          <TouchableOpacity
            onPress={() => setAddressModalVisible(true)}
            activeOpacity={0.75}
            style={styles.headerAddressTrigger}
          >
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={14}
              color="#FE2C55"
              style={{ marginRight: 3 }}
            />
            <Text
              numberOfLines={1}
              style={[styles.headerAddressText, { color: palette.textPrimary }]}
            >
              {activeAddressFullText || 'Select or Add Delivery Address'}
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={16}
              color="#FE2C55"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => setIsEditMode((prev) => !prev)}
          style={styles.headerRightBtn}
        >
          <Text
            style={[
              styles.headerEditText,
              { color: isEditMode ? '#FE2C55' : palette.textPrimary },
            ]}
          >
            {isEditMode ? 'Done' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* EDIT BAR */}
      {isEditMode && (
        <View
          style={[
            styles.editActionBar,
            {
              paddingHorizontal: horizontalPadding,
              backgroundColor: palette.glassSurfaceElevated,
              borderBottomColor: palette.border,
            },
            webGlassStyle,
          ]}
        >
          <TouchableOpacity onPress={toggleSelectAll} style={styles.listAllBtn}>
            <MaterialCommunityIcons
              name={isAllSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
              size={20}
              color={isAllSelected ? '#FE2C55' : palette.textSecondary}
            />
            <Text style={[styles.listAllText, { color: palette.textPrimary }]}>
              List all ({selectedItemKeys.length}/{cart?.items.length || 0})
            </Text>
          </TouchableOpacity>

          <View style={styles.editButtonsGroup}>
            <TouchableOpacity
              onPress={handleMoveToFavorites}
              style={[
                styles.moveFavBtn,
                {
                  borderColor: palette.accent,
                  backgroundColor: palette.accentSoft,
                },
              ]}
            >
              <MaterialCommunityIcons name="heart-outline" size={15} color={palette.accent} />
              <Text style={[styles.moveFavText, { color: palette.accent }]}>
                Move to Favorites
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDeleteSelected} style={styles.deleteSelectedBtn}>
              <MaterialCommunityIcons name="trash-can-outline" size={15} color="#FE2C55" />
              <Text style={styles.deleteSelectedText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* FULL-WIDTH MAIN SCROLLABLE LIST (OCCUPIES ALL LEFT & RIGHT SPACE ON WEBSITE, TABLET & PHONE) */}
      <FlatList
        style={{ width: '100%', zIndex: 1 }}
        data={recommendedProducts}
        renderItem={renderRecommendedProduct}
        numColumns={numColumns}
        key={`cart-rec-grid-${numColumns}`}
        keyExtractor={(item) => `cart-rec-${item.id}`}
        onEndReached={fetchMoreRecommendedProducts}
        onEndReachedThreshold={0.5}
        onScroll={handleListScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FE2C55']} />
        }
        columnWrapperStyle={
          numColumns > 1
            ? { width: '100%', marginHorizontal: isSmallPhone ? -4 : -6 }
            : undefined
        }
        contentContainerStyle={{
          width: '100%',
          paddingHorizontal: horizontalPadding,
          paddingBottom: isMobile && !isEmpty ? bottomSafePadding + 100 : bottomSafePadding + 32,
        }}
        ListHeaderComponent={
          <View style={{ width: '100%' }}>
            {isEmpty ? (
              <View
                style={[
                  styles.glassCard,
                  {
                    width: '100%',
                    marginTop: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: isMobile ? 36 : 48,
                    paddingHorizontal: 16,
                    backgroundColor: palette.glassSurface,
                    borderColor: palette.border,
                  },
                  webGlassStyle,
                ]}
              >
                <View
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 999,
                    backgroundColor: 'rgba(254, 44, 85, 0.11)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <MaterialCommunityIcons name="cart-outline" size={46} color="#FE2C55" />
                </View>
                <Text
                  style={{
                    fontSize: 19,
                    fontWeight: '900',
                    marginTop: 14,
                    color: palette.textPrimary,
                    textAlign: 'center',
                  }}
                >
                  Your cart is empty
                </Text>
                <Text
                  style={{
                    fontSize: 13.5,
                    color: palette.textSecondary,
                    marginTop: 6,
                    textAlign: 'center',
                  }}
                >
                  Let's fill it with your favorite finds and great deals!
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/(app)/(tabs)/home' as any)}
                  activeOpacity={0.85}
                  style={[
                    {
                      marginTop: 22,
                      backgroundColor: '#FE2C55',
                      paddingHorizontal: 42,
                      paddingVertical: 13,
                      borderRadius: 999,
                    },
                    webPrimaryButtonGradient,
                  ]}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
                    Start shopping
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ width: '100%' }}>
                {/* FREE SHIPPING PROGRESS BAR */}
                <View
                  style={[
                    styles.shippingProgressCard,
                    {
                      width: '100%',
                      backgroundColor: palette.glassSurface,
                      borderColor: palette.border,
                    },
                    webGlassStyle,
                  ]}
                >
                  <View style={styles.shippingProgressHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <MaterialCommunityIcons
                        name="truck-fast-outline"
                        size={18}
                        color={freeShippingRemainingPhp === 0 ? palette.success : '#FE2C55'}
                      />
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 12.5,
                          fontWeight: '800',
                          color: palette.textPrimary,
                          flex: 1,
                        }}
                      >
                        {freeShippingRemainingPhp === 0
                          ? 'Unlocked FREE Standard Shipping!'
                          : `Add ${formatPeso(freeShippingRemainingPhp)} more for FREE Shipping`}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 11.5,
                        fontWeight: '800',
                        color: freeShippingRemainingPhp === 0 ? palette.success : '#FE2C55',
                      }}
                    >
                      {Math.round(freeShippingProgressRatio * 100)}%
                    </Text>
                  </View>

                  <View style={styles.shippingProgressTrack}>
                    <View
                      style={[
                        styles.shippingProgressFill,
                        {
                          width: `${Math.round(freeShippingProgressRatio * 100)}%`,
                          backgroundColor:
                            freeShippingRemainingPhp === 0 ? palette.success : '#FE2C55',
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* CART ITEMS FULL WIDTH */}
                <View style={{ width: '100%', paddingTop: 12 }}>
                  {cart!.items.map((item) => renderCartItem(item))}
                </View>

                {/* ORDER SUMMARY PLACED BELOW WITH GENEROUS LONG PADDING */}
                <View
                  style={[
                    styles.orderSummaryCardLong,
                    {
                      width: '100%',
                      backgroundColor: palette.glassSurface,
                      borderColor: palette.border,
                      paddingHorizontal: isAnyDesktop ? 32 : isTablet ? 26 : 20,
                      paddingVertical: isAnyDesktop ? 30 : 24,
                    },
                    webGlassStyle,
                  ]}
                >
                  <Text style={[styles.sectionHeading, { color: palette.textPrimary }]}>
                    Order Summary
                  </Text>

                  <View style={styles.summaryLine}>
                    <Text style={[styles.summaryLabel, { color: palette.textSecondary }]}>
                      Selected Products
                    </Text>
                    <Text style={[styles.summaryValue, { color: palette.textPrimary }]}>
                      {selectedCount} item(s)
                    </Text>
                  </View>

                  <View style={styles.summaryLine}>
                    <Text style={[styles.summaryLabel, { color: palette.textSecondary }]}>
                      Total Quantity
                    </Text>
                    <Text style={[styles.summaryValue, { color: palette.textPrimary }]}>
                      {selectedQuantity} pcs
                    </Text>
                  </View>

                  <View style={styles.summaryLine}>
                    <Text style={[styles.summaryLabel, { color: palette.textSecondary }]}>
                      Subtotal
                    </Text>
                    <Text style={[styles.summaryValue, { color: palette.textPrimary }]}>
                      {formatPeso(discountedProductSubtotalPhp)}
                    </Text>
                  </View>

                  <View style={styles.summaryLine}>
                    <Text style={[styles.summaryLabel, { color: palette.textSecondary }]}>
                      Estimated Shipping
                    </Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        {
                          color: shippingCalculation.isFreeShipping
                            ? palette.success
                            : palette.textPrimary,
                        },
                      ]}
                    >
                      {shippingCalculation.isFreeShipping
                        ? 'FREE'
                        : formatPeso(shippingCalculation.finalShippingPhp)}
                    </Text>
                  </View>

                  <View style={[styles.dividerLine, { backgroundColor: palette.border }]} />

                  <View style={styles.summaryLine}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: palette.textPrimary }}>
                      Estimated Total
                    </Text>
                    <Text style={{ fontSize: 20, fontWeight: '900', color: '#FE2C55' }}>
                      {formatPeso(finalPayablePhp)}
                    </Text>
                  </View>

                  {!isMobile && (
                    <Button
                      mode="contained"
                      onPress={handleProceedToCheckout}
                      disabled={selectedCount === 0}
                      style={[{ marginTop: 18, borderRadius: 24 }, webPrimaryButtonGradient]}
                      contentStyle={{ height: 48 }}
                      labelStyle={{ fontSize: 15, fontWeight: '800' }}
                      buttonColor="#FE2C55"
                      textColor="#FFFFFF"
                    >
                      {selectedCount > 0
                        ? `Checkout (${selectedCount} Items)`
                        : 'Select Items to Checkout'}
                    </Button>
                  )}
                </View>
              </View>
            )}

            <View
              style={{
                width: '100%',
                marginTop: isEmpty ? 18 : 24,
                marginBottom: 8,
                paddingHorizontal: 2,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
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
                You might also like
              </Title>
            </View>
          </View>
        }
        ListFooterComponent={
          <View style={{ width: '100%', paddingVertical: 22, alignItems: 'center' }}>
            {isFetchingMoreRec ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#FE2C55" />
                <Text style={{ fontSize: 13, color: palette.textSecondary }}>
                  Loading more products...
                </Text>
              </View>
            ) : !hasMoreRec && recommendedProducts.length > 0 ? (
              <Text style={{ fontSize: 12.5, color: palette.textMuted, fontWeight: '500' }}>
                You've reached the end of products
              </Text>
            ) : null}
          </View>
        }
      />

      {/* MOBILE STICKY BOTTOM CHECKOUT BAR */}
      {isMobile && !isEmpty && (
        <View
          style={[
            styles.stickyBottomBar,
            {
              paddingBottom: bottomSafePadding,
              backgroundColor: palette.glassNav,
              borderTopColor: palette.border,
            },
            webGlassStyle,
          ]}
        >
          <View style={styles.stickyBottomMainRow}>
            <TouchableOpacity
              onPress={toggleSelectAll}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Checkbox status={isAllSelected ? 'checked' : 'unchecked'} color="#FE2C55" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: palette.textPrimary }}>
                All
              </Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'flex-end', marginRight: 6 }}>
              <Text style={{ fontSize: 11, color: palette.textSecondary }}>
                Total ({selectedCount}):
              </Text>
              <Text style={{ fontSize: 15.5, fontWeight: '900', color: '#FE2C55' }}>
                {formatPeso(finalPayablePhp)}
              </Text>
            </View>

            <Button
              mode="contained"
              onPress={handleProceedToCheckout}
              disabled={selectedCount === 0}
              buttonColor="#FE2C55"
              textColor="#FFFFFF"
              style={[{ borderRadius: 20 }, webPrimaryButtonGradient]}
              contentStyle={{ height: 38 }}
              labelStyle={{ fontSize: 12.5, fontWeight: '800' }}
            >
              {selectedCount > 0 ? `Checkout (${selectedCount})` : 'Select Items'}
            </Button>
          </View>
        </View>
      )}

      {/* SHARED DELIVERY ADDRESS SELECTION MODAL */}
      {renderAddressModal()}
    </View>
  );
}