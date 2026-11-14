/**
 * Favorites pieces: SavedCard grid item and the rotating arc carousel (used by the Favorites screen).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Image,
    PanResponder,
    Platform,
    Pressable,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Recipe } from '@/types/recipe';
import { formatMinutes, totalTime } from '@/utils/recipeFilters';
import { IconName, useCardScale } from '@/components';
import { createStyles, tc, useAppTheme } from '@/context/ThemeContext';

export const MEAL_ICONS: Record<string, IconName> = {
    Breakfast: 'food-croissant',
    Lunch: 'food',
    Dinner: 'silverware-fork-knife',
    Dessert: 'cake-variant',
    Snack: 'cookie',
    Snacks: 'cookie',
    Beverage: 'glass-mug-variant',
    Appetizer: 'bowl-mix',
    'Side Dish': 'food-variant',
};

/** One saved recipe: photo with a time tag, title, cuisine and a heart to remove it. */
export function SavedCard({ recipe, onOpen, onRemove }: { recipe: Recipe; onOpen: () => void; onRemove: () => void }) {
    useAppTheme();
    const { onLayout, sz, ready } = useCardScale(320);
    return (
        <View style={[styles.cardWrap, !ready && { opacity: 0 }]} onLayout={onLayout}>
            <Pressable
                onPress={onOpen}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Open recipe ${recipe.name}`}
            >
                <View style={styles.photoWrap}>
                    <Image source={{ uri: recipe.image }} style={styles.photo} resizeMode="cover" />
                    <View style={styles.timeTag}>
                        <MaterialCommunityIcons name="pot-steam-outline" size={sz(16)} color={tc('#3E2723')} />
                        <Text style={[styles.timeText, { fontSize: sz(13) }]}>{formatMinutes(totalTime(recipe))}</Text>
                    </View>
                    <View style={styles.ratingTag}>
                        <MaterialCommunityIcons name="star" size={sz(14)} color="#F9A825" />
                        <Text style={[styles.ratingText, { fontSize: sz(12) }]}>{recipe.rating.toFixed(1)}</Text>
                    </View>
                </View>
                <View style={[styles.cardBody, { padding: sz(16), paddingRight: sz(52) }]}>
                    <Text style={[styles.cardTitle, { fontSize: sz(17), lineHeight: sz(23) }]} numberOfLines={2}>
                        {recipe.name}
                    </Text>
                    <Text style={[styles.cardSub, { fontSize: sz(13) }]} numberOfLines={1}>
                        {recipe.cuisine} · {recipe.difficulty}
                    </Text>
                </View>
            </Pressable>
            {/* Next to (not inside) the pressable card so web doesn't nest <button> in <button> */}
            <IconButton
                icon="heart"
                size={sz(22)}
                iconColor="#E85D04"
                style={styles.heart}
                onPress={onRemove}
                accessibilityLabel="Remove from favorites"
            />
        </View>
    );
}

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const mod = (v: number, m: number) => ((v % m) + m) % m;

/**
 * Saved recipes on a big wheel. Only the top of the wheel is on screen, so you see an arc;
 * turning it (drag / swipe, arrows, keyboard or tapping a card) brings the next recipes round
 * from the side and it loops forever. The recipe at the top is the "active" one and its
 * details sit under the arc.
 */
export function ArcCarousel({
    recipes,
    onOpen,
    onRemove,
}: {
    recipes: Recipe[];
    onOpen: (r: Recipe) => void;
    onRemove: (r: Recipe) => void;
}) {
    useAppTheme();
    const { width: winW } = useWindowDimensions();
    const [boxW, setBoxW] = useState(Math.min(winW - 32, 1400));
    const n = recipes.length;

    // Geometry: card centres sit on an ellipse; each card is turned to follow the curve
    const narrow = boxW < 600;
    const cardW = narrow ? 104 : 178;
    const cardH = narrow ? 134 : 230;
    const rx0 = Math.max(70, boxW / 2 - cardW * 0.62 - 6);
    const ry = narrow ? rx0 * 1.1 : 300;
    const rx = narrow ? rx0 : Math.min(rx0, ry * 1.7);
    const cx = boxW / 2;
    const cy = cardH * 0.6 + 8 + ry;
    // Degrees between neighbours: natural spacing, but spread evenly round the wheel when there are few cards
    const naturalStep = clamp(((cardW * 0.9) / rx) * (180 / Math.PI), 13, 60);
    const stepDeg = clamp(360 / Math.max(1, n), naturalStep, 72);
    const textTop = narrow ? cy + cardW * 0.62 + 10 : cy - 70;
    const textW = narrow ? boxW - 40 : Math.max(260, 2 * (rx - cardH * 0.5) - 24);
    const height = narrow ? textTop + 190 : cy + 150;
    const maxAngle = narrow ? 112 : 128;
    const fadeFrom = narrow ? 78 : 92;
    const fadeLen = narrow ? 34 : 36;

    // Position is a float (2.0 = third card at the top) and is never clamped: the wheel loops
    const [pos, setPos] = useState(0);
    const posRef = useRef(0);
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const id = anim.addListener(({ value }) => {
            posRef.current = value;
            setPos(value);
        });
        return () => anim.removeListener(id);
    }, [anim]);

    // Entrance: the cards rise up from the bottom edge, middle ones first
    const [enter, setEnter] = useState(0);
    useEffect(() => {
        const value = new Animated.Value(0);
        const id = value.addListener(({ value: v }) => setEnter(v));
        Animated.timing(value, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
        return () => value.removeListener(id);
    }, []);

    const nRef = useRef(n);
    nRef.current = n;
    const dragPx = useRef(90);
    dragPx.current = narrow ? 70 : 100;

    /** Turn the wheel to a position (any integer, it wraps). */
    const turnTo = useCallback(
        (target: number) => {
            Animated.timing(anim, { toValue: target, duration: 460, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
        },
        [anim]
    );
    /** Turn the wheel by a number of cards (-1 = previous, 1 = next). */
    const move = useCallback((delta: number) => turnTo(Math.round(posRef.current) + delta), [turnTo]);
    const turnRef = useRef(turnTo);
    turnRef.current = turnTo;
    const moveRef = useRef(move);
    moveRef.current = move;

    // Keep the position in range when recipes are removed or filtered
    useEffect(() => {
        if (n > 0 && (posRef.current < 0 || posRef.current > n)) {
            anim.stopAnimation();
            anim.setValue(mod(posRef.current, n));
        }
    }, [n, anim]);

    const startPos = useRef(0);
    const pan = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
            onPanResponderGrant: () => {
                anim.stopAnimation();
                startPos.current = posRef.current;
            },
            onPanResponderMove: (_, g) => anim.setValue(startPos.current - g.dx / dragPx.current),
            onPanResponderRelease: (_, g) => turnRef.current(Math.round(posRef.current - g.vx * 0.9)),
            onPanResponderTerminate: () => turnRef.current(Math.round(posRef.current)),
        })
    ).current;

    // Arrow keys on web
    useEffect(() => {
        if (Platform.OS !== 'web') return;
        const doc = (globalThis as unknown as {
            document?: {
                addEventListener: (type: string, fn: (e: { key: string }) => void) => void;
                removeEventListener: (type: string, fn: (e: { key: string }) => void) => void;
            };
        }).document;
        if (!doc) return;
        const onKey = (e: { key: string }) => {
            if (e.key === 'ArrowLeft') moveRef.current(-1);
            if (e.key === 'ArrowRight') moveRef.current(1);
        };
        doc.addEventListener('keydown', onKey);
        return () => doc.removeEventListener('keydown', onKey);
    }, []);

    if (n === 0) return null;
    const activeIndex = mod(Math.round(pos), n);
    const active = recipes[activeIndex];

    return (
        <View style={styles.arcOuter}>
            <View style={[styles.arcStage, { height }]} onLayout={(e) => setBoxW(e.nativeEvent.layout.width)} {...pan.panHandlers}>
                {recipes.map((r, i) => {
                    // Shortest way round the wheel from the top card to this one
                    let rel = mod(i - pos, n);
                    if (rel > n / 2) rel -= n;
                    const a = rel * stepDeg;
                    if (Math.abs(a) > maxAngle) return null;
                    const rad = (a * Math.PI) / 180;
                    const x = cx + rx * Math.sin(rad);
                    const baseY = cy - ry * Math.cos(rad);
                    const rise = clamp(enter * 1.7 - Math.abs(rel) * 0.14, 0, 1);
                    const y = baseY + (1 - rise) * (height - baseY + cardH * 0.7);
                    const rot = (Math.atan2(ry * Math.sin(rad), rx * Math.cos(rad)) * 180) / Math.PI;
                    const near = 1 - Math.min(1, Math.abs(rel));
                    const scale = 1 + 0.1 * near;
                    const fade = clamp(1 - (Math.abs(a) - fadeFrom) / fadeLen, 0, 1) * Math.min(1, rise * 2);
                    const isActive = i === activeIndex;
                    return (
                        <Pressable
                            key={r.id}
                            onPress={() => (isActive ? onOpen(r) : move(Math.round(rel)))}
                            accessibilityRole="button"
                            accessibilityLabel={isActive ? `Open recipe ${r.name}` : `Show ${r.name}`}
                            style={[
                                styles.arcCard,
                                {
                                    width: cardW,
                                    height: cardH,
                                    left: x - cardW / 2,
                                    top: y - cardH / 2,
                                    opacity: fade,
                                    zIndex: 100 - Math.round(Math.abs(rel) * 10),
                                    transform: [{ rotate: `${rot}deg` }, { scale }],
                                },
                            ]}
                        >
                            <Image source={{ uri: r.image }} style={styles.arcImage} resizeMode="cover" />
                            {isActive && (
                                <View style={styles.arcRating}>
                                    <MaterialCommunityIcons name="star" size={12} color="#FFC107" />
                                    <Text style={styles.arcRatingText}>{r.rating.toFixed(1)}</Text>
                                </View>
                            )}
                        </Pressable>
                    );
                })}

                {/* Details of the active recipe */}
                <View style={[styles.arcCenter, { top: textTop, width: textW, left: cx - textW / 2 }]} pointerEvents="box-none">
                    <Text style={[styles.arcTitle, narrow && styles.arcTitleNarrow]} numberOfLines={2}>
                        {active.name}
                    </Text>
                    <Text style={styles.arcMeta}>
                        {activeIndex + 1} / {n} · {active.cuisine} · {formatMinutes(totalTime(active))} · {active.caloriesPerServing} cal
                    </Text>
                    <View style={styles.arcButtons}>
                        <Pressable
                            onPress={() => move(-1)}
                            disabled={n < 2}
                            accessibilityRole="button"
                            accessibilityLabel="Previous recipe"
                            style={[styles.arcRound, n < 2 && styles.arcRoundOff]}
                        >
                            <MaterialCommunityIcons name="chevron-left" size={24} color={tc('#3E2723')} />
                        </Pressable>
                        <Pressable onPress={() => onOpen(active)} accessibilityRole="button" style={styles.arcOpen}>
                            <Text style={styles.arcOpenText}>Open recipe</Text>
                            <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
                        </Pressable>
                        <Pressable
                            onPress={() => move(1)}
                            disabled={n < 2}
                            accessibilityRole="button"
                            accessibilityLabel="Next recipe"
                            style={[styles.arcRound, n < 2 && styles.arcRoundOff]}
                        >
                            <MaterialCommunityIcons name="chevron-right" size={24} color={tc('#3E2723')} />
                        </Pressable>
                        <Pressable
                            onPress={() => onRemove(active)}
                            accessibilityRole="button"
                            accessibilityLabel="Remove from favorites"
                            style={styles.arcRound}
                        >
                            <MaterialCommunityIcons name="heart-broken-outline" size={20} color="#C62828" />
                        </Pressable>
                    </View>
                </View>
            </View>
            <Text style={styles.arcHint}>
                {Platform.OS === 'web' ? 'Drag to spin, tap a card, or use the ← → keys' : 'Swipe to spin the wheel, tap a card to bring it round'}
            </Text>
        </View>
    );
}

const styles = createStyles({
    cardWrap: { position: 'relative', flex: 1 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EBDDCC',
        shadowColor: '#7A3E00',
        shadowOpacity: 0.1,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
    },
    cardPressed: { opacity: 0.93, transform: [{ scale: 0.99 }] },
    photoWrap: { position: 'relative', backgroundColor: '#EFEBE9' },
    photo: { width: '100%', aspectRatio: 1.3 },
    timeTag: {
        position: 'absolute',
        left: 12,
        bottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    timeText: { fontSize: 13, fontWeight: '700', color: '#3E2723' },
    ratingTag: {
        position: 'absolute',
        right: 12,
        top: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 14,
        paddingHorizontal: 9,
        paddingVertical: 5,
    },
    ratingText: { fontSize: 12, fontWeight: '800', color: '#3E2723' },
    cardBody: { padding: 16, paddingRight: 52, minHeight: 92 },
    cardTitle: { fontSize: 17, fontWeight: '700', lineHeight: 23, color: '#2B2320' },
    cardSub: { fontSize: 13, color: '#8D6E63', marginTop: 6 },
    heart: { position: 'absolute', right: 4, bottom: 28, margin: 0 },
    arcOuter: { marginTop: 8 },
    arcStage: { position: 'relative', width: '100%', overflow: 'hidden' },
    arcCard: {
        position: 'absolute',
        borderRadius: 26,
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: '#FFFFFF',
        backgroundColor: '#EFE3D6',
        shadowColor: '#5D2E00',
        shadowOpacity: 0.28,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
    },
    arcImage: { width: '100%', height: '100%' },
    arcRating: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
    arcRatingText: { fontSize: 11, fontWeight: '800', color: '#3E2723' },
    arcCenter: { position: 'absolute', alignItems: 'center', zIndex: 200 },
    arcTitle: { fontSize: 28, fontWeight: '800', color: '#2B2320', textAlign: 'center', lineHeight: 34 },
    arcTitleNarrow: { fontSize: 21, lineHeight: 26 },
    arcMeta: { fontSize: 14, color: '#8D6E63', marginTop: 6, textAlign: 'center' },
    arcButtons: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
    arcRound: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6D6C4' },
    arcRoundOff: { opacity: 0.4 },
    arcOpen: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, paddingHorizontal: 22, borderRadius: 23, backgroundColor: '#2B2320' },
    arcOpenText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    arcHint: { textAlign: 'center', fontSize: 12, color: '#8D6E63', marginTop: 4 },
});