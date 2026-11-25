/**
 * Shared recipe data hooks
 *
 * DummyJSON has only ~50 recipes, so the app loads them all once (limit=0)
 * and shares the same copy between Home, Favorites, Meal planner, Collections,
 * Fridge and Profile instead of downloading them on every screen.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';

let cachedRecipes: Recipe[] | null = null;
let pendingRequest: Promise<Recipe[]> | null = null;

export function fetchAllRecipes(force = false): Promise<Recipe[]> {
  if (cachedRecipes && !force) return Promise.resolve(cachedRecipes);
  if (pendingRequest && !force) return pendingRequest;
  pendingRequest = recipeApi
    .getRecipes({ limit: 0 })
    .then((data) => {
      cachedRecipes = data.recipes;
      return data.recipes;
    })
    .finally(() => {
      pendingRequest = null;
    });
  return pendingRequest;
}

export function useAllRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>(cachedRecipes ?? []);
  const [loading, setLoading] = useState(!cachedRecipes);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      setRecipes(await fetchAllRecipes(force));
    } catch {
      setError('Could not load recipes. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!cachedRecipes) load();
  }, [load]);

  const byId = useMemo(
    () => new Map<number, Recipe>(recipes.map((recipe): [number, Recipe] => [recipe.id, recipe])),
    [recipes]
  );

  /** Look up recipes by id, keeping the given order and skipping unknown ids */
  const pick = useCallback(
    (ids: number[]) => ids.map((id) => byId.get(id)).filter((r): r is Recipe => r !== undefined),
    [byId]
  );

  return { recipes, loading, error, reload: () => load(true), byId, pick };
}

export const totalMinutes = (recipe: Recipe) => recipe.prepTimeMinutes + recipe.cookTimeMinutes;
