/**
 * Favorites pieces: SavedCard grid item and the rotating arc carousel (used by the Favorites screen).
 * The carousel also has a "Pick one for me" button: the wheel spins and lands on a random saved recipe to cook.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Image,
    Modal,
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
                        <MaterialCommunityIcons name="pot-steam-outline" size={sz(16)} color={tc('#3C252D')} />
                        <Text style={[styles.timeText, { fontSize: sz(13) }]}>{formatMinutes(totalTime(recipe))}</Text>
                    </View>
                    <View style={styles.ratingTag}>
                        <MaterialCommunityIcons name="star" size={sz(14)} color="#FF5C93" />
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
                iconColor={tc('#D81B60')}
                style={styles.heart}
                onPress={onRemove}
                accessibilityLabel="Remove from favorites"
            />
        </View>
    );
}

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const mod = (v: number, m: number) => ((v % m) + m) % m;

/** Little celebration pieces that float up behind the picked recipe. */
const SPARKS = [
    { icon: '✨', x: 6, lift: 150, size: 26 },
    { icon: '🎉', x: 20, lift: 190, size: 28 },
    { icon: '🍳', x: 36, lift: 140, size: 26 },
    { icon: '✨', x: 52, lift: 200, size: 24 },
    { icon: '🥄', x: 66, lift: 160, size: 26 },
    { icon: '🎉', x: 80, lift: 185, size: 28 },
    { icon: '✨', x: 92, lift: 145, size: 26 },
];

