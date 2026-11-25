import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { recipeApi } from '@/services/recipeApi';
import { getRecipeCategories } from '@/services/recipeCategories';
import { FloatingRecipePhotos } from '@/components/FloatingRecipePhotos';
import { Card, Title, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Recipe } from '@/types/recipe';
import { useAppTheme, useThemedStyles } from '@/context/AppThemeContext';
import { styles as baseStyles } from './homeStyles';

const actionGradient = ['#F98961', '#E85D04'] as const;
const categoryGradient = ['#00A896', '#00796B'] as const;
const heroGradient = ['#24312D', '#34453E'] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(baseStyles);
  const { width: screenWidth } = useWindowDimensions();
  const backgroundDrift = useRef(new Animated.Value(0)).current;
  const [fontsLoaded, fontError] = useFonts({
    Sail: require('../../../assets/fonts/Sail-Regular.ttf'),
  });
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [nextHeroImageIndex, setNextHeroImageIndex] = useState<number | null>(null);
  const heroImageOpacity = useRef(new Animated.Value(0)).current;
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const heroImage = recipes.length > 0
    ? recipes[heroImageIndex % recipes.length]
    : undefined;
  const nextHeroImage = nextHeroImageIndex === null || recipes.length === 0
    ? undefined
    : recipes[nextHeroImageIndex % recipes.length];

  const fetchRecipes = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const data = await recipeApi.getWorldRecipes({ limit: 100 });
      setRecipes(data.recipes);
      setCategories(getRecipeCategories(data.recipes).map(({ name }) => name));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundDrift, {
          toValue: 1,
          duration: 18000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(backgroundDrift, {
          toValue: 0,
          duration: 18000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [backgroundDrift]);

  useEffect(() => {
    if (recipes.length < 2) return;

    let active = true;
    const timer = setTimeout(() => {
      const nextIndex = (heroImageIndex + 1) % recipes.length;
      setNextHeroImageIndex(nextIndex);
      heroImageOpacity.setValue(0);
      Animated.timing(heroImageOpacity, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!active || !finished) return;
        setHeroImageIndex(nextIndex);
        setNextHeroImageIndex(null);
      });
    }, 6500);

    return () => {
      active = false;
      clearTimeout(timer);
      heroImageOpacity.stopAnimation();
    };
  }, [recipes.length, heroImageIndex, heroImageOpacity]);

  const onRefresh = () => fetchRecipes(true);
  const isWide = screenWidth >= 760;
  const horizontalPadding = screenWidth >= 900 ? 28 : screenWidth >= 600 ? 24 : 16;
  const contentWidth = Math.min(screenWidth, 1200) - horizontalPadding * 2;
  const columns = screenWidth >= 1150 ? 4 : screenWidth >= 850 ? 3 : screenWidth >= 560 ? 2 : 1;
  const cardGap = 16;
  const cardWidth = (contentWidth - (columns - 1) * cardGap) / columns;
  const internationalFeatured = recipes
    .filter((recipe) => recipe.id < 0)
    .filter((recipe, index, list) => list.findIndex((entry) => entry.cuisine === recipe.cuisine) === index)
    .slice(0, 5);
  const featuredRecipes = [
    ...recipes.filter((recipe) => recipe.id > 0).sort((first, second) => second.rating - first.rating).slice(0, 5),
    ...internationalFeatured,
  ];

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={[styles.recipeCard, { width: cardWidth }]}
      onPress={() => router.push(`/(app)/recipe/${item.id}`)}
      activeOpacity={0.8}
    >
      <Card style={styles.card} elevation={2}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.recipeImage} resizeMode="cover" />
        </View>
        <Card.Content style={styles.cardContent}>
          <Title style={styles.recipeTitle} numberOfLines={1}>
            {item.name}
          </Title>
          <View style={styles.recipeMetaRow}>
            <Text style={styles.ratingText} numberOfLines={1}>
              {item.rating > 0 ? `⭐ ${item.rating.toFixed(1)} · ${item.reviewCount} reviews` : 'Traditional dish'}
            </Text>
            <Text style={styles.cuisineText} numberOfLines={1}>{item.cuisine}</Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (fontError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Could not load the Sail font: {fontError.message}</Text>
      </View>
    );
  }

  if (loading || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading recipes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={() => fetchRecipes()} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} />}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={[styles.pageContent, { paddingHorizontal: horizontalPadding }]}>
        <LinearGradient
          colors={heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, isWide && styles.heroWide]}
        >
          <Animated.Image
            source={heroImage ? { uri: heroImage.image } : undefined}
            resizeMode="cover"
            style={[
              styles.heroBackgroundImage,
              {
                transform: [
                  {
                    scale: backgroundDrift.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.06],
                    }),
                  },
                  {
                    translateX: backgroundDrift.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-5, 5],
                    }),
                  },
                  {
                    translateY: backgroundDrift.interpolate({
                      inputRange: [0, 1],
                      outputRange: [2, -2],
                    }),
                  },
                ],
              },
            ]}
          />
          {nextHeroImage && (
            <Animated.Image
              source={{ uri: nextHeroImage.image }}
              resizeMode="cover"
              style={[
                styles.heroBackgroundImage,
                {
                  opacity: heroImageOpacity,
                  transform: [
                    {
                      scale: backgroundDrift.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.06],
                      }),
                    },
                    {
                      translateX: backgroundDrift.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-5, 5],
                      }),
                    },
                    {
                      translateY: backgroundDrift.interpolate({
                        inputRange: [0, 1],
                        outputRange: [2, -2],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
          <LinearGradient
            colors={['rgba(20,30,27,0.42)', 'rgba(20,30,27,0.58)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroImageOverlay}
            pointerEvents="none"
          />
          <View style={[styles.heroCopy, !isWide && styles.heroCopyCompact]}>
            <View style={styles.heroEyebrow}>
              <MaterialCommunityIcons name="chef-hat" size={16} color="#FFFFFF" />
              <Text style={styles.heroEyebrowText}>YOUR PERSONAL COOKBOOK</Text>
            </View>
            <Text style={[styles.heroTitle, !isWide && styles.heroTitleCompact]}>
              {user ? `Welcome back, ${user.firstName}!` : 'Cook something wonderful'}
            </Text>
            <Text style={styles.heroSubtitle}>
              Discover delicious recipes and keep all your favorites in one place.
            </Text>
            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => router.push('/(app)/(tabs)/search')}
              accessibilityRole="button"
            >
              <Text style={styles.heroButtonText}>Explore recipes</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color={colors.accent} />
            </TouchableOpacity>
          </View>
          <FloatingRecipePhotos recipes={recipes} compact={!isWide} />
        </LinearGradient>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>FIND YOUR NEXT FAVORITE</Text>
              <Title style={styles.sectionTitle}>Browse categories</Title>
            </View>
            <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/categories')} style={styles.seeAll}>
              <Text style={styles.textAction}>All categories</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.categoryChip}
                onPress={() => router.push(`/(app)/(tabs)/search?tag=${encodeURIComponent(item)}`)}
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={categoryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.categoryChipGradient}
                >
                  <Text style={styles.categoryChipText}>{item}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
          />
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>A LITTLE INSPIRATION</Text>
              <Title style={styles.sectionTitle}>Featured around the world</Title>
            </View>
            <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/search')} style={styles.seeAll}>
              <Text style={styles.textAction}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.recipeGrid}>
            {featuredRecipes.map((item) => (
              <View key={item.id} style={{ width: cardWidth }}>{renderRecipe({ item })}</View>
            ))}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>SOMETHING GOOD IS COOKING</Text>
              <Title style={styles.sectionTitle}>Recipe collection</Title>
              <Text style={styles.collectionCaption}>{recipes.length}+ recipes from around the world</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/search')} style={styles.seeAll}>
              <Text style={styles.textAction}>Search</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.recipeGrid}>
            {recipes.map((item) => (
              <View key={item.id} style={{ width: cardWidth }}>{renderRecipe({ item })}</View>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(app)/(tabs)/search')}
            style={styles.countryButton}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.countryButtonGradient}
            >
              <MaterialCommunityIcons name="earth" size={20} color="#FFFFFF" />
              <Text style={styles.countryButtonText}>Browse recipes by country</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}