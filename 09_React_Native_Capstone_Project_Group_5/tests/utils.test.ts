import {
    detectSeconds,
    formatClock,
    formatQuantity,
    parseQuantity,
    scaleIngredient,
    scaleIngredientParts,
} from '@/utils/cooking';
import {
    addDays,
    aisleFor,
    buildShoppingList,
    canonicalMealType,
    dateKey,
    filterRecipes,
    formatWeekRange,
    generatePlan,
    getPageNumbers,
    hasMealType,
    startOfWeek,
    formatMinutes,
    getCategories,
    getCuisineCounts,
    getTagCounts,
    getCuisines,
    paginate,
    sortRecipes,
    totalTime,
} from '@/utils/recipeFilters';
import { validateProfile, validateRegister } from '@/utils/validation';
import { routes } from '@/utils/routes';
import { Recipe } from '@/types/recipe';

const make = (over: Partial<Recipe>): Recipe => ({
    id: 1,
    name: 'R',
    ingredients: [],
    instructions: [],
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    servings: 2,
    difficulty: 'Easy',
    cuisine: 'Italian',
    caloriesPerServing: 300,
    tags: [],
    userId: 1,
    image: '',
    rating: 4,
    reviewCount: 10,
    mealType: ['Dinner'],
    ...over,
});

const recipes = [
    make({ id: 1, rating: 4.1, cuisine: 'Italian', difficulty: 'Easy', mealType: ['Dinner'], caloriesPerServing: 400 }),
    make({ id: 2, rating: 4.9, cuisine: 'Asian', difficulty: 'Hard', mealType: ['Dinner', 'Lunch'], prepTimeMinutes: 60, caloriesPerServing: 200 }),
    make({ id: 3, rating: 3.5, cuisine: 'Italian', difficulty: 'Medium', mealType: ['Snack'], prepTimeMinutes: 5, cookTimeMinutes: 5, caloriesPerServing: 100 }),
];

describe('recipeFilters', () => {
    it('computes and formats time', () => {
        expect(totalTime(recipes[0])).toBe(30);
        expect(formatMinutes(45)).toBe('45 min');
        expect(formatMinutes(120)).toBe('2 h');
        expect(formatMinutes(95)).toBe('1 h 35 min');
    });

    it('filters by category, cuisine and difficulty (case-insensitive, combinable)', () => {
        expect(filterRecipes(recipes, { category: 'dinner' }).map((r) => r.id)).toEqual([1, 2]);
        expect(filterRecipes(recipes, { cuisine: 'Italian' }).map((r) => r.id)).toEqual([1, 3]);
        expect(filterRecipes(recipes, { cuisine: 'Italian', difficulty: 'Medium' }).map((r) => r.id)).toEqual([3]);
        expect(filterRecipes(recipes, {})).toHaveLength(3);
    });

    it('sorts without mutating the input', () => {
        const before = recipes.map((r) => r.id);
        expect(sortRecipes(recipes, 'rating').map((r) => r.id)).toEqual([2, 1, 3]);
        expect(sortRecipes(recipes, 'time').map((r) => r.id)).toEqual([3, 1, 2]);
        expect(sortRecipes(recipes, 'calories').map((r) => r.id)).toEqual([3, 2, 1]);
        expect(sortRecipes(recipes, 'relevance').map((r) => r.id)).toEqual(before);
        expect(recipes.map((r) => r.id)).toEqual(before);
    });

    it('paginates and reports hasMore', () => {
        const first = paginate(recipes, 0, 2);
        expect(first.data).toHaveLength(2);
        expect(first.hasMore).toBe(true);
        expect(first.total).toBe(3);
        const last = paginate(recipes, 2, 2);
        expect(last.data).toHaveLength(1);
        expect(last.hasMore).toBe(false);
    });

    it('derives categories with counts and unique cuisines', () => {
        expect(getCategories(recipes)).toEqual([
            { name: 'Dinner', count: 2 },
            { name: 'Lunch', count: 1 },
            { name: 'Snack', count: 1 },
        ]);
        expect(getCuisines(recipes)).toEqual(['Asian', 'Italian']);
    });
});

