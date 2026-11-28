/**
 * Tabs Layout - Marketplace App Navigation
 * Tabs: Shop, Search, Categories, Cart (with item badge), Profile.
 * The Shop tab icon follows the season; with Christmas the cart becomes a gift box.
 */
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import type { IconName } from '@/constants/categories';
import { SEASONS } from '@/constants/seasons';

function tabIcon(active: IconName, inactive: IconName) {
  return function TabIcon({ focused, color }: { focused: boolean; color: string }) {
    return <MaterialCommunityIcons name={focused ? active : inactive} size={24} color={color} />;
  };
}


/** Cart tab icon that bounces whenever the cart gets more items (pairs with the fly-to-cart animation). */
function CartTabIcon({ focused, color, gift, quantity }: { focused: boolean; color: string; gift: boolean; quantity: number }) {
  const scale = useSharedValue(1);
  const previous = useRef(quantity);

  useEffect(() => {
    if (quantity > previous.current) {
      // Wait for the flying image to land, then bounce
      scale.value = withSequence(withTiming(1, { duration: 550 }), withSpring(1.45, { damping: 4 }), withSpring(1));
    }
    previous.current = quantity;
  }, [quantity, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const name: IconName = gift ? (focused ? 'gift' : 'gift-outline') : focused ? 'cart' : 'cart-outline';

  return (
    <Animated.View style={style}>
      <MaterialCommunityIcons name={name} size={24} color={color} />
    </Animated.View>
  );
}
export default function TabsLayout() {
  const { totals } = useCart();
  const { palette, season, isHoliday, t } = useSettings();
  const seasonIcon = SEASONS[season].icon;
  const stripe = [palette.primary, ...palette.accents];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.onPrimary,
        // 8-digit hex: onPrimary at ~70% opacity
        tabBarInactiveTintColor: `${palette.onPrimary}B3`,
        tabBarStyle: {
          backgroundColor: palette.primary,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        },
        // Theme color with a stripe of the accent colors along the top
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.primary }]}>
            <View style={styles.stripe}>
              {stripe.map((color, index) => (
                <View key={index} style={[styles.stripeSegment, { backgroundColor: color === palette.primary ? palette.onPrimary : color }]} />
              ))}
            </View>
          </View>
        ),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tab.shop'),
          tabBarIcon: season === 'lively' ? tabIcon('storefront', 'storefront-outline') : tabIcon(seasonIcon, seasonIcon),
        }}
      />
      <Tabs.Screen name="search" options={{ title: t('tab.search'), tabBarIcon: tabIcon('magnify', 'magnify') }} />
      <Tabs.Screen
        name="categories"
        options={{ title: t('tab.categories'), tabBarIcon: tabIcon('view-grid', 'view-grid-outline') }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t('tab.cart'),
          tabBarIcon: ({ focused, color }) => (
            <CartTabIcon focused={focused} color={color} gift={isHoliday} quantity={totals.totalQuantity} />
          ),
          tabBarBadge: totals.totalQuantity > 0 ? totals.totalQuantity : undefined,
          tabBarBadgeStyle: { backgroundColor: palette.accents[0], color: '#1A1A1A', fontSize: 11, fontWeight: '800' },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tab.profile'), tabBarIcon: tabIcon('account', 'account-outline') }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  stripe: {
    flexDirection: 'row',
    height: 4,
  },
  stripeSegment: {
    flex: 1,
  },
});
