/**
 * Profile Screen - Marketplace
 * User info, order/wishlist stats, account menu and logout.
 */
import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter, Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Card, Divider, List } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useActivity } from '@/context/ActivityContext';
import { useSettings } from '@/context/SettingsContext';
import { useThemedStyles } from '@/hooks';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LivelyBackground } from '@/components/LivelyBackground';
import { getOrders } from '@/services/orderService';
import { formatPrice } from '@/utils/format';
import type { IconName } from '@/constants/categories';
import type { TranslationKey } from '@/i18n/translations';
import { makeCommon } from '@/styles/common';
import { makeProfileStyles } from '@/styles/profile';

interface MenuItem {
  title: TranslationKey;
  description: TranslationKey;
  icon: IconName;
  href: Href<string>;
}

const SHOPPING_MENU: MenuItem[] = [
  { title: 'profile.menu.orders', description: 'profile.menu.ordersDesc', icon: 'package-variant', href: '/orders' },
  { title: 'profile.menu.wishlist', description: 'profile.menu.wishlistDesc', icon: 'heart', href: '/wishlist' },
  { title: 'profile.menu.compare', description: 'profile.menu.compareDesc', icon: 'compare-horizontal', href: '/compare' },
  { title: 'profile.menu.addresses', description: 'profile.menu.addressesDesc', icon: 'map-marker', href: '/addresses' },
  { title: 'profile.menu.payments', description: 'profile.menu.paymentsDesc', icon: 'credit-card', href: '/payment-methods' },
];

const FUN_MENU: MenuItem[] = [
  { title: 'profile.menu.rewards', description: 'profile.menu.rewardsDesc', icon: 'star-circle', href: '/rewards' },
  { title: 'profile.menu.advent', description: 'profile.menu.adventDesc', icon: 'calendar-star', href: '/advent' },
  { title: 'profile.menu.giftLists', description: 'profile.menu.giftListsDesc', icon: 'gift', href: '/gift-lists' },
];

const ACCOUNT_MENU: MenuItem[] = [
  { title: 'profile.menu.edit', description: 'profile.menu.editDesc', icon: 'account-edit', href: '/edit-profile' },
  { title: 'profile.menu.settings', description: 'profile.menu.settingsDesc', icon: 'cog', href: '/settings' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { items: wishlist } = useWishlist();
  const { compare } = useActivity();
  const { palette, t } = useSettings();
  const common = useThemedStyles(makeCommon);
  const styles = useThemedStyles(makeProfileStyles);

  const [orderStats, setOrderStats] = useState<{ count: number; spent: number } | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Reload stats whenever the tab gains focus (e.g. after placing an order)
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let active = true;
      getOrders(user.id)
        .then((orders) => {
          if (!active) return;
          setOrderStats({
            count: orders.length,
            spent: orders.reduce((sum, order) => sum + order.grandTotal, 0),
          });
        })
        .catch(() => {
          if (active) setOrderStats(null);
        });
      return () => {
        active = false;
      };
    }, [user])
  );

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    // The (app) layout's auth guard redirects to the login screen
  };

  if (!user) return null;

  const renderMenu = (menu: MenuItem[]) =>
    menu.map((item, index) => (
      <React.Fragment key={item.title}>
        {index > 0 && <Divider style={styles.divider} />}
        <List.Item
          title={t(item.title)}
          description={
            item.href === '/compare' && compare.length > 0 ? `${compare.length}/3 selected` : t(item.description)
          }
          onPress={() => router.push(item.href)}
          left={(props) => (
            <MaterialCommunityIcons name={item.icon} size={24} color={palette.primary} style={props.style} />
          )}
          right={(props) => (
            <MaterialCommunityIcons name="chevron-right" size={24} color={palette.textMuted} style={props.style} />
          )}
        />
      </React.Fragment>
    ));

  return (
    <SafeAreaView style={common.screen} edges={['top']}>
      <LivelyBackground />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {user.image ? (
            <Avatar.Image size={88} source={{ uri: user.image }} style={styles.avatar} />
          ) : (
            <Avatar.Text
              size={88}
              label={`${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`}
              style={styles.avatar}
            />
          )}
          <View style={styles.nameContainer}>
            <Text style={styles.name}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={styles.username}>@{user.username}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>

        {user.isLocalSession && (
          <View style={styles.localNotice}>
            <MaterialCommunityIcons name="information-outline" size={18} color={palette.primary} />
            <Text style={styles.localNoticeText}>
              This account is stored on this device (DummyJSON does not save new sign-ups).
            </Text>
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{orderStats ? orderStats.count : '–'}</Text>
            <Text style={styles.statLabel}>{t('profile.orders')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{orderStats ? formatPrice(orderStats.spent) : '–'}</Text>
            <Text style={styles.statLabel}>{t('profile.spent')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{wishlist.length}</Text>
            <Text style={styles.statLabel}>{t('profile.wishlist')}</Text>
          </View>
        </View>

        <Card style={styles.menuCard} elevation={1}>
          <List.Section style={styles.menuSection}>{renderMenu(SHOPPING_MENU)}</List.Section>
        </Card>

        <Card style={styles.menuCard} elevation={1}>
          <List.Section style={styles.menuSection}>{renderMenu(FUN_MENU)}</List.Section>
        </Card>

        <Card style={styles.menuCard} elevation={1}>
          <List.Section style={styles.menuSection}>{renderMenu(ACCOUNT_MENU)}</List.Section>
        </Card>

        <Button
          mode="outlined"
          onPress={() => setConfirmLogout(true)}
          style={styles.logoutButton}
          contentStyle={common.buttonContent}
          textColor={palette.danger}
          icon="logout"
        >
          {t('profile.logout')}
        </Button>

        <Text style={styles.versionText}>Marketplace v1.0.0</Text>
      </ScrollView>

      <ConfirmDialog
        visible={confirmLogout}
        title={t('profile.logout')}
        message={t('profile.logoutConfirm')}
        confirmLabel={t('profile.logout')}
        destructive
        loading={loggingOut}
        onConfirm={handleLogout}
        onDismiss={() => setConfirmLogout(false)}
      />
    </SafeAreaView>
  );
}
