/**
 * HeroSearch - search box for the Home banner with a live results dropdown.
 * Type to see matching recipes right there; tap one to open it.
 */
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { recipeApi } from '@/services/recipeApi';
import { useDebounce } from '@/hooks';
import { Recipe } from '@/types/recipe';
import { formatMinutes, totalTime } from '@/utils/recipeFilters';
import { routes } from '@/utils/routes';
import { createStyles, tc, useAppTheme } from '@/context/ThemeContext';

const MAX_RESULTS = 6;

export function HeroSearch() {
    useAppTheme();
    const router = useRouter();
    const [text, setText] = useState('');
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState<Recipe[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const query = useDebounce(text.trim(), 300);
    const requestRef = useRef(0);

    useEffect(() => {
        if (!query) {
            setResults([]);
            setTotal(0);
            setLoading(false);
            return;
        }
        const id = ++requestRef.current;
        setLoading(true);
        recipeApi
            .queryRecipes({ q: query }, { limit: MAX_RESULTS })
            .then((res) => {
                if (id !== requestRef.current) return; // a newer search is already running
                setResults(res.data);
                setTotal(res.total);
            })
            .catch(() => id === requestRef.current && setResults([]))
            .finally(() => id === requestRef.current && setLoading(false));
    }, [query]);

    const close = () => setOpen(false);
    const clear = () => {
        setText('');
        setResults([]);
        close();
    };
    const openRecipe = (recipe: Recipe) => {
        close();
        router.push(routes.recipe(recipe.id));
    };

    const showDropdown = open && text.trim().length > 0;
    const waiting = loading || text.trim() !== query; // still typing / fetching

    return (
        <View style={styles.wrap}>
            <View style={styles.box}>
                <MaterialCommunityIcons name="magnify" size={20} color={tc('#8D6E63')} />
                <TextInput
                    value={text}
                    onChangeText={(v) => {
                        setText(v);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    // Small delay so a tap on a result still registers before the list closes
                    onBlur={() => setTimeout(close, 200)}
                    onKeyPress={(e) => {
                        if (Platform.OS === 'web' && (e.nativeEvent as { key?: string }).key === 'Escape') close();
                    }}
                    placeholder="Search recipes..."
                    placeholderTextColor={tc('#A1887F')}
                    style={styles.input}
                    returnKeyType="search"
                    autoCorrect={false}
                    accessibilityLabel="Search recipes"
                />
                {waiting && text.trim() ? <ActivityIndicator size="small" color="#E85D04" /> : null}
                {text.length > 0 && (
                    <Pressable onPress={clear} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
                        <MaterialCommunityIcons name="close-circle" size={18} color={tc('#BCAAA4')} />
                    </Pressable>
                )}
            </View>

            {showDropdown && (
                <View style={styles.dropdown}>
                    {results.length === 0 ? (
                        <Text style={styles.empty}>{waiting ? 'Searching...' : `No recipes found for "${text.trim()}"`}</Text>
                    ) : (
                        <>
                            {results.map((r, i) => (
                                <Pressable
                                    key={r.id}
                                    onPress={() => openRecipe(r)}
                                    style={({ pressed }) => [styles.row, i > 0 && styles.rowBorder, pressed && styles.rowPressed]}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Open recipe ${r.name}`}
                                >
                                    <Image source={{ uri: r.image }} style={styles.thumb} />
                                    <View style={styles.rowInfo}>
                                        <Text style={styles.rowTitle} numberOfLines={1}>
                                            {r.name}
                                        </Text>
                                        <Text style={styles.rowSub} numberOfLines={1}>
                                            {r.cuisine} · {formatMinutes(totalTime(r))} · ⭐ {r.rating.toFixed(1)}
                                        </Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={20} color={tc('#BCAAA4')} />
                                </Pressable>
                            ))}
                            {total > results.length && (
                                <Text style={styles.more}>+{total - results.length} more, keep typing to narrow it down</Text>
                            )}
                        </>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = createStyles({
    wrap: { position: 'relative', zIndex: 50, alignSelf: 'stretch', maxWidth: 480, marginTop: 20 },
    box: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 26,
        paddingHorizontal: 16,
        height: 50,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#3E2723',
        height: '100%',
        ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
    },
    dropdown: {
        position: 'absolute',
        top: 58,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#F3E5D8',
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 12,
        zIndex: 60,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 8 },
    rowBorder: { borderTopWidth: 1, borderTopColor: '#F5EFE9' },
    rowPressed: { backgroundColor: '#FFF3E0' },
    thumb: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#EFEBE9' },
    rowInfo: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: '700', color: '#3E2723' },
    rowSub: { fontSize: 12, color: '#8D6E63', marginTop: 2 },
    empty: { padding: 16, fontSize: 14, color: '#8D6E63', textAlign: 'center' },
    more: { fontSize: 12, color: '#8D6E63', textAlign: 'center', paddingVertical: 8 },
});