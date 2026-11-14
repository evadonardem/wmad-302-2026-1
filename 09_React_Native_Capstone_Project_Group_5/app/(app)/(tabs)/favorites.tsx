/**
 * Favorites Screen - Cookbook
 * Students implement:
 * - Store favorite recipe IDs in AsyncStorage or context
 * - Fetch favorite recipes by IDs (GET /recipes/{id})
 * - Remove from favorites
 * - Add notes to favorites (bonus, not implemented)
 * - Create collections/folders (bonus, not implemented)
 *
 * Done: favorite ids live in FavoritesContext (persisted in AsyncStorage); the recipes
 * are fetched by id (GET /recipes/{id}, cached by the service).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, Share, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Menu, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFavorites } from '@/context/FavoritesContext';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';
import { hasMealType, mealTypesOf, totalTime } from '@/utils/recipeFilters';
import { routes } from '@/utils/routes';
import {
  EmptyState,
  ErrorState,
  IconName,
  menuContentStyle,
  RecipeGridSkeleton,
  Screen,
  Skeleton,
  snackbarStyle,
  useScrollToTopOnNav,
} from '@/components';
import { styles } from './favoritesStyles';
import { MEAL_ICONS, SavedCard, ArcCarousel } from '@/components/FavoritesParts';
import { tc, useAppTheme } from '@/context/ThemeContext';

type SortKey = 'recent' | 'rating' | 'time' | 'name';
const SORTS: { value: SortKey; label: string; icon: IconName }[] = [
  { value: 'recent', label: 'Recently saved', icon: 'clock-outline' },
  { value: 'rating', label: 'Top rated', icon: 'star-outline' },
  { value: 'time', label: 'Quickest', icon: 'timer-outline' },
  { value: 'name', label: 'A to Z', icon: 'sort-alphabetical-ascending' },
];



/* ------------------------------------------------------------------ */
/* Arc carousel                                                        */
/* ------------------------------------------------------------------ */



