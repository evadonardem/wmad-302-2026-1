/**
 * Home Screen - Cookbook Discover Tab
 * Students implement: Recipe grid, categories, featured recipes
 * API: https://dummyjson.com/docs/recipes
 *
 * Done: paginated recipe feed (infinite scroll), category shortcuts, pull-to-refresh.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IconButton } from 'react-native-paper';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { recipeApi } from '@/services/recipeApi';
// Types for DummyJSON Recipes API
import { Category, Recipe } from '@/types/recipe';
import { getPageNumbers, hasMealType } from '@/utils/recipeFilters';
import { routes } from '@/utils/routes';
import {
  EmptyState,
  ErrorState,
  HeroCarousel,
  IconName,
  RecipeGridCard,
  RecipeGridSkeleton,
  Screen,
  useScrollToTopOnNav,
} from '@/components';
import { HeroSearch } from '@/components/HeroSearch';
import { styles } from './homeStyles';
import { tc, useAppTheme } from '@/context/ThemeContext';

const PAGE_SIZE = 10;

// Left-to-right fade (dark -> clear) laid over the hero photo.
// Web uses a real CSS gradient (perfectly smooth); native stacks many thin slices.
const FADE_STOPS = Array.from({ length: 72 }, (_, i) => {
  const x = i / 71;
  return Number((0.8 * Math.pow(1 - x, 1.6)).toFixed(3));
});

function FadeScrim() {
  if (Platform.OS === 'web') {
    const css =
      'linear-gradient(to right, rgba(20,10,5,0.82) 0%, rgba(20,10,5,0.62) 25%, rgba(20,10,5,0.3) 50%, rgba(20,10,5,0.1) 72%, rgba(20,10,5,0) 100%)';
    return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundImage: css } as object]} />;
  }
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
      {FADE_STOPS.map((alpha, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: `rgba(20,10,5,${alpha})` }} />
      ))}
    </View>
  );
}

const ICONS: Record<string, IconName> = {
  Breakfast: 'food-croissant',
  Lunch: 'food',
  Dinner: 'silverware-fork-knife',
  Dessert: 'cake-variant',
  Snack: 'cookie',
  Beverage: 'glass-mug-variant',
  Appetizer: 'bowl-mix',
  'Side Dish': 'food-variant',
};

export default function HomeScreen() {
  const { dark, toggle } = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string | null>(null); // null = "All Types"

  // 1 column on phones, 2 on tablets, 3 on desktop
  const columns = width >= 760 ? 3 : width >= 460 ? 2 : 1;
  const wide = width >= 700;
  // The dish name sits in the banner's corner only when the screen is wide enough to not touch the search box;
  // otherwise it moves into a chip under the search box.
  const cornerCaption = width >= 1100;

  // Numbered pages, 10 recipes each
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Recipe[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const listRef = useRef<FlatList<Recipe>>(null);
  useScrollToTopOnNav(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    recipeApi
      .queryRecipes({ category: selected }, { skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setData(result.data);
        setTotal(result.total);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load recipes'))
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected, page, reloadKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  /** Changes page and jumps back to the top so the new page starts at its first recipe. */
  const goToPage = (next: number) => {
    const target = Math.min(totalPages, Math.max(1, next));
    if (target === page) return;
    setPage(target);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const selectCategory = (name: string | null) => {
    setSelected(name);
    setPage(1);
  };

  useEffect(() => {
    recipeApi
      .getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // Photos for the hero carousel: random recipes from the selected category (or from all of them)
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  useEffect(() => {
    recipeApi
      .getAllRecipes()
      .then(setAllRecipes)
      .catch(() => setAllRecipes([]));
  }, []);

  // Recipe whose photo is showing in the hero (phones show its name under the search box)
  const [heroCurrent, setHeroCurrent] = useState<Recipe | null>(null);

  const heroRecipes = useMemo(() => {
    const pool = selected ? allRecipes.filter((r) => hasMealType(r, selected)) : allRecipes;
    return [...pool].sort(() => Math.random() - 0.5).slice(0, 6);
  }, [allRecipes, selected]);

  const header = (
    <View>
      {/* Hero banner: the photo carousel fills the whole card, the text sits on a smooth dark fade */}
      <View style={[styles.hero, !cornerCaption && styles.heroNarrow]}>
        {/* Clipped layer (rounded corners); the search dropdown below is NOT clipped */}
        <View pointerEvents="box-none" style={styles.heroClip}>
          <HeroCarousel
            recipes={heroRecipes}
            onPressRecipe={(r) => router.push(routes.recipe(r.id))}
            style={StyleSheet.absoluteFill}
            showCaption={cornerCaption}
            onChange={setHeroCurrent}
          />
          {wide ? <FadeScrim /> : <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.scrimFlat]} />}
        </View>
        <IconButton
          icon={dark ? 'white-balance-sunny' : 'weather-night'}
          iconColor={tc('#3E2723')}
          containerColor={tc('rgba(255,255,255,0.94)', 'containerColor')}
          size={20}
          onPress={toggle}
          style={styles.themeToggle}
          accessibilityLabel={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        />
        <View pointerEvents="box-none" style={styles.heroText}>
          <Text style={styles.heroGreeting}>
            {user ? `Welcome back, ${user.firstName}!` : 'Welcome to Cookbook!'}
          </Text>
          <Text style={[styles.heroTitle, wide && styles.heroTitleWide]}>
            Explore{'\n'}
            <Text style={styles.heroAccent}>Delicious</Text> Recipes
          </Text>
          <HeroSearch />
          {!cornerCaption && heroCurrent && (
            <TouchableOpacity
              onPress={() => router.push(routes.recipe(heroCurrent.id))}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Open recipe ${heroCurrent.name}`}
              style={styles.heroDish}
            >
              <MaterialCommunityIcons name="silverware-fork-knife" size={18} color="#FFA726" />
              <View style={styles.heroDishText}>
                <Text style={styles.heroDishName} numberOfLines={1}>
                  {heroCurrent.name}
                </Text>
                <Text style={styles.heroDishSub} numberOfLines={1}>
                  {heroCurrent.cuisine} · ⭐ {heroCurrent.rating.toFixed(1)}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <Text style={styles.cookTitle}>
        What to <Text style={styles.cookAccent}>Cook</Text>?
      </Text>
      <View style={styles.pillRow}>
        <TouchableOpacity
          style={[styles.pill, selected === null && styles.pillSelected]}
          onPress={() => selectCategory(null)}
          accessibilityRole="button"
          accessibilityState={{ selected: selected === null }}
        >
          <MaterialCommunityIcons name="silverware-fork-knife" size={16} color={selected === null ? '#FFFFFF' : '#E85D04'} />
          <Text style={[styles.pillText, selected === null && styles.pillTextSelected]}>All Types</Text>
        </TouchableOpacity>
        {categories.map((c) => {
          const active = selected === c.name;
          return (
            <TouchableOpacity
              key={c.name}
              style={[styles.pill, active && styles.pillSelected]}
              onPress={() => selectCategory(active ? null : c.name)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <MaterialCommunityIcons name={ICONS[c.name] ?? 'food'} size={16} color={active ? '#FFFFFF' : '#E85D04'} />
              <Text style={[styles.pillText, active && styles.pillTextSelected]}>{c.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  if (error && data.length === 0) {
    return (
      <Screen decor>
        <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      </Screen>
    );
  }

  const pageNumbers = getPageNumbers(page, totalPages);
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(total, page * PAGE_SIZE);

  return (
    <Screen decor>
      <FlatList
        ref={listRef}
        key={columns}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={loading ? [] : data}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.gridRow : undefined}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.gridCell, { width: `${100 / columns}%` }]}>
            <RecipeGridCard
              recipe={item}
              onPress={() => router.push(routes.recipe(item.id))}
              isFavorite={isFavorite(item.id)}
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          loading ? (
            <RecipeGridSkeleton count={Math.min(PAGE_SIZE, columns * 2)} columns={columns} />
          ) : (
            <EmptyState icon="food-off" title="No recipes found" message="Try another category." />
          )
        }
        ListFooterComponent={
          total > 0 ? (
            <View style={styles.pager}>
              <Text style={styles.pagerInfo}>
                Showing {from}–{to} of {total} recipes
              </Text>
              <View style={styles.pagerRow}>
                <TouchableOpacity
                  onPress={() => goToPage(page - 1)}
                  disabled={page === 1 || loading}
                  accessibilityRole="button"
                  accessibilityLabel="Previous page"
                  style={[styles.pageBtn, (page === 1 || loading) && styles.pageBtnOff]}
                >
                  <MaterialCommunityIcons name="chevron-left" size={22} color={tc('#3E2723')} />
                </TouchableOpacity>
                {pageNumbers.map((p, i) =>
                  p === '…' ? (
                    <Text key={`gap-${i}`} style={styles.pageGap}>
                      …
                    </Text>
                  ) : (
                    <TouchableOpacity
                      key={p}
                      onPress={() => goToPage(p)}
                      disabled={loading}
                      accessibilityRole="button"
                      accessibilityLabel={`Page ${p}`}
                      accessibilityState={{ selected: p === page }}
                      style={[styles.pageBtn, p === page && styles.pageBtnActive]}
                    >
                      <Text style={[styles.pageText, p === page && styles.pageTextActive]}>{p}</Text>
                    </TouchableOpacity>
                  )
                )}
                <TouchableOpacity
                  onPress={() => goToPage(page + 1)}
                  disabled={page === totalPages || loading}
                  accessibilityRole="button"
                  accessibilityLabel="Next page"
                  style={[styles.pageBtn, (page === totalPages || loading) && styles.pageBtnOff]}
                >
                  <MaterialCommunityIcons name="chevron-right" size={22} color={tc('#3E2723')} />
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setReloadKey((k) => k + 1);
            }}
            colors={['#E85D04']}
          />
        }
      />
    </Screen>
  );
}