describe('validation', () => {
    const valid = {
        firstName: 'Ana',
        lastName: 'Cruz',
        username: 'ana_cruz',
        email: 'ana@example.com',
        password: 'secret1',
        confirmPassword: 'secret1',
        age: '',
    };

    it('accepts a valid registration', () => {
        expect(validateRegister(valid)).toEqual({});
    });

    it('flags each invalid register field', () => {
        const errors = validateRegister({
            firstName: '',
            lastName: ' ',
            username: 'a!',
            email: 'nope',
            password: '123',
            confirmPassword: '456',
            age: '200',
        });
        expect(Object.keys(errors).sort()).toEqual(
            ['age', 'confirmPassword', 'email', 'firstName', 'lastName', 'password', 'username'].sort()
        );
    });

    it('checks password confirmation', () => {
        expect(validateRegister({ ...valid, confirmPassword: 'other' }).confirmPassword).toBe('Passwords do not match');
    });

    it('validates the profile form', () => {
        expect(validateProfile({ firstName: 'A', lastName: 'B', email: 'a@b.co' })).toEqual({});
        expect(validateProfile({ firstName: '', lastName: 'B', email: 'bad' })).toEqual({
            firstName: 'First name is required',
            email: 'Enter a valid email address',
        });
    });
});

describe('routes', () => {
    it('builds recipe and search routes', () => {
        expect(routes.recipe(7)).toBe('/recipe/7');
        expect(routes.search()).toBe('/search');
        expect(routes.search('Side Dish')).toBe('/search?category=Side%20Dish');
    });
});

describe('cooking timer helpers', () => {
    it('detects times written in a step', () => {
        expect(detectSeconds('Bake for 12-15 minutes until golden')).toBe(15 * 60);
        expect(detectSeconds('Simmer for 2 minutes')).toBe(120);
        expect(detectSeconds('Rest 30 seconds')).toBe(30);
        expect(detectSeconds('Marinate for 1 hour')).toBe(3600);
    });

    it('returns null when a step has no time', () => {
        expect(detectSeconds('Slice and serve hot.')).toBeNull();
        expect(detectSeconds('Preheat the oven to 475°F (245°C).')).toBeNull();
    });

    it('formats the clock', () => {
        expect(formatClock(725)).toBe('12:05');
        expect(formatClock(59)).toBe('00:59');
        expect(formatClock(3725)).toBe('1:02:05');
    });
});

describe('cuisine and tag categories', () => {
    const make = (id: number, cuisine: string, tags: string[]) =>
        ({ id, name: `R${id}`, cuisine, tags, mealType: ['Dinner'], ingredients: [], instructions: [] }) as unknown as Parameters<typeof filterRecipes>[0][number];
    const list = [make(1, 'Italian', ['Pizza', 'Vegetarian']), make(2, 'Italian', ['Pasta']), make(3, 'Asian', ['Vegetarian'])];

    it('counts cuisines and tags', () => {
        expect(getCuisineCounts(list)[0]).toEqual({ name: 'Italian', count: 2 });
        expect(getTagCounts(list)[0]).toEqual({ name: 'Vegetarian', count: 2 });
    });

    it('filters by tag', () => {
        expect(filterRecipes(list, { tag: 'vegetarian' }).map((r) => r.id)).toEqual([1, 3]);
    });

    it('builds search routes for every filter kind', () => {
        expect(routes.search({ cuisine: 'Italian' })).toBe('/search?cuisine=Italian');
        expect(routes.search({ tag: 'Side Dish' })).toBe('/search?tag=Side%20Dish');
    });
});

