/**
 * Meal Planner Screen - plan breakfast, lunch and dinner for each day of the week,
 * auto-fill the week, then turn the planned meals into a shopping list.
 *
 * Data: every recipe from DummyJSON (cached). The plan and the ticked shopping items
 * are saved on the device with AsyncStorage.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';
import {
    addDays,
    buildShoppingList,
    DAY_NAMES,
    dateKey,
    formatShortDate,
    formatWeekRange,
    generatePlan,
    MealPlan,
    PLAN_MEALS,
    PlanMeal,
    slotKey,
    startOfWeek,
} from '@/utils/recipeFilters';
import { routes } from '@/utils/routes';
import { ConfirmDialog, ErrorState, Screen, Skeleton, snackbarStyle, useScrollToTopOnNav } from '@/components';
import { MEAL_ICON, Slot, itemKey, SlotCell, SlotRow, RecipePicker, ShoppingCard } from '@/components/PlannerParts';
import { createStyles, tc, useAppTheme } from '@/context/ThemeContext';

const STORAGE_KEY = 'meal_plan_v1';





/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */





/* ------------------------------------------------------------------ */
/* Recipe picker                                                       */
/* ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ */
/* Shopping list                                                       */
/* ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function PlannerScreen() {
    useAppTheme();
    const scrollRef = useRef<ScrollView>(null);
    useScrollToTopOnNav(() => scrollRef.current?.scrollTo({ y: 0, animated: true }));
    const router = useRouter();
    const { width } = useWindowDimensions();
    const wide = width >= 1000;

    const [recipes, setRecipes] = useState<Recipe[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
    const [slots, setSlots] = useState<MealPlan>({});
    const [checked, setChecked] = useState<Record<string, boolean>>({});
    const [restored, setRestored] = useState(false);
    const [dayIndex, setDayIndex] = useState(() => (new Date().getDay() + 6) % 7);
    const [picker, setPicker] = useState<Slot | null>(null);
    const [listOpen, setListOpen] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const [snack, setSnack] = useState('');

    const load = useCallback(() => {
        setError(null);
        setRecipes(null);
        recipeApi
            .getAllRecipes()
            .then(setRecipes)
            .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not load recipes'));
    }, []);
    useEffect(load, [load]);

    // Restore the saved plan once, then save every change
    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY)
            .then((raw) => {
                if (!raw) return;
                const saved = JSON.parse(raw) as { slots?: MealPlan; checked?: Record<string, boolean> };
                setSlots(saved.slots ?? {});
                setChecked(saved.checked ?? {});
            })
            .catch(() => { })
            .finally(() => setRestored(true));
    }, []);
    useEffect(() => {
        if (!restored) return;
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ slots, checked })).catch(() => { });
    }, [slots, checked, restored]);

    const byId = useMemo(() => new Map((recipes ?? []).map((r) => [r.id, r])), [recipes]);
    const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
    const todayKey = dateKey(new Date());
    const isThisWeek = dateKey(weekStart) === dateKey(startOfWeek(new Date()));

    const recipeAt = (date: Date, meal: PlanMeal): Recipe | undefined => {
        const id = slots[slotKey(date, meal)];
        return id === undefined ? undefined : byId.get(id);
    };

    // Everything planned this week
    const planned = useMemo(() => {
        const list: Recipe[] = [];
        days.forEach((d) =>
            PLAN_MEALS.forEach((m) => {
                const id = slots[slotKey(d, m)];
                const r = id === undefined ? undefined : byId.get(id);
                if (r) list.push(r);
            })
        );
        return list;
    }, [days, slots, byId]);

    const dayCalories = (date: Date) =>
        PLAN_MEALS.reduce((sum, m) => sum + (recipeAt(date, m)?.caloriesPerServing ?? 0), 0);
    const daysWithMeals = days.filter((d) => dayCalories(d) > 0).length;
    const avgCalories = daysWithMeals > 0 ? Math.round(planned.reduce((s, r) => s + r.caloriesPerServing, 0) / daysWithMeals) : 0;

    const groups = useMemo(() => buildShoppingList(planned), [planned]);

    const changeWeek = (delta: number) => {
        const next = addDays(weekStart, delta * 7);
        setWeekStart(next);
        setDayIndex(dateKey(next) === dateKey(startOfWeek(new Date())) ? (new Date().getDay() + 6) % 7 : 0);
    };

    const setSlot = (slot: Slot, recipe?: Recipe) =>
        setSlots((prev) => {
            const next = { ...prev };
            const key = slotKey(slot.date, slot.meal);
            if (recipe) next[key] = recipe.id;
            else delete next[key];
            return next;
        });

    const onGenerate = () => {
        if (!recipes) return;
        const { plan, added } = generatePlan(recipes, weekStart, slots);
        setSlots(plan);
        setSnack(added > 0 ? `Planned ${added} meal${added === 1 ? '' : 's'} for this week` : 'Every meal this week is already planned');
        if (added > 0) setListOpen(false);
    };

    const onClearWeek = () => {
        setSlots((prev) => {
            const next = { ...prev };
            days.forEach((d) => PLAN_MEALS.forEach((m) => delete next[slotKey(d, m)]));
            return next;
        });
        setConfirmClear(false);
        setListOpen(false);
    };

    const onShare = async () => {
        const lines = groups
            .map((g) => `${g.aisle}\n${g.items.map((i) => `- ${i.name}${i.count > 1 ? ` x${i.count}` : ''}`).join('\n')}`)
            .join('\n\n');
        const text = `Shopping list (${formatWeekRange(weekStart)})\n\n${lines}`;
        if (Platform.OS === 'web') {
            const nav = (globalThis as unknown as { navigator?: { clipboard?: { writeText: (t: string) => Promise<void> } } })
                .navigator;
            try {
                await nav?.clipboard?.writeText(text);
                setSnack('Shopping list copied to the clipboard');
            } catch {
                setSnack('Could not copy the list');
            }
            return;
        }
        try {
            await Share.share({ message: text });
        } catch {
            /* closed without sharing */
        }
    };

    const toggleItem = (name: string) =>
        setChecked((prev) => ({ ...prev, [itemKey(weekStart, name)]: !prev[itemKey(weekStart, name)] }));

    const clearChecked = () =>
        setChecked((prev) => {
            const next = { ...prev };
            const prefix = `${dateKey(weekStart)}|`;
            Object.keys(next).forEach((k) => k.startsWith(prefix) && delete next[k]);
            return next;
        });

    const open = (r: Recipe) => router.push(routes.recipe(r.id));
    const totalSlots = 21;

    /* ---------- body ---------- */

    let body: React.ReactNode;
    if (error) {
        body = <ErrorState message={error} onRetry={load} />;
    } else if (!recipes || !restored) {
        body = (
            <View style={styles.card}>
                <Skeleton height={44} borderRadius={14} style={{ marginBottom: 16 }} />
                <View style={styles.skelGrid}>
                    {Array.from({ length: wide ? 12 : 3 }, (_, i) => (
                        <Skeleton key={i} height={wide ? 150 : 96} borderRadius={16} style={wide ? styles.skelCell : { width: '100%' }} />
                    ))}
                </View>
            </View>
        );
    } else {
        body = (
            <>
                <View style={styles.card}>
                    {/* Week navigation */}
                    <View style={styles.weekNav}>
                        <Pressable
                            onPress={() => changeWeek(-1)}
                            accessibilityRole="button"
                            accessibilityLabel="Previous week"
                            style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}
                        >
                            <MaterialCommunityIcons name="chevron-left" size={22} color={tc('#3C252D')} />
                        </Pressable>
                        <View style={styles.weekCenter}>
                            <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#D81B60" />
                            <Text style={styles.weekText}>{formatWeekRange(weekStart)}</Text>
                            {!isThisWeek && (
                                <Pressable onPress={() => {
                                    setWeekStart(startOfWeek(new Date()));
                                    setDayIndex((new Date().getDay() + 6) % 7);
                                }} accessibilityRole="button">
                                    <Text style={styles.todayLink}>This week</Text>
                                </Pressable>
                            )}
                        </View>
                        <Pressable
                            onPress={() => changeWeek(1)}
                            accessibilityRole="button"
                            accessibilityLabel="Next week"
                            style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}
                        >
                            <MaterialCommunityIcons name="chevron-right" size={22} color={tc('#3C252D')} />
                        </Pressable>
                    </View>

                    {/* Quick stats */}
                    <View style={styles.statRow}>
                        <View style={styles.stat}>
                            <MaterialCommunityIcons name="check-circle-outline" size={16} color="#D81B60" />
                            <Text style={styles.statText}>
                                {planned.length} of {totalSlots} meals planned
                            </Text>
                        </View>
                        <View style={styles.stat}>
                            <MaterialCommunityIcons name="fire" size={16} color="#D81B60" />
                            <Text style={styles.statText}>{avgCalories > 0 ? `Avg ${avgCalories} cal / day` : 'No calories yet'}</Text>
                        </View>
                    </View>

                    {wide ? (
                        <View style={styles.grid}>
                            <View style={styles.gridRow}>
                                <View style={styles.labelCol} />
                                {days.map((d, i) => {
                                    const today = dateKey(d) === todayKey;
                                    const cal = dayCalories(d);
                                    return (
                                        <View key={i} style={styles.dayHead}>
                                            <View style={[styles.dayPill, today && styles.dayPillToday]}>
                                                <Text style={[styles.dayName, today && styles.dayNameToday]}>{DAY_NAMES[i]}</Text>
                                                <Text style={[styles.dayDate, today && styles.dayDateToday]}>{formatShortDate(d)}</Text>
                                            </View>
                                            <Text style={styles.dayCal}>{cal > 0 ? `${cal} cal` : ' '}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                            {PLAN_MEALS.map((meal) => (
                                <View key={meal} style={styles.gridRow}>
                                    <View style={styles.labelCol}>
                                        <View style={styles.mealBadge}>
                                            <MaterialCommunityIcons name={MEAL_ICON[meal]} size={18} color="#D81B60" />
                                        </View>
                                        <Text style={styles.mealLabel}>{meal}</Text>
                                    </View>
                                    {days.map((d, i) => {
                                        const slot = { date: d, meal };
                                        return (
                                            <View key={i} style={styles.cellWrap}>
                                                <SlotCell
                                                    meal={meal}
                                                    recipe={recipeAt(d, meal)}
                                                    onAdd={() => setPicker(slot)}
                                                    onSwap={() => setPicker(slot)}
                                                    onRemove={() => setSlot(slot)}
                                                    onOpen={() => {
                                                        const r = recipeAt(d, meal);
                                                        if (r) open(r);
                                                    }}
                                                />
                                            </View>
                                        );
                                    })}
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View>
                            <View style={styles.dayStrip}>
                                {days.map((d, i) => {
                                    const active = i === dayIndex;
                                    const today = dateKey(d) === todayKey;
                                    return (
                                        <Pressable
                                            key={i}
                                            onPress={() => setDayIndex(i)}
                                            accessibilityRole="button"
                                            accessibilityState={{ selected: active }}
                                            style={[styles.stripDay, active && styles.stripDayActive, today && !active && styles.stripDayToday]}
                                        >
                                            <Text style={[styles.stripName, active && styles.stripTextActive]}>{DAY_NAMES[i]}</Text>
                                            <Text style={[styles.stripDate, active && styles.stripTextActive]}>{d.getDate()}</Text>
                                            <View style={styles.dots}>
                                                {PLAN_MEALS.map((m) => (
                                                    <View
                                                        key={m}
                                                        style={[styles.dot, recipeAt(d, m) && styles.dotOn, active && recipeAt(d, m) && styles.dotOnActive]}
                                                    />
                                                ))}
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </View>
                            <Text style={styles.dayHeading}>
                                {DAY_NAMES[dayIndex]}, {formatShortDate(days[dayIndex])}
                                {dayCalories(days[dayIndex]) > 0 ? `  ·  ${dayCalories(days[dayIndex])} cal` : ''}
                            </Text>
                            {PLAN_MEALS.map((meal) => {
                                const slot = { date: days[dayIndex], meal };
                                return (
                                    <SlotRow
                                        key={meal}
                                        meal={meal}
                                        recipe={recipeAt(slot.date, meal)}
                                        onAdd={() => setPicker(slot)}
                                        onSwap={() => setPicker(slot)}
                                        onRemove={() => setSlot(slot)}
                                        onOpen={() => {
                                            const r = recipeAt(slot.date, meal);
                                            if (r) open(r);
                                        }}
                                    />
                                );
                            })}
                        </View>
                    )}
                </View>

                <ShoppingCard
                    groups={groups}
                    mealCount={planned.length}
                    weekStart={weekStart}
                    checked={checked}
                    open={listOpen}
                    onToggleOpen={() => setListOpen((v) => !v)}
                    onToggleItem={toggleItem}
                    onClearChecked={clearChecked}
                    onShare={onShare}
                />
            </>
        );
    }

    return (
        <Screen decor>
            <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>
                            Weekly <Text style={styles.titleAccent}>Meal</Text> Planner
                        </Text>
                        <Text style={styles.subtitle}>Plan your week, then turn it into a shopping list.</Text>
                    </View>
                    <View style={styles.headerButtons}>
                        {planned.length > 0 && (
                            <Button mode="text" icon="trash-can-outline" textColor={tc('#8A6673')} onPress={() => setConfirmClear(true)} compact>
                                Clear week
                            </Button>
                        )}
                        <Button
                            mode="contained"
                            icon="auto-fix"
                            buttonColor="#D81B60"
                            textColor="#FFFFFF"
                            onPress={onGenerate}
                            disabled={!recipes}
                            contentStyle={styles.generateContent}
                            style={styles.generate}
                        >
                            Generate Plan
                        </Button>
                    </View>
                </View>
                {body}
            </ScrollView>

            <RecipePicker
                slot={picker}
                recipes={recipes ?? []}
                onClose={() => setPicker(null)}
                onPick={(r) => {
                    if (picker) setSlot(picker, r);
                    setPicker(null);
                }}
            />

            <ConfirmDialog
                visible={confirmClear}
                onDismiss={() => setConfirmClear(false)}
                onConfirm={onClearWeek}
                title="Clear this week?"
                message={`This removes every planned meal for ${formatWeekRange(weekStart)}.`}
                icon="calendar-remove-outline"
                confirmLabel="Clear"
                destructive
            />

            <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={2600} style={snackbarStyle}>
                {snack}
            </Snackbar>
        </Screen>
    );
}

const styles = createStyles({
    content: { padding: 16, paddingBottom: 110, gap: 18, maxWidth: 1240, width: '100%', alignSelf: 'center' },
    pressed: { opacity: 0.85 },
    header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 8 },
    headerText: { flexShrink: 1, minWidth: 240 },
    title: { fontSize: 30, fontWeight: '800', color: '#2A2124' },
    titleAccent: { color: '#D81B60' },
    subtitle: { fontSize: 14, color: '#8A6673', marginTop: 4 },
    headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    generate: { borderRadius: 14 },
    generateContent: { paddingVertical: 4, paddingHorizontal: 6 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E9CED8',
        shadowColor: '#5A0F2E',
        shadowOpacity: 0.1,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
    },
    weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    navBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5EBEF', borderWidth: 1, borderColor: '#E9CED8' },
    weekCenter: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1, flexWrap: 'wrap', justifyContent: 'center' },
    weekText: { fontSize: 18, fontWeight: '800', color: '#2A2124' },
    todayLink: { fontSize: 13, fontWeight: '700', color: '#D81B60', textDecorationLine: 'underline' },
    statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 18 },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FDE7EF', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
    statText: { fontSize: 13, fontWeight: '600', color: '#5A3A46' },
    grid: { gap: 10 },
    gridRow: { flexDirection: 'row', gap: 10 },
    labelCol: { width: 74, alignItems: 'center', justifyContent: 'center', gap: 6 },
    mealBadge: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FDE7EF', alignItems: 'center', justifyContent: 'center' },
    mealLabel: { fontSize: 12, fontWeight: '700', color: '#5A3A46' },
    dayHead: { flex: 1, alignItems: 'center', gap: 4 },
    dayPill: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, minWidth: 80 },
    dayPillToday: { backgroundColor: '#D81B60' },
    dayName: { fontSize: 16, fontWeight: '800', color: '#2A2124' },
    dayNameToday: { color: '#FFFFFF' },
    dayDate: { fontSize: 12, color: '#8A6673' },
    dayDateToday: { color: 'rgba(255,255,255,0.9)' },
    dayCal: { fontSize: 11, fontWeight: '600', color: '#8A6673' },
    cellWrap: { flex: 1 },
    dayStrip: { flexDirection: 'row', gap: 6, marginBottom: 16 },
    stripDay: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 14, backgroundColor: '#F5EBEF', borderWidth: 1, borderColor: '#E9CED8', gap: 2 },
    stripDayActive: { backgroundColor: '#D81B60', borderColor: '#D81B60' },
    stripDayToday: { borderColor: '#D81B60' },
    stripName: { fontSize: 11, fontWeight: '700', color: '#8A6673' },
    stripDate: { fontSize: 16, fontWeight: '800', color: '#2A2124' },
    stripTextActive: { color: '#FFFFFF' },
    dots: { flexDirection: 'row', gap: 3, marginTop: 2 },
    dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#E3C7D1' },
    dotOn: { backgroundColor: '#D81B60' },
    dotOnActive: { backgroundColor: '#FFFFFF' },
    dayHeading: { fontSize: 16, fontWeight: '800', color: '#2A2124', marginBottom: 12 },
    skelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    skelCell: { width: '31%', flexGrow: 1 },
});