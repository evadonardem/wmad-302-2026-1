import AsyncStorage from '@react-native-async-storage/async-storage';

export type MealSlot = 'Breakfast' | 'Lunch' | 'Dinner';

export interface GroceryItem {
  id: string;
  name: string;
  checked: boolean;
}

export interface MealPlannerState {
  plans: Record<string, Partial<Record<MealSlot, number>>>;
  groceryItems: GroceryItem[];
  preferences: string[];
  calorieTarget: number;
}

export const MEAL_PLANNER_STORAGE_KEY = 'meal_planner_state_v1';
export const DIET_PREFERENCES = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Keto'] as const;

const mealSlots = new Set<MealSlot>(['Breakfast', 'Lunch', 'Dinner']);
const dietPreferences = new Set<string>(DIET_PREFERENCES);

export function createDefaultMealPlannerState(): MealPlannerState {
  return {
    plans: {},
    groceryItems: [],
    preferences: [],
    calorieTarget: 2000,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseMealPlannerState(serialized: string | null): MealPlannerState {
  if (serialized === null) return createDefaultMealPlannerState();

  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch {
    throw new Error('Saved meal planner data is invalid. Clear it or try again.');
  }

  if (!isRecord(value) || !isRecord(value.plans) || !Array.isArray(value.groceryItems)
    || !Array.isArray(value.preferences) || typeof value.calorieTarget !== 'number'
    || !Number.isInteger(value.calorieTarget) || value.calorieTarget < 1000 || value.calorieTarget > 5000) {
    throw new Error('Saved meal planner data is incomplete or invalid.');
  }

  const plans: MealPlannerState['plans'] = {};
  Object.entries(value.plans).forEach(([date, plan]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isRecord(plan)) {
      throw new Error('Saved meal plan contains an invalid date or day.');
    }

    const savedSlots: Partial<Record<MealSlot, number>> = {};
    Object.entries(plan).forEach(([slot, recipeId]) => {
      if (!mealSlots.has(slot as MealSlot) || typeof recipeId !== 'number' || !Number.isInteger(recipeId)) {
        throw new Error('Saved meal plan contains an invalid recipe selection.');
      }
      savedSlots[slot as MealSlot] = recipeId;
    });
    plans[date] = savedSlots;
  });

  const groceryItems = value.groceryItems.map((item): GroceryItem => {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.name !== 'string'
      || item.name.trim().length === 0 || typeof item.checked !== 'boolean') {
      throw new Error('Saved grocery list contains an invalid item.');
    }
    return { id: item.id, name: item.name, checked: item.checked };
  });

  const preferences = value.preferences.map((preference) => {
    if (typeof preference !== 'string' || !dietPreferences.has(preference)) {
      throw new Error('Saved dietary preferences contain an unsupported value.');
    }
    return preference;
  });

  return {
    plans,
    groceryItems,
    preferences: Array.from(new Set(preferences)),
    calorieTarget: value.calorieTarget,
  };
}

export async function loadMealPlannerState(): Promise<MealPlannerState> {
  const serialized = await AsyncStorage.getItem(MEAL_PLANNER_STORAGE_KEY);
  return parseMealPlannerState(serialized);
}

export async function saveMealPlannerState(state: MealPlannerState): Promise<void> {
  await AsyncStorage.setItem(MEAL_PLANNER_STORAGE_KEY, JSON.stringify(state));
}

