/**
 * Reusable UI Components
 */

import React, { ComponentProps, createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  LayoutChangeEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Href, useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Dialog, IconButton, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Recipe } from '@/types/recipe';
import { formatMinutes, mealTypesOf, totalTime } from '@/utils/recipeFilters';
import { routes } from '@/utils/routes';
import { DecorBackground } from './DecorBackground';
import { createStyles, tc, useAppTheme } from '@/context/ThemeContext';

/**
 * Cards measure their own width and shrink their text, icons and spacing with it (never below
 * 72%), so everything stays in its place when the screen gets narrower instead of wrapping or
 * overlapping. `sz(16)` is 16 at full size and about 12 at the smallest.
 */
export function useCardScale(fullWidth = 300) {
  const [scale, setScale] = useState(1);
  // Cards stay invisible until their first measurement so they never flash at full size and then shrink
  const [ready, setReady] = useState(false);
  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      setReady(true);
      const next = Math.round(Math.min(1, Math.max(0.72, e.nativeEvent.layout.width / fullWidth)) * 100) / 100;
      setScale((prev) => (prev === next ? prev : next));
    },
    [fullWidth]
  );
  const sz = (n: number) => Math.round(n * scale * 10) / 10;
  return { scale, onLayout, sz, ready };
}

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const DIFFICULTY_BG: Record<Recipe['difficulty'], string> = {
  Easy: '#E8F5E9',
  Medium: '#FDE7EF',
  Hard: '#FDEDED',
};

export const DIFFICULTY_FG: Record<Recipe['difficulty'], string> = {
  Easy: '#2E7D32',
  Medium: '#880E4F',
  Hard: '#C62828',
};

/* ------------------------------------------------------------------ */
/* Screen wrapper (safe areas)                                         */
/* ------------------------------------------------------------------ */

/**
 * Wraps a screen: safe area, an optional decorative background (`decor`), and a smooth
 * fade + slide-up every time the screen comes into focus (tab switch or navigation).
 */
/* ------------------------------------------------------------------ */
/* "Go back to the top" when a navigation button is pressed            */
/* ------------------------------------------------------------------ */

const scrollTopListeners = new Set<() => void>();

/** Called by the navigation buttons: the page that is showing scrolls back to its start. */
export function requestScrollToTop() {
  // wait a moment so the page being navigated to has taken over first
  setTimeout(() => scrollTopListeners.forEach((fn) => fn()), 90);
}

/** A page calls this with a function that scrolls it to the top; it runs when a nav button is pressed. */
export function useScrollToTopOnNav(scrollToTop: () => void) {
  const latest = useRef(scrollToTop);
  latest.current = scrollToTop;
  useFocusEffect(
    useCallback(() => {
      const fn = () => latest.current();
      scrollTopListeners.add(fn);
      return () => {
        scrollTopListeners.delete(fn);
      };
    }, [])
  );
}

/** True inside the menu layout, which already pads the top safe area with its own top bar. */
export const MenuBarContext = createContext(false);

export function Screen({
  children,
  style,
  decor = false,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  decor?: boolean;
}) {
  useAppTheme();
  const hasMenuBar = useContext(MenuBarContext);
  const appear = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      appear.setValue(0);
      Animated.timing(appear, {
        toValue: 1,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, [appear])
  );

  return (
    <SafeAreaView edges={hasMenuBar ? [] : ['top']} style={[styles.screen, style]}>
      <Animated.View
        style={[
          styles.screenInner,
          { opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] },
        ]}
      >
        {decor ? <DecorBackground /> : null}
        {children}
      </Animated.View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Back button                                                         */
/* ------------------------------------------------------------------ */

/**
 * Goes back if there is history, otherwise falls back to Home
 * (e.g. when a recipe page is opened directly from the browser address bar).
 */
export function BackButton({ light = false, fallback = routes.home }: { light?: boolean; fallback?: string }) {
  useAppTheme();
  const router = useRouter();
  const onPress = () => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback as Href);
  };
  return (
    <IconButton
      icon="arrow-left"
      size={22}
      iconColor={light ? tc('#3C252D') : '#D81B60'}
      containerColor={light ? tc('rgba(255,255,255,0.92)','containerColor') : undefined}
      onPress={onPress}
      accessibilityLabel="Go back"
    />
  );
}

