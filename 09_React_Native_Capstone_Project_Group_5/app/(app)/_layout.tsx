/**
 * App Layout - Protected routes with auth guard, plus the app navigation.
 *
 * Phones / narrow windows: a bottom bar with Discover, Search, Planner, Favorites and a Menu tab.
 * Wide screens: a slim top bar with a hamburger button.
 * The Menu slides in from the left with every page, Settings and a dark-mode switch.
 * The navigation stays on every page (recipe pages included) except Cooking Mode. Pressing a tab
 * while on a recipe goes straight to that page, so "Discover" acts as a back button to Home.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Href, Redirect, Stack, usePathname, useRouter } from 'expo-router';
import { Switch } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { BackButton, IconName, MenuBarContext, requestScrollToTop } from '@/components';
import { createStyles, tc, useAppTheme } from '@/context/ThemeContext';
import { routes } from '@/utils/routes';

/** Built on each render so the header follows light / dark mode. */
const getHeaderOptions = () => ({
  headerShown: true,
  headerTintColor: '#E85D04',
  headerStyle: { backgroundColor: tc('#FFFDF8', 'backgroundColor') },
  headerTitleStyle: { color: tc('#3E2723'), fontWeight: '700' as const },
  headerShadowVisible: false,
  // Works on web too, where there may be no history to go back to
  headerLeft: () => <BackButton />,
});

interface MenuItem {
  label: string;
  icon: IconName;
  route: string;
  match: string;
}

// The four pages that get a bottom tab on phones (everything else lives in the menu)
const TAB_MATCHES = ['/home', '/search', '/planner', '/favorites'];

const ITEMS: MenuItem[] = [
  { label: 'Discover', icon: 'stove', route: routes.home, match: '/home' },
  { label: 'Search', icon: 'magnify', route: routes.search(), match: '/search' },
  { label: 'Meal Planner', icon: 'calendar-month-outline', route: routes.planner, match: '/planner' },
  { label: 'Favorites', icon: 'heart-outline', route: routes.favorites, match: '/favorites' },
  { label: 'Categories', icon: 'view-grid-outline', route: routes.categories, match: '/categories' },
  { label: 'Profile', icon: 'account-outline', route: routes.profile, match: '/profile' },
];

