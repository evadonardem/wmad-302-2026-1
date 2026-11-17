
/**
 * Tabs Layout - Marketplace App Navigation
 *
 * Bottom navigation:
 * - Shop
 * - Orders
 * - Wishlist
 * - Profile
 *
 * Categories remains accessible through the Shop screen.
 * Search and Cart remain available as hidden routes.
 * Dynamic light and dark theme support.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, type MD3Theme } from 'react-native-paper';

export default function TabsLayout() {
  const { colors } = useTheme<MD3Theme>();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,

        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 12,
          height: 72,

          backgroundColor: colors.surface,
          borderTopWidth: 0,
          borderRadius: 26,

          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.10,
          shadowRadius: 12,

          paddingTop: 9,
          paddingBottom: 9,
          paddingHorizontal: 6,
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 3,
        },

        tabBarItemStyle: {
          paddingVertical: 2,
        },

        tabBarIconStyle: {
          marginTop: 1,
        },
      }}
    >
      {/* Shop */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Shop',
          tabBarIcon: ({ focused, color }) => (
            <View
              style={[
                styles.iconContainer,
                focused && {
                  backgroundColor: colors.primaryContainer,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={focused ? 'storefront' : 'storefront-outline'}
                size={23}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Orders */}
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ focused, color }) => (
            <View
              style={[
                styles.iconContainer,
                focused && {
                  backgroundColor: colors.primaryContainer,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  focused
                    ? 'package-variant'
                    : 'package-variant-closed'
                }
                size={23}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Wishlist */}
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ focused, color }) => (
            <View
              style={[
                styles.iconContainer,
                focused && {
                  backgroundColor: colors.primaryContainer,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={focused ? 'heart' : 'heart-outline'}
                size={23}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <View
              style={[
                styles.iconContainer,
                focused && {
                  backgroundColor: colors.primaryContainer,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={focused ? 'account' : 'account-outline'}
                size={23}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Categories - accessible through Shop */}
      <Tabs.Screen
        name="categories"
        options={{
          href: null,
        }}
      />

      {/* Hidden Search route */}
      <Tabs.Screen
        name="search"
        options={{
          href: null,
        }}
      />

      {/* Hidden Cart route */}
      <Tabs.Screen
        name="cart"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 48,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
