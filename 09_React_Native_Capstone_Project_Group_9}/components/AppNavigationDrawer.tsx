import React, { useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme, useThemedStyles } from '@/context/AppThemeContext';
import { styles as baseStyles } from './appNavigationDrawerStyles';

const destinations = [
  { label: 'Discover', href: '/(app)/(tabs)/home', icon: 'stove' },
  { label: 'Search', href: '/(app)/(tabs)/search', icon: 'magnify' },
  { label: 'Categories', href: '/(app)/(tabs)/categories', icon: 'view-grid' },
  { label: 'Favorites', href: '/(app)/(tabs)/favorites', icon: 'heart' },
  { label: 'Profile', href: '/(app)/(tabs)/profile', icon: 'account' },
  { label: 'Meal Planner', href: '/(app)/(tabs)/meal-planner', icon: 'calendar-month' },
] as const;

export function AppNavigationDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(baseStyles);
  const [isOpen, setIsOpen] = useState(false);

  const currentDestination = destinations.find(({ href }) =>
    pathname.endsWith(href.split('/').pop() ?? '')
  );

  return (
    <>
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => setIsOpen(true)}
              style={styles.menuButton}
              accessibilityRole="button"
              accessibilityLabel="Open navigation menu"
            >
              <MaterialCommunityIcons name="menu" size={27} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.brand}>
              <Text style={styles.brandName}>CookBook</Text>
              <Text style={styles.pageName}>{currentDestination?.label ?? 'Recipe'}</Text>
            </View>
            <MaterialCommunityIcons name="chef-hat" size={25} color={colors.accent} />
          </View>
        </SafeAreaView>
      </View>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setIsOpen(false)}
            accessibilityLabel="Close navigation menu"
          />
          <SafeAreaView style={styles.drawer} edges={['top', 'bottom']}>
            <View style={styles.drawerBrand}>
              <View style={styles.drawerLogo}>
                <MaterialCommunityIcons name="chef-hat" size={27} color="#FFFFFF" />
              </View>
              <View style={styles.drawerBrandText}>
                <Text style={styles.drawerTitle}>CookBook</Text>
                <Text style={styles.drawerSubtitle}>Your recipe collection</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close navigation menu"
              >
                <MaterialCommunityIcons name="close" size={22} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.menuLabel}>MENU</Text>
            {destinations.map((destination) => {
              const isActive = currentDestination?.href === destination.href;
              return (
                <TouchableOpacity
                  key={destination.href}
                  style={[styles.destination, isActive && styles.destinationActive]}
                  onPress={() => {
                    setIsOpen(false);
                    router.push(destination.href);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <MaterialCommunityIcons
                    name={destination.icon}
                    size={21}
                    color={isActive ? colors.accent : colors.muted}
                  />
                  <Text style={[styles.destinationText, isActive && styles.destinationTextActive]}>
                    {destination.label}
                  </Text>
                  {isActive && <View style={styles.activeMarker} />}
                </TouchableOpacity>
              );
            })}

            <View style={styles.drawerFooter}>
              <Text style={styles.drawerFooterText}>COOKBOOK · MADE WITH A PINCH OF JOY</Text>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

