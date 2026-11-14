import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Menu } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';
import { useAppTheme, useThemedStyles } from '@/context/AppThemeContext';
import { styles as baseStyles } from './favoritesStyles';

const FAVORITES_KEY = 'favorite_recipe_ids';
const UNDO_DURATION_MS = 5000;

type SortOption = 'recent' | 'rating' | 'time';

const sortLabels: Record<SortOption, string> = {
  recent: 'Recently added',
  rating: 'Rating',
  time: 'Cooking time',
};

async function getFavoriteIds(): Promise<number[]> {
  const stored = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!stored) return [];

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed) || !parsed.every((id) => Number.isInteger(id))) {
    throw new Error('Saved favorites are invalid. Clear app storage and try again.');
  }
  return parsed as number[];
}

interface FavoriteCardProps {
  recipe: Recipe;
  width: number;
  compact: boolean;
  pendingRemoval: boolean;
  reduceMotion: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}

function FavoriteCard({
  recipe,
  width,
  compact,
  pendingRemoval,
  reduceMotion,
  onPress,
  onToggleFavorite,
}: FavoriteCardProps) {
  const styles = useThemedStyles(baseStyles);
  const [imageFailed, setImageFailed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
  const hasTimeAndRating = Number.isFinite(totalTime)
    && totalTime > 0
    && Number.isFinite(recipe.rating)
    && recipe.rating > 0;

  return (
    <View
      style={[
        styles.cardShell,
        { width },
        compact && styles.cardShellCompact,
        hovered && !reduceMotion && styles.cardShellHovered,
        focused && styles.cardShellFocused,
      ]}
    >
      <Pressable
        style={[styles.cardLink, compact ? styles.cardLinkCompact : styles.cardLinkGrid]}
        onPress={onPress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityRole="link"
        accessibilityLabel={`View ${recipe.name} recipe`}
      >
        {imageFailed ? (
          <View style={[styles.imageFallback, compact ? styles.imageFallbackCompact : styles.imageFallbackGrid]}>
            <MaterialCommunityIcons name="food" size={34} color="#7B5B4D" accessible={false} />
          </View>
        ) : (
          <Image
            source={{ uri: recipe.image }}
            style={[
              styles.recipeImage,
              compact ? styles.recipeImageCompact : styles.recipeImageGrid,
              hovered && !reduceMotion && styles.recipeImageHovered,
            ]}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
            accessible={false}
          />
        )}
        <View style={[styles.info, compact && styles.infoCompact]}>
          <Text style={styles.title} numberOfLines={2}>{recipe.name}</Text>
          <View style={styles.meta}>
            <View style={styles.difficultyPill}>
              <Text style={styles.pillText}>{recipe.difficulty}</Text>
            </View>
            <View style={styles.cuisinePill}>
              <Text style={styles.pillText} numberOfLines={1}>{recipe.cuisine}</Text>
            </View>
          </View>
          {hasTimeAndRating && (
            <View style={styles.details}>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="clock-outline" size={15} color="#55443C" accessible={false} />
                <Text style={styles.detailText}>{totalTime} min</Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="star" size={15} color="#8A4B08" accessible={false} />
                <Text style={styles.detailText}>{recipe.rating.toFixed(1)}</Text>
              </View>
            </View>
          )}
        </View>
      </Pressable>
      <Pressable
        style={[styles.favoriteButton, compact ? styles.favoriteButtonCompact : styles.favoriteButtonGrid]}
        onPress={onToggleFavorite}
        accessibilityRole="button"
        accessibilityLabel={pendingRemoval
          ? `Undo removing ${recipe.name} from favorites`
          : `Remove ${recipe.name} from favorites`}
        accessibilityState={{ selected: !pendingRemoval }}
      >
        <MaterialCommunityIcons
          name={pendingRemoval ? 'heart-outline' : 'heart'}
          size={23}
          color="#B42318"
          accessible={false}
        />
      </Pressable>
    </View>
  );
}

export default function FavoritesScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(baseStyles);
  const { width: screenWidth } = useWindowDimensions();
  const columns = screenWidth >= 1024 ? 3 : screenWidth >= 640 ? 2 : 1;
  const compact = columns === 1;
  const horizontalPadding = screenWidth >= 1024 ? 32 : screenWidth >= 640 ? 24 : 16;
  const contentWidth = Math.max(0, Math.min(screenWidth, 1200) - horizontalPadding * 2);
  const gap = 16;
  const cardWidth = (contentWidth - gap * (columns - 1)) / columns;
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [query, setQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<Recipe | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const pendingRemovalRef = useRef<Recipe | null>(null);
  const removalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ids = await getFavoriteIds();
      const recipes = await Promise.all(ids.map((id) => recipeApi.getRecipeById(id)));
      setFavorites(recipes.reverse());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load favorites.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadFavorites();
    }, [loadFavorites])
  );

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const persistRemoval = useCallback(async (recipeId: number) => {
    try {
      const ids = await getFavoriteIds();
      const nextIds = ids.filter((id) => id !== recipeId);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(nextIds));
      setFavorites((current) => current.filter((recipe) => recipe.id !== recipeId));
      setActionError(null);
    } catch (removeError) {
      setActionError(
        removeError instanceof Error ? removeError.message : 'Could not remove favorite. Please try again.'
      );
    }
  }, []);

  const undoRemoval = () => {
    if (removalTimerRef.current) clearTimeout(removalTimerRef.current);
    removalTimerRef.current = null;
    pendingRemovalRef.current = null;
    setPendingRemoval(null);
  };

  const removeFavorite = (recipe: Recipe) => {
    if (pendingRemovalRef.current?.id === recipe.id) {
      undoRemoval();
      return;
    }

    const previousPending = pendingRemovalRef.current;
    if (previousPending) {
      if (removalTimerRef.current) clearTimeout(removalTimerRef.current);
      void persistRemoval(previousPending.id);
    }

    pendingRemovalRef.current = recipe;
    setPendingRemoval(recipe);
    setActionError(null);
    removalTimerRef.current = setTimeout(() => {
      if (pendingRemovalRef.current?.id !== recipe.id) return;
      pendingRemovalRef.current = null;
      removalTimerRef.current = null;
      setPendingRemoval(null);
      void persistRemoval(recipe.id);
    }, UNDO_DURATION_MS);
  };

  const visibleFavorites = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = favorites.filter((recipe) => (
      !normalizedQuery
      || recipe.name.toLowerCase().includes(normalizedQuery)
      || recipe.cuisine.toLowerCase().includes(normalizedQuery)
      || recipe.difficulty.toLowerCase().includes(normalizedQuery)
    ));
    const originalOrder = new Map(favorites.map((recipe, index) => [recipe.id, index]));

    if (sortOption === 'rating') {
      return matches.sort((first, second) =>
        (second.rating || 0) - (first.rating || 0)
        || (originalOrder.get(first.id) ?? 0) - (originalOrder.get(second.id) ?? 0)
      );
    }

    if (sortOption === 'time') {
      const cookingTime = (recipe: Recipe) => {
        const total = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
        return total > 0 ? total : Number.POSITIVE_INFINITY;
      };
      return matches.sort((first, second) =>
        cookingTime(first) - cookingTime(second)
        || (originalOrder.get(first.id) ?? 0) - (originalOrder.get(second.id) ?? 0)
      );
    }

    return matches;
  }, [favorites, query, sortOption]);

  const renderFavorite = ({ item }: { item: Recipe }) => (
    <FavoriteCard
      recipe={item}
      width={cardWidth}
      compact={compact}
      pendingRemoval={pendingRemoval?.id === item.id}
      reduceMotion={reduceMotion}
      onPress={() => router.push(`/(app)/recipe/${item.id}`)}
      onToggleFavorite={() => removeFavorite(item)}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>{error}</Text>
        <Pressable onPress={() => void loadFavorites()} style={styles.browseButton} accessibilityRole="button">
          <Text style={styles.browseButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        key={columns}
        data={visibleFavorites}
        renderItem={renderFavorite}
        keyExtractor={(item) => item.id.toString()}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? [styles.gridRow, { paddingHorizontal: horizontalPadding }] : undefined}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={columns * 4}
        maxToRenderPerBatch={columns * 4}
        windowSize={5}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={[styles.pageHeader, { paddingHorizontal: horizontalPadding }]}>
            <Text style={styles.pageTitle} accessibilityRole="header" aria-level={1}>
              Your Favorites
            </Text>
            <Text style={styles.pageSubtitle}>{favorites.length} saved {favorites.length === 1 ? 'recipe' : 'recipes'}</Text>
            <View style={styles.controls}>
              <View style={styles.searchContainer}>
                <MaterialCommunityIcons name="magnify" size={21} color={colors.textSecondary} accessible={false} />
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search favorites"
                  placeholderTextColor={colors.muted}
                  accessibilityLabel="Search favorites"
                  returnKeyType="search"
                />
                {query.length > 0 && (
                  <Pressable
                    onPress={() => setQuery('')}
                    style={styles.clearSearchButton}
                    accessibilityRole="button"
                    accessibilityLabel="Clear favorites search"
                  >
                    <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
                  </Pressable>
                )}
              </View>
              <Menu
                visible={sortMenuVisible}
                onDismiss={() => setSortMenuVisible(false)}
                anchor={
                  <Pressable
                    style={styles.sortButton}
                    onPress={() => setSortMenuVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel={`Sort favorites. Current order: ${sortLabels[sortOption]}`}
                    accessibilityState={{ expanded: sortMenuVisible }}
                  >
                    <MaterialCommunityIcons name="sort" size={19} color={colors.textSecondary} accessible={false} />
                    <Text style={styles.sortButtonText}>{sortLabels[sortOption]}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={18} color={colors.textSecondary} accessible={false} />
                  </Pressable>
                }
              >
                {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                  <Menu.Item
                    key={option}
                    title={sortLabels[option]}
                    leadingIcon={sortOption === option ? 'check' : undefined}
                    onPress={() => {
                      setSortOption(option);
                      setSortMenuVisible(false);
                    }}
                  />
                ))}
              </Menu>
            </View>
            {actionError && (
              <Text style={styles.actionError} accessibilityRole="alert">
                {actionError}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name={favorites.length === 0 ? 'heart-outline' : 'magnify'} size={64} color={colors.muted} accessible={false} />
            <Text style={styles.emptyTitle}>
              {favorites.length === 0 ? 'No favorites yet' : 'No favorites match your search'}
            </Text>
            <Text style={styles.emptyText}>
              {favorites.length === 0
                ? 'Save recipes you love and they will show up here.'
                : 'Try a different search term or clear your search.'}
            </Text>
            {favorites.length === 0 ? (
              <Pressable
                onPress={() => router.push('/(app)/(tabs)/search')}
                style={styles.browseButton}
                accessibilityRole="button"
              >
                <Text style={styles.browseButtonText}>Browse recipes</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => setQuery('')} style={styles.clearQueryButton} accessibilityRole="button">
                <Text style={styles.clearQueryText}>Clear search</Text>
              </Pressable>
            )}
          </View>
        }
      />
      {pendingRemoval && (
        <View style={styles.snackbar} accessibilityLiveRegion="polite" aria-live="polite">
          <Text style={styles.snackbarText}>Removed from favorites.</Text>
          <Pressable
            onPress={undoRemoval}
            style={styles.undoButton}
            accessibilityRole="button"
            accessibilityLabel="Undo removing favorite"
          >
            <Text style={styles.undoText}>Undo</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}