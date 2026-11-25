import { describe, expect, it, jest } from '@jest/globals';
import { createDefaultMealPlannerState, parseMealPlannerState } from './mealPlannerStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('meal planner storage', () => {
  it('creates an empty planner when nothing has been saved', () => {
    expect(parseMealPlannerState(null)).toEqual(createDefaultMealPlannerState());
  });

  it('restores valid plans, preferences, and grocery items', () => {
    const savedState = {
      plans: { '2026-11-13': { Dinner: 42 } },
      groceryItems: [{ id: 'tomatoes', name: 'Tomatoes', checked: true }],
      preferences: ['Vegetarian'],
      calorieTarget: 2100,
    };

    expect(parseMealPlannerState(JSON.stringify(savedState))).toEqual(savedState);
  });

  it('rejects invalid saved data rather than silently discarding it', () => {
    expect(() => parseMealPlannerState('{invalid json')).toThrow('Saved meal planner data is invalid');
    expect(() => parseMealPlannerState(JSON.stringify({ calorieTarget: 2000 }))).toThrow(
      'Saved meal planner data is incomplete or invalid'
    );
  });
});