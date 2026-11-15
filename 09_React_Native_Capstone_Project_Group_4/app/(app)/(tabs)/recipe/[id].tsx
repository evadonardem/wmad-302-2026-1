/**
 * Recipe Detail Screen
 * Features: Full-width looping fade-in same-product & multi-style dish backdrop,
 * circular dish showcase, overlapping white summary card with tags,
 * Nutrition & Macros breakdown cards, interactive checkable ingredient tiles,
 * and step-by-step instruction cards
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  Animated,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { recipeApi } from '@/services/recipeApi';
import { useFavorites } from '@/context/FavoritesContext';
import { Recipe } from '@/types/recipe';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AnimatedCardWrapper, AnimatedHeartButton } from '@/components/AnimatedComponents';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';
const CONTENT_MAX_WIDTH = 760;
const INGREDIENT_ACCENTS = ['#FFF3E0', '#E8F5E9', '#E3F2FD', '#FCE4EC', '#F3E5F5', '#FFFDE7'];

interface NutritionBreakdown {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  fiberGrams: number;
  sugarGrams: number;
}

interface BackdropStyleSlide {
  uri: string;
  zoom: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Estimates per-serving macronutrients based on caloriesPerServing, ingredients & meal type
 */
function estimateNutrition(recipe: Recipe): NutritionBreakdown {
  const cal = recipe.caloriesPerServing || 350;
  const text = `${recipe.name} ${recipe.ingredients.join(' ')} ${(recipe.tags || []).join(' ')}`.toLowerCase();

  const isHighProtein =
    text.includes('chicken') ||
    text.includes('beef') ||
    text.includes('steak') ||
    text.includes('shrimp') ||
    text.includes('salmon') ||
    text.includes('egg') ||
    text.includes('tofu');

  const isDessertOrSweet =
    text.includes('cookie') ||
    text.includes('cake') ||
    text.includes('chocolate') ||
    text.includes('smoothie') ||
    text.includes('lassi') ||
    recipe.mealType?.some((m) => m.toLowerCase() === 'dessert');

  const proteinRatio = isHighProtein ? 0.28 : isDessertOrSweet ? 0.08 : 0.18;
  const carbsRatio = isDessertOrSweet ? 0.58 : isHighProtein ? 0.42 : 0.52;
  const fatsRatio = Math.max(0.18, 1 - proteinRatio - carbsRatio);

  const proteinGrams = Math.max(4, Math.round((cal * proteinRatio) / 4));
  const carbsGrams = Math.max(8, Math.round((cal * carbsRatio) / 4));
  const fatsGrams = Math.max(3, Math.round((cal * fatsRatio) / 9));
  const fiberGrams = Math.max(2, Math.round(carbsGrams * 0.14));
  const sugarGrams = isDessertOrSweet
    ? Math.max(8, Math.round(carbsGrams * 0.45))
    : Math.max(2, Math.round(carbsGrams * 0.12));

  return {
    calories: cal,
    proteinGrams,
    carbsGrams,
    fatsGrams,
    fiberGrams,
    sugarGrams,
  };
}

/**
 * Builds strictly same-product variations & different plating/camera styles for the hero backdrop
 */
function buildSameProductBackdropSlides(recipe: Recipe, allRecipes: Recipe[]): BackdropStyleSlide[] {
  const coreKeywords = [
    'chicken',
    'pizza',
    'pasta',
    'alfredo',
    'spaghetti',
    'scampi',
    'salad',
    'cookies',
    'cookie',
    'biryani',
    'karahi',
    'stir-fry',
    'tacos',
    'burger',
    'soup',
    'ramen',
    'curry',
    'steak',
    'beef',
    'shrimp',
    'salmon',
    'pancake',
    'cake',
    'smoothie',
    'lassi',
  ];

  const lowerName = recipe.name.toLowerCase();
  const matchedProductKeys = coreKeywords.filter((kw) => lowerName.includes(kw));

  const ignoredWords = new Set(['with', 'and', 'the', 'style', 'classic', 'fresh', 'homemade']);
  const specificWords =
    matchedProductKeys.length > 0
      ? matchedProductKeys
      : lowerName
          .split(/[\s-]+/)
          .filter((w) => w.length > 3 && !ignoredWords.has(w));

  const sameProductRecipes = allRecipes.filter((other) => {
    if (other.id === recipe.id) return false;
    const otherLower = other.name.toLowerCase();
    return specificWords.some((kw) => otherLower.includes(kw));
  });

  const slides: BackdropStyleSlide[] = [
    { uri: recipe.image, zoom: 1.08, offsetX: 0, offsetY: 0 },
    { uri: recipe.image, zoom: 1.32, offsetX: -18, offsetY: -10 },
  ];

  sameProductRecipes.slice(0, 3).forEach((rel) => {
    slides.push({
      uri: rel.image,
      zoom: 1.12,
      offsetX: 0,
      offsetY: 0,
    });
  });

  slides.push({ uri: recipe.image, zoom: 1.28, offsetX: 18, offsetY: 10 });

  return slides;
}

