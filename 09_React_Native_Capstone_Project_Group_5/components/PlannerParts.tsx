/**
 * Meal planner pieces: slot cells/rows, recipe picker and shopping-list card (used by app/(app)/(tabs)/planner.tsx).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Recipe } from '@/types/recipe';
import {
    dateKey,
    formatMinutes,
    formatShortDate,
    hasMealType,
    PlanMeal,
    ShoppingGroup,
    totalTime,
    DAY_NAMES,
} from '@/utils/recipeFilters';
import { IconName } from '@/components';
import { createStyles, tc, useAppTheme } from '@/context/ThemeContext';

export const MEAL_ICON: Record<PlanMeal, IconName> = {
    Breakfast: 'coffee',
    Lunch: 'food',
    Dinner: 'silverware-fork-knife',
};

export const AISLE_ICON: Record<string, IconName> = {
    Produce: 'carrot',
    'Meat & Seafood': 'food-drumstick',
    'Dairy & Eggs': 'egg',
    'Bakery & Grains': 'bread-slice',
    Pantry: 'shaker-outline',
    Other: 'basket-outline',
};

export interface Slot {
    date: Date;
    meal: PlanMeal;
}

export const itemKey = (weekStart: Date, name: string) => `${dateKey(weekStart)}|${name.toLowerCase()}`;

export function Meta({ icon, text }: { icon: IconName; text: string }) {
    useAppTheme();
    return (
        <View style={styles.meta}>
            <MaterialCommunityIcons name={icon} size={13} color={tc('#8D6E63')} />
            <Text style={styles.metaText}>{text}</Text>
        </View>
    );
}

/** Round action button that sits on top of a photo (swap / remove). */
export function PhotoAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
    useAppTheme();
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            hitSlop={6}
            style={({ pressed }) => [styles.photoAction, pressed && styles.pressed]}
        >
            <MaterialCommunityIcons name={icon} size={14} color={tc('#3E2723')} />
        </Pressable>
    );
}

/** One cell of the weekly grid (wide screens). */
export function SlotCell({
    recipe,
    meal,
    onAdd,
    onOpen,
    onSwap,
    onRemove,
}: {
    recipe?: Recipe;
    meal: PlanMeal;
    onAdd: () => void;
    onOpen: () => void;
    onSwap: () => void;
    onRemove: () => void;
}) {
    useAppTheme();
    if (!recipe) {
        return (
            <Pressable
                onPress={onAdd}
                accessibilityRole="button"
                accessibilityLabel={`Add ${meal.toLowerCase()}`}
                style={({ pressed }) => [styles.emptyCell, pressed && styles.pressed]}
            >
                <View style={styles.emptyPlus}>
                    <MaterialCommunityIcons name="plus" size={20} color="#E85D04" />
                </View>
                <Text style={styles.emptyText}>Add {meal.toLowerCase()}</Text>
            </Pressable>
        );
    }
    return (
        <View style={styles.cell}>
            <Pressable
                onPress={onOpen}
                accessibilityRole="button"
                accessibilityLabel={`Open recipe ${recipe.name}`}
                style={({ pressed }) => pressed && styles.pressed}
            >
                <View style={styles.cellImageWrap}>
                    <Image source={{ uri: recipe.image }} style={styles.cellImage} resizeMode="cover" />
                </View>
                <Text style={styles.cellTitle} numberOfLines={2}>
                    {recipe.name}
                </Text>
                <View style={styles.cellMeta}>
                    <Meta icon="clock-outline" text={formatMinutes(totalTime(recipe))} />
                    <Meta icon="fire" text={`${recipe.caloriesPerServing}`} />
                </View>
            </Pressable>
            {/* Siblings of the Pressable above (never nested buttons) */}
            <View style={styles.cellActions} pointerEvents="box-none">
                <PhotoAction icon="swap-horizontal" label="Choose another recipe" onPress={onSwap} />
                <PhotoAction icon="close" label="Remove from plan" onPress={onRemove} />
            </View>
        </View>
    );
}

