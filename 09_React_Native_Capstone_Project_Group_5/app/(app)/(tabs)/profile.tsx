/**
 * Profile Screen - Cookbook
 * Students implement:
 * - Display user info from auth context
 * - Edit profile (PUT /users/{id})
 * - View saved recipes / my recipes
 * - Settings (notifications, etc.)
 * - Logout
 *
 * Done: user info, live stats, menu (My Recipes, Favorites, Edit Profile, Settings) and logout.
 */
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, Button, Card, Dialog, Divider, List, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { recipeApi } from '@/services/recipeApi';
import { routes } from '@/utils/routes';
import { IconName, Screen, Skeleton, useScrollToTopOnNav } from '@/components';
import { styles } from './profileStyles';
import { tc, useAppTheme } from '@/context/ThemeContext';

function MenuItem({
  title,
  description,
  icon,
  onPress,
}: {
  title: string;
  description: string;
  icon: IconName;
  onPress: () => void;
}) {
  useAppTheme();
  return (
    <List.Item
      title={title}
      description={description}
      left={() => <MaterialCommunityIcons name={icon} size={24} color="#E85D04" style={styles.menuIcon} />}
      right={() => <MaterialCommunityIcons name="chevron-right" size={24} color={tc('#8D6E63')} style={styles.menuIcon} />}
      onPress={onPress}
    />
  );
}

export default function ProfileScreen() {
  useAppTheme();
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTopOnNav(() => scrollRef.current?.scrollTo({ y: 0, animated: true }));
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { ids } = useFavorites();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [myRecipeCount, setMyRecipeCount] = useState(0);
  const [statsReady, setStatsReady] = useState(false);
  const [favoriteCuisines, setFavoriteCuisines] = useState(0);

  const userId = user?.id;
  const idsKey = ids.join(',');

  useEffect(() => {
    if (userId === undefined) return;
    recipeApi
      .getAllRecipes()
      .then((all) => {
        setMyRecipeCount(all.filter((r) => r.userId === userId).length);
        setStatsReady(true);
        setFavoriteCuisines(new Set(all.filter((r) => ids.includes(r.id)).map((r) => r.cuisine)).size);
      })
      .catch(() => setStatsReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, idsKey]);

  if (!isAuthenticated || !user) {
    return (
      <Screen decor>
        <View style={styles.centerContainer}>
          <Text style={styles.notLoggedIn}>Please log in to view profile</Text>
        </View>
      </Screen>
    );
  }

  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?';

  return (
    <Screen decor>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.header}>
          {user.image ? (
            <Avatar.Image size={88} source={{ uri: user.image }} style={styles.avatar} />
          ) : (
            <Avatar.Text size={88} label={initials} style={styles.avatar} />
          )}
          <View style={styles.nameContainer}>
            <Text style={styles.name}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={styles.username}>@{user.username}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            {statsReady ? <Text style={styles.statValue}>{myRecipeCount}</Text> : <Skeleton width={34} height={28} />}
            <Text style={styles.statLabel}>Recipes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{ids.length}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statItem}>
            {statsReady ? <Text style={styles.statValue}>{favoriteCuisines}</Text> : <Skeleton width={34} height={28} />}
            <Text style={styles.statLabel}>Cuisines</Text>
          </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.section}>
          <Card style={styles.menuCard} elevation={1}>
            <List.Section>
              <MenuItem
                title="My Recipes"
                description="Recipes you've created"
                icon="book-edit"
                onPress={() => router.push(routes.myRecipes)}
              />
              <Divider style={styles.divider} />
              <MenuItem
                title="Favorites"
                description="Your saved recipes"
                icon="heart"
                onPress={() => router.push(routes.favorites)}
              />
              <Divider style={styles.divider} />
              <MenuItem
                title="Categories"
                description="Browse by meal type"
                icon="shape-outline"
                onPress={() => router.push(routes.categories)}
              />
            </List.Section>
          </Card>
        </View>

        <View style={styles.section}>
          <Card style={styles.menuCard} elevation={1}>
            <List.Section>
              <MenuItem
                title="Edit Profile"
                description="Update your information"
                icon="account-edit"
                onPress={() => router.push(routes.editProfile)}
              />
              <Divider style={styles.divider} />
              <MenuItem
                title="Settings"
                description="Notifications and data"
                icon="cog"
                onPress={() => router.push(routes.settings)}
              />
            </List.Section>
          </Card>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            mode="outlined"
            onPress={() => setConfirmLogout(true)}
            style={styles.logoutButton}
            textColor={tc('#C62828')}
            icon="logout"
          >
            Logout
          </Button>
        </View>

        <View style={styles.version}>
          <Text style={styles.versionText}>Cookbook v1.0.0</Text>
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={confirmLogout} onDismiss={() => setConfirmLogout(false)}>
          <Dialog.Title>Logout</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: tc('#3E2723') }}>Are you sure you want to logout?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmLogout(false)}>Cancel</Button>
            <Button
              textColor={tc('#C62828')}
              onPress={() => {
                setConfirmLogout(false);
                logout();
              }}
            >
              Logout
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Screen>
  );
}