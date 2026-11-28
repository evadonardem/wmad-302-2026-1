/**
 * ShowcaseHero - product showcase hero carousel (home header)
 * A large featured product sits in the centre of a themed hero with a bold headline, description,
 * actions and a decorative curved cream section at the bottom. The carousel:
 * - auto-plays through the products (and restarts its timer after every manual change)
 * - can be driven manually: previous / next arrows, pagination dots, product selector thumbnails
 * - on every change the image, name, description and background theme all transition together
 *   (cross-fade + slide + a playful tilt), and the next product peeks in at the side.
 * Wide containers get a three-part layout (text | product | peeking product); narrow ones stack.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Image,
    LayoutChangeEvent,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
    ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Product } from '@/types/product';
import { palette, spacing, themed, softShadow, NO_TOUCH, touchWhen } from '@/constants/theme';

interface HeroTheme {
    bg: string;
    dark: string;
}

// One background theme per slide (cycled by position)
const THEMES: HeroTheme[] = [
    { bg: '#4B2A94', dark: '#2E1A5C' }, // royal purple
    { bg: '#7B52C9', dark: '#4A2D8A' }, // violet
    { bg: '#A55FB8', dark: '#6E3380' }, // orchid
    { bg: '#4F5FC0', dark: '#2F3A85' }, // indigo
    { bg: '#8E3F7E', dark: '#5C2650' }, // berry
    { bg: '#6A5F9E', dark: '#403870' }, // lilac slate
];

const CREAM = '#FBF7FF';

interface ReviewsSummary {
    count: number;
    initials: string[];
}

interface ShowcaseHeroProps {
    products: Product[];
    /** Optional navigation bar drawn over the hero; `wide` tells it which layout to use */
    renderHeader?: (wide: boolean) => React.ReactNode;
    greeting?: string;
    /** Fixed height for the wide layout (a small value switches to the compact banner sizing) */
    height?: number;
    /** Container width from which the three-part wide layout is used (default 760) */
    wideAt?: number;
    /** Text shown before the category in the eyebrow, e.g. "Best Picks" */
    eyebrowPrefix?: string;
    reviews?: ReviewsSummary;
    autoPlayMs?: number;
    onOpenProduct: (id: number) => void;
    onOpenCollection: (slug: string) => void;
}

interface NavState {
    index: number;
    dir: 1 | -1;
}

const price = (p: Product): number => p.price * (1 - p.discountPercentage / 100);
const pretty = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
const wrap = (i: number, n: number): number => ((i % n) + n) % n;

