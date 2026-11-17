
/**
 * Profile Screen - Marketplace
 * Displays user information, account options, and settings.
 * Supports dynamic light and dark themes.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Card,
  Button,
  Avatar,
  Divider,
  useTheme,
  type MD3Theme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import { favoritesStorage } from '@/utils/storage';

import { createProfileStyles } from './profileStyles';

/**
 * Browser-compatible dialog helpers.
 */
const showBrowserConfirm = (message: string): boolean => {
  const browser = globalThis as typeof globalThis & {
    confirm?: (message: string) => boolean;
  };

  return browser.confirm ? browser.confirm(message) : false;
};

const showBrowserAlert = (message: string): void => {
  const browser = globalThis as typeof globalThis & {
    alert?: (message: string) => void;
  };

  browser.alert?.(message);
};

export default function ProfileScreen() {
  const { user, logout, isAuthenticated } = useAuth();

  const theme = useTheme<MD3Theme>();
  const colors = theme.colors;
  const styles = createProfileStyles(colors);

  const [wishlistCount, setWishlistCount] = useState(0);

  /**
   * Load wishlist count from AsyncStorage.
   */
  const loadWishlistCount = useCallback(async () => {
    try {
      const favoriteIds = await favoritesStorage.getIds();
      setWishlistCount(favoriteIds.length);
    } catch (error) {
      console.error('Unable to load wishlist count:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadWishlistCount();
      }
    }, [isAuthenticated, loadWishlistCount]),
  );

  /**
   * Displays a message on the appropriate platform.
   */
  const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      showBrowserAlert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  /**
   * Logout confirmation.
   */
  const handleLogout = () => {
    const message = 'Are you sure you want to logout?';

    if (Platform.OS === 'web') {
      const confirmed = showBrowserConfirm(message);

      if (confirmed) {
        void logout();
      }

      return;
    }

    Alert.alert(
      'Logout',
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            void logout();
          },
        },
      ],
    );
  };

  /**
   * Profile actions.
   * These features are placeholders until their
   * corresponding functionality is implemented.
   */
  const handleEditProfile = () => {
    showMessage(
      'Edit Profile',
      'Profile editing will be implemented in the next development step.',
    );
  };

  const handleOrders = () => {
    showMessage(
      'My Orders',
      'Order history will be implemented in the next development step.',
    );
  };

  const handleAddresses = () => {
    showMessage(
      'Addresses',
      'Address management will be implemented in the next development step.',
    );
  };

  const handlePayment = () => {
    showMessage(
      'Payment Methods',
      'Payment method management will be implemented in the next development step.',
    );
  };

  const handleWishlist = () => {
    router.push('/(app)/(tabs)/favorites');
  };

  /**
   * Navigate to Settings.
   */
  const handleSettings = () => {
    router.push('/(app)/settings');
  };

  /**
   * Authentication check.
   */
  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons
          name="account-lock-outline"
          size={64}
          color={colors.primary}
        />

        <Text style={styles.notLoggedIn}>
          Please log in to view your profile.
        </Text>
      </View>
    );
  }

  const fullName =
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(' ') || user?.username || 'Marketplace User';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user?.image ? (
            <Avatar.Image
              size={86}
              source={{ uri: user.image }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Text
              size={86}
              label={fullName
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
              style={styles.avatar}
              color={colors.onPrimary}
            />
          )}

          <View style={styles.verifiedBadge}>
            <MaterialCommunityIcons
              name="check"
              size={13}
              color="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.nameContainer}>
          <Text style={styles.eyebrow}>
            MY ACCOUNT
          </Text>

          <Text style={styles.name}>
            {fullName}
          </Text>

          <Text style={styles.username}>
            @{user?.username || 'user'}
          </Text>

          <Text style={styles.email}>
            {user?.email || 'No email available'}
          </Text>
        </View>
      </View>

      {/* Profile Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons
            name="package-variant"
            size={22}
            color={colors.primary}
          />

          <Text style={styles.statValue}>
            0
          </Text>

          <Text style={styles.statLabel}>
            Orders
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <MaterialCommunityIcons
            name="cash-multiple"
            size={22}
            color={colors.primary}
          />

          <Text style={styles.statValue}>
            $0.00
          </Text>

          <Text style={styles.statLabel}>
            Spent
          </Text>
        </View>

        <View style={styles.statDivider} />

        <TouchableOpacity
          style={styles.statItem}
          onPress={handleWishlist}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="heart-outline"
            size={22}
            color={colors.primary}
          />

          <Text style={styles.statValue}>
            {wishlistCount}
          </Text>

          <Text style={styles.statLabel}>
            Wishlist
          </Text>
        </TouchableOpacity>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          SHOPPING
        </Text>

        <Card style={styles.menuCard} mode="elevated">
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleOrders}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons
                name="package-variant"
                size={23}
                color={colors.primary}
              />
            </View>

            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>
                My Orders
              </Text>

              <Text style={styles.menuDescription}>
                Track and manage your orders
              </Text>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={23}
              color={colors.onSurfaceVariant}
            />
          </TouchableOpacity>

          <Divider style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleWishlist}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons
                name="heart-outline"
                size={23}
                color={colors.primary}
              />
            </View>

            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>
                Wishlist
              </Text>

              <Text style={styles.menuDescription}>
                Your saved favorite products
              </Text>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={23}
              color={colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </Card>
      </View>

      {/* Account Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          ACCOUNT INFORMATION
        </Text>

        <Card style={styles.menuCard} mode="elevated">
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleEditProfile}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons
                name="account-edit-outline"
                size={23}
                color={colors.primary}
              />
            </View>

            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>
                Edit Profile
              </Text>

              <Text style={styles.menuDescription}>
                Update your personal information
              </Text>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={23}
              color={colors.onSurfaceVariant}
            />
          </TouchableOpacity>

          <Divider style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleAddresses}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={23}
                color={colors.primary}
              />
            </View>

            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>
                Addresses
              </Text>

              <Text style={styles.menuDescription}>
                Manage your delivery addresses
              </Text>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={23}
              color={colors.onSurfaceVariant}
            />
          </TouchableOpacity>

          <Divider style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handlePayment}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons
                name="credit-card-outline"
                size={23}
                color={colors.primary}
              />
            </View>

            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>
                Payment Methods
              </Text>

              <Text style={styles.menuDescription}>
                Manage your payment options
              </Text>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={23}
              color={colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </Card>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          PREFERENCES
        </Text>

        <Card style={styles.menuCard} mode="elevated">
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleSettings}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons
                name="cog-outline"
                size={23}
                color={colors.primary}
              />
            </View>

            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>
                Settings
              </Text>

              <Text style={styles.menuDescription}>
                Appearance, notifications, and preferences
              </Text>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={23}
              color={colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </Card>
      </View>

      {/* Logout */}
      <View style={styles.logoutContainer}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          contentStyle={styles.logoutButtonContent}
          textColor={colors.error}
          icon="logout"
        >
          Logout
        </Button>
      </View>

      {/* App Version */}
      <View style={styles.version}>
        <MaterialCommunityIcons
          name="shopping-outline"
          size={19}
          color={colors.onSurfaceVariant}
        />

        <Text style={styles.versionText}>
          Marketplace v1.0.0
        </Text>

        <Text style={styles.versionSubtext}>
          Your shopping experience, simplified.
        </Text>
      </View>
    </ScrollView>
  );
}
