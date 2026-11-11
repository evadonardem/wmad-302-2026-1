import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Button,
  Card,
  Chip,
  Dialog,
  IconButton,
  Portal,
  SegmentedButtons,
  TextInput,
  Title,
  useTheme,
  type MD3Theme,
} from 'react-native-paper';
import { Recipe } from '@/types/recipe';
import { recipeApi } from '@/services/recipeApi';

const STORAGE_KEY = '@cookbook/meal-planner-v1';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;
type Day = typeof DAYS[number];
type Meal = typeof MEALS[number];
type Section = 'meals' | 'shopping' | 'collections';

interface PlannedMeal {
  id: string;
  day: Day;
  meal: Meal;
  recipe: Recipe;
}

interface ShoppingItem {
  id: string;
  label: string;
  sourcePlanId: string;
  sourceIngredient: string;
  checked: boolean;
}

interface RecipeCollection {
  id: string;
  name: string;
  recipes: Recipe[];
}

interface PlannerData {
  plan: PlannedMeal[];
  shopping: ShoppingItem[];
  collections: RecipeCollection[];
}

const emptyData = (): PlannerData => ({ plan: [], shopping: [], collections: [] });

function isPlannerData(value: unknown): value is PlannerData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<PlannerData>;
  return Array.isArray(data.plan) && Array.isArray(data.shopping) && Array.isArray(data.collections);
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function PlannerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [data, setData] = useState<PlannerData>(emptyData);
  const [loadingStorage, setLoadingStorage] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState<Section>('meals');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeQuery, setRecipeQuery] = useState('');
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [planRecipe, setPlanRecipe] = useState<Recipe | null>(null);
  const [selectedDay, setSelectedDay] = useState<Day>('Monday');
  const [selectedMeal, setSelectedMeal] = useState<Meal>('Dinner');
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [editedIngredient, setEditedIngredient] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [collectionDialog, setCollectionDialog] = useState(false);
  const [addingToCollection, setAddingToCollection] = useState<string | null>(null);

  const loadStorage = useCallback(async () => {
    setLoadingStorage(true);
    setStorageError(null);
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (!isPlannerData(parsed)) {
          throw new Error('Saved planner data is not in the expected format.');
        }
        setData(parsed);
      } else {
        setData(emptyData());
      }
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Could not read planner data from this device.');
    } finally {
      setLoadingStorage(false);
    }
  }, []);

  useEffect(() => {
    void loadStorage();
  }, [loadStorage]);

  const loadRecipes = useCallback(async (query = '') => {
    setLoadingRecipes(true);
    setRecipeError(null);
    try {
      const result = query.trim()
        ? await recipeApi.searchRecipes(query.trim(), { limit: 30 })
        : await recipeApi.getRecipes({ limit: 30 });
      setRecipes(result.recipes);
    } catch (error) {
      setRecipeError(error instanceof Error ? error.message : 'Could not load recipes from the recipe service.');
    } finally {
      setLoadingRecipes(false);
    }
  }, []);

  useEffect(() => {
    void loadRecipes();
  }, [loadRecipes]);

  const commit = useCallback(async (next: PlannerData) => {
    setSaving(true);
    setStorageError(null);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setData(next);
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Could not save planner changes to this device.');
    } finally {
      setSaving(false);
    }
  }, []);

  const plannedByDay = useMemo(
    () => DAYS.map((day) => ({ day, meals: data.plan.filter((entry) => entry.day === day) })),
    [data.plan],
  );

  const addPlannedMeal = () => {
    if (!planRecipe) return;
    const entry: PlannedMeal = {
      id: makeId(),
      day: selectedDay,
      meal: selectedMeal,
      recipe: planRecipe,
    };
    void commit({ ...data, plan: [...data.plan, entry] });
    setPlanRecipe(null);
  };

  const removePlannedMeal = (entryId: string) => {
    void commit({ ...data, plan: data.plan.filter((entry) => entry.id !== entryId) });
  };

  const generateShoppingList = () => {
    const existing = new Map(data.shopping.map((item) => [item.id, item]));
    const activePlanIds = new Set(data.plan.map((entry) => entry.id));
    const generated = data.plan.flatMap((entry) =>
      entry.recipe.ingredients.map((ingredient, index) => {
        const id = `${entry.id}:${index}`;
        return existing.get(id) ?? {
          id,
          label: ingredient,
          sourcePlanId: entry.id,
          sourceIngredient: ingredient,
          checked: false,
        };
      }),
    );
    const manual = data.shopping.filter((item) => !item.sourcePlanId || activePlanIds.has(item.sourcePlanId));
    const byId = new Map(manual.map((item) => [item.id, item]));
    generated.forEach((item) => byId.set(item.id, item));
    void commit({ ...data, shopping: [...byId.values()] });
  };

  const saveIngredient = () => {
    if (!editingItem || !editedIngredient.trim()) return;
    void commit({
      ...data,
      shopping: data.shopping.map((item) => (
        item.id === editingItem.id ? { ...item, label: editedIngredient.trim() } : item
      )),
    });
    setEditingItem(null);
  };

  const removeShoppingItem = (itemId: string) => {
    void commit({ ...data, shopping: data.shopping.filter((item) => item.id !== itemId) });
  };

  const toggleShoppingItem = (itemId: string) => {
    void commit({
      ...data,
      shopping: data.shopping.map((item) => (
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )),
    });
  };

  const createCollection = () => {
    const name = collectionName.trim();
    if (!name) return;
    void commit({ ...data, collections: [...data.collections, { id: makeId(), name, recipes: [] }] });
    setCollectionName('');
    setCollectionDialog(false);
  };

  const removeCollection = (collectionId: string) => {
    void commit({ ...data, collections: data.collections.filter((collection) => collection.id !== collectionId) });
  };

  const addRecipeToCollection = (collectionId: string, recipe: Recipe) => {
    const collection = data.collections.find((item) => item.id === collectionId);
    if (!collection || collection.recipes.some((item) => item.id === recipe.id)) {
      setAddingToCollection(null);
      return;
    }
    void commit({
      ...data,
      collections: data.collections.map((item) => (
        item.id === collectionId ? { ...item, recipes: [...item.recipes, recipe] } : item
      )),
    });
    setAddingToCollection(null);
  };

  const removeRecipeFromCollection = (collectionId: string, recipeId: number) => {
    void commit({
      ...data,
      collections: data.collections.map((collection) => (
        collection.id === collectionId
          ? { ...collection, recipes: collection.recipes.filter((recipe) => recipe.id !== recipeId) }
          : collection
      )),
    });
  };

  const showRecipes = addingToCollection !== null;

  if (loadingStorage) {
    return (
      <View style={styles.centered}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Meal Planner',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.onSurface,
          }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>Loading your planner…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Meal Planner',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.onSurface,
        }}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <Title style={styles.title}>Plan a delicious week</Title>
          <Text style={styles.muted}>Your weekly plan, shopping list, and recipe collections stay on this device.</Text>
        </View>

        {storageError ? (
          <Card style={styles.notice} mode="outlined">
            <Card.Content>
              <Text style={styles.errorTitle}>Planner storage needs attention</Text>
              <Text style={styles.body}>{storageError}</Text>
              <View style={styles.buttonRow}>
                <Button mode="outlined" onPress={() => { void loadStorage(); }}>Retry</Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    setData(emptyData());
                    setStorageError(null);
                  }}
                >
                  Continue with an empty planner
                </Button>
              </View>
            </Card.Content>
          </Card>
        ) : null}
        {saving ? <Text style={styles.saving}>Saving changes…</Text> : null}

        <SegmentedButtons
          value={section}
          onValueChange={(value) => setSection(value as Section)}
          buttons={[
            { value: 'meals', label: 'Meals' },
            { value: 'shopping', label: 'Shopping' },
            { value: 'collections', label: 'Collections' },
          ]}
        />

        {section === 'meals' ? (
          <>
            <View style={styles.sectionHeading}>
              <Title style={styles.sectionTitle}>This week</Title>
              <Text style={styles.muted}>{data.plan.length} planned meals</Text>
            </View>
            {plannedByDay.map(({ day, meals }) => (
              <Card key={day} style={styles.dayCard} mode="outlined">
                <Card.Content>
                  <Text style={styles.dayTitle}>{day}</Text>
                  {meals.length === 0 ? <Text style={styles.muted}>Nothing planned yet</Text> : null}
                  {meals.map((entry) => (
                    <View key={entry.id} style={styles.listRow}>
                      <View style={styles.flex}>
                        <Text style={styles.recipeName}>{entry.meal}: {entry.recipe.name}</Text>
                        <Text style={styles.muted}>{entry.recipe.ingredients.length} ingredients</Text>
                      </View>
                      <IconButton
                        icon="close"
                        accessibilityLabel={`Remove ${entry.recipe.name} from plan`}
                        disabled={saving}
                        onPress={() => removePlannedMeal(entry.id)}
                      />
                    </View>
                  ))}
                </Card.Content>
              </Card>
            ))}
            <View style={styles.sectionHeading}>
              <Title style={styles.sectionTitle}>Add a recipe</Title>
            </View>
            <TextInput
              label="Search recipes"
              value={recipeQuery}
              onChangeText={setRecipeQuery}
              onSubmitEditing={() => { void loadRecipes(recipeQuery); }}
              returnKeyType="search"
              mode="outlined"
              style={styles.search}
              right={<TextInput.Icon icon="magnify" onPress={() => { void loadRecipes(recipeQuery); }} />}
            />
            {recipeError ? (
              <View style={styles.errorBox}>
                <Text style={styles.body}>{recipeError}</Text>
                <Button onPress={() => { void loadRecipes(recipeQuery); }}>Retry recipe search</Button>
              </View>
            ) : null}
            {loadingRecipes ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
            {!loadingRecipes && !recipeError && recipes.length === 0 ? (
              <Text style={styles.muted}>No recipes matched. Try another search.</Text>
            ) : null}
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                actionLabel="Plan"
                disabled={saving}
                onPress={() => {
                  setSelectedDay('Monday');
                  setSelectedMeal('Dinner');
                  setPlanRecipe(recipe);
                }}
              />
            ))}
          </>
        ) : null}

        {section === 'shopping' ? (
          <>
            <View style={styles.sectionHeading}>
              <Title style={styles.sectionTitle}>Shopping list</Title>
              <Text style={styles.muted}>{data.shopping.length} ingredients</Text>
            </View>
            <Text style={styles.body}>Generate ingredients from planned recipes. Editing or removing an item is saved locally.</Text>
            <Button
              mode="contained"
              icon="format-list-checks"
              onPress={generateShoppingList}
              disabled={saving}
              style={styles.actionButton}
            >
              Generate / update from meal plan
            </Button>
            {data.shopping.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.muted}>Your list is empty. Add meals to your plan, then generate the ingredients.</Text>
              </View>
            ) : null}
            {data.shopping.map((item) => (
              <Card key={item.id} style={styles.shoppingCard} mode="outlined">
                <View style={styles.listRow}>
                  <Chip
                    icon={item.checked ? 'check' : 'checkbox-blank-outline'}
                    onPress={() => toggleShoppingItem(item.id)}
                    disabled={saving}
                  >
                    {item.checked ? 'Got it' : 'Needed'}
                  </Chip>
                  <Text style={[styles.ingredient, item.checked && styles.checked]}>{item.label}</Text>
                  <IconButton
                    icon="pencil-outline"
                    accessibilityLabel={`Edit ${item.label}`}
                    disabled={saving}
                    onPress={() => {
                      setEditingItem(item);
                      setEditedIngredient(item.label);
                    }}
                  />
                </View>
              </Card>
            ))}
          </>
        ) : null}

        {section === 'collections' ? (
          <>
            <View style={styles.sectionHeading}>
              <Title style={styles.sectionTitle}>My collections</Title>
              <Button icon="plus" onPress={() => setCollectionDialog(true)}>New collection</Button>
            </View>
            {data.collections.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.muted}>Create a collection to group recipes you want to keep together.</Text>
              </View>
            ) : null}
            {data.collections.map((collection) => (
              <Card key={collection.id} style={styles.collectionCard} mode="outlined">
                <Card.Title
                  title={collection.name}
                  subtitle={`${collection.recipes.length} recipes`}
                  right={() => (
                    <IconButton
                      icon="delete-outline"
                      accessibilityLabel={`Delete ${collection.name}`}
                      disabled={saving}
                      onPress={() => Alert.alert('Delete collection?', `Remove "${collection.name}" and its recipe list?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => removeCollection(collection.id) },
                      ])}
                    />
                  )}
                />
                <Card.Content>
                  <Button
                    icon="plus"
                    mode="outlined"
                    disabled={saving}
                    onPress={() => {
                      setAddingToCollection(collection.id);
                      setRecipeQuery('');
                      void loadRecipes();
                    }}
                  >
                    Add recipe
                  </Button>
                  {collection.recipes.map((recipe) => (
                    <View key={recipe.id} style={styles.listRow}>
                      <Text style={styles.flex}>{recipe.name}</Text>
                      <IconButton
                        icon="close"
                        accessibilityLabel={`Remove ${recipe.name} from ${collection.name}`}
                        disabled={saving}
                        onPress={() => removeRecipeFromCollection(collection.id, recipe.id)}
                      />
                    </View>
                  ))}
                </Card.Content>
              </Card>
            ))}
          </>
        ) : null}

        <Button
          mode="text"
          icon="book-open-variant"
          onPress={() => router.push('/(app)/(tabs)/search')}
          style={styles.browseLink}
        >
          Browse all recipes
        </Button>
      </ScrollView>

      <Portal>
        <Dialog
          visible={planRecipe !== null}
          onDismiss={() => setPlanRecipe(null)}
          style={{ borderRadius: 12, width: '90%', maxWidth: 400, alignSelf: 'center' }}
        >
          <Dialog.Title>Plan {planRecipe?.name}</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogLabel}>Choose a day</Text>
            <View style={styles.chipWrap}>
              {DAYS.map((day) => (
                <Chip key={day} selected={selectedDay === day} onPress={() => setSelectedDay(day)}>{day.slice(0, 3)}</Chip>
              ))}
            </View>
            <Text style={styles.dialogLabel}>Choose a meal</Text>
            <View style={styles.chipWrap}>
              {MEALS.map((meal) => (
                <Chip key={meal} selected={selectedMeal === meal} onPress={() => setSelectedMeal(meal)}>{meal}</Chip>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPlanRecipe(null)}>Cancel</Button>
            <Button onPress={addPlannedMeal} disabled={saving}>Add to plan</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={editingItem !== null} onDismiss={() => setEditingItem(null)}>
          <Dialog.Title>Edit ingredient</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Ingredient" value={editedIngredient} onChangeText={setEditedIngredient} mode="outlined" />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={colors.error}
              onPress={() => {
                if (editingItem) removeShoppingItem(editingItem.id);
                setEditingItem(null);
              }}
              disabled={saving}
            >
              Remove
            </Button>
            <Button onPress={() => setEditingItem(null)}>Cancel</Button>
            <Button onPress={saveIngredient} disabled={saving || !editedIngredient.trim()}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={collectionDialog}
          onDismiss={() => setCollectionDialog(false)}
          style={{ borderRadius: 12, width: '90%', maxWidth: 400, alignSelf: 'center' }}
        >
          <Dialog.Title>New collection</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Collection name"
              value={collectionName}
              onChangeText={setCollectionName}
              mode="outlined"
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCollectionDialog(false)}>Cancel</Button>
            <Button onPress={createCollection} disabled={saving || !collectionName.trim()}>Create</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showRecipes} onDismiss={() => setAddingToCollection(null)} style={styles.recipeDialog}>
          <Dialog.Title>Select a recipe</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput
                label="Search recipes"
                value={recipeQuery}
                onChangeText={setRecipeQuery}
                onSubmitEditing={() => { void loadRecipes(recipeQuery); }}
                mode="outlined"
                style={styles.dialogSearch}
                right={<TextInput.Icon icon="magnify" onPress={() => { void loadRecipes(recipeQuery); }} />}
              />
              {recipeError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorTitle}>{recipeError}</Text>
                  <Button onPress={() => { void loadRecipes(recipeQuery); }}>Retry recipe search</Button>
                </View>
              ) : null}
              {loadingRecipes ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
              {!loadingRecipes && !recipes.length && !recipeError ? <Text style={styles.muted}>No recipes found.</Text> : null}
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  actionLabel="Add"
                  disabled={saving}
                  onPress={() => {
                    if (addingToCollection) addRecipeToCollection(addingToCollection, recipe);
                  }}
                />
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions><Button onPress={() => setAddingToCollection(null)}>Done</Button></Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

function RecipeCard({
  recipe,
  actionLabel,
  disabled,
  onPress,
}: {
  recipe: Recipe;
  actionLabel: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <Card style={styles.recipeCard} mode="outlined">
      <View style={styles.recipeCardRow}>
        <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeName} numberOfLines={2}>{recipe.name}</Text>
          <Text style={styles.muted}>{recipe.cuisine} · {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</Text>
        </View>
        <Button compact mode="contained-tonal" onPress={onPress} disabled={disabled}>{actionLabel}</Button>
      </View>
    </Card>
  );
}

function createStyles(colors: MD3Theme['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 36 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.background },
    intro: { marginBottom: 16 },
    title: { color: colors.onSurface, fontSize: 24 },
    sectionHeading: { marginTop: 22, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionTitle: { fontSize: 20, color: colors.onSurface },
    muted: { color: colors.onSurfaceVariant, fontSize: 14 },
    body: { color: colors.onSurface, fontSize: 14, lineHeight: 20 },
    notice: { marginBottom: 14, borderColor: colors.error },
    errorTitle: { color: colors.error, fontWeight: '700', marginBottom: 6 },
    buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    saving: { color: colors.onSurfaceVariant, textAlign: 'right', marginVertical: 8 },
    dayCard: { marginTop: 10, borderColor: colors.outlineVariant, backgroundColor: colors.surface },
    dayTitle: { color: colors.primary, fontSize: 16, fontWeight: '700', marginBottom: 6 },
    listRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 8 },
    flex: { flex: 1 },
    recipeName: { flex: 1, color: colors.onSurface, fontWeight: '600' },
    search: { marginBottom: 10 },
    errorBox: { padding: 12, backgroundColor: colors.errorContainer, borderRadius: 8, marginBottom: 10 },
    loader: { margin: 18 },
    recipeCard: { marginBottom: 10, borderColor: colors.outlineVariant, backgroundColor: colors.surface },
    recipeCardRow: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 10 },
    recipeImage: { width: 58, height: 58, borderRadius: 8, backgroundColor: colors.surfaceVariant },
    recipeInfo: { flex: 1, gap: 4 },
    actionButton: { marginTop: 12, marginBottom: 8 },
    emptyState: { paddingVertical: 28, paddingHorizontal: 12, alignItems: 'center' },
    shoppingCard: { marginTop: 8, paddingHorizontal: 6, borderColor: colors.outlineVariant, backgroundColor: colors.surface },
    ingredient: { flex: 1, color: colors.onSurface },
    checked: { color: colors.onSurfaceVariant, textDecorationLine: 'line-through' },
    collectionCard: { marginTop: 10, borderColor: colors.outlineVariant, backgroundColor: colors.surface },
    browseLink: { marginTop: 18, alignSelf: 'center' },
    dialogLabel: { color: colors.onSurface, fontWeight: '600', marginTop: 8, marginBottom: 8 },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    recipeDialog: { maxHeight: '85%' },
    dialogSearch: { marginBottom: 10 },
  });
}
