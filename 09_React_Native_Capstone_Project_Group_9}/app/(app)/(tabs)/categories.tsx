import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from 'react-native-paper';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';
import { getRecipeCategories, getRecipeCategoryImage } from '@/services/recipeCategories';
import { useAppTheme, useThemedStyles } from '@/context/AppThemeContext';
import { styles as baseStyles } from './categoriesStyles';

type CategoryType = 'Meal' | 'Ingredient' | 'Diet' | 'Cuisine';
type CategoryFilter = 'All' | CategoryType;

interface Category {
  name: string;
  count: number;
  type: CategoryType;
}

type CategoryRow =
  | { key: string; kind: 'filters' }
  | { key: string; kind: 'section'; type: CategoryType }
  | { key: string; kind: 'cards'; categories: Category[] }
  | { key: string; kind: 'empty' };

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const filters: CategoryFilter[] = ['All', 'Meal', 'Ingredient', 'Diet', 'Cuisine'];
const sectionOrder: CategoryType[] = ['Meal', 'Ingredient', 'Diet', 'Cuisine'];
const sectionHeadingProps = { accessibilityRole: 'header' as const, 'aria-level': 2 };
const sectionTitles: Record<CategoryType, string> = {
  Meal: 'Meals',
  Ingredient: 'Ingredients',
  Diet: 'Diets & preferences',
  Cuisine: 'Cuisines',
};
const dietCategories = new Set([
  'healthy',
  'quick',
  'vegetarian',
  'vegan',
  'pescatarian',
  'gluten-free',
  'dairy-free',
  'keto',
  'paleo',
  'low-carb',
]);
const mealCategories = new Set([
  'appetizer',
  'beverage',
  'breakfast',
  'brunch',
  'dessert',
  'dinner',
  'drink',
  'lunch',
  'main course',
  'side dish',
  'snack',
  'snacks',
  'supper',
]);
const cuisineAliases: Record<string, string> = {
  china: 'chinese',
  italy: 'italian',
  spain: 'spanish',
  thailand: 'thai',
  'united kingdom': 'british',
  uk: 'british',
};

const categoryIcons: Record<string, IconName> = {
  Beef: 'cow',
  Chicken: 'food-drumstick',
  Dessert: 'cake',
  Pasta: 'noodles',
  Vegetarian: 'leaf',
  Shrimp: 'fish',
  Salad: 'leaf-circle',
  Soup: 'bowl-outline',
  Pizza: 'pizza',
  Italian: 'silverware-fork-knife',
  Asian: 'bowl-mix',
  Baking: 'bread-slice',
  Breakfast: 'silverware-fork-knife',
  Lunch: 'food',
  Dinner: 'silverware-fork-knife',
  Snack: 'cookie',
  Quick: 'timer',
  Healthy: 'heart',
};

function getCategoryType(name: string, recipes: Recipe[]): CategoryType {
  const normalizedName = name.toLowerCase();
  if (
    mealCategories.has(normalizedName)
    || recipes.some((recipe) => recipe.mealType.some((meal) => meal.toLowerCase() === normalizedName))
  ) {
    return 'Meal';
  }
  const cuisineName = cuisineAliases[normalizedName] ?? normalizedName;
  if (recipes.some((recipe) => recipe.cuisine.toLowerCase() === cuisineName)) {
    return 'Cuisine';
  }
  if (dietCategories.has(normalizedName)) return 'Diet';
  return 'Ingredient';
}

function chunkCategories(categories: Category[], columns: number, prefix: string): CategoryRow[] {
  const rows: CategoryRow[] = [];
  for (let index = 0; index < categories.length; index += columns) {
    rows.push({
      key: `${prefix}-${index}`,
      kind: 'cards',
      categories: categories.slice(index, index + columns),
    });
  }
  return rows;
}

function getCategoryRows(
  categories: Category[],
  selectedFilter: CategoryFilter,
  columns: number
): CategoryRow[] {
  const visibleCategories = selectedFilter === 'All'
    ? categories
    : categories.filter((category) => category.type === selectedFilter);

  if (visibleCategories.length === 0) return [{ key: 'empty', kind: 'empty' }];

  if (selectedFilter !== 'All') {
    return chunkCategories(visibleCategories, columns, selectedFilter);
  }

  return sectionOrder.flatMap((type) => {
    const sectionCategories = visibleCategories.filter((category) => category.type === type);
    if (sectionCategories.length === 0) return [];
    return [
      { key: `section-${type}`, kind: 'section' as const, type },
      ...chunkCategories(sectionCategories, columns, type),
    ];
  });
}

interface CategoryCardProps {
  category: Category;
  imageUri?: string;
  width: number;
  height: number;
  reduceMotion: boolean;
  onPress: () => void;
}

function CategoryCard({
  category,
  imageUri,
  width,
  height,
  reduceMotion,
  onPress,
}: CategoryCardProps) {
  const styles = useThemedStyles(baseStyles);
  const [imageFailed, setImageFailed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      style={[
        styles.categoryCard,
        { width, height },
        hovered && !reduceMotion && styles.categoryCardHovered,
        focused && styles.categoryCardFocused,
      ]}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      accessibilityRole="link"
      accessibilityLabel={`${category.name}, ${category.count} ${category.count === 1 ? 'recipe' : 'recipes'}`}
    >
      {imageUri && !imageFailed ? (
        <Image
          source={{ uri: imageUri }}
          style={[styles.categoryImage, hovered && !reduceMotion && styles.categoryImageHovered]}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
          accessible={false}
        />
      ) : (
        <View style={styles.imageFallback}>
          <MaterialCommunityIcons
            name={categoryIcons[category.name] ?? 'food'}
            size={40}
            color="#FFFFFF"
            accessible={false}
          />
        </View>
      )}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.9)']}
        locations={[0, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.cardGradient}
        pointerEvents="none"
      />
      <View style={styles.countPill} pointerEvents="none">
        <Text style={styles.countText}>
          {category.count} {category.count === 1 ? 'recipe' : 'recipes'}
        </Text>
      </View>
      <Text style={styles.categoryName} numberOfLines={2}>
        {category.name}
      </Text>
    </Pressable>
  );
}

export default function CategoriesScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(baseStyles);
  const { width: screenWidth } = useWindowDimensions();
  const columns = screenWidth >= 1024 ? 4 : screenWidth >= 600 ? 3 : 2;
  const horizontalPadding = screenWidth >= 1024 ? 32 : screenWidth >= 600 ? 24 : 16;
  const contentWidth = Math.min(screenWidth, 1200) - horizontalPadding * 2;
  const gap = screenWidth >= 600 ? 16 : 12;
  const cardWidth = (contentWidth - gap * (columns - 1)) / columns;
  const cardHeight = screenWidth >= 1024 ? cardWidth * 0.75 : cardWidth;

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<CategoryFilter>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const loadCategories = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await recipeApi.getWorldRecipes({ limit: 100 });
      const recipes = response.recipes;
      const recipeCategories = getRecipeCategories(recipes).map(({ name, count }) => ({
        name,
        count,
        type: getCategoryType(name, recipes),
      }));
      const imageByCategory: Record<string, string> = {};

      recipeCategories.forEach(({ name }) => {
        const image = getRecipeCategoryImage(recipes, name);
        if (image) imageByCategory[name] = image;
      });

      setCategories(recipeCategories);
      setCategoryImages(imageByCategory);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return categories;
    return categories.filter((category) => category.name.toLowerCase().includes(normalizedQuery));
  }, [categories, query]);

  const rows = useMemo(
    () => [
      { key: 'filters', kind: 'filters' as const },
      ...getCategoryRows(filteredCategories, selectedFilter, columns),
    ],
    [columns, filteredCategories, selectedFilter]
  );

  const renderRow = ({ item }: { item: CategoryRow }) => {
    if (item.kind === 'filters') {
      return (
        <View style={styles.stickyFilterContainer}>
          <View style={[styles.stickyFilterContent, { paddingHorizontal: horizontalPadding }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
              accessibilityLabel="Filter categories by type"
            >
              {filters.map((filter) => {
                const selected = selectedFilter === filter;
                return (
                  <Pressable
                    key={filter}
                    style={[styles.filterChip, selected && styles.filterChipSelected]}
                    onPress={() => setSelectedFilter(filter)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
                      {filter}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      );
    }

    if (item.kind === 'section') {
      return (
        <View style={[styles.sectionHeader, { width: contentWidth, marginHorizontal: horizontalPadding }]}>
          <Text {...sectionHeadingProps} style={styles.sectionTitle}>
            {sectionTitles[item.type]}
          </Text>
        </View>
      );
    }

    if (item.kind === 'empty') {
      return (
        <View style={[styles.emptyContainer, { width: contentWidth }]}>
          <MaterialCommunityIcons name="magnify" size={40} color="#6E5A50" accessible={false} />
          <Text style={styles.emptyText}>
            {query.trim()
              ? `No categories found for "${query.trim()}".`
              : 'No categories match this filter.'}
          </Text>
          <Text style={styles.emptyHint}>Try a different search or filter.</Text>
        </View>
      );
    }

    return (
      <View style={[styles.gridRow, { width: contentWidth, marginHorizontal: horizontalPadding, columnGap: gap }]}>
        {item.categories.map((category) => (
          <CategoryCard
            key={category.name}
            category={category}
            imageUri={categoryImages[category.name]}
            width={cardWidth}
            height={cardHeight}
            reduceMotion={reduceMotion}
            onPress={() => router.push(`/(app)/(tabs)/search?tag=${encodeURIComponent(category.name)}`)}
          />
        ))}
        {item.categories.length < columns &&
          Array.from({ length: columns - item.categories.length }, (_, index) => (
            <View key={`spacer-${index}`} style={{ width: cardWidth }} />
          ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={() => void loadCategories()} buttonColor="#A33F00">
          Try again
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={rows}
        renderItem={renderRow}
        keyExtractor={(item) => item.key}
        stickyHeaderIndices={[1]}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadCategories(true)}
            colors={['#A33F00']}
          />
        }
        ListHeaderComponent={
          <View style={[styles.pageHeader, { paddingHorizontal: horizontalPadding }]}>
            <Text style={styles.pageTitle} accessibilityRole="header">
              Categories
            </Text>
            <Text style={styles.pageSubtitle}>Browse recipes by ingredient and style</Text>
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={22} color={colors.textSecondary} accessible={false} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Search categories"
                placeholderTextColor={colors.muted}
                accessibilityLabel="Search categories"
                returnKeyType="search"
              />
              {query.length > 0 && (
                <Pressable
                  onPress={() => setQuery('')}
                  accessibilityRole="button"
                  accessibilityLabel="Clear category search"
                  style={styles.clearSearchButton}
                >
                  <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>
          </View>
        }
      />
    </View>
  );
}
