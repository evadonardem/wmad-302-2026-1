/**
 * Home Screen - Cookbook Discover Tab
 *
 * - Greeting that follows the time of day ("Good evening, Emily — what's for dinner?")
 * - Recipe of the day (changes every day)
 * - Shortcuts: shopping list, meal planner, fridge, collections
 * - Horizontal shelves: right for this meal, recently viewed, quick, top rated, easy, desserts
 * - "Surprise me": tap the dice or shake the phone for a random recipe
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useCookbook } from '@/context/CookbookContext';
import { useAllRecipes, totalMinutes } from '@/hooks/useRecipes';
import { useShake } from '@/hooks/useShake';
import { RecipeTile } from '@/components/RecipeTile';
import { RecipeShelf } from '@/components/RecipeShelf';
import { EmptyState, IconName, Skeleton } from '@/components/CommonComponents';
import { useAppTheme } from '@/constants/theme';
import { Recipe } from '@/types/recipe';
import { useHomeStyles } from './homeStyles';

interface Moment {
  greeting: string;
  meal: string;
  mealType: string;
}

/** What to suggest depending on the time of day */
function getMoment(hour: number): Moment {
  if (hour >= 5 && hour < 11) return { greeting: 'Good morning', meal: 'breakfast', mealType: 'Breakfast' };
  if (hour >= 11 && hour < 16) return { greeting: 'Good afternoon', meal: 'lunch', mealType: 'Lunch' };
  if (hour >= 16 && hour < 22) return { greeting: 'Good evening', meal: 'dinner', mealType: 'Dinner' };
  return { greeting: 'Late night cravings', meal: 'a snack', mealType: 'Snack' };
}

const byRating = (a: Recipe, b: Recipe) => b.rating - a.rating;

