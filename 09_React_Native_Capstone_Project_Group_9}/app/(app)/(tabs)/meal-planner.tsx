import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { recipeApi } from '@/services/recipeApi';
import {
  createDefaultMealPlannerState,
  DIET_PREFERENCES,
  GroceryItem,
  loadMealPlannerState,
  MEAL_PLANNER_STORAGE_KEY,
  MealPlannerState,
  MealSlot,
  saveMealPlannerState,
} from '@/services/mealPlannerStorage';
import { Recipe } from '@/types/recipe';
import { useAppTheme, useThemedStyles } from '@/context/AppThemeContext';
import { styles as baseStyles } from './mealPlannerStyles';

const mealSlots: MealSlot[] = ['Breakfast', 'Lunch', 'Dinner'];
const calorieStep = 100;
const sectionHeadingProps = { accessibilityRole: 'header' as const, 'aria-level': 2 };

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function getWeekDates(date: Date): Date[] {
  const mondayOffset = (date.getDay() + 6) % 7;
  const monday = addDays(date, -mondayOffset);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}
function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function formatCalories(calories: number): string {
  return Math.round(calories).toLocaleString();
}

interface BrowserShareNavigator {
  share?: (data: { title?: string; text?: string }) => Promise<void>;
  clipboard?: {
    writeText: (text: string) => Promise<void>;
  };
}

