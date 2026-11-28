/**
 * SpotlightCarousel - product-driven interactive spotlight (fashion "runway")
 * The vertical list of product cards on the right is the navigation: clicking a card makes that
 * product the active one, and the centre spotlight image, name, price, description and look number
 * all follow the same active-product state. The first product is featured on load.
 * No arrows and no auto-play: the spotlight only changes when the user selects a card.
 *
 * Responsive, based on the width the component is given:
 * - desktop (>= 960): three columns that fill the available space - details | spotlight | product rail
 * - tablet  (>= 640): spotlight with details underneath, wide rail on the right
 * - phone:            same stack with a slim rail on the right
 */
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Image,
    ImageStyle,
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types/product';
import { palette, radius, spacing, typeface, themed, withAlpha, NO_TOUCH, touchWhen } from '@/constants/theme';

interface SpotlightCarouselProps {
    products: Product[];
    eyebrow?: string;
    title?: string;
    onOpenProduct: (id: number) => void;
}

type Layout = 'phone' | 'tablet' | 'desktop';

const price = (p: Product): number => p.price * (1 - p.discountPercentage / 100);
const pad2 = (n: number): string => String(n).padStart(2, '0');

// Web only: CSS blur (the native `blurRadius` prop is used on iOS / Android)
const webBlur = (Platform.OS === 'web' ? { filter: 'blur(3px)' } : {}) as unknown as ImageStyle;

interface RailCardProps {
    product: Product;
    index: number;
    height: number;
    selected: boolean;
    onPress: () => void;
}

