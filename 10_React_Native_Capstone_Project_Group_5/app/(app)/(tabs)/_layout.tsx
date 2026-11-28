/**
 * Tabs Layout - Marketplace App Navigation
 * Tabs: Home (Shop), Categories, Search, Cart, Profile
 * Restyled: soft cream tab bar with icon-only tabs (labels hidden so they never clip on phones)
 */
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCart } from '@/context/CartContext';
import { palette } from '@/constants/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const icon = (active: IconName, inactive: IconName) => {
  function TabIcon({ focused, color }: { focused: boolean; color: string }) {
    return <MaterialCommunityIcons name={focused ? active : inactive} size={26} color={color} />;
  }
  TabIcon.displayName = 'TabIcon';
  return TabIcon;
};

export default function TabsLayout() {
  const { totalQuantity } = useCart();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Icon-only tabs: hiding the labels frees vertical space on phones, so the icons
        // (and the cart badge) are never clipped by the bottom edge / gesture bar.
        tabBarShowLabel: false,
        tabBarActiveTintColor: palette.ink,
        tabBarInactiveTintColor: palette.stone,
        tabBarStyle: {
          backgroundColor: palette.ivory,
          borderTopWidth: 0,
          paddingTop: 8,
          // No paddingBottom override: react-navigation adds the device safe-area inset,
          // so the icons stay above the Android gesture bar.
          ...Platform.select({
            web: { boxShadow: 'none' },
            default: { elevation: 0, shadowOpacity: 0 },
          }),
        },
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
      {/* Play & Earn is opened from inside the app, so it gets no tab button */}
      <Tabs.Screen name="play-earn" options={{ href: null }} />
    </Tabs>
  );
}