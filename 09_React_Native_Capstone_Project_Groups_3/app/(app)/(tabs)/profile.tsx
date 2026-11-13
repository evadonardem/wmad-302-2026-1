/**
 * Profile Screen - Cookbook
 * - Shows the logged-in user from AuthContext
 * - Stats: own recipes, favorites, cuisines among favorites
 * - Links to Edit Profile (PUT /users/{id}), My Recipes and Settings
 * - Logout with a confirmation dialog (Paper Dialog also works on web,
 *   unlike React Native's Alert buttons)
 */
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import {
  Card,
  Button,
  List,
  Avatar,
  Divider,
  Dialog,
  Portal,
  Text as PaperText,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { recipeApi } from '@/services/recipeApi';
import { favoritesStorage } from '@/utils/storage';
import { styles } from './profileStyles';

interface ProfileStats {
  recipes: number;
  favorites: number;
  cuisines: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({ recipes: 0, favorites: 0, cuisines: 0 });
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Reload stats whenever the tab is opened (favorites may have changed)
  const loadStats = useCallback(async () => {
    if (!user) return;
    try {
      const [favoriteIds, allRecipes] = await Promise.all([
        favoritesStorage.getIds(),
        // limit=0 returns every recipe; only fetch the fields we need
        recipeApi.getRecipes({ limit: 0, select: 'userId,cuisine' }),
      ]);
      const favoriteSet = new Set(favoriteIds);
      const favoriteCuisines = new Set(
        allRecipes.recipes.filter((r) => favoriteSet.has(r.id)).map((r) => r.cuisine)
      );
      setStats({
        recipes: allRecipes.recipes.filter((r) => r.userId === user.id).length,
        favorites: favoriteIds.length,
        cuisines: favoriteCuisines.size,
      });
    } catch (err) {
      console.error('Failed to load profile stats:', err);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notLoggedIn}>Please log in to view profile</Text>
      </View>
    );
  }

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || '?';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.header}>
        {user?.image ? (
          <Avatar.Image size={88} source={{ uri: user.image }} style={styles.avatar} />
        ) : (
          <Avatar.Text size={88} label={initials} style={styles.avatar} />
        )}
        <View style={styles.nameContainer}>
          <Text style={styles.name}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.username}>@{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.recipes}</Text>
          <Text style={styles.statLabel}>Recipes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.favorites}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.cuisines}</Text>
          <Text style={styles.statLabel}>Cuisines</Text>
        </View>
      </View>

      {/* Menu Sections */}
      <View style={styles.section}>
        <Card style={styles.menuCard} elevation={1}>
          <List.Section>
            <List.Item
              title="My Recipes"
              description="Recipes you've created"
              left={(props) => (
                <MaterialCommunityIcons name="book-edit" size={24} color="#E85D04" style={props.style} />
              )}
              right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#8D6E63" style={props.style} />}
              onPress={() => router.push('/my-recipes')}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Favorites"
              description="Your saved recipes"
              left={(props) => (
                <MaterialCommunityIcons name="heart" size={24} color="#E85D04" style={props.style} />
              )}
              right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#8D6E63" style={props.style} />}
              onPress={() => router.push('/favorites')}
            />
          </List.Section>
        </Card>
      </View>

      <View style={styles.section}>
        <Card style={styles.menuCard} elevation={1}>
          <List.Section>
            <List.Item
              title="Edit Profile"
              description="Update your information"
              left={(props) => (
                <MaterialCommunityIcons name="account-edit" size={24} color="#E85D04" style={props.style} />
              )}
              right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#8D6E63" style={props.style} />}
              onPress={() => router.push('/edit-profile')}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Settings"
              description="Preferences and data"
              left={(props) => (
                <MaterialCommunityIcons name="cog" size={24} color="#E85D04" style={props.style} />
              )}
              right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#8D6E63" style={props.style} />}
              onPress={() => router.push('/settings')}
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
          contentStyle={styles.logoutButtonContent}
          icon="logout"
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Button>
      </View>

      <View style={styles.version}>
        <Text style={styles.versionText}>Cookbook v1.0.0</Text>
      </View>

      <Portal>
        <Dialog visible={confirmLogout} onDismiss={() => setConfirmLogout(false)}>
          <Dialog.Title>Logout</Dialog.Title>
          <Dialog.Content>
            <PaperText variant="bodyMedium">Are you sure you want to logout?</PaperText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmLogout(false)}>Cancel</Button>
            <Button
              textColor="#C62828"
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
    </ScrollView>
  );
}