export default function FavoritesScreen() {
  useAppTheme();
  const gridRef = useRef<FlatList<Recipe>>(null);
  const arcScrollRef = useRef<ScrollView>(null);
  useScrollToTopOnNav(() => {
    gridRef.current?.scrollToOffset({ offset: 0, animated: true });
    arcScrollRef.current?.scrollTo({ y: 0, animated: true });
  });
  const router = useRouter();
  const { width } = useWindowDimensions();
  const columns = width >= 1000 ? 4 : width >= 700 ? 3 : width >= 420 ? 2 : 1;
  const { ids, isLoaded, addFavorite, removeFavorite } = useFavorites();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [lastRemoved, setLastRemoved] = useState<number | null>(null);
  const [meal, setMeal] = useState<string | null>(null); // null = All Recipes
  const [sort, setSort] = useState<SortKey>('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'arc'>('grid');

  const idsKey = ids.join(',');

  // 1. Load favorite IDs from AsyncStorage on mount (done by FavoritesContext)
  // 2. Fetch each recipe by ID (cached by recipeApi)
  // 3. Remove from favorites (handleRemove, with undo)
  // 4. Persist changes to AsyncStorage (done by FavoritesContext)
  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    setError(null);
    Promise.all(ids.map((id) => recipeApi.getRecipeById(id)))
      .then((list) => !cancelled && setRecipes(list))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load favorites'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, isLoaded, reloadKey]);

  const saved = useMemo(() => {
    // newest first (ids are stored in the order they were added)
    const order = new Map(ids.map((id, i) => [id, i]));
    return recipes.filter((r) => order.has(r.id)).sort((a, b) => (order.get(b.id) ?? 0) - (order.get(a.id) ?? 0));
  }, [recipes, ids]);

  // Meal types found in the saved recipes, with counts
  const meals = useMemo(() => {
    const counts = new Map<string, number>();
    saved.forEach((r) => mealTypesOf(r).forEach((m) => counts.set(m, (counts.get(m) ?? 0) + 1)));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [saved]);

  // If the selected meal type has no recipes left (after removing), go back to All
  useEffect(() => {
    if (meal && !meals.some(([m]) => m === meal)) setMeal(null);
  }, [meal, meals]);

  const shown = useMemo(() => {
    const list = meal ? saved.filter((r) => hasMealType(r, meal)) : saved;
    const copy = [...list];
    if (sort === 'rating') copy.sort((a, b) => b.rating - a.rating);
    else if (sort === 'time') copy.sort((a, b) => totalTime(a) - totalTime(b));
    else if (sort === 'name') copy.sort((a, b) => a.name.localeCompare(b.name));
    return copy;
  }, [saved, meal, sort]);

  const handleRemove = (id: number) => {
    removeFavorite(id);
    setLastRemoved(id);
  };

  const handleShare = async () => {
    if (shown.length === 0) return;
    try {
      await Share.share({ message: `My saved recipes:\n${shown.map((r) => `• ${r.name} (${r.cuisine})`).join('\n')}` });
    } catch {
      // Sharing cancelled or unavailable
    }
  };

  const shell = (children: React.ReactNode) => (
    <Screen decor>
      <View style={styles.root}>{children}</View>
    </Screen>
  );

  if (!isLoaded || loading) {
    return shell(
      <View style={styles.listContent}>
        <View style={styles.titleRow}>
          <Skeleton width={220} height={34} />
        </View>
        <View style={styles.skeletonCats}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width={68} height={68} borderRadius={22} />
          ))}
        </View>
        <RecipeGridSkeleton count={columns * 2} columns={columns} />
      </View>
    );
  }

  if (error) {
    return shell(<ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />);
  }

  const currentSort = SORTS.find((s) => s.value === sort) ?? SORTS[0];

  const header = (
    <View>
      {/* Title row */}
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <Text style={styles.title}>Saved Recipes</Text>
          <Text style={styles.count}>
            {saved.length} {saved.length === 1 ? 'recipe' : 'recipes'}
          </Text>
        </View>
        <View style={styles.actions}>
          <View style={styles.viewToggle}>
            {(
              [
                ['grid', 'view-grid-outline', 'Grid view'],
                ['arc', 'view-carousel-outline', 'Carousel view'],
              ] as const
            ).map(([key, icon, label]) => (
              <Pressable
                key={key}
                onPress={() => setView(key)}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: view === key }}
                style={[styles.viewBtn, view === key && styles.viewBtnActive]}
              >
                <MaterialCommunityIcons name={icon} size={20} color={view === key ? '#FFFFFF' : tc('#3C252D')} />
              </Pressable>
            ))}
          </View>
          <Menu
            visible={sortOpen}
            contentStyle={menuContentStyle}
            onDismiss={() => setSortOpen(false)}
            anchor={
              <Pressable onPress={() => setSortOpen(true)} style={styles.sortButton} accessibilityRole="button" accessibilityLabel="Sort">
                <MaterialCommunityIcons name="sort" size={20} color={tc('#3C252D')} />
                <Text style={styles.sortText}>{currentSort.label}</Text>
              </Pressable>
            }
          >
            {SORTS.map((s) => (
              <Menu.Item
                key={s.value}
                title={s.label}
                leadingIcon={s.icon}
                trailingIcon={s.value === sort ? 'check' : undefined}
                onPress={() => {
                  setSort(s.value);
                  setSortOpen(false);
                }}
              />
            ))}
          </Menu>
          <Pressable onPress={handleShare} style={styles.shareButton} accessibilityRole="button" accessibilityLabel="Share saved recipes">
            <MaterialCommunityIcons name="export-variant" size={18} color="#FFFFFF" />
            <Text style={styles.shareText}>Share</Text>
          </Pressable>
        </View>
      </View>

      {/* Meal type filter (icons) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats}>
        <Pressable onPress={() => setMeal(null)} style={styles.cat} accessibilityRole="button" accessibilityState={{ selected: meal === null }}>
          <View style={[styles.catIcon, meal === null && styles.catIconActive]}>
            <MaterialCommunityIcons name="book-open-page-variant-outline" size={30} color={meal === null ? '#D81B60' : tc('#3C252D')} />
          </View>
          <Text style={[styles.catLabel, meal === null && styles.catLabelActive]}>All Recipes</Text>
        </Pressable>
        {meals.map(([name, count]) => {
          const active = meal === name;
          return (
            <Pressable
              key={name}
              onPress={() => setMeal(active ? null : name)}
              style={styles.cat}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${name}, ${count} saved`}
            >
              <View style={[styles.catIcon, active && styles.catIconActive]}>
                <MaterialCommunityIcons name={MEAL_ICONS[name] ?? 'food'} size={30} color={active ? '#D81B60' : tc('#3C252D')} />
                <View style={[styles.catCount, active && styles.catCountActive]}>
                  <Text style={[styles.catCountText, active && styles.catCountTextActive]}>{count}</Text>
                </View>
              </View>
              <Text style={[styles.catLabel, active && styles.catLabelActive]}>{name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return shell(
    <>
      {saved.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="No Favorites Yet"
          message="Tap the heart on any recipe to save it here."
          actionLabel="Browse Recipes"
          onAction={() => router.push(routes.search())}
        />
      ) : view === 'arc' ? (
        <ScrollView ref={arcScrollRef} style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {header}
          {shown.length === 0 ? (
            <Text style={styles.noneText}>No saved recipes in this category.</Text>
          ) : (
            <ArcCarousel
              recipes={shown}
              onOpen={(r) => router.push(routes.recipe(r.id))}
              onRemove={(r) => handleRemove(r.id)}
            />
          )}
        </ScrollView>
      ) : (
        <FlatList
          ref={gridRef}
          key={columns}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={shown}
          numColumns={columns}
          columnWrapperStyle={columns > 1 ? styles.gridRow : undefined}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={header}
          renderItem={({ item }) => (
            <View style={[styles.cell, { width: `${100 / columns}%` }]}>
              <SavedCard
                recipe={item}
                onOpen={() => router.push(routes.recipe(item.id))}
                onRemove={() => handleRemove(item.id)}
              />
            </View>
          )}
          ListEmptyComponent={<Text style={styles.noneText}>No saved recipes in this category.</Text>}
        />
      )}
      <Snackbar
        visible={lastRemoved !== null}
        style={snackbarStyle}
        onDismiss={() => setLastRemoved(null)}
        duration={4000}
        action={{
          label: 'Undo',
          onPress: () => {
            if (lastRemoved !== null) addFavorite(lastRemoved);
          },
        }}
      >
        Removed from favorites
      </Snackbar>
    </>
  );
}