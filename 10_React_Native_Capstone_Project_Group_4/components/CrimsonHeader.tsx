import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useDesignMode } from '@/context/DesignModeContext';
import { DesignModeToggle } from '@/components/DesignModeToggle';

interface CrimsonHeaderProps {
  searchPlaceholder?: string;
}

export function CrimsonHeader({ searchPlaceholder = 'Search for products...' }: CrimsonHeaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { items, wishlist } = useCart();
  const { isCrimson } = useDesignMode();
  const { width } = useWindowDimensions();

  const itemCount = items.reduce((sum, entry) => sum + entry.quantity, 0);
  const isDesktop = width >= 820;

  return (
    <View
      style={[
        styles.headerOuter,
        isCrimson ? styles.headerCrimson : styles.headerGlass,
      ]}
    >
      <View style={styles.headerInner}>
        <TouchableOpacity
          style={styles.brandRow}
          onPress={() => router.push('/(app)/(tabs)/home')}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.brandLogoMark,
              { backgroundColor: isCrimson ? '#E11D48' : '#1E293B' },
            ]}
          >
            <Text style={styles.brandLogoM}>M</Text>
          </View>
          <Text style={[styles.brandDark, { color: isCrimson ? '#FFFFFF' : '#1E293B' }]}>
            mart
          </Text>
          <Text style={[styles.brandAccent, { color: isCrimson ? '#FF1E42' : '#FFFFFF' }]}>
            fury
          </Text>
        </TouchableOpacity>

        {isDesktop && (
          <TouchableOpacity
            style={styles.searchPill}
            activeOpacity={0.9}
            onPress={() => router.push('/(app)/(tabs)/search')}
          >
            <Text style={styles.searchPlaceholder} numberOfLines={1}>
              {searchPlaceholder}
            </Text>
            <View
              style={[
                styles.searchBtn,
                { backgroundColor: isCrimson ? '#E11D48' : '#1E293B' },
              ]}
            >
              <MaterialCommunityIcons name="magnify" size={19} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.iconsRow}>
          <DesignModeToggle />

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/(app)/(tabs)/profile')}
          >
            <MaterialCommunityIcons
              name="account-outline"
              size={23}
              color={isCrimson ? '#F8FAFC' : '#1E293B'}
            />
            {isDesktop && (
              <Text
                style={[styles.userTag, { color: isCrimson ? '#F8FAFC' : '#1E293B' }]}
                numberOfLines={1}
              >
                {user ? user.firstName : 'Account'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/(app)/(tabs)/profile')}
          >
            <MaterialCommunityIcons
              name="heart-outline"
              size={23}
              color={isCrimson ? '#F8FAFC' : '#1E293B'}
            />
            {wishlist.length > 0 && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: isCrimson ? '#E11D48' : '#1E293B' },
                ]}
              >
                <Text style={styles.badgeText}>{wishlist.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/(app)/(tabs)/cart')}
          >
            <MaterialCommunityIcons
              name="cart-outline"
              size={23}
              color={isCrimson ? '#F8FAFC' : '#1E293B'}
            />
            {itemCount > 0 && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: isCrimson ? '#E11D48' : '#1E293B' },
                ]}
              >
                <Text style={styles.badgeText}>{itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerOuter: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    zIndex: 10,
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' } as object)
      : {}),
  },
  headerGlass: {
    backgroundColor: 'rgba(251, 191, 36, 0.9)',
    borderBottomColor: 'rgba(255, 255, 255, 0.75)',
  },
  headerCrimson: {
    backgroundColor: 'rgba(11, 11, 16, 0.94)',
    borderBottomColor: 'rgba(225, 29, 72, 0.38)',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogoMark: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  brandLogoM: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  brandDark: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandAccent: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  searchPill: {
    flex: 1,
    maxWidth: 520,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 21,
    height: 38,
    paddingLeft: 16,
    overflow: 'hidden',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  searchBtn: {
    height: '100%',
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 5,
  },
  userTag: {
    fontSize: 13,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -1,
    right: -3,
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
