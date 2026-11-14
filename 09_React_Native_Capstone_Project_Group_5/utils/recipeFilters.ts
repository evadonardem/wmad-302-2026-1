/**
 * Pure helpers for filtering, sorting and paginating recipes.
 * DummyJSON can only search by text, so category / cuisine / difficulty
 * filters, sorting and pagination are applied on the client.
 */
import { Category, PagedRecipes, Recipe, RecipeFilters, SortOption } from '@/types/recipe';

export function totalTime(recipe: Pick<Recipe, 'prepTimeMinutes' | 'cookTimeMinutes'>): number {
    return recipe.prepTimeMinutes + recipe.cookTimeMinutes;
}

export function formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/**
 * DummyJSON writes some meal types two ways ("Snack" and "Snacks"). They are the same category,
 * so every place that lists or filters by meal type goes through these helpers.
 */
const MEAL_ALIASES: Record<string, string> = {
    snacks: 'Snack',
    desserts: 'Dessert',
    appetizers: 'Appetizer',
    beverages: 'Beverage',
    drinks: 'Beverage',
};

export function canonicalMealType(name: string): string {
    const trimmed = name.trim();
    return MEAL_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

/** A recipe's meal types, canonical and without duplicates. */
export function mealTypesOf(recipe: Pick<Recipe, 'mealType'>): string[] {
    return Array.from(new Set(recipe.mealType.map(canonicalMealType)));
}

export function hasMealType(recipe: Pick<Recipe, 'mealType'>, name: string): boolean {
    const wanted = canonicalMealType(name).toLowerCase();
    return mealTypesOf(recipe).some((m) => m.toLowerCase() === wanted);
}

export function filterRecipes(recipes: Recipe[], filters: RecipeFilters): Recipe[] {
    const category = filters.category?.toLowerCase();
    const cuisine = filters.cuisine?.toLowerCase();
    const tag = filters.tag?.toLowerCase();
    return recipes.filter((r) => {
        if (category && !hasMealType(r, category)) return false;
        if (cuisine && r.cuisine.toLowerCase() !== cuisine) return false;
        if (tag && !r.tags.some((t) => t.toLowerCase() === tag)) return false;
        if (filters.difficulty && r.difficulty !== filters.difficulty) return false;
        return true;
    });
}

export function sortRecipes(recipes: Recipe[], sort: SortOption = 'relevance'): Recipe[] {
    const copy = [...recipes];
    switch (sort) {
        case 'rating':
            return copy.sort((a, b) => b.rating - a.rating);
        case 'time':
            return copy.sort((a, b) => totalTime(a) - totalTime(b));
        case 'calories':
            return copy.sort((a, b) => a.caloriesPerServing - b.caloriesPerServing);
        default:
            return copy;
    }
}

export function paginate(items: Recipe[], skip: number, limit: number): PagedRecipes {
    return {
        data: items.slice(skip, skip + limit),
        total: items.length,
        hasMore: skip + limit < items.length,
    };
}

/** Categories are the meal types found in the data, with recipe counts. */
export function getCategories(recipes: Recipe[]): Category[] {
    const counts = new Map<string, number>();
    recipes.forEach((r) => mealTypesOf(r).forEach((m) => counts.set(m, (counts.get(m) ?? 0) + 1)));
    return Array.from(counts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function getCuisines(recipes: Recipe[]): string[] {
    return Array.from(new Set(recipes.map((r) => r.cuisine))).sort((a, b) => a.localeCompare(b));
}

function countBy(values: string[]): Category[] {
    const counts = new Map<string, number>();
    values.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
    return Array.from(counts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Cuisines (Italian, Asian, ...) with recipe counts. */
export function getCuisineCounts(recipes: Recipe[]): Category[] {
    return countBy(recipes.map((r) => r.cuisine));
}

/** Tags (Pizza, Vegetarian, Pasta, ...) with recipe counts. */
export function getTagCounts(recipes: Recipe[]): Category[] {
    return countBy(recipes.flatMap((r) => r.tags));
}

/* ------------------------------------------------------------------ */
/* Meal planner helpers                                                */
/* ------------------------------------------------------------------ */

export const PLAN_MEALS = ['Breakfast', 'Lunch', 'Dinner'] as const;
export type PlanMeal = (typeof PLAN_MEALS)[number];
/** Planned meals: "2025-06-23|Dinner" -> recipe id */
export type MealPlan = Record<string, number>;

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Monday of the week that contains `date` (local time, midnight). */
export function startOfWeek(date: Date): Date {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
}

export function addDays(date: Date, days: number): Date {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() + days);
    return d;
}

export function dateKey(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function slotKey(date: Date, meal: PlanMeal): string {
    return `${dateKey(date)}|${meal}`;
}

export function formatShortDate(date: Date): string {
    return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/** "Jun 23 - Jun 29" for the week starting at `start`. */
export function formatWeekRange(start: Date): string {
    return `${formatShortDate(start)} - ${formatShortDate(addDays(start, 6))}`;
}

/**
 * Fills every empty breakfast / lunch / dinner slot of the week with a recipe of that meal type.
 * Recipes are not repeated within the week while there are unused ones left. Existing slots are kept.
 */
export function generatePlan(
    recipes: Recipe[],
    weekStart: Date,
    existing: MealPlan,
    random: () => number = Math.random
): { plan: MealPlan; added: number } {
    const plan: MealPlan = { ...existing };
    const used = new Set<number>(Object.values(existing));
    let added = 0;
    for (let i = 0; i < 7; i++) {
        for (const meal of PLAN_MEALS) {
            const key = slotKey(addDays(weekStart, i), meal);
            if (plan[key] !== undefined) continue;
            const matching = recipes.filter((r) => hasMealType(r, meal));
            const pool = matching.length > 0 ? matching : recipes;
            if (pool.length === 0) continue;
            const fresh = pool.filter((r) => !used.has(r.id));
            const choices = fresh.length > 0 ? fresh : pool;
            const pick = choices[Math.floor(random() * choices.length)];
            plan[key] = pick.id;
            used.add(pick.id);
            added += 1;
        }
    }
    return { plan, added };
}

export interface ShoppingGroup {
    aisle: string;
    items: { name: string; count: number }[];
}

const AISLES: [string, RegExp][] = [
    ['Pantry', /\b(salt|black pepper|ground pepper|pepper to taste|peppercorn|sauce|paste|stock|broth|oil|vinegar|powder|syrup|honey|sugar|canned)\b/],
    ['Meat & Seafood', /chicken|beef|pork|lamb|turkey|bacon|sausage|\bham\b|steak|fish|salmon|tuna|shrimp|prawn|crab|lobster|\bcod\b|mince|meat|duck|brisket|\bribs?\b/],
    ['Dairy & Eggs', /milk|cheese|butter|cream|yogh?urt|\beggs?\b|mozzarella|parmesan|cheddar|ricotta|feta/],
    ['Bakery & Grains', /bread|flour|dough|\brice\b|pasta|noodle|tortilla|\boats?\b|\bbuns?\b|spaghetti|couscous|quinoa|cracker|pita|naan|bagel|crust|macaroni|penne|lasagna/],
    ['Produce', /tomato|onion|garlic|lettuce|spinach|carrot|potato|pepper|cucumber|avocado|lemon|lime|apple|banana|berr|mushroom|broccoli|celery|cabbage|basil|parsley|cilantro|mint|ginger|herb|zucchini|corn|\bpeas?\b|scallion|chive|fruit|orange|mango|pineapple|eggplant|kale|cauliflower|asparagus|squash|pumpkin|radish|beet|leek|shallot|jalape|chil[il]|thyme|rosemary|dill|oregano|cherr|peach|grape/],
    ['Pantry', /spice|mustard|ketchup|mayo|vanilla|baking|cumin|paprika|cinnamon|\bnuts?\b|almond|walnut|seed|beans?\b|lentil|chickpea|coconut|cocoa|chocolate|jam|water|wine|extract|seasoning|flakes|curry|turmeric|nutmeg/],
];
export const AISLE_ORDER = ['Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Bakery & Grains', 'Pantry', 'Other'];

export function aisleFor(ingredient: string): string {
    const text = ingredient.toLowerCase();
    const hit = AISLES.find(([, re]) => re.test(text));
    return hit ? hit[0] : 'Other';
}

/** Combines the ingredients of the given meals (repeat meals count twice) and sorts them by aisle. */
export function buildShoppingList(meals: Recipe[]): ShoppingGroup[] {
    const counts = new Map<string, { name: string; count: number }>();
    meals.forEach((r) =>
        r.ingredients.forEach((raw) => {
            const name = raw.trim();
            if (!name) return;
            const key = name.toLowerCase();
            const entry = counts.get(key);
            if (entry) entry.count += 1;
            else counts.set(key, { name, count: 1 });
        })
    );
    const groups = new Map<string, ShoppingGroup['items']>();
    counts.forEach((item) => {
        const aisle = aisleFor(item.name);
        groups.set(aisle, [...(groups.get(aisle) ?? []), item]);
    });
    return AISLE_ORDER.filter((a) => groups.has(a)).map((aisle) => ({
        aisle,
        items: (groups.get(aisle) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    }));
}

/**
 * Page buttons to show under a list: 1 … 4 5 6 … 9. Always includes the first, last and current
 * page; "…" stands for skipped pages.
 */
export function getPageNumbers(current: number, totalPages: number): (number | '…')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '…')[] = [1];
    const start = Math.max(2, Math.min(current - 1, totalPages - 4));
    const end = Math.min(totalPages - 1, Math.max(current + 1, 5));
    if (start > 2) pages.push('…');
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < totalPages - 1) pages.push('…');
    pages.push(totalPages);
    return pages;
}