export default function MealPlannerScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(baseStyles);
  const { width: screenWidth } = useWindowDimensions();
  const horizontalPadding = screenWidth >= 1024 ? 32 : screenWidth >= 600 ? 24 : 16;
  const contentWidth = Math.min(screenWidth, 1200) - horizontalPadding * 2;
  const panelGap = 16;
  const panelColumns = screenWidth >= 760 ? 2 : 1;
  const panelWidth = panelColumns === 2 ? (contentWidth - panelGap) / 2 : contentWidth;
  const mealColumns = screenWidth >= 900 ? 3 : screenWidth >= 600 ? 2 : 1;
  const mealGap = 12;
  const mealCardWidth = (contentWidth - mealGap * (mealColumns - 1)) / mealColumns;
  const pickerColumns = screenWidth >= 900 ? 3 : screenWidth >= 600 ? 2 : 1;
  const pickerGap = 12;
  const pickerCardWidth = (contentWidth - pickerGap * (pickerColumns - 1)) / pickerColumns;

  const [planner, setPlanner] = useState<MealPlannerState>(createDefaultMealPlannerState);
  const plannerRef = useRef(planner);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<MealSlot | null>(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const [groceryInput, setGroceryInput] = useState('');
  const [isGeneratingGroceries, setIsGeneratingGroceries] = useState(false);

  const loadPlanner = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [savedPlanner, response] = await Promise.all([
        loadMealPlannerState(),
        recipeApi.getWorldRecipes({ limit: 100 }),
      ]);
      plannerRef.current = savedPlanner;
      setPlanner(savedPlanner);
      setRecipes(response.recipes);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Could not load the meal planner.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlanner();
  }, [loadPlanner]);

  const updatePlanner = useCallback((update: (current: MealPlannerState) => MealPlannerState) => {
    const nextState = update(plannerRef.current);
    plannerRef.current = nextState;
    setPlanner(nextState);
    setSaveError(null);

    saveQueue.current = saveQueue.current
      .then(
        () => saveMealPlannerState(nextState),
        () => saveMealPlannerState(nextState)
      )
      .catch((error: unknown) => {
        setSaveError(getErrorMessage(error, 'Your changes could not be saved.'));
      });
  }, []);

  const selectedDateKey = getDateKey(selectedDate);
  const selectedDayPlan = planner.plans[selectedDateKey] ?? {};
  const recipesById = useMemo(
    () => new Map(recipes.map((recipe) => [recipe.id, recipe])),
    [recipes]
  );
  const selectedMeals = mealSlots
    .map((slot) => {
      const recipeId = selectedDayPlan[slot];
      return recipeId === undefined ? null : recipesById.get(recipeId) ?? null;
    })
    .filter((recipe): recipe is Recipe => recipe !== null);
  const dailyCalories = selectedMeals.reduce(
    (total, recipe) => total + Math.max(0, recipe.caloriesPerServing),
    0
  );
  const calorieProgress = Math.min(100, Math.round((dailyCalories / planner.calorieTarget) * 100));
  const weekDates = getWeekDates(selectedDate);
  const selectedDateLabel = selectedDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const filteredRecipes = useMemo(() => {
    const normalizedQuery = pickerQuery.trim().toLowerCase();
    return recipes.filter((recipe) => {
      const matchesPreferences = planner.preferences.length === 0
        || recipe.tags.some((tag) =>
          planner.preferences.some((preference) => preference.toLowerCase() === tag.toLowerCase())
        );
      if (!matchesPreferences) return false;
      if (!normalizedQuery) return true;
      return recipe.name.toLowerCase().includes(normalizedQuery)
        || recipe.cuisine.toLowerCase().includes(normalizedQuery)
        || recipe.ingredients.some((ingredient) => ingredient.toLowerCase().includes(normalizedQuery));
    });
  }, [pickerQuery, planner.preferences, recipes]);

  const setMealForSlot = (slot: MealSlot, recipeId?: number) => {
    updatePlanner((current) => {
      const dayPlan = { ...(current.plans[selectedDateKey] ?? {}) };
      if (recipeId === undefined) delete dayPlan[slot];
      else dayPlan[slot] = recipeId;

      const plans = { ...current.plans };
      if (Object.keys(dayPlan).length === 0) delete plans[selectedDateKey];
      else plans[selectedDateKey] = dayPlan;
      return { ...current, plans };
    });
    setActionError(null);
    setActionMessage(recipeId === undefined ? 'Meal removed from your plan.' : 'Meal added to your plan.');
  };

  const chooseRecipe = (recipe: Recipe) => {
    if (!selectedSlot) return;
    setMealForSlot(selectedSlot, recipe.id);
    setPickerVisible(false);
    setPickerQuery('');
    setSelectedSlot(null);
  };

  const togglePreference = (preference: string) => {
    updatePlanner((current) => ({
      ...current,
      preferences: current.preferences.includes(preference)
        ? current.preferences.filter((item) => item !== preference)
        : [...current.preferences, preference],
    }));
    setActionMessage('Recipe preferences saved.');
    setActionError(null);
  };

  const adjustCalorieTarget = (amount: number) => {
    updatePlanner((current) => ({
      ...current,
      calorieTarget: Math.max(1000, Math.min(5000, current.calorieTarget + amount)),
    }));
    setActionMessage('Daily calorie target updated.');
    setActionError(null);
  };

  const addGroceryItem = () => {
    const name = groceryInput.trim().replace(/\s+/g, ' ');
    if (!name) return;
    const id = name.toLocaleLowerCase();
    if (plannerRef.current.groceryItems.some((item) => item.id === id)) {
      setActionError('That item is already on your grocery list.');
      return;
    }
    updatePlanner((current) => ({
      ...current,
      groceryItems: [...current.groceryItems, { id, name, checked: false }],
    }));
    setGroceryInput('');
    setActionMessage('Item added to your grocery list.');
    setActionError(null);
  };

  const toggleGroceryItem = (id: string) => {
    updatePlanner((current) => ({
      ...current,
      groceryItems: current.groceryItems.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      ),
    }));
    setActionError(null);
  };

  const removeGroceryItem = (id: string) => {
    updatePlanner((current) => ({
      ...current,
      groceryItems: current.groceryItems.filter((item) => item.id !== id),
    }));
    setActionError(null);
  };

  const generateGroceryList = async () => {
    if (selectedMeals.length === 0) {
      setActionError('Add a recipe to this day before generating a grocery list.');
      return;
    }

    setIsGeneratingGroceries(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const detailedRecipes = await Promise.all(
        selectedMeals.map((recipe) =>
          recipe.ingredients.length > 0 ? Promise.resolve(recipe) : recipeApi.getRecipeById(recipe.id)
        )
      );
      const ingredientMap = new Map<string, string>();
      detailedRecipes.forEach((recipe) => {
        recipe.ingredients.forEach((ingredient) => {
          const name = ingredient.trim().replace(/\s+/g, ' ');
          if (name) ingredientMap.set(name.toLocaleLowerCase(), name);
        });
      });

      if (ingredientMap.size === 0) {
        setActionError('Ingredients are not available for the meals in this plan yet.');
        return;
      }

      const currentItems = plannerRef.current.groceryItems;
      const existingIds = new Set(currentItems.map((item) => item.id));
      const newItems: GroceryItem[] = Array.from(ingredientMap, ([id, name]) =>
        existingIds.has(id) ? null : { id, name, checked: false }
      ).filter((item): item is GroceryItem => item !== null);
      updatePlanner((current) => ({
        ...current,
        groceryItems: [...current.groceryItems, ...newItems],
      }));
      setActionMessage(
        newItems.length > 0
          ? `Added ${newItems.length} ingredients to your grocery list.`
          : 'Your grocery list already has these ingredients.'
      );
    } catch (error) {
      setActionError(getErrorMessage(error, 'Could not generate the grocery list.'));
    } finally {
      setIsGeneratingGroceries(false);
    }
  };

  const sharePlan = async () => {
    if (selectedMeals.length === 0) {
      setActionError('Add a recipe before sharing this day plan.');
      return;
    }

    const mealLines = mealSlots.flatMap((slot) => {
      const recipeId = selectedDayPlan[slot];
      const recipe = recipeId === undefined ? undefined : recipesById.get(recipeId);
      return recipe
        ? [`${slot}: ${recipe.name} (${formatCalories(recipe.caloriesPerServing)} kcal)`]
        : [];
    });
    const message = [
      `Meal plan for ${selectedDateLabel}`,
      ...mealLines,
      `Estimated total: ${formatCalories(dailyCalories)} kcal`,
    ].join('\n');

    setActionError(null);
    setActionMessage(null);
    try {
      if (Platform.OS === 'web') {
        const browserNavigator = globalThis.navigator as typeof globalThis.navigator & BrowserShareNavigator;
        if (typeof browserNavigator.share === 'function') {
          await browserNavigator.share({ title: 'CookBook meal plan', text: message });
          setActionMessage('Meal plan shared.');
        } else if (browserNavigator.clipboard?.writeText) {
          await browserNavigator.clipboard.writeText(message);
          setActionMessage('Meal plan copied to your clipboard.');
        } else {
          throw new Error('Sharing and clipboard access are unavailable in this browser.');
        }
      } else {
        await Share.share({ title: 'CookBook meal plan', message });
        setActionMessage('Meal plan shared.');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setActionMessage('Sharing canceled.');
      } else {
        setActionError(getErrorMessage(error, 'Could not share this meal plan.'));
      }
    }
  };

  const resetPlanner = async () => {
    try {
      const emptyState = createDefaultMealPlannerState();
      await saveQueue.current;
      await AsyncStorage.removeItem(MEAL_PLANNER_STORAGE_KEY);
      plannerRef.current = emptyState;
      setPlanner(emptyState);
      setLoadError(null);
      setActionMessage('Saved meal planner data cleared.');
      void loadPlanner();
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Could not reset the meal planner.'));
    }
  };

  const renderMealSlot = (slot: MealSlot) => {
    const recipeId = selectedDayPlan[slot];
    const recipe = recipeId === undefined ? undefined : recipesById.get(recipeId);
    return (
      <View key={slot} style={[styles.mealCard, { width: mealCardWidth }]}>
        <View style={styles.mealCardHeader}>
          <Text style={styles.mealSlotTitle}>{slot}</Text>
          <MaterialCommunityIcons
            name={slot === 'Breakfast' ? 'weather-sunset-up' : slot === 'Lunch' ? 'white-balance-sunny' : 'weather-night'}
            size={20}
            color={colors.textSecondary}
            accessible={false}
          />
        </View>
        {recipe ? (
          <>
            <Pressable
              style={styles.plannedRecipe}
              onPress={() => router.push(`/(app)/recipe/${recipe.id}`)}
              accessibilityRole="link"
              accessibilityLabel={`View ${recipe.name} recipe`}
            >
              <Image source={{ uri: recipe.image }} style={styles.mealImage} resizeMode="cover" accessible={false} />
              <View style={styles.recipeSummary}>
                <Text style={styles.recipeName} numberOfLines={2}>{recipe.name}</Text>
                <Text style={styles.recipeCalories}>
                  {recipe.caloriesPerServing > 0
                    ? `${formatCalories(recipe.caloriesPerServing)} kcal / serving`
                    : 'Calories unavailable'}
                </Text>
              </View>
            </Pressable>
            <View style={styles.mealActions}>
              <Pressable
                onPress={() => {
                  setSelectedSlot(slot);
                  setPickerVisible(true);
                }}
                style={styles.textAction}
                accessibilityRole="button"
              >
                <Text style={styles.textActionLabel}>Change</Text>
              </Pressable>
              <Pressable
                onPress={() => setMealForSlot(slot)}
                style={styles.textAction}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${slot.toLowerCase()} meal`}
              >
                <Text style={styles.removeActionLabel}>Remove</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.emptyMeal}>
            <Text style={styles.emptyMealText}>Nothing planned yet</Text>
            <Button
              mode="outlined"
              onPress={() => {
                setSelectedSlot(slot);
                setPickerVisible(true);
              }}
              style={styles.addMealButton}
              textColor={colors.accent}
              accessibilityLabel={`Add a recipe for ${slot.toLowerCase()}`}
            >
              Add recipe
            </Button>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.stateText}>Loading your meal planner...</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.centeredState}>
        <MaterialCommunityIcons name="calendar-alert" size={44} color={colors.error} accessible={false} />
        <Text style={styles.errorTitle}>Meal planner unavailable</Text>
        <Text style={styles.stateText}>{loadError}</Text>
        <View style={styles.errorActions}>
          <Button mode="contained" onPress={() => void loadPlanner()} buttonColor="#176B58">
            Try again
          </Button>
          <Button mode="outlined" onPress={() => void resetPlanner()} textColor={colors.accent}>
            Reset saved planner
          </Button>
        </View>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.page, { paddingHorizontal: horizontalPadding }]}>
          <View style={styles.pageHeading}>
            <View style={styles.headingCopy}>
              <Text style={styles.eyebrow}>MAKE THE WEEK DELICIOUS</Text>
              <Text style={styles.pageTitle} accessibilityRole="header">Meal planner</Text>
              <Text style={styles.pageSubtitle}>Plan your meals, track daily calories, and build a grocery list.</Text>
            </View>
            <Button
              mode="contained"
              icon="share-variant"
              onPress={() => void sharePlan()}
              disabled={selectedMeals.length === 0}
              buttonColor="#176B58"
              style={styles.shareButton}
              accessibilityLabel="Share this day's meal plan"
            >
              Share plan
            </Button>
          </View>

          <View style={styles.weekNavigator}>
            <Pressable
              onPress={() => setSelectedDate((date) => addDays(date, -7))}
              style={styles.weekArrow}
              accessibilityRole="button"
              accessibilityLabel="Previous week"
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.textSecondary} />
            </Pressable>
            <Text style={styles.weekLabel}>
              {weekDates[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              {' - '}
              {weekDates[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
            <Pressable
              onPress={() => setSelectedDate((date) => addDays(date, 7))}
              style={styles.weekArrow}
              accessibilityRole="button"
              accessibilityLabel="Next week"
            >
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayList}
            accessibilityLabel="Choose a day in the meal calendar"
          >
            {weekDates.map((date) => {
              const dateKey = getDateKey(date);
              const selected = dateKey === selectedDateKey;
              const plannedCount = Object.keys(planner.plans[dateKey] ?? {}).length;
              return (
                <Pressable
                  key={dateKey}
                  style={[styles.dayChip, selected && styles.dayChipSelected]}
                  onPress={() => setSelectedDate(date)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}${plannedCount ? `, ${plannedCount} meals planned` : ''}`}
                >
                  <Text style={[styles.dayName, selected && styles.dayTextSelected]}>
                    {date.toLocaleDateString(undefined, { weekday: 'short' })}
                  </Text>
                  <Text style={[styles.dayNumber, selected && styles.dayTextSelected]}>
                    {date.getDate()}
                  </Text>
                  <View style={[styles.dayDot, plannedCount > 0 && styles.dayDotPlanned]} />
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.sectionHeading}>
            <View>
              <Text {...sectionHeadingProps} style={styles.sectionTitle}>Meals for {selectedDateLabel}</Text>
              <Text style={styles.sectionSubtitle}>Select a card to add or change a recipe.</Text>
            </View>
            <Text style={styles.mealCount}>{selectedMeals.length}/3 planned</Text>
          </View>
          <View style={styles.mealGrid}>
            {mealSlots.map(renderMealSlot)}
          </View>

          <View style={[styles.panelGrid, panelColumns === 1 && styles.panelGridStacked]}>
            <View style={[styles.panel, { width: panelWidth }]}>
              <View style={styles.panelTitleRow}>
                <View style={styles.panelIcon}>
                  <MaterialCommunityIcons name="chart-donut" size={20} color={colors.accent} accessible={false} />
                </View>
                <View style={styles.panelHeadingCopy}>
                  <Text {...sectionHeadingProps} style={styles.panelTitle}>Nutrition overview</Text>
                  <Text style={styles.panelSubtitle}>Calories per serving from planned recipes</Text>
                </View>
              </View>
              <Text style={styles.calorieValue}>
                {formatCalories(dailyCalories)}
                <Text style={styles.calorieUnit}> kcal</Text>
              </Text>
              <View
                style={styles.progressTrack}
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: planner.calorieTarget, now: dailyCalories }}
                accessibilityLabel="Planned calories compared with daily target"
              >
                <View style={[styles.progressFill, { width: `${calorieProgress}%` }]} />
              </View>
              <View style={styles.targetRow}>
                <Text style={styles.targetCaption}>
                  {calorieProgress}% of {formatCalories(planner.calorieTarget)} kcal target
                </Text>
                <View style={styles.targetControls}>
                  <Pressable
                    onPress={() => adjustCalorieTarget(-calorieStep)}
                    style={styles.targetButton}
                    accessibilityRole="button"
                    accessibilityLabel="Lower calorie target"
                  >
                    <MaterialCommunityIcons name="minus" size={18} color={colors.accent} />
                  </Pressable>
                  <Pressable
                    onPress={() => adjustCalorieTarget(calorieStep)}
                    style={styles.targetButton}
                    accessibilityRole="button"
                    accessibilityLabel="Raise calorie target"
                  >
                    <MaterialCommunityIcons name="plus" size={18} color={colors.accent} />
                  </Pressable>
                </View>
              </View>
              <Text style={styles.nutritionNote}>
                Calorie values are estimates supplied with each recipe; other nutrient data is not available in this catalog.
              </Text>
            </View>

            <View style={[styles.panel, { width: panelWidth }]}>
              <View style={styles.panelTitleRow}>
                <View style={[styles.panelIcon, styles.preferencesIcon]}>
                  <MaterialCommunityIcons name="tune-variant" size={20} color={colors.accent} accessible={false} />
                </View>
                <View style={styles.panelHeadingCopy}>
                  <Text {...sectionHeadingProps} style={styles.panelTitle}>Your preferences</Text>
                  <Text style={styles.panelSubtitle}>Used to filter recipes when you add a meal</Text>
                </View>
              </View>
              <View style={styles.preferenceList}>
                {DIET_PREFERENCES.map((preference) => {
                  const selected = planner.preferences.includes(preference);
                  return (
                    <Pressable
                      key={preference}
                      style={[styles.preferenceChip, selected && styles.preferenceChipSelected]}
                      onPress={() => togglePreference(preference)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                    >
                      <Text style={[styles.preferenceText, selected && styles.preferenceTextSelected]}>
                        {preference}
                      </Text>
                      {selected && <MaterialCommunityIcons name="check" size={15} color="#FFFFFF" />}
                    </Pressable>
                  );
                })}
              </View>
              {planner.preferences.length > 0 && (
                <Pressable
                  onPress={() => {
                    updatePlanner((current) => ({ ...current, preferences: [] }));
                    setActionMessage('Recipe preferences cleared.');
                  }}
                  style={styles.clearPreferences}
                  accessibilityRole="button"
                >
                  <Text style={styles.clearPreferencesText}>Clear preferences</Text>
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelTitleRow}>
              <View style={[styles.panelIcon, styles.groceryIcon]}>
                <MaterialCommunityIcons name="basket-outline" size={20} color={colors.accent} accessible={false} />
              </View>
              <View style={styles.panelHeadingCopy}>
                <Text {...sectionHeadingProps} style={styles.panelTitle}>Grocery list</Text>
                <Text style={styles.panelSubtitle}>Generate ingredients from this day or add items yourself.</Text>
              </View>
            </View>
            <Button
              mode="outlined"
              icon="playlist-plus"
              onPress={() => void generateGroceryList()}
              loading={isGeneratingGroceries}
              disabled={isGeneratingGroceries || selectedMeals.length === 0}
              textColor={colors.accent}
              style={styles.generateButton}
            >
              Generate from {selectedDate.toLocaleDateString(undefined, { weekday: 'long' })}&apos;s meals
            </Button>
            <View style={styles.groceryInputRow}>
              <TextInput
                value={groceryInput}
                onChangeText={setGroceryInput}
                placeholder="Add an item"
                placeholderTextColor={colors.muted}
                style={styles.groceryInput}
                accessibilityLabel="New grocery list item"
                returnKeyType="done"
                onSubmitEditing={addGroceryItem}
              />
              <Button
                mode="contained"
                onPress={addGroceryItem}
                disabled={!groceryInput.trim()}
                buttonColor="#176B58"
                style={styles.addGroceryButton}
              >
                Add
              </Button>
            </View>
            {planner.groceryItems.length === 0 ? (
              <Text style={styles.groceryEmpty}>Your grocery list is empty.</Text>
            ) : (
              <View style={styles.groceryList}>
                {planner.groceryItems.map((item) => (
                  <GroceryListRow
                    key={item.id}
                    item={item}
                    onToggle={() => toggleGroceryItem(item.id)}
                    onRemove={() => removeGroceryItem(item.id)}
                  />
                ))}
              </View>
            )}
          </View>

          {(saveError || actionError || actionMessage) && (
            <View style={[styles.messageBanner, Boolean(saveError || actionError) && styles.messageBannerError]}>
              <MaterialCommunityIcons
                name={saveError || actionError ? 'alert-circle-outline' : 'check-circle-outline'}
                size={19}
                color={saveError || actionError ? colors.error : colors.accent}
                accessible={false}
              />
              <Text style={[styles.messageText, Boolean(saveError || actionError) && styles.messageTextError]}>
                {saveError ?? actionError ?? actionMessage}
              </Text>
              {saveError && (
                <Pressable
                  onPress={() => updatePlanner((current) => ({ ...current }))}
                  accessibilityRole="button"
                  style={styles.retrySave}
                >
                  <Text style={styles.retrySaveText}>Retry save</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={pickerVisible}
        animationType="slide"
        onRequestClose={() => {
          setPickerVisible(false);
          setSelectedSlot(null);
        }}
      >
        <SafeAreaView style={styles.pickerScreen} edges={['top', 'bottom']}>
          <View style={[styles.pickerPage, { paddingHorizontal: horizontalPadding }]}>
            <View style={styles.pickerHeader}>
              <View style={styles.pickerHeadingCopy}>
                <Text {...sectionHeadingProps} style={styles.pickerTitle}>
                  Add {selectedSlot?.toLowerCase() ?? 'meal'} recipe
                </Text>
                <Text style={styles.pickerSubtitle}>
                  {planner.preferences.length > 0
                    ? `Filtered by ${planner.preferences.join(', ')}`
                    : 'Choose a recipe from the collection.'}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setPickerVisible(false);
                  setSelectedSlot(null);
                  setPickerQuery('');
                }}
                style={styles.closePicker}
                accessibilityRole="button"
                accessibilityLabel="Close recipe picker"
              >
                <MaterialCommunityIcons name="close" size={23} color={colors.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.pickerSearch}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} accessible={false} />
              <TextInput
                value={pickerQuery}
                onChangeText={setPickerQuery}
                placeholder="Search recipes or ingredients"
                placeholderTextColor={colors.muted}
                style={styles.pickerSearchInput}
                accessibilityLabel="Search recipes"
              />
            </View>
            <FlatList
              data={filteredRecipes}
              key={pickerColumns}
              numColumns={pickerColumns}
              keyExtractor={(recipe) => recipe.id.toString()}
              columnWrapperStyle={pickerColumns > 1 ? { gap: pickerGap } : undefined}
              contentContainerStyle={styles.pickerList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.pickerEmpty}>
                  <MaterialCommunityIcons name="food-off-outline" size={40} color={colors.muted} accessible={false} />
                  <Text style={styles.pickerEmptyText}>No matching recipes found.</Text>
                  {planner.preferences.length > 0 && (
                    <Button
                      mode="text"
                      onPress={() => {
                        updatePlanner((current) => ({ ...current, preferences: [] }));
                        setActionMessage('Recipe preferences cleared.');
                      }}
                      textColor="#176B58"
                    >
                      Clear preferences
                    </Button>
                  )}
                </View>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.recipeOption, { width: pickerCardWidth }]}
                  onPress={() => chooseRecipe(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${item.name}, ${formatCalories(item.caloriesPerServing)} calories`}
                >
                  <Image source={{ uri: item.image }} style={styles.optionImage} resizeMode="cover" accessible={false} />
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.optionMeta}>
                      {item.caloriesPerServing > 0
                        ? `${formatCalories(item.caloriesPerServing)} kcal`
                        : item.cuisine}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="plus-circle" size={23} color={colors.accent} style={styles.optionAddIcon} accessible={false} />
                </Pressable>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

interface GroceryListRowProps {
  item: GroceryItem;
  onToggle: () => void;
  onRemove: () => void;
}

function GroceryListRow({ item, onToggle, onRemove }: GroceryListRowProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(baseStyles);
  return (
    <View style={styles.groceryRow}>
      <Pressable
        onPress={onToggle}
        style={styles.groceryToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.checked }}
        accessibilityLabel={item.name}
      >
        <MaterialCommunityIcons
          name={item.checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
          size={21}
          color={item.checked ? colors.accent : colors.textSecondary}
          accessible={false}
        />
        <Text style={[styles.groceryItemText, item.checked && styles.groceryItemChecked]}>
          {item.name}
        </Text>
      </Pressable>
      <Pressable
        onPress={onRemove}
        style={styles.removeGroceryButton}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.name}`}
      >
        <MaterialCommunityIcons name="close" size={19} color={colors.muted} />
      </Pressable>
    </View>
  );
}
