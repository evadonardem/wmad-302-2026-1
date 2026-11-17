/**
 * Tabs Layout - Marketplace App Navigation
 * Tabs: Home (Shop), Categories, Cart, Profile
 * Features: Bottom Tab Navigation (Mobile/Tablet) + Hamburger Drawer on Website/Desktop + Hides product/[id], search, and helper files
 */
import React, { useEffect, useState, useCallback, useRef, createContext, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  useWindowDimensions,
  Platform,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  DeviceEventEmitter,
} from 'react-native';
import { Tabs, Redirect, useRouter, usePathname, useFocusEffect } from 'expo-router';
import { PaperProvider, IconButton, Divider, Avatar, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';

interface DesktopDrawerContextValue {
  openDesktopDrawer: () => void;
  closeDesktopDrawer: () => void;
  cartBadgeCount: number;
  wishlistBadgeCount: number;
}

const DesktopDrawerContext = createContext<DesktopDrawerContextValue>({
  openDesktopDrawer: () => {},
  closeDesktopDrawer: () => {},
  cartBadgeCount: 0,
  wishlistBadgeCount: 0,
});

export const useDesktopDrawer = () => useContext(DesktopDrawerContext);

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoadingAuth: isLoading, logout } = useAuth();
  const { palette, paperTheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Responsive Breakpoints (Website >= 1024, Tablet 768-1023, Mobile Phones < 768: Realme, iPhone, Samsung, Xiaomi, OPPO, Vivo)
  const isLargeDesktop = width >= 1440;
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isSmallPhone = width <= 375;

  // Website Hamburger Drawer State
  const drawerWidth = isLargeDesktop ? 360 : Math.min(330, Math.round(width * 0.85));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartBadgeCount, setCartBadgeCount] = useState(0);
  const [wishlistBadgeCount, setWishlistBadgeCount] = useState(0);
  const slideAnim = useRef(new Animated.Value(drawerWidth)).current;
  const backdropFadeAnim = useRef(new Animated.Value(0)).current;

  const userPrefix = `@marketplace_user_${user?.id || 'guest'}`;
  const userCartStorageKey = `${userPrefix}_cart`;
  const userWishlistStorageKey = `${userPrefix}_wishlist`;

  // Preload icon fonts safely without blocking web or unauthenticated splash screen
  const [fontsLoaded, fontError] = useFonts({
    ...MaterialCommunityIcons.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  const syncBadges = useCallback(async () => {
    try {
      const [savedCart, savedWishlist] = await Promise.all([
        AsyncStorage.getItem(userCartStorageKey),
        AsyncStorage.getItem(userWishlistStorageKey),
      ]);

      const fallbackCart = savedCart ?? (await AsyncStorage.getItem('@marketplace_cart'));
      if (fallbackCart) {
        const parsedCart = JSON.parse(fallbackCart);
        if (Array.isArray(parsedCart)) {
          const totalQty = parsedCart.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0);
          setCartBadgeCount(totalQty);
        } else {
          setCartBadgeCount(0);
        }
      } else {
        setCartBadgeCount(0);
      }

      const fallbackWishlist =
        savedWishlist ?? (await AsyncStorage.getItem('@marketplace_wishlist'));
      if (fallbackWishlist) {
        const parsedWishlist = JSON.parse(fallbackWishlist);
        setWishlistBadgeCount(Array.isArray(parsedWishlist) ? parsedWishlist.length : 0);
      } else {
        setWishlistBadgeCount(0);
      }
    } catch {
      setCartBadgeCount(0);
      setWishlistBadgeCount(0);
    }
  }, [userCartStorageKey, userWishlistStorageKey]);

  useFocusEffect(
    useCallback(() => {
      syncBadges();
    }, [syncBadges])
  );

  useEffect(() => {
    syncBadges();
  }, [pathname, drawerOpen, syncBadges]);

  useEffect(() => {
    const cartSub = DeviceEventEmitter.addListener('cartUpdated', () => {
      syncBadges();
    });
    const wishSub = DeviceEventEmitter.addListener('wishlistUpdated', () => {
      syncBadges();
    });
    return () => {
      cartSub.remove();
      wishSub.remove();
    };
  }, [syncBadges]);

  const openDesktopDrawer = useCallback(() => {
    syncBadges();
    slideAnim.setValue(drawerWidth);
    backdropFadeAnim.setValue(0);
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: Platform.OS !== 'web',
        friction: 9,
        tension: 85,
      }),
      Animated.timing(backdropFadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [drawerWidth, slideAnim, backdropFadeAnim, syncBadges]);

  const closeDesktopDrawer = useCallback(
    (callback?: () => void) => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: drawerWidth,
          duration: 210,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(backdropFadeAnim, {
          toValue: 0,
          duration: 190,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        setDrawerOpen(false);
        if (callback) callback();
      });
    },
    [drawerWidth, slideAnim, backdropFadeAnim]
  );

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const webNavBlur: any =
    Platform.OS === 'web'
      ? { backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)' }
      : {};

  const webAmbientBackdropStyle: any =
    Platform.OS === 'web'
      ? {
          backgroundImage: palette.isDark
            ? 'radial-gradient(circle at 12% 10%, rgba(254, 44, 85, 0.22), transparent 42%), radial-gradient(circle at 88% 16%, rgba(59, 130, 246, 0.20), transparent 44%), radial-gradient(circle at 50% 85%, rgba(16, 185, 129, 0.15), transparent 46%), linear-gradient(135deg, #0B1120 0%, #111827 50%, #17152B 100%)'
            : 'radial-gradient(circle at 10% 8%, rgba(254, 44, 85, 0.16), transparent 42%), radial-gradient(circle at 90% 14%, rgba(56, 189, 248, 0.20), transparent 44%), radial-gradient(circle at 18% 82%, rgba(168, 85, 247, 0.12), transparent 44%), radial-gradient(circle at 84% 86%, rgba(251, 146, 60, 0.14), transparent 46%), linear-gradient(135deg, #F8FAFC 0%, #EEF4FF 48%, #FFF3F6 100%)',
        }
      : {};

  const webBrandGradientStyle: any =
    Platform.OS === 'web'
      ? {
          backgroundImage: 'linear-gradient(135deg, #FE2C55 0%, #FF6B8B 100%)',
          boxShadow: '0 8px 20px rgba(254, 44, 85, 0.32)',
        }
      : {};

  const mobileTabShadow: any =
    Platform.OS === 'web'
      ? { boxShadow: '0px -6px 24px rgba(15, 23, 42, 0.08)' }
      : {
          elevation: 14,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        };

  const drawerShadow: any =
    Platform.OS === 'web'
      ? { boxShadow: '-14px 0px 42px rgba(15, 23, 42, 0.18)' }
      : {
          elevation: 20,
          shadowColor: '#0F172A',
          shadowOffset: { width: -6, height: 0 },
          shadowOpacity: 0.2,
          shadowRadius: 18,
        };

  const desktopNavItems = [
    {
      key: 'shop',
      label: 'Shop',
      subtitle: 'Flash deals & curated picks',
      icon: 'storefront-outline' as const,
      activeIcon: 'storefront' as const,
      route: '/(app)/(tabs)/home',
      match: '/home',
    },
    {
      key: 'categories',
      label: 'Categories',
      subtitle: 'Browse all collections',
      icon: 'view-grid-outline' as const,
      activeIcon: 'view-grid' as const,
      route: '/(app)/(tabs)/categories',
      match: '/categories',
    },
    {
      key: 'cart',
      label: 'Shopping Cart',
      subtitle:
        cartBadgeCount > 0
          ? `${cartBadgeCount} ${cartBadgeCount === 1 ? 'item' : 'items'} ready`
          : 'Your bag is empty',
      icon: 'cart-outline' as const,
      activeIcon: 'cart' as const,
      route: '/(app)/(tabs)/cart',
      match: '/cart',
      badge: cartBadgeCount,
    },
    {
      key: 'profile',
      label: 'My Profile',
      subtitle: 'Orders, wishlist & settings',
      icon: 'account-outline' as const,
      activeIcon: 'account' as const,
      route: '/(app)/(tabs)/profile',
      match: '/profile',
    },
  ];

  const desktopSecondaryItems = [
    {
      key: 'orders',
      label: 'My Orders',
      icon: 'package-variant-closed' as const,
      route: '/(app)/orders',
    },
    {
      key: 'messages',
      label: 'Shop Updates & Messages',
      icon: 'bell-badge-outline' as const,
      route: '/(app)/messages',
    },
  ];

  const isRouteActive = (match: string) => {
    if (!pathname) return match === '/home';
    return pathname === match || pathname.endsWith(match);
  };

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.username ||
    'Marketplace Shopper';

  const safeBottomInset = Platform.OS === 'web' ? 0 : Math.max(insets.bottom, 6);
  const tabBarHeight = (isTablet ? 64 : 64) + safeBottomInset;

  const renderTabIcon = (
    focused: boolean,
    color: string,
    activeName: any,
    inactiveName: any
  ) => (
    <View
      style={[
        styles.tabIconPill,
        isSmallPhone && { paddingHorizontal: 10, paddingVertical: 3 },
        focused && {
          backgroundColor: palette.isDark
            ? 'rgba(254, 44, 85, 0.22)'
            : 'rgba(254, 44, 85, 0.12)',
        },
      ]}
    >
      <MaterialCommunityIcons
        name={focused ? activeName : inactiveName}
        size={isTablet ? 21 : isSmallPhone ? 20 : 22}
        color={focused ? '#FE2C55' : color}
      />
    </View>
  );

  return (
    <DesktopDrawerContext.Provider
      value={{
        openDesktopDrawer,
        closeDesktopDrawer,
        cartBadgeCount,
        wishlistBadgeCount,
      }}
    >
      <PaperProvider theme={paperTheme}>
        <View
          style={[
            styles.rootContainer,
            {
              backgroundColor: palette.isDark ? palette.background : '#F1F5FB',
            },
            webAmbientBackdropStyle,
          ]}
        >
          {/* Ambient Decorative Glow Orbs across Website, Tablet & Phone */}
          <View pointerEvents="none" style={styles.ambientLayer}>
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
                styles.ambientOrbBottomLeft,
                {
                  backgroundColor: palette.isDark
                    ? 'rgba(139, 92, 246, 0.11)'
                    : 'rgba(168, 85, 247, 0.08)',
                },
              ]}
            />
          </View>

          <Tabs
            sceneContainerStyle={{
              paddingTop: 0,
              backgroundColor: 'transparent',
              width: '100%',
            }}
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: '#FE2C55',
              tabBarInactiveTintColor: palette.textMuted,
              tabBarLabelPosition: isTablet ? 'beside-icon' : 'below-icon',
              // Website (isDesktop) uses Hamburger Drawer; Tablet & Phones (Realme, iPhone, Samsung, etc.) show elevated frosted bottom bar
              tabBarStyle: isDesktop
                ? { display: 'none' }
                : {
                    backgroundColor: palette.glassNav,
                    borderTopWidth: 1,
                    borderTopColor: palette.border,
                    paddingTop: isTablet ? 8 : 6,
                    paddingBottom: safeBottomInset,
                    height: tabBarHeight,
                    paddingHorizontal: isTablet ? 28 : isSmallPhone ? 2 : 6,
                    margin: 0,
                    ...mobileTabShadow,
                    ...webNavBlur,
                  },
              tabBarItemStyle: isTablet
                ? {
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 0,
                    margin: 0,
                    borderRadius: 14,
                  }
                : {
                    flex: 1,
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    paddingVertical: 2,
                    margin: 0,
                  },
              tabBarIconStyle: {
                margin: 0,
                marginRight: isTablet ? 4 : 0,
                padding: 0,
              },
              tabBarLabelStyle: {
                fontSize: isTablet ? 13 : isSmallPhone ? 9.5 : 11,
                fontWeight: '800',
                letterSpacing: 0.15,
                marginTop: isTablet ? 0 : 2,
                marginLeft: isTablet ? 6 : 0,
                marginBottom: 0,
                padding: 0,
              },
            }}
          >
            <Tabs.Screen
              name="home"
              options={{
                title: 'Shop',
                tabBarIcon: ({ focused, color }) =>
                  renderTabIcon(focused, color, 'storefront', 'storefront-outline'),
              }}
            />
            <Tabs.Screen
              name="categories"
              options={{
                title: 'Categories',
                tabBarIcon: ({ focused, color }) =>
                  renderTabIcon(focused, color, 'view-grid', 'view-grid-outline'),
              }}
            />
            <Tabs.Screen
              name="cart"
              options={{
                title: 'Cart',
                tabBarBadge: cartBadgeCount > 0 ? cartBadgeCount : undefined,
                tabBarBadgeStyle: {
                  backgroundColor: '#FE2C55',
                  color: '#FFFFFF',
                  fontSize: 10,
                  fontWeight: '900',
                  borderWidth: 1.5,
                  borderColor: palette.isDark ? '#0F172A' : '#FFFFFF',
                },
                tabBarIcon: ({ focused, color }) =>
                  renderTabIcon(focused, color, 'cart', 'cart-outline'),
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: 'Profile',
                tabBarIcon: ({ focused, color }) =>
                  renderTabIcon(focused, color, 'account', 'account-outline'),
              }}
            />

            {/* Hide search route from tab bar */}
            <Tabs.Screen
              name="search"
              options={{
                href: null,
                headerShown: false,
              }}
            />

            {/* Hide AccountSettingsModal & style/helper files inside (tabs) from Tablet & Mobile bottom tab bar */}
            <Tabs.Screen
              name="AccountSettingsModal"
              options={{
                href: null,
                headerShown: false,
              }}
            />
            <Tabs.Screen
              name="profileStyles"
              options={{
                href: null,
                headerShown: false,
              }}
            />
            <Tabs.Screen
              name="homeStyles"
              options={{
                href: null,
                headerShown: false,
              }}
            />

            {/* Hide product detail route from tab bar & hide tab bar when viewing product details */}
            <Tabs.Screen
              name="product/[id]"
              options={{
                href: null,
                headerShown: false,
                tabBarStyle: { display: 'none' },
              }}
            />
          </Tabs>

          {/* ==================== WEBSITE HAMBURGER DRAWER (SHOP, CATEGORIES, CART, PROFILE) ==================== */}
          {isDesktop && (
            <Modal
              visible={drawerOpen}
              transparent
              animationType="none"
              onRequestClose={() => closeDesktopDrawer()}
            >
              <View style={styles.drawerOverlayContainer}>
                {/* Animated Dimmed Left Backdrop */}
                <TouchableWithoutFeedback onPress={() => closeDesktopDrawer()}>
                  <Animated.View
                    style={[
                      styles.drawerBackdrop,
                      {
                        opacity: backdropFadeAnim,
                        backgroundColor: palette.glassOverlay || 'rgba(15, 23, 42, 0.48)',
                      },
                    ]}
                  />
                </TouchableWithoutFeedback>

                {/* Right-Side Frosted Glass Slide-Out Drawer Panel */}
                <Animated.View
                  style={[
                    styles.drawerPanel,
                    {
                      width: drawerWidth,
                      backgroundColor: palette.glassModal || palette.background,
                      borderLeftColor: palette.border,
                      paddingTop: Math.max(insets.top, 22),
                      paddingBottom: Math.max(insets.bottom, 20),
                      transform: [{ translateX: slideAnim }],
                    },
                    drawerShadow,
                    webNavBlur,
                  ]}
                >
                  {/* Top Brand Header */}
                  <View style={styles.drawerBrandHeader}>
                    <View style={styles.drawerBrandRow}>
                      <View style={[styles.brandBadge, webBrandGradientStyle]}>
                        <MaterialCommunityIcons name="shopping" size={20} color="#FFFFFF" />
                      </View>
                      <View>
                        <Text
                          style={[
                            styles.brandTitle,
                            { color: palette.textPrimary },
                          ]}
                        >
                          Marketplace
                        </Text>
                        <Text
                          style={[
                            styles.brandSubtitle,
                            { color: palette.textSecondary },
                          ]}
                        >
                          Official Storefront
                        </Text>
                      </View>
                    </View>

                    <IconButton
                      icon="close"
                      size={21}
                      iconColor={palette.textPrimary}
                      onPress={() => closeDesktopDrawer()}
                      style={[
                        styles.drawerCloseBtn,
                        {
                          backgroundColor: palette.glassInput,
                          borderColor: palette.border,
                        },
                      ]}
                    />
                  </View>

                  {/* User Account Quick Card */}
                  <Surface
                    elevation={0}
                    style={[
                      styles.userSummaryCard,
                      {
                        backgroundColor: palette.glassSurface,
                        borderColor: palette.border,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.82}
                      onPress={() =>
                        closeDesktopDrawer(() => {
                          router.push('/(app)/(tabs)/profile' as any);
                        })
                      }
                      style={styles.userSummaryRow}
                    >
                      <View style={styles.userAvatarRing}>
                        <Avatar.Image
                          size={44}
                          source={{
                            uri:
                              user?.image ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                displayName
                              )}&background=FE2C55&color=fff&size=128`,
                          }}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.userSummaryName,
                            { color: palette.textPrimary },
                          ]}
                        >
                          {displayName}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.userSummaryHandle,
                            { color: palette.textSecondary },
                          ]}
                        >
                          @{user?.username || 'member'} · {wishlistBadgeCount} Saved
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={palette.textMuted}
                      />
                    </TouchableOpacity>
                  </Surface>

                  <Divider style={{ backgroundColor: palette.border, marginVertical: 14 }} />

                  {/* Main Navigation Links */}
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 16 }}
                  >
                    <Text
                      style={[
                        styles.drawerSectionLabel,
                        { color: palette.textMuted },
                      ]}
                    >
                      NAVIGATION
                    </Text>

                    <View style={{ gap: 8 }}>
                      {desktopNavItems.map((item) => {
                        const active = isRouteActive(item.match);
                        return (
                          <TouchableOpacity
                            key={item.key}
                            activeOpacity={0.82}
                            onPress={() =>
                              closeDesktopDrawer(() => {
                                router.push(item.route as any);
                              })
                            }
                            style={[
                              styles.drawerNavItem,
                              {
                                backgroundColor: active
                                  ? palette.isDark
                                    ? 'rgba(254, 44, 85, 0.18)'
                                    : 'rgba(254, 44, 85, 0.10)'
                                  : 'transparent',
                                borderColor: active
                                  ? 'rgba(254, 44, 85, 0.38)'
                                  : 'transparent',
                              },
                            ]}
                          >
                            <View style={styles.drawerNavLeft}>
                              <View
                                style={[
                                  styles.drawerNavIconBox,
                                  {
                                    backgroundColor: active
                                      ? '#FE2C55'
                                      : palette.glassInput,
                                  },
                                ]}
                              >
                                <MaterialCommunityIcons
                                  name={active ? item.activeIcon : item.icon}
                                  size={20}
                                  color={active ? '#FFFFFF' : palette.textSecondary}
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[
                                    styles.drawerNavTitle,
                                    {
                                      fontWeight: active ? '900' : '700',
                                      color: active ? '#FE2C55' : palette.textPrimary,
                                    },
                                  ]}
                                >
                                  {item.label}
                                </Text>
                                <Text
                                  numberOfLines={1}
                                  style={[
                                    styles.drawerNavSubtitle,
                                    { color: palette.textSecondary },
                                  ]}
                                >
                                  {item.subtitle}
                                </Text>
                              </View>
                            </View>

                            {typeof item.badge === 'number' && item.badge > 0 && (
                              <View style={styles.drawerBadge}>
                                <Text style={styles.drawerBadgeText}>{item.badge}</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Divider style={{ backgroundColor: palette.border, marginVertical: 16 }} />

                    <Text
                      style={[
                        styles.drawerSectionLabel,
                        { color: palette.textMuted },
                      ]}
                    >
                      ACTIVITY & UPDATES
                    </Text>

                    <View style={{ gap: 6 }}>
                      {desktopSecondaryItems.map((sec) => (
                        <TouchableOpacity
                          key={sec.key}
                          activeOpacity={0.8}
                          onPress={() =>
                            closeDesktopDrawer(() => {
                              router.push(sec.route as any);
                            })
                          }
                          style={styles.drawerSecondaryItem}
                        >
                          <View
                            style={[
                              styles.drawerSecondaryIcon,
                              { backgroundColor: palette.accentSoft },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={sec.icon}
                              size={18}
                              color={palette.accent}
                            />
                          </View>
                          <Text
                            style={[
                              styles.drawerSecondaryText,
                              { color: palette.textPrimary },
                            ]}
                          >
                            {sec.label}
                          </Text>
                          <MaterialCommunityIcons
                            name="chevron-right"
                            size={18}
                            color={palette.textMuted}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  {/* Bottom Sign Out Footer */}
                  <View
                    style={[
                      styles.drawerFooter,
                      { borderTopColor: palette.border },
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.82}
                      onPress={() =>
                        closeDesktopDrawer(async () => {
                          await logout();
                          router.replace('/(auth)/login' as any);
                        })
                      }
                      style={[
                        styles.signOutButton,
                        {
                          backgroundColor: palette.isDark
                            ? 'rgba(239, 68, 68, 0.16)'
                            : 'rgba(239, 68, 68, 0.09)',
                          borderColor: 'rgba(239, 68, 68, 0.30)',
                        },
                      ]}
                    >
                      <MaterialCommunityIcons name="logout" size={18} color="#EF4444" />
                      <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </View>
            </Modal>
          )}
        </View>
      </PaperProvider>
    </DesktopDrawerContext.Provider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  ambientLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  ambientOrbTopLeft: {
    position: 'absolute',
    top: -120,
    left: -90,
    width: 340,
    height: 340,
    borderRadius: 999,
  },
  ambientOrbTopRight: {
    position: 'absolute',
    top: 40,
    right: -110,
    width: 310,
    height: 310,
    borderRadius: 999,
  },
  ambientOrbBottomLeft: {
    position: 'absolute',
    bottom: 60,
    left: -95,
    width: 300,
    height: 300,
    borderRadius: 999,
  },
  tabIconPill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerOverlayContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    flex: 1,
  },
  drawerPanel: {
    height: '100%',
    borderLeftWidth: 1,
    paddingHorizontal: 18,
  },
  drawerBrandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  drawerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  brandBadge: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#FE2C55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 1,
  },
  drawerCloseBtn: {
    margin: 0,
    borderWidth: 1,
    borderRadius: 12,
  },
  userSummaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 11,
  },
  userSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  userAvatarRing: {
    padding: 2,
    borderRadius: 999,
    borderWidth: 1.8,
    borderColor: '#FE2C55',
  },
  userSummaryName: {
    fontSize: 14.5,
    fontWeight: '900',
  },
  userSummaryHandle: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  drawerSectionLabel: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.9,
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  drawerNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
  },
  drawerNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  drawerNavIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerNavTitle: {
    fontSize: 14.5,
  },
  drawerNavSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  drawerBadge: {
    backgroundColor: '#FE2C55',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999,
    minWidth: 24,
    alignItems: 'center',
  },
  drawerBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  drawerSecondaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 13,
  },
  drawerSecondaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerSecondaryText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
  },
  drawerFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#EF4444',
  },
});