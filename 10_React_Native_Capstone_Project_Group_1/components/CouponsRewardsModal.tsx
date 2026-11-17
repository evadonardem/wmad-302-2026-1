/**
 * Coupons & Your Rewards Modal Component - Marketplace
 *
 * Student Implementation Guide:
 * Complete the Coupons / Your Rewards screen:
 * 1. Top header with Back (<), "Your rewards" title, and Cart shortcut with badge
 * 2. Summary stats card ("You saved", "Coupons >", "Bonus >")
 * 3. Mystery Gift Box banner with "Open" button and "Flash sale" reward card
 * 4. Vertically scrollable "Your coupons" sections:
 *    - Free shipping (with "See more coupons" toggle)
 *    - Exclusive coupon (with "Claim all" & "See more coupons" toggle)
 *    - More great coupons (connected to Flash Deals & Recommended for You products + "See more coupons" toggle)
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  useWindowDimensions,
  Alert,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MarketplaceProduct,
  FlashSaleSchedule,
  evaluateProductPromotions,
} from '../utils/flashSaleHelpers';

export interface CouponsRewardsModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string | number;
  cartBadgeCount: number;
  bonusBalance: number;
  connectedProducts: MarketplaceProduct[];
  flashSchedules: Record<number, FlashSaleSchedule>;
  nowMs: number;
  onOpenCart: () => void;
  onOpenFlashDeals: () => void;
  onOpenBonusCenter: () => void;
  onSelectProduct: (productId: number) => void;
  onTotalCouponsChange?: (count: number) => void;
  onBonusAdded?: (newBonus: number) => void;
}

type CouponTabType = 'Free shipping' | 'Exclusive coupon' | 'More great coupons';

interface VoucherTicketItem {
  id: string;
  discountText: string;
  minSpendText: string;
  expiryText: string;
  isXtra?: boolean;
  isLimited?: boolean;
  multiplier?: string;
  claimed: boolean;
}

const INITIAL_FREE_SHIPPING_COUPONS: VoucherTicketItem[] = [
  {
    id: 'fs-1',
    discountText: '₱100.00\noff',
    minSpendText: 'On orders over ₱0.01',
    expiryText: 'Expires in 14 hours',
    isXtra: true,
    claimed: true,
  },
  {
    id: 'fs-2',
    discountText: '₱100.00\noff',
    minSpendText: 'On orders over ₱0.01',
    expiryText: 'Expires in 14 hours',
    isXtra: true,
    claimed: true,
  },
  {
    id: 'fs-3',
    discountText: '₱50.00\noff',
    minSpendText: 'On orders over ₱1.00',
    expiryText: 'Expires in 14 hours',
    isXtra: true,
    claimed: true,
  },
  {
    id: 'fs-4',
    discountText: '₱50.00\noff',
    minSpendText: 'On orders over ₱1.00',
    expiryText: 'Expires in 14 hours',
    isXtra: true,
    claimed: true,
  },
  {
    id: 'fs-5',
    discountText: '₱25.00\noff',
    minSpendText: 'On orders over ₱50.00',
    expiryText: 'Expires in 14 hours',
    isXtra: true,
    claimed: true,
  },
  {
    id: 'fs-6',
    discountText: '₱25.00\noff',
    minSpendText: 'On orders over ₱50.00',
    expiryText: 'Expires in 14 hours',
    isXtra: true,
    multiplier: 'x3',
    claimed: true,
  },
  {
    id: 'fs-7',
    discountText: '₱60.00\noff',
    minSpendText: 'On orders over ₱99.00',
    expiryText: 'Expires in 20 hours',
    isXtra: true,
    claimed: true,
  },
  {
    id: 'fs-8',
    discountText: '₱120.00\noff',
    minSpendText: 'On orders over ₱199.00',
    expiryText: 'Expires in 24 hours',
    isXtra: true,
    multiplier: 'x2',
    claimed: true,
  },
];

const INITIAL_EXCLUSIVE_COUPONS: VoucherTicketItem[] = [
  {
    id: 'ex-1',
    discountText: '7% off',
    minSpendText: 'On orders over ₱50.00',
    expiryText: 'Valid for 1 day after claiming',
    isXtra: true,
    isLimited: true,
    claimed: false,
  },
  {
    id: 'ex-2',
    discountText: '10%\noff',
    minSpendText: 'On orders over ₱69.00',
    expiryText: 'Valid for 1 day after claiming',
    isXtra: true,
    isLimited: true,
    claimed: false,
  },
  {
    id: 'ex-3',
    discountText: '₱25.00\noff',
    minSpendText: 'On orders over ₱169.00',
    expiryText: 'Valid for 1 day after claiming',
    isXtra: true,
    isLimited: true,
    claimed: false,
  },
  {
    id: 'ex-4',
    discountText: '8% off',
    minSpendText: 'On orders over ₱250.00',
    expiryText: 'Valid for 1 day after claiming',
    isXtra: true,
    isLimited: true,
    claimed: false,
  },
  {
    id: 'ex-5',
    discountText: '13%\noff',
    minSpendText: 'On orders over ₱269.00',
    expiryText: 'Valid for 1 day after claiming',
    isXtra: true,
    isLimited: true,
    claimed: false,
  },
  {
    id: 'ex-6',
    discountText: '₱59.00\noff',
    minSpendText: 'On orders over ₱299.00',
    expiryText: 'Valid from 11/16/2026 - 11/17/2026',
    isXtra: false,
    isLimited: true,
    claimed: false,
  },
  {
    id: 'ex-7',
    discountText: '15%\noff',
    minSpendText: 'On orders over ₱399.00',
    expiryText: 'Valid for 1 day after claiming',
    isXtra: true,
    isLimited: true,
    claimed: false,
  },
  {
    id: 'ex-8',
    discountText: '₱110.00\noff',
    minSpendText: 'On orders over ₱599.00',
    expiryText: 'Valid for 2 days after claiming',
    isXtra: true,
    isLimited: true,
    claimed: false,
  },
];

export default function CouponsRewardsModal({
  visible,
  onClose,
  userId,
  cartBadgeCount,
  bonusBalance,
  connectedProducts,
  flashSchedules,
  nowMs,
  onOpenCart,
  onOpenFlashDeals,
  onOpenBonusCenter,
  onSelectProduct,
  onTotalCouponsChange,
  onBonusAdded,
}: CouponsRewardsModalProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive Breakpoints: Website (>= 1024), Tablet (768-1023), Phones (< 768: Realme, iPhone, Samsung, Xiaomi, OPPO, Vivo)
  const isUltraWideDesktop = width >= 1500;
  const isAnyDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isSmallPhone = width <= 375;

  const voucherCardWidth: any = isUltraWideDesktop
    ? '32.6%'
    : isAnyDesktop || isTablet
      ? '49.3%'
      : '100%';

  const storeCouponCardWidth: any = isUltraWideDesktop
    ? '32.6%'
    : isAnyDesktop
      ? '49.3%'
      : '100%';

  const horizontalPadding = isAnyDesktop ? 28 : isTablet ? 18 : 12;
  const topSafePadding = Platform.OS === 'web' ? 14 : Math.max(insets.top, 12);
  const bottomSafePadding = Platform.OS === 'web' ? 44 : Math.max(insets.bottom + 20, 32);

  const userCouponsKey = `@marketplace_user_${userId || 'guest'}_claimed_coupons`;

  const [activeCouponTab, setActiveCouponTab] = useState<CouponTabType>('Free shipping');
  const [freeShippingCoupons] = useState<VoucherTicketItem[]>(INITIAL_FREE_SHIPPING_COUPONS);
  const [exclusiveCoupons, setExclusiveCoupons] = useState<VoucherTicketItem[]>(
    INITIAL_EXCLUSIVE_COUPONS
  );
  const [claimedStoreProductIds, setClaimedStoreProductIds] = useState<number[]>([]);
  const [showAllFreeShipping, setShowAllFreeShipping] = useState<boolean>(false);
  const [showAllExclusive, setShowAllExclusive] = useState<boolean>(false);
  const [showAllMoreGreat, setShowAllMoreGreat] = useState<boolean>(false);
  const [giftOpened, setGiftOpened] = useState<boolean>(false);
  const [savedAmount, setSavedAmount] = useState<number>(91.25);

  const rewardsScrollRef = useRef<ScrollView | null>(null);
  const sectionYRef = useRef<Record<CouponTabType, number>>({
    'Free shipping': 0,
    'Exclusive coupon': 0,
    'More great coupons': 0,
  });

  // ==================== CONTINUOUS HERO GIFT & FLOATING BUBBLE ANIMATIONS ====================
  const giftFloatAnim = useRef(new Animated.Value(0)).current;
  const giftTiltAnim = useRef(new Animated.Value(0)).current;
  const giftPulseAnim = useRef(new Animated.Value(1)).current;
  const giftOpenBurstAnim = useRef(new Animated.Value(1)).current;

  const truckBubbleAnim = useRef(new Animated.Value(0)).current;
  const percentBubbleAnim = useRef(new Animated.Value(0)).current;
  const ticketBubbleAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    const useNative = Platform.OS !== 'web';

    const giftFloatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(giftFloatAnim, {
          toValue: -9,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: useNative,
        }),
        Animated.timing(giftFloatAnim, {
          toValue: 3,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: useNative,
        }),
      ])
    );

    const giftTiltLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(giftTiltAnim, {
          toValue: 1,
          duration: 1750,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: useNative,
        }),
        Animated.timing(giftTiltAnim, {
          toValue: -1,
          duration: 1750,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: useNative,
        }),
      ])
    );

    const giftPulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(giftPulseAnim, {
          toValue: 1.09,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: useNative,
        }),
        Animated.timing(giftPulseAnim, {
          toValue: 0.96,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: useNative,
        }),
      ])
    );

    const truckBubbleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(truckBubbleAnim, {
          toValue: 1,
          duration: 1850,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: useNative,
        }),
        Animated.timing(truckBubbleAnim, {
          toValue: 0,
          duration: 1850,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: useNative,
        }),
      ])
    );

    const percentBubbleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(percentBubbleAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: useNative,
        }),
        Animated.timing(percentBubbleAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: useNative,
        }),
      ])
    );

    const ticketBubbleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ticketBubbleAnim, {
          toValue: 1,
          duration: 2100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: useNative,
        }),
        Animated.timing(ticketBubbleAnim, {
          toValue: 0,
          duration: 2100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: useNative,
        }),
      ])
    );

    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: useNative,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0.25,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: useNative,
        }),
      ])
    );

    giftFloatLoop.start();
    giftTiltLoop.start();
    giftPulseLoop.start();
    truckBubbleLoop.start();
    percentBubbleLoop.start();
    ticketBubbleLoop.start();
    sparkleLoop.start();

    return () => {
      giftFloatLoop.stop();
      giftTiltLoop.stop();
      giftPulseLoop.stop();
      truckBubbleLoop.stop();
      percentBubbleLoop.stop();
      ticketBubbleLoop.stop();
      sparkleLoop.stop();
    };
  }, [
    visible,
    giftFloatAnim,
    giftTiltAnim,
    giftPulseAnim,
    truckBubbleAnim,
    percentBubbleAnim,
    ticketBubbleAnim,
    sparkleAnim,
  ]);

  const triggerGiftOpenSpring = () => {
    const useNative = Platform.OS !== 'web';
    Animated.sequence([
      Animated.timing(giftOpenBurstAnim, {
        toValue: 0.88,
        duration: 110,
        useNativeDriver: useNative,
      }),
      Animated.spring(giftOpenBurstAnim, {
        toValue: 1.16,
        friction: 4,
        tension: 120,
        useNativeDriver: useNative,
      }),
      Animated.spring(giftOpenBurstAnim, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: useNative,
      }),
    ]).start();
  };

  const giftRotateDeg = giftTiltAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-4.5deg', '4.5deg'],
  });

  const truckTranslateY = truckBubbleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const truckTranslateX = truckBubbleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 5],
  });

  const percentTranslateY = percentBubbleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -9],
  });

  const percentRotateDeg = percentBubbleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-8deg', '8deg'],
  });

  const ticketTranslateY = ticketBubbleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, -10],
  });

  const ticketRotateDeg = ticketBubbleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['6deg', '-6deg'],
  });

  const webGlassStyle: any =
    Platform.OS === 'web'
      ? { backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }
      : {};

  const webAmbientBackdropStyle: any =
    Platform.OS === 'web'
      ? {
          backgroundImage:
            'radial-gradient(circle at 14% 12%, rgba(254, 44, 85, 0.24), transparent 44%), radial-gradient(circle at 86% 18%, rgba(45, 212, 191, 0.16), transparent 44%), radial-gradient(circle at 50% 84%, rgba(246, 224, 94, 0.10), transparent 48%), linear-gradient(135deg, #09090D 0%, #140910 52%, #0D111A 100%)',
        }
      : {};

  const webHeroGradient: any =
    Platform.OS === 'web'
      ? {
          backgroundImage:
            'linear-gradient(135deg, #25060C 0%, #4A0D1C 52%, #FE2C55 128%)',
          boxShadow: '0 16px 36px rgba(254, 44, 85, 0.25)',
        }
      : {};

  const webPrimaryButtonGradient: any =
    Platform.OS === 'web'
      ? {
          backgroundImage: 'linear-gradient(90deg, #F42C55 0%, #FF5E7E 100%)',
          boxShadow: '0 8px 22px rgba(244, 44, 85, 0.36)',
        }
      : {};

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

  const loadCouponStates = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(userCouponsKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.exclusiveCoupons) setExclusiveCoupons(parsed.exclusiveCoupons);
      if (Array.isArray(parsed.claimedStoreProductIds)) {
        setClaimedStoreProductIds(parsed.claimedStoreProductIds);
      }
      if (typeof parsed.giftOpened === 'boolean') setGiftOpened(parsed.giftOpened);
      if (typeof parsed.savedAmount === 'number') setSavedAmount(parsed.savedAmount);
    } catch {
      // Ignore storage read errors
    }
  }, [userCouponsKey]);

  useEffect(() => {
    loadCouponStates();
  }, [loadCouponStates, visible]);

  const totalCouponsCount =
    63 +
    exclusiveCoupons.filter((c) => c.claimed).length +
    claimedStoreProductIds.length;

  useEffect(() => {
    if (onTotalCouponsChange) {
      onTotalCouponsChange(totalCouponsCount);
    }
  }, [totalCouponsCount, onTotalCouponsChange]);

  const persistCouponStates = async (next: {
    exclusiveCoupons?: VoucherTicketItem[];
    claimedStoreProductIds?: number[];
    giftOpened?: boolean;
    savedAmount?: number;
  }) => {
    try {
      await AsyncStorage.setItem(
        userCouponsKey,
        JSON.stringify({
          exclusiveCoupons: next.exclusiveCoupons ?? exclusiveCoupons,
          claimedStoreProductIds: next.claimedStoreProductIds ?? claimedStoreProductIds,
          giftOpened: next.giftOpened ?? giftOpened,
          savedAmount: next.savedAmount ?? savedAmount,
        })
      );
    } catch {
      // Ignore storage write errors
    }
  };

  const notifyUser = (title: string, msg: string) => {
    const webWin = (globalThis as any)?.window;
    if (Platform.OS === 'web' && webWin?.alert) {
      webWin.alert(`${title}\n\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleOpenMysteryGift = () => {
    triggerGiftOpenSpring();
    if (giftOpened) {
      notifyUser('Gift Already Opened', 'You already unlocked your ₱50.00 mystery bonus!');
      return;
    }
    const nextBonus = Number((bonusBalance + 50).toFixed(2));
    setGiftOpened(true);
    if (onBonusAdded) onBonusAdded(nextBonus);
    persistCouponStates({ giftOpened: true });
    notifyUser('Congratulations!', 'You unlocked a ₱50.00 Bonus & Free Shipping Reward!');
  };

  const handleClaimExclusive = (id: string) => {
    const updated = exclusiveCoupons.map((c) => (c.id === id ? { ...c, claimed: true } : c));
    setExclusiveCoupons(updated);
    persistCouponStates({ exclusiveCoupons: updated });
  };

  const handleClaimAllExclusive = () => {
    const updated = exclusiveCoupons.map((c) => ({ ...c, claimed: true }));
    setExclusiveCoupons(updated);
    persistCouponStates({ exclusiveCoupons: updated });
    notifyUser('Claimed All', 'All exclusive coupons have been added to your account!');
  };

  const handleClaimStoreProductCoupon = (productId: number) => {
    if (claimedStoreProductIds.includes(productId)) return;
    const updated = [...claimedStoreProductIds, productId];
    setClaimedStoreProductIds(updated);
    persistCouponStates({ claimedStoreProductIds: updated });
  };

  const handleUseCoupon = (label: string, productId?: number) => {
    onClose();
    if (productId) {
      onSelectProduct(productId);
      return;
    }
    notifyUser('Voucher Ready', `${label.replace('\n', ' ')} will apply automatically at checkout.`);
  };

  const scrollToCouponSection = (tab: CouponTabType) => {
    setActiveCouponTab(tab);
    const targetY = sectionYRef.current[tab];
    if (rewardsScrollRef.current && typeof targetY === 'number') {
      rewardsScrollRef.current.scrollTo({ y: Math.max(0, targetY - 12), animated: true });
    }
  };

  const formattedBonus =
    bonusBalance === 0 ? '0' : bonusBalance.toFixed(2).replace(/\.00$/, '');

  const visibleFreeShipping = showAllFreeShipping
    ? freeShippingCoupons
    : freeShippingCoupons.slice(0, isUltraWideDesktop ? 3 : 2);

  const visibleExclusive = showAllExclusive
    ? exclusiveCoupons
    : exclusiveCoupons.slice(0, isUltraWideDesktop ? 3 : 2);

  const visibleMoreGreat = showAllMoreGreat
    ? connectedProducts
    : connectedProducts.slice(0, isUltraWideDesktop ? 6 : 4);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View
        style={[
          {
            flex: 1,
            width: '100%',
            backgroundColor: '#0A0A0E',
            position: 'relative',
            overflow: 'hidden',
          },
          webAmbientBackdropStyle,
        ]}
      >
        {/* Ambient Decorative Glow Orbs */}
        <View pointerEvents="none" style={localStyles.ambientLayer}>
          <View
            style={[
              localStyles.orbTopLeft,
              { backgroundColor: 'rgba(254, 44, 85, 0.20)' },
            ]}
          />
          <View
            style={[
              localStyles.orbTopRight,
              { backgroundColor: 'rgba(45, 212, 191, 0.14)' },
            ]}
          />
          <View
            style={[
              localStyles.orbCenter,
              { backgroundColor: 'rgba(246, 224, 94, 0.08)' },
            ]}
          />
          <View
            style={[
              localStyles.orbBottomRight,
              { backgroundColor: 'rgba(254, 44, 85, 0.14)' },
            ]}
          />
        </View>

        {/* FULL-WIDTH TOP CRIMSON HEADER (< | Your rewards | Cart) */}
        <View
          style={{
            width: '100%',
            backgroundColor: '#2B070E',
            paddingTop: topSafePadding,
            paddingBottom: 12,
            paddingHorizontal: horizontalPadding,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.75}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 4, minWidth: 68 }}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Back</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF' }}>
            Your rewards
          </Text>

          <TouchableOpacity
            onPress={() => {
              onClose();
              onOpenCart();
            }}
            activeOpacity={0.75}
            style={{ padding: 4, minWidth: 68, alignItems: 'flex-end', position: 'relative' }}
          >
            <MaterialCommunityIcons name="cart-outline" size={24} color="#FFFFFF" />
            {cartBadgeCount > 0 && (
              <Badge
                size={15}
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  backgroundColor: '#FE2C55',
                  color: '#FFFFFF',
                  fontWeight: '800',
                }}
              >
                {cartBadgeCount}
              </Badge>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={rewardsScrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: bottomSafePadding,
            width: '100%',
            zIndex: 1,
          }}
        >
          {/* FULL-WIDTH CRIMSON HERO BANNER */}
          <View
            style={[
              {
                width: '100%',
                backgroundColor: '#25060C',
                paddingHorizontal: horizontalPadding,
                paddingTop: 8,
                paddingBottom: 22,
                borderBottomLeftRadius: isAnyDesktop ? 0 : 24,
                borderBottomRightRadius: isAnyDesktop ? 0 : 24,
              },
              webHeroGradient,
            ]}
          >
            {/* Summary Bar: You saved | Coupons | Bonus */}
            <View
              style={[
                {
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.11)',
                  borderRadius: 18,
                  paddingVertical: 16,
                  paddingHorizontal: isAnyDesktop ? 24 : 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.16)',
                },
                webGlassStyle,
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#FFFFFF' }}>
                  You saved
                </Text>
                <Text style={{ fontSize: 16.5, fontWeight: '900', color: '#FF4D6D', marginTop: 3 }}>
                  ₱{savedAmount.toFixed(2)} ›
                </Text>
              </View>

              <View
                style={{
                  width: 1,
                  height: 36,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  marginHorizontal: 12,
                }}
              />

              <TouchableOpacity
                onPress={() => scrollToCouponSection('Free shipping')}
                style={{ flex: 1, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 18.5, fontWeight: '900', color: '#FF4D6D' }}>
                  {totalCouponsCount}
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.80)', marginTop: 2 }}>
                  Coupons ›
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onOpenBonusCenter();
                }}
                style={{ flex: 1, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 18.5, fontWeight: '900', color: '#FF4D6D' }}>
                  {formattedBonus}
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.80)', marginTop: 2 }}>
                  Bonus ›
                </Text>
              </TouchableOpacity>
            </View>

            {/* ANIMATED 3D GIFT BOX ILLUSTRATION WITH FLOATING REWARD BUBBLES */}
            <View
              style={{
                width: '100%',
                height: 176,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 12,
                position: 'relative',
              }}
            >
              {/* Twinkling Accent Sparkles */}
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 14,
                  right: isAnyDesktop ? '28%' : isSmallPhone ? 78 : 112,
                  opacity: sparkleAnim,
                }}
              >
                <MaterialCommunityIcons name="star-four-points" size={16} color="#F6E05E" />
              </Animated.View>

              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  bottom: 24,
                  right: isAnyDesktop ? '24%' : isSmallPhone ? 62 : 94,
                  opacity: sparkleAnim,
                }}
              >
                <MaterialCommunityIcons name="star-four-points" size={14} color="#4FD1C5" />
              </Animated.View>

              {/* Floating Bubble 1: Free Shipping Truck (Left) */}
              <Animated.View
                style={{
                  position: 'absolute',
                  left: isAnyDesktop ? '14%' : isSmallPhone ? 18 : 34,
                  bottom: 22,
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.32)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [
                    { translateY: truckTranslateY },
                    { translateX: truckTranslateX },
                  ],
                }}
              >
                <MaterialCommunityIcons name="truck-fast" size={28} color="#4FD1C5" />
              </Animated.View>

              {/* Floating Bubble 2: Discount Percent Ticket (Upper Left) */}
              <Animated.View
                style={{
                  position: 'absolute',
                  left: isAnyDesktop ? '28%' : isSmallPhone ? 68 : 92,
                  top: 10,
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.32)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [
                    { translateY: percentTranslateY },
                    { rotate: percentRotateDeg },
                  ],
                }}
              >
                <MaterialCommunityIcons name="ticket-percent" size={23} color="#FF758F" />
              </Animated.View>

              {/* Breathing Halo Aura Behind Center Gift Box */}
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  width: 132,
                  height: 132,
                  borderRadius: 36,
                  backgroundColor: 'rgba(254, 44, 85, 0.16)',
                  transform: [{ scale: giftPulseAnim }],
                }}
              />

              {/* Interactive Levitating & Tilting Center Gift Box */}
              <TouchableOpacity
                onPress={handleOpenMysteryGift}
                activeOpacity={0.9}
                accessibilityLabel="Open Mystery Gift Box"
              >
                <Animated.View
                  style={{
                    width: 116,
                    height: 116,
                    borderRadius: 28,
                    backgroundColor: 'rgba(255, 77, 109, 0.25)',
                    borderWidth: 1.5,
                    borderColor: 'rgba(255, 117, 143, 0.42)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [
                      { translateY: giftFloatAnim },
                      { rotate: giftRotateDeg },
                      { scale: giftOpenBurstAnim },
                    ],
                  }}
                >
                  <MaterialCommunityIcons
                    name={giftOpened ? 'gift-open' : 'gift'}
                    size={84}
                    color="#FF5C8A"
                  />
                </Animated.View>
              </TouchableOpacity>

              {/* Floating Bubble 3: Gold Voucher Ticket (Right) */}
              <Animated.View
                style={{
                  position: 'absolute',
                  right: isAnyDesktop ? '16%' : isSmallPhone ? 24 : 42,
                  top: 38,
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.32)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [
                    { translateY: ticketTranslateY },
                    { rotate: ticketRotateDeg },
                  ],
                }}
              >
                <MaterialCommunityIcons name="ticket-confirmation" size={27} color="#F6E05E" />
              </Animated.View>
            </View>

            {/* Full-Width Crimson "Open" Pill Button */}
            <TouchableOpacity
              onPress={handleOpenMysteryGift}
              activeOpacity={0.85}
              style={[
                {
                  width: '100%',
                  backgroundColor: '#F42C55',
                  borderRadius: 999,
                  paddingVertical: 13.5,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                },
                webPrimaryButtonGradient,
              ]}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900' }}>
                {giftOpened ? 'Opened ✓' : 'Open'}
              </Text>
            </TouchableOpacity>

            {/* Get more rewards Section (Flash sale) */}
            <Text
              style={{
                fontSize: 15.5,
                fontWeight: '800',
                color: '#FFFFFF',
                marginBottom: 10,
              }}
            >
              Get more rewards
            </Text>

            <TouchableOpacity
              onPress={() => {
                onClose();
                onOpenFlashDeals();
              }}
              activeOpacity={0.85}
              style={[
                {
                  width: '100%',
                  backgroundColor: 'rgba(17, 17, 22, 0.78)',
                  borderRadius: 16,
                  padding: 15,
                  minHeight: 86,
                  justifyContent: 'space-between',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.14)',
                },
                webGlassStyle,
              ]}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '800',
                  color: '#FFFFFF',
                }}
              >
                Flash sale
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 8,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons name="arrow-right" size={16} color="#111114" />
                </View>
                <MaterialCommunityIcons name="alarm" size={34} color="#FF5C8A" />
              </View>
            </TouchableOpacity>
          </View>

          {/* FULL-WIDTH YOUR COUPONS SECTION (ALL 3 SECTIONS STACKED VERTICALLY AS YOU SCROLL DOWN) */}
          <View style={{ width: '100%', paddingHorizontal: horizontalPadding, paddingTop: 20 }}>
            <Text style={{ fontSize: 17, fontWeight: '900', color: '#FFFFFF', marginBottom: 12 }}>
              Your coupons
            </Text>

            {/* Quick Section Jump Bar */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={webHideScrollbarStyle}
              {...(Platform.OS === 'web' ? { className: 'no-scrollbar' } : {})}
              contentContainerStyle={{
                flexDirection: 'row',
                gap: isAnyDesktop ? 28 : 20,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255,255,255,0.12)',
                marginBottom: 18,
              }}
            >
              {(
                [
                  'Free shipping',
                  'Exclusive coupon',
                  'More great coupons',
                ] as CouponTabType[]
              ).map((tab) => {
                const isActive = activeCouponTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => scrollToCouponSection(tab)}
                    activeOpacity={0.8}
                    style={{
                      paddingBottom: 9,
                      borderBottomWidth: 2.5,
                      borderBottomColor: isActive ? '#FFFFFF' : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: isActive ? '800' : '600',
                        color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.58)',
                      }}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ==================== SECTION 1: FREE SHIPPING ==================== */}
            <View
              onLayout={(e) => {
                sectionYRef.current['Free shipping'] = e.nativeEvent.layout.y;
              }}
              style={{ width: '100%', marginBottom: 24 }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 16.5, fontWeight: '900', color: '#FFFFFF' }}>
                  Free shipping (31)
                </Text>
                <View
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    paddingHorizontal: 14,
                    paddingVertical: 5,
                    borderRadius: 999,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.88)' }}>
                    Claimed
                  </Text>
                </View>
              </View>

              <View
                style={{
                  width: '100%',
                  flexDirection: isAnyDesktop || isTablet ? 'row' : 'column',
                  flexWrap: isAnyDesktop || isTablet ? 'wrap' : 'nowrap',
                  justifyContent: isAnyDesktop || isTablet ? 'space-between' : 'flex-start',
                }}
              >
                {visibleFreeShipping.map((voucher) => (
                  <Card
                    key={voucher.id}
                    elevation={0}
                    style={[
                      {
                        width: voucherCardWidth,
                        backgroundColor: 'rgba(19, 34, 36, 0.85)',
                        borderRadius: 14,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: 'rgba(45, 212, 191, 0.28)',
                        overflow: 'hidden',
                        position: 'relative',
                      },
                      webGlassStyle,
                    ]}
                  >
                    <View style={{ flexDirection: 'row', width: '100%' }}>
                      {voucher.multiplier && (
                        <View
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            backgroundColor: '#2DD4BF',
                            paddingHorizontal: 6,
                            paddingVertical: 1.5,
                            borderBottomRightRadius: 8,
                            zIndex: 2,
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '900', color: '#07191A' }}>
                            {voucher.multiplier}
                          </Text>
                        </View>
                      )}

                      <View
                        style={{
                          width: isSmallPhone ? 96 : 112,
                          paddingVertical: 16,
                          paddingHorizontal: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRightWidth: 1,
                          borderRightColor: 'rgba(45, 212, 191, 0.25)',
                          borderStyle: 'dashed',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: isSmallPhone ? 16 : 18,
                            fontWeight: '900',
                            color: '#4FD1C5',
                            textAlign: 'center',
                            lineHeight: 22,
                          }}
                        >
                          {voucher.discountText}
                        </Text>
                      </View>

                      <View
                        style={{
                          flex: 1,
                          padding: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                        }}
                      >
                        <View style={{ flex: 1, gap: 5 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                            {voucher.isXtra && (
                              <View
                                style={{
                                  backgroundColor: '#2DD4BF',
                                  paddingHorizontal: 5,
                                  paddingVertical: 1.5,
                                  borderRadius: 4,
                                }}
                              >
                                <Text style={{ fontSize: 9.5, fontWeight: '900', color: '#07191A' }}>
                                  XTRA
                                </Text>
                              </View>
                            )}
                            <View
                              style={{
                                backgroundColor: 'rgba(45, 212, 191, 0.16)',
                                paddingHorizontal: 6,
                                paddingVertical: 1.5,
                                borderRadius: 4,
                              }}
                            >
                              <Text style={{ fontSize: 10, fontWeight: '700', color: '#4FD1C5' }}>
                                From TikTok Shop
                              </Text>
                            </View>
                          </View>

                          <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#FFFFFF' }}>
                            {voucher.minSpendText}
                          </Text>

                          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.58)' }}>
                            {voucher.expiryText}
                          </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
                          <TouchableOpacity
                            onPress={() => handleUseCoupon(voucher.discountText)}
                            activeOpacity={0.8}
                            style={{
                              borderWidth: 1,
                              borderColor: '#4FD1C5',
                              borderRadius: 999,
                              paddingHorizontal: 18,
                              paddingVertical: 5,
                            }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: '800', color: '#4FD1C5' }}>
                              Use
                            </Text>
                          </TouchableOpacity>
                          <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#4FD1C5' }}>
                            T&C
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => setShowAllFreeShipping((prev) => !prev)}
                activeOpacity={0.75}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)' }}>
                  {showAllFreeShipping ? 'Show less' : 'See more coupons'}
                </Text>
                <MaterialCommunityIcons
                  name={showAllFreeShipping ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="rgba(255,255,255,0.85)"
                />
              </TouchableOpacity>
            </View>

            {/* ==================== SECTION 2: EXCLUSIVE COUPON ==================== */}
            <View
              onLayout={(e) => {
                sectionYRef.current['Exclusive coupon'] = e.nativeEvent.layout.y;
              }}
              style={{ width: '100%', marginBottom: 24 }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 16.5, fontWeight: '900', color: '#FFFFFF' }}>
                  Exclusive coupon (11)
                </Text>
                <TouchableOpacity
                  onPress={handleClaimAllExclusive}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.14)',
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 999,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                    Claim all
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={{
                  width: '100%',
                  flexDirection: isAnyDesktop || isTablet ? 'row' : 'column',
                  flexWrap: isAnyDesktop || isTablet ? 'wrap' : 'nowrap',
                  justifyContent: isAnyDesktop || isTablet ? 'space-between' : 'flex-start',
                }}
              >
                {visibleExclusive.map((voucher) => (
                  <Card
                    key={voucher.id}
                    elevation={0}
                    style={[
                      {
                        width: voucherCardWidth,
                        backgroundColor: 'rgba(36, 20, 24, 0.86)',
                        borderRadius: 14,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: 'rgba(254, 44, 85, 0.30)',
                        overflow: 'hidden',
                      },
                      webGlassStyle,
                    ]}
                  >
                    <View style={{ flexDirection: 'row', width: '100%' }}>
                      <View
                        style={{
                          width: isSmallPhone ? 96 : 112,
                          paddingVertical: 16,
                          paddingHorizontal: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRightWidth: 1,
                          borderRightColor: 'rgba(254, 44, 85, 0.28)',
                          borderStyle: 'dashed',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: isSmallPhone ? 16 : 18,
                            fontWeight: '900',
                            color: '#FF4D6D',
                            textAlign: 'center',
                            lineHeight: 22,
                          }}
                        >
                          {voucher.discountText}
                        </Text>
                      </View>

                      <View
                        style={{
                          flex: 1,
                          padding: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                        }}
                      >
                        <View style={{ flex: 1, gap: 5 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                            {voucher.isXtra && (
                              <View
                                style={{
                                  backgroundColor: '#F42C55',
                                  paddingHorizontal: 5,
                                  paddingVertical: 1.5,
                                  borderRadius: 4,
                                }}
                              >
                                <Text style={{ fontSize: 9.5, fontWeight: '900', color: '#FFFFFF' }}>
                                  EXTRA
                                </Text>
                              </View>
                            )}
                            {voucher.isLimited && (
                              <View
                                style={{
                                  backgroundColor: 'rgba(254, 44, 85, 0.2)',
                                  paddingHorizontal: 5,
                                  paddingVertical: 1.5,
                                  borderRadius: 4,
                                }}
                              >
                                <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#FF758F' }}>
                                  Limited redemption
                                </Text>
                              </View>
                            )}
                            <View
                              style={{
                                backgroundColor: 'rgba(254, 44, 85, 0.2)',
                                paddingHorizontal: 5,
                                paddingVertical: 1.5,
                                borderRadius: 4,
                              }}
                            >
                              <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#FF758F' }}>
                                From TikTok Shop
                              </Text>
                            </View>
                          </View>

                          <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#FFFFFF' }}>
                            {voucher.minSpendText}
                          </Text>

                          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.58)' }}>
                            {voucher.expiryText}
                          </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
                          <TouchableOpacity
                            onPress={() =>
                              voucher.claimed
                                ? handleUseCoupon(voucher.discountText)
                                : handleClaimExclusive(voucher.id)
                            }
                            activeOpacity={0.85}
                            style={{
                              backgroundColor: voucher.claimed ? 'transparent' : '#F42C55',
                              borderWidth: 1,
                              borderColor: '#F42C55',
                              borderRadius: 999,
                              paddingHorizontal: 16,
                              paddingVertical: 6,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: '800',
                                color: voucher.claimed ? '#FF4D6D' : '#FFFFFF',
                              }}
                            >
                              {voucher.claimed ? 'Use' : 'Claim'}
                            </Text>
                          </TouchableOpacity>
                          <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#4FD1C5' }}>
                            T&C
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => setShowAllExclusive((prev) => !prev)}
                activeOpacity={0.75}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)' }}>
                  {showAllExclusive ? 'Show less' : 'See more coupons'}
                </Text>
                <MaterialCommunityIcons
                  name={showAllExclusive ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="rgba(255,255,255,0.85)"
                />
              </TouchableOpacity>
            </View>

            {/* ==================== SECTION 3: MORE GREAT COUPONS (CONNECTED TO FLASH DEALS & RECOMMENDED FOR YOU) ==================== */}
            <View
              onLayout={(e) => {
                sectionYRef.current['More great coupons'] = e.nativeEvent.layout.y;
              }}
              style={{ width: '100%' }}
            >
              <Text style={{ fontSize: 16.5, fontWeight: '900', color: '#FFFFFF', marginBottom: 12 }}>
                More great coupons
              </Text>

              <View
                style={{
                  width: '100%',
                  flexDirection: isAnyDesktop ? 'row' : 'column',
                  flexWrap: isAnyDesktop ? 'wrap' : 'nowrap',
                  justifyContent: isAnyDesktop ? 'space-between' : 'flex-start',
                }}
              >
                {visibleMoreGreat.map((prod) => {
                  const promo = evaluateProductPromotions(prod, flashSchedules, nowMs);
                  const isClaimed = claimedStoreProductIds.includes(prod.id);
                  const voucherOff = Math.max(
                    10,
                    Math.round((promo.originalPrice - promo.effectivePrice) * 10) || 25
                  );
                  const minSpend = Math.max(50, Math.round(promo.effectivePrice * 12));
                  const storeLabel = prod.brand || prod.category.replace('-', ' ');

                  return (
                    <Card
                      key={`store-coupon-prod-${prod.id}`}
                      elevation={0}
                      style={[
                        {
                          width: storeCouponCardWidth,
                          backgroundColor: 'rgba(25, 25, 31, 0.85)',
                          borderRadius: 16,
                          marginBottom: 12,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.12)',
                        },
                        webGlassStyle,
                      ]}
                    >
                      <View style={{ flexDirection: 'row', width: '100%' }}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => {
                            onClose();
                            onSelectProduct(prod.id);
                          }}
                          style={{ flex: 1, padding: 12 }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 7 }}>
                            <MaterialCommunityIcons name="storefront" size={14} color="#E2E8F0" />
                            <Text
                              numberOfLines={1}
                              style={{
                                fontSize: 12,
                                fontWeight: '700',
                                color: '#E2E8F0',
                                textTransform: 'capitalize',
                              }}
                            >
                              {storeLabel} ›
                            </Text>
                          </View>

                          <View style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}>
                            <Image
                              source={{ uri: prod.thumbnail }}
                              style={{
                                width: 58,
                                height: 58,
                                borderRadius: 10,
                                backgroundColor: '#FFFFFF',
                              }}
                              resizeMode="contain"
                            />
                            <View style={{ flex: 1 }}>
                              <Text
                                numberOfLines={2}
                                style={{
                                  fontSize: 12,
                                  fontWeight: '600',
                                  color: '#FFFFFF',
                                  lineHeight: 16,
                                }}
                              >
                                {prod.title}
                              </Text>
                              <Text style={{ fontSize: 13.5, fontWeight: '900', color: '#FFFFFF', marginTop: 4 }}>
                                ${promo.effectivePrice.toFixed(2)}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 10.5,
                                  color: 'rgba(255,255,255,0.48)',
                                  textDecorationLine: 'line-through',
                                }}
                              >
                                ${promo.originalPrice.toFixed(2)}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>

                        <View
                          style={{
                            width: isSmallPhone ? 108 : 124,
                            backgroundColor: 'rgba(37, 20, 24, 0.90)',
                            borderLeftWidth: 1.5,
                            borderLeftColor: 'rgba(255,255,255,0.22)',
                            borderStyle: 'dashed',
                            padding: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14.5,
                              fontWeight: '900',
                              color: '#FF4D6D',
                              textAlign: 'center',
                            }}
                          >
                            ₱{voucherOff}.00 off
                          </Text>
                          <Text
                            style={{
                              fontSize: 10,
                              color: 'rgba(255,255,255,0.68)',
                              textAlign: 'center',
                            }}
                          >
                            On orders over ₱{minSpend}.00
                          </Text>

                          <TouchableOpacity
                            onPress={() =>
                              isClaimed
                                ? handleUseCoupon(`₱${voucherOff}.00 off`, prod.id)
                                : handleClaimStoreProductCoupon(prod.id)
                            }
                            activeOpacity={0.85}
                            style={{
                              marginTop: 6,
                              backgroundColor: isClaimed ? 'transparent' : '#F42C55',
                              borderWidth: 1,
                              borderColor: '#F42C55',
                              borderRadius: 999,
                              paddingHorizontal: 18,
                              paddingVertical: 5,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: '800',
                                color: isClaimed ? '#FF4D6D' : '#FFFFFF',
                              }}
                            >
                              {isClaimed ? 'Use' : 'Claim'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Card>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={() => setShowAllMoreGreat((prev) => !prev)}
                activeOpacity={0.75}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)' }}>
                  {showAllMoreGreat ? 'Show less' : 'See more coupons'}
                </Text>
                <MaterialCommunityIcons
                  name={showAllMoreGreat ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="rgba(255,255,255,0.85)"
                />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
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