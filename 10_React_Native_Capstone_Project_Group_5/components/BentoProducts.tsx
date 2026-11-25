/**
 * BentoProducts - bento-style product grid
 * Product cards (Best price / discount tags, price, quick add-to-cart) mixed with two large
 * feature tiles, paged with pagination dots. Phones get 2 columns (feature tiles span both),
 * tablets 3 and desktop web 4.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types/product';
import { palette, radius, spacing, typeface, themed, softShadow } from '@/constants/theme';

interface BentoProductsProps {
    products: Product[];
    /** Width available for the grid */
    width: number;
    columns: number;
    gap?: number;
    perPage?: number;
    maxPages?: number;
    onOpenProduct: (id: number) => void;
    onOpenCollection: (slug: string) => void;
}

type TileKind = 'product' | 'featureA' | 'featureB';

const pretty = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
const price = (p: Product): number => p.price * (1 - p.discountPercentage / 100);

export function BentoProducts({
    products,
    width,
    columns,
    gap = 12,
    perPage = 8,
    maxPages = 5,
    onOpenProduct,
    onOpenCollection,
}: BentoProductsProps) {
    const { addItem, items } = useCart();
    const [page, setPage] = useState(0);
    // Use the real width of the container (not the window), so tiles never overflow it
    const [measured, setMeasured] = useState(0);
    const [addedId, setAddedId] = useState<number | null>(null);
    const fade = useRef(new Animated.Value(1)).current;
    const pages = Math.max(1, Math.min(maxPages, Math.ceil(products.length / perPage)));

    // A new list (different category) starts on the first page
    useEffect(() => {
        setPage(0);
    }, [products]);

    // Fade the grid in whenever the page changes
    useEffect(() => {
        fade.setValue(0);
        Animated.timing(fade, { toValue: 1, duration: 380, useNativeDriver: Platform.OS !== 'web' }).start();
    }, [page, products, fade]);

    // "Added" tick on the cart button
    useEffect(() => {
        if (addedId === null) return undefined;
        const timer = setTimeout(() => setAddedId(null), 1200);
        return () => clearTimeout(timer);
    }, [addedId]);

    const current = Math.min(page, pages - 1);
    const pageItems = products.slice(current * perPage, current * perPage + perPage);
    const usable = measured > 0 ? measured : width;
    const colW = Math.floor((usable - gap * (columns - 1)) / columns);
    const cardH = Math.round(colW * (columns === 2 ? 1.28 : 1.12));
    const order: TileKind[] =
        pageItems.length >= perPage
            ? ['featureA', 'product', 'product', 'featureB', 'product', 'product', 'product', 'product']
            : pageItems.map(() => 'product');

    const quickAdd = (p: Product) => {
        const inCart = items.find((i) => i.productId === p.id)?.quantity ?? 0;
        if (p.stock <= 0 || inCart >= p.stock) return;
        addItem({
            productId: p.id,
            title: p.title,
            thumbnail: p.thumbnail,
            price: p.price,
            discountPercentage: p.discountPercentage,
            quantity: 1,
            stock: p.stock,
        });
        setAddedId(p.id);
    };

    const productCard = (p: Product, w: number) => (
        <Pressable key={p.id} style={[styles.card, { width: w, height: cardH }]} onPress={() => onOpenProduct(p.id)} accessibilityRole="button" accessibilityLabel={p.title}>
            <View style={styles.cardImageWrap}>
                <Image source={{ uri: p.thumbnail }} style={styles.cardImage} resizeMode="contain" />
            </View>
            {p.rating >= 4.5 && (
                <View style={styles.tagDark}>
                    <Text style={styles.tagDarkText}>Best price</Text>
                </View>
            )}
            {p.discountPercentage > 0 && (
                <View style={styles.tagMint}>
                    <Text style={styles.tagMintText}>{Math.round(p.discountPercentage)}%</Text>
                </View>
            )}
            <View style={styles.cardInfo}>
                <View style={styles.cardText}>
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>${price(p).toFixed(2)}</Text>
                        {p.discountPercentage > 0 && <Text style={styles.original}>${p.price.toFixed(2)}</Text>}
                    </View>
                    <Text style={styles.name} numberOfLines={1}>{p.title}</Text>
                </View>
                <Pressable style={styles.cartButton} onPress={() => quickAdd(p)} accessibilityLabel={`Add ${p.title} to cart`}>
                    <MaterialCommunityIcons name={addedId === p.id ? 'check' : 'cart-outline'} size={18} color={palette.surface} />
                </Pressable>
            </View>
        </Pressable>
    );

    const featureTile = (kind: 'featureA' | 'featureB', p: Product, w: number) => {
        const a = kind === 'featureA';
        return (
            <Pressable
                key={`${kind}-${p.id}`}
                style={[styles.feature, { width: w, height: cardH, backgroundColor: a ? '#E4DAF8' : '#F0E0F3' }]}
                onPress={() => (a ? onOpenProduct(p.id) : onOpenCollection(p.category))}
                accessibilityRole="button"
                accessibilityLabel={p.title}
            >
                <Image source={{ uri: p.thumbnail }} style={styles.featureImage} resizeMode="contain" />
                <View style={styles.featureText}>
                    {a && (
                        <View style={styles.featurePill}>
                            <Text style={styles.featurePillText}>Trending</Text>
                        </View>
                    )}
                    <Text style={[styles.featureTitle, columns === 2 && styles.featureTitleSmall]} numberOfLines={3}>{p.title}</Text>
                    <Text style={styles.featureSub} numberOfLines={2}>{a ? `${pretty(p.category)} · from $${price(p).toFixed(2)}` : `Upgrade your ${pretty(p.category).toLowerCase()}.`}</Text>
                    {a ? (
                        <View style={styles.featureArrow}>
                            <MaterialCommunityIcons name="arrow-right" size={20} color={palette.surface} />
                        </View>
                    ) : (
                        <View style={styles.featureButton}>
                            <Text style={styles.featureButtonText} numberOfLines={1}>Shop {pretty(p.category)}</Text>
                            <MaterialCommunityIcons name="arrow-right" size={14} color={palette.forest} />
                        </View>
                    )}
                </View>
            </Pressable>
        );
    };

    return (
        <View style={{ width: '100%' }} onLayout={(e: LayoutChangeEvent) => setMeasured(Math.floor(e.nativeEvent.layout.width))}>
            <Animated.View style={[styles.grid, { gap, opacity: fade }]}>
                {pageItems.map((p, i) => {
                    const kind = order[i];
                    const span = kind !== 'product' && columns === 2 ? colW * 2 + gap : colW;
                    return kind === 'product' ? productCard(p, span) : featureTile(kind, p, span);
                })}
            </Animated.View>

            {pages > 1 && (
                <View style={styles.dots}>
                    {Array.from({ length: pages }, (_, i) => (
                        <Pressable key={i} onPress={() => setPage(i)} hitSlop={8} accessibilityLabel={`Page ${i + 1}`}>
                            <View style={[styles.dot, i === current && styles.dotActive]} />
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = themed(() =>
    StyleSheet.create({
        grid: { flexDirection: 'row', flexWrap: 'wrap' },

        // Product card
        card: {
            backgroundColor: palette.surface, borderRadius: 24, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line,
            ...softShadow('#3A1E70', 0.07, 10, 4, 1),
        },
        cardImageWrap: { position: 'absolute', top: 0, left: 0, right: 0, height: '64%', alignItems: 'center', justifyContent: 'center', backgroundColor: palette.sand },
        cardImage: { width: '78%', height: '84%' },
        tagDark: { position: 'absolute', top: 10, left: 10, backgroundColor: palette.forest, borderRadius: radius.md, paddingHorizontal: 9, paddingVertical: 4, zIndex: 2 },
        tagDarkText: { fontSize: 11, fontWeight: '700', color: palette.surface },
        tagMint: { position: 'absolute', top: 10, right: 10, backgroundColor: palette.mint, borderRadius: radius.md, paddingHorizontal: 9, paddingVertical: 4, zIndex: 2 },
        tagMintText: { fontSize: 11, fontWeight: '800', color: palette.forest },
        cardInfo: { position: 'absolute', left: 14, right: 10, bottom: 12, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
        cardText: { flex: 1 },
        priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
        price: { fontSize: 18, fontWeight: '800', color: palette.ink },
        original: { fontSize: 12, color: palette.mist, textDecorationLine: 'line-through' },
        name: { fontSize: 13, color: palette.stone, marginTop: 2 },
        cartButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: palette.forest, alignItems: 'center', justifyContent: 'center' },

        // Feature tiles
        feature: { borderRadius: 24, overflow: 'hidden' },
        featureImage: { position: 'absolute', right: '-6%', bottom: 0, width: '60%', height: '88%' },
        featureText: { flex: 1, width: '58%', padding: 18, justifyContent: 'center' },
        featurePill: { alignSelf: 'flex-start', backgroundColor: palette.forest, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
        featurePillText: { fontSize: 11, fontWeight: '700', color: palette.surface },
        featureTitle: { fontFamily: typeface.display, fontSize: 24, lineHeight: 29, color: palette.ink },
        featureTitleSmall: { fontSize: 20, lineHeight: 24 },
        featureSub: { fontSize: 12, color: palette.stone, marginTop: 6 },
        featureArrow: { marginTop: 14, width: 42, height: 42, borderRadius: 21, backgroundColor: palette.forest, alignItems: 'center', justifyContent: 'center' },
        featureButton: { marginTop: 14, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: palette.surface, borderRadius: radius.pill, paddingHorizontal: 14, height: 38 },
        featureButtonText: { fontSize: 12, fontWeight: '700', color: palette.forest },

        // Pagination dots
        dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.lg },
        dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.beige },
        dotActive: { width: 22, backgroundColor: palette.forest },
    })
);