/**
 * Tabs Layout - Shop, Categories, Search, Cart, Profile
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/constants/theme';
import { useCart } from '@/context/CartContext';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type TabIconProps = { focused: boolean; color: string };

const MAX_BADGE_COUNT = 99;

// Created once at module level so icon components keep a stable identity across renders
function createTabIcon(active: IconName, inactive: IconName) {
  function TabBarIcon({ focused, color }: TabIconProps) {
    return <MaterialCommunityIcons name={focused ? active : inactive} size={22} color={color} />;
  }
  return TabBarIcon;
}

const ShopIcon = createTabIcon('storefront', 'storefront-outline');
const CategoriesIcon = createTabIcon('view-grid', 'view-grid-outline');
const SearchIcon = createTabIcon('magnify', 'magnify');
const CartIcon = createTabIcon('cart', 'cart-outline');
const ProfileIcon = createTabIcon('account', 'account-outline');

export default function TabsLayout() {
  const theme = useAppTheme();
  const { totalQuantity } = useCart();

  const cartBadge =
    totalQuantity > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : totalQuantity > 0 ? totalQuantity : undefined;

  return (
    <Tabs
      sceneContainerStyle={{ backgroundColor: theme.colors.background }}
      screenOptions={{
        headerShown: false,
        tabBarLabelPosition: 'below-icon',
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarActiveBackgroundColor: 'transparent',
        tabBarInactiveBackgroundColor: 'transparent',
        tabBarBackground: () => (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: theme.dark ? '#202526' : theme.colors.surface,
                borderColor: theme.dark ? '#465254' : theme.colors.outlineVariant,
                borderWidth: 1,
                borderRadius: 36,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.18,
                shadowRadius: 14,
                elevation: 8,
              },
            ]}
          />
        ),
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 12,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
          borderTopWidth: 0,
          borderRadius: 36,
          height: 68,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarItemStyle: { flex: 1, minWidth: 0 },
        tabBarLabelStyle: { fontSize: 10, lineHeight: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Shop', tabBarIcon: ShopIcon }} />
      <Tabs.Screen name="categories" options={{ title: 'Categories', tabBarIcon: CategoriesIcon }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: SearchIcon }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: CartIcon,
          tabBarBadge: cartBadge,
          tabBarBadgeStyle: { backgroundColor: theme.colors.error, color: theme.colors.onError },
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ProfileIcon }} />
    </Tabs>
  );
}