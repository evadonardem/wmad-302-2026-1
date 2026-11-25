/**
 * Tabs Layout - Marketplace App Navigation
 * Tabs: Home (Shop), Categories, Search, Cart, Profile
 * Restyled: soft cream tab bar, small sentence-case labels, dark active state
 */
import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCart } from '@/context/CartContext';
import { palette } from '@/constants/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const icon =
  (active: IconName, inactive: IconName) =>
    ({ focused, color }: { focused: boolean; color: string }) => (
      <MaterialCommunityIcons name={focused ? active : inactive} size={24} color={color} />
    );

export default function TabsLayout() {
  const { totalQuantity } = useCart();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Labels under the icons on wide screens too, so the cart badge never covers the label
        tabBarLabelPosition: 'below-icon',
        tabBarActiveTintColor: palette.ink,
        tabBarInactiveTintColor: palette.stone,
        tabBarStyle: {
          backgroundColor: palette.ivory,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
        tabBarBadgeStyle: { backgroundColor: palette.sage, color: palette.surface, fontSize: 10 },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen name="categories" options={{ title: 'Category', tabBarIcon: icon('view-grid', 'view-grid-outline') }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: icon('magnify', 'magnify') }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          // Badge count from the cart context
          tabBarBadge: totalQuantity > 0 ? totalQuantity : undefined,
          tabBarIcon: icon('cart', 'cart-outline'),
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('account-circle', 'account-circle-outline') }} />
      {/* Product detail is opened from cards, so it gets no tab button */}
      <Tabs.Screen name="product/[id]" options={{ href: null }} />
    </Tabs>
  );
}