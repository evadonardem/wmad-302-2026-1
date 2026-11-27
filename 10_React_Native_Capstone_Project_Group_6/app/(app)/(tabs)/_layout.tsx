/**
 * Tabs Layout - Shop, Categories, Search, Cart, Profile
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useAppTheme } from '@/constants/theme';
import { useCart } from '@/context/CartContext';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type TabIconProps = { focused: boolean; color: string };

const MAX_BADGE_COUNT = 99;

// Created once at module level so icon components keep a stable identity across renders
function createTabIcon(active: IconName, inactive: IconName) {
  function TabBarIcon({ focused, color }: TabIconProps) {
    return <MaterialCommunityIcons name={focused ? active : inactive} size={24} color={color} />;
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
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
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