export default function HomeScreen() {
  const styles = useHomeStyles();
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const { recent, shopping, collections } = useCookbook();
  const { recipes, loading, error, reload, pick } = useAllRecipes();
  const [refreshing, setRefreshing] = useState(false);

  const moment = getMoment(new Date().getHours());

  const shelves = useMemo(() => {
    const forNow = recipes.filter((r) => r.mealType.includes(moment.mealType)).sort(byRating);
    return {
      forNow: forNow.slice(0, 10),
      quick: recipes.filter((r) => totalMinutes(r) <= 30).sort((a, b) => totalMinutes(a) - totalMinutes(b)).slice(0, 10),
      topRated: [...recipes].sort(byRating).slice(0, 10),
      easy: recipes.filter((r) => r.difficulty === 'Easy').sort(byRating).slice(0, 10),
      desserts: recipes.filter((r) => r.mealType.includes('Dessert')).sort(byRating).slice(0, 10),
    };
  }, [recipes, moment.mealType]);

  const categories = useMemo(
    () => Array.from(new Set(recipes.flatMap((recipe) => recipe.mealType))).sort(),
    [recipes]
  );

  // Same recipe all day, a new one tomorrow
  const recipeOfTheDay = useMemo(() => {
    if (recipes.length === 0) return null;
    const day = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    return recipes[day % recipes.length];
  }, [recipes]);

  const recentRecipes = useMemo(() => pick(recent), [pick, recent]);

  const surpriseMe = useCallback(() => {
    if (recipes.length === 0) return;
    const random = recipes[Math.floor(Math.random() * recipes.length)];
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.push(`/recipe/${random.id}`);
  }, [recipes, router]);

  // Shake the phone for a random recipe (only while this tab is showing)
  useShake(surpriseMe, isFocused && recipes.length > 0);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const openCategory = (category: string) => router.push({ pathname: '/search', params: { category } });

  const tools: { label: string; icon: IconName; route: string; badge?: number }[] = [
    { label: 'Shopping list', icon: 'cart-outline', route: '/shopping-list', badge: shopping.filter((i) => !i.checked).length },
    { label: 'Meal plan', icon: 'calendar-week', route: '/meal-plan' },
    { label: 'My fridge', icon: 'fridge-outline', route: '/fridge' },
    { label: 'Collections', icon: 'folder-heart-outline', route: '/collections', badge: collections.length },
  ];

  if (error && recipes.length === 0) {
    return (
      <View style={[styles.scrollView, { paddingTop: insets.top }]}>
        <EmptyState
          emoji="📡"
          title="Can't reach the kitchen"
          message={error}
          actionLabel="Try again"
          onAction={reload}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />
      }
    >
      {/* Greeting */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>
            {moment.greeting}
            {user?.firstName ? `, ${user.firstName}` : ''} 👋
          </Text>
          <Text style={styles.headline}>What's for {moment.meal}?</Text>
        </View>
        <Pressable
          style={styles.diceButton}
          onPress={surpriseMe}
          accessibilityRole="button"
          accessibilityLabel="Surprise me with a random recipe"
        >
          <MaterialCommunityIcons name="dice-5-outline" size={26} color={theme.colors.primary} />
        </Pressable>
      </View>

      {/* Search shortcut */}
      <Pressable style={styles.searchPill} onPress={() => router.push('/search')} accessibilityRole="search">
        <MaterialCommunityIcons name="magnify" size={22} color={theme.colors.muted} />
        <Text style={styles.searchText}>Search recipes, ingredients...</Text>
      </Pressable>

      {/* Kitchen tools */}
      <View style={styles.tools}>
        {tools.map((tool) => (
          <Pressable
            key={tool.label}
            style={styles.tool}
            onPress={() => router.push(tool.route)}
            accessibilityRole="button"
            accessibilityLabel={tool.label}
          >
            <View style={styles.toolIcon}>
              <MaterialCommunityIcons name={tool.icon} size={28} color={theme.colors.primary} />
              {tool.badge ? (
                <View style={styles.toolBadge}>
                  <Text style={styles.toolBadgeText}>{tool.badge > 99 ? '99+' : tool.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.toolLabel} numberOfLines={1}>
              {tool.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Recipe of the day */}
      <View style={styles.section}>
        {loading || !recipeOfTheDay ? (
          <Skeleton height={300} borderRadius={22} />
        ) : (
          <RecipeTile
            recipe={recipeOfTheDay}
            size="hero"
            badge="Recipe of the day"
            onPress={() => router.push(`/recipe/${recipeOfTheDay.id}`)}
          />
        )}
      </View>

      {/* Categories */}
      {categories.length > 0 && (
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <Pressable style={styles.categoryChip} onPress={() => openCategory(item)}>
              <Text style={styles.categoryChipText}>{item}</Text>
            </Pressable>
          )}
        />
      )}

      <RecipeShelf
        title={`Perfect for ${moment.meal}`}
        subtitle={`Top picks for right now`}
        recipes={shelves.forNow}
        loading={loading}
        onSeeAll={() => openCategory(moment.mealType)}
      />
      <RecipeShelf title="Recently viewed" recipes={recentRecipes} />
      <RecipeShelf
        title="Ready in 30 minutes"
        subtitle="Quick wins for busy days"
        recipes={shelves.quick}
        loading={loading}
      />
      <RecipeShelf title="Top rated" subtitle="Loved by everyone" recipes={shelves.topRated} loading={loading} />
      <RecipeShelf title="Easy for beginners" recipes={shelves.easy} loading={loading} />
      <RecipeShelf
        title="Something sweet"
        recipes={shelves.desserts}
        loading={loading}
        onSeeAll={() => openCategory('Dessert')}
      />

      {/* Surprise me */}
      <Pressable style={styles.surpriseCard} onPress={surpriseMe} accessibilityRole="button">
        <Text style={styles.surpriseEmoji}>🎲</Text>
        <View style={styles.surpriseText}>
          <Text style={styles.surpriseTitle}>Can't decide?</Text>
          <Text style={styles.surpriseBody}>Shake your phone or tap here for a random recipe.</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.onPrimaryContainer} />
      </Pressable>
    </ScrollView>
  );
}
