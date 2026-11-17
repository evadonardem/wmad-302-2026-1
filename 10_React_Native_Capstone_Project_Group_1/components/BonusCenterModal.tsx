/**
 * Bonus Center Modal Component - Marketplace Rewards
 *
 * Student Implementation Guide:
 * Complete the Bonus Center screen:
 * 1. Top header with Back (<) button and "Bonus center" title
 * 2. Balance display with "history >" button on top of Available Bonus, Money icon + Peso sign (₱) and live bonus total
 * 3. Inside "history >": "< back button", "your bonus", live balance & "worth ₱0", "Use" button directing to "Claim today's bonus",
 *    underline filter tabs ("all history", "earning", "spending"), and "november 2026" transaction list
 * 4. Daily check-in Bonus tasks (0.1 today, 0.2 day2, 0.5 day3, 0.5 day4, 0.5 day6)
 * 5. Interactive "Claim today's bonus" button with AsyncStorage persistence
 * 6. Infinite-scroll product recommendations grid underneath that generates/loads more products as you scroll down
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  Platform,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../context/ThemeContext';
import {
  MarketplaceProduct,
  FlashSaleSchedule,
  evaluateProductPromotions,
} from '../utils/flashSaleHelpers';

export interface BonusCenterModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string | number;
  products: MarketplaceProduct[];
  flashSchedules: Record<number, FlashSaleSchedule>;
  nowMs: number;
  onSelectProduct: (productId: number) => void;
  onBonusUpdated?: (newBonusBalance: number) => void;
}

interface BonusDayTask {
  key: string;
  reward: number;
  rewardLabel: string;
  dayLabel: string;
}

type HistoryFilterTab = 'all history' | 'earning' | 'spending';

interface BonusHistoryEntry {
  id: string;
  title: string;
  type: 'earning' | 'spending';
  amount: number;
  dateLabel: string;
  monthGroup: string;
}

const BONUS_PAGE_SIZE = 12;

const BONUS_TASKS: BonusDayTask[] = [
  { key: 'day-1', reward: 0.1, rewardLabel: '0.1', dayLabel: 'today' },
  { key: 'day-2', reward: 0.2, rewardLabel: '0.2', dayLabel: 'day2' },
  { key: 'day-3', reward: 0.5, rewardLabel: '0.5', dayLabel: 'day3' },
  { key: 'day-4', reward: 0.5, rewardLabel: '0.5', dayLabel: 'day4' },
  { key: 'day-6', reward: 0.5, rewardLabel: '0.5', dayLabel: 'day6' },
];

export default function BonusCenterModal({
  visible,
  onClose,
  userId,
  products,
  flashSchedules,
  nowMs,
  onSelectProduct,
  onBonusUpdated,
}: BonusCenterModalProps) {
  const { palette } = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive Breakpoints: Website (>= 1024), Tablet (768-1023), Phones (< 768: Realme, iPhone, Samsung, Xiaomi, OPPO, Vivo)
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

  const horizontalPadding = isAnyDesktop ? 24 : isTablet ? 14 : 6;

  const topSafePadding = Platform.OS === 'web' ? 14 : Math.max(insets.top, 12);
  const bottomSafePadding = Platform.OS === 'web' ? 36 : Math.max(insets.bottom + 18, 28);

  const userBonusKey = `@marketplace_user_${userId || 'guest'}_bonus_center`;

  const [bonusBalance, setBonusBalance] = useState<number>(0);
  const [claimedStepIndex, setClaimedStepIndex] = useState<number>(0);
  const [todayClaimed, setTodayClaimed] = useState<boolean>(false);
  const [historyEntries, setHistoryEntries] = useState<BonusHistoryEntry[]>([]);

  // History Screen View & Tab Filter States
  const [historyVisible, setHistoryVisible] = useState<boolean>(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState<HistoryFilterTab>('all history');

  // Infinite Scroll Products States (generates/fetches more products on scroll down)
  const [bonusProducts, setBonusProducts] = useState<MarketplaceProduct[]>(products);
  const [bonusSkip, setBonusSkip] = useState<number>(products.length);
  const [hasMoreBonusProducts, setHasMoreBonusProducts] = useState<boolean>(true);
  const [loadingMoreBonusProducts, setLoadingMoreBonusProducts] = useState<boolean>(false);

  // FlatList ref for directing from History "Use" button to "Claim today's bonus" or Products
  const bonusListRef = useRef<FlatList<MarketplaceProduct> | null>(null);
  const claimButtonYRef = useRef<number>(0);
  const productsSectionYRef = useRef<number>(0);

  const webGlassStyle: any =
    Platform.OS === 'web'
      ? { backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }
      : {};

  const webAmbientBackdropStyle: any =
    Platform.OS === 'web'
      ? {
          backgroundImage: palette.isDark
            ? 'radial-gradient(circle at 12% 10%, rgba(254, 44, 85, 0.22), transparent 42%), radial-gradient(circle at 88% 16%, rgba(59, 130, 246, 0.20), transparent 44%), radial-gradient(circle at 50% 85%, rgba(246, 224, 94, 0.14), transparent 46%), linear-gradient(135deg, #0B1120 0%, #111827 50%, #17152B 100%)'
            : 'radial-gradient(circle at 10% 8%, rgba(254, 44, 85, 0.16), transparent 42%), radial-gradient(circle at 90% 14%, rgba(56, 189, 248, 0.20), transparent 44%), radial-gradient(circle at 18% 82%, rgba(168, 85, 247, 0.12), transparent 44%), radial-gradient(circle at 84% 86%, rgba(251, 191, 36, 0.14), transparent 46%), linear-gradient(135deg, #F8FAFC 0%, #EEF4FF 48%, #FFF3F6 100%)',
        }
      : {};

  const webHeroGradient: any =
    Platform.OS === 'web'
      ? {
          backgroundImage:
            'linear-gradient(135deg, #25060C 0%, #4A0D1C 52%, #FE2C55 128%)',
          boxShadow: '0 16px 36px rgba(254, 44, 85, 0.24)',
        }
      : {};

  const webPrimaryButtonGradient: any =
    Platform.OS === 'web'
      ? {
          backgroundImage: 'linear-gradient(90deg, #FE2C55 0%, #FF5E7E 100%)',
          boxShadow: '0 8px 22px rgba(254, 44, 85, 0.34)',
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

  // Sync initial products prop when modal opens
  useEffect(() => {
    if (visible && products.length > 0 && bonusProducts.length === 0) {
      setBonusProducts(products);
      setBonusSkip(products.length);
    }
  }, [visible, products, bonusProducts.length]);

  const loadBonusState = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(userBonusKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed.bonusBalance === 'number') setBonusBalance(parsed.bonusBalance);
      if (typeof parsed.claimedStepIndex === 'number') setClaimedStepIndex(parsed.claimedStepIndex);
      if (typeof parsed.todayClaimed === 'boolean') setTodayClaimed(parsed.todayClaimed);
      if (Array.isArray(parsed.historyEntries)) setHistoryEntries(parsed.historyEntries);
    } catch {
      // Ignore storage read error
    }
  }, [userBonusKey]);

  useEffect(() => {
    if (visible) {
      loadBonusState();
    } else {
      setHistoryVisible(false);
    }
  }, [visible, loadBonusState]);

  // Fetch / Generate more products when scrolling down
  const loadMoreBonusProducts = useCallback(async () => {
    if (loadingMoreBonusProducts || !hasMoreBonusProducts) return;

    try {
      setLoadingMoreBonusProducts(true);
      const res = await fetch(
        `https://dummyjson.com/products?limit=${BONUS_PAGE_SIZE}&skip=${bonusSkip}`
      );
      if (!res.ok) throw new Error('Failed to fetch more products');
      const data = await res.json();
      const incoming: MarketplaceProduct[] = data.products || [];
      const totalCount: number = data.total || 0;

      if (incoming.length === 0) {
        setHasMoreBonusProducts(false);
      } else {
        setBonusProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const unique = incoming.filter((p) => !existingIds.has(p.id));
          return [...prev, ...unique];
        });
        const nextSkip = bonusSkip + BONUS_PAGE_SIZE;
        setBonusSkip(nextSkip);
        setHasMoreBonusProducts(nextSkip < totalCount);
      }
    } catch (err) {
      console.error('Error generating more bonus products:', err);
    } finally {
      setLoadingMoreBonusProducts(false);
    }
  }, [loadingMoreBonusProducts, hasMoreBonusProducts, bonusSkip]);

  const notifyUser = (title: string, message: string) => {
    const webWin = (globalThis as any)?.window;
    if (Platform.OS === 'web' && webWin?.alert) {
      webWin.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleClaimTodaysBonus = async () => {
    const activeIndex = Math.min(claimedStepIndex, BONUS_TASKS.length - 1);
    const task = BONUS_TASKS[activeIndex];

    if (todayClaimed) {
      notifyUser(
        'Already Claimed',
        `You already claimed today's ₱${task.rewardLabel} bonus! Come back tomorrow for the next day reward.`
      );
      return;
    }

    const updatedBalance = Number((bonusBalance + task.reward).toFixed(2));
    const nextStep = Math.min(activeIndex + 1, BONUS_TASKS.length - 1);

    const newEntry: BonusHistoryEntry = {
      id: `bonus-hist-${Date.now()}`,
      title: `Daily Check-in Bonus (${task.dayLabel})`,
      type: 'earning',
      amount: task.reward,
      dateLabel: 'Nov 17, 2026',
      monthGroup: 'november 2026',
    };
    const updatedHistory = [newEntry, ...historyEntries];

    setBonusBalance(updatedBalance);
    setClaimedStepIndex(nextStep);
    setTodayClaimed(true);
    setHistoryEntries(updatedHistory);
    if (onBonusUpdated) onBonusUpdated(updatedBalance);

    try {
      await AsyncStorage.setItem(
        userBonusKey,
        JSON.stringify({
          bonusBalance: updatedBalance,
          claimedStepIndex: nextStep,
          todayClaimed: true,
          historyEntries: updatedHistory,
        })
      );
    } catch {
      // Ignore storage write error
    }

    notifyUser(
      'Bonus Claimed!',
      `₱${task.rewardLabel} has been added to your Bonus balance (Total: ₱${updatedBalance.toFixed(2)}).`
    );
  };

  // Directs from History screen "Use" button straight to "Claim today's bonus" (or products if already claimed)
  const handleUseFromHistory = () => {
    setHistoryVisible(false);
    setTimeout(() => {
      if (!bonusListRef.current) return;
      if (!todayClaimed) {
        bonusListRef.current.scrollToOffset({
          offset: Math.max(0, claimButtonYRef.current - 120),
          animated: true,
        });
      } else {
        bonusListRef.current.scrollToOffset({
          offset: Math.max(0, productsSectionYRef.current - 12),
          animated: true,
        });
      }
    }, 180);
  };

  const formattedBalance =
    bonusBalance === 0 ? '0' : bonusBalance.toFixed(2).replace(/\.00$/, '');

  const filteredHistory = historyEntries.filter((entry) => {
    if (activeHistoryTab === 'all history') return true;
    return entry.type === activeHistoryTab;
  });

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
              ? 'rgba(246, 224, 94, 0.10)'
              : 'rgba(251, 191, 36, 0.11)',
          },
        ]}
      />
    </View>
  );

  const renderBonusProductCard = ({ item }: { item: MarketplaceProduct }) => {
    const promo = evaluateProductPromotions(item, flashSchedules, nowMs);

    return (
      <TouchableOpacity
        onPress={() => {
          onClose();
          onSelectProduct(item.id);
        }}
        activeOpacity={0.88}
        style={{
          flex: 1 / numColumns,
          margin: isAnyDesktop ? 6 : isSmallPhone ? 3 : 4,
        }}
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
              height: isAnyDesktop ? 172 : isTablet ? 150 : 140,
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: palette.isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
              position: 'relative',
            }}
          >
            <Image
              source={{ uri: item.thumbnail }}
              style={{ width: '86%', height: '84%' }}
              resizeMode="contain"
            />
            {promo.hasDiscount && (
              <View
                style={{
                  position: 'absolute',
                  top: 7,
                  left: 7,
                  backgroundColor: '#FE2C55',
                  paddingHorizontal: 7,
                  paddingVertical: 2.5,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 9.5, fontWeight: '800' }}>
                  {promo.effectiveDiscountPercentage}% OFF
                </Text>
              </View>
            )}
          </View>

          <View style={{ padding: 10, gap: 4 }}>
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

            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#FE2C55' }}>
                ${promo.effectivePrice.toFixed(2)}
              </Text>
              {promo.hasDiscount && (
                <Text
                  style={{
                    fontSize: 10.5,
                    color: palette.textMuted,
                    textDecorationLine: 'line-through',
                  }}
                >
                  ${promo.originalPrice.toFixed(2)}
                </Text>
              )}
            </View>

            <Text
              numberOfLines={1}
              style={{
                fontSize: 10.5,
                color: palette.textSecondary,
                fontWeight: '600',
              }}
            >
              ⭐ {item.rating.toFixed(1)} | {promo.soldFormatted}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        if (historyVisible) {
          setHistoryVisible(false);
        } else {
          onClose();
        }
      }}
    >
      {historyVisible ? (
        /* ==================== YOUR BONUS / HISTORY SCREEN ==================== */
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

          {/* TOP BAR: < BACK BUTTON + YOUR BONUS */}
          <View
            style={{
              backgroundColor: '#2B070E',
              paddingTop: topSafePadding,
              paddingBottom: 12,
              paddingHorizontal: isAnyDesktop ? 28 : 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 10,
            }}
          >
            <TouchableOpacity
              onPress={() => setHistoryVisible(false)}
              activeOpacity={0.75}
              accessibilityLabel="Back to Bonus center"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 4,
                paddingHorizontal: 4,
                minWidth: 68,
              }}
            >
              <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Back</Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF' }}>
              your bonus
            </Text>

            <View style={{ minWidth: 68 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: bottomSafePadding,
              width: '100%',
              zIndex: 1,
            }}
          >
            {/* FULL-WIDTH CRIMSON HERO SUMMARY CARD: 0 | worth ₱0 | Use button */}
            <View
              style={[
                {
                  width: '100%',
                  backgroundColor: '#25060C',
                  paddingHorizontal: isAnyDesktop ? 28 : 16,
                  paddingTop: 18,
                  paddingBottom: 22,
                  borderBottomLeftRadius: isAnyDesktop ? 0 : 24,
                  borderBottomRightRadius: isAnyDesktop ? 0 : 24,
                },
                webHeroGradient,
              ]}
            >
              <View
                style={[
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.11)',
                    borderRadius: 18,
                    paddingVertical: 18,
                    paddingHorizontal: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.18)',
                  },
                  webGlassStyle,
                ]}
              >
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 34, fontWeight: '900', color: '#FFFFFF' }}>
                    {formattedBalance}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text
                      style={{
                        fontSize: 13.5,
                        fontWeight: '700',
                        color: 'rgba(255, 255, 255, 0.80)',
                      }}
                    >
                      worth
                    </Text>
                    <Text style={{ fontSize: 14.5, fontWeight: '900', color: '#F6E05E' }}>
                      ₱{formattedBalance}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleUseFromHistory}
                  activeOpacity={0.85}
                  style={[
                    {
                      backgroundColor: '#FE2C55',
                      borderRadius: 999,
                      paddingHorizontal: 28,
                      paddingVertical: 11,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    webPrimaryButtonGradient,
                  ]}
                >
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#FFFFFF' }}>
                    Use
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* UNDERLINE FILTER LINE BUTTONS: all history | earning | spending */}
            <View
              style={[
                {
                  width: '100%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  backgroundColor: palette.glassSurface,
                  borderBottomWidth: 1,
                  borderBottomColor: palette.border,
                  paddingTop: 14,
                  paddingHorizontal: isAnyDesktop ? 28 : 12,
                },
                webGlassStyle,
              ]}
            >
              {(['all history', 'earning', 'spending'] as HistoryFilterTab[]).map((tab) => {
                const isSelected = activeHistoryTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveHistoryTab(tab)}
                    activeOpacity={0.75}
                    style={{
                      paddingBottom: 10,
                      paddingHorizontal: 14,
                      borderBottomWidth: 2.5,
                      borderBottomColor: isSelected ? '#FE2C55' : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13.5,
                        fontWeight: isSelected ? '900' : '600',
                        color: isSelected ? '#FE2C55' : palette.textSecondary,
                      }}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* MONTH GROUP HEADER: november 2026 */}
            <View style={{ paddingHorizontal: isAnyDesktop ? 28 : 16, paddingTop: 18, width: '100%' }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '900',
                    color: palette.textPrimary,
                  }}
                >
                  november 2026
                </Text>
                <Text style={{ fontSize: 12, color: palette.textMuted }}>
                  {filteredHistory.length} record{filteredHistory.length === 1 ? '' : 's'}
                </Text>
              </View>

              {filteredHistory.length === 0 ? (
                <View
                  style={[
                    {
                      backgroundColor: palette.glassSurface,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: palette.border,
                      paddingVertical: 42,
                      paddingHorizontal: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    },
                    cardShadowStyle,
                    webGlassStyle,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="history"
                    size={40}
                    color={palette.textMuted}
                  />
                  <Text
                    style={{
                      fontSize: 14.5,
                      fontWeight: '800',
                      color: palette.textPrimary,
                    }}
                  >
                    No {activeHistoryTab} records yet
                  </Text>
                  <Text
                    style={{
                      fontSize: 12.5,
                      color: palette.textSecondary,
                      textAlign: 'center',
                    }}
                  >
                    Tap "Use" above to claim today's bonus and earn Peso rewards.
                  </Text>
                </View>
              ) : (
                filteredHistory.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      {
                        backgroundColor: palette.glassSurface,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: palette.border,
                        paddingVertical: 14,
                        paddingHorizontal: 18,
                        marginBottom: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      },
                      cardShadowStyle,
                      webGlassStyle,
                    ]}
                  >
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text
                        style={{
                          fontSize: 13.5,
                          fontWeight: '700',
                          color: palette.textPrimary,
                        }}
                      >
                        {item.title}
                      </Text>
                      <Text style={{ fontSize: 11.5, color: palette.textMuted }}>
                        {item.dateLabel}
                      </Text>
                    </View>

                    <Text
                      style={{
                        fontSize: 15.5,
                        fontWeight: '900',
                        color: item.type === 'earning' ? '#10B981' : '#FE2C55',
                      }}
                    >
                      {item.type === 'earning' ? '+' : '-'}₱{item.amount}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      ) : (
        /* ==================== BONUS CENTER MAIN SCREEN ==================== */
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

          {/* TOP BAR: < BACK BUTTON + BONUS CENTER */}
          <View
            style={{
              backgroundColor: '#2B070E',
              paddingTop: topSafePadding,
              paddingBottom: 12,
              paddingHorizontal: isAnyDesktop ? 28 : 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 10,
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.75}
              accessibilityLabel="Go back"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 4,
                paddingHorizontal: 4,
                minWidth: 64,
              }}
            >
              <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Back</Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF' }}>
              Bonus center
            </Text>

            <View style={{ minWidth: 64 }} />
          </View>

          <FlatList
            ref={bonusListRef}
            data={bonusProducts}
            renderItem={renderBonusProductCard}
            numColumns={numColumns}
            key={`bonus-products-grid-${numColumns}`}
            keyExtractor={(item) => `bonus-prod-${item.id}`}
            onEndReached={loadMoreBonusProducts}
            onEndReachedThreshold={0.4}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={{
              paddingHorizontal: isAnyDesktop ? 18 : isTablet ? 8 : 2,
            }}
            contentContainerStyle={{
              paddingBottom: bottomSafePadding,
              width: '100%',
              zIndex: 1,
            }}
            ListHeaderComponent={
              <View style={{ width: '100%' }}>
                {/* FULL-WIDTH HERO BALANCE + BONUS TASKS + CLAIM TODAY'S BONUS */}
                <View
                  style={[
                    {
                      width: '100%',
                      backgroundColor: '#25060C',
                      paddingHorizontal: isAnyDesktop ? 28 : 14,
                      paddingTop: 16,
                      paddingBottom: 24,
                      borderBottomLeftRadius: isAnyDesktop ? 0 : 24,
                      borderBottomRightRadius: isAnyDesktop ? 0 : 24,
                    },
                    webHeroGradient,
                  ]}
                >
                  {/* Balance Card with "history >" Button on Top of Available Bonus */}
                  <View
                    style={[
                      {
                        backgroundColor: 'rgba(255, 255, 255, 0.11)',
                        borderRadius: 18,
                        paddingTop: 14,
                        paddingBottom: 18,
                        paddingHorizontal: 20,
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.18)',
                        marginBottom: 18,
                      },
                      webGlassStyle,
                    ]}
                  >
                    {/* Top Row: "history >" Button */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '700',
                          color: 'rgba(255, 255, 255, 0.78)',
                        }}
                      >
                        Available Bonus
                      </Text>

                      <TouchableOpacity
                        onPress={() => setHistoryVisible(true)}
                        activeOpacity={0.75}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: 'rgba(255, 255, 255, 0.14)',
                          paddingHorizontal: 13,
                          paddingVertical: 5,
                          borderRadius: 999,
                          gap: 2,
                        }}
                      >
                        <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' }}>
                          history
                        </Text>
                        <MaterialCommunityIcons name="chevron-right" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>

                    {/* Bottom Row: Money Logo + Peso Sign + Balance */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                        <View
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 26,
                            backgroundColor: 'rgba(246, 224, 94, 0.20)',
                            borderWidth: 1.5,
                            borderColor: '#F6E05E',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <MaterialCommunityIcons name="cash-multiple" size={28} color="#F6E05E" />
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                          <Text style={{ fontSize: 24, fontWeight: '900', color: '#F6E05E' }}>
                            ₱
                          </Text>
                          <Text style={{ fontSize: 34, fontWeight: '900', color: '#FFFFFF' }}>
                            {formattedBalance}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={{
                          backgroundColor: 'rgba(254, 44, 85, 0.26)',
                          paddingHorizontal: 13,
                          paddingVertical: 6,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: 'rgba(254, 44, 85, 0.52)',
                        }}
                      >
                        <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#FF758F' }}>
                          Daily Check-in
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Bonus Tasks Header */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ fontSize: 16.5, fontWeight: '900', color: '#FFFFFF' }}>
                      Bonus tasks
                    </Text>
                    <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.72)' }}>
                      Check in daily to earn Peso bonus
                    </Text>
                  </View>

                  {/* 5 Daily Bonus Cards: 0.1 today | 0.2 day2 | 0.5 day3 | 0.5 day4 | 0.5 day6 */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      gap: isAnyDesktop ? 14 : isSmallPhone ? 5 : 8,
                      marginBottom: 18,
                    }}
                  >
                    {BONUS_TASKS.map((task, index) => {
                      const isCurrent = index === claimedStepIndex && !todayClaimed;
                      const isCompleted =
                        index < claimedStepIndex || (index === claimedStepIndex && todayClaimed);

                      return (
                        <View
                          key={task.key}
                          style={{
                            flex: 1,
                            backgroundColor: isCurrent
                              ? 'rgba(254, 44, 85, 0.30)'
                              : isCompleted
                                ? 'rgba(16, 185, 129, 0.22)'
                                : 'rgba(255, 255, 255, 0.09)',
                            borderRadius: 14,
                            paddingVertical: isAnyDesktop ? 14 : 11,
                            paddingHorizontal: 6,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1.5,
                            borderColor: isCurrent
                              ? '#FE2C55'
                              : isCompleted
                                ? '#10B981'
                                : 'rgba(255, 255, 255, 0.16)',
                          }}
                        >
                          <View
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: isCompleted
                                ? '#10B981'
                                : 'rgba(246, 224, 94, 0.22)',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: 5,
                            }}
                          >
                            {isCompleted ? (
                              <MaterialCommunityIcons name="check" size={15} color="#FFFFFF" />
                            ) : (
                              <Text style={{ fontSize: 12.5, fontWeight: '900', color: '#F6E05E' }}>
                                ₱
                              </Text>
                            )}
                          </View>

                          <Text
                            style={{
                              fontSize: isSmallPhone ? 13 : isAnyDesktop ? 16 : 15,
                              fontWeight: '900',
                              color: '#FFFFFF',
                            }}
                          >
                            {task.rewardLabel}
                          </Text>

                          <Text
                            style={{
                              fontSize: isSmallPhone ? 10 : 11.5,
                              fontWeight: '700',
                              color: isCurrent
                                ? '#FF758F'
                                : isCompleted
                                  ? '#6EE7B7'
                                  : 'rgba(255, 255, 255, 0.72)',
                              marginTop: 3,
                              textTransform: 'capitalize',
                            }}
                          >
                            {task.dayLabel}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Claim Today's Bonus Button */}
                  <View
                    onLayout={(e) => {
                      claimButtonYRef.current = e.nativeEvent.layout.y;
                    }}
                  >
                    <TouchableOpacity
                      onPress={handleClaimTodaysBonus}
                      activeOpacity={0.85}
                      style={[
                        {
                          backgroundColor: todayClaimed ? 'rgba(255, 255, 255, 0.18)' : '#FE2C55',
                          borderRadius: 999,
                          paddingVertical: 14,
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'row',
                          gap: 6,
                        },
                        !todayClaimed && webPrimaryButtonGradient,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={todayClaimed ? 'check-circle' : 'gift-outline'}
                        size={19}
                        color="#FFFFFF"
                      />
                      <Text style={{ fontSize: 15, fontWeight: '900', color: '#FFFFFF' }}>
                        {todayClaimed ? "Today's bonus claimed" : "Claim today's bonus"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* SECTION HEADER FOR INFINITE-SCROLL PRODUCT GRID */}
                <View
                  onLayout={(e) => {
                    productsSectionYRef.current = e.nativeEvent.layout.y;
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: horizontalPadding + 2,
                    paddingTop: 20,
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
                    <Text style={{ fontSize: 17, fontWeight: '900', color: palette.textPrimary }}>
                      Use Your Bonus on Products
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: palette.textMuted, fontWeight: '700' }}>
                    {bonusProducts.length} items
                  </Text>
                </View>
              </View>
            }
            ListFooterComponent={
              <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                {loadingMoreBonusProducts ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#FE2C55" />
                    <Text style={{ fontSize: 13, color: palette.textSecondary }}>
                      Generating more products...
                    </Text>
                  </View>
                ) : !hasMoreBonusProducts && bonusProducts.length > 0 ? (
                  <Text style={{ fontSize: 12.5, color: palette.textMuted, fontWeight: '500' }}>
                    You've reached the end of products
                  </Text>
                ) : null}
              </View>
            }
          />
        </View>
      )}
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