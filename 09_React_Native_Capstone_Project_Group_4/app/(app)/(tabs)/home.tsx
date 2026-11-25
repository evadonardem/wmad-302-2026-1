/**
 * Home Screen - Cookbook Discover Tab
 * Features: Looping fade-in food hero banner, flicker display greeting text,
 * "Spin the Craving" interactive mood & meal roulette,
 * interactive hover-to-preview same-product variation loop on recipe cards,
 * and 25-per-page horizontal rows
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';
import { Title, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  AnimatedCardWrapper,
  AnimatedHeartButton,
} from '@/components/AnimatedComponents';
import { styles } from './homeStyles';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';
const PAGE_SIZE = 25;
const ITEMS_PER_ROW = 5;

const HERO_DISPLAY_FONT = Platform.select({
  web: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
  ios: 'Georgia-BoldItalic',
  android: 'serif',
  default: 'serif',
});

const ROW_LABELS = [
  { title: '🔥 Trending Now', subtitle: 'Most loved dishes this week' },
  { title: '⚡ Quick & Flavorful', subtitle: 'Ready in minimal prep time' },
  { title: '👨‍🍳 Chef’s Specials', subtitle: 'Handpicked culinary favorites' },
  { title: '🌍 World Kitchen', subtitle: 'Authentic global flavors' },
  { title: '🍽️ Daily Cravings', subtitle: 'Comfort food & classics' },
];

const CATEGORY_ITEMS = [
  { name: 'Dinner', icon: 'silverware-fork-knife' },
  { name: 'Lunch', icon: 'food-variant' },
  { name: 'Breakfast', icon: 'coffee' },
  { name: 'Dessert', icon: 'cupcake' },
  { name: 'Snack', icon: 'food-apple' },
  { name: 'Appetizer', icon: 'cheese' },
  { name: 'Chicken', icon: 'food-drumstick' },
  { name: 'Pasta', icon: 'noodles' },
] as const;

type CravingMood = 'all' | 'quick' | 'light' | 'protein';

const CRAVING_MOODS: {
  id: CravingMood;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { id: 'all', label: 'All Cravings', icon: 'shimmer' },
  { id: 'quick', label: 'Quick (<30m)', icon: 'lightning-bolt' },
  { id: 'light', label: 'Light (<400 cal)', icon: 'leaf' },
  { id: 'protein', label: 'High Protein', icon: 'arm-flex' },
];

/**
 * Interactive "Spin the Craving" Mood & Meal Roulette Card
 */
