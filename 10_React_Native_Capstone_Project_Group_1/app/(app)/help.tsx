/**
 * Help Button & Customer Support Center Screen - Marketplace
 *
 * Student Implementation Guide:
 * Complete the TikTok Shop–inspired Customer Support Center:
 * 1. Main Help Page:
 *    - Personalized greeting ("Hi, <FirstName>!" with safe fallback if unavailable + "How can we help?")
 *    - Order Assistance section displaying the logged-in customer's selected/most recent order
 *      (product image, product name, price, purchased quantity e.g. x1, current status) + "Switch Order" button
 *    - Related FAQs section below divider line with status-relevant FAQs + "View All >" button
 * 2. Switch Order Bottom Sheet / Modal:
 *    - Title "Select an Order to Get Help" + Close (X) button
 *    - Horizontally scrollable text tabs ("All", "Unpaid", "To Ship", "Shipped", "To Review", "Returns")
 *      with smooth moving underline & exact "No Orders Yet" empty state
 * 3. All Topics Page:
 *    - "< Back" + "All Topics" header
 *    - Live FAQ Searchbar ("Search for help topics or questions") with category tags & clear button
 *    - 4 clickable help categories: "Shipment & Delivery >", "Returns >", "Refunds >", "Ordering >"
 * 4. FAQ Details Page:
 *    - "< Back", FAQ title, complete answer, related help articles, and persistent "Was this information helpful? Yes / No" feedback
 * 5. Responsive across Desktop/Laptop, Tablet, and Phones (Realme, Samsung, Xiaomi, OPPO, Vivo, iPhone)
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Platform,
  useWindowDimensions,
  Animated,
  LayoutChangeEvent,
  StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Button, Searchbar, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import {
  HelpTopicCategory,
  HelpFaqArticle,
  HELP_TOPIC_CATEGORIES,
  HELP_FAQ_ARTICLES,
  getRecommendedFaqsForOrder,
  searchHelpFaqs,
  getHelpArticleFeedback,
  saveHelpArticleFeedback,
} from '../../utils/helpCenterData';

type HelpSubView = 'main' | 'all_topics' | 'category_faqs' | 'faq_detail';

type OrderFilterTab =
  | 'All'
  | 'Unpaid'
  | 'To Ship'
  | 'Shipped'
  | 'To Review'
  | 'Returns';

const ORDER_FILTER_TABS: OrderFilterTab[] = [
  'All',
  'Unpaid',
  'To Ship',
  'Shipped',
  'To Review',
  'Returns',
];

const USD_TO_PHP = 56;

const formatPeso = (amountPhp: number): string =>
  `₱${amountPhp.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function HelpCenterScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { palette } = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive Breakpoints: Website (>= 1024), Tablet (768-1023), Phones (< 768: Realme, Samsung, Xiaomi, OPPO, Vivo, iPhone)
  const isAnyDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isSmallPhone = width <= 375;

  const horizontalPadding = isAnyDesktop ? 28 : isTablet ? 18 : 12;
  const topSafePadding = Platform.OS === 'web' ? 14 : Math.max(insets.top, 10);
  const bottomSafePadding = Platform.OS === 'web' ? 40 : Math.max(insets.bottom + 16, 28);

  const userOrdersKey = `@marketplace_user_${user?.id || 'guest'}_orders`;

  // Navigation & Sub-screen States
  const [subView, setSubView] = useState<HelpSubView>('main');
  const [previousViewBeforeDetail, setPreviousViewBeforeDetail] =
    useState<HelpSubView>('main');
  const [selectedCategory, setSelectedCategory] =
    useState<HelpTopicCategory>('Shipment & Delivery');
  const [selectedArticle, setSelectedArticle] = useState<HelpFaqArticle | null>(null);

  // Logged-in Customer's Synchronized Orders
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Switch Order Popup / Bottom Sheet States
  const [switchOrderVisible, setSwitchOrderVisible] = useState<boolean>(false);
  const [activeOrderTab, setActiveOrderTab] = useState<OrderFilterTab>('All');
  const orderTabScrollRef = useRef<ScrollView | null>(null);
  const orderTabLayoutsRef = useRef<Record<string, { x: number; width: number }>>({});
  const orderTabUnderlineLeft = useRef(new Animated.Value(0)).current;
  const orderTabUnderlineWidth = useRef(new Animated.Value(28)).current;

  // All Topics Live Search & Article Feedback States
  const [faqSearchQuery, setFaqSearchQuery] = useState<string>('');
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'yes' | 'no'>>({});

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

  const webHeroGradient: any =
    Platform.OS === 'web'
      ? {
          backgroundImage:
            'linear-gradient(135deg, #25060C 0%, #4A0D1C 52%, #FE2C55 125%)',
          boxShadow: '0 14px 32px rgba(254, 44, 85, 0.22)',
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

  // Load customer's real orders & persisted FAQ helpfulness feedback
  const loadHelpData = useCallback(async () => {
    try {
      const [rawOrders, savedFeedback] = await Promise.all([
        AsyncStorage.getItem(userOrdersKey),
        getHelpArticleFeedback(user?.id),
      ]);

      setFeedbackMap(savedFeedback);

      if (rawOrders) {
        const parsed = JSON.parse(rawOrders);
        if (Array.isArray(parsed)) {
          const uid = String(user?.id || 'guest');
          const ownOrders = parsed
            .filter((o: any) => !user?.id || !o?.userId || String(o.userId) === uid)
            .sort(
              (a: any, b: any) =>
                new Date(b.updatedAt || b.createdAt || 0).getTime() -
                new Date(a.updatedAt || a.createdAt || 0).getTime()
            );

          setCustomerOrders(ownOrders);
          if (ownOrders.length > 0) {
            setSelectedOrderId((prev) => {
              if (prev && ownOrders.some((o: any) => String(o.id) === String(prev))) {
                return prev;
              }
              return String(ownOrders[0].id);
            });
          } else {
            setSelectedOrderId(null);
          }
          return;
        }
      }
      setCustomerOrders([]);
      setSelectedOrderId(null);
    } catch {
      setCustomerOrders([]);
      setSelectedOrderId(null);
    }
  }, [userOrdersKey, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadHelpData();
    }, [loadHelpData])
  );

  // Animate Switch Order tab underline smoothly
  useEffect(() => {
    const layout = orderTabLayoutsRef.current[activeOrderTab];
    if (!layout) return;
    Animated.parallel([
      Animated.spring(orderTabUnderlineLeft, {
        toValue: layout.x,
        useNativeDriver: false,
        friction: 9,
        tension: 95,
      }),
      Animated.spring(orderTabUnderlineWidth, {
        toValue: layout.width,
        useNativeDriver: false,
        friction: 9,
        tension: 95,
      }),
    ]).start();
  }, [activeOrderTab, orderTabUnderlineLeft, orderTabUnderlineWidth]);

  const handleOrderTabLayout = (tab: OrderFilterTab, e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    orderTabLayoutsRef.current[tab] = { x, width: w };
    if (tab === activeOrderTab) {
      orderTabUnderlineLeft.setValue(x);
      orderTabUnderlineWidth.setValue(w);
    }
  };

  // Personalized greeting using customer's first name when available
  const greetingHeadline = React.useMemo(() => {
    const rawFirst =
      (user as any)?.firstName ||
      (user as any)?.name ||
      (user as any)?.username ||
      '';
    const cleaned = String(rawFirst).trim().split(/\s+/)[0] || '';
    if (!cleaned || cleaned.toLowerCase() === 'undefined' || cleaned.toLowerCase() === 'null') {
      return 'Hi there!';
    }
    return `Hi, ${cleaned}!`;
  }, [user]);

  const selectedOrder = React.useMemo(() => {
    if (customerOrders.length === 0) return null;
    if (!selectedOrderId) return customerOrders[0];
    return (
      customerOrders.find((o) => String(o.id) === String(selectedOrderId)) ||
      customerOrders[0]
    );
  }, [customerOrders, selectedOrderId]);

  const extractOrderDisplayInfo = (order: any) => {
    const firstItem = Array.isArray(order?.items) ? order.items[0] : null;
    const productImage =
      order?.thumbnail ||
      order?.image ||
      firstItem?.thumbnail ||
      firstItem?.image ||
      undefined;
    const productName =
      firstItem?.title ||
      firstItem?.name ||
      order?.title ||
      `Marketplace Order #${order?.id}`;
    const isPhpOrder = order?.currency === 'PHP' || Number(order?.totalAmount || 0) > 500;
    const rawUnit = Number(
      firstItem?.price ?? order?.totalAmount ?? order?.total ?? 0
    );
    const unitPricePhp = isPhpOrder ? rawUnit : rawUnit * USD_TO_PHP;
    const quantity = Number(firstItem?.quantity ?? order?.quantity ?? 1);
    const status = String(order?.status || 'Completed');
    return { productImage, productName, unitPricePhp, quantity, status };
  };

  const filterOrdersByTab = (ordersList: any[], tab: OrderFilterTab): any[] => {
    if (tab === 'All') return ordersList;
    return ordersList.filter((order) => {
      const s = String(order?.status || '').toLowerCase();
      switch (tab) {
        case 'Unpaid':
          return s.includes('unpaid') || s.includes('to pay') || s.includes('pending payment');
        case 'To Ship':
          return (
            s.includes('to ship') ||
            s.includes('paid') ||
            s.includes('confirm') ||
            s.includes('process') ||
            s.includes('prepar')
          );
        case 'Shipped':
          return (
            s.includes('ship') ||
            s.includes('to receive') ||
            s.includes('transit') ||
            s.includes('out for delivery')
          );
        case 'To Review':
          return (
            (s.includes('complet') || s.includes('deliver')) &&
            !order?.reviewed &&
            !s.includes('return') &&
            !s.includes('refund')
          );
        case 'Returns':
          return s.includes('return') || s.includes('refund');
        default:
          return true;
      }
    });
  };

  const filteredSwitchOrders = filterOrdersByTab(customerOrders, activeOrderTab);
  const relatedFaqs = getRecommendedFaqsForOrder(selectedOrder);
  const matchingSearchFaqs = searchHelpFaqs(faqSearchQuery);
  const categoryFaqs = HELP_FAQ_ARTICLES.filter((a) => a.category === selectedCategory);

  const openFaqDetail = (article: HelpFaqArticle, fromView: HelpSubView) => {
    setPreviousViewBeforeDetail(fromView);
    setSelectedArticle(article);
    setSubView('faq_detail');
  };

  const handleVoteHelpful = async (articleId: string, vote: 'yes' | 'no') => {
    const updated = await saveHelpArticleFeedback(user?.id, articleId, vote);
    setFeedbackMap(updated);
  };

  const handleBackNavigation = () => {
    if (subView === 'faq_detail') {
      setSubView(previousViewBeforeDetail);
      return;
    }
    if (subView === 'category_faqs') {
      setSubView('all_topics');
      return;
    }
    if (subView === 'all_topics') {
      setFaqSearchQuery('');
      setSubView('main');
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(app)/(tabs)/home' as any);
    }
  };

  const getHeaderTitle = (): string => {
    switch (subView) {
      case 'all_topics':
        return 'All Topics';
      case 'category_faqs':
        return selectedCategory;
      case 'faq_detail':
        return 'Help Article';
      case 'main':
      default:
        return 'Help Center';
    }
  };

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

      {/* ==================== TOP HEADER BAR ==================== */}
      <View
        style={[
          {
            width: '100%',
            backgroundColor: palette.glassNav,
            borderBottomWidth: 1,
            borderBottomColor: palette.border,
            paddingTop: topSafePadding,
            paddingBottom: 14,
            paddingHorizontal: horizontalPadding,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
          },
          cardShadowStyle,
          webGlassStyle,
        ]}
      >
        <TouchableOpacity
          onPress={handleBackNavigation}
          activeOpacity={0.75}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 4,
            paddingHorizontal: 4,
            minWidth: 72,
          }}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={palette.textPrimary} />
          <Text style={{ fontSize: 14.5, fontWeight: '700', color: palette.textPrimary }}>
            Back
          </Text>
        </TouchableOpacity>

        <Text
          numberOfLines={1}
          style={{
            fontSize: isSmallPhone ? 16 : 18,
            fontWeight: '900',
            color: palette.textPrimary,
            textAlign: 'center',
            flex: 1,
            letterSpacing: -0.2,
          }}
        >
          {getHeaderTitle()}
        </Text>

        <View style={{ minWidth: 72 }} />
      </View>

      {/* ==================== RESPONSIVE SCROLL CONTENT ==================== */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          width: '100%',
          paddingHorizontal: horizontalPadding,
          paddingTop: isAnyDesktop ? 24 : 18,
          paddingBottom: bottomSafePadding,
          gap: isAnyDesktop ? 20 : 16,
          zIndex: 1,
        }}
      >
        {/* ==================== 1. HELP MAIN PAGE ==================== */}
        {subView === 'main' && (
          <>
            {/* Personalized Greeting Hero Banner */}
            <View
              style={[
                {
                  width: '100%',
                  backgroundColor: '#25060C',
                  borderRadius: 20,
                  paddingVertical: isAnyDesktop ? 30 : isSmallPhone ? 20 : 24,
                  paddingHorizontal: isAnyDesktop ? 32 : isSmallPhone ? 18 : 24,
                  borderWidth: 1,
                  borderColor: 'rgba(254, 44, 85, 0.38)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                },
                webHeroGradient,
              ]}
            >
              <View style={{ flex: 1, gap: 5 }}>
                <Text
                  style={{
                    fontSize: isAnyDesktop ? 30 : isSmallPhone ? 21 : 25,
                    fontWeight: '900',
                    color: '#FFFFFF',
                  }}
                >
                  {greetingHeadline}
                </Text>
                <Text
                  style={{
                    fontSize: isAnyDesktop ? 18 : isSmallPhone ? 15 : 17,
                    fontWeight: '700',
                    color: 'rgba(255, 255, 255, 0.88)',
                  }}
                >
                  How can we help?
                </Text>
                <Text
                  style={{
                    fontSize: 12.5,
                    color: 'rgba(255, 255, 255, 0.72)',
                    marginTop: 2,
                  }}
                >
                  24/7 Customer Support · Fast order tracking & instant answers
                </Text>
              </View>

              <View
                style={{
                  width: isAnyDesktop ? 60 : 52,
                  height: isAnyDesktop ? 60 : 52,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255, 255, 255, 0.14)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons
                  name="headset"
                  size={isAnyDesktop ? 32 : 28}
                  color="#FFFFFF"
                />
              </View>
            </View>

            {/* Quick Search Shortcut Trigger */}
            <TouchableOpacity
              onPress={() => setSubView('all_topics')}
              activeOpacity={0.82}
              style={[
                {
                  width: '100%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: palette.glassSurface,
                  borderWidth: 1,
                  borderColor: palette.border,
                  borderRadius: 14,
                  paddingHorizontal: isAnyDesktop ? 22 : 14,
                  paddingVertical: isAnyDesktop ? 16 : 13,
                },
                cardShadowStyle,
                webGlassStyle,
              ]}
            >
              <MaterialCommunityIcons name="magnify" size={21} color="#FE2C55" />
              <Text style={{ fontSize: 14, color: palette.textMuted, flex: 1 }}>
                Search for help topics, refunds, or delivery questions...
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={21}
                color={palette.textSecondary}
              />
            </TouchableOpacity>

            {/* Order Assistance Section + Switch Order Button */}
            <View style={{ width: '100%', gap: 12 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
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
                  <Text
                    style={{
                      fontSize: 16.5,
                      fontWeight: '900',
                      color: palette.textPrimary,
                    }}
                  >
                    Order Assistance
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setSwitchOrderVisible(true)}
                  activeOpacity={0.78}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    backgroundColor: palette.accentSoft,
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 999,
                  }}
                >
                  <MaterialCommunityIcons
                    name="swap-horizontal"
                    size={16}
                    color={palette.accent}
                  />
                  <Text
                    style={{
                      fontSize: 12.5,
                      fontWeight: '800',
                      color: palette.accent,
                    }}
                  >
                    Switch Order
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedOrder ? (
                (() => {
                  const info = extractOrderDisplayInfo(selectedOrder);
                  return (
                    <Card
                      style={[
                        {
                          width: '100%',
                          borderRadius: 18,
                          backgroundColor: palette.glassSurface,
                          borderWidth: 1,
                          borderColor: palette.border,
                          paddingVertical: isAnyDesktop ? 20 : 14,
                          paddingHorizontal: isAnyDesktop ? 24 : 14,
                        },
                        cardShadowStyle,
                        webGlassStyle,
                      ]}
                      elevation={0}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          gap: 14,
                          alignItems: 'center',
                        }}
                      >
                        <View
                          style={{
                            width: isAnyDesktop ? 80 : isSmallPhone ? 64 : 72,
                            height: isAnyDesktop ? 80 : isSmallPhone ? 64 : 72,
                            borderRadius: 12,
                            backgroundColor: palette.isDark
                              ? 'rgba(255,255,255,0.08)'
                              : '#FFFFFF',
                            borderWidth: 1,
                            borderColor: palette.border,
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          {info.productImage ? (
                            <Image
                              source={{ uri: info.productImage }}
                              style={{ width: '88%', height: '88%' }}
                              resizeMode="contain"
                            />
                          ) : (
                            <MaterialCommunityIcons
                              name="package-variant-closed"
                              size={32}
                              color="#FE2C55"
                            />
                          )}
                        </View>

                        <View style={{ flex: 1, gap: 5 }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 6,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: '700',
                                color: palette.textMuted,
                              }}
                            >
                              Order #{selectedOrder.id}
                            </Text>

                            <View
                              style={{
                                backgroundColor: 'rgba(254, 44, 85, 0.14)',
                                paddingHorizontal: 10,
                                paddingVertical: 3,
                                borderRadius: 999,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 11.5,
                                  fontWeight: '800',
                                  color: '#FE2C55',
                                }}
                              >
                                {info.status}
                              </Text>
                            </View>
                          </View>

                          <Text
                            numberOfLines={2}
                            style={{
                              fontSize: 14.5,
                              fontWeight: '800',
                              color: palette.textPrimary,
                            }}
                          >
                            {info.productName}
                          </Text>

                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginTop: 2,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 15,
                                fontWeight: '900',
                                color: '#FE2C55',
                              }}
                            >
                              {formatPeso(info.unitPricePhp)}
                            </Text>

                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: '700',
                                color: palette.textSecondary,
                              }}
                            >
                              x{info.quantity}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Card>
                  );
                })()
              ) : (
                <Card
                  style={[
                    {
                      width: '100%',
                      borderRadius: 18,
                      backgroundColor: palette.glassSurface,
                      borderWidth: 1,
                      borderColor: palette.border,
                      paddingVertical: isAnyDesktop ? 28 : 20,
                      paddingHorizontal: 20,
                    },
                    cardShadowStyle,
                    webGlassStyle,
                  ]}
                  elevation={0}
                >
                  <View style={{ alignItems: 'center', gap: 6 }}>
                    <View
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 999,
                        backgroundColor: 'rgba(254, 44, 85, 0.11)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialCommunityIcons
                        name="shopping-outline"
                        size={28}
                        color="#FE2C55"
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 15.5,
                        fontWeight: '900',
                        color: palette.textPrimary,
                      }}
                    >
                      No Orders Found
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: palette.textSecondary,
                        textAlign: 'center',
                      }}
                    >
                      Browse our Help Topics below or place an order to get order-specific
                      support.
                    </Text>
                  </View>
                </Card>
              )}
            </View>

            {/* Divider Line Between Order Assistance & Related FAQs */}
            <Divider style={{ marginVertical: 4, backgroundColor: palette.border }} />

            {/* Related FAQs Section + View All > Button */}
            <View style={{ width: '100%', gap: 12 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
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
                  <Text
                    style={{
                      fontSize: 16.5,
                      fontWeight: '900',
                      color: palette.textPrimary,
                    }}
                  >
                    Related FAQs
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setSubView('all_topics')}
                  activeOpacity={0.75}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
                >
                  <Text
                    style={{
                      fontSize: 13.5,
                      fontWeight: '800',
                      color: '#FE2C55',
                    }}
                  >
                    View All
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={19}
                    color="#FE2C55"
                  />
                </TouchableOpacity>
              </View>

              <Card
                style={[
                  {
                    width: '100%',
                    borderRadius: 18,
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
                {relatedFaqs.map((faq, idx) => (
                  <React.Fragment key={faq.id}>
                    <TouchableOpacity
                      onPress={() => openFaqDetail(faq, 'main')}
                      activeOpacity={0.78}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: isAnyDesktop ? 20 : 16,
                        paddingHorizontal: isAnyDesktop ? 24 : 16,
                        gap: 10,
                      }}
                    >
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 14,
                          fontWeight: '700',
                          color: palette.textPrimary,
                        }}
                      >
                        {faq.question}
                      </Text>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={21}
                        color={palette.textSecondary}
                      />
                    </TouchableOpacity>
                    {idx < relatedFaqs.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </Card>
            </View>
          </>
        )}

        {/* ==================== 2. ALL TOPICS & FAQ SEARCH PAGE ==================== */}
        {subView === 'all_topics' && (
          <>
            {/* FAQ Search Bar */}
            <Searchbar
              placeholder="Search for help topics or questions"
              value={faqSearchQuery}
              onChangeText={setFaqSearchQuery}
              iconColor="#FE2C55"
              inputStyle={{ color: palette.textPrimary, fontSize: 14 }}
              placeholderTextColor={palette.textMuted}
              style={[
                {
                  width: '100%',
                  backgroundColor: palette.glassSurface,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: palette.border,
                  elevation: 0,
                  height: isAnyDesktop ? 54 : 48,
                },
                cardShadowStyle,
                webGlassStyle,
              ]}
            />

            {faqSearchQuery.trim().length > 0 ? (
              /* Live Search Results */
              <View style={{ width: '100%', gap: 12 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '800',
                    color: palette.textSecondary,
                  }}
                >
                  Matching Questions ({matchingSearchFaqs.length})
                </Text>

                {matchingSearchFaqs.length === 0 ? (
                  <Card
                    style={[
                      {
                        width: '100%',
                        borderRadius: 18,
                        backgroundColor: palette.glassSurface,
                        borderWidth: 1,
                        borderColor: palette.border,
                        paddingVertical: isAnyDesktop ? 56 : 38,
                        paddingHorizontal: 20,
                      },
                      cardShadowStyle,
                      webGlassStyle,
                    ]}
                    elevation={0}
                  >
                    <View style={{ alignItems: 'center', gap: 10 }}>
                      <MaterialCommunityIcons
                        name="help-circle-outline"
                        size={44}
                        color="#FE2C55"
                      />
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '900',
                          color: palette.textPrimary,
                          textAlign: 'center',
                        }}
                      >
                        No matching FAQs found
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          color: palette.textSecondary,
                          textAlign: 'center',
                        }}
                      >
                        We couldn't find an answer matching "{faqSearchQuery.trim()}". Try
                        searching with keywords like "tracking", "refund", "return", or "cancel".
                      </Text>
                      <Button
                        mode="outlined"
                        textColor="#FE2C55"
                        style={{ borderColor: '#FE2C55', borderRadius: 999, marginTop: 4 }}
                        onPress={() => setFaqSearchQuery('')}
                      >
                        Clear Search
                      </Button>
                    </View>
                  </Card>
                ) : (
                  <Card
                    style={[
                      {
                        width: '100%',
                        borderRadius: 18,
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
                    {matchingSearchFaqs.map((faq, idx) => (
                      <React.Fragment key={faq.id}>
                        <TouchableOpacity
                          onPress={() => openFaqDetail(faq, 'all_topics')}
                          activeOpacity={0.78}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingVertical: isAnyDesktop ? 18 : 14,
                            paddingHorizontal: isAnyDesktop ? 24 : 16,
                            gap: 10,
                          }}
                        >
                          <View style={{ flex: 1, gap: 4 }}>
                            <View
                              style={{
                                alignSelf: 'flex-start',
                                backgroundColor: palette.accentSoft,
                                paddingHorizontal: 8,
                                paddingVertical: 2.5,
                                borderRadius: 6,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: '800',
                                  color: palette.accent,
                                }}
                              >
                                {faq.category}
                              </Text>
                            </View>
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: '700',
                                color: palette.textPrimary,
                              }}
                            >
                              {faq.question}
                            </Text>
                          </View>

                          <MaterialCommunityIcons
                            name="chevron-right"
                            size={20}
                            color={palette.textSecondary}
                          />
                        </TouchableOpacity>
                        {idx < matchingSearchFaqs.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </Card>
                )}
              </View>
            ) : (
              /* 4 Clickable Help Categories */
              <Card
                style={[
                  {
                    width: '100%',
                    borderRadius: 18,
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
                {HELP_TOPIC_CATEGORIES.map((category, idx) => {
                  const iconName =
                    category === 'Shipment & Delivery'
                      ? 'truck-fast-outline'
                      : category === 'Returns'
                        ? 'package-variant-closed-remove'
                        : category === 'Refunds'
                          ? 'cash-refund'
                          : 'shopping-outline';

                  return (
                    <React.Fragment key={category}>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedCategory(category);
                          setSubView('category_faqs');
                        }}
                        activeOpacity={0.78}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingVertical: isAnyDesktop ? 22 : 16,
                          paddingHorizontal: isAnyDesktop ? 24 : 16,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                          <View
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 12,
                              backgroundColor: 'rgba(254, 44, 85, 0.14)',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <MaterialCommunityIcons
                              name={iconName as any}
                              size={21}
                              color="#FE2C55"
                            />
                          </View>
                          <Text
                            style={{
                              fontSize: 15.5,
                              fontWeight: '800',
                              color: palette.textPrimary,
                            }}
                          >
                            {category}
                          </Text>
                        </View>

                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={22}
                          color={palette.textSecondary}
                        />
                      </TouchableOpacity>
                      {idx < HELP_TOPIC_CATEGORIES.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
              </Card>
            )}
          </>
        )}

        {/* ==================== 3. CATEGORY FAQ LIST PAGE ==================== */}
        {subView === 'category_faqs' && (
          <Card
            style={[
              {
                width: '100%',
                borderRadius: 18,
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
            {categoryFaqs.map((faq, idx) => (
              <React.Fragment key={faq.id}>
                <TouchableOpacity
                  onPress={() => openFaqDetail(faq, 'category_faqs')}
                  activeOpacity={0.78}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: isAnyDesktop ? 20 : 15,
                    paddingHorizontal: isAnyDesktop ? 24 : 16,
                    gap: 10,
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 14.5,
                      fontWeight: '700',
                      color: palette.textPrimary,
                    }}
                  >
                    {faq.question}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={21}
                    color={palette.textSecondary}
                  />
                </TouchableOpacity>
                {idx < categoryFaqs.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Card>
        )}

        {/* ==================== 4. FAQ DETAILS & FEEDBACK PAGE ==================== */}
        {subView === 'faq_detail' && selectedArticle && (
          <>
            <Card
              style={[
                {
                  width: '100%',
                  borderRadius: 18,
                  backgroundColor: palette.glassSurface,
                  borderWidth: 1,
                  borderColor: palette.border,
                  padding: isAnyDesktop ? 26 : 18,
                },
                cardShadowStyle,
                webGlassStyle,
              ]}
              elevation={0}
            >
              <View style={{ gap: 14 }}>
                <View
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: palette.accentSoft,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 7,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11.5,
                      fontWeight: '800',
                      color: palette.accent,
                    }}
                  >
                    {selectedArticle.category}
                  </Text>
                </View>

                <Text
                  style={{
                    fontSize: isAnyDesktop ? 21 : 18.5,
                    fontWeight: '900',
                    color: palette.textPrimary,
                    lineHeight: 27,
                  }}
                >
                  {selectedArticle.question}
                </Text>

                <Divider />

                <Text
                  style={{
                    fontSize: 14.5,
                    lineHeight: 23.5,
                    color: palette.textSecondary,
                  }}
                >
                  {selectedArticle.answer}
                </Text>
              </View>
            </Card>

            {/* Feedback Section: Was this information helpful? Yes / No */}
            <Card
              style={[
                {
                  width: '100%',
                  borderRadius: 18,
                  backgroundColor: palette.glassSurface,
                  borderWidth: 1,
                  borderColor: palette.border,
                  padding: isAnyDesktop ? 22 : 16,
                },
                cardShadowStyle,
                webGlassStyle,
              ]}
              elevation={0}
            >
              <View style={{ gap: 12, alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '800',
                    color: palette.textPrimary,
                  }}
                >
                  Was this information helpful?
                </Text>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Button
                    mode={
                      feedbackMap[selectedArticle.id] === 'yes' ? 'contained' : 'outlined'
                    }
                    icon="thumb-up-outline"
                    buttonColor={
                      feedbackMap[selectedArticle.id] === 'yes' ? '#10B981' : undefined
                    }
                    textColor={
                      feedbackMap[selectedArticle.id] === 'yes'
                        ? '#FFFFFF'
                        : palette.textPrimary
                    }
                    style={{ borderRadius: 999, borderColor: palette.border, minWidth: 120 }}
                    onPress={() => handleVoteHelpful(selectedArticle.id, 'yes')}
                  >
                    Yes
                  </Button>

                  <Button
                    mode={
                      feedbackMap[selectedArticle.id] === 'no' ? 'contained' : 'outlined'
                    }
                    icon="thumb-down-outline"
                    buttonColor={
                      feedbackMap[selectedArticle.id] === 'no' ? '#FE2C55' : undefined
                    }
                    textColor={
                      feedbackMap[selectedArticle.id] === 'no'
                        ? '#FFFFFF'
                        : palette.textPrimary
                    }
                    style={{ borderRadius: 999, borderColor: palette.border, minWidth: 120 }}
                    onPress={() => handleVoteHelpful(selectedArticle.id, 'no')}
                  >
                    No
                  </Button>
                </View>

                {feedbackMap[selectedArticle.id] && (
                  <Text style={{ fontSize: 12.5, color: palette.textMuted, textAlign: 'center' }}>
                    Thank you for your feedback! We use it to improve our help articles.
                  </Text>
                )}
              </View>
            </Card>

            {/* Related Help Articles */}
            {selectedArticle.relatedIds.length > 0 && (
              <View style={{ width: '100%', gap: 10 }}>
                <Text
                  style={{
                    fontSize: 15.5,
                    fontWeight: '900',
                    color: palette.textPrimary,
                  }}
                >
                  Related Help Articles
                </Text>

                <Card
                  style={[
                    {
                      width: '100%',
                      borderRadius: 18,
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
                  {selectedArticle.relatedIds
                    .map((id) => HELP_FAQ_ARTICLES.find((a) => a.id === id))
                    .filter((a): a is HelpFaqArticle => Boolean(a))
                    .map((rel, idx, arr) => (
                      <React.Fragment key={rel.id}>
                        <TouchableOpacity
                          onPress={() => openFaqDetail(rel, previousViewBeforeDetail)}
                          activeOpacity={0.78}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingVertical: isAnyDesktop ? 18 : 14,
                            paddingHorizontal: isAnyDesktop ? 24 : 16,
                            gap: 10,
                          }}
                        >
                          <Text
                            style={{
                              flex: 1,
                              fontSize: 14,
                              fontWeight: '700',
                              color: palette.textPrimary,
                            }}
                          >
                            {rel.question}
                          </Text>
                          <MaterialCommunityIcons
                            name="chevron-right"
                            size={21}
                            color={palette.textSecondary}
                          />
                        </TouchableOpacity>
                        {idx < arr.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                </Card>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ==================== SWITCH ORDER BOTTOM SHEET / MODAL ==================== */}
      <Modal
        visible={switchOrderVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSwitchOrderVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: palette.glassOverlay,
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={[
              {
                height: '82%',
                width: '100%',
                maxWidth: isAnyDesktop ? 760 : '100%',
                alignSelf: 'center',
                backgroundColor: palette.background,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                borderWidth: 1,
                borderColor: palette.border,
                paddingTop: 14,
                paddingHorizontal: 14,
                paddingBottom: bottomSafePadding,
              },
              webGlassStyle,
            ]}
          >
            {/* Header: Title + Close (X) on Right Side */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '900',
                  color: palette.textPrimary,
                }}
              >
                Select an Order to Get Help
              </Text>

              <TouchableOpacity
                onPress={() => setSwitchOrderVisible(false)}
                activeOpacity={0.75}
                accessibilityLabel="Close order selector"
                style={{ padding: 4 }}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={palette.textPrimary}
                />
              </TouchableOpacity>
            </View>

            {/* Horizontally Scrollable Status Tabs with Moving Underline */}
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: palette.border,
                marginBottom: 12,
              }}
            >
              <ScrollView
                ref={orderTabScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={webHideScrollbarStyle}
                {...(Platform.OS === 'web' ? { className: 'no-scrollbar' } : {})}
                contentContainerStyle={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 20,
                  paddingHorizontal: 4,
                  position: 'relative',
                }}
              >
                {ORDER_FILTER_TABS.map((tab) => {
                  const isSelected = activeOrderTab === tab;
                  return (
                    <TouchableOpacity
                      key={tab}
                      onLayout={(e) => handleOrderTabLayout(tab, e)}
                      onPress={() => setActiveOrderTab(tab)}
                      activeOpacity={0.75}
                      style={{ paddingVertical: 9 }}
                    >
                      <Text
                        numberOfLines={1}
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

                <Animated.View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: orderTabUnderlineLeft,
                    width: orderTabUnderlineWidth,
                    height: 3,
                    borderRadius: 999,
                    backgroundColor: '#FE2C55',
                  }}
                />
              </ScrollView>
            </View>

            {/* Filtered Customer Orders List */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1, gap: 10, paddingBottom: 16 }}
            >
              {filteredSwitchOrders.length === 0 ? (
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 56,
                    paddingHorizontal: 20,
                    gap: 8,
                  }}
                >
                  <MaterialCommunityIcons
                    name="clipboard-text-outline"
                    size={46}
                    color={palette.textMuted}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '900',
                      color: palette.textPrimary,
                    }}
                  >
                    No Orders Yet
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: palette.textSecondary,
                      textAlign: 'center',
                    }}
                  >
                    You don't have any orders in this category.
                  </Text>
                </View>
              ) : (
                filteredSwitchOrders.map((order) => {
                  const info = extractOrderDisplayInfo(order);
                  const isCurrentSelected =
                    selectedOrder && String(selectedOrder.id) === String(order.id);

                  return (
                    <TouchableOpacity
                      key={`switch-order-${order.id}`}
                      onPress={() => {
                        setSelectedOrderId(String(order.id));
                        setSwitchOrderVisible(false);
                      }}
                      activeOpacity={0.85}
                    >
                      <Card
                        style={[
                          {
                            borderRadius: 16,
                            backgroundColor: palette.glassSurface,
                            borderWidth: isCurrentSelected ? 1.5 : 1,
                            borderColor: isCurrentSelected ? '#FE2C55' : palette.border,
                            padding: 12,
                          },
                          webGlassStyle,
                        ]}
                        elevation={0}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            gap: 11,
                            alignItems: 'center',
                          }}
                        >
                          <View
                            style={{
                              width: 58,
                              height: 58,
                              borderRadius: 10,
                              backgroundColor: palette.isDark
                                ? 'rgba(255,255,255,0.08)'
                                : '#FFFFFF',
                              borderWidth: 1,
                              borderColor: palette.border,
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                            }}
                          >
                            {info.productImage ? (
                              <Image
                                source={{ uri: info.productImage }}
                                style={{ width: '88%', height: '88%' }}
                                resizeMode="contain"
                              />
                            ) : (
                              <MaterialCommunityIcons
                                name="package-variant-closed"
                                size={26}
                                color="#FE2C55"
                              />
                            )}
                          </View>

                          <View style={{ flex: 1, gap: 3 }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontWeight: '700',
                                  color: palette.textMuted,
                                }}
                              >
                                Order #{order.id}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontWeight: '800',
                                  color: '#FE2C55',
                                }}
                              >
                                {info.status}
                              </Text>
                            </View>

                            <Text
                              numberOfLines={2}
                              style={{
                                fontSize: 13.5,
                                fontWeight: '700',
                                color: palette.textPrimary,
                              }}
                            >
                              {info.productName}
                            </Text>

                            <View
                              style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 13.5,
                                  fontWeight: '900',
                                  color: '#FE2C55',
                                }}
                              >
                                {formatPeso(info.unitPricePhp)}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: '700',
                                  color: palette.textSecondary,
                                }}
                              >
                                x{info.quantity}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </Card>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
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