/**
 * Tabs Layout - Shop, Categories, Search, Cart, Profile
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { ColorValue, StyleSheet } from 'react-native';
import { useAppTheme } from '@/constants/theme';
import { useCart } from '@/context/CartContext';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function tabIcon(active: IconName, inactive: IconName) {
  return function TabBarIcon({ focused, color }: { focused: boolean; color: ColorValue }) {
    return <MaterialCommunityIcons name={focused ? active : inactive} size={24} color={typeof color === 'string' ? color : undefined} />;
  };
}

export default function TabsLayout() {
  const theme = useAppTheme();
  const { totalQuantity } = useCart();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant, borderTopWidth: StyleSheet.hairlineWidth },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Shop', tabBarIcon: tabIcon('storefront', 'storefront-outline') }} />
      <Tabs.Screen name="categories" options={{ title: 'Categories', tabBarIcon: tabIcon('view-grid', 'view-grid-outline') }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: tabIcon('magnify', 'magnify') }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: tabIcon('cart', 'cart-outline'),
          tabBarBadge: totalQuantity > 0 ? totalQuantity : undefined,
          tabBarBadgeStyle: { backgroundColor: theme.colors.error },
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('account', 'account-outline') }} />
    </Tabs>
  );
}
