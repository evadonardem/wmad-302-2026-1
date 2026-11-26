/**
 * Profile Screen - account summary, shortcuts to orders / wishlist / addresses / settings, logout.
 */
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Badge, Button, Card, Divider, List, Text } from 'react-native-paper';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Screen } from '@/components/Screen';
import { APP_VERSION } from '@/constants/config';
import { spacing, useAppTheme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useOrders } from '@/hooks/useOrders';
import { formatCurrency, getInitials } from '@/utils/format';
import { routes } from '@/utils/routes';

export default function ProfileScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const { orders } = useOrders();
  const [confirmLogout, setConfirmLogout] = useState(false);

  if (!user) return null;

  const spent = orders.reduce((sum, order) => sum + order.total, 0);

  const menuItem = (title: string, description: string, icon: string, onPress: () => void, badge?: number) => (
    <List.Item
      title={title}
      description={description}
      onPress={onPress}
      left={(props) => <List.Icon {...props} icon={icon} color={theme.colors.primary} />}
      right={(props) => (
        <View style={styles.right}>
          {badge ? <Badge>{badge}</Badge> : null}
          <List.Icon {...props} icon="chevron-right" />
        </View>
      )}
    />
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {user.image ? (
            <Avatar.Image size={80} source={{ uri: user.image }} />
          ) : (
            <Avatar.Text size={80} label={getInitials(user.firstName, user.lastName)} />
          )}
          <View style={styles.headerText}>
            <Text variant="titleLarge">
              {user.firstName} {user.lastName}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
              @{user.username}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {user.email}
            </Text>
          </View>
        </View>

        <View style={[styles.stats, { backgroundColor: theme.colors.primaryContainer }]}>
          <Stat label="Orders" value={String(orders.length)} />
          <Stat label="Spent" value={formatCurrency(spent)} />
          <Stat label="Wishlist" value={String(wishlistCount)} />
        </View>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
          {menuItem('My orders', 'Track and review your purchases', 'package-variant', () => router.push(routes.orders))}
          <Divider />
          {menuItem('Wishlist', 'Products you saved for later', 'heart', () => router.push(routes.wishlist), wishlistCount)}
          <Divider />
          {menuItem('Addresses', 'Where we deliver your orders', 'map-marker', () => router.push(routes.addresses))}
        </Card>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
          {menuItem('Edit profile', 'Update your name, email and phone', 'account-edit', () => router.push(routes.editProfile))}
          <Divider />
          {menuItem('Settings', 'Notifications and app info', 'cog', () => router.push(routes.settings))}
        </Card>

        <Button mode="outlined" icon="logout" textColor={theme.colors.error} onPress={() => setConfirmLogout(true)} style={[styles.logout, { borderColor: theme.colors.error }]}>
          Log out
        </Button>

        <Text variant="bodySmall" style={[styles.version, { color: theme.colors.onSurfaceVariant }]}>
          Marketplace v{APP_VERSION}
        </Text>
      </ScrollView>

      <ConfirmDialog
        visible={confirmLogout}
        title="Log out?"
        message="You will need to sign in again to see your cart and orders."
        confirmLabel="Log out"
        destructive
        onDismiss={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          void logout();
        }}
      />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.stat}>
      <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: '700' }}>
        {value}
      </Text>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  headerText: { flex: 1, gap: 2 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', borderRadius: 12, paddingVertical: spacing.lg },
  stat: { alignItems: 'center' },
  card: { overflow: 'hidden' },
  right: { flexDirection: 'row', alignItems: 'center' },
  logout: { marginTop: spacing.sm },
  version: { textAlign: 'center' },
});
