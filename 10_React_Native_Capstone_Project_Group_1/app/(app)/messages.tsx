/**
 * Messages & Shop Updates Screen - Marketplace
 *
 * Student Implementation Guide:
 * Complete the dedicated Messages & Shop Updates notification screen:
 * 1. Top header with "< Back" button, "Messages" title, "Mark all read" and "Clear read" actions
 * 2. "Shop Updates" notification category header with unread count badge
 * 3. Vertical list of customer order notifications sorted newest-first:
 *    - Product / order image thumbnail
 *    - Unread dot indicator & distinct unread surface styling
 *    - Notification title, description, tracking number, courier info, and date
 *    - Individual delete button (preserves actual order records)
 * 4. Tapping a notification marks it as read and opens the corresponding Order Details & Delivery Progress modal
 * 5. Responsive layout for Website Desktop, Tablet, and Phones (Realme, Samsung, Xiaomi, OPPO, Vivo, iPhone)
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
  useWindowDimensions,
  Alert,
  Modal,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Badge, Button, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import {
  ShopOrderNotification,
  ShopNotificationEventType,
  syncNotificationsFromOrders,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteSingleNotification,
  clearReadNotifications,
} from '../../utils/shopNotifications';

const DELIVERY_TIMELINE_STEPS: {
  key: ShopNotificationEventType;
  label: string;
  description: string;
}[] = [
  {
    key: 'order_placed',
    label: 'Order Placed',
    description: 'Order submitted to Marketplace.',
  },
  {
    key: 'payment_confirmed',
    label: 'Payment Confirmed',
    description: 'Payment verified and approved.',
  },
  {
    key: 'order_processing',
    label: 'Order Processing',
    description: 'Seller is preparing and packing your items.',
  },
  {
    key: 'order_shipped',
    label: 'Order Shipped',
    description: 'Parcel handed over to courier partner.',
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    description: 'Courier rider is on the way to your address.',
  },
  {
    key: 'package_delivered',
    label: 'Package Delivered',
    description: 'Parcel delivered to recipient.',
  },
];

export default function MessagesScreen() {
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
  const bottomSafePadding = Platform.OS === 'web' ? 36 : Math.max(insets.bottom + 14, 24);

  const userOrdersKey = `@marketplace_user_${user?.id || 'guest'}_orders`;

  const [notifications, setNotifications] = useState<ShopOrderNotification[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Selected Notification & Associated Order Details Modal
  const [selectedNotification, setSelectedNotification] =
    useState<ShopOrderNotification | null>(null);
  const [selectedOrderRecord, setSelectedOrderRecord] = useState<any | null>(null);
  const [orderDetailVisible, setOrderDetailVisible] = useState<boolean>(false);

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

  const loadNotifications = useCallback(async () => {
    const synced = await syncNotificationsFromOrders(user?.id);
    setNotifications(synced);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.filter((n) => n.read).length;

  const handleOpenNotification = async (notif: ShopOrderNotification) => {
    // 1. Mark notification as read automatically
    if (!notif.read) {
      const updated = await markNotificationAsRead(user?.id, notif.id);
      setNotifications(updated);
    }

    // 2. Load corresponding order details from customer's order history
    let foundOrder: any = null;
    try {
      const rawOrders = await AsyncStorage.getItem(userOrdersKey);
      if (rawOrders) {
        const parsed = JSON.parse(rawOrders);
        if (Array.isArray(parsed)) {
          foundOrder =
            parsed.find((o: any) => String(o?.id) === String(notif.orderId)) || null;
        }
      }
    } catch {
      foundOrder = null;
    }

    setSelectedNotification({ ...notif, read: true });
    setSelectedOrderRecord(foundOrder);
    setOrderDetailVisible(true);
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    const updated = await markAllNotificationsAsRead(user?.id);
    setNotifications(updated);
  };

  const handleDeleteNotification = async (notifId: string) => {
    const updated = await deleteSingleNotification(user?.id, notifId);
    setNotifications(updated);
  };

  const handleClearReadNotifications = () => {
    if (readCount === 0) return;

    const performClear = async () => {
      const updated = await clearReadNotifications(user?.id);
      setNotifications(updated);
    };

    const webWin = (globalThis as any)?.window;
    if (Platform.OS === 'web' && webWin?.confirm) {
      if (
        webWin.confirm(
          `Clear ${readCount} read notification${readCount === 1 ? '' : 's'}? Your actual order records will not be deleted.`
        )
      ) {
        performClear();
      }
    } else {
      Alert.alert(
        'Clear Read Notifications',
        `Remove ${readCount} read notification${readCount === 1 ? '' : 's'} from your message history? Your actual order records will remain safe.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear Read', style: 'destructive', onPress: performClear },
        ]
      );
    }
  };

  const getEventIcon = (type: ShopNotificationEventType): { name: any; color: string } => {
    switch (type) {
      case 'package_delivered':
        return { name: 'package-variant-closed-check', color: '#10B981' };
      case 'out_for_delivery':
        return { name: 'truck-delivery-outline', color: '#FE2C55' };
      case 'order_shipped':
        return { name: 'truck-fast-outline', color: '#3B82F6' };
      case 'delivery_failed':
        return { name: 'alert-circle-outline', color: '#EF4444' };
      case 'order_cancelled':
        return { name: 'close-circle-outline', color: '#EF4444' };
      case 'return_refund_update':
        return { name: 'cash-refund', color: '#F59E0B' };
      case 'payment_confirmed':
        return { name: 'check-decagram-outline', color: '#10B981' };
      case 'order_processing':
        return { name: 'package-variant', color: '#8B5CF6' };
      case 'order_placed':
      default:
        return { name: 'shopping-outline', color: '#FE2C55' };
    }
  };

  const getCompletedStepIndex = (type?: ShopNotificationEventType): number => {
    if (!type) return 0;
    const idx = DELIVERY_TIMELINE_STEPS.findIndex((s) => s.key === type);
    return idx >= 0 ? idx : 0;
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

  const renderNotificationItem = ({ item }: { item: ShopOrderNotification }) => {
    const iconInfo = getEventIcon(item.type);

    return (
      <TouchableOpacity
        onPress={() => handleOpenNotification(item)}
        activeOpacity={0.86}
        style={{
          width: '100%',
          marginBottom: isAnyDesktop ? 18 : isTablet ? 15 : 13,
        }}
      >
        <Card
          style={[
            {
              width: '100%',
              borderRadius: 20,
              backgroundColor: item.read
                ? palette.glassSurface
                : palette.isDark
                  ? 'rgba(254, 44, 85, 0.14)'
                  : 'rgba(254, 44, 85, 0.07)',
              borderWidth: 1.2,
              borderColor: item.read ? palette.border : 'rgba(254, 44, 85, 0.45)',
              overflow: 'hidden',
            },
            cardShadowStyle,
            webGlassStyle,
          ]}
          elevation={0}
        >
          <View
            style={{
              flexDirection: 'row',
              paddingVertical: isAnyDesktop ? 28 : isTablet ? 24 : isSmallPhone ? 16 : 20,
              paddingHorizontal: isAnyDesktop ? 32 : isTablet ? 24 : isSmallPhone ? 14 : 18,
              gap: isAnyDesktop ? 20 : isTablet ? 16 : 13,
              alignItems: 'flex-start',
            }}
          >
            {/* Left Product / Order Image Thumbnail with Unread Dot Indicator */}
            <View style={{ position: 'relative' }}>
              <View
                style={{
                  width: isAnyDesktop ? 82 : isTablet ? 74 : isSmallPhone ? 62 : 68,
                  height: isAnyDesktop ? 82 : isTablet ? 74 : isSmallPhone ? 62 : 68,
                  borderRadius: 16,
                  backgroundColor: palette.isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: palette.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={{ width: '88%', height: '88%' }}
                    resizeMode="contain"
                  />
                ) : (
                  <MaterialCommunityIcons
                    name={iconInfo.name}
                    size={isAnyDesktop ? 34 : 28}
                    color={iconInfo.color}
                  />
                )}
              </View>

              {/* Small Unread Dot Indicator */}
              {!item.read && (
                <View
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: '#FE2C55',
                    borderWidth: 2,
                    borderColor: palette.background,
                  }}
                />
              )}
            </View>

            {/* Center Content: Title, Date, Description, Tracking Number & Courier */}
            <View style={{ flex: 1, gap: isAnyDesktop ? 8 : 6 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <Text
                  numberOfLines={2}
                  style={{
                    flex: 1,
                    fontSize: isAnyDesktop ? 17 : isSmallPhone ? 14 : 15,
                    fontWeight: item.read ? '800' : '900',
                    color: palette.textPrimary,
                  }}
                >
                  {item.title}
                </Text>

                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: palette.textMuted,
                    flexShrink: 0,
                  }}
                >
                  {item.dateLabel}
                </Text>
              </View>

              <Text
                style={{
                  fontSize: isAnyDesktop ? 14 : isSmallPhone ? 12.5 : 13.2,
                  lineHeight: isAnyDesktop ? 21 : 19,
                  color: palette.textSecondary,
                }}
              >
                {item.message}
              </Text>

              {/* Tracking Number & Courier Badges (No Overflow on Small Phones) */}
              {(item.trackingNumber || item.courier) && (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  {item.trackingNumber && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: palette.accentSoft,
                        paddingHorizontal: 10,
                        paddingVertical: 4.5,
                        borderRadius: 8,
                        gap: 5,
                        maxWidth: '100%',
                      }}
                    >
                      <MaterialCommunityIcons
                        name="barcode-scan"
                        size={14}
                        color={palette.accent}
                      />
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 12,
                          fontWeight: '800',
                          color: palette.accent,
                        }}
                      >
                        {item.trackingNumber}
                      </Text>
                    </View>
                  )}

                  {item.courier && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(16, 185, 129, 0.14)',
                        paddingHorizontal: 10,
                        paddingVertical: 4.5,
                        borderRadius: 8,
                        gap: 5,
                      }}
                    >
                      <MaterialCommunityIcons
                        name="truck-outline"
                        size={14}
                        color={palette.success}
                      />
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 12,
                          fontWeight: '800',
                          color: palette.success,
                        }}
                      >
                        {item.courier}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Bottom Row: Order ID & Individual Delete Action */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: '800',
                    color: '#FE2C55',
                  }}
                >
                  View order details ›
                </Text>

                <TouchableOpacity
                  onPress={() => handleDeleteNotification(item.id)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Delete notification"
                  style={{ padding: 4 }}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={18}
                    color={palette.textMuted}
                  />
                </TouchableOpacity>
              </View>
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

      {/* FULL-WIDTH TOP NAVIGATION HEADER: < BACK | MESSAGES */}
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
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/(app)/(tabs)/home' as any);
            }
          }}
          activeOpacity={0.75}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 4,
            paddingHorizontal: 4,
            minWidth: 72,
          }}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={palette.textPrimary}
          />
          <Text
            style={{
              fontSize: 14.5,
              fontWeight: '700',
              color: palette.textPrimary,
            }}
          >
            Back
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 18,
            fontWeight: '900',
            color: palette.textPrimary,
            letterSpacing: -0.2,
          }}
        >
          Messages
        </Text>

        <View style={{ minWidth: 72 }} />
      </View>

      {/* FULL-WIDTH MAIN CONTENT CONTAINER (SINGLE COLUMN ACROSS WEBSITE, TABLET & PHONE) */}
      <View
        style={{
          flex: 1,
          width: '100%',
          paddingHorizontal: horizontalPadding,
          zIndex: 1,
        }}
      >
        {/* SHOP UPDATES CATEGORY HEADER + NOTIFICATION MANAGEMENT BUTTONS */}
        <View
          style={{
            width: '100%',
            paddingTop: isAnyDesktop ? 24 : 16,
            paddingBottom: isAnyDesktop ? 18 : 14,
          }}
        >
          <View
            style={[
              {
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                backgroundColor: palette.glassSurface,
                borderWidth: 1,
                borderColor: palette.border,
                borderRadius: 18,
                paddingHorizontal: isAnyDesktop ? 32 : isTablet ? 24 : 18,
                paddingVertical: isAnyDesktop ? 22 : isTablet ? 18 : 15,
              },
              cardShadowStyle,
              webGlassStyle,
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  backgroundColor: 'rgba(254, 44, 85, 0.14)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={22}
                  color="#FE2C55"
                />
              </View>

              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text
                    style={{
                      fontSize: 17.5,
                      fontWeight: '900',
                      color: palette.textPrimary,
                    }}
                  >
                    Shop Updates
                  </Text>

                  {unreadCount > 0 && (
                    <Badge
                      size={20}
                      style={{
                        backgroundColor: '#FE2C55',
                        color: '#FFFFFF',
                        fontWeight: '800',
                      }}
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </View>
                <Text style={{ fontSize: 12.5, color: palette.textSecondary, marginTop: 2 }}>
                  Real-time order tracking & delivery alerts
                </Text>
              </View>
            </View>

            {/* Notification Management Actions: Mark all as read & Clear read */}
            {notifications.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {unreadCount > 0 && (
                  <TouchableOpacity
                    onPress={handleMarkAllRead}
                    activeOpacity={0.75}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      backgroundColor: palette.accentSoft,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="check-all"
                      size={15}
                      color={palette.accent}
                    />
                    <Text
                      style={{
                        fontSize: 12.5,
                        fontWeight: '800',
                        color: palette.accent,
                      }}
                    >
                      Mark all read
                    </Text>
                  </TouchableOpacity>
                )}

                {readCount > 0 && (
                  <TouchableOpacity
                    onPress={handleClearReadNotifications}
                    activeOpacity={0.75}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      backgroundColor: palette.glassInput,
                      borderWidth: 1,
                      borderColor: palette.border,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="broom"
                      size={14}
                      color={palette.textSecondary}
                    />
                    <Text
                      style={{
                        fontSize: 12.5,
                        fontWeight: '800',
                        color: palette.textSecondary,
                      }}
                    >
                      Clear read
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* SINGLE-COLUMN SHOP UPDATES LIST */}
        <FlatList
          style={{ width: '100%' }}
          data={notifications}
          renderItem={renderNotificationItem}
          numColumns={1}
          key="messages-single-column-list"
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FE2C55']}
            />
          }
          contentContainerStyle={{
            width: '100%',
            paddingBottom: bottomSafePadding,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <View
              style={[
                {
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: isAnyDesktop ? 84 : 62,
                  paddingHorizontal: 28,
                  backgroundColor: palette.glassSurface,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: palette.border,
                  gap: 12,
                },
                cardShadowStyle,
                webGlassStyle,
              ]}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 999,
                  backgroundColor: 'rgba(254, 44, 85, 0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={40}
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
                No Shop Updates yet
              </Text>
              <Text
                style={{
                  fontSize: 13.5,
                  color: palette.textSecondary,
                  textAlign: 'center',
                  lineHeight: 21,
                  maxWidth: 520,
                }}
              >
                Real-time order notifications—such as Order Placed, Shipped, Out for Delivery,
                and Package Delivered—will appear here automatically when you place an order.
              </Text>
            </View>
          }
        />
      </View>

      {/* ==================== ORDER DETAILS & DELIVERY PROGRESS MODAL ==================== */}
      <Modal
        visible={orderDetailVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setOrderDetailVisible(false)}
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
                maxHeight: '88%',
                width: '100%',
                maxWidth: isAnyDesktop ? 760 : '100%',
                alignSelf: 'center',
                backgroundColor: palette.background,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                borderWidth: 1,
                borderColor: palette.border,
                paddingTop: 18,
                paddingHorizontal: isAnyDesktop ? 26 : 18,
                paddingBottom: bottomSafePadding,
              },
              webGlassStyle,
            ]}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 14,
                borderBottomWidth: 1,
                borderBottomColor: palette.border,
              }}
            >
              <Text
                style={{
                  fontSize: 17.5,
                  fontWeight: '900',
                  color: palette.textPrimary,
                }}
              >
                Order Tracking & Details
              </Text>

              <TouchableOpacity
                onPress={() => setOrderDetailVisible(false)}
                activeOpacity={0.75}
                style={{ padding: 4 }}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={palette.textPrimary}
                />
              </TouchableOpacity>
            </View>

            {selectedNotification && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 16, gap: 16 }}
              >
                {/* Product / Order Header Card */}
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 14,
                    backgroundColor: palette.glassSurface,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: palette.border,
                    padding: 16,
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 14,
                      backgroundColor: palette.isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: palette.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {selectedNotification.imageUrl ? (
                      <Image
                        source={{ uri: selectedNotification.imageUrl }}
                        style={{ width: '88%', height: '88%' }}
                        resizeMode="contain"
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name="package-variant-closed"
                        size={30}
                        color="#FE2C55"
                      />
                    )}
                  </View>

                  <View style={{ flex: 1, gap: 4 }}>
                    <Text
                      style={{
                        fontSize: 15.5,
                        fontWeight: '900',
                        color: '#FE2C55',
                      }}
                    >
                      {selectedOrderRecord?.status || selectedNotification.title}
                    </Text>

                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: palette.textPrimary,
                      }}
                    >
                      Order ID: #{selectedNotification.orderId}
                    </Text>

                    {selectedOrderRecord?.totalAmount !== undefined && (
                      <Text style={{ fontSize: 12.5, color: palette.textSecondary }}>
                        Order Total: ₱{Number(selectedOrderRecord.totalAmount).toFixed(2)}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Tracking Number & Courier Info */}
                {(selectedNotification.trackingNumber ||
                  selectedOrderRecord?.trackingNumber ||
                  selectedNotification.courier ||
                  selectedOrderRecord?.courier) && (
                  <View
                    style={{
                      backgroundColor: palette.glassSurface,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: palette.border,
                      padding: 16,
                      gap: 10,
                    }}
                  >
                    {(selectedNotification.courier || selectedOrderRecord?.courier) && (
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 13, color: palette.textSecondary }}>
                          Courier Partner
                        </Text>
                        <Text
                          style={{
                            fontSize: 13.5,
                            fontWeight: '800',
                            color: palette.textPrimary,
                          }}
                        >
                          {selectedNotification.courier || selectedOrderRecord?.courier}
                        </Text>
                      </View>
                    )}

                    {(selectedNotification.trackingNumber ||
                      selectedOrderRecord?.trackingNumber) && (
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 13, color: palette.textSecondary }}>
                          Tracking Number
                        </Text>
                        <Text
                          style={{
                            fontSize: 13.5,
                            fontWeight: '800',
                            color: palette.accent,
                          }}
                        >
                          {selectedNotification.trackingNumber ||
                            selectedOrderRecord?.trackingNumber}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Complete Delivery Progress Stepper */}
                <View
                  style={{
                    backgroundColor: palette.glassSurface,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: palette.border,
                    padding: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '900',
                      color: palette.textPrimary,
                      marginBottom: 14,
                    }}
                  >
                    Delivery Progress
                  </Text>

                  {DELIVERY_TIMELINE_STEPS.map((step, index) => {
                    const currentStepIdx = getCompletedStepIndex(selectedNotification.type);
                    const isCompleted = index <= currentStepIdx;
                    const isCurrent = index === currentStepIdx;
                    const isLast = index === DELIVERY_TIMELINE_STEPS.length - 1;

                    return (
                      <View
                        key={step.key}
                        style={{
                          flexDirection: 'row',
                          gap: 12,
                          minHeight: isLast ? 38 : 54,
                        }}
                      >
                        <View style={{ alignItems: 'center', width: 20 }}>
                          <View
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: 7,
                              backgroundColor: isCurrent
                                ? '#FE2C55'
                                : isCompleted
                                  ? '#10B981'
                                  : palette.border,
                              marginTop: 2,
                            }}
                          />
                          {!isLast && (
                            <View
                              style={{
                                width: 2,
                                flex: 1,
                                backgroundColor: isCompleted ? '#10B981' : palette.border,
                                marginVertical: 2,
                              }}
                            />
                          )}
                        </View>

                        <View style={{ flex: 1, paddingBottom: isLast ? 0 : 12 }}>
                          <Text
                            style={{
                              fontSize: 13.5,
                              fontWeight: isCurrent ? '900' : '700',
                              color: isCurrent
                                ? '#FE2C55'
                                : isCompleted
                                  ? palette.textPrimary
                                  : palette.textMuted,
                            }}
                          >
                            {step.label}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: palette.textSecondary,
                              marginTop: 2,
                            }}
                          >
                            {isCurrent ? selectedNotification.message : step.description}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                <Divider />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Button
                    mode="contained"
                    buttonColor="#FE2C55"
                    textColor="#FFFFFF"
                    style={[{ flex: 1, borderRadius: 999 }, webPrimaryButtonGradient]}
                    onPress={() => {
                      setOrderDetailVisible(false);
                      router.push('/(app)/orders' as any);
                    }}
                  >
                    Open Full Orders Page
                  </Button>

                  <Button
                    mode="outlined"
                    textColor={palette.textPrimary}
                    style={{ borderColor: palette.border, borderRadius: 999 }}
                    onPress={() => setOrderDetailVisible(false)}
                  >
                    Close
                  </Button>
                </View>
              </ScrollView>
            )}
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