function SpinTheCravingCard({
  recipes,
  onSelectRecipe,
}: {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
}) {
  const [selectedMood, setSelectedMood] = useState<CravingMood>('all');
  const [spinning, setSpinning] = useState(false);
  const [activeDish, setActiveDish] = useState<Recipe | null>(null);
  const [hasSpun, setHasSpun] = useState(false);

  const spinRotate = useRef(new Animated.Value(0)).current;
  const cardPopScale = useRef(new Animated.Value(1)).current;
  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredPool = useMemo(() => {
    if (recipes.length === 0) return [];
    const pool = recipes.filter((r) => {
      const totalMins = (r.prepTimeMinutes || 0) + (r.cookTimeMinutes || 0);
      const text = `${r.name} ${r.ingredients.join(' ')}`.toLowerCase();
      if (selectedMood === 'quick') return totalMins <= 30;
      if (selectedMood === 'light') return (r.caloriesPerServing || 0) <= 400;
      if (selectedMood === 'protein') {
        return (
          text.includes('chicken') ||
          text.includes('beef') ||
          text.includes('steak') ||
          text.includes('shrimp') ||
          text.includes('salmon') ||
          text.includes('egg') ||
          text.includes('tofu')
        );
      }
      return true;
    });
    return pool.length > 0 ? pool : recipes;
  }, [recipes, selectedMood]);

  useEffect(() => {
    if (filteredPool.length > 0 && !spinning) {
      setActiveDish((prev) => {
        if (prev && filteredPool.some((item) => item.id === prev.id)) return prev;
        return filteredPool[0];
      });
    }
  }, [filteredPool, spinning]);

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    };
  }, []);

  const handleSpin = () => {
    if (spinning || filteredPool.length === 0) return;

    setSpinning(true);
    setHasSpun(true);
    spinRotate.setValue(0);

    Animated.timing(spinRotate, {
      toValue: 1,
      duration: 1650,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();

    let step = 0;
    const totalSteps = 16;

    const tick = () => {
      step += 1;
      const randomPick = filteredPool[Math.floor(Math.random() * filteredPool.length)];
      setActiveDish(randomPick);

      if (step < totalSteps) {
        // Gradually decelerate like a real roulette wheel
        const nextDelay = 55 + Math.pow(step, 1.55) * 6;
        spinTimeoutRef.current = setTimeout(tick, nextDelay);
      } else {
        setSpinning(false);
        cardPopScale.setValue(0.94);
        Animated.spring(cardPopScale, {
          toValue: 1,
          friction: 5,
          tension: 140,
          useNativeDriver: USE_NATIVE_DRIVER,
        }).start();
      }
    };

    tick();
  };

  if (!activeDish) return null;

  const spinDegrees = spinRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  const totalTime = (activeDish.prepTimeMinutes || 0) + (activeDish.cookTimeMinutes || 0);

  return (
    <AnimatedCardWrapper index={1}>
      <View
        style={{
          backgroundColor: '#2B1B12',
          borderRadius: 22,
          padding: 18,
          marginBottom: 22,
          borderWidth: 1,
          borderColor: '#4A2F20',
          shadowColor: '#2B1B12',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.16,
          shadowRadius: 14,
          elevation: 5,
        }}
      >
        {/* Header Row */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                backgroundColor: '#E85D04',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Animated.View style={{ transform: [{ rotate: spinDegrees }] }}>
                <MaterialCommunityIcons name="dice-multiple" size={20} color="#FFFFFF" />
              </Animated.View>
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFF8F0' }}>
                Spin the Craving
              </Text>
              <Text style={{ fontSize: 11, color: '#D7CCC8' }}>
                Can&apos;t decide? Pick a mood &amp; spin!
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: 'rgba(232, 93, 4, 0.22)',
              borderWidth: 1,
              borderColor: 'rgba(232, 93, 4, 0.45)',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFB74D' }}>
              {filteredPool.length} dishes
            </Text>
          </View>
        </View>

        {/* Mood Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, marginBottom: 14 }}
        >
          {CRAVING_MOODS.map((mood) => {
            const active = selectedMood === mood.id;
            return (
              <TouchableOpacity
                key={mood.id}
                disabled={spinning}
                onPress={() => setSelectedMood(mood.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: active ? '#E85D04' : 'rgba(255, 255, 255, 0.08)',
                  borderWidth: 1,
                  borderColor: active ? '#FF9E5E' : 'rgba(255, 255, 255, 0.14)',
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 14,
                }}
              >
                <MaterialCommunityIcons
                  name={mood.icon}
                  size={14}
                  color={active ? '#FFFFFF' : '#FFCC80'}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: active ? '#FFFFFF' : '#F5EFEA',
                  }}
                >
                  {mood.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Roulette Result Display Box */}
        <Animated.View
          style={{
            transform: [{ scale: cardPopScale }],
            backgroundColor: '#FFFFFF',
            borderRadius: 18,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderWidth: 2,
            borderColor: spinning ? '#FF9E5E' : hasSpun ? '#E85D04' : '#EFE6DD',
          }}
        >
          <Image
            source={{ uri: activeDish.image }}
            style={{
              width: 74,
              height: 74,
              borderRadius: 14,
              backgroundColor: '#F5EFEA',
            }}
            resizeMode="cover"
          />

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  color: '#E85D04',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {spinning
                  ? '🎲 Shuffling...'
                  : hasSpun
                    ? `✨ Today's Pick · ${activeDish.cuisine}`
                    : `Featured · ${activeDish.cuisine}`}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 15,
                fontWeight: '800',
                color: '#2B1B12',
                marginBottom: 4,
              }}
              numberOfLines={1}
            >
              {activeDish.name}
            </Text>

            <Text style={{ fontSize: 11, color: '#6D4C41', fontWeight: '600' }}>
              ★ {activeDish.rating.toFixed(1)} · ⏱ {totalTime}m · 🔥 {activeDish.caloriesPerServing} kcal
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 6 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSpin}
              disabled={spinning}
              style={{
                backgroundColor: spinning ? '#F48C42' : '#E85D04',
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}>
                {spinning ? 'Spinning...' : '🎲 Spin'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={spinning}
              onPress={() => onSelectRecipe(activeDish)}
              style={{
                backgroundColor: '#FFF3E0',
                borderWidth: 1,
                borderColor: '#FFCC80',
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#D95300', fontSize: 11, fontWeight: '800' }}>
                Cook →
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </AnimatedCardWrapper>
  );
}

/**
 * Flicker + Warm Ember Glow Greeting Text
 */
function FlickerGreetingText({
  text,
  fontSize,
}: {
  text: string;
  fontSize: number;
}) {
  const flickerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const flickerSequence = Animated.loop(
      Animated.sequence([
        Animated.delay(2200),
        Animated.timing(flickerOpacity, {
          toValue: 0.35,
          duration: 65,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(flickerOpacity, {
          toValue: 1,
          duration: 55,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(flickerOpacity, {
          toValue: 0.25,
          duration: 50,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(flickerOpacity, {
          toValue: 1,
          duration: 80,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.delay(1400),
        Animated.timing(flickerOpacity, {
          toValue: 0.55,
          duration: 70,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(flickerOpacity, {
          toValue: 1,
          duration: 90,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    );

    flickerSequence.start();
    return () => flickerSequence.stop();
  }, [flickerOpacity]);

  return (
    <Animated.Text
      style={{
        opacity: flickerOpacity,
        fontSize,
        fontFamily: HERO_DISPLAY_FONT,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: 0.8,
        color: '#FFF8F0',
        textShadowColor: 'rgba(255, 122, 24, 0.95)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 16,
        marginBottom: 6,
      }}
    >
      {text}
    </Animated.Text>
  );
}

/**
 * Smooth looping fade-in slideshow of different food photos for the Welcome Hero Banner
 */
function HeroFoodSlideshow({
  recipes,
  onActiveRecipeChange,
}: {
  recipes: Recipe[];
  onActiveRecipeChange?: (recipe: Recipe) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const prevIndexRef = useRef<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1.04)).current;

  const slides = useMemo(() => recipes.slice(0, 10), [recipes]);

  useEffect(() => {
    prevIndexRef.current = null;
    setActiveIndex(0);
  }, [slides]);

  useEffect(() => {
    if (slides[activeIndex] && onActiveRecipeChange) {
      onActiveRecipeChange(slides[activeIndex]);
    }
  }, [activeIndex, slides, onActiveRecipeChange]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => {
        prevIndexRef.current = current;
        return (current + 1) % slides.length;
      });
    }, 3400);

    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    if (prevIndexRef.current === null) return;

    fadeAnim.setValue(0);
    scaleAnim.setValue(1.14);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 950,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.04,
        duration: 3200,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [activeIndex, fadeAnim, scaleAnim]);

  if (slides.length === 0) return null;

  const currentSlide = slides[activeIndex % slides.length];
  const previousSlide =
    prevIndexRef.current !== null ? slides[prevIndexRef.current % slides.length] : null;

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      {previousSlide && previousSlide.id !== currentSlide.id && (
        <Image
          source={{ uri: previousSlide.image }}
          style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: 0.85 }]}
          resizeMode="cover"
        />
      )}

      <Animated.Image
        source={{ uri: currentSlide.image }}
        style={[
          StyleSheet.absoluteFill,
          {
            width: '100%',
            height: '100%',
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
        resizeMode="cover"
      />

      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(26, 16, 11, 0.56)' },
        ]}
      />
    </View>
  );
}

/**
 * Interactive Recipe Card:
 * - Steady when idle
 * - On mouse hover: scales up smoothly & loops fade-in previews of strictly the SAME dish/product type
 */
function InteractiveRecipeCard({
  item,
  index,
  cardWidth,
  gridGap,
  allRecipes,
  favorited,
  onToggleFavorite,
  onPress,
}: {
  item: Recipe;
  index: number;
  cardWidth: number;
  gridGap: number;
  allRecipes: Recipe[];
  favorited: boolean;
  onToggleFavorite: () => void;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const cardScale = useRef(new Animated.Value(1)).current;
  const previewFade = useRef(new Animated.Value(1)).current;
  const previewZoom = useRef(new Animated.Value(1)).current;

  const variationSlides = useMemo(() => {
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

    const lowerName = item.name.toLowerCase();
    const matchedProductKeys = coreKeywords.filter((kw) => lowerName.includes(kw));

    const ignoredWords = new Set(['with', 'and', 'the', 'style', 'classic', 'fresh', 'homemade']);
    const specificWords =
      matchedProductKeys.length > 0
        ? matchedProductKeys
        : lowerName
            .split(/[\s-]+/)
            .filter((w) => w.length > 3 && !ignoredWords.has(w));

    const sameProductRecipes = allRecipes.filter((other) => {
      if (other.id === item.id) return false;
      const otherLower = other.name.toLowerCase();
      return specificWords.some((kw) => otherLower.includes(kw));
    });

    const slides: {
      uri: string;
      label: string;
      zoom: number;
      offsetX: number;
      offsetY: number;
    }[] = [
      { uri: item.image, label: 'Original Style', zoom: 1.0, offsetX: 0, offsetY: 0 },
    ];

    sameProductRecipes.slice(0, 3).forEach((rel) => {
      slides.push({
        uri: rel.image,
        label: rel.name,
        zoom: 1.06,
        offsetX: 0,
        offsetY: 0,
      });
    });

    slides.push(
      { uri: item.image, label: 'Close-Up Plating', zoom: 1.26, offsetX: -12, offsetY: -8 },
      { uri: item.image, label: 'Chef’s Detail View', zoom: 1.24, offsetX: 12, offsetY: 8 }
    );

    return slides;
  }, [item, allRecipes]);

  useEffect(() => {
    Animated.spring(cardScale, {
      toValue: hovered ? 1.045 : 1,
      friction: 7,
      tension: 120,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();

    if (!hovered) {
      setSlideIdx(0);
      previewFade.setValue(1);
      previewZoom.setValue(1);
    }
  }, [hovered, cardScale, previewFade, previewZoom]);

  useEffect(() => {
    if (!hovered || variationSlides.length <= 1) return;

    const advanceSlide = () => {
      setSlideIdx((prev) => (prev + 1) % variationSlides.length);
    };

    const firstTimeout = setTimeout(advanceSlide, 450);
    const interval = setInterval(advanceSlide, 1400);

    return () => {
      clearTimeout(firstTimeout);
      clearInterval(interval);
    };
  }, [hovered, variationSlides.length]);

  useEffect(() => {
    if (!hovered || slideIdx === 0) return;

    previewFade.setValue(0.2);
    previewZoom.setValue(1.12);

    Animated.parallel([
      Animated.timing(previewFade, {
        toValue: 1,
        duration: 420,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(previewZoom, {
        toValue: 1.02,
        duration: 1250,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [hovered, slideIdx, previewFade, previewZoom]);

  const diffColors =
    item.difficulty === 'Easy'
      ? { bg: '#E8F5E9', text: '#2E7D32' }
      : item.difficulty === 'Medium'
        ? { bg: '#FFF3E0', text: '#EF6C00' }
        : { bg: '#FFEBEE', text: '#C62828' };

  const activeSlide = variationSlides[slideIdx % variationSlides.length] || variationSlides[0];

  return (
    <AnimatedCardWrapper
      index={index}
      style={{
        width: cardWidth,
        marginRight: gridGap,
        zIndex: hovered ? 20 : 1,
      }}
    >
      <Pressable
        onPress={onPress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
      >
        <Animated.View
          style={{
            transform: [{ scale: cardScale }],
            backgroundColor: '#FFFFFF',
            borderRadius: 18,
            overflow: 'hidden',
            borderWidth: hovered ? 1.5 : 1,
            borderColor: hovered ? '#E85D04' : '#EFE6DD',
            shadowColor: hovered ? '#E85D04' : '#3E2723',
            shadowOffset: { width: 0, height: hovered ? 10 : 4 },
            shadowOpacity: hovered ? 0.24 : 0.08,
            shadowRadius: hovered ? 18 : 10,
            elevation: hovered ? 8 : 3,
          }}
        >
          <View
            style={{
              width: cardWidth,
              height: cardWidth,
              backgroundColor: '#F5EFEA',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Image
              source={{ uri: item.image }}
              style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
              resizeMode="cover"
            />

            <Animated.Image
              source={{ uri: hovered ? activeSlide.uri : item.image }}
              style={[
                StyleSheet.absoluteFill,
                {
                  width: '100%',
                  height: '100%',
                  opacity: hovered ? previewFade : 1,
                  transform: hovered
                    ? [
                        { scale: Animated.multiply(previewZoom, activeSlide.zoom) },
                        { translateX: activeSlide.offsetX },
                        { translateY: activeSlide.offsetY },
                      ]
                    : [{ scale: 1 }],
                },
              ]}
              resizeMode="cover"
            />

            <View
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                backgroundColor: diffColors.bg,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 20,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: diffColors.text }}>
                {item.difficulty}
              </Text>
            </View>

            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.94)',
                borderRadius: 20,
              }}
            >
              <AnimatedHeartButton
                isFavorite={favorited}
                onPress={onToggleFavorite}
                size={18}
              />
            </View>

            {hovered ? (
              <View
                style={{
                  position: 'absolute',
                  bottom: 10,
                  left: 10,
                  right: 10,
                  backgroundColor: 'rgba(232, 93, 4, 0.92)',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text
                  style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF', flex: 1 }}
                  numberOfLines={1}
                >
                  ✨ {activeSlide.label}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFF3E0', marginLeft: 6 }}>
                  {slideIdx + 1}/{variationSlides.length}
                </Text>
              </View>
            ) : (
              <View
                style={{
                  position: 'absolute',
                  bottom: 10,
                  left: 10,
                  backgroundColor: 'rgba(38, 24, 18, 0.82)',
                  paddingHorizontal: 9,
                  paddingVertical: 4,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFD54F' }}>★</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>
                  {item.rating.toFixed(1)}
                </Text>
                <Text style={{ fontSize: 10, color: '#E0D6CC' }}>({item.reviewCount})</Text>
              </View>
            )}
          </View>

          <View style={{ padding: 12 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: '#E85D04',
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                marginBottom: 3,
              }}
              numberOfLines={1}
            >
              {item.cuisine}
            </Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: '#2B1B12',
                marginBottom: 8,
              }}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: '#F5EFEA',
              }}
            >
              <Text style={{ fontSize: 12, color: '#6D4C41', fontWeight: '500' }}>
                ⏱ {item.prepTimeMinutes + item.cookTimeMinutes} min
              </Text>
              <Text style={{ fontSize: 12, color: '#6D4C41', fontWeight: '500' }}>
                🔥 {item.caloriesPerServing} cal
              </Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </AnimatedCardWrapper>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { width } = useWindowDimensions();

  const numVisibleCols = width >= 1200 ? 5 : width >= 768 ? 3 : 2;
  const gridGap = 14;
  const horizontalPadding = 32;
  const cardWidth = Math.floor(
    (width - horizontalPadding - gridGap * (numVisibleCols - 1)) / numVisibleCols
  );

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [heroRecipe, setHeroRecipe] = useState<Recipe | null>(null);
  const [totalRecipes, setTotalRecipes] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipesByPage = useCallback(async (page: number, isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const skip = (page - 1) * PAGE_SIZE;
      const data = await recipeApi.getRecipes({ limit: PAGE_SIZE, skip });
      setRecipes(data.recipes);
      if (data.recipes.length > 0) {
        setHeroRecipe(data.recipes[0]);
      }
      setTotalRecipes(data.total || 50);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipesByPage(1);
  }, [fetchRecipesByPage]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecipesByPage(currentPage, true);
  };

  const recipeRows = useMemo(() => {
    const rows: Recipe[][] = [];
    for (let i = 0; i < recipes.length; i += ITEMS_PER_ROW) {
      rows.push(recipes.slice(i, i + ITEMS_PER_ROW));
    }
    return rows;
  }, [recipes]);

  const totalPages = Math.max(1, Math.ceil(totalRecipes / PAGE_SIZE));

  const renderRecipeCard = ({ item, index }: { item: Recipe; index: number }) => (
    <InteractiveRecipeCard
      item={item}
      index={index}
      cardWidth={cardWidth}
      gridGap={gridGap}
      allRecipes={recipes}
      favorited={isFavorite(item.id)}
      onToggleFavorite={() => toggleFavorite(item)}
      onPress={() => router.push(`/(app)/(tabs)/recipe/${item.id}`)}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E85D04" />
        <Text style={styles.loadingText}>Preparing Page {currentPage} recipes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          mode="contained"
          onPress={() => fetchRecipesByPage(currentPage, false)}
          style={styles.retryButton}
        >
          Retry
        </Button>
      </View>
    );
  }

  const startItem = (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, totalRecipes);
  const heroMinHeight = width >= 768 ? 245 : 205;
  const greetingText = user ? `Welcome back, ${user.firstName}!` : 'Welcome to Cookbook!';

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: '#FAF6F2' }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E85D04']} />
      }
      contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 16, paddingBottom: 32 }]}
    >
      {/* Hero Banner with Looping Fade-In Food Photography & Flicker Greeting */}
      <AnimatedCardWrapper index={0}>
        <View
          style={{
            backgroundColor: '#2B1B12',
            borderRadius: 24,
            minHeight: heroMinHeight,
            padding: width >= 768 ? 30 : 22,
            marginBottom: 18,
            overflow: 'hidden',
            position: 'relative',
            justifyContent: 'space-between',
            shadowColor: '#2B1B12',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.18,
            shadowRadius: 16,
            elevation: 5,
          }}
        >
          <HeroFoodSlideshow recipes={recipes} onActiveRecipeChange={setHeroRecipe} />

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <View
              style={{
                backgroundColor: 'rgba(232, 93, 4, 0.92)',
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 14,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.4 }}>
                ✨ CURATED COOKBOOK
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(app)/(tabs)/profile')}
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                backgroundColor: '#E85D04',
                borderWidth: 2,
                borderColor: 'rgba(255, 255, 255, 0.35)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="chef-hat" size={30} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View>
            <FlickerGreetingText
              text={greetingText}
              fontSize={width >= 768 ? 34 : 26}
            />
            <Text style={{ fontSize: 14, color: '#F5EFEA', marginBottom: 16 }}>
              Explore {totalRecipes} chef-crafted recipes from around the world
            </Text>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <TouchableOpacity
                onPress={() => router.push('/(app)/(tabs)/search')}
                style={{
                  backgroundColor: '#E85D04',
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <MaterialCommunityIcons name="magnify" size={17} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                  Find a Recipe
                </Text>
              </TouchableOpacity>

              {heroRecipe && (
                <TouchableOpacity
                  onPress={() => router.push(`/(app)/(tabs)/recipe/${heroRecipe.id}`)}
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.22)',
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <MaterialCommunityIcons name="silverware-fork-knife" size={14} color="#FFD54F" />
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
                    Now showing: {heroRecipe.name}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </AnimatedCardWrapper>

      {/* Unique Feature: Interactive "Spin the Craving" Mood & Meal Roulette */}
      <SpinTheCravingCard
        recipes={recipes}
        onSelectRecipe={(dish) => router.push(`/(app)/(tabs)/recipe/${dish.id}`)}
      />

      {/* Categories Pill Row */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Title style={[styles.sectionTitle, { fontWeight: '800', color: '#2B1B12' }]}>
            Categories
          </Title>
          <TouchableOpacity
            onPress={() => router.push('/(app)/(tabs)/categories')}
            style={styles.seeAll}
          >
            <Text style={[styles.seeAllText, { fontWeight: '700' }]}>All Categories →</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={CATEGORY_ITEMS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 4 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push(`/(app)/(tabs)/search?category=${encodeURIComponent(item.name)}`)
              }
              style={(state) => { const hovered = Boolean((state as { hovered?: boolean }).hovered); return {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: hovered ? '#FFF3E0' : '#FFFFFF',
                borderWidth: 1,
                borderColor: hovered ? '#E85D04' : '#EADFD5',
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 16,
                marginRight: 10,
                shadowColor: '#3E2723',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 1,
              }; }}
            >
              <MaterialCommunityIcons name={item.icon} size={16} color="#E85D04" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#3E2723' }}>{item.name}</Text>
            </Pressable>
          )}
          keyExtractor={(item) => item.name}
        />
      </View>

      {/* Featured Recipes (5 Independent Curated Swipeable Rows, 25 per page) */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View>
            <Title style={[styles.sectionTitle, { fontWeight: '800', color: '#2B1B12' }]}>
              Featured Recipes
            </Title>
            <Text style={{ fontSize: 12, color: '#8D6E63' }}>
              Showing {startItem}–{endItem} of {totalRecipes} · Hover card to preview variations · Swipe each row
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(app)/(tabs)/search')}
            style={styles.seeAll}
          >
            <Text style={[styles.seeAllText, { fontWeight: '700' }]}>Search All →</Text>
          </TouchableOpacity>
        </View>

        {recipeRows.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recipes found</Text>
          </View>
        ) : (
          recipeRows.map((rowItems, rowIndex) => {
            const label = ROW_LABELS[rowIndex] || {
              title: `Collection ${rowIndex + 1}`,
              subtitle: 'Curated recipes',
            };
            return (
              <View key={`row-wrapper-${currentPage}-${rowIndex}`} style={{ marginBottom: 22 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#2B1B12' }}>
                    {label.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#8D6E63' }}>{label.subtitle}</Text>
                </View>

                <FlatList
                  key={`recipe-row-page-${currentPage}-row-${rowIndex}`}
                  data={rowItems}
                  renderItem={renderRecipeCard}
                  keyExtractor={(item) => item.id.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 4 }}
                />
              </View>
            );
          })
        )}

        {/* Styled Page 1 / Page 2 Pagination Bar */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
            marginTop: 8,
            paddingVertical: 12,
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#EFE6DD',
          }}
        >
          <Button
            mode="outlined"
            disabled={currentPage <= 1}
            onPress={() => fetchRecipesByPage(currentPage - 1)}
            style={{ borderColor: currentPage <= 1 ? '#E0D6CC' : '#E85D04', borderRadius: 10 }}
            textColor="#E85D04"
            icon="chevron-left"
          >
            Previous
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
            const isActive = pageNum === currentPage;
            return (
              <Button
                key={pageNum}
                mode={isActive ? 'contained' : 'outlined'}
                onPress={() => fetchRecipesByPage(pageNum)}
                buttonColor={isActive ? '#E85D04' : undefined}
                textColor={isActive ? '#FFFFFF' : '#E85D04'}
                style={{ borderColor: '#E85D04', minWidth: 44, borderRadius: 10 }}
              >
                {pageNum}
              </Button>
            );
          })}

          <Button
            mode="outlined"
            disabled={currentPage >= totalPages}
            onPress={() => fetchRecipesByPage(currentPage + 1)}
            style={{
              borderColor: currentPage >= totalPages ? '#E0D6CC' : '#E85D04',
              borderRadius: 10,
            }}
            textColor="#E85D04"
            contentStyle={{ flexDirection: 'row-reverse' }}
            icon="chevron-right"
          >
            Next
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}