export function ShowcaseHero({
    products,
    renderHeader,
    greeting,
    height,
    wideAt = 760,
    eyebrowPrefix,
    reviews,
    autoPlayMs = 5500,
    onOpenProduct,
    onOpenCollection,
}: ShowcaseHeroProps) {
    const { height: windowHeight } = useWindowDimensions();
    const n = products.length;
    const [nav, setNav] = useState<NavState>({ index: 0, dir: 1 });
    const [paused, setPaused] = useState(false);
    const [width, setWidth] = useState(0);
    // `shown` is what the hero displays; `leaving` is the previous slide fading out
    const [shown, setShown] = useState<Product | undefined>(products[0]);
    const [leaving, setLeaving] = useState<Product | null>(null);
    const shownRef = useRef<Product | undefined>(products[0]);
    const countRef = useRef(n);
    countRef.current = n;
    const progress = useRef(new Animated.Value(1)).current;

    const index = n > 0 ? Math.min(nav.index, n - 1) : 0;
    const active: Product | undefined = products[index];
    const dir = nav.dir;

    // Manual + automatic navigation both go through here
    const stepRef = useRef<(delta: number) => void>(() => undefined);
    stepRef.current = (delta: number) => {
        const count = countRef.current;
        if (count > 0) setNav((prev) => ({ index: wrap(prev.index + delta, count), dir: delta >= 0 ? 1 : -1 }));
    };
    const goTo = (target: number) => {
        const count = countRef.current;
        if (count === 0) return;
        setNav((prev) => ({ index: wrap(target, count), dir: target >= prev.index ? 1 : -1 }));
    };

    // Image, text and background theme change together
    useEffect(() => {
        if (!active) return;
        const current = shownRef.current;
        if (!current) {
            shownRef.current = active;
            setShown(active);
            return;
        }
        if (current.id === active.id) return;
        shownRef.current = active;
        setLeaving(current);
        setShown(active);
        progress.stopAnimation();
        progress.setValue(0);
        Animated.timing(progress, {
            toValue: 1,
            duration: 750,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
        }).start(({ finished }) => {
            if (finished) setLeaving(null);
        });
    }, [active, progress]);

    // Auto-play: the timer restarts after every change, so a manual click always gets a full pause
    useEffect(() => {
        if (n < 2 || paused) return undefined;
        const timer = setTimeout(() => stepRef.current(1), autoPlayMs);
        return () => clearTimeout(timer);
    }, [index, n, paused, autoPlayMs]);

    if (!active || !shown) return null;

    const wide = width >= wideAt;
    const heroHeight = height ?? Math.min(Math.max(windowHeight - 120, 580), 700);
    const compact = wide && heroHeight < 520;
    const waveH = wide ? (compact ? 74 : Math.min(Math.max(width * 0.13, 96), 170)) : 78;
    const indexOf = (p: Product): number => Math.max(0, products.findIndex((x) => x.id === p.id));
    const themeOf = (p: Product): HeroTheme => THEMES[indexOf(p) % THEMES.length];
    const peekOf = (p: Product): Product | null => (n > 1 ? products[wrap(indexOf(p) + 1, n)] : null);

    // Layer animation helpers
    const fadeIn = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
    const fadeOut = progress.interpolate({ inputRange: [0, 0.55, 1], outputRange: [1, 0, 0] });
    const textIn = progress.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 0, 1] });
    const textOut = progress.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 0, 0] });
    const slideIn = progress.interpolate({ inputRange: [0, 1], outputRange: [dir * 90, 0] });
    const slideOut = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -dir * 90] });
    const tiltIn = progress.interpolate({ inputRange: [0, 1], outputRange: [`${dir * 12}deg`, '0deg'] });
    const tiltOut = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${-dir * 12}deg`] });
    const scaleIn = progress.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });
    const scaleOut = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] });
    const riseIn = progress.interpolate({ inputRange: [0, 1], outputRange: [22, 0] });
    const riseOut = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });

    // Curved cream section: overlapping circles give a wavy skyline
    const hump = (cx: number, chord: number, h: number): ViewStyle => {
        const r = (chord * chord) / 4 / h / 2 + h / 2;
        return { position: 'absolute', width: 2 * r, height: 2 * r, borderRadius: r, left: cx - r, bottom: -(2 * r - h), backgroundColor: palette.ivory };
    };
    const W = width || 360;
    const wave = (
        <View style={[styles.wave, { height: waveH }, NO_TOUCH]}>
            <View style={[styles.waveBase, { height: waveH * 0.32 }]} />
            <View style={hump(W * 0.12, W * 0.42, waveH * 0.78)} />
            <View style={hump(W * 0.46, W * 0.38, waveH)} />
            <View style={hump(W * 0.8, W * 0.44, waveH * 0.86)} />
            <View style={hump(W * 1.0, W * 0.3, waveH * 0.6)} />
        </View>
    );

    const mainStyle: ViewStyle = wide
        ? compact
            ? { position: 'absolute', left: '38%', width: '34%', top: 22, bottom: waveH * 0.15 }
            : { position: 'absolute', left: '31%', width: '39%', top: 40, bottom: waveH * 0.2 }
        : { position: 'absolute', left: '12%', right: '12%', top: 0, bottom: 0 };
    const peekStyle: ViewStyle = wide
        ? compact
            ? { position: 'absolute', left: '75%', width: '20%', top: '36%', height: '42%' }
            : { position: 'absolute', left: '72%', width: '19%', top: '30%', height: '38%' }
        : { position: 'absolute', right: '-3%', bottom: 14, width: '30%', height: 150 };

    const mainLayer = (p: Product, mode: 'in' | 'out') => (
        <Animated.View
            key={`main-${p.id}`}
            style={[touchWhen(mode === 'in'),
                mainStyle,
            {
                opacity: mode === 'in' ? fadeIn : fadeOut,
                transform: [
                    { translateX: mode === 'in' ? slideIn : slideOut },
                    { rotate: mode === 'in' ? tiltIn : tiltOut },
                    { scale: mode === 'in' ? scaleIn : scaleOut },
                ],
            },
            ]}
        >
            <Pressable style={styles.fill} onPress={() => onOpenProduct(p.id)} accessibilityLabel={p.title}>
                <Image source={{ uri: p.thumbnail }} style={styles.fill} resizeMode="contain" />
            </Pressable>
        </Animated.View>
    );

    const peekLayer = (p: Product, mode: 'in' | 'out') => {
        const peek = peekOf(p);
        if (!peek) return null;
        return (
            <Animated.View
                key={`peek-${mode}-${peek.id}`}
                style={[touchWhen(mode === 'in'),
                    peekStyle,
                { opacity: mode === 'in' ? fadeIn : fadeOut, transform: [{ translateX: mode === 'in' ? slideIn : slideOut }, { scale: mode === 'in' ? scaleIn : scaleOut }] },
                ]}
            >
                <Pressable style={styles.fill} onPress={() => goTo(indexOf(peek))} accessibilityLabel={`Show ${peek.title}`}>
                    <Image source={{ uri: peek.thumbnail }} style={[styles.fill, { opacity: 0.95 }]} resizeMode="contain" />
                </Pressable>
            </Animated.View>
        );
    };

    const textLayer = (p: Product, mode: 'in' | 'out') => {
        const theme = themeOf(p);
        return (
            <Animated.View
                key={`text-${p.id}`}
                style={[touchWhen(mode === 'in'),
                mode === 'out' && styles.textOut,
                { opacity: mode === 'in' ? textIn : textOut, transform: [{ translateY: mode === 'in' ? riseIn : riseOut }] },
                ]}
            >
                <Text style={styles.eyebrow}>{eyebrowPrefix ? `${eyebrowPrefix} · ` : ''}{pretty(p.category)}</Text>
                <Text style={[styles.headline, wide && styles.headlineWide, compact && styles.headlineCompact]} numberOfLines={3}>{p.title}</Text>
                <Text style={[styles.description, wide && styles.descriptionWide, compact && styles.descriptionCompact]} numberOfLines={compact ? 2 : 3}>{p.description}</Text>
                <Text style={styles.priceTag}>From ${price(p).toFixed(2)}</Text>
                <View style={styles.buttons}>
                    <Pressable style={[styles.buttonPrimary, compact && styles.buttonCompact]} onPress={() => onOpenProduct(p.id)} accessibilityRole="button">
                        <Text style={[styles.buttonPrimaryText, { color: theme.dark }]}>Order now</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.buttonSecondary, compact && styles.buttonCompact, { backgroundColor: theme.dark }]}
                        onPress={() => onOpenCollection(p.category)}
                        accessibilityRole="button"
                    >
                        <Text style={styles.buttonSecondaryText}>More like this</Text>
                    </Pressable>
                </View>
            </Animated.View>
        );
    };

    const textStack = (
        <View>
            {greeting ? <Text style={styles.greeting}>{greeting}</Text> : null}
            <View>
                {leaving && textLayer(leaving, 'out')}
                {textLayer(shown, 'in')}
            </View>
        </View>
    );

    // Clickable product selectors (thumbnails)
    const selectors = (
        <View style={[styles.selectors, wide ? styles.selectorsWide : styles.selectorsStacked, compact && styles.selectorsCompact]}>
            {products.map((p, i) => {
                const selected = i === index;
                return (
                    <Pressable
                        key={p.id}
                        style={[styles.selector, wide && !compact && styles.selectorWide, selected && styles.selectorActive]}
                        onPress={() => goTo(i)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`Show ${p.title}`}
                    >
                        <Image source={{ uri: p.thumbnail }} style={styles.selectorImage} resizeMode="contain" />
                    </Pressable>
                );
            })}
        </View>
    );

    // Arrows + pagination dots (+ pause / play for the auto-play)
    const controls = (
        <View style={[styles.controls, wide ? styles.controlsWide : styles.controlsStacked, compact && styles.controlsCompact]}>
            <Pressable style={styles.arrow} onPress={() => stepRef.current(-1)} accessibilityLabel="Previous product">
                <MaterialCommunityIcons name="arrow-left" size={18} color={palette.ink} />
            </Pressable>
            <View style={styles.dots}>
                {products.map((p, i) => (
                    <Pressable key={p.id} onPress={() => goTo(i)} hitSlop={8} accessibilityLabel={`Go to product ${i + 1}`}>
                        <View style={[styles.dot, i === index && [styles.dotActive, { backgroundColor: themeOf(active).dark }]]} />
                    </Pressable>
                ))}
            </View>
            <Pressable style={styles.arrow} onPress={() => stepRef.current(1)} accessibilityLabel="Next product">
                <MaterialCommunityIcons name="arrow-right" size={18} color={palette.ink} />
            </Pressable>
            <Pressable style={styles.pause} onPress={() => setPaused((v) => !v)} accessibilityLabel={paused ? 'Play slideshow' : 'Pause slideshow'}>
                <MaterialCommunityIcons name={paused ? 'play' : 'pause'} size={16} color={palette.stone} />
            </Pressable>
        </View>
    );

    const reviewsEl =
        reviews && reviews.count > 0 && !compact ? (
            <View style={[styles.reviews, wide ? styles.reviewsWide : styles.reviewsStacked]}>
                <View style={styles.avatars}>
                    {reviews.initials.map((c, i) => (
                        <View key={`${c}-${i}`} style={[styles.avatar, { backgroundColor: THEMES[i % THEMES.length].dark }, i > 0 && { marginLeft: -8 }]}>
                            <Text style={styles.avatarText}>{c}</Text>
                        </View>
                    ))}
                </View>
                <View>
                    <Text style={styles.reviewsTitle}>{reviews.count}+ Reviews</Text>
                    <Text style={styles.reviewsSub}>Customers are satisfied</Text>
                </View>
            </View>
        ) : null;

    const backgrounds = (
        <>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: themeOf(leaving ?? shown).bg }]} />
            {leaving && <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: themeOf(shown).bg, opacity: fadeIn }]} />}
        </>
    );

    return (
        <View style={styles.root} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
            {wide ? (
                <View style={[styles.hero, { height: heroHeight }]}>
                    {backgrounds}
                    {wave}
                    <View style={[styles.shadowWide, { bottom: compact ? waveH * 0.9 + 8 : 150 }, compact && { left: '41%', width: '28%' }, NO_TOUCH]} />
                    {leaving && mainLayer(leaving, 'out')}
                    {mainLayer(shown, 'in')}
                    {leaving && peekLayer(leaving, 'out')}
                    {peekLayer(shown, 'in')}
                    {renderHeader ? <View style={styles.headerWrap}>{renderHeader(true)}</View> : null}
                    <View style={[styles.textColWide, compact && styles.textColCompact]}>{textStack}</View>
                    {selectors}
                    {reviewsEl}
                    {controls}
                </View>
            ) : (
                <View style={styles.hero}>
                    {backgrounds}
                    {wave}
                    {renderHeader ? <View style={styles.headerStacked}>{renderHeader(false)}</View> : null}
                    <View style={styles.textColStacked}>{textStack}</View>
                    <View style={styles.stage}>
                        {leaving && mainLayer(leaving, 'out')}
                        {mainLayer(shown, 'in')}
                        {leaving && peekLayer(leaving, 'out')}
                        {peekLayer(shown, 'in')}
                    </View>
                    {selectors}
                    <View style={{ height: waveH + 70 }} />
                    {controls}
                </View>
            )}
        </View>
    );
}

const styles = themed(() =>
    StyleSheet.create({
        root: { width: '100%' },
        hero: { borderRadius: 24, overflow: 'hidden', backgroundColor: THEMES[0].bg },
        fill: { width: '100%', height: '100%' },

        // Wave
        wave: { position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden' },
        waveBase: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: palette.ivory },
        shadowWide: { position: 'absolute', left: '36%', width: '29%', bottom: 150, height: 16, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.12)' },

        // Header + text
        headerWrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 6 },
        headerStacked: { zIndex: 6 },
        textColWide: { position: 'absolute', left: 44, top: 130, width: '33%', zIndex: 4 },
        textColCompact: { top: 40, left: 28, width: '38%' },
        textColStacked: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
        stage: { height: 330, marginTop: spacing.sm },
        greeting: { fontSize: 12, color: 'rgba(251,247,255,0.8)', marginBottom: 4 },
        textOut: { position: 'absolute', top: 0, left: 0, right: 0 },
        eyebrow: { fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: '700', color: 'rgba(251,247,255,0.8)', marginBottom: 6 },
        headline: { fontSize: 32, lineHeight: 36, fontWeight: '800', letterSpacing: -0.5, color: CREAM },
        headlineWide: { fontSize: 48, lineHeight: 52 },
        description: { fontSize: 13, lineHeight: 19, color: 'rgba(251,247,255,0.9)', marginTop: spacing.sm },
        headlineCompact: { fontSize: 28, lineHeight: 32 },
        descriptionCompact: { fontSize: 12, lineHeight: 18, marginTop: 6 },
        buttonCompact: { height: 38, paddingHorizontal: 18 },
        descriptionWide: { fontSize: 14, lineHeight: 22, marginTop: spacing.md },
        priceTag: { alignSelf: 'flex-start', marginTop: spacing.md, fontSize: 12, fontWeight: '700', color: CREAM, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, overflow: 'hidden' },
        buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
        buttonPrimary: { backgroundColor: CREAM, paddingHorizontal: 22, height: 42, borderRadius: 999, justifyContent: 'center' },
        buttonPrimaryText: { fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
        buttonSecondary: { paddingHorizontal: 22, height: 42, borderRadius: 999, justifyContent: 'center' },
        buttonSecondaryText: { fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', color: CREAM },

        // Selectors
        selectors: { flexDirection: 'row', gap: spacing.sm, zIndex: 5 },
        selectorsWide: { position: 'absolute', top: 96, right: 36 },
        selectorsCompact: { top: 16, right: 18 },
        selectorsStacked: { justifyContent: 'center', marginTop: spacing.sm },
        selector: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(251,247,255,0.35)', borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
        selectorWide: { width: 48, height: 48, borderRadius: 24 },
        selectorActive: { backgroundColor: CREAM, borderColor: CREAM, transform: [{ scale: 1.12 }] },
        selectorImage: { width: '80%', height: '80%' },

        // Controls
        controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, zIndex: 6 },
        controlsWide: { position: 'absolute', bottom: 26, left: 0, right: 0, justifyContent: 'center' },
        controlsCompact: { bottom: 12 },
        controlsStacked: { position: 'absolute', bottom: 24, left: 0, right: 0, justifyContent: 'center' },
        arrow: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center', ...softShadow('#000000', 0.12, 4, 2) },
        pause: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
        dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
        dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(36,21,64,0.25)' },
        dotActive: { width: 24 },

        // Reviews
        reviews: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, zIndex: 6 },
        reviewsWide: { position: 'absolute', left: 44, bottom: 28 },
        reviewsStacked: { display: 'none' },
        avatars: { flexDirection: 'row' },
        avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: palette.ivory },
        avatarText: { fontSize: 12, fontWeight: '700', color: CREAM },
        reviewsTitle: { fontSize: 13, fontWeight: '700', color: palette.ink },
        reviewsSub: { fontSize: 11, color: palette.stone },
    })
);