function AppChrome({ children }: { children: React.ReactNode }) {
  useAppTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { count } = useFavorites();
  const { dark, toggle } = useAppTheme();

  const wide = width >= 768;

  // Where the navigation shows: not in Cooking Mode (distraction-free); pages that bring their own
  // header (settings, edit profile, my recipes) don't get the wide top bar
  const hidden = pathname.startsWith('/cooking');
  const ownHeader = ['/settings', '/edit-profile', '/my-recipes'].some((p) => pathname.startsWith(p));
  const showTopBar = wide && !hidden && !ownHeader;
  const showBottomBar = !wide && !hidden;
  const drawerW = Math.min(300, Math.round(width * 0.84));
  const [mounted, setMounted] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  const openMenu = useCallback(() => {
    setMounted(true);
    Animated.timing(progress, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [progress]);

  const closeMenu = useCallback(() => {
    Animated.timing(progress, { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(
      ({ finished }) => finished && setMounted(false)
    );
  }, [progress]);

  // Escape closes the menu on web
  useEffect(() => {
    if (Platform.OS !== 'web' || !mounted) return;
    const doc = (globalThis as unknown as {
      document?: {
        addEventListener: (type: string, fn: (e: { key: string }) => void) => void;
        removeEventListener: (type: string, fn: (e: { key: string }) => void) => void;
      };
    }).document;
    if (!doc) return;
    const onKey = (e: { key: string }) => e.key === 'Escape' && closeMenu();
    doc.addEventListener('keydown', onKey);
    return () => doc.removeEventListener('keydown', onKey);
  }, [mounted, closeMenu]);

  // Every navigation button also takes the page back to its start
  const navigateTo = (route: string) => {
    router.navigate(route as Href);
    requestScrollToTop();
  };
  const go = (route: string) => {
    closeMenu();
    navigateTo(route);
  };

  const current = ITEMS.find((i) => pathname.startsWith(i.match));
  const bottomTabs = ITEMS.filter((i) => TAB_MATCHES.includes(i.match));
  const inMenu = ownHeader || (!!current && !TAB_MATCHES.includes(current.match)); // Profile / Categories / Settings count as "Menu"

  const bottomBar = (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {bottomTabs.map((item) => {
        const active = current?.match === item.match;
        const heart = item.match === '/favorites';
        return (
          <Pressable
            key={item.match}
            onPress={() => navigateTo(item.route)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.label}
            style={styles.tab}
          >
            <View>
              <MaterialCommunityIcons
                name={heart && active ? 'heart' : item.icon}
                size={24}
                color={active ? '#E85D04' : tc('#8D6E63')}
              />
              {heart && count > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{count}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>
              {item.match === '/planner' ? 'Planner' : item.label}
            </Text>
          </Pressable>
        );
      })}
      <Pressable onPress={openMenu} accessibilityRole="button" accessibilityLabel="Open menu" style={styles.tab}>
        <MaterialCommunityIcons name="menu" size={24} color={inMenu ? '#E85D04' : tc('#8D6E63')} />
        <Text style={[styles.tabLabel, inMenu && styles.tabLabelActive]} numberOfLines={1}>
          Menu
        </Text>
      </Pressable>
    </View>
  );

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || '?';

  return (
    <MenuBarContext.Provider value={showTopBar}>
      <View style={styles.root}>
        {/* Top bar (wide screens only) */}
        {showTopBar && (
          <View style={[styles.bar, { paddingTop: insets.top }]}>
            <View style={styles.barRow}>
              <Pressable
                onPress={openMenu}
                accessibilityRole="button"
                accessibilityLabel="Open menu"
                style={({ pressed }) => [styles.menuBtn, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="menu" size={26} color={tc('#3E2723')} />
                {count > 0 && <View style={styles.menuDot} />}
              </Pressable>
              <View style={styles.brand}>
                <MaterialCommunityIcons name="chef-hat" size={22} color="#E85D04" />
                <Text style={styles.brandText}>Cookbook</Text>
              </View>
              <Text style={styles.section} numberOfLines={1}>
                {current?.label ?? ''}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.content}>{children}</View>

        {showBottomBar && bottomBar}

        {/* Slide-in menu */}
        {mounted && (
          <View style={styles.overlay} pointerEvents="box-none">
            <Animated.View style={[styles.backdrop, { opacity: progress }]}>
              <Pressable style={styles.fill} onPress={closeMenu} accessibilityLabel="Close menu" />
            </Animated.View>
            <Animated.View
              style={[
                styles.drawer,
                {
                  width: drawerW,
                  paddingTop: insets.top + 16,
                  paddingBottom: insets.bottom + 16,
                  transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-drawerW, 0] }) }],
                },
              ]}
            >
              <View style={styles.drawerHead}>
                <View style={styles.drawerBrand}>
                  <MaterialCommunityIcons name="chef-hat" size={26} color="#E85D04" />
                  <Text style={styles.drawerBrandText}>Cookbook</Text>
                </View>
                <Pressable onPress={closeMenu} accessibilityRole="button" accessibilityLabel="Close menu" style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={22} color={tc('#3E2723')} />
                </Pressable>
              </View>

              <Pressable onPress={() => go(routes.profile)} accessibilityRole="button" style={styles.userCard}>
                {user?.image ? (
                  <Image source={{ uri: user.image }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user ? `${user.firstName} ${user.lastName ?? ''}`.trim() : 'Welcome'}
                  </Text>
                  <Text style={styles.userSub}>View profile</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={tc('#8D6E63')} />
              </Pressable>

              <View style={styles.items}>
                {ITEMS.map((item) => {
                  const active = current?.match === item.match;
                  return (
                    <Pressable
                      key={item.match}
                      onPress={() => go(item.route)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={({ pressed }) => [styles.item, active && styles.itemActive, pressed && styles.pressed]}
                    >
                      <MaterialCommunityIcons name={item.icon} size={24} color={active ? '#FFFFFF' : tc('#5D4037')} />
                      <Text style={[styles.itemText, active && styles.itemTextActive]}>{item.label}</Text>
                      {item.match === '/favorites' && count > 0 && (
                        <View style={[styles.badge, active && styles.badgeActive]}>
                          <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{count}</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.footer}>
                <Pressable onPress={() => go(routes.settings)} accessibilityRole="button" style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
                  <MaterialCommunityIcons name="cog-outline" size={24} color={tc('#5D4037')} />
                  <Text style={styles.itemText}>Settings</Text>
                </Pressable>
                <View style={styles.item}>
                  <MaterialCommunityIcons name={dark ? 'weather-night' : 'white-balance-sunny'} size={24} color={tc('#5D4037')} />
                  <Text style={styles.itemText}>Dark mode</Text>
                  <Switch value={dark} onValueChange={toggle} color="#E85D04" />
                </View>
              </View>
            </Animated.View>
          </View>
        )}
      </View>
    </MenuBarContext.Provider>
  );
}


export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  useAppTheme();
  const headerOptions = getHeaderOptions();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: tc('#FFFDF8', 'backgroundColor') }}>
        <ActivityIndicator size="large" color="#E85D04" />
      </View>
    );
  }

  // Redirect to login if not authenticated (also fires after logout / failed refresh)
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <AppChrome>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: tc('#FFFDF8', 'backgroundColor') },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="recipe/[id]" options={{ headerShown: false, animation: 'fade_from_bottom' }} />
        <Stack.Screen name="cooking/[id]" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="edit-profile" options={{ ...headerOptions, title: 'Edit Profile' }} />
        <Stack.Screen name="settings" options={{ ...headerOptions, title: 'Settings' }} />
        <Stack.Screen name="my-recipes" options={{ ...headerOptions, title: 'My Recipes' }} />
        {/* Add other protected screens here */}
      </Stack>
    </AppChrome>
  );
}

const styles = createStyles({
  root: { flex: 1, backgroundColor: '#FFFDF8' },
  content: { flex: 1 },
  pressed: { opacity: 0.8 },
  fill: { flex: 1 },

  // Top bar
  bar: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EADFD3', zIndex: 5 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 58, paddingHorizontal: 12 },
  menuBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F1EA', borderWidth: 1, borderColor: '#EBDDCC' },
  menuDot: { position: 'absolute', top: 8, right: 8, width: 9, height: 9, borderRadius: 5, backgroundColor: '#E85D04', borderWidth: 1.5, borderColor: '#FFFFFF' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { fontSize: 19, fontWeight: '800', color: '#2B2320' },
  section: { flex: 1, textAlign: 'right', fontSize: 14, fontWeight: '700', color: '#8D6E63' },

  // Bottom tabs (phones)
  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EADFD3', paddingTop: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 12 },
  tab: { flex: 1, minWidth: 0, alignItems: 'center', gap: 3, paddingHorizontal: 2 },
  tabLabel: { fontSize: 11, fontWeight: '700', color: '#8D6E63' },
  tabLabelActive: { color: '#E85D04' },
  tabBadge: { position: 'absolute', top: -6, right: -12, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: '#E85D04', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FFFFFF' },
  tabBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },

  // Menu
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, elevation: 1000 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,10,5,0.55)' },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 6, height: 0 },
    elevation: 24,
  },
  drawerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  drawerBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  drawerBrandText: { fontSize: 22, fontWeight: '800', color: '#2B2320' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F1EA' },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, backgroundColor: '#FFF3E0', marginBottom: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFE3D6' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#E85D04' },
  avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  userName: { fontSize: 15, fontWeight: '800', color: '#2B2320' },
  userSub: { fontSize: 12, color: '#8D6E63', marginTop: 1 },
  items: { gap: 4, flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 52, paddingHorizontal: 14, borderRadius: 16 },
  itemActive: { backgroundColor: '#E85D04' },
  itemText: { flex: 1, fontSize: 16, fontWeight: '700', color: '#3E2723' },
  itemTextActive: { color: '#FFFFFF' },
  badge: { minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E85D04' },
  badgeActive: { backgroundColor: '#FFFFFF' },
  badgeText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  badgeTextActive: { color: '#E85D04' },
  footer: { borderTopWidth: 1, borderTopColor: '#EADFD3', paddingTop: 10, gap: 4 },
});