describe('meal types and the meal planner', () => {
    it('treats Snack and Snacks as one category', () => {
        expect(canonicalMealType('Snacks')).toBe('Snack');
        const r = make({ id: 9, mealType: ['Snack', 'Snacks', 'Dinner'] });
        expect(hasMealType(r, 'snacks')).toBe(true);
        expect(getCategories([r]).map((c) => c.name).sort()).toEqual(['Dinner', 'Snack']);
        expect(getCategories([r]).find((c) => c.name === 'Snack')?.count).toBe(1);
    });

    it('finds the Monday of a week and formats the range', () => {
        const monday = startOfWeek(new Date(2025, 5, 25)); // Wed 25 Jun 2025
        expect(dateKey(monday)).toBe('2025-06-23');
        expect(dateKey(startOfWeek(new Date(2025, 5, 29)))).toBe('2025-06-23'); // Sunday
        expect(formatWeekRange(monday)).toBe('Jun 23 - Jun 29');
        expect(dateKey(addDays(monday, 7))).toBe('2025-06-30');
    });

    it('generates a plan without touching existing slots or repeating recipes', () => {
        const pool = Array.from({ length: 30 }, (_, i) =>
            make({ id: i + 1, mealType: [['Breakfast', 'Lunch', 'Dinner'][i % 3]] })
        );
        const monday = startOfWeek(new Date(2025, 5, 25));
        const { plan, added } = generatePlan(pool, monday, { '2025-06-23|Dinner': 3 }, () => 0);
        expect(added).toBe(20);
        expect(plan['2025-06-23|Dinner']).toBe(3);
        expect(new Set(Object.values(plan)).size).toBe(21);
    });

    it('combines ingredients into aisles', () => {
        const groups = buildShoppingList([
            make({ ingredients: ['Chicken breast', 'Olive oil', 'Tomato'] }),
            make({ ingredients: ['chicken breast', 'Milk'] }),
        ]);
        const meat = groups.find((g) => g.aisle === 'Meat & Seafood');
        expect(meat?.items).toEqual([{ name: 'Chicken breast', count: 2 }]);
        expect(aisleFor('Salt and pepper to taste')).toBe('Pantry');
        expect(aisleFor('Milk')).toBe('Dairy & Eggs');
    });
});

describe('serving size calculator', () => {
    it('parses whole numbers, fractions, mixed numbers and unicode fractions', () => {
        expect(parseQuantity('2')).toBe(2);
        expect(parseQuantity('1/2')).toBe(0.5);
        expect(parseQuantity('2 1/4')).toBe(2.25);
        expect(parseQuantity('1½')).toBe(1.5);
    });

    it('formats quantities as tidy fractions', () => {
        expect(formatQuantity(1.5)).toBe('1 ½');
        expect(formatQuantity(0.33)).toBe('⅓');
        expect(formatQuantity(2.98)).toBe('3');
        expect(formatQuantity(0.02)).toBe('⅛');
        expect(formatQuantity(250)).toBe('250');
    });

    it('scales amounts and fixes units', () => {
        expect(scaleIngredient('2 1/4 cups all-purpose flour', 2)).toBe('4 ½ cups all-purpose flour');
        expect(scaleIngredient('1 cup sugar', 2)).toBe('2 cups sugar');
        expect(scaleIngredient('1 cup milk', 0.5)).toBe('½ cup milk');
        expect(scaleIngredient('3 cloves garlic, minced', 1 / 3)).toBe('1 clove garlic, minced');
        expect(scaleIngredient('100g spaghetti', 1.5)).toBe('150g spaghetti');
        expect(scaleIngredient('8-10 oz pasta', 0.5)).toBe('4–5 oz pasta');
    });

    it('leaves lines without an amount alone and keeps the original at x1', () => {
        expect(scaleIngredient('Salt and pepper to taste', 3)).toBe('Salt and pepper to taste');
        expect(scaleIngredient('2-inch piece ginger', 2)).toBe('2-inch piece ginger');
        expect(scaleIngredientParts('Pizza dough', 2).scalable).toBe(false);
        expect(scaleIngredient('1/2 teaspoon salt', 1)).toBe('1/2 teaspoon salt');
    });
});

describe('page numbers', () => {
    it('shows every page when there are few', () => {
        expect(getPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
    });
    it('collapses the middle for long lists', () => {
        expect(getPageNumbers(1, 9)).toEqual([1, 2, 3, 4, 5, '…', 9]);
        expect(getPageNumbers(5, 9)).toEqual([1, '…', 4, 5, 6, '…', 9]);
        expect(getPageNumbers(9, 9)).toEqual([1, '…', 5, 6, 7, 8, 9]);
    });
});