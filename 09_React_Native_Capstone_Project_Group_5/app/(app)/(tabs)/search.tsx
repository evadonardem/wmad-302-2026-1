/**
 * Search Screen - Cookbook
 * Students implement:
 * - Search recipes by query (GET /recipes/search?q=)
 * - Filter by category, cuisine, difficulty
 * - Filter by meal type, prep time (meal type = the Category filter; prep time is not implemented)
 * - Sort by rating, time, calories
 * - Infinite scroll pagination
 *
 * Done: debounced text search plus category, cuisine and difficulty filters,
 * sort options and infinite scroll.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFavorites } from '@/context/FavoritesContext';
import { recipeApi } from '@/services/recipeApi';
import { useDebounce, useInfiniteScroll } from '@/hooks';
import { Category, Difficulty, Recipe, SortOption } from '@/types/recipe';
import { totalTime } from '@/utils/recipeFilters';
import { routes } from '@/utils/routes';
import {
  EmptyState,
  ErrorState,
  IconName,
  RecipeGridSkeleton,
  Screen,
  Skeleton,
  useScrollToTopOnNav,
} from '@/components';
import { FilterSection, SearchFilters } from '@/components/SearchFilters';
import { RecipeResultCard } from '@/components/RecipeResultCard';
import { styles } from './searchStyles';
import { RowTitle, CardRow } from '@/components/SearchParts';
import { tc, useAppTheme } from '@/context/ThemeContext';

const PAGE_SIZE = 10; // 10 at first, "Load more" adds 10 each time
const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const SORTS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Top rated' },
  { value: 'time', label: 'Quickest' },
  { value: 'calories', label: 'Lowest calories' },
];
const SIDEBAR_WIDTH = 300;



export default function SearchScreen() {
  useAppTheme();
  const resultsRef = useRef<FlatList<Recipe>>(null);
  useScrollToTopOnNav(() => resultsRef.current?.scrollToOffset({ offset: 0, animated: true }));
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; cuisine?: string; tag?: string }>();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  // How many cards fit side by side in the results area
  const paneWidth = isWide ? width - SIDEBAR_WIDTH - 64 : width - 32;
  const columns = paneWidth >= 720 ? 3 : paneWidth >= 440 ? 2 : 1;

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [sort, setSort] = useState<SortOption>('relevance');
  const [categories, setCategories] = useState<Category[]>([]);
  const [cuisines, setCuisines] = useState<Category[]>([]);
  const [tags, setTags] = useState<Category[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [showFilters, setShowFilters] = useState(false); // phones: filter groups are hidden until opened

  const debouncedQuery = useDebounce(query.trim(), 400);

  // Category / cuisine / tag passed from Home / Categories screens
  useEffect(() => {
    if (typeof params.category === 'string' && params.category) setCategory(params.category);
  }, [params.category]);
  useEffect(() => {
    if (typeof params.cuisine === 'string' && params.cuisine) setCuisine(params.cuisine);
  }, [params.cuisine]);
  useEffect(() => {
    if (typeof params.tag === 'string' && params.tag) setTag(params.tag);
  }, [params.tag]);

  useEffect(() => {
    recipeApi.getCategories().then(setCategories).catch(() => setCategories([]));
    recipeApi.getCuisineCounts().then(setCuisines).catch(() => setCuisines([]));
    recipeApi.getTagCounts().then(setTags).catch(() => setTags([]));
    recipeApi.getAllRecipes().then(setAllRecipes).catch(() => setAllRecipes([]));
  }, []);

  const resetKey = JSON.stringify({ debouncedQuery, category, cuisine, tag, difficulty, sort });

  const fetchPage = async (page: number, limit: number) => {
    const result = await recipeApi.queryRecipes(
      { q: debouncedQuery, category, cuisine, tag, difficulty, sort },
      { skip: page * limit, limit }
    );
    return { data: result.data, hasMore: result.hasMore, total: result.total };
  };

  const { data, total, loading, loadingMore, hasMore, error, loadMore, retry } = useInfiniteScroll<Recipe>(
    fetchPage,
    PAGE_SIZE,
    resetKey
  );

  const hasFilters = !!(category || cuisine || tag || difficulty || sort !== 'relevance');
  const clearFilters = () => {
    setCategory(null);
    setCuisine(null);
    setTag(null);
    setDifficulty(null);
    setSort('relevance');
    router.setParams({ category: '', cuisine: '', tag: '' });
  };
  const activeCount = [category, cuisine, tag, difficulty].filter(Boolean).length + (sort !== 'relevance' ? 1 : 0);

  const sections: FilterSection[] = [
    {
      key: 'meal',
      title: 'Meal Type',
      icon: 'silverware-fork-knife',
      options: categories.map((c) => ({ value: c.name, label: c.name, count: c.count })),
      selected: category,
      onSelect: setCategory,
    },
    {
      key: 'cuisine',
      title: 'Cuisine',
      icon: 'earth',
      options: cuisines.map((c) => ({ value: c.name, label: c.name, count: c.count })),
      selected: cuisine,
      onSelect: setCuisine,
      collapsedLimit: 8,
    },
    {
      key: 'tag',
      title: 'Tags',
      icon: 'tag-outline',
      options: tags.map((c) => ({ value: c.name, label: c.name, count: c.count })),
      selected: tag,
      onSelect: setTag,
      collapsedLimit: 10,
    },
    {
      key: 'difficulty',
      title: 'Difficulty',
      icon: 'chef-hat',
      options: DIFFICULTIES.map((d) => ({ value: d, label: d })),
      selected: difficulty,
      onSelect: (v) => setDifficulty(v as Difficulty | null),
    },
    {
      key: 'sort',
      title: 'Sort by',
      icon: 'sort',
      options: SORTS.map((s) => ({ value: s.value, label: s.label })),
      selected: sort,
      defaultValue: 'relevance',
      onSelect: (v) => setSort((v ?? 'relevance') as SortOption),
    },
  ];

  // Rows shown while nothing is searched or filtered
  const topRated = useMemo(() => [...allRecipes].sort((a, b) => b.rating - a.rating).slice(0, 8), [allRecipes]);
  const quickEasy = useMemo(
    () =>
      allRecipes
        .filter((r) => r.difficulty === 'Easy')
        .sort((a, b) => totalTime(a) - totalTime(b))
        .slice(0, 8),
    [allRecipes]
  );
  const browsing = !hasFilters && !debouncedQuery;

  const surpriseMe = () => {
    if (allRecipes.length === 0) return;
    const pick = allRecipes[Math.floor(Math.random() * allRecipes.length)];
    router.push(routes.recipe(pick.id));
  };

  const activeChips: { label: string; clear: () => void }[] = [
    category && { label: category, clear: () => setCategory(null) },
    cuisine && { label: cuisine, clear: () => setCuisine(null) },
    tag && { label: `#${tag}`, clear: () => setTag(null) },
    difficulty && { label: difficulty, clear: () => setDifficulty(null) },
    sort !== 'relevance' && {
      label: SORTS.find((s) => s.value === sort)?.label ?? sort,
      clear: () => setSort('relevance'),
    },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const renderRow = (title: string, icon: IconName, list: Recipe[]) =>
    list.length === 0 ? null : (
      <CardRow
        title={title}
        icon={icon}
        items={list}
        columns={columns}
        renderCard={(r) => (
          <RecipeResultCard
            recipe={r}
            onPress={() => router.push(routes.recipe(r.id))}
            isFavorite={isFavorite(r.id)}
            onToggleFavorite={() => toggleFavorite(r.id)}
          />
        )}
      />
    );

  const header = (
    <View>
      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Hungry? Find your next favorite</Text>
          <Text style={styles.bannerSub}>
            Search {allRecipes.length || 50} recipes by ingredient, cuisine, meal type or tag.
          </Text>
          <View style={styles.bannerTags}>
            {['Quick & easy', 'Top rated', 'Every cuisine'].map((t) => (
              <View key={t} style={styles.bannerTag}>
                <Text style={styles.bannerTagText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
        <Pressable onPress={surpriseMe} style={styles.bannerButton} accessibilityRole="button" accessibilityLabel="Surprise me">
          <MaterialCommunityIcons name="dice-multiple-outline" size={20} color={tc('#2B2320')} />
          <Text style={styles.bannerButtonText}>Surprise Me</Text>
        </Pressable>
      </View>

      {browsing && allRecipes.length === 0 && (
        <View style={styles.skeletonRow}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width={290} height={300} borderRadius={24} />
          ))}
        </View>
      )}
      {browsing && renderRow('Top Rated', 'trophy-outline', topRated)}
      {browsing && renderRow('Quick & Easy', 'timer-outline', quickEasy)}

      {/* Results */}
      <RowTitle icon="book-open-page-variant-outline" title={debouncedQuery ? `Results for "${debouncedQuery}"` : hasFilters ? 'Filtered recipes' : 'All Recipes'} />
      <View style={styles.resultsMeta}>
        {total !== undefined && <Text style={styles.resultsCount}>{total} {total === 1 ? 'recipe' : 'recipes'}</Text>}
        {activeChips.map((c) => (
          <Pressable key={c.label} onPress={c.clear} style={styles.activeChip} accessibilityRole="button" accessibilityLabel={`Remove ${c.label}`}>
            <Text style={styles.activeChipText}>{c.label}</Text>
            <MaterialCommunityIcons name="close" size={14} color={tc('#2B2320')} />
          </Pressable>
        ))}
        {hasFilters && (
          <Pressable onPress={clearFilters} accessibilityRole="button">
            <Text style={styles.clearText}>Clear all</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  const results = (
    <FlatList
      ref={resultsRef}
      key={columns}
      style={styles.results}
      contentContainerStyle={styles.listContent}
      data={loading ? [] : data}
      numColumns={columns}
      columnWrapperStyle={columns > 1 ? styles.gridRow : undefined}
      keyExtractor={(item) => item.id.toString()}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      renderItem={({ item }) => (
        <View style={[styles.gridCell, { width: `${100 / columns}%` }]}>
          <RecipeResultCard
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
          <RecipeGridSkeleton count={columns * 2} columns={columns} />
        ) : error ? (
          <ErrorState message={error} onRetry={retry} />
        ) : (
          <EmptyState
            icon="magnify"
            title="No recipes found"
            message="Try a different search term or clear some filters."
            actionLabel={hasFilters ? 'Clear filters' : undefined}
            onAction={hasFilters ? clearFilters : undefined}
          />
        )
      }
      ListFooterComponent={
        !loading && data.length > 0 ? (
          <View style={styles.footer}>
            <Text style={styles.loadMoreInfo}>
              Showing {data.length} of {total ?? data.length} recipes
            </Text>
            {hasMore ? (
              <Pressable
                onPress={loadMore}
                disabled={loadingMore}
                accessibilityRole="button"
                accessibilityLabel="Load more recipes"
                style={({ pressed }) => [styles.loadMoreBtn, (pressed || loadingMore) && styles.loadMorePressed]}
              >
                {loadingMore ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <MaterialCommunityIcons name="chevron-down-circle-outline" size={20} color="#FFFFFF" />
                )}
                <Text style={styles.loadMoreText}>{loadingMore ? 'Loading…' : 'Load more recipes'}</Text>
              </Pressable>
            ) : (
              <Text style={styles.loadMoreInfo}>You&apos;ve reached the end 🍽️</Text>
            )}
          </View>
        ) : null
      }
    />
  );

  if (isWide) {
    const filterProps = {
      query,
      onQueryChange: setQuery,
      sections,
      filterButton: { icon: 'filter-remove-outline' as IconName, label: 'Clear filters', onPress: clearFilters, badge: activeCount },
    };
    return (
      <Screen decor>
        <View style={styles.wideLayout}>
          {/* Left panel: search box on top, filter groups scroll in the middle, summary at the bottom */}
          <View style={styles.sidebar}>
            <View style={styles.sidebarTop}>
              <SearchFilters {...filterProps} part="search" />
            </View>
            <ScrollView style={styles.sidebarScroll} contentContainerStyle={styles.sidebarContent} showsVerticalScrollIndicator={false}>
              <SearchFilters {...filterProps} part="sections" />
            </ScrollView>
            <View style={styles.sidebarFooter}>
              <Text style={styles.sidebarCount}>
                {total !== undefined ? `${total} ${total === 1 ? 'recipe' : 'recipes'}` : ''}
              </Text>
              {hasFilters && (
                <Pressable onPress={clearFilters} accessibilityRole="button">
                  <Text style={styles.clearText}>Clear all</Text>
                </Pressable>
              )}
            </View>
          </View>
          {/* Right: banner, rows and results */}
          <View style={styles.pane}>{results}</View>
        </View>
      </Screen>
    );
  }

  // Phones: the filter groups open as their own page, so they can scroll
  if (showFilters) {
    return (
      <Screen decor>
        <ScrollView contentContainerStyle={styles.narrowFilters} keyboardShouldPersistTaps="handled">
          <SearchFilters
            query={query}
            onQueryChange={setQuery}
            sections={sections}
            filterButton={{ icon: 'chevron-up', label: 'Hide filters', onPress: () => setShowFilters(false), badge: activeCount }}
          />
          <Pressable onPress={() => setShowFilters(false)} style={styles.showResults} accessibilityRole="button">
            <Text style={styles.showResultsText}>
              Show {total !== undefined ? total : ''} {total === 1 ? 'recipe' : 'recipes'}
            </Text>
          </Pressable>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen decor>
      <View style={styles.narrowTop}>
        <SearchFilters
          query={query}
          onQueryChange={setQuery}
          sections={sections}
          showSections={false}
          filterButton={{ icon: 'tune-variant', label: 'Show filters', onPress: () => setShowFilters(true), badge: activeCount }}
        />
      </View>
      <View style={styles.pane}>{results}</View>
    </Screen>
  );
}