/** One meal of the selected day (phones / narrow windows). */
export function SlotRow({
    recipe,
    meal,
    onAdd,
    onOpen,
    onSwap,
    onRemove,
}: {
    recipe?: Recipe;
    meal: PlanMeal;
    onAdd: () => void;
    onOpen: () => void;
    onSwap: () => void;
    onRemove: () => void;
}) {
    useAppTheme();
    return (
        <View style={styles.rowBlock}>
            <View style={styles.rowLabel}>
                <MaterialCommunityIcons name={MEAL_ICON[meal]} size={16} color="#E85D04" />
                <Text style={styles.rowLabelText}>{meal}</Text>
            </View>
            {recipe ? (
                <View style={styles.rowCard}>
                    <Pressable
                        onPress={onOpen}
                        accessibilityRole="button"
                        accessibilityLabel={`Open recipe ${recipe.name}`}
                        style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}
                    >
                        <Image source={{ uri: recipe.image }} style={styles.rowImage} resizeMode="cover" />
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowTitle} numberOfLines={2}>
                                {recipe.name}
                            </Text>
                            <View style={styles.cellMeta}>
                                <Meta icon="clock-outline" text={formatMinutes(totalTime(recipe))} />
                                <Meta icon="fire" text={`${recipe.caloriesPerServing} cal`} />
                            </View>
                        </View>
                    </Pressable>
                    <View style={styles.rowActions}>
                        <PhotoAction icon="swap-horizontal" label="Choose another recipe" onPress={onSwap} />
                        <PhotoAction icon="close" label="Remove from plan" onPress={onRemove} />
                    </View>
                </View>
            ) : (
                <Pressable
                    onPress={onAdd}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${meal.toLowerCase()}`}
                    style={({ pressed }) => [styles.rowEmpty, pressed && styles.pressed]}
                >
                    <MaterialCommunityIcons name="plus-circle-outline" size={22} color="#E85D04" />
                    <Text style={styles.emptyText}>Add {meal.toLowerCase()}</Text>
                </Pressable>
            )}
        </View>
    );
}

export function RecipePicker({
    slot,
    recipes,
    onPick,
    onClose,
}: {
    slot: Slot | null;
    recipes: Recipe[];
    onPick: (recipe: Recipe) => void;
    onClose: () => void;
}) {
    useAppTheme();
    const [query, setQuery] = useState('');
    const [onlyMeal, setOnlyMeal] = useState(true);

    useEffect(() => {
        if (slot) {
            setQuery('');
            setOnlyMeal(true);
        }
    }, [slot]);

    const results = useMemo(() => {
        if (!slot) return [];
        const q = query.trim().toLowerCase();
        return recipes.filter((r) => {
            if (onlyMeal && !hasMealType(r, slot.meal)) return false;
            if (!q) return true;
            return (
                r.name.toLowerCase().includes(q) ||
                r.cuisine.toLowerCase().includes(q) ||
                r.tags.some((t) => t.toLowerCase().includes(q))
            );
        });
    }, [recipes, slot, query, onlyMeal]);

    return (
        <Modal visible={!!slot} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalRoot}>
                <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
                <View style={styles.sheet}>
                    <View style={styles.sheetHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sheetTitle}>Choose {slot?.meal.toLowerCase()}</Text>
                            {slot && (
                                <Text style={styles.sheetSub}>
                                    {DAY_NAMES[(slot.date.getDay() + 6) % 7]}, {formatShortDate(slot.date)}
                                </Text>
                            )}
                        </View>
                        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={styles.sheetClose}>
                            <MaterialCommunityIcons name="close" size={20} color={tc('#3E2723')} />
                        </Pressable>
                    </View>

                    <View style={styles.searchBox}>
                        <MaterialCommunityIcons name="magnify" size={20} color={tc('#8D6E63')} />
                        <TextInput
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Search recipes, cuisines, tags"
                            placeholderTextColor={tc('#A1887F')}
                            style={styles.searchInput}
                            autoCapitalize="none"
                            returnKeyType="search"
                        />
                    </View>

                    <View style={styles.toggleRow}>
                        <Pressable
                            onPress={() => setOnlyMeal(true)}
                            style={[styles.toggle, onlyMeal && styles.toggleActive]}
                            accessibilityRole="button"
                        >
                            <Text style={[styles.toggleText, onlyMeal && styles.toggleTextActive]}>{slot?.meal ?? 'Meal'} ideas</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setOnlyMeal(false)}
                            style={[styles.toggle, !onlyMeal && styles.toggleActive]}
                            accessibilityRole="button"
                        >
                            <Text style={[styles.toggleText, !onlyMeal && styles.toggleTextActive]}>All recipes</Text>
                        </Pressable>
                        <Text style={styles.resultCount}>{results.length} found</Text>
                    </View>

                    <FlatList
                        data={results}
                        keyExtractor={(r) => String(r.id)}
                        style={styles.pickList}
                        keyboardShouldPersistTaps="handled"
                        ListEmptyComponent={<Text style={styles.pickEmpty}>No recipes match. Try another search.</Text>}
                        renderItem={({ item }) => (
                            <Pressable
                                onPress={() => onPick(item)}
                                accessibilityRole="button"
                                accessibilityLabel={`Plan ${item.name}`}
                                style={({ pressed }) => [styles.pickRow, pressed && styles.pressed]}
                            >
                                <Image source={{ uri: item.image }} style={styles.pickImage} resizeMode="cover" />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.pickName} numberOfLines={2}>
                                        {item.name}
                                    </Text>
                                    <Text style={styles.pickMeta}>
                                        {formatMinutes(totalTime(item))} · {item.caloriesPerServing} cal · {item.cuisine}
                                    </Text>
                                </View>
                                <MaterialCommunityIcons name="plus-circle" size={24} color="#E85D04" />
                            </Pressable>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );
}

export function ShoppingCard({
    groups,
    mealCount,
    weekStart,
    checked,
    open,
    onToggleOpen,
    onToggleItem,
    onClearChecked,
    onShare,
}: {
    groups: ShoppingGroup[];
    mealCount: number;
    weekStart: Date;
    checked: Record<string, boolean>;
    open: boolean;
    onToggleOpen: () => void;
    onToggleItem: (name: string) => void;
    onClearChecked: () => void;
    onShare: () => void;
}) {
    useAppTheme();
    const total = groups.reduce((n, g) => n + g.items.length, 0);
    const done = groups.reduce((n, g) => n + g.items.filter((i) => checked[itemKey(weekStart, i.name)]).length, 0);
    const pct = total > 0 ? done / total : 0;

    return (
        <View style={styles.card}>
            <View style={styles.shopHeader}>
                <View style={styles.shopIcon}>
                    <MaterialCommunityIcons name="cart-outline" size={26} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.shopTitle}>Shopping List Generator</Text>
                    <Text style={styles.shopSub}>Create your shopping list from planned meals</Text>
                </View>
                <Button
                    mode={open ? 'outlined' : 'contained'}
                    icon={open ? 'chevron-up' : 'cart-plus'}
                    onPress={onToggleOpen}
                    disabled={mealCount === 0}
                    buttonColor={open ? undefined : '#E85D04'}
                    textColor={open ? '#E85D04' : '#FFFFFF'}
                    compact
                >
                    {open ? 'Hide' : 'Generate'}
                </Button>
            </View>

            {mealCount === 0 && (
                <Text style={styles.shopHint}>Plan at least one meal this week and your ingredients will show up here.</Text>
            )}

            {open && mealCount > 0 && (
                <View style={styles.shopBody}>
                    <View style={styles.progressRow}>
                        <Text style={styles.progressText}>
                            {total} items from {mealCount} {mealCount === 1 ? 'meal' : 'meals'} · {done} got
                        </Text>
                        <View style={styles.progressActions}>
                            {done > 0 && (
                                <Pressable onPress={onClearChecked} accessibilityRole="button">
                                    <Text style={styles.linkText}>Clear ticks</Text>
                                </Pressable>
                            )}
                            <Pressable onPress={onShare} accessibilityRole="button" style={styles.shareBtn}>
                                <MaterialCommunityIcons name={Platform.OS === 'web' ? 'content-copy' : 'share-variant'} size={15} color="#E85D04" />
                                <Text style={styles.linkText}>{Platform.OS === 'web' ? 'Copy list' : 'Share'}</Text>
                            </Pressable>
                        </View>
                    </View>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` }]} />
                    </View>

                    <View style={styles.aisles}>
                        {groups.map((g) => (
                            <View key={g.aisle} style={styles.aisle}>
                                <View style={styles.aisleHeader}>
                                    <MaterialCommunityIcons name={AISLE_ICON[g.aisle] ?? 'basket-outline'} size={18} color="#E85D04" />
                                    <Text style={styles.aisleTitle}>{g.aisle}</Text>
                                    <Text style={styles.aisleCount}>{g.items.length}</Text>
                                </View>
                                {g.items.map((item) => {
                                    const on = !!checked[itemKey(weekStart, item.name)];
                                    return (
                                        <Pressable
                                            key={item.name}
                                            onPress={() => onToggleItem(item.name)}
                                            accessibilityRole="checkbox"
                                            accessibilityState={{ checked: on }}
                                            style={({ pressed }) => [styles.itemRow, pressed && styles.pressed]}
                                        >
                                            <MaterialCommunityIcons
                                                name={on ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                                                size={22}
                                                color={on ? '#43A047' : tc('#BCAAA4')}
                                            />
                                            <Text style={[styles.itemText, on && styles.itemDone]} numberOfLines={2}>
                                                {item.name}
                                            </Text>
                                            {item.count > 1 && (
                                                <View style={styles.countChip}>
                                                    <Text style={styles.countChipText}>×{item.count}</Text>
                                                </View>
                                            )}
                                        </Pressable>
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = createStyles({
    pressed: { opacity: 0.85 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 20,
        borderWidth: 1,
        borderColor: '#EBDDCC',
        shadowColor: '#5D2E00',
        shadowOpacity: 0.1,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
    },
    cell: { flex: 1, backgroundColor: '#FFFDF8', borderRadius: 16, padding: 8, borderWidth: 1, borderColor: '#EBDDCC', position: 'relative' },
    cellImageWrap: { width: '100%', aspectRatio: 1.25, borderRadius: 12, overflow: 'hidden', backgroundColor: '#EFE3D6' },
    cellImage: { width: '100%', height: '100%' },
    cellTitle: { fontSize: 12.5, fontWeight: '700', color: '#2B2320', lineHeight: 17, marginTop: 8, minHeight: 34 },
    cellMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
    cellActions: { position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between' },
    photoAction: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.95)', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    metaText: { fontSize: 11.5, color: '#8D6E63', fontWeight: '600' },
    emptyCell: { flex: 1, minHeight: 150, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#E6D6C4', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFDF8' },
    emptyPlus: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: 13, fontWeight: '600', color: '#8D6E63' },
    rowBlock: { marginBottom: 14 },
    rowLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    rowLabelText: { fontSize: 13, fontWeight: '800', color: '#5D4037', textTransform: 'uppercase', letterSpacing: 0.6 },
    rowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFDF8', borderRadius: 18, padding: 10, borderWidth: 1, borderColor: '#EBDDCC', gap: 8 },
    rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    rowImage: { width: 84, height: 84, borderRadius: 14, backgroundColor: '#EFE3D6' },
    rowInfo: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: '700', color: '#2B2320', lineHeight: 20 },
    rowActions: { gap: 8 },
    rowEmpty: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 84, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#E6D6C4', backgroundColor: '#FFFDF8' },
    modalRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,10,5,0.55)' },
    sheet: { width: '100%', maxWidth: 560, maxHeight: '86%', backgroundColor: '#FFFFFF', borderRadius: 26, padding: 18, borderWidth: 1, borderColor: '#EBDDCC' },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    sheetTitle: { fontSize: 20, fontWeight: '800', color: '#2B2320', textTransform: 'capitalize' },
    sheetSub: { fontSize: 13, color: '#8D6E63', marginTop: 2 },
    sheetClose: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F1EA' },
    searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, borderRadius: 23, paddingHorizontal: 14, backgroundColor: '#F6F1EA', borderWidth: 1, borderColor: '#EBDDCC' },
    searchInput: { flex: 1, fontSize: 15, color: '#3E2723', height: 44, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}) },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 8 },
    toggle: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: '#E6D6C4', backgroundColor: '#FFFFFF' },
    toggleActive: { backgroundColor: '#E85D04', borderColor: '#E85D04' },
    toggleText: { fontSize: 13, fontWeight: '600', color: '#5D4037' },
    toggleTextActive: { color: '#FFFFFF' },
    resultCount: { marginLeft: 'auto', fontSize: 12, color: '#8D6E63' },
    pickList: { flexGrow: 0 },
    pickRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#F0E6DC' },
    pickImage: { width: 58, height: 58, borderRadius: 12, backgroundColor: '#EFE3D6' },
    pickName: { fontSize: 15, fontWeight: '700', color: '#2B2320' },
    pickMeta: { fontSize: 12, color: '#8D6E63', marginTop: 3 },
    pickEmpty: { textAlign: 'center', color: '#8D6E63', paddingVertical: 28 },
    shopHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
    shopIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#E85D04', alignItems: 'center', justifyContent: 'center' },
    shopTitle: { fontSize: 20, fontWeight: '800', color: '#2B2320' },
    shopSub: { fontSize: 13, color: '#8D6E63', marginTop: 2 },
    shopHint: { marginTop: 14, fontSize: 13, color: '#8D6E63' },
    shopBody: { marginTop: 18 },
    progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
    progressText: { fontSize: 13, fontWeight: '600', color: '#5D4037' },
    progressActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    linkText: { fontSize: 13, fontWeight: '700', color: '#E85D04' },
    progressTrack: { height: 8, borderRadius: 4, backgroundColor: '#EFE3D6', marginTop: 10, overflow: 'hidden' },
    progressFill: { height: 8, borderRadius: 4, backgroundColor: '#43A047' },
    aisles: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    aisle: { flexGrow: 1, flexBasis: 280, backgroundColor: '#FFFDF8', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#EBDDCC' },
    aisleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    aisleTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: '#2B2320' },
    aisleCount: { fontSize: 12, fontWeight: '700', color: '#8D6E63' },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
    itemText: { flex: 1, fontSize: 14, color: '#3E2723' },
    itemDone: { color: '#BCAAA4', textDecorationLine: 'line-through' },
    countChip: { backgroundColor: '#FFF3E0', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
    countChipText: { fontSize: 12, fontWeight: '800', color: '#E65100' },
});