/**
 * Full-width looping fade-in slideshow of the SAME product in different styles/angles
 */
function SameDishBackdropSlideshow({
  slides,
  fallbackImage,
}: {
  slides: BackdropStyleSlide[];
  fallbackImage: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const prevIndexRef = useRef<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1.04)).current;

  useEffect(() => {
    prevIndexRef.current = null;
    setActiveIndex(0);
  }, [slides]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => {
        prevIndexRef.current = current;
        return (current + 1) % slides.length;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    if (prevIndexRef.current === null) return;

    fadeAnim.setValue(0.15);
    scaleAnim.setValue(1.14);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 950,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.02,
        duration: 2900,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [activeIndex, fadeAnim, scaleAnim]);

  const currentSlide = slides[activeIndex % slides.length] || {
    uri: fallbackImage,
    zoom: 1.08,
    offsetX: 0,
    offsetY: 0,
  };
  const previousSlide =
    prevIndexRef.current !== null ? slides[prevIndexRef.current % slides.length] : null;

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#2C1E16' }]} />

      {previousSlide && (
        <Image
          source={{ uri: previousSlide.uri }}
          style={[
            StyleSheet.absoluteFill,
            {
              width: '100%',
              height: '100%',
              opacity: 0.78,
              transform: [
                { scale: previousSlide.zoom },
                { translateX: previousSlide.offsetX },
                { translateY: previousSlide.offsetY },
              ],
            },
          ]}
          resizeMode="cover"
        />
      )}

      <Animated.Image
        source={{ uri: currentSlide.uri }}
        style={[
          StyleSheet.absoluteFill,
          {
            width: '100%',
            height: '100%',
            opacity: fadeAnim,
            transform: [
              { scale: Animated.multiply(scaleAnim, currentSlide.zoom) },
              { translateX: currentSlide.offsetX },
              { translateY: currentSlide.offsetY },
            ],
          },
        ]}
        resizeMode="cover"
      />

      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(28, 19, 14, 0.48)' },
        ]}
      />
    </View>
  );
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { width } = useWindowDimensions();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const fetchRecipe = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [data, listData] = await Promise.all([
        recipeApi.getRecipeById(Number(id)),
        recipeApi.getRecipes({ limit: 50, skip: 0 }),
      ]);
      setRecipe(data);
      setAllRecipes(listData.recipes || []);
      setCheckedIngredients({});
      setCompletedSteps({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  const nutrition = useMemo(() => (recipe ? estimateNutrition(recipe) : null), [recipe]);

  const backdropSlides = useMemo(() => {
    if (!recipe) return [];
    return buildSameProductBackdropSlides(recipe, allRecipes);
  }, [recipe, allRecipes]);

  const toggleIngredient = (idx: number) => {
    setCheckedIngredients((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleShare = async () => {
    if (!recipe) return;
    try {
      await Share.share({
        title: recipe.name,
        message: `Check out this ${recipe.cuisine} recipe: ${recipe.name} (${recipe.caloriesPerServing} kcal per serving)!`,
      });
    } catch {
      // Ignore share cancel
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF7F4' }}>
        <ActivityIndicator size="large" color="#E85D04" />
        <Text style={{ marginTop: 12, color: '#6D4C41', fontWeight: '600' }}>
          Loading recipe details...
        </Text>
      </View>
    );
  }

  if (error || !recipe || !nutrition) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#FAF7F4' }}>
        <Text style={{ fontSize: 16, color: '#C62828', marginBottom: 14, textAlign: 'center' }}>
          {error || 'Recipe not found'}
        </Text>
        <Button mode="contained" buttonColor="#E85D04" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }

  const favorited = isFavorite(recipe.id);
  const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
  const containerWidth = Math.min(width - 32, CONTENT_MAX_WIDTH);
  const dishSize = width >= 768 ? 220 : 190;

  const macroItems = [
    {
      label: 'Calories',
      value: `${nutrition.calories}`,
      unit: 'kcal',
      icon: 'fire' as const,
      bg: '#FFF3E0',
      border: '#FFE0B2',
      accent: '#E85D04',
    },
    {
      label: 'Protein',
      value: `${nutrition.proteinGrams}`,
      unit: 'g',
      icon: 'arm-flex' as const,
      bg: '#E8F5E9',
      border: '#C8E6C9',
      accent: '#2E7D32',
    },
    {
      label: 'Carbs',
      value: `${nutrition.carbsGrams}`,
      unit: 'g',
      icon: 'barley' as const,
      bg: '#FFF8E1',
      border: '#FFECB3',
      accent: '#F57F17',
    },
    {
      label: 'Fats',
      value: `${nutrition.fatsGrams}`,
      unit: 'g',
      icon: 'water' as const,
      bg: '#E3F2FD',
      border: '#BBDEFB',
      accent: '#1565C0',
    },
    {
      label: 'Fiber',
      value: `${nutrition.fiberGrams}`,
      unit: 'g',
      icon: 'leaf' as const,
      bg: '#F3E5F5',
      border: '#E1BEE7',
      accent: '#7B1FA2',
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FAF7F4' }}
      contentContainerStyle={{ paddingBottom: 44 }}
    >
      {/* Hero Header with Full-Width Looping Same-Product & Multi-Style Backdrop */}
      <View
        style={{
          paddingTop: 16,
          paddingBottom: 70,
          alignItems: 'center',
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#2C1E16',
        }}
      >
        <SameDishBackdropSlideshow
          slides={backdropSlides}
          fallbackImage={recipe.image}
        />

        {/* Top Navigation Row */}
        <View
          style={{
            width: '100%',
            maxWidth: 860,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            marginBottom: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="chevron-left" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <View
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
              {recipe.cuisine} Cuisine
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={handleShare}
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="share-variant" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 14,
              }}
            >
              <AnimatedHeartButton
                isFavorite={favorited}
                onPress={() => toggleFavorite(recipe)}
                size={20}
              />
            </View>
          </View>
        </View>

        {/* Centered Circular Dish Showcase */}
        <AnimatedCardWrapper index={0}>
          <View
            style={{
              width: dishSize,
              height: dishSize,
              borderRadius: dishSize / 2,
              borderWidth: 6,
              borderColor: 'rgba(255, 255, 255, 0.25)',
              overflow: 'hidden',
              backgroundColor: '#2C1E16',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.35,
              shadowRadius: 18,
              elevation: 8,
            }}
          >
            <Image
              source={{ uri: recipe.image }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
        </AnimatedCardWrapper>
      </View>

      {/* Main Centered Content Container */}
      <View
        style={{
          width: containerWidth,
          alignSelf: 'center',
        }}
      >
        {/* Overlapping Floating White Summary Card */}
        <AnimatedCardWrapper index={1}>
          <View
            style={{
              marginTop: -46,
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 20,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#EFE7DF',
              shadowColor: '#2B1B12',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 5,
              marginBottom: 22,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: '800',
                color: '#1F1A17',
                textAlign: 'center',
                marginBottom: 4,
              }}
            >
              {recipe.name}
            </Text>

            <Text style={{ fontSize: 13, color: '#8C7E74', marginBottom: 12 }}>
              {recipe.ingredients.length} ingredients ·{' '}
              <Text style={{ color: '#F59E0B', fontWeight: '700' }}>★ {recipe.rating.toFixed(1)}</Text>{' '}
              ({recipe.reviewCount} reviews) · {recipe.difficulty}
            </Text>

            {/* Dish Tags */}
            {recipe.tags && recipe.tags.length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 6,
                  marginBottom: 14,
                }}
              >
                {recipe.tags.map((tag) => (
                  <View
                    key={tag}
                    style={{
                      backgroundColor: '#FFF5EB',
                      borderWidth: 1,
                      borderColor: '#FAD7B8',
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#D95300' }}>
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Time, Calories & Servings Row */}
            <View
              style={{
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-around',
                paddingTop: 14,
                borderTopWidth: 1,
                borderTopColor: '#F3ECE4',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="clock-outline" size={18} color="#E85D04" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#3E2723' }}>
                  {totalTime} min
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="fire" size={18} color="#E85D04" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#3E2723' }}>
                  {recipe.caloriesPerServing} kcal
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="silverware-fork-knife" size={18} color="#E85D04" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#3E2723' }}>
                  {recipe.servings} serve
                </Text>
              </View>
            </View>
          </View>
        </AnimatedCardWrapper>

        {/* Nutrition & Macros Breakdown */}
        <View style={{ marginBottom: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1F1A17' }}>
              Nutrition & Macros
            </Text>
            <Text style={{ fontSize: 12, color: '#8C7E74', fontWeight: '600' }}>
              Per 1 serving ({nutrition.sugarGrams}g sugar)
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            {macroItems.map((macro) => (
              <View
                key={macro.label}
                style={{
                  flexGrow: 1,
                  minWidth: width >= 768 ? 120 : 96,
                  backgroundColor: macro.bg,
                  borderWidth: 1,
                  borderColor: macro.border,
                  borderRadius: 16,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 6,
                  }}
                >
                  <MaterialCommunityIcons name={macro.icon} size={17} color={macro.accent} />
                </View>

                <Text style={{ fontSize: 16, fontWeight: '800', color: '#1F1A17' }}>
                  {macro.value}
                  <Text style={{ fontSize: 11, fontWeight: '700', color: macro.accent }}>
                    {' '}
                    {macro.unit}
                  </Text>
                </Text>

                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: macro.accent,
                    marginTop: 2,
                  }}
                >
                  {macro.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Horizontal Ingredient Tiles */}
        <View style={{ marginBottom: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1F1A17' }}>
              Ingredients ({recipe.ingredients.length})
            </Text>
            <Text style={{ fontSize: 12, color: '#8C7E74' }}>Tap to check off</Text>
          </View>

          <FlatList
            data={recipe.ingredients}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, idx) => `ing-tile-${idx}`}
            renderItem={({ item, index }) => {
              const checked = !!checkedIngredients[index];
              const tileBg = INGREDIENT_ACCENTS[index % INGREDIENT_ACCENTS.length];
              return (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => toggleIngredient(index)}
                  style={{
                    width: 112,
                    backgroundColor: checked ? '#E8F5E9' : '#FFFFFF',
                    borderRadius: 18,
                    padding: 12,
                    marginRight: 10,
                    borderWidth: 1,
                    borderColor: checked ? '#81C784' : '#EFE7DF',
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      backgroundColor: checked ? '#2E7D32' : tileBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={checked ? 'check' : 'food-variant'}
                      size={21}
                      color={checked ? '#FFFFFF' : '#E85D04'}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: checked ? '#2E7D32' : '#1F1A17',
                      textAlign: 'center',
                      textDecorationLine: checked ? 'line-through' : 'none',
                    }}
                    numberOfLines={2}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Cooking Instruction Step Cards */}
        <View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1F1A17' }}>
              Cooking instruction
            </Text>
            <Text style={{ fontSize: 12, color: '#8C7E74' }}>Tap step when done</Text>
          </View>

          {recipe.instructions.map((step, index) => {
            const done = !!completedSteps[index];
            return (
              <AnimatedCardWrapper key={`step-${index}`} index={index}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => toggleStep(index)}
                  style={{
                    backgroundColor: done ? '#F3ECE4' : '#FFF5EB',
                    borderRadius: 18,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: done ? '#D7CCC8' : '#F7E3CE',
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '800',
                        color: done ? '#8C7E74' : '#E85D04',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      Step {index + 1}
                    </Text>
                    {done && (
                      <MaterialCommunityIcons name="check-circle" size={18} color="#2E7D32" />
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      lineHeight: 22,
                      color: done ? '#8C7E74' : '#2B1B12',
                      textDecorationLine: done ? 'line-through' : 'none',
                    }}
                  >
                    {step}
                  </Text>
                </TouchableOpacity>
              </AnimatedCardWrapper>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}