// Selection (border, indicator bar, opacity) eases in and out instead of snapping
function RailCard({ product, index, height, selected, onPress }: RailCardProps) {
    const sel = useRef(new Animated.Value(selected ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(sel, { toValue: selected ? 1 : 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    }, [selected, sel]);

    return (
        <Animated.View style={{ opacity: sel.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }}>
            <Pressable
                style={[styles.railCard, { height }]}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={product.title}
            >
                <Animated.View
                    style={[NO_TOUCH,
                        styles.railBorder,
                        { borderColor: sel.interpolate({ inputRange: [0, 1], outputRange: [withAlpha(palette.sage, 0), palette.sage] }) },
                    ]}
                />
                <Animated.View style={[styles.railIndicator, { opacity: sel }, NO_TOUCH]} />
                <Text style={styles.railIndex}>{pad2(index + 1)}</Text>
                <Image source={{ uri: product.thumbnail }} style={styles.railImage} resizeMode="contain" />
                <View style={styles.railMeta}>
                    <Text style={styles.railName} numberOfLines={2}>{product.title}</Text>
                    <Text style={styles.railPrice}>${price(product).toFixed(2)}</Text>
                </View>
            </Pressable>
        </Animated.View>
    );
}

export function SpotlightCarousel({
    products,
    eyebrow,
    title = 'Wear what vibes with your mood.',
    onOpenProduct,
}: SpotlightCarouselProps) {
    const { addItem, items } = useCart();
    const { height: windowHeight } = useWindowDimensions();
    // Shared active-product state: the first product is featured on load
    const [activeId, setActiveId] = useState<number | null>(products[0]?.id ?? null);
    const [width, setWidth] = useState(0);
    const [added, setAdded] = useState(false);
    // `shown` is what the centre + details display; `leaving` is the previous product fading out
    const [shown, setShown] = useState<Product | undefined>(products[0]);
    const [leaving, setLeaving] = useState<Product | null>(null);
    const shownRef = useRef<Product | undefined>(products[0]);
    const progress = useRef(new Animated.Value(1)).current;
    const railRef = useRef<ScrollView>(null);
    const railScrollY = useRef(0);
    const railViewHeight = useRef(0);

    // If the list changes (new search / filter) and the active product is gone, feature the first one
    useEffect(() => {
        if (products.length > 0 && !products.some((p) => p.id === activeId)) setActiveId(products[0].id);
    }, [products, activeId]);

    const activeIndex = Math.max(0, products.findIndex((p) => p.id === activeId));
    const active: Product | undefined = products[activeIndex];

    // Cross-fade + slide from the previous product to the newly selected one
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
        setAdded(false);
        progress.stopAnimation();
        progress.setValue(0);
        Animated.timing(progress, {
            toValue: 1,
            duration: 650,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
        }).start(({ finished }) => {
            if (finished) setLeaving(null);
        });
    }, [active, progress]);

    // "Added" confirmation fades back to the normal label
    useEffect(() => {
        if (!added) return undefined;
        const timer = setTimeout(() => setAdded(false), 1500);
        return () => clearTimeout(timer);
    }, [added]);

    if (!active || !shown) return null;

    const layout: Layout = width >= 960 ? 'desktop' : width >= 640 ? 'tablet' : 'phone';
    const desktop = layout === 'desktop';
    const railWidth = desktop ? 270 : layout === 'tablet' ? 220 : 116;
    const railCardHeight = desktop ? 176 : layout === 'tablet' ? 170 : 156;
    const imageHeight = layout === 'tablet' ? 400 : 250;
    // Desktop: fill the visible height of the window (above the tab bar)
    const cardHeight = Math.min(Math.max(windowHeight - 240, 540), 740);
    const n = products.length;
    const indexOf = (p: Product): number => Math.max(0, products.findIndex((x) => x.id === p.id));

    const inCart = items.find((i) => i.productId === shown.id)?.quantity ?? 0;
    const soldOut = shown.stock <= 0;
    const maxed = !soldOut && inCart >= shown.stock;

    const addToCart = () => {
        if (soldOut || maxed) return;
        addItem({
            productId: shown.id,
            title: shown.title,
            thumbnail: shown.thumbnail,
            price: shown.price,
            discountPercentage: shown.discountPercentage,
            quantity: 1,
            stock: shown.stock,
        });
        setAdded(true);
    };

    const buttonLabel = added
        ? 'Added to cart'
        : soldOut
            ? 'Out of stock'
            : maxed
                ? 'Maximum already in cart'
                : 'Want this item? Add to cart';

    // Select a card, and ease the rail so the card is fully visible
    const select = (p: Product, i: number) => {
        setActiveId(p.id);
        const top = i * railCardHeight;
        const bottom = top + railCardHeight;
        if (top < railScrollY.current) railRef.current?.scrollTo({ y: top, animated: true });
        else if (railViewHeight.current > 0 && bottom > railScrollY.current + railViewHeight.current) {
            railRef.current?.scrollTo({ y: bottom - railViewHeight.current, animated: true });
        }
    };

    // Layer helpers: the entering layer eases in, the leaving layer eases out
    const fadeIn = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
    const fadeOut = progress.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0, 0] });
    const textIn = progress.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 0, 1] });
    const textOut = progress.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 0, 0] });
    const slideIn = progress.interpolate({ inputRange: [0, 1], outputRange: [44, 0] });
    const slideOut = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -44] });
    const scaleIn = progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });
    const scaleOut = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] });
    const riseIn = progress.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
    const riseOut = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

    const mainLayer = (p: Product, mode: 'in' | 'out') => (
        <Animated.View
            key={`main-${p.id}`}
            style={[touchWhen(mode === 'in'),
            styles.mainBox,
            desktop ? styles.mainBoxDesktop : styles.mainBoxStacked,
            {
                opacity: mode === 'in' ? fadeIn : fadeOut,
                transform: [{ translateX: mode === 'in' ? slideIn : slideOut }, { scale: mode === 'in' ? scaleIn : scaleOut }],
            },
            ]}
        >
            <Pressable style={styles.fill} onPress={() => onOpenProduct(p.id)} accessibilityLabel={p.title}>
                <Image source={{ uri: p.thumbnail }} style={styles.fill} resizeMode="contain" />
            </Pressable>
        </Animated.View>
    );

    const watermarkLayer = (p: Product, mode: 'in' | 'out') => (
        <Animated.Text
            key={`mark-${p.id}`}
            style={[NO_TOUCH, styles.watermark, desktop && styles.watermarkDesktop, { opacity: mode === 'in' ? textIn : textOut }]}
        >
            {pad2(indexOf(p) + 1)}
        </Animated.Text>
    );

    const ghostsLayer = (p: Product, mode: 'in' | 'out') => {
        const i = indexOf(p);
        const before = n > 1 ? products[(i - 1 + n) % n] : null;
        const after = n > 2 ? products[(i + 1) % n] : null;
        const item = (g: Product, side: 'left' | 'right') => (
            <Pressable
                key={`${mode}-${side}-${g.id}`}
                style={[styles.ghost, side === 'left' ? styles.ghostLeft : styles.ghostRight, desktop && styles.ghostDesktop]}
                onPress={() => select(g, indexOf(g))}
                disabled={mode === 'out'}
                accessibilityLabel={g.title}
            >
                <Animated.View style={[styles.fill, { opacity: mode === 'in' ? fadeIn : fadeOut }]}>
                    <Image
                        source={{ uri: g.thumbnail }}
                        style={[styles.fill, { opacity: 0.4 }, webBlur]}
                        resizeMode="contain"
                        blurRadius={Platform.OS === 'web' ? 0 : 6}
                    />
                </Animated.View>
            </Pressable>
        );
        return (
            <React.Fragment key={`ghosts-${mode}-${p.id}`}>
                {before && item(before, 'left')}
                {after && item(after, 'right')}
            </React.Fragment>
        );
    };

    const headline = (
        <View style={desktop ? styles.headlineDesktop : styles.headline}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            <Text style={[styles.title, layout !== 'phone' && styles.titleWide, desktop && styles.titleDesktop]}>{title}</Text>
        </View>
    );

    const image = (
        <View style={[styles.imageArea, desktop ? styles.imageAreaDesktop : { height: imageHeight }]}>
            <View style={styles.glow} />
            {leaving && watermarkLayer(leaving, 'out')}
            {watermarkLayer(shown, 'in')}
            {leaving && ghostsLayer(leaving, 'out')}
            {ghostsLayer(shown, 'in')}
            <View style={styles.shadow} />
            {leaving && mainLayer(leaving, 'out')}
            {mainLayer(shown, 'in')}
        </View>
    );

    // Details + "want this item" button for one product
    const detailsLayer = (p: Product, mode: 'in' | 'out') => (
        <Animated.View
            key={`info-${p.id}`}
            style={[touchWhen(mode === 'in'),
            mode === 'out' && styles.infoOut,
            mode === 'out' && !desktop && { left: spacing.md, right: spacing.md },
            { opacity: mode === 'in' ? textIn : textOut, transform: [{ translateY: mode === 'in' ? riseIn : riseOut }] },
            ]}
        >
            <Text style={[styles.look, desktop && styles.lookDesktop]}>LOOK {pad2(indexOf(p) + 1)}</Text>
            <Text style={[styles.name, desktop && styles.nameDesktop]} numberOfLines={2}>{p.title}</Text>
            <View style={styles.priceRow}>
                <Text style={[styles.price, desktop && styles.priceDesktop]}>${price(p).toFixed(2)}</Text>
                {p.discountPercentage > 0 && <Text style={styles.original}>${p.price.toFixed(2)}</Text>}
                {p.discountPercentage > 0 && (
                    <View style={styles.off}>
                        <Text style={styles.offText}>-{Math.round(p.discountPercentage)}%</Text>
                    </View>
                )}
            </View>
            <Text style={[styles.description, desktop && styles.descriptionDesktop]} numberOfLines={desktop ? 5 : 3}>
                {p.description}
            </Text>
            <Pressable
                style={[styles.wantButton, mode === 'in' && (soldOut || maxed) && styles.wantButtonDisabled, mode === 'in' && added && styles.wantButtonAdded]}
                onPress={addToCart}
                disabled={mode === 'out' || soldOut || maxed}
                accessibilityRole="button"
            >
                <MaterialCommunityIcons name={mode === 'in' && added ? 'check' : 'shopping-outline'} size={16} color={palette.surface} />
                <Text style={styles.wantText}>{mode === 'in' ? buttonLabel : 'Want this item? Add to cart'}</Text>
            </Pressable>
            <Pressable onPress={() => onOpenProduct(p.id)} accessibilityRole="link">
                <Text style={styles.detailsLink}>VIEW DETAILS</Text>
            </Pressable>
        </Animated.View>
    );

    const details = (
        <View style={desktop ? styles.infoDesktop : styles.info}>
            {leaving && detailsLayer(leaving, 'out')}
            {detailsLayer(shown, 'in')}
        </View>
    );

    // Product rail = the navigation
    const rail = (
        <View style={[desktop ? styles.railDesktop : styles.rail, { width: railWidth }]}>
            {desktop && (
                <View style={styles.railHeader}>
                    <Text style={styles.railTitle}>The Edit</Text>
                    <Text style={styles.railCount}>{pad2(n)} looks</Text>
                </View>
            )}
            <ScrollView
                ref={railRef}
                style={styles.railScroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                scrollEventThrottle={16}
                onLayout={(e: LayoutChangeEvent) => {
                    railViewHeight.current = e.nativeEvent.layout.height;
                }}
                onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                    railScrollY.current = e.nativeEvent.contentOffset.y;
                }}
            >
                {products.map((p, i) => (
                    <RailCard key={p.id} product={p} index={i} height={railCardHeight} selected={p.id === active.id} onPress={() => select(p, i)} />
                ))}
            </ScrollView>
        </View>
    );

    return (
        <View style={styles.wrap} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
            {desktop ? (
                <View style={[styles.card, styles.cardDesktop, { height: cardHeight }]}>
                    <View style={styles.infoCol}>
                        {headline}
                        {details}
                    </View>
                    <View style={styles.centerCol}>{image}</View>
                    {rail}
                </View>
            ) : (
                <View style={styles.card}>
                    <View style={[styles.stage, { paddingRight: railWidth }]}>
                        {headline}
                        {image}
                        {details}
                    </View>
                    {rail}
                </View>
            )}
        </View>
    );
}

const styles = themed(() =>
    StyleSheet.create({
        wrap: { width: '100%', marginBottom: spacing.lg },
        card: { borderRadius: radius.xl, backgroundColor: palette.blush, overflow: 'hidden' },
        cardDesktop: { flexDirection: 'row' },
        fill: { width: '100%', height: '100%' },

        // Layout pieces
        stage: { paddingBottom: spacing.md },
        infoCol: { width: '31%', justifyContent: 'space-between', paddingVertical: 40, paddingLeft: 44, paddingRight: 20, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: palette.line },
        centerCol: { flex: 1 },

        // Headline
        headline: { paddingTop: spacing.lg, paddingHorizontal: spacing.md },
        headlineDesktop: {},
        eyebrow: { fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: palette.sage, fontWeight: '600', marginBottom: 6 },
        title: { fontFamily: typeface.display, fontSize: 15, lineHeight: 21, letterSpacing: 1.5, textTransform: 'uppercase', color: palette.ink },
        titleWide: { fontSize: 24, lineHeight: 32 },
        titleDesktop: { fontSize: 30, lineHeight: 40, letterSpacing: 2.5, fontWeight: '300' },

        // Image area
        imageArea: { marginTop: spacing.sm, overflow: 'hidden' },
        imageAreaDesktop: { flex: 1, marginTop: 0 },
        glow: { position: 'absolute', left: '14%', right: '14%', top: '4%', aspectRatio: 1, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.55)' },
        watermark: { position: 'absolute', alignSelf: 'center', top: '6%', fontFamily: typeface.display, fontSize: 150, color: 'rgba(255,255,255,0.55)', letterSpacing: 4 },
        watermarkDesktop: { fontSize: 320, top: '2%' },
        mainBox: { position: 'absolute', top: 10, bottom: 26 },
        mainBoxStacked: { left: '18%', right: '18%' },
        mainBoxDesktop: { left: '12%', right: '12%', top: 24, bottom: 40 },
        shadow: { position: 'absolute', bottom: 14, left: '28%', right: '28%', height: 16, borderRadius: 8, backgroundColor: 'rgba(36,21,64,0.13)' },
        ghost: { position: 'absolute', bottom: 36, height: '52%', width: '24%' },
        ghostLeft: { left: '-3%' },
        ghostRight: { right: '-3%' },
        ghostDesktop: { width: '20%', height: '58%', bottom: 60 },

        // Details
        info: { paddingHorizontal: spacing.md },
        infoDesktop: {},
        infoOut: { position: 'absolute', top: 0, left: 0, right: 0 },
        look: { fontFamily: typeface.display, fontSize: 18, letterSpacing: 3, color: palette.sage, marginBottom: 2 },
        lookDesktop: { fontSize: 34, letterSpacing: 5, marginBottom: spacing.sm },
        name: { fontFamily: typeface.display, fontSize: 18, lineHeight: 23, letterSpacing: 0.4, color: palette.ink },
        nameDesktop: { fontSize: 28, lineHeight: 34 },
        priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 },
        price: { fontSize: 17, fontWeight: '700', color: palette.ink },
        priceDesktop: { fontSize: 22 },
        original: { fontSize: 13, color: palette.mist, textDecorationLine: 'line-through' },
        off: { backgroundColor: palette.mint, borderRadius: radius.sm, paddingHorizontal: 7, paddingVertical: 2 },
        offText: { fontSize: 10, fontWeight: '700', color: palette.night },
        description: { fontSize: 12, lineHeight: 18, color: palette.stone, marginTop: spacing.sm },
        descriptionDesktop: { fontSize: 14, lineHeight: 23, marginTop: spacing.md },
        wantButton: {
            marginTop: spacing.md, minHeight: 46, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: palette.night,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
        },
        wantButtonAdded: { backgroundColor: palette.sage },
        wantButtonDisabled: { backgroundColor: palette.mist },
        wantText: { fontSize: 13, fontWeight: '600', color: palette.surface },
        detailsLink: { fontSize: 11, letterSpacing: 1.5, color: palette.ink, textDecorationLine: 'underline', marginTop: spacing.sm },

        // Rail (the navigation)
        rail: { position: 'absolute', top: 0, right: 0, bottom: 0, backgroundColor: palette.beige },
        railDesktop: { backgroundColor: palette.beige },
        railScroll: { flex: 1 },
        railHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: spacing.md, paddingVertical: spacing.md },
        railTitle: { fontFamily: typeface.display, fontSize: 18, color: palette.ink },
        railCount: { fontSize: 11, letterSpacing: 1.5, color: palette.stone, textTransform: 'uppercase' },
        railCard: { backgroundColor: palette.surface, overflow: 'hidden', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
        railBorder: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 2, zIndex: 3 },
        railIndicator: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: palette.sage, zIndex: 4 },
        railIndex: { position: 'absolute', top: 6, left: 10, fontSize: 10, letterSpacing: 1, color: palette.stone },
        railImage: { position: 'absolute', top: 18, left: 10, right: 10, bottom: 52, width: undefined, height: undefined },
        railMeta: { position: 'absolute', left: 10, right: 8, bottom: 6 },
        railName: { fontSize: 10, lineHeight: 13, letterSpacing: 0.6, textTransform: 'uppercase', color: palette.ink },
        railPrice: { fontSize: 11, color: palette.stone, marginTop: 2 },
    })
);