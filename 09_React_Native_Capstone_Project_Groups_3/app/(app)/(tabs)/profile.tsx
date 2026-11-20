/**
 * Profile Screen - Cookbook
 * - Your info, with initials when there is no photo
 * - Stats: favorites, recipes cooked, cooking streak (days in a row)
 * - Your kitchen: shopping list, meal planner, collections, fridge, my recipes
 * - Recently cooked history
 * - Edit profile, settings, logout (Paper dialog, also works on web)
 */
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Button, Dialog, Portal, Text as PaperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useCookbook } from '@/context/CookbookContext';
import { useAllRecipes } from '@/hooks/useRecipes';
import { IconName } from '@/components/CommonComponents';
import { useAppTheme } from '@/constants/theme';
import { cookingStreak } from '@/utils/cookingStats';
import { useProfileStyles } from './profileStyles';

interface MenuItem {
  title: string;
  description: string;
  icon: IconName;
  route: string;
}

export default function ProfileScreen() {
  const styles = useProfileStyles();
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, isAuthenticated } = useAuth();
  const { favorites, cooked, shopping, collections, mealPlan } = useCookbook();
  const { byId } = useAllRecipes();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const streak = cookingStreak(cooked);
  const plannedCount = Object.values(mealPlan).reduce((sum, day) => sum + day.length, 0);
  const toBuy = shopping.filter((item) => !item.checked).length;

  // Last 5 cooking sessions, newest first
  const recentlyCooked = useMemo(
    () =>
      [...cooked]
        .sort((a, b) => b.cookedAt - a.cookedAt)
        .slice(0, 5)
        .map((entry) => ({ ...entry, recipe: byId.get(entry.recipeId) }))
        .filter((entry) => entry.recipe),
    [cooked, byId]
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notLoggedIn}>Please log in to view profile</Text>
      </View>
    );
  }

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || '?';

  const kitchen: MenuItem[] = [
    { title: 'Shopping list', description: toBuy ? `${toBuy} items to buy` : 'Nothing to buy', icon: 'cart-outline', route: '/shopping-list' },
    { title: 'Meal planner', description: plannedCount ? `${plannedCount} meals this week` : 'Plan your week', icon: 'calendar-week', route: '/meal-plan' },
    { title: 'Collections', description: `${collections.length} folder${collections.length === 1 ? '' : 's'}`, icon: 'folder-heart-outline', route: '/collections' },
    { title: "What's in my fridge?", description: 'Cook with what you have', icon: 'fridge-outline', route: '/fridge' },
    { title: 'My Recipes', description: "Recipes you've created", icon: 'book-edit', route: '/my-recipes' },
  ];
  const account: MenuItem[] = [
    { title: 'Edit Profile', description: 'Name and email', icon: 'account-edit', route: '/edit-profile' },
    { title: 'Settings', description: 'Appearance, data and more', icon: 'cog', route: '/settings' },
  ];

  const renderMenu = (items: MenuItem[]) => (
    <View style={styles.menuCard}>
      {items.map((item, index) => (
        <Pressable
          key={item.title}
          style={[styles.menuRow, index < items.length - 1 && styles.menuRowBorder]}
          onPress={() => router.push(item.route)}
          accessibilityRole="button"
        >
          <View style={styles.menuIcon}>
            <MaterialCommunityIcons name={item.icon} size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuDescription}>{item.description}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.muted} />
        </Pressable>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}>
      {/* Profile Header */}
      <View style={styles.header}>
        {user?.image ? (
          <Avatar.Image size={84} source={{ uri: user.image }} style={styles.avatar} />
        ) : (
          <Avatar.Text size={84} label={initials} style={styles.avatar} />
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
          <Text style={styles.statValue}>{favorites.length}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{cooked.length}</Text>
          <Text style={styles.statLabel}>Cooked</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {streak}
            {streak > 0 ? ' 🔥' : ''}
          </Text>
          <Text style={styles.statLabel}>Day streak</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Your kitchen</Text>
      {renderMenu(kitchen)}

      {/* Cooking history */}
      <Text style={styles.sectionTitle}>Recently cooked</Text>
      {recentlyCooked.length === 0 ? (
        <View style={styles.historyEmpty}>
          <Text style={styles.historyEmptyText}>
            Open a recipe and tap “I cooked this” to start your cooking history and streak.
          </Text>
        </View>
      ) : (
        <View style={styles.menuCard}>
          {recentlyCooked.map((entry, index) => (
            <Pressable
              key={`${entry.recipeId}-${entry.cookedAt}`}
              style={[styles.menuRow, index < recentlyCooked.length - 1 && styles.menuRowBorder]}
              onPress={() => router.push(`/recipe/${entry.recipeId}`)}
            >
              <Image source={{ uri: entry.recipe?.image }} style={styles.historyThumb} />
              <View style={styles.menuText}>
                <Text style={styles.menuTitle} numberOfLines={1}>
                  {entry.recipe?.name}
                </Text>
                <Text style={styles.menuDescription}>{new Date(entry.cookedAt).toLocaleDateString()}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Account</Text>
      {renderMenu(account)}

      {/* Logout Button */}
      <Button
        mode="outlined"
        onPress={() => setConfirmLogout(true)}
        style={styles.logoutButton}
        contentStyle={styles.logoutButtonContent}
        textColor={theme.colors.error}
        icon="logout"
      >
        Logout
      </Button>

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
              textColor={theme.colors.error}
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
