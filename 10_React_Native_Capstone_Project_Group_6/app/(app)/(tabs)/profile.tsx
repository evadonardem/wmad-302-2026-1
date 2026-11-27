/**
 * Profile Screen - account summary, shortcuts to orders / wishlist / addresses / settings, logout.
 */
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Badge, Button, Card, Divider, List, Text } from 'react-native-paper';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Screen } from '@/components/Screen';
import { useSnackbar } from '@/components/SnackbarProvider';
import { APP_VERSION } from '@/constants/config';
import { spacing, useAppTheme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useOrders } from '@/hooks/useOrders';
import { formatCurrency, getInitials } from '@/utils/format';
import { routes } from '@/utils/routes';

interface MenuItemProps {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
  badge?: number;
}

function MenuItem({ title, description, icon, onPress, badge }: MenuItemProps) {
  const theme = useAppTheme();

  return (
    <List.Item
      title={title}
      description={description}
      onPress={onPress}
      accessibilityRole="button"
      left={(props) => <List.Icon {...props} icon={icon} color={theme.colors.primary} />}
      right={(props) => (
        <View style={styles.right}>
          {badge ? <Badge accessibilityLabel={`${badge} saved`}>{badge}</Badge> : null}
          <List.Icon {...props} icon="chevron-right" />
        </View>
      )}
    />
  );
}

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
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

export default function ProfileScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { show } = useSnackbar();
  const { user, logout } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const { orders } = useOrders();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const spent = useMemo(() => orders.reduce((sum, order) => sum + order.total, 0), [orders]);

  if (!user) return null;

  const handleLogout = async () => {
    setConfirmLogout(false);
    try {
      await logout();
    } catch {
      show('Could not log out. Please try again.');
    }
  };

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
            <Text variant="titleLarge" numberOfLines={2}>
              {user.firstName} {user.lastName}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.primary }} numberOfLines={1}>
              @{user.username}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
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
          <MenuItem
            title="My orders"
            description="Track and review your purchases"
            icon="package-variant"
            onPress={() => router.push(routes.orders)}
          />
          <Divider />
          <MenuItem
            title="Wishlist"
            description="Products you saved for later"
            icon="heart"
            onPress={() => router.push(routes.wishlist)}
            badge={wishlistCount}
          />
          <Divider />
          <MenuItem
            title="Addresses"
            description="Where we deliver your orders"
            icon="map-marker"
            onPress={() => router.push(routes.addresses)}
          />
        </Card>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
          <MenuItem
            title="Edit profile"
            description="Update your name, email and phone"
            icon="account-edit"
            onPress={() => router.push(routes.editProfile)}
          />
          <Divider />
          <MenuItem
            title="Settings"
            description="Notifications and app info"
            icon="cog"
            onPress={() => router.push(routes.settings)}
          />
        </Card>

        <Button
          mode="outlined"
          icon="logout"
          textColor={theme.colors.error}
          onPress={() => setConfirmLogout(true)}
          style={[styles.logout, { borderColor: theme.colors.error }]}
        >
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
        onConfirm={handleLogout}
      />
    </Screen>
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