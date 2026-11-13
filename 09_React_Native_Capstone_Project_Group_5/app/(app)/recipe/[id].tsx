/**
 * Recipe Detail Screen
 * Hero with title + photo, quick facts, summary, ingredients (checkable), nutrition,
 * numbered instructions, related recipes, favorite and share.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Image,
    Platform,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFavorites } from '@/context/FavoritesContext';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';
import { formatMinutes, hasMealType, mealTypesOf, totalTime } from '@/utils/recipeFilters';
import { scaleIngredient, scaleIngredientParts } from '@/utils/cooking';
import { routes } from '@/utils/routes';
import { BackButton, DIFFICULTY_FG, ErrorState, RecipeGridCard, Skeleton } from '@/components';
import { SectionTitle, Fact, Stars, NutritionRow } from '@/components/RecipeDetailParts';
import { createStyles, tc, useAppTheme } from '@/context/ThemeContext';





const MAX_SERVINGS = 24;

export default function RecipeDetailScreen() {
    useAppTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const recipeId = Number(id);
    const { isFavorite, toggleFavorite } = useFavorites();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isWide = width >= 900; // desktop / tablet: side-by-side columns
    const relatedColumns = width >= 900 ? 3 : width >= 600 ? 2 : 1;

    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [all, setAll] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [checked, setChecked] = useState<Set<number>>(new Set());
    // Serving size calculator: the recipe's own amounts are the "original"; everything scales from them
    const [servings, setServings] = useState(1);
    const bump = useRef(new Animated.Value(1)).current;
    const scrollRef = useRef<ScrollView>(null);
    const appear = useRef(new Animated.Value(0)).current;

    const load = useCallback(async () => {
        if (!Number.isFinite(recipeId)) {
            setError('Invalid recipe');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            setChecked(new Set());
            setRecipe(await recipeApi.getRecipeById(recipeId));
            recipeApi
                .getAllRecipes()
                .then(setAll)
                .catch(() => setAll([]));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load recipe');
        } finally {
            setLoading(false);
        }
    }, [recipeId]);

    useEffect(() => {
        load();
    }, [load]);

    // Start every recipe at its original number of servings
    useEffect(() => {
        if (recipe) setServings(recipe.servings);
    }, [recipe]);

    // Little pop on the serving number whenever it changes
    useEffect(() => {
        bump.setValue(1.22);
        Animated.spring(bump, { toValue: 1, friction: 5, tension: 160, useNativeDriver: true }).start();
    }, [servings, bump]);

    // Related: same cuisine first, then same meal type, best rated first
    const related = useMemo(() => {
        if (!recipe) return [];
        const score = (r: Recipe) =>
            (r.cuisine === recipe.cuisine ? 2 : 0) + (mealTypesOf(r).some((m) => hasMealType(recipe, m)) ? 1 : 0);
        return all
            .filter((r) => r.id !== recipe.id && score(r) > 0)
            .sort((a, b) => score(b) - score(a) || b.rating - a.rating)
            .slice(0, 3);
    }, [all, recipe]);

    // Previous / next recipe (in id order, wrapping around at the ends)
    const neighbors = useMemo(() => {
        if (!recipe || all.length < 2) return null;
        const sorted = [...all].sort((a, b) => a.id - b.id);
        const i = sorted.findIndex((r) => r.id === recipe.id);
        if (i < 0) return null;
        return {
            prev: sorted[(i - 1 + sorted.length) % sorted.length],
            next: sorted[(i + 1) % sorted.length],
        };
    }, [all, recipe]);

    const openRecipe = useCallback(
        (r: Recipe) => {
            // replace (not push) so Back still returns to the list you came from
            router.replace(routes.recipe(r.id));
        },
        [router]
    );

    // Start each recipe from the top
    useEffect(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [recipeId]);

    // Fade the page in whenever a (new) recipe has loaded
    const loadedId = recipe?.id;
    useEffect(() => {
        if (loadedId === undefined) return;
        appear.setValue(0);
        Animated.timing(appear, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }, [loadedId, appear]);

    // Keyboard: arrow keys switch recipe (web)
    useEffect(() => {
        if (Platform.OS !== 'web' || !neighbors) return;
        // React Native's TypeScript setup has no DOM types, so describe the tiny part of `document` we use.
        type KeyEvent = { key: string };
        type WebDoc = {
            addEventListener: (type: 'keydown', fn: (e: KeyEvent) => void) => void;
            removeEventListener: (type: 'keydown', fn: (e: KeyEvent) => void) => void;
        };
        const doc = (globalThis as unknown as { document?: WebDoc }).document;
        if (!doc) return;
        const onKey = (e: KeyEvent) => {
            if (e.key === 'ArrowLeft') openRecipe(neighbors.prev);
            if (e.key === 'ArrowRight') openRecipe(neighbors.next);
        };
        doc.addEventListener('keydown', onKey);
        return () => doc.removeEventListener('keydown', onKey);
    }, [neighbors, openRecipe]);

    const toggleIngredient = (index: number) =>
        setChecked((prev) => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });

    const factor = recipe && recipe.servings > 0 ? servings / recipe.servings : 1;

    const handleShare = async () => {
        if (!recipe) return;
        try {
            await Share.share({
                message: `${recipe.name} (${recipe.cuisine}, ${formatMinutes(totalTime(recipe))})\n\nIngredients (for ${servings} ${servings === 1 ? 'serving' : 'servings'}):\n${recipe.ingredients
                    .map((i) => `• ${scaleIngredient(i, factor)}`)
                    .join('\n')}`,
            });
        } catch {
            // Sharing cancelled or unavailable
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={[styles.page, { paddingTop: insets.top + 8 }]}>
                    <View style={styles.topBar}>
                        <BackButton light />
                    </View>
                    <Skeleton height={isWide ? 400 : 330} borderRadius={28} />
                    <View style={styles.skelFacts}>
                        {[0, 1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} width={isWide ? 150 : 110} height={42} borderRadius={21} />
                        ))}
                    </View>
                    <Skeleton height={16} width="90%" />
                    <Skeleton height={16} width="75%" style={{ marginTop: 10 }} />
                    <Skeleton height={16} width="55%" style={{ marginTop: 10 }} />
                    <View style={[styles.twoCol, isWide && styles.twoColWide]}>
                        <View style={[styles.skelPanel, isWide && styles.panelGrow]}>
                            <Skeleton height={24} width="40%" />
                            {[0, 1, 2, 3].map((i) => (
                                <Skeleton key={i} height={16} width={`${80 - i * 8}%`} style={{ marginTop: 14 }} />
                            ))}
                        </View>
                        <View style={[styles.skelPanel, isWide && styles.nutritionWide]}>
                            <Skeleton height={24} width="60%" />
                            {[0, 1, 2].map((i) => (
                                <Skeleton key={i} height={16} style={{ marginTop: 14 }} />
                            ))}
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    if (error || !recipe) {
        return (
            <View style={styles.center}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={[styles.floatingBack, { top: insets.top + 8 }]}>
                    <BackButton light />
                </View>
                <ErrorState message={error ?? 'Recipe not found'} onRetry={load} />
            </View>
        );
    }

    const favorite = isFavorite(recipe.id);
    const words = recipe.name.split(' ');
    const accentIndex = words.length > 1 ? 1 : 0;
    const summary =
        `${recipe.name} is a ${recipe.difficulty.toLowerCase()} ${recipe.cuisine} ` +
        `${recipe.mealType[0]?.toLowerCase() ?? 'dish'} that is ready in ${formatMinutes(totalTime(recipe))}. ` +
        `It serves ${servings} at ${recipe.caloriesPerServing} calories a serving and is built around ` +
        `${recipe.ingredients
            .slice(0, 3)
            .map((i) => i.toLowerCase())
            .join(', ')}.`;

    // Quick picks relative to the original recipe (duplicates removed, "Original" wins)
    const presets = (() => {
        const seen = new Set<number>();
        return [
            { label: 'Original', target: recipe.servings },
            { label: 'Half', target: Math.max(1, Math.round(recipe.servings / 2)) },
            { label: 'Double', target: recipe.servings * 2 },
            { label: 'Triple', target: recipe.servings * 3 },
        ]
            .filter((p) => p.target <= MAX_SERVINGS && !seen.has(p.target) && seen.add(p.target))
            .sort((x, y) => x.target - y.target);
    })();
    const changed = servings !== recipe.servings;
    const scaledCount = recipe.ingredients.filter((i) => scaleIngredientParts(i, 2).scalable).length;

    const ingredientsCard = (
        <View style={[styles.panel, isWide && styles.panelGrow]}>
            <Text style={styles.panelTitle}>Ingredients</Text>

            {/* Serving size calculator */}
            <View style={styles.calc}>
                <View style={styles.calcTop}>
                    <View style={styles.calcIcon}>
                        <MaterialCommunityIcons name="account-group-outline" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.calcInfo}>
                        <Text style={styles.calcTitle}>Serving size</Text>
                        <Text style={styles.calcSub}>
                            {changed ? `Scaled ×${Number(factor.toFixed(2))} from ${recipe.servings}` : `Original recipe makes ${recipe.servings}`}
                        </Text>
                    </View>
                    <View style={styles.stepper}>
                        <Pressable
                            onPress={() => setServings((s) => Math.max(1, s - 1))}
                            disabled={servings <= 1}
                            accessibilityRole="button"
                            accessibilityLabel="Fewer servings"
                            style={({ pressed }) => [styles.stepBtn, servings <= 1 && styles.stepBtnOff, pressed && styles.stepBtnPressed]}
                        >
                            <MaterialCommunityIcons name="minus" size={22} color={servings <= 1 ? tc('#BCAAA4') : '#E85D04'} />
                        </Pressable>
                        <Animated.View style={[styles.stepValue, { transform: [{ scale: bump }] }]}>
                            <Text style={styles.stepNumber2} accessibilityLiveRegion="polite">
                                {servings}
                            </Text>
                            <Text style={styles.stepUnit}>{servings === 1 ? 'serving' : 'servings'}</Text>
                        </Animated.View>
                        <Pressable
                            onPress={() => setServings((s) => Math.min(MAX_SERVINGS, s + 1))}
                            disabled={servings >= MAX_SERVINGS}
                            accessibilityRole="button"
                            accessibilityLabel="More servings"
                            style={({ pressed }) => [styles.stepBtn, styles.stepBtnOn, servings >= MAX_SERVINGS && styles.stepBtnOff, pressed && styles.stepBtnPressed]}
                        >
                            <MaterialCommunityIcons name="plus" size={22} color={servings >= MAX_SERVINGS ? tc('#BCAAA4') : '#FFFFFF'} />
                        </Pressable>
                    </View>
                </View>
                <View style={styles.presetRow}>
                    {presets.map((p) => {
                        const active = p.target === servings;
                        return (
                            <Pressable
                                key={p.label}
                                onPress={() => setServings(p.target)}
                                accessibilityRole="button"
                                accessibilityState={{ selected: active }}
                                style={[styles.preset, active && styles.presetActive]}
                            >
                                <Text style={[styles.presetText, active && styles.presetTextActive]}>
                                    {p.label} · {p.target}
                                </Text>
                            </Pressable>
                        );
                    })}
                    {changed && (
                        <Pressable onPress={() => setServings(recipe.servings)} accessibilityRole="button" style={styles.resetBtn}>
                            <MaterialCommunityIcons name="restore" size={15} color="#E85D04" />
                            <Text style={styles.resetText}>Reset</Text>
                        </Pressable>
                    )}
                </View>
            </View>

            <View style={styles.ingredientGrid}>
                {recipe.ingredients.map((item, index) => {
                    const parts = scaleIngredientParts(item, factor);
                    const done = checked.has(index);
                    return (
                        <View key={`${item}-${index}`} style={[styles.ingredientCell, isWide && styles.ingredientCellHalf]}>
                            <Pressable
                                onPress={() => toggleIngredient(index)}
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: done }}
                                style={({ pressed }) => [styles.ingredientRow, pressed && styles.stepBtnPressed]}
                            >
                                <MaterialCommunityIcons
                                    name={done ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                                    size={22}
                                    color={done ? '#43A047' : tc('#BCAAA4')}
                                />
                                <Text style={[styles.ingredientLabel, done && styles.ingredientDone]}>
                                    {parts.scalable ? (
                                        <>
                                            <Text style={[styles.ingredientQty, changed && !done && styles.ingredientQtyChanged]}>{parts.quantity}</Text>
                                            {parts.rest}
                                        </>
                                    ) : (
                                        item
                                    )}
                                </Text>
                            </Pressable>
                        </View>
                    );
                })}
            </View>
            <Text style={styles.calcNote}>
                {scaledCount === 0
                    ? 'This recipe lists no exact amounts, so ingredients stay as written.'
                    : scaledCount < recipe.ingredients.length
                        ? `${scaledCount} of ${recipe.ingredients.length} ingredients have amounts that scale. Items like "to taste" stay the same.`
                        : 'All amounts update as you change the servings.'}
            </Text>
        </View>
    );

    const nutritionCard = (
        <View style={[styles.panel, styles.panelSoft, isWide && styles.nutritionWide]}>
            <Text style={styles.panelTitle}>Nutritional Info</Text>
            <NutritionRow
                label="Servings"
                value={`${servings}`}
                changed={changed}
                note={changed ? `Recipe makes ${recipe.servings}` : undefined}
            />
            <NutritionRow label="Calories / serving" value={`${recipe.caloriesPerServing}`} note="Same for every portion" />
            <NutritionRow
                label="Whole recipe"
                value={`${(recipe.caloriesPerServing * servings).toLocaleString()} cal`}
                changed={changed}
                note={`${servings} × ${recipe.caloriesPerServing} cal`}
            />
            <NutritionRow label="Prep time" value={formatMinutes(recipe.prepTimeMinutes)} />
            <NutritionRow label="Cook time" value={formatMinutes(recipe.cookTimeMinutes)} last />
        </View>
    );

    const steps = (
        <View style={styles.stepsCol}>
            {recipe.instructions.map((step, index) => (
                <View key={index} style={styles.stepCard}>
                    <Text style={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</Text>
                    <Text style={styles.stepText}>{step}</Text>
                </View>
            ))}
        </View>
    );

    const promo = (
        <Pressable
            onPress={() => router.push(routes.cooking(recipe.id))}
            style={[styles.promo, isWide ? styles.promoWide : styles.promoNarrow]}
            accessibilityRole="button"
            accessibilityLabel="Start cooking mode"
        >
            <Image source={{ uri: recipe.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={styles.promoShade} />
            <View style={styles.promoBody}>
                <Text style={styles.promoTitle}>Let&apos;s Get{'\n'}into Cooking!</Text>
                <View style={styles.darkButton}>
                    <Text style={styles.darkButtonText}>Start Cooking Mode</Text>
                    <View style={styles.darkButtonIcon}>
                        <MaterialCommunityIcons name="play" size={18} color={tc('#3E2723')} />
                    </View>
                </View>
            </View>
        </Pressable>
    );

    return (
        <View style={styles.container}>
            {/* We draw our own header, so the native one is hidden */}
            <Stack.Screen options={{ headerShown: false }} />
            <Animated.View
                style={{
                    flex: 1,
                    opacity: appear,
                    transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
                }}
            >
                <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={[styles.page, { paddingTop: insets.top + 8 }]}>
                        {/* Top bar */}
                        <View style={styles.topBar}>
                            <BackButton light />
                            <Text style={styles.crumb} numberOfLines={1}>
                                Recipes › {recipe.cuisine}
                            </Text>
                        </View>

                        {/* Hero: title on the left, photo on the right */}
                        <View style={[styles.hero, isWide && styles.heroWide]}>
                            <View style={[styles.heroText, isWide && styles.heroTextWide]}>
                                <Text style={styles.letsCook}>Let&apos;s Cook</Text>
                                <Text style={[styles.title, isWide && styles.titleWide]}>
                                    {words.map((w, i) => (
                                        <Text key={`${w}-${i}`} style={i === accentIndex ? styles.accent : undefined}>
                                            {w}
                                            {i < words.length - 1 ? ' ' : ''}
                                        </Text>
                                    ))}
                                </Text>
                            </View>
                            <View style={[styles.heroImageWrap, isWide ? styles.heroImageWide : styles.heroImageNarrow]}>
                                <Image source={{ uri: recipe.image }} style={styles.heroImage} resizeMode="cover" />
                                <IconButton
                                    icon={favorite ? 'heart' : 'heart-outline'}
                                    size={22}
                                    iconColor={favorite ? '#E53935' : tc('#3E2723')}
                                    containerColor={tc('rgba(255,255,255,0.95)', 'containerColor')}
                                    style={styles.heroHeart}
                                    onPress={() => toggleFavorite(recipe.id)}
                                    accessibilityLabel={favorite ? 'Remove from favorites' : 'Add to favorites'}
                                />
                            </View>

                            {/* Previous / next recipe */}
                            {neighbors && (
                                <>
                                    <Pressable
                                        onPress={() => openRecipe(neighbors.prev)}
                                        style={[styles.sideButton, styles.sideLeft, isWide ? styles.sideCenter : styles.sideLow]}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Previous recipe: ${neighbors.prev.name}`}
                                    >
                                        <MaterialCommunityIcons name="chevron-left" size={30} color={tc('#2B2320')} />
                                    </Pressable>
                                    <Pressable
                                        onPress={() => openRecipe(neighbors.next)}
                                        style={[styles.sideButton, styles.sideRight, isWide ? styles.sideCenter : styles.sideLow]}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Next recipe: ${neighbors.next.name}`}
                                    >
                                        <MaterialCommunityIcons name="chevron-right" size={30} color={tc('#2B2320')} />
                                    </Pressable>
                                </>
                            )}
                        </View>

                        {/* Quick facts */}
                        <View style={styles.factsRow}>
                            <Fact icon="earth" label="Cuisine" value={recipe.cuisine} />
                            <Fact icon="account-outline" label="Servings" value={`${servings} ${servings === 1 ? 'Person' : 'Persons'}`} />
                            <Fact icon="clock-outline" label="Prep Time" value={formatMinutes(recipe.prepTimeMinutes)} />
                            <Fact icon="pot-steam-outline" label="Cook Time" value={formatMinutes(recipe.cookTimeMinutes)} />
                            <Fact icon="star-outline" label="Difficulty" value={recipe.difficulty} />
                        </View>

                        {/* Summary + rating card */}
                        <View style={[styles.summaryRow, isWide && styles.summaryRowWide]}>
                            <View style={styles.summaryText}>
                                <Text style={styles.summary}>{summary}</Text>
                                {recipe.tags.length > 0 && (
                                    <View style={styles.tagsBlock}>
                                        <Text style={styles.tagsLabel}>Tags</Text>
                                        <Text style={styles.tagsList}>{recipe.tags.join(', ')}</Text>
                                    </View>
                                )}
                                <View style={styles.actionsRow}>
                                    <Pressable
                                        onPress={handleShare}
                                        style={styles.darkButtonInline}
                                        accessibilityRole="button"
                                        accessibilityLabel="Share recipe"
                                    >
                                        <Text style={styles.darkButtonText}>Share Recipe</Text>
                                        <View style={styles.darkButtonIcon}>
                                            <MaterialCommunityIcons name="share-variant" size={16} color={tc('#3E2723')} />
                                        </View>
                                    </Pressable>
                                </View>
                            </View>
                            <View style={[styles.ratingCard, isWide && styles.ratingCardWide]}>
                                <Text style={styles.ratingScore}>{recipe.rating.toFixed(1)}</Text>
                                <Stars rating={recipe.rating} />
                                <Text style={styles.ratingCount}>{recipe.reviewCount} reviews</Text>
                                <Text style={[styles.ratingLevel, { color: tc(DIFFICULTY_FG[recipe.difficulty]) }]}>
                                    {recipe.difficulty} level
                                </Text>
                            </View>
                        </View>

                        {/* Ingredients + nutrition */}
                        <View style={[styles.twoCol, isWide && styles.twoColWide]}>
                            {ingredientsCard}
                            {nutritionCard}
                        </View>

                        {/* Instructions + promo card */}
                        <SectionTitle first="Cooking" accent="Instructions" />
                        <View style={[styles.twoCol, isWide && styles.twoColWide]}>
                            {steps}
                            {promo}
                        </View>

                        {/* Related recipes */}
                        {related.length > 0 && (
                            <>
                                <View style={styles.relatedHeader}>
                                    <SectionTitle first="Related" accent="Recipes" />
                                    <Pressable
                                        onPress={() => router.push(routes.search())}
                                        style={styles.outlineButton}
                                        accessibilityRole="button"
                                    >
                                        <Text style={styles.outlineButtonText}>See All Recipes</Text>
                                    </Pressable>
                                </View>
                                <View style={styles.relatedGrid}>
                                    {related.map((r) => (
                                        <View key={r.id} style={[styles.relatedCell, { width: `${100 / relatedColumns}%` }]}>
                                            <RecipeGridCard
                                                recipe={r}
                                                onPress={() => router.push(routes.recipe(r.id))}
                                                isFavorite={isFavorite(r.id)}
                                                onToggleFavorite={() => toggleFavorite(r.id)}
                                            />
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}
                    </View>
                </ScrollView>
            </Animated.View>
        </View>
    );
}

const styles = createStyles({
    container: { flex: 1, backgroundColor: '#FFFDF8' },
    scrollContent: { paddingBottom: 80 },
    page: { width: '100%', maxWidth: 1240, alignSelf: 'center', paddingHorizontal: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFDF8' },
    floatingBack: { position: 'absolute', left: 8, zIndex: 10 },
    accent: { color: '#E85D04' },
    topBar: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8, marginLeft: -8 },
    crumb: { flex: 1, fontSize: 13, color: '#8D6E63' },
    hero: { backgroundColor: '#F6F1EA', borderRadius: 28, overflow: 'hidden' },
    heroWide: { flexDirection: 'row', alignItems: 'stretch', minHeight: 320 },
    heroText: { padding: 24, paddingBottom: 8 },
    heroTextWide: { flex: 1, justifyContent: 'center', padding: 40 },
    letsCook: { fontSize: 15, color: '#6D4C41', marginBottom: 6 },
    title: { fontSize: 34, fontWeight: '800', color: '#2B2320', lineHeight: 42 },
    titleWide: { fontSize: 52, lineHeight: 62 },
    heroImageWrap: { position: 'relative', backgroundColor: '#EFEBE9' },
    heroImageWide: { width: '55%' },
    heroImageNarrow: { width: '100%', height: 240 },
    heroImage: { width: '100%', height: '100%' },
    sideButton: {
        position: 'absolute',
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 5,
        zIndex: 5,
    },
    sideLeft: { left: 12 },
    sideRight: { right: 12 },
    sideCenter: { top: '50%', marginTop: -24 },
    sideLow: { bottom: 96 },
    heroHeart: { position: 'absolute', top: 12, right: 12, margin: 0 },
    factsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, paddingVertical: 24, paddingHorizontal: 8 },
    summaryRow: { gap: 16 },
    summaryRowWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 32 },
    summaryText: { flex: 1 },
    summary: { fontSize: 15, lineHeight: 24, color: '#4E342E' },
    tagsBlock: { marginTop: 16 },
    tagsLabel: { fontSize: 12, color: '#8D6E63', marginBottom: 2 },
    tagsList: { fontSize: 13, fontWeight: '600', color: '#E85D04' },
    actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
    ratingCard: {
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFE9C7',
        borderRadius: 22,
        paddingVertical: 20,
        paddingHorizontal: 24,
    },
    ratingCardWide: { width: 260 },
    ratingScore: { fontSize: 44, fontWeight: '800', color: '#2B2320' },
    ratingCount: { fontSize: 13, color: '#6D4C41', marginTop: 2 },
    ratingLevel: { fontSize: 13, fontWeight: '700' },
    darkButtonInline: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#2B2320',
        borderRadius: 26,
        paddingLeft: 20,
        paddingRight: 6,
        height: 46,
    },
    darkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#2B2320',
        borderRadius: 26,
        paddingLeft: 20,
        paddingRight: 6,
        height: 46,
        marginTop: 14,
    },
    darkButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
    darkButtonIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    outlineButton: { borderWidth: 1, borderColor: '#2B2320', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
    outlineButtonText: { fontSize: 13, fontWeight: '600', color: '#2B2320' },
    twoCol: { gap: 16, marginTop: 28 },
    twoColWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 },
    panel: {
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F0E6DC',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    panelSoft: { backgroundColor: '#F6F1EA', shadowOpacity: 0, elevation: 0 },
    panelGrow: { flex: 1 },
    nutritionWide: { width: 300 },
    panelTitle: { fontSize: 19, fontWeight: '800', color: '#2B2320', marginBottom: 10 },
    ingredientGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    ingredientCell: { width: '100%' },
    ingredientCellHalf: { width: '50%' },
    ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingRight: 8 },
    ingredientLabel: { flex: 1, textAlign: 'left', fontSize: 14.5, lineHeight: 20, color: '#3E2723' },
    ingredientQty: { fontWeight: '800', color: '#2B2320' },
    ingredientQtyChanged: { color: '#E85D04' },
    calc: { backgroundColor: '#FFF3E0', borderRadius: 20, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#F3E5D8' },
    calcTop: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
    calcIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#E85D04', alignItems: 'center', justifyContent: 'center' },
    calcInfo: { flex: 1, minWidth: 130 },
    calcTitle: { fontSize: 16, fontWeight: '800', color: '#2B2320' },
    calcSub: { fontSize: 12.5, color: '#8D6E63', marginTop: 2 },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', borderRadius: 26, padding: 5, borderWidth: 1, borderColor: '#F3E5D8' },
    stepBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF3E0' },
    stepBtnOn: { backgroundColor: '#E85D04' },
    stepBtnOff: { opacity: 0.5 },
    stepBtnPressed: { opacity: 0.8 },
    stepValue: { minWidth: 70, alignItems: 'center' },
    stepNumber2: { fontSize: 24, fontWeight: '800', color: '#2B2320', lineHeight: 28 },
    stepUnit: { fontSize: 11, fontWeight: '600', color: '#8D6E63' },
    presetRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 12 },
    preset: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6D6C4' },
    presetActive: { backgroundColor: '#E85D04', borderColor: '#E85D04' },
    presetText: { fontSize: 12.5, fontWeight: '700', color: '#5D4037' },
    presetTextActive: { color: '#FFFFFF' },
    resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto', paddingHorizontal: 6 },
    resetText: { fontSize: 12.5, fontWeight: '700', color: '#E85D04' },
    calcNote: { fontSize: 12, color: '#8D6E63', marginTop: 12, lineHeight: 17 },
    ingredientDone: { textDecorationLine: 'line-through', color: '#BCAAA4' },
    stepsCol: { flex: 1, gap: 12, alignSelf: 'stretch' },
    stepCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
        backgroundColor: '#F6F1EA',
        borderRadius: 18,
        paddingVertical: 18,
        paddingHorizontal: 20,
    },
    stepNumber: { fontSize: 26, fontWeight: '800', color: '#E85D04', minWidth: 40 },
    stepText: { flex: 1, fontSize: 15, lineHeight: 23, color: '#3E2723' },
    promo: { borderRadius: 24, overflow: 'hidden', backgroundColor: '#3E2723', justifyContent: 'flex-end' },
    promoWide: { width: 300, minHeight: 380, alignSelf: 'stretch' },
    promoNarrow: { width: '100%', height: 280 },
    promoShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(30,15,5,0.45)' },
    promoBody: { padding: 20 },
    promoTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', lineHeight: 34 },
    skelFacts: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, paddingVertical: 24, paddingHorizontal: 8 },
    skelPanel: { backgroundColor: '#F6F1EA', borderRadius: 22, padding: 20 },
    relatedHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    relatedGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8, marginTop: 16 },
    relatedCell: { padding: 8 },
});