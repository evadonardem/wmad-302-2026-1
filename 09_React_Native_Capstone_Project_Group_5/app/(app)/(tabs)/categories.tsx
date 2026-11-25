/**
 * Categories Screen - Cookbook
 * Browse recipes by category
 * Three ways to browse, built from the recipe data: Meal Types, Cuisines and Tags.
 * Tapping a card opens Search pre-filtered to it.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { recipeApi } from '@/services/recipeApi';
import { Category, Recipe } from '@/types/recipe';
import { hasMealType } from '@/utils/recipeFilters';
import { routes } from '@/utils/routes';
import { ErrorState, IconName, Screen, Skeleton, useScrollToTopOnNav } from '@/components';
import { styles } from './categoriesStyles';
import { useAppTheme } from '@/context/ThemeContext';

type Kind = 'meal' | 'cuisine' | 'tag';

const ICONS: Record<string, IconName> = {
  Breakfast: 'food-croissant',
  Lunch: 'food',
  Dinner: 'silverware-fork-knife',
  Dessert: 'cake-variant',
  Snack: 'cookie',
  Snacks: 'cookie',
  Beverage: 'glass-mug-variant',
  Appetizer: 'bowl-mix',
  'Side Dish': 'food-variant',
};

const FALLBACK_ICON: Record<Kind, IconName> = {
  meal: 'food',
  cuisine: 'earth',
  tag: 'tag-outline',
};

const SUBTITLE: Record<Kind, string> = {
  meal: 'Browse recipes by meal type',
  cuisine: 'Browse recipes by cuisine',
  tag: 'Browse recipes by tag',
};

export default function CategoriesScreen() {
  useAppTheme();
  const listRef = useRef<FlatList<Category>>(null);
  useScrollToTopOnNav(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));
  const router = useRouter();
  const { width } = useWindowDimensions();
  const columns = width >= 1000 ? 4 : width >= 768 ? 3 : 2; // wider screens get a wider grid

  const [kind, setKind] = useState<Kind>('meal');
  const [lists, setLists] = useState<Record<Kind, Category[]>>({ meal: [], cuisine: [], tag: [] });
  // One photo per category: the best rated recipe in it
  const [photos, setPhotos] = useState<Record<Kind, Record<string, string>>>({ meal: {}, cuisine: {}, tag: {} });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      if (isRefresh) await recipeApi.getAllRecipes(true);
      // Counts are computed from the cached recipe list, so this is one request in total
      const [meal, cuisine, tag] = await Promise.all([
        recipeApi.getCategories(),
        recipeApi.getCuisineCounts(),
        recipeApi.getTagCounts(),
      ]);
      setLists({ meal, cuisine, tag });
      const all = await recipeApi.getAllRecipes();
      const best = (match: (r: Recipe) => boolean) =>
        all.filter(match).sort((a, b) => b.rating - a.rating)[0]?.image;
      const build = (list: Category[], match: (r: Recipe, name: string) => boolean) =>
        Object.fromEntries(list.map((c) => [c.name, best((r) => match(r, c.name))]).filter(([, img]) => !!img));
      setPhotos({
        meal: build(meal, (r, n) => hasMealType(r, n)),
        cuisine: build(cuisine, (r, n) => r.cuisine === n),
        tag: build(tag, (r, n) => r.tags.includes(n)),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const open = (name: string) => {
    if (kind === 'meal') router.push(routes.search({ category: name }));
    else if (kind === 'cuisine') router.push(routes.search({ cuisine: name }));
    else router.push(routes.search({ tag: name }));
  };

  if (loading) {
    return (
      <Screen decor>
        <View style={styles.container}>
          <Skeleton width={200} height={32} />
          <Skeleton width={260} height={16} style={{ marginTop: 10, marginBottom: 20 }} />
          <Skeleton height={44} borderRadius={22} style={{ marginBottom: 16 }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {Array.from({ length: columns * 3 }, (_, i) => (
              <Skeleton key={i} width={`${100 / columns - 3}%`} height={150} borderRadius={16} />
            ))}
          </View>
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen decor>
        <ErrorState message={error} onRetry={() => load()} />
      </Screen>
    );
  }

  const items = lists[kind];

  return (
    <Screen decor>
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Categories</Text>
        <Text style={styles.pageSubtitle}>{SUBTITLE[kind]}</Text>
        <SegmentedButtons
          value={kind}
          onValueChange={(v) => setKind(v as Kind)}
          style={styles.tabs}
          buttons={[
            { value: 'meal', label: `Meal Types (${lists.meal.length})` },
            { value: 'cuisine', label: `Cuisines (${lists.cuisine.length})` },
            { value: 'tag', label: `Tags (${lists.tag.length})` },
          ]}
        />
        <FlatList
          ref={listRef}
          key={`${kind}-${columns}`}
          data={items}
          numColumns={columns}
          keyExtractor={(item) => item.name}
          columnWrapperStyle={styles.gridWrapper}
          contentContainerStyle={styles.gridContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={['#D81B60']} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => open(item.name)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${item.count} recipes`}
            >
              <View style={styles.tile}>
                {photos[kind][item.name] ? (
                  <Image source={{ uri: photos[kind][item.name] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : null}
                {/* Dark tint keeps the white text readable on any photo */}
                <View style={styles.tileShade} />
                <View style={styles.tileIcon}>
                  <MaterialCommunityIcons name={ICONS[item.name] ?? FALLBACK_ICON[kind]} size={28} color="#D81B60" />
                </View>
                <View>
                  <Text style={styles.tileName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.tileCount}>
                    {item.count} {item.count === 1 ? 'recipe' : 'recipes'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </Screen>
  );
}