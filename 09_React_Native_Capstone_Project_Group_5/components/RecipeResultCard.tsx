/**
 * RecipeResultCard - card used on the Search page (grid and horizontal rows).
 * Photo, title, short description, small info chips, difficulty (chef hats) and rating.
 */
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Recipe } from '@/types/recipe';
import { formatMinutes, totalTime } from '@/utils/recipeFilters';
import { createStyles, tc, useAppTheme } from '@/context/ThemeContext';
import { useCardScale } from '@/components';

const HATS: Record<Recipe['difficulty'], number> = { Easy: 1, Medium: 2, Hard: 3 };
const HAT_COLOR: Record<Recipe['difficulty'], string> = { Easy: '#2E7D32', Medium: '#EF6C00', Hard: '#C62828' };

interface Props {
    recipe: Recipe;
    onPress: () => void;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
}

function describe(r: Recipe): string {
    const main = r.ingredients
        .slice(0, 2)
        .map((i) => i.toLowerCase())
        .join(' and ');
    return `${r.cuisine} ${r.mealType[0]?.toLowerCase() ?? 'dish'} for ${r.servings}, made with ${main}.`;
}

export function RecipeResultCard({ recipe, onPress, isFavorite, onToggleFavorite }: Props) {
    useAppTheme();
    const color = HAT_COLOR[recipe.difficulty];
    const { onLayout, sz, ready } = useCardScale(330);
    return (
        <View style={[styles.wrapper, !ready && { opacity: 0 }]} onLayout={onLayout}>
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [styles.card, { padding: sz(12), borderRadius: sz(24) }, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Open recipe ${recipe.name}`}
            >
                <View style={[styles.imageWrap, { borderRadius: sz(18) }]}>
                    <Image source={{ uri: recipe.image }} style={styles.image} resizeMode="cover" />
                    {recipe.rating >= 4.8 && (
                        <View style={styles.topBadge}>
                            <MaterialCommunityIcons name="trophy-outline" size={13} color={tc('#EF6C00')} />
                            <Text style={[styles.topBadgeText, { fontSize: sz(11) }]}>Top rated</Text>
                        </View>
                    )}
                </View>

                <Text style={[styles.title, { fontSize: sz(17), marginTop: sz(12) }]} numberOfLines={1}>
                    {recipe.name}
                </Text>
                <Text style={[styles.desc, { fontSize: sz(13), lineHeight: sz(19), minHeight: sz(38) }]} numberOfLines={2}>
                    {describe(recipe)}
                </Text>

                <View style={styles.chips}>
                    <View style={styles.chip}>
                        <Text style={[styles.chipText, { fontSize: sz(12) }]}>{recipe.mealType[0] ?? 'Dish'}</Text>
                    </View>
                    <View style={styles.chip}>
                        <MaterialCommunityIcons name="fire" size={13} color={tc('#8D6E63')} />
                        <Text style={[styles.chipText, { fontSize: sz(12) }]}>{recipe.caloriesPerServing} kcal</Text>
                    </View>
                    <View style={styles.chip}>
                        <MaterialCommunityIcons name="clock-outline" size={13} color={tc('#8D6E63')} />
                        <Text style={[styles.chipText, { fontSize: sz(12) }]}>{formatMinutes(totalTime(recipe))}</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <View style={[styles.level, { backgroundColor: `${color}1A` }]}>
                        {Array.from({ length: HATS[recipe.difficulty] }, (_, i) => (
                            <MaterialCommunityIcons key={i} name="chef-hat" size={sz(15)} color={color} />
                        ))}
                        <Text style={[styles.levelText, { fontSize: sz(12), color }]}>{recipe.difficulty}</Text>
                    </View>
                    <View style={styles.rating}>
                        <MaterialCommunityIcons name="star" size={sz(16)} color="#F9A825" />
                        <Text style={[styles.ratingText, { fontSize: sz(13) }]}>{recipe.rating.toFixed(1)}</Text>
                        <Text style={[styles.ratingCount, { fontSize: sz(12) }]}>({recipe.reviewCount})</Text>
                    </View>
                </View>
            </Pressable>
            {onToggleFavorite && (
                <IconButton
                    icon={isFavorite ? 'heart' : 'heart-outline'}
                    size={20}
                    iconColor={isFavorite ? '#E53935' : tc('#3E2723')}
                    containerColor={tc('rgba(255,255,255,0.95)', 'containerColor')}
                    style={styles.heart}
                    onPress={onToggleFavorite}
                    accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                />
            )}
        </View>
    );
}

const styles = createStyles({
    wrapper: { position: 'relative', flex: 1 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 12,
        borderWidth: 1,
        borderColor: '#EBDDCC',
        shadowColor: '#5D2E00',
        shadowOpacity: 0.1,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 5 },
        elevation: 3,
    },
    pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
    imageWrap: { position: 'relative', borderRadius: 18, overflow: 'hidden', backgroundColor: '#EFEBE9' },
    image: { width: '100%', aspectRatio: 1.45 },
    topBadge: {
        position: 'absolute',
        left: 10,
        bottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    topBadgeText: { fontSize: 11, fontWeight: '800', color: '#EF6C00' },
    title: { fontSize: 17, fontWeight: '800', color: '#2B2320', marginTop: 12, paddingHorizontal: 4 },
    desc: { fontSize: 13, lineHeight: 19, color: '#8D6E63', marginTop: 4, minHeight: 38, paddingHorizontal: 4 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, paddingHorizontal: 4 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F6F1EA', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },
    chipText: { fontSize: 12, fontWeight: '600', color: '#6D4C41' },
    footer: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 6, alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 4 },
    level: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4 },
    levelText: { fontSize: 12, fontWeight: '800', marginLeft: 4 },
    rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    ratingText: { fontSize: 13, fontWeight: '800', color: '#2B2320' },
    ratingCount: { fontSize: 12, color: '#8D6E63' },
    heart: { position: 'absolute', top: 18, right: 18, margin: 0 },
});