/* ------------------------------------------------------------------ */
/* Recipe cards                                                        */
/* ------------------------------------------------------------------ */

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  style?: StyleProp<ViewStyle>;
}

function FavoriteButton({
  isFavorite,
  onPress,
  size = 22,
  style,
}: {
  isFavorite?: boolean;
  onPress: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  useAppTheme();
  return (
    <IconButton
      icon={isFavorite ? 'heart' : 'heart-outline'}
      iconColor={isFavorite ? '#D81B60' : '#3C252D'}
      containerColor="rgba(255,255,255,0.94)"
      size={size}
      style={style}
      onPress={onPress}
      accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    />
  );
}

function DifficultyPill({ difficulty }: { difficulty: Recipe['difficulty'] }) {
  useAppTheme();
  return (
    <View style={[styles.pill, { backgroundColor: tc(DIFFICULTY_BG[difficulty], 'backgroundColor') }]}>
      <View style={[styles.pillDot, { backgroundColor: DIFFICULTY_FG[difficulty] }]} />
      <Text style={[styles.pillText, { color: tc(DIFFICULTY_FG[difficulty]) }]}>{difficulty}</Text>
    </View>
  );
}

function Meta({ icon, text, scale = 1 }: { icon: IconName; text: string; scale?: number }) {
  useAppTheme();
  return (
    <View style={styles.metaItem}>
      <MaterialCommunityIcons name={icon} size={15 * scale} color="#D81B60" />
      <Text style={[styles.metaText, scale < 1 && { fontSize: 13 * scale }]}>{text}</Text>
    </View>
  );
}

/** Large card used on the Home feed. */
export function RecipeCard({ recipe, onPress, isFavorite, onToggleFavorite, style }: RecipeCardProps) {
  useAppTheme();
  return (
    <View style={[styles.cardWrapper, style]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.cardPressable, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Open recipe ${recipe.name}`}
      >
        <Card style={styles.card} elevation={3}>
          <View style={styles.cardClip}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: recipe.image }} style={styles.recipeImage} resizeMode="cover" />
              <View style={styles.imageShade} />
              <View style={styles.difficultyBadge}>
                <DifficultyPill difficulty={recipe.difficulty} />
              </View>
              <View style={styles.ratingBadge}>
                <MaterialCommunityIcons name="star" size={14} color="#FF5C93" />
                <Text style={styles.ratingBadgeText}>{recipe.rating.toFixed(1)}</Text>
                <Text style={styles.ratingBadgeCount}>({recipe.reviewCount})</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cuisineLabel}>{recipe.cuisine.toUpperCase()}</Text>
              <Text style={styles.recipeTitle} numberOfLines={1}>
                {recipe.name}
              </Text>
              <View style={styles.metaRow}>
                <Meta icon="clock-outline" text={formatMinutes(totalTime(recipe))} />
                <Meta icon="account-group-outline" text={`${recipe.servings} servings`} />
                <Meta icon="fire" text={`${recipe.caloriesPerServing} cal`} />
              </View>
              <View style={styles.tagRow}>
                {mealTypesOf(recipe).slice(0, 3).map((meal) => (
                  <View key={meal} style={styles.mealTag}>
                    <Text style={styles.mealTagText}>{meal}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Card>
      </Pressable>
      {/* Sits next to (not inside) the pressable card so web does not nest <button> in <button> */}
      {onToggleFavorite && (
        <FavoriteButton isFavorite={isFavorite} onPress={onToggleFavorite} style={styles.favoriteButton} />
      )}
    </View>
  );
}

/** Grid card for the Home page: big photo, title, quick facts, dark "See Complete Recipe" bar. */
export function RecipeGridCard({ recipe, onPress, isFavorite, onToggleFavorite, style }: RecipeCardProps) {
  useAppTheme();
  const { scale, onLayout, sz, ready } = useCardScale(300);
  return (
    <View style={[styles.gridWrapper, style, !ready && { opacity: 0 }]} onLayout={onLayout}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.gridPressable, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Open recipe ${recipe.name}`}
      >
        <View style={[styles.gridCard, { padding: sz(12), borderRadius: sz(24) }]}>
          {/* Photo first. The tinted box + icon behind it stay visible while it loads (or if it fails). */}
          <View style={[styles.gridImageWrap, { borderRadius: sz(18) }]}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={sz(40)} color={tc('#BAA6AD')} style={styles.gridImagePlaceholder} />
            <Image source={{ uri: recipe.image }} style={styles.gridImage} resizeMode="cover" />
            <View style={[styles.gridRating, { top: sz(10), right: sz(10), paddingHorizontal: sz(10), paddingVertical: sz(5), borderRadius: sz(14) }]}>
              <MaterialCommunityIcons name="star" size={sz(14)} color="#FF5C93" />
              <Text style={[styles.gridRatingText, { fontSize: sz(12) }]}>{recipe.rating.toFixed(1)}</Text>
            </View>
          </View>
          <Text style={[styles.gridTitle, { fontSize: sz(18), lineHeight: sz(24), marginTop: sz(12) }]} numberOfLines={2}>
            {recipe.name}
          </Text>
          <View style={[styles.gridMetaRow, { marginTop: sz(10), marginBottom: sz(12) }]}>
            <Meta icon="clock-outline" text={formatMinutes(totalTime(recipe))} scale={scale} />
            <Meta icon="fire" text={`${recipe.caloriesPerServing} cal`} scale={scale} />
            <Text style={[styles.gridDifficulty, { fontSize: sz(12), color: tc(DIFFICULTY_FG[recipe.difficulty]) }]}>{recipe.difficulty}</Text>
          </View>
          <View style={[styles.gridButton, { height: sz(48), borderRadius: sz(26), paddingLeft: sz(20), paddingRight: sz(6) }]}>
            <Text style={[styles.gridButtonText, { fontSize: sz(14) }]} numberOfLines={1}>
              See Complete Recipe
            </Text>
            <View style={[styles.gridButtonIcon, { width: sz(36), height: sz(36), borderRadius: sz(18) }]}>
              <MaterialCommunityIcons name="arrow-right" size={sz(16)} color={tc('#3C252D')} />
            </View>
          </View>
        </View>
      </Pressable>
      {onToggleFavorite && (
        <FavoriteButton
          isFavorite={isFavorite}
          onPress={onToggleFavorite}
          size={sz(22)}
          style={[styles.gridFavorite, { top: sz(20), left: sz(20) }]}
        />
      )}
    </View>
  );
}

/** Compact row used in Search, Favorites and My Recipes. */
export function RecipeListItem({ recipe, onPress, isFavorite, onToggleFavorite, style }: RecipeCardProps) {
  useAppTheme();
  return (
    <View style={[styles.listItemWrapper, style]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.listPressable, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Open recipe ${recipe.name}`}
      >
        <Card style={styles.listCard} elevation={2}>
          <View style={styles.listRow}>
            <View style={styles.listImageWrap}>
              <Image source={{ uri: recipe.image }} style={styles.listImage} resizeMode="cover" />
              <View style={styles.listRating}>
                <MaterialCommunityIcons name="star" size={11} color="#FF5C93" />
                <Text style={styles.listRatingText}>{recipe.rating.toFixed(1)}</Text>
              </View>
            </View>
            <View style={[styles.listInfo, onToggleFavorite && styles.listInfoWithAction]}>
              <Text style={styles.cuisineLabel}>{recipe.cuisine.toUpperCase()}</Text>
              <Text style={styles.listTitle} numberOfLines={1}>
                {recipe.name}
              </Text>
              <View style={styles.listMetaRow}>
                <Meta icon="clock-outline" text={formatMinutes(totalTime(recipe))} />
                <Meta icon="account-group-outline" text={`${recipe.servings}`} />
              </View>
              <DifficultyPill difficulty={recipe.difficulty} />
            </View>
          </View>
        </Card>
      </Pressable>
      {onToggleFavorite && (
        <FavoriteButton
          isFavorite={isFavorite}
          onPress={onToggleFavorite}
          size={20}
          style={styles.listFavoriteButton}
        />
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Hero carousel                                                       */
/* ------------------------------------------------------------------ */

/**
 * Auto-playing photo carousel (cross-fades between recipe photos).
 * Tap the photo to open that recipe; the dots show which photo is up.
 */
export function HeroCarousel({
  recipes,
  onPressRecipe,
  intervalMs = 3500,
  style,
  showCaption = true,
  onChange,
}: {
  recipes: Recipe[];
  onPressRecipe: (recipe: Recipe) => void;
  intervalMs?: number;
  style?: StyleProp<ViewStyle>;
  /** Draw the dish name on the photo. Phones turn this off and show it under the search box instead. */
  showCaption?: boolean;
  /** Called with the recipe whose photo is showing (so a caption can be drawn elsewhere). */
  onChange?: (recipe: Recipe | null) => void;
}) {
  useAppTheme();
  const [index, setIndex] = React.useState(0);
  const [prev, setPrev] = React.useState<number | null>(null);
  const fade = useRef(new Animated.Value(1)).current;
  const count = recipes.length;

  // A new set of photos (another category) starts again from the first one
  useEffect(() => {
    setIndex(0);
    setPrev(null);
    fade.setValue(1);
  }, [recipes, fade]);

  // Move to the next photo every few seconds
  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => {
      setIndex((current) => {
        setPrev(current);
        return (current + 1) % count;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [count, intervalMs]);

  // Fade the new photo in over the previous one
  useEffect(() => {
    if (prev === null) return;
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, [index, prev, fade]);

  const currentId = count > 0 ? recipes[Math.min(index, count - 1)].id : null;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    onChangeRef.current?.(currentId === null ? null : recipes.find((r) => r.id === currentId) ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  if (count === 0) return <View style={[styles.carousel, style]} />;
  const current = recipes[Math.min(index, count - 1)];
  const previous = prev !== null ? recipes[Math.min(prev, count - 1)] : null;

  return (
    <Pressable
      style={[styles.carousel, style]}
      onPress={() => onPressRecipe(current)}
      accessibilityRole="button"
      accessibilityLabel={`Open recipe ${current.name}`}
    >
      {previous ? <Image source={{ uri: previous.image }} style={styles.carouselImage} resizeMode="cover" /> : null}
      <Animated.Image
        key={current.id}
        source={{ uri: current.image }}
        style={[styles.carouselImage, { opacity: fade }]}
        resizeMode="cover"
      />
      {showCaption && (
        <View style={styles.carouselCaption}>
          <Text style={styles.carouselTitle} numberOfLines={1}>
            {current.name}
          </Text>
          <Text style={styles.carouselSub} numberOfLines={1}>
            {current.cuisine} · ⭐ {current.rating.toFixed(1)}
          </Text>
        </View>
      )}
      {count > 1 && (
        <View style={styles.carouselDots}>
          {recipes.map((r, i) => (
            <View key={r.id} style={[styles.carouselDot, i === index && styles.carouselDotActive]} />
          ))}
        </View>
      )}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Chips                                                               */
/* ------------------------------------------------------------------ */

interface CategoryChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

export function CategoryChip({ label, selected, onPress, icon, style }: CategoryChipProps) {
  useAppTheme();
  return (
    <TouchableOpacity
      style={[styles.categoryChip, selected && styles.categoryChipSelected, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={16}
          color={selected ? '#FFFFFF' : '#D81B60'}
          style={styles.chipIcon}
        />
      )}
      <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/* Loading / empty / error states                                      */
/* ------------------------------------------------------------------ */

export function LoadingOverlay({ visible, message = 'Loading...' }: { visible: boolean; message?: string }) {
  useAppTheme();
  if (!visible) return null;
  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color="#D81B60" />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  useAppTheme();
  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name={icon} size={80} color={tc('#BAA6AD')} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {actionLabel && onAction && (
        <Button mode="contained" onPress={onAction} style={styles.actionButton}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  useAppTheme();
  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="alert-circle-outline" size={64} color={tc('#C62828')} />
      <Text style={styles.emptyTitle}>Something went wrong</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {onRetry && (
        <Button mode="contained" onPress={onRetry} style={styles.actionButton}>
          Retry
        </Button>
      )}
    </View>
  );
}

interface SkeletonProps {
  height?: number;
  width?: number | `${number}%`;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Pulsing placeholder block. */
export function Skeleton({ height = 20, width = '100%', borderRadius = 8, style }: SkeletonProps) {
  useAppTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.skeleton, { height, width, borderRadius, opacity }, style]} />;
}

/** Placeholder shaped like RecipeCard. */
export function RecipeCardSkeleton() {
  useAppTheme();
  return (
    <View style={styles.skeletonCard}>
      <Skeleton height={180} borderRadius={0} />
      <View style={styles.skeletonBody}>
        <Skeleton height={18} width="70%" />
        <Skeleton height={12} width="90%" style={styles.skeletonGap} />
        <Skeleton height={12} width="50%" style={styles.skeletonGap} />
      </View>
    </View>
  );
}

/** Placeholder grid shaped like the Home / Search recipe cards. */
export function RecipeGridSkeleton({ count = 6, columns = 3 }: { count?: number; columns?: number }) {
  useAppTheme();
  return (
    <View style={styles.gridSkeleton}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ width: `${100 / columns}%`, padding: 8 }}>
          <View style={styles.gridSkelCard}>
            <Skeleton height={20} width="70%" />
            <Skeleton height={14} width="45%" style={{ marginTop: 8, marginBottom: 12 }} />
            <Skeleton height={170} borderRadius={18} />
            <Skeleton height={14} width="60%" style={{ marginTop: 14 }} />
            <Skeleton height={44} borderRadius={22} style={{ marginTop: 14 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function RecipeListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }, (_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = createStyles({
  screen: { flex: 1, backgroundColor: '#FEF9FB' },
  screenInner: { flex: 1, position: 'relative' },
  gridWrapper: { position: 'relative', flex: 1 },
  gridPressable: { borderRadius: 24 },
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E3C7D1',
    shadowColor: '#5A0F2E',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  gridTitle: { fontSize: 18, fontWeight: '800', color: '#2A2124', lineHeight: 24, marginTop: 12, paddingHorizontal: 4 },
  gridImageWrap: { position: 'relative', width: '100%', aspectRatio: 1.2, borderRadius: 18, overflow: 'hidden', backgroundColor: '#EDD8E0', alignItems: 'center', justifyContent: 'center' },
  gridImagePlaceholder: { position: 'absolute' },
  gridImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  gridRating: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  gridRatingText: { fontSize: 12, fontWeight: '700', color: '#3C252D' },
  gridMetaRow: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 4, columnGap: 8, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, marginTop: 10, marginBottom: 12 },
  gridDifficulty: { fontSize: 12, fontWeight: '700' },
  gridButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2124',
    borderRadius: 26,
    paddingLeft: 20,
    paddingRight: 6,
    height: 48,
  },
  gridButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  gridButtonIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  gridFavorite: { position: 'absolute', top: 20, left: 20, margin: 0 },
  carousel: { position: 'relative', overflow: 'hidden', backgroundColor: '#3C252D' },
  carouselImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  carouselCaption: { position: 'absolute', right: 20, bottom: 32, maxWidth: 340, alignItems: 'flex-end', backgroundColor: 'rgba(28,8,20,0.55)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
  carouselTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', textAlign: 'right', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  carouselSub: { color: 'rgba(255,255,255,0.92)', fontSize: 13, marginTop: 2, textAlign: 'right', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  carouselDots: { position: 'absolute', left: 0, right: 20, bottom: 10, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
  carouselDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  carouselDotActive: { width: 20, backgroundColor: '#FFFFFF' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  pill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pillDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  pillText: { fontSize: 12, fontWeight: '700' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cuisineLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: '#D81B60', marginBottom: 2 },
  cardWrapper: { marginBottom: 16, position: 'relative' },
  cardPressable: { borderRadius: 20 },
  card: { borderRadius: 20, backgroundColor: '#FFFFFF' },
  cardClip: { borderRadius: 20, overflow: 'hidden' },
  imageContainer: { position: 'relative', height: 200 },
  recipeImage: { width: '100%', height: '100%' },
  imageShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 60, backgroundColor: 'rgba(0,0,0,0.18)' },
  difficultyBadge: { position: 'absolute', top: 12, right: 12 },
  favoriteButton: { position: 'absolute', top: 6, left: 6, margin: 0 },
  ratingBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  ratingBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  ratingBadgeCount: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  cardContent: { padding: 16 },
  recipeTitle: { fontSize: 19, fontWeight: '800', color: '#3C252D', marginBottom: 10 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 12 },
  metaText: { fontSize: 13, color: '#6A4452', fontWeight: '500' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  mealTag: { backgroundColor: '#FDE7EF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  mealTagText: { fontSize: 12, fontWeight: '600', color: '#D81B60' },
  listItemWrapper: { marginBottom: 12, position: 'relative' },
  listPressable: { borderRadius: 16 },
  listCard: { borderRadius: 16, backgroundColor: '#FFFFFF', borderLeftWidth: 4, borderLeftColor: '#D81B60' },
  listRow: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  listImageWrap: { position: 'relative', marginRight: 12 },
  listImage: { width: 92, height: 92, borderRadius: 14 },
  listRating: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  listRatingText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  listInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  listInfoWithAction: { paddingRight: 40 },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#3C252D' },
  listMetaRow: { flexDirection: 'row', gap: 12 },
  listFavoriteButton: { position: 'absolute', top: 2, right: 2, margin: 0, backgroundColor: 'transparent' },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChipSelected: { backgroundColor: '#D81B60', borderColor: '#D81B60' },
  categoryChipText: { fontSize: 13, fontWeight: '500', color: '#D81B60' },
  categoryChipTextSelected: { color: '#FFFFFF' },
  chipIcon: { marginRight: 4 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 100,
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#8A6673' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 48 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#3C252D', marginTop: 20, textAlign: 'center' },
  emptyMessage: { fontSize: 16, color: '#8A6673', marginTop: 8, textAlign: 'center' },
  actionButton: { marginTop: 24, borderRadius: 12 },
  skeleton: { backgroundColor: '#E8D5DC' },
  gridSkeleton: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
  gridSkelCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 14, borderWidth: 1, borderColor: '#E9CED8' },
  skeletonCard: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFFFFF', marginBottom: 12 },
  skeletonBody: { padding: 16 },
  skeletonGap: { marginTop: 10 },
});

export { ErrorBoundary } from './ErrorBoundary';

/* ------------------------------------------------------------------ */
/* Pop-ups: one look for every confirm dialog, snackbar and menu       */
/* ------------------------------------------------------------------ */

/** Rounded snackbar look shared by every screen (dark brown pill with white text). */
export const snackbarStyle = { borderRadius: 16, backgroundColor: '#381522', marginHorizontal: 16 } as const;

/** Menu panel look (rounded white card) for Paper `Menu` via `contentStyle`. */
const popupMenu = createStyles({
  menu: { borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EED6DF' },
});
export const menuContentStyle = popupMenu.menu;

/** Friendly confirm pop-up: round icon, centered title + message, two big buttons. */
export function ConfirmDialog({
  visible,
  onDismiss,
  onConfirm,
  title,
  message,
  icon = 'help-circle-outline',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
}: {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  icon?: IconName;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}) {
  useAppTheme();
  const accent = destructive ? '#C62828' : '#D81B60';
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={popup.dialog}>
        <View style={popup.body}>
          <View style={[popup.iconCircle, destructive ? popup.iconCircleDanger : popup.iconCircleWarm]}>
            <MaterialCommunityIcons name={icon} size={32} color={accent} />
          </View>
          <Text style={popup.title}>{title}</Text>
          <Text style={popup.message}>{message}</Text>
          <View style={popup.actions}>
            <Pressable
              onPress={onDismiss}
              accessibilityRole="button"
              style={({ pressed }) => [popup.button, popup.cancel, pressed && popup.pressed]}
            >
              <Text style={popup.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              style={({ pressed }) => [popup.button, { backgroundColor: accent }, pressed && popup.pressed]}
            >
              <Text style={popup.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </Dialog>
    </Portal>
  );
}

const popup = createStyles({
  dialog: {
    alignSelf: 'center',
    width: '92%',
    maxWidth: 400,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EED6DF',
  },
  body: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 },
  iconCircle: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  iconCircleWarm: { backgroundColor: '#FDE7EF' },
  iconCircleDanger: { backgroundColor: '#FDECEA' },
  title: { fontSize: 22, fontWeight: '800', color: '#2A2124', textAlign: 'center' },
  message: { fontSize: 15, lineHeight: 22, color: '#6A4452', textAlign: 'center', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24, alignSelf: 'stretch' },
  button: { flex: 1, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E5C7D2' },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#3C252D' },
  confirmText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});