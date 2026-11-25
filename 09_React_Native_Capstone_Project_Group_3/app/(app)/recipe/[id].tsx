/**
 * Recipe Detail Screen - Cookbook
 * Route: /recipe/[id]
 *
 * - Big photo that shrinks into a header as you scroll (title fades in)
 * - Floating back / share / heart buttons over the photo
 * - Servings scaler (- 4 +) that rescales ingredient amounts
 * - Ingredients you can tick off while cooking
 * - Instructions as numbered cards, with a timer on steps that mention a time
 * - Start cooking mode, add to shopping list, meal plan or a collection
 * - Your own notes & star rating, "I cooked this" history
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, Share, StyleSheet, Text, TextInput as RNTextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, Checkbox, Dialog, Portal, Snackbar, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';
import { DayKey } from '@/types/cookbook';
import { DAYS, useCookbook } from '@/context/CookbookContext';
import { useAllRecipes } from '@/hooks/useRecipes';
import { FavoriteButton } from '@/components/FavoriteButton';
import { StepTimer } from '@/components/StepTimer';
import { EmptyState, IconName } from '@/components/CommonComponents';
import { fontFamily, makeStyles, photoOverlay, radius, spacing, useAppTheme } from '@/constants/theme';
import { parseDurationMinutes, scaleIngredient } from '@/utils/ingredients';
import { cookedSummary } from '@/utils/cookingStats';

const IMAGE_HEIGHT = 360;
const BAR_HEIGHT = 56;

export default function RecipeDetailScreen() {
  const styles = useStyles();
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = Number(id);

  const cookbook = useCookbook();
  const { byId } = useAllRecipes();

  const [recipe, setRecipe] = useState<Recipe | null>(byId.get(recipeId) ?? null);
  const [loading, setLoading] = useState(!recipe);
  const [error, setError] = useState<string | null>(null);

  const [servings, setServings] = useState(recipe?.servings ?? 4);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [rating, setRating] = useState(0);
  const [noteText, setNoteText] = useState('');
  const [message, setMessage] = useState<{ text: string; route?: string } | null>(null);
  const [dialog, setDialog] = useState<'plan' | 'collection' | null>(null);
  const [newCollection, setNewCollection] = useState('');

  const scrollY = useRef(new Animated.Value(0)).current;

  const loadRecipe = async () => {
    if (!Number.isInteger(recipeId) || recipeId <= 0) {
      setError('This recipe link is not valid.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setRecipe(await recipeApi.getRecipeById(recipeId));
    } catch {
      setError('Could not load this recipe. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!recipe) loadRecipe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  // When the recipe is ready: reset servings, remember it as recently viewed, load your note
  useEffect(() => {
    if (!recipe) return;
    setServings(recipe.servings);
    cookbook.addRecent(recipe.id);
    const note = cookbook.getNote(recipe.id);
    setRating(note?.rating ?? 0);
    setNoteText(note?.text ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe?.id]);

  const factor = recipe ? servings / recipe.servings : 1;
  const ingredients = useMemo(
    () => (recipe ? recipe.ingredients.map((line) => scaleIngredient(line, factor)) : []),
    [recipe, factor]
  );

  const header = <Stack.Screen options={{ headerShown: false }} />;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        {header}
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        {header}
        <EmptyState
          emoji="🥄"
          title="Recipe not found"
          message={error ?? 'We could not find this recipe.'}
          actionLabel="Try again"
          onAction={loadRecipe}
        />
        <Button onPress={() => router.back()} style={styles.backFallback}>
          Go back
        </Button>
      </View>
    );
  }

  const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
  const cooked = cookedSummary(cookbook.cooked, recipe.id);
  const savedNote = cookbook.getNote(recipe.id);
  const noteChanged = rating !== (savedNote?.rating ?? 0) || noteText.trim() !== (savedNote?.text ?? '');
  const inCollections = cookbook.collections.filter((c) => c.recipeIds.includes(recipe.id));

  // Photo moves slower than the page and zooms when you pull down
  const imageTranslate = scrollY.interpolate({
    inputRange: [-IMAGE_HEIGHT, 0, IMAGE_HEIGHT],
    outputRange: [-IMAGE_HEIGHT / 2, 0, IMAGE_HEIGHT * 0.45],
    extrapolateRight: 'clamp',
  });
  const imageScale = scrollY.interpolate({
    inputRange: [-IMAGE_HEIGHT, 0],
    outputRange: [2, 1],
    extrapolateRight: 'clamp',
  });
  // Solid header with the title fades in once the photo has scrolled away
  const barOpacity = scrollY.interpolate({
    inputRange: [IMAGE_HEIGHT - BAR_HEIGHT - insets.top - 80, IMAGE_HEIGHT - BAR_HEIGHT - insets.top],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const toggleIngredient = (index: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
    Haptics.selectionAsync().catch(() => {});
  };

  const changeServings = (delta: number) => {
    setServings((prev) => Math.min(24, Math.max(1, prev + delta)));
    Haptics.selectionAsync().catch(() => {});
  };

  const shareRecipe = async () => {
    const lines = [
      recipe.name,
      '',
      `⏱ ${totalTime} min · 🍽 ${servings} servings · ⭐ ${recipe.rating.toFixed(1)} · ${recipe.cuisine}`,
      '',
      'Ingredients:',
      ...ingredients.map((line) => `• ${line}`),
      '',
      'Shared from Cookbook',
    ];
    try {
      await Share.share({ title: recipe.name, message: lines.join('\n') });
    } catch {
      setMessage({ text: 'Could not open the share menu' });
    }
  };

  const addToShoppingList = () => {
    // Only add what you have not ticked off (ticked = you already have it)
    const needed = ingredients.filter((_, index) => !checked.has(index));
    cookbook.addToShoppingList(needed, recipe.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setMessage({ text: `Added ${needed.length} ingredients to your shopping list`, route: '/shopping-list' });
  };

  const addToPlan = (day: DayKey, label: string) => {
    cookbook.addToPlan(day, recipe.id);
    setDialog(null);
    setMessage({ text: `Planned for ${label}`, route: '/meal-plan' });
  };

  const createAndAdd = (name: string) => {
    if (!name.trim()) return;
    cookbook.createCollection(name, recipe.id);
    setNewCollection('');
    setMessage({ text: `Saved to "${name.trim()}"`, route: '/collections' });
  };

  const saveNote = () => {
    cookbook.saveNote(recipe.id, rating, noteText.trim());
    setMessage({ text: 'Your note is saved' });
  };

  const markCooked = () => {
    cookbook.markCooked(recipe.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setMessage({ text: 'Nice! Added to your cooking history 🎉' });
  };

  const stats: { icon: IconName; value: string; label: string }[] = [
    { icon: 'clock-outline', value: `${recipe.prepTimeMinutes}m`, label: 'Prep' },
    { icon: 'stove', value: `${recipe.cookTimeMinutes}m`, label: 'Cook' },
    { icon: 'fire', value: `${recipe.caloriesPerServing}`, label: 'kcal/serving' },
    { icon: 'chef-hat', value: recipe.difficulty, label: 'Level' },
  ];

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      {header}

      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <Animated.Image
          source={{ uri: recipe.image }}
          style={[styles.image, { transform: [{ translateY: imageTranslate }, { scale: imageScale }] }]}
          resizeMode="cover"
        />

        {/* Content sheet slides over the photo */}
        <View style={styles.sheet}>
          <Text style={styles.title}>{recipe.name}</Text>
          <View style={styles.ratingRow}>
            <MaterialCommunityIcons name="star" size={18} color={theme.colors.star} />
            <Text style={styles.ratingValue}>{recipe.rating.toFixed(1)}</Text>
            <Text style={styles.muted}>({recipe.reviewCount} reviews)</Text>
            <Text style={styles.muted}>·</Text>
            <Text style={styles.muted}>{recipe.cuisine}</Text>
            {cooked.count > 0 && (
              <>
                <Text style={styles.muted}>·</Text>
                <Text style={styles.cookedBadge}>Cooked {cooked.count}×</Text>
              </>
            )}
          </View>

          <View style={styles.pillRow}>
            {recipe.mealType.map((meal) => (
              <View key={meal} style={styles.pill}>
                <Text style={styles.pillText}>{meal}</Text>
              </View>
            ))}
            {inCollections.map((c) => (
              <View key={c.id} style={[styles.pill, styles.pillAccent]}>
                <MaterialCommunityIcons name="folder-heart-outline" size={13} color={theme.colors.primary} />
                <Text style={[styles.pillText, { color: theme.colors.primary }]}>{c.name}</Text>
              </View>
            ))}
          </View>

          {/* Quick stats */}
          <View style={styles.statsRow}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statTile}>
                <MaterialCommunityIcons name={stat.icon} size={22} color={theme.colors.primary} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Main actions */}
          <Button
            mode="contained"
            icon="chef-hat"
            style={styles.cookButton}
            contentStyle={styles.cookButtonContent}
            labelStyle={styles.cookButtonLabel}
            onPress={() => router.push({ pathname: '/cook/[id]', params: { id: String(recipe.id), servings: String(servings) } })}
          >
            Start cooking
          </Button>
          <View style={styles.actionRow}>
            <ActionButton icon="cart-plus" label="Shopping list" onPress={addToShoppingList} />
            <ActionButton icon="calendar-plus" label="Meal plan" onPress={() => setDialog('plan')} />
            <ActionButton icon="folder-plus-outline" label="Collection" onPress={() => setDialog('collection')} />
          </View>

          {/* Ingredients */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.stepper}>
              <Pressable style={styles.stepperButton} onPress={() => changeServings(-1)} accessibilityLabel="Fewer servings">
                <MaterialCommunityIcons name="minus" size={18} color={theme.colors.primary} />
              </Pressable>
              <Text style={styles.stepperValue}>{servings}</Text>
              <Pressable style={styles.stepperButton} onPress={() => changeServings(1)} accessibilityLabel="More servings">
                <MaterialCommunityIcons name="plus" size={18} color={theme.colors.primary} />
              </Pressable>
              <Text style={styles.stepperLabel}>servings</Text>
            </View>
          </View>
          <Text style={styles.helper}>
            {checked.size > 0
              ? `${checked.size} of ${ingredients.length} ticked off`
              : 'Tick off what you already have'}
          </Text>
          {ingredients.map((line, index) => {
            const done = checked.has(index);
            return (
              <Pressable
                key={`${index}-${recipe.ingredients[index]}`}
                style={styles.ingredientRow}
                onPress={() => toggleIngredient(index)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done }}
              >
                <MaterialCommunityIcons
                  name={done ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                  size={24}
                  color={done ? theme.colors.primary : theme.colors.outline}
                />
                <Text style={[styles.ingredientText, done && styles.ingredientDone]}>{line}</Text>
              </Pressable>
            );
          })}

          {/* Instructions */}
          <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Instructions</Text>
          {recipe.instructions.map((step, index) => {
            const minutes = parseDurationMinutes(step);
            return (
              <View key={`${index}-${step}`} style={styles.stepCard}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.stepText}>{step}</Text>
                  {minutes ? <StepTimer minutes={minutes} label={`Step ${index + 1}`} /> : null}
                </View>
              </View>
            );
          })}

          {/* Nutrition */}
          <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Nutrition</Text>
          <View style={styles.nutritionCard}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.caloriesPerServing}</Text>
              <Text style={styles.statLabel}>kcal per serving</Text>
            </View>
            <View style={styles.nutritionDivider} />
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.caloriesPerServing * servings}</Text>
              <Text style={styles.statLabel}>kcal for {servings} servings</Text>
            </View>
            <View style={styles.nutritionDivider} />
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{totalTime}</Text>
              <Text style={styles.statLabel}>minutes total</Text>
            </View>
          </View>

          {/* Your notes & rating */}
          <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Your notes</Text>
          <View style={styles.notesCard}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setRating(star === rating ? 0 : star)}
                  hitSlop={6}
                  accessibilityLabel={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <MaterialCommunityIcons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color={star <= rating ? theme.colors.star : theme.colors.outline}
                  />
                </Pressable>
              ))}
              <Text style={styles.ratingHint}>{rating ? `${rating}/5` : 'Your rating'}</Text>
            </View>
            <TextInput
              mode="outlined"
              placeholder='e.g. "Used less salt, great with rice"'
              value={noteText}
              onChangeText={setNoteText}
              multiline
              style={styles.noteInput}
            />
            <Button mode="contained-tonal" onPress={saveNote} disabled={!noteChanged} style={styles.noteButton}>
              Save note
            </Button>
          </View>

          <View style={styles.cookedCard}>
            <Text style={styles.cookedEmoji}>👩‍🍳</Text>
            <View style={styles.flex}>
              <Text style={styles.cookedTitle}>
                {cooked.count === 0 ? 'Made this dish?' : `You've cooked this ${cooked.count} time${cooked.count > 1 ? 's' : ''}`}
              </Text>
              {cooked.lastCookedAt && (
                <Text style={styles.muted}>Last time: {new Date(cooked.lastCookedAt).toLocaleDateString()}</Text>
              )}
            </View>
            <Button mode="contained" compact onPress={markCooked}>
              I cooked this
            </Button>
          </View>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Tags</Text>
              <View style={styles.pillRow}>
                {recipe.tags.map((tag) => (
                  <Pressable
                    key={tag}
                    style={styles.tagPill}
                    onPress={() => router.push({ pathname: '/search', params: { q: tag } })}
                  >
                    <Text style={styles.tagText}>#{tag}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>
      </Animated.ScrollView>

      {/* Solid header that fades in while scrolling */}
      <Animated.View
        pointerEvents="none"
        style={[styles.bar, { height: insets.top + BAR_HEIGHT, paddingTop: insets.top, opacity: barOpacity }]}
      >
        <Text style={styles.barTitle} numberOfLines={1}>
          {recipe.name}
        </Text>
      </Animated.View>

      {/* Floating buttons (always on top) */}
      <View style={[styles.floatingRow, { top: insets.top + 8 }]} pointerEvents="box-none">
        <Pressable style={styles.roundButton} onPress={() => router.back()} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={22} color={photoOverlay.text} />
        </Pressable>
        <View style={styles.floatingRight}>
          <Pressable style={styles.roundButton} onPress={shareRecipe} accessibilityLabel="Share recipe">
            <MaterialCommunityIcons name="share-variant" size={20} color={photoOverlay.text} />
          </Pressable>
          <FavoriteButton recipeId={recipe.id} size={22} />
        </View>
      </View>

      {/* Dialogs */}
      <Portal>
        <Dialog visible={dialog === 'plan'} onDismiss={() => setDialog(null)}>
          <Dialog.Title>Add to which day?</Dialog.Title>
          <Dialog.Content>
            {DAYS.map((day) => {
              const planned = cookbook.mealPlan[day.key].includes(recipe.id);
              return (
                <Pressable key={day.key} style={styles.dayRow} onPress={() => addToPlan(day.key, day.label)}>
                  <Text style={styles.dayText}>{day.label}</Text>
                  {planned && <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} />}
                </Pressable>
              );
            })}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialog(null)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={dialog === 'collection'} onDismiss={() => setDialog(null)}>
          <Dialog.Title>Save to collection</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScroll}>
            <Animated.ScrollView>
              {cookbook.collections.length === 0 && (
                <Text style={[styles.muted, styles.dialogHint]}>No collections yet. Create your first one below.</Text>
              )}
              {cookbook.collections.map((c) => (
                <Checkbox.Item
                  key={c.id}
                  label={`${c.name} (${c.recipeIds.length})`}
                  status={c.recipeIds.includes(recipe.id) ? 'checked' : 'unchecked'}
                  onPress={() => cookbook.toggleInCollection(c.id, recipe.id)}
                />
              ))}
              <View style={styles.newCollectionRow}>
                <RNTextInput
                  placeholder="New collection name"
                  placeholderTextColor={theme.colors.muted}
                  value={newCollection}
                  onChangeText={setNewCollection}
                  onSubmitEditing={() => createAndAdd(newCollection)}
                  style={styles.newCollectionInput}
                />
                <Button onPress={() => createAndAdd(newCollection)} disabled={!newCollection.trim()}>
                  Add
                </Button>
              </View>
              {cookbook.collections.length === 0 && (
                <View style={styles.pillRow}>
                  {['Date night', 'Meal prep', 'Party food'].map((name) => (
                    <Pressable key={name} style={styles.tagPill} onPress={() => createAndAdd(name)}>
                      <Text style={styles.tagText}>+ {name}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </Animated.ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialog(null)}>Done</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={message !== null}
        onDismiss={() => setMessage(null)}
        duration={2500}
        action={
          message?.route
            ? {
                label: 'View',
                onPress: () => {
                  const route = message.route;
                  setMessage(null);
                  if (route) router.push(route);
                },
              }
            : undefined
        }
      >
        {message?.text ?? ''}
      </Snackbar>
    </View>
  );
}

function ActionButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const styles = useStyles();
  const theme = useAppTheme();
  return (
    <Pressable style={styles.actionButton} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <MaterialCommunityIcons name={icon} size={22} color={theme.colors.primary} />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backFallback: {
      marginBottom: 40,
    },
    image: {
      width: '100%',
      height: IMAGE_HEIGHT,
    },
    sheet: {
      marginTop: -28,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      backgroundColor: c.background,
      paddingHorizontal: spacing.md + 4,
      paddingTop: spacing.lg,
    },
    title: {
      fontFamily: fontFamily.display,
      fontSize: 30,
      lineHeight: 36,
      color: c.onSurface,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 5,
      marginTop: 8,
    },
    ratingValue: {
      fontFamily: fontFamily.bold,
      fontSize: 14,
      color: c.onSurface,
    },
    muted: {
      fontFamily: fontFamily.regular,
      fontSize: 14,
      color: c.muted,
    },
    cookedBadge: {
      fontFamily: fontFamily.semibold,
      fontSize: 13,
      color: c.tertiary,
    },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 14,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceVariant,
    },
    pillAccent: {
      backgroundColor: c.primaryContainer,
    },
    pillText: {
      fontFamily: fontFamily.medium,
      fontSize: 12,
      color: c.onSurfaceVariant,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 20,
    },
    statTile: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 14,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      elevation: 1,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    statValue: {
      fontFamily: fontFamily.bold,
      fontSize: 15,
      color: c.onSurface,
      marginTop: 4,
    },
    statLabel: {
      fontFamily: fontFamily.regular,
      fontSize: 11,
      color: c.muted,
      textAlign: 'center',
    },
    cookButton: {
      marginTop: 22,
      borderRadius: radius.pill,
    },
    cookButtonContent: {
      paddingVertical: 8,
    },
    cookButtonLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: 16,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 12,
    },
    actionButton: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
      paddingVertical: 12,
      borderRadius: radius.md,
      backgroundColor: c.primaryContainer,
    },
    actionLabel: {
      fontFamily: fontFamily.medium,
      fontSize: 12,
      color: c.onPrimaryContainer,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 30,
    },
    sectionTitle: {
      fontFamily: fontFamily.display,
      fontSize: 22,
      color: c.onSurface,
    },
    sectionSpacing: {
      marginTop: 30,
      marginBottom: 12,
    },
    helper: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      color: c.muted,
      marginTop: 4,
      marginBottom: 8,
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    stepperButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperValue: {
      fontFamily: fontFamily.bold,
      fontSize: 16,
      color: c.onSurface,
      minWidth: 22,
      textAlign: 'center',
    },
    stepperLabel: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      color: c.muted,
    },
    ingredientRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.outlineVariant,
    },
    ingredientText: {
      flex: 1,
      fontFamily: fontFamily.regular,
      fontSize: 15,
      lineHeight: 21,
      color: c.onSurface,
    },
    ingredientDone: {
      color: c.muted,
      textDecorationLine: 'line-through',
    },
    stepCard: {
      flexDirection: 'row',
      gap: 14,
      padding: spacing.md,
      marginBottom: 12,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      elevation: 1,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    stepNumber: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepNumberText: {
      fontFamily: fontFamily.bold,
      fontSize: 15,
      color: c.onPrimary,
    },
    stepText: {
      fontFamily: fontFamily.regular,
      fontSize: 15,
      lineHeight: 23,
      color: c.onSurface,
    },
    nutritionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
    },
    nutritionItem: {
      flex: 1,
      alignItems: 'center',
    },
    nutritionValue: {
      fontFamily: fontFamily.display,
      fontSize: 22,
      color: c.primary,
    },
    nutritionDivider: {
      width: StyleSheet.hairlineWidth,
      alignSelf: 'stretch',
      backgroundColor: c.outlineVariant,
    },
    notesCard: {
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
    },
    starsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 10,
    },
    ratingHint: {
      fontFamily: fontFamily.medium,
      fontSize: 13,
      color: c.muted,
      marginLeft: 8,
    },
    noteInput: {
      minHeight: 80,
    },
    noteButton: {
      marginTop: 10,
      alignSelf: 'flex-end',
      borderRadius: radius.pill,
    },
    cookedCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 14,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: c.tertiaryContainer,
    },
    cookedEmoji: {
      fontSize: 30,
    },
    cookedTitle: {
      fontFamily: fontFamily.semibold,
      fontSize: 15,
      color: c.onSurface,
    },
    tagPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.outlineVariant,
    },
    tagText: {
      fontFamily: fontFamily.medium,
      fontSize: 13,
      color: c.onSurfaceVariant,
    },
    bar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: c.surface,
      justifyContent: 'center',
      paddingHorizontal: 72,
      elevation: 4,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    barTitle: {
      fontFamily: fontFamily.displaySemi,
      fontSize: 17,
      color: c.onSurface,
      textAlign: 'center',
    },
    floatingRow: {
      position: 'absolute',
      left: spacing.md,
      right: spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    floatingRight: {
      flexDirection: 'row',
      gap: 10,
    },
    roundButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: photoOverlay.button,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    dayText: {
      fontFamily: fontFamily.medium,
      fontSize: 16,
      color: c.onSurface,
    },
    dialogScroll: {
      maxHeight: 380,
      paddingHorizontal: 0,
    },
    dialogHint: {
      paddingHorizontal: 24,
      paddingVertical: 8,
    },
    newCollectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    newCollectionInput: {
      flex: 1,
      fontFamily: fontFamily.regular,
      fontSize: 15,
      color: c.onSurface,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.outlineVariant,
    },
  })
);
