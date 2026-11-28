import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useCart } from '@/context/CartContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Badge } from 'react-native-paper';

const menuItems = [
  { label: 'Home', icon: 'home-outline', route: '/(app)/(tabs)/home' },
  { label: 'Search Products', icon: 'magnify', route: '/(app)/(tabs)/search' },
  { label: 'Categories', icon: 'view-grid-outline', route: '/(app)/(tabs)/categories' },
  { label: 'Saved Items', icon: 'bookmark-outline', route: '/(app)/(tabs)/profile' },
  { label: 'Order History', icon: 'file-document-outline', route: '/(app)/(tabs)/profile?panel=orders' },
  { label: 'Shopping Bag', icon: 'shopping-outline', route: '/(app)/(tabs)/cart' },
  { label: 'Profile', icon: 'account-outline', route: '/(app)/(tabs)/profile' },
] as const;

export default function TabsLayout() {
  const router = useRouter();
  const { itemCount } = useCart();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <>
      <Tabs
        initialRouteName="home"
        screenOptions={{
          headerShown: true,
          headerTitle: 'NextDoorFinds',
          headerTintColor: '#332F28',
          headerStyle: { backgroundColor: '#FBF9F3' },
          headerTitleStyle: { fontWeight: '700', color: '#332F28', fontFamily: 'Georgia' },
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/(app)/(tabs)/cart')}
              style={{ paddingHorizontal: 16, paddingVertical: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`Open cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
            >
              <MaterialCommunityIcons name="cart-outline" size={25} color="#332F28" />
              {itemCount > 0 ? (
                <Badge style={{ position: 'absolute', top: 0, right: 7 }}>{itemCount}</Badge>
              ) : null}
            </Pressable>
          ),
          headerLeft: () => (
            <Pressable
              onPress={() => setMenuVisible(true)}
              style={{ paddingHorizontal: 16, paddingVertical: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Open navigation menu"
            >
              <MaterialCommunityIcons name="menu" size={26} color="#332F28" />
            </Pressable>
          ),
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="search" options={{ title: 'Search' }} />
        <Tabs.Screen name="home" options={{ title: 'Shop', href: null }} />
        <Tabs.Screen name="categories" options={{ title: 'Categories', href: null }} />
        <Tabs.Screen name="cart" options={{ title: 'Cart', href: null }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', href: null }} />
      </Tabs>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={{ flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.35)' }}>
          <View style={{ width: 300, maxWidth: '84%', backgroundColor: '#FBF9F3', paddingTop: 48 }}>
            <View
              style={{
                minHeight: 64,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: '#DED8CB',
              }}
            >
              <Text style={{ color: '#332F28', fontSize: 20, fontWeight: '700', fontFamily: 'Georgia' }}>NextDoorFinds</Text>
              <Pressable
                onPress={() => setMenuVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close navigation menu"
              >
                <MaterialCommunityIcons name="close" size={24} color="#8C8171" />
              </Pressable>
            </View>
            <Text
              style={{
                marginTop: 18,
                marginBottom: 8,
                paddingHorizontal: 20,
                color: '#8C8171',
                fontSize: 12,
                fontWeight: '700',
                letterSpacing: 0.6,
              }}
            >
              NAVIGATE
            </Text>
            {menuItems.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => {
                  setMenuVisible(false);
                  router.push(item.route);
                }}
                style={{
                  minHeight: 54,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                  paddingHorizontal: 20,
                }}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name={item.icon} size={22} color="#8C8171" />
                <Text style={{ flex: 1, color: '#332F28', fontSize: 16 }}>{item.label}</Text>
                {item.label === 'Shopping Bag' && itemCount > 0 ? (
                  <Text style={{ color: '#708066', fontWeight: '700' }}>{itemCount}</Text>
                ) : null}
              </Pressable>
            ))}
          </View>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setMenuVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Close navigation menu"
          />
        </View>
      </Modal>
    </>
  );
}
