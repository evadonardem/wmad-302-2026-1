/**
 * Tabs Layout - Cookbook App Navigation
 * Tabs: Discover, Search, Categories, Favorites (with badge count), Profile
 */
import { Tabs, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { favoritesStorage } from '@/utils/storage';

export default function TabsLayout() {
  const [favoriteCount, setFavoriteCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      favoritesStorage.getIds().then((ids) => {
        if (active) setFavoriteCount(ids.length);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#E85D04',
        tabBarInactiveTintColor: '#8D6E63',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Discover',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons
              name={focused ? 'silverware-fork-knife' : 'silverware'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="magnify" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons
              name={focused ? 'view-grid' : 'view-grid-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarBadge: favoriteCount > 0 ? favoriteCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#E85D04', color: '#FFFFFF', fontSize: 11 },
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons
              name={focused ? 'heart' : 'heart-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons
              name={focused ? 'account' : 'account-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