/** Pop-up that shows the recipe the wheel landed on. */
export function PickResult({
    recipe,
    onClose,
    onCook,
    onAgain,
}: {
    recipe: Recipe | null;
    onClose: () => void;
    onCook: (r: Recipe) => void;
    onAgain: () => void;
}) {
    useAppTheme();
    const pop = useRef(new Animated.Value(0)).current;
    const burst = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!recipe) return;
        pop.setValue(0);
        burst.setValue(0);
        Animated.parallel([
            Animated.spring(pop, { toValue: 1, friction: 6, tension: 90, useNativeDriver: false }),
            Animated.timing(burst, { toValue: 1, duration: 1700, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        ]).start();
    }, [recipe, pop, burst]);

    if (!recipe) return null;
    return (
        <Modal visible transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.pickRoot}>
                <Pressable style={styles.pickBackdrop} onPress={onClose} accessibilityLabel="Close" />
                <Animated.View
                    style={[
                        styles.pickCard,
                        { opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] },
                    ]}
                >
                    <View style={styles.pickBadge}>
                        <MaterialCommunityIcons name="chef-hat" size={16} color="#FFFFFF" />
                        <Text style={styles.pickBadgeText}>Tonight you&apos;re cooking</Text>
                    </View>

                    <View style={styles.pickPhotoWrap}>
                        <Image source={{ uri: recipe.image }} style={styles.pickPhoto} resizeMode="cover" />
                        <View style={styles.pickRating}>
                            <MaterialCommunityIcons name="star" size={14} color="#FF5C93" />
                            <Text style={styles.pickRatingText}>{recipe.rating.toFixed(1)}</Text>
                        </View>
                    </View>

                    <Text style={styles.pickTitle} numberOfLines={3}>
                        {recipe.name}
                    </Text>
                    <View style={styles.pickChips}>
                        <View style={styles.pickChip}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color="#D81B60" />
                            <Text style={styles.pickChipText}>{formatMinutes(totalTime(recipe))}</Text>
                        </View>
                        <View style={styles.pickChip}>
                            <MaterialCommunityIcons name="fire" size={14} color="#D81B60" />
                            <Text style={styles.pickChipText}>{recipe.caloriesPerServing} cal</Text>
                        </View>
                        <View style={styles.pickChip}>
                            <MaterialCommunityIcons name="chef-hat" size={14} color="#D81B60" />
                            <Text style={styles.pickChipText}>{recipe.difficulty}</Text>
                        </View>
                        <View style={styles.pickChip}>
                            <MaterialCommunityIcons name="silverware-fork-knife" size={14} color="#D81B60" />
                            <Text style={styles.pickChipText}>{recipe.cuisine}</Text>
                        </View>
                    </View>

                    <Pressable
                        onPress={() => onCook(recipe)}
                        accessibilityRole="button"
                        accessibilityLabel={`Cook ${recipe.name}`}
                        style={({ pressed }) => [styles.pickCook, pressed && styles.arcPressed]}
                    >
                        <Text style={styles.pickCookText}>Let&apos;s cook this!</Text>
                        <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
                    </Pressable>
                    <Pressable
                        onPress={onAgain}
                        accessibilityRole="button"
                        accessibilityLabel="Spin again"
                        style={({ pressed }) => [styles.pickAgain, pressed && styles.arcPressed]}
                    >
                        <MaterialCommunityIcons name="dice-multiple-outline" size={18} color="#D81B60" />
                        <Text style={styles.pickAgainText}>Not feeling it, spin again</Text>
                    </Pressable>

                    {/* Sparkles float up from the bottom of the card */}
                    <View style={styles.pickSparks} pointerEvents="none">
                        {SPARKS.map((sp, i) => (
                            <Animated.Text
                                key={i}
                                style={[
                                    styles.pickSpark,
                                    {
                                        left: `${sp.x}%`,
                                        fontSize: sp.size,
                                        opacity: burst.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 1, 0] }),
                                        transform: [{ translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, -sp.lift] }) }],
                                    },
                                ]}
                            >
                                {sp.icon}
                            </Animated.Text>
                        ))}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

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
    const height = narrow ? textTop + 262 : cy + 212; // room for the "Pick one for me" button
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
    const recipesRef = useRef(recipes);
    recipesRef.current = recipes;

    // "Pick one for me": the wheel spins by itself and lands on a random recipe
    const [spinning, setSpinning] = useState(false);
    const spinningRef = useRef(false);
    const [winner, setWinner] = useState<Recipe | null>(null);
    const pulse = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (spinning) return;
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
                Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [spinning, pulse]);
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
    const move = useCallback(
        (delta: number) => {
            if (spinningRef.current) return; // the wheel is busy picking
            turnTo(Math.round(posRef.current) + delta);
        },
        [turnTo]
    );

    /** Spin the wheel a few times round, slow down and stop on a random recipe (never the one on top). */
    const spin = useCallback(() => {
        const count = nRef.current;
        if (spinningRef.current || count === 0) return;
        const base = Math.round(posRef.current);
        const current = mod(base, count);
        let picked = current;
        if (count > 1) {
            picked = Math.floor(Math.random() * (count - 1));
            if (picked >= current) picked += 1;
        }
        const laps = Math.max(2, Math.ceil(14 / count)); // always a good long spin, even with few recipes
        const steps = mod(picked - base, count) + laps * count;
        spinningRef.current = true;
        setSpinning(true);
        setWinner(null);
        anim.stopAnimation();
        Animated.timing(anim, {
            toValue: base + steps,
            duration: Math.min(4600, 2400 + steps * 55),
            easing: Easing.bezier(0.12, 0.6, 0.1, 1), // fast start, long slow-down
            useNativeDriver: false,
        }).start(({ finished }) => {
            spinningRef.current = false;
            setSpinning(false);
            const chosen = recipesRef.current[picked];
            if (finished && chosen) setTimeout(() => setWinner(chosen), 350);
        });
    }, [anim]);
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
            onMoveShouldSetPanResponder: (_, g) => !spinningRef.current && Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
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
                            onPress={() => {
                                if (spinningRef.current) return;
                                if (isActive) onOpen(r);
                                else move(Math.round(rel));
                            }}
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
                                isActive && spinning && styles.arcGlow,
                            ]}
                        >
                            <Image source={{ uri: r.image }} style={styles.arcImage} resizeMode="cover" />
                            {isActive && (
                                <View style={styles.arcRating}>
                                    <MaterialCommunityIcons name="star" size={12} color="#FF5C93" />
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
                            disabled={n < 2 || spinning}
                            accessibilityRole="button"
                            accessibilityLabel="Previous recipe"
                            style={[styles.arcRound, (n < 2 || spinning) && styles.arcRoundOff]}
                        >
                            <MaterialCommunityIcons name="chevron-left" size={24} color={tc('#3C252D')} />
                        </Pressable>
                        <Pressable onPress={() => onOpen(active)} disabled={spinning} accessibilityRole="button" style={[styles.arcOpen, spinning && styles.arcRoundOff]}>
                            <Text style={styles.arcOpenText}>Open recipe</Text>
                            <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
                        </Pressable>
                        <Pressable
                            onPress={() => move(1)}
                            disabled={n < 2 || spinning}
                            accessibilityRole="button"
                            accessibilityLabel="Next recipe"
                            style={[styles.arcRound, (n < 2 || spinning) && styles.arcRoundOff]}
                        >
                            <MaterialCommunityIcons name="chevron-right" size={24} color={tc('#3C252D')} />
                        </Pressable>
                        <Pressable
                            onPress={() => onRemove(active)}
                            disabled={spinning}
                            accessibilityRole="button"
                            accessibilityLabel="Remove from favorites"
                            style={[styles.arcRound, spinning && styles.arcRoundOff]}
                        >
                            <MaterialCommunityIcons name="heart-broken-outline" size={20} color="#C62828" />
                        </Pressable>
                    </View>

                    {/* Can't decide? Let the wheel choose */}
                    <Animated.View
                        style={[
                            styles.arcPickWrap,
                            !spinning && { transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] }) }] },
                        ]}
                    >
                        <Pressable
                            onPress={spin}
                            disabled={spinning}
                            accessibilityRole="button"
                            accessibilityLabel="Pick one recipe for me"
                            style={({ pressed }) => [styles.arcPick, spinning && styles.arcPickBusy, pressed && styles.arcPressed]}
                        >
                            <MaterialCommunityIcons name={spinning ? 'loading' : 'dice-multiple'} size={22} color="#FFFFFF" />
                            <Text style={styles.arcPickText}>{spinning ? 'Spinning…' : 'Pick one for me'}</Text>
                            {!spinning && <MaterialCommunityIcons name="star-four-points" size={14} color="#FFD6E5" />}
                        </Pressable>
                    </Animated.View>
                </View>
            </View>
            <Text style={styles.arcHint}>
                {Platform.OS === 'web'
                    ? 'Drag to spin, tap a card, use the ← → keys, or let the wheel pick for you'
                    : 'Swipe to spin the wheel, tap a card, or let the wheel pick for you'}
            </Text>

            <PickResult
                recipe={winner}
                onClose={() => setWinner(null)}
                onCook={(r) => {
                    setWinner(null);
                    onOpen(r);
                }}
                onAgain={() => {
                    setWinner(null);
                    setTimeout(spin, 250);
                }}
            />
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
        borderColor: '#E9CED8',
        shadowColor: '#71092F',
        shadowOpacity: 0.1,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
    },
    cardPressed: { opacity: 0.93, transform: [{ scale: 0.99 }] },
    photoWrap: { position: 'relative', backgroundColor: '#EFE9EB' },
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
    timeText: { fontSize: 13, fontWeight: '700', color: '#3C252D' },
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
    ratingText: { fontSize: 12, fontWeight: '800', color: '#3C252D' },
    cardBody: { padding: 16, paddingRight: 52, minHeight: 92 },
    cardTitle: { fontSize: 17, fontWeight: '700', lineHeight: 23, color: '#2A2124' },
    cardSub: { fontSize: 13, color: '#8A6673', marginTop: 6 },
    heart: { position: 'absolute', right: 4, bottom: 28, margin: 0 },
    arcOuter: { marginTop: 8 },
    arcStage: { position: 'relative', width: '100%', overflow: 'hidden' },
    arcCard: {
        position: 'absolute',
        borderRadius: 26,
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: '#FFFFFF',
        backgroundColor: '#EDD8E0',
        shadowColor: '#5A0F2E',
        shadowOpacity: 0.28,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
    },
    arcImage: { width: '100%', height: '100%' },
    arcRating: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
    arcRatingText: { fontSize: 11, fontWeight: '800', color: '#3C252D' },
    arcCenter: { position: 'absolute', alignItems: 'center', zIndex: 200 },
    arcTitle: { fontSize: 28, fontWeight: '800', color: '#2A2124', textAlign: 'center', lineHeight: 34 },
    arcTitleNarrow: { fontSize: 21, lineHeight: 26 },
    arcMeta: { fontSize: 14, color: '#8A6673', marginTop: 6, textAlign: 'center' },
    arcButtons: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
    arcRound: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3C7D1' },
    arcRoundOff: { opacity: 0.4 },
    arcOpen: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, paddingHorizontal: 22, borderRadius: 23, backgroundColor: '#2A2124' },
    arcOpenText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    arcHint: { textAlign: 'center', fontSize: 12, color: '#8A6673', marginTop: 4 },
    arcPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
    arcGlow: { borderColor: '#D81B60', shadowColor: '#D81B60', shadowOpacity: 0.7, shadowRadius: 22, elevation: 12 },
    arcPickWrap: { marginTop: 14 },
    arcPick: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 52,
        paddingHorizontal: 30,
        borderRadius: 26,
        backgroundColor: '#D81B60',
        borderWidth: 2,
        borderColor: '#FF7FAE',
        shadowColor: '#D81B60',
        shadowOpacity: 0.45,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
    arcPickBusy: { backgroundColor: '#A8134A', borderColor: '#A8134A', shadowOpacity: 0.2 },
    arcPickText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
    pickRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    pickBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(28,8,20,0.62)' },
    pickCard: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        padding: 18,
        paddingTop: 30,
        borderWidth: 1,
        borderColor: '#E9CED8',
        alignItems: 'center',
        shadowColor: '#D81B60',
        shadowOpacity: 0.4,
        shadowRadius: 30,
        shadowOffset: { width: 0, height: 12 },
        elevation: 16,
    },
    pickBadge: {
        position: 'absolute',
        top: -16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#D81B60',
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 8,
        zIndex: 3,
    },
    pickBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.4 },
    pickPhotoWrap: { width: '100%', aspectRatio: 1.3, borderRadius: 22, overflow: 'hidden', backgroundColor: '#EDD8E0', borderWidth: 3, borderColor: '#FDE7EF' },
    pickPhoto: { width: '100%', height: '100%' },
    pickRating: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
    pickRatingText: { fontSize: 12, fontWeight: '800', color: '#3C252D' },
    pickTitle: { fontSize: 24, lineHeight: 30, fontWeight: '800', color: '#2A2124', textAlign: 'center', marginTop: 16 },
    pickChips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 12 },
    pickChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FDE7EF', borderRadius: 14, paddingHorizontal: 11, paddingVertical: 6 },
    pickChipText: { fontSize: 12.5, fontWeight: '700', color: '#5A3A46' },
    pickCook: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'stretch', height: 50, borderRadius: 25, backgroundColor: '#D81B60', marginTop: 18 },
    pickCookText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    pickAgain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'stretch', height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: '#E3C7D1', marginTop: 10 },
    pickAgainText: { color: '#D81B60', fontSize: 14, fontWeight: '700' },
    pickSparks: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 0, zIndex: 2 },
    pickSpark: { position: 'absolute', bottom: 60 },
});