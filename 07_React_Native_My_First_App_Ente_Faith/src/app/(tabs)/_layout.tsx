import { useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

// TODO 21 [Tab Bar Configuration]
export default function TabsLayout() {
  const theme = useTheme(); 

  return (
    <Tabs 
      screenOptions={{
        
        tabBarActiveTintColor: theme.colors.primary, 
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: theme.colors.text,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        
        tabBarStyle: {
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        }
      }}
    >
      {/* TODO 22 [Tab Screen Registration] */}
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={String(color)} />
          )
        }} 
      />
      
      <Tabs.Screen 
        name="favorites" 
        options={{ 
          title: 'Favorites',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={String(color)} />
          )
        }} 
      />
      
      <Tabs.Screen 
        name="settings" 
        options={{ 
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={String(color)} />
          )
        }} 
      />
    </Tabs>
  );
}