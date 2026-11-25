
/**
 * Profile Screen - CartlyX
 *
 * Features:
 * - Displays signed-in user information.
 * - Shows actual order count and total spending.
 * - Displays the user's wishlist count.
 * - Navigates to My Orders and Wishlist.
 * - Navigates to Edit Profile.
 * - Navigates to Contact Information management.
 * - Navigates to Shipping Address management.
 * - Navigates to Payment Methods management.
 * - Supports dynamic light and dark themes.
 * - Refreshes profile statistics whenever the screen is focused.
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

import {
  favoritesStorage,
  ordersStorage,
} from '@/utils/storage';

import { createProfileStyles } from '../../../appStyles/profileStyles';

type MenuRowProps = {
  icon: React.ComponentProps<
    typeof MaterialCommunityIcons
  >['name'];
  title: string;
  description: string;
  onPress: () => void;
  styles: ReturnType<typeof createProfileStyles>;
  color: string;
  divider?: boolean;
};

function MenuRow({
  icon,
  title,
  description,
  onPress,
  styles,
  color,
  divider = false,
}: MenuRowProps) {
  return (
    <>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.menuIconContainer}>
          <MaterialCommunityIcons
            name={icon}
            size={23}
            color={color}
          />
        </View>

        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>
            {title}
          </Text>

          <Text style={styles.menuDescription}>
            {description}
          </Text>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={23}
          color={color}
        />
      </TouchableOpacity>

      {divider && (
        <Divider style={styles.divider} />
      )}
    </>
  );
}

/**
 * Browser-compatible confirmation helper.
 */
const showBrowserConfirm = (message: string): boolean => {
  const browser = globalThis as typeof globalThis & {
    confirm?: (message: string) => boolean;
  };

  return browser.confirm ? browser.confirm(message) : false;
};

export default function ProfileScreen() {
  const { user, logout, isAuthenticated } = useAuth();

  const theme = useTheme<MD3Theme>();
  const colors = theme.colors;
  const styles = createProfileStyles(colors);

  const [wishlistCount, setWishlistCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  /**
   * Load wishlist and order statistics.
   */
  const loadProfileStatistics = useCallback(async () => {
    if (!user) {
      setWishlistCount(0);
      setOrderCount(0);
      setTotalSpent(0);
      return;
    }

    try {
      const [favoriteIds, savedOrders] = await Promise.all([
        favoritesStorage.getIds(),
        ordersStorage.getUserOrders(user.id),
      ]);

      setWishlistCount(favoriteIds.length);
      setOrderCount(savedOrders.length);

      const spent = savedOrders.reduce(
        (sum, order) => sum + order.total,
        0,
      );

      setTotalSpent(spent);
    } catch (error) {
      console.error(
        'Unable to load profile statistics:',
        error,
      );
    }
  }, [user]);

  /**
   * Refresh statistics whenever Profile receives focus.
   */
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        void loadProfileStatistics();
      } else {
        setWishlistCount(0);
        setOrderCount(0);
        setTotalSpent(0);
      }
    }, [isAuthenticated, loadProfileStatistics]),
  );

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
   * Navigate to Edit Profile.
   */
  const handleEditProfile = () => {
    router.push('/(app)/edit-profile');
  };

  /**
   * Navigate to My Orders.
   */
  const handleOrders = () => {
    router.push('/(app)/my-orders');
  };

  /**
   * Navigate to Contact Information.
   */
  const handleContactInformation = () => {
    router.push('/(app)/contact-information');
  };

  /**
   * Navigate to Shipping Address.
   */
  const handleShippingAddress = () => {
    router.push('/(app)/shipping-address');
  };

  /**
   * Navigate to Payment Methods.
   */
  const handlePayment = () => {
    router.push('/(app)/payment-methods');
  };

  /**
   * Navigate to Wishlist.
   */
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
      .join(' ') ||
    user?.username ||
    'Marketplace User';

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
        <TouchableOpacity
          style={styles.statItem}
          onPress={handleOrders}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="package-variant"
            size={22}
            color={colors.primary}
          />

          <Text style={styles.statValue}>
            {orderCount}
          </Text>

          <Text style={styles.statLabel}>
            Orders
          </Text>
        </TouchableOpacity>

        <View style={styles.statDivider} />

        <TouchableOpacity
          style={styles.statItem}
          onPress={handleOrders}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="cash-multiple"
            size={22}
            color={colors.primary}
          />

          <Text style={styles.statValue}>
            ${totalSpent.toFixed(2)}
          </Text>

          <Text style={styles.statLabel}>
            Spent
          </Text>
        </TouchableOpacity>

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

      {/* Shopping Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          SHOPPING
        </Text>

        <Card style={styles.menuCard} mode="elevated">
          <MenuRow
            icon="package-variant"
            title="My Orders"
            description="Track and manage your orders"
            onPress={handleOrders}
            styles={styles}
            color={colors.primary}
            divider
          />

          <MenuRow
            icon="heart-outline"
            title="Wishlist"
            description="Your saved favorite products"
            onPress={handleWishlist}
            styles={styles}
            color={colors.primary}
          />
        </Card>
      </View>

      {/* Account Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          ACCOUNT INFORMATION
        </Text>

        <Card style={styles.menuCard} mode="elevated">
          <MenuRow
            icon="account-edit-outline"
            title="Edit Profile"
            description="Update your personal information"
            onPress={handleEditProfile}
            styles={styles}
            color={colors.primary}
            divider
          />

          <MenuRow
            icon="account-box-outline"
            title="My Contact Information"
            description="Manage your name, email, and phone number"
            onPress={handleContactInformation}
            styles={styles}
            color={colors.primary}
            divider
          />

          <MenuRow
            icon="map-marker-outline"
            title="My Shipping Address"
            description="Manage your delivery address"
            onPress={handleShippingAddress}
            styles={styles}
            color={colors.primary}
            divider
          />

          <MenuRow
            icon="credit-card-outline"
            title="Payment Methods"
            description="Manage your payment options"
            onPress={handlePayment}
            styles={styles}
            color={colors.primary}
          />
        </Card>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          PREFERENCES
        </Text>

        <Card style={styles.menuCard} mode="elevated">
          <MenuRow
            icon="cog-outline"
            title="Settings"
            description="Appearance, notifications, and preferences"
            onPress={handleSettings}
            styles={styles}
            color={colors.primary}
          />
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
          CartlyX v1.0.0
        </Text>

        <Text style={styles.versionSubtext}>
          Your shopping experience, simplified.
        </Text>
      </View>
    </ScrollView>
  );
}
