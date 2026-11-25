
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { recipeApi } from '@/services/recipeApi';
import { getRecipeCategories } from '@/services/recipeCategories';
import { Recipe } from '@/types/recipe';
import { Card, Button, List, Avatar, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme, useThemedStyles } from '@/context/AppThemeContext';
import { styles as baseStyles } from './profileStyles';

const FAVORITES_KEY = 'favorite_recipe_ids';
const THEME_KEY = 'profile_theme';

export const profileThemes = {
  citrus: { background: '#F3F8F3', surface: '#FFFFFF', accent: '#168C78', tint: '#E1F3EA', ink: '#183B35' },
  coral: { background: '#FFF6F0', surface: '#FFFFFF', accent: '#E76F51', tint: '#FCE6DB', ink: '#422B28' },
  ocean: { background: '#F1F7FA', surface: '#FFFFFF', accent: '#287A9B', tint: '#DDEFF5', ink: '#1C3541' },
};

export type ProfileThemeName = keyof typeof profileThemes;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { colors: appColors, isDark } = useAppTheme();
  const styles = useThemedStyles(baseStyles);
  const [stats, setStats] = useState({ recipes: 0, favorites: 0, collections: 0 });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [themeName, setThemeName] = useState<ProfileThemeName>('citrus');
  const theme = profileThemes[themeName];
  const accentColor = isDark ? appColors.accent : theme.accent;
  const pageBackground = isDark ? appColors.background : theme.background;
  const surfaceColor = isDark ? appColors.surface : theme.surface;

  const loadProfileData = useCallback(async () => {
    try {
      const [storedFavorites, response, storedTheme] = await Promise.all([
        AsyncStorage.getItem(FAVORITES_KEY),
        recipeApi.getWorldRecipes({ limit: 100 }),
        AsyncStorage.getItem(THEME_KEY),
      ]);
      const recipeData = response.recipes as Recipe[];
      const favorites: unknown = storedFavorites ? JSON.parse(storedFavorites) : [];
      if (!Array.isArray(favorites) || !favorites.every((id) => typeof id === 'number')) {
        throw new Error('Your saved favorites could not be read.');
      }

      setStats({
        recipes: response.total,
        favorites: favorites.length,
        collections: getRecipeCategories(recipeData).length,
      });
      setThemeName(storedTheme && storedTheme in profileThemes ? (storedTheme as ProfileThemeName) : 'citrus');
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load your profile details.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfileData();
    }, [loadProfileData])
  );

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert(
        'Could not log out',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notLoggedIn}>Please log in to view your profile.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: pageBackground }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileCardWidth}>
        <LinearGradient
          colors={['#54E2D2', '#D946A8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCardGradient}
        >
          <Card style={[styles.profileCard, { backgroundColor: surfaceColor }]} elevation={0}>
            <Card.Content style={styles.profileCardContent}>
              <LinearGradient
                colors={['#63E6D8', '#7651D8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
              >
                <View style={styles.headerTopRow}>
                  <Avatar.Image
                    size={76}
                    source={{ uri: user?.image || 'https://dummyjson.com/icon/emilys/128' }}
                    style={styles.avatar}
                  />
                  <View style={styles.nameContainer}>
                    <Text style={styles.eyebrow}>YOUR COOKBOOK</Text>
                    <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                  </View>
                  <MaterialCommunityIcons name="star" size={28} color="#F6C76B" />
                </View>
                <Text style={styles.headerCaption}>A little inspiration for your next delicious day.</Text>
              </LinearGradient>

              {loadError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{loadError}</Text>
                  <Button compact onPress={() => void loadProfileData()} textColor={accentColor}>Retry</Button>
                </View>
              ) : (
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: accentColor }]}>{stats.recipes}</Text>
                    <Text style={styles.statLabel}>Recipes</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: accentColor }]}>{stats.favorites}</Text>
                    <Text style={styles.statLabel}>Favorites</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: accentColor }]}>{stats.collections}</Text>
                    <Text style={styles.statLabel}>Collections</Text>
                  </View>
                </View>
              )}

              <Text style={[styles.sectionHeading, { color: isDark ? appColors.text : theme.ink }]}>YOUR KITCHEN</Text>
              <View style={styles.section}>
                <Card style={[styles.menuCard, { backgroundColor: surfaceColor }]} elevation={1}>
                  <List.Section>
                    <List.Item
                      title="My Recipes"
                      description="Explore the full recipe library"
                      titleStyle={styles.menuTitle}
                      descriptionStyle={styles.menuDescription}
                      left={(props) => <MaterialCommunityIcons name="book-open-page-variant" size={23} color={accentColor} style={props.style} />}
                      right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color={accentColor} style={props.style} />}
                      onPress={() => router.push('/(app)/(tabs)/my-recipes')}
                    />
                    <Divider style={styles.divider} />
                    <List.Item
                      title="My Cookbook"
                      description="Browse your recipe collections"
                      titleStyle={styles.menuTitle}
                      descriptionStyle={styles.menuDescription}
                      left={(props) => <MaterialCommunityIcons name="book-open" size={23} color={accentColor} style={props.style} />}
                      right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color={accentColor} style={props.style} />}
                      onPress={() => router.push('/(app)/(tabs)/cookbook')}
                    />
                    <Divider style={styles.divider} />
                    <List.Item
                      title="Meal Planner"
                      description="Plan your week and build a grocery list"
                      titleStyle={styles.menuTitle}
                      descriptionStyle={styles.menuDescription}
                      left={(props) => <MaterialCommunityIcons name="calendar-month" size={23} color={accentColor} style={props.style} />}
                      right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color={accentColor} style={props.style} />}
                      onPress={() => router.push('/(app)/(tabs)/meal-planner')}
                    />
                    <Divider style={styles.divider} />
                    <List.Item
                      title="Favorites"
                      description={`${stats.favorites} recipes saved for later`}
                      titleStyle={styles.menuTitle}
                      descriptionStyle={styles.menuDescription}
                      left={(props) => <MaterialCommunityIcons name="heart" size={23} color={accentColor} style={props.style} />}
                      right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color={accentColor} style={props.style} />}
                      onPress={() => router.push('/(app)/(tabs)/favorites')}
                    />
                  </List.Section>
                </Card>
              </View>

              <Text style={[styles.sectionHeading, { color: isDark ? appColors.text : theme.ink }]}>ACCOUNT</Text>
              <View style={styles.section}>
                <Card style={[styles.menuCard, { backgroundColor: surfaceColor }]} elevation={1}>
                  <List.Section>
                    <List.Item
                      title="Edit Profile"
                      description="Update your name and email"
                      titleStyle={styles.menuTitle}
                      descriptionStyle={styles.menuDescription}
                      left={(props) => <MaterialCommunityIcons name="account-edit" size={23} color={accentColor} style={props.style} />}
                      right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color={accentColor} style={props.style} />}
                      onPress={() => router.push('/(app)/(tabs)/edit-profile')}
                    />
                    <Divider style={styles.divider} />
                    <List.Item
                      title="Settings"
                      description="Appearance and app preferences"
                      titleStyle={styles.menuTitle}
                      descriptionStyle={styles.menuDescription}
                      left={(props) => <MaterialCommunityIcons name="tune-variant" size={23} color={accentColor} style={props.style} />}
                      right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color={accentColor} style={props.style} />}
                      onPress={() => router.push('/(app)/(tabs)/settings')}
                    />
                  </List.Section>
                </Card>
              </View>

              <Button
                mode="outlined"
                onPress={handleLogout}
                style={styles.logoutButton}
                textColor={accentColor}
                icon="logout"
              >
                Log out
              </Button>
              <Text style={styles.version}>COOKBOOK · MADE WITH A PINCH OF JOY</Text>
            </Card.Content>
          </Card>
        </LinearGradient>
      </View>
    </ScrollView>
  );
}
