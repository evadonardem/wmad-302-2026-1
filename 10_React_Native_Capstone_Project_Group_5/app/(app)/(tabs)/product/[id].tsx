/**
 * Product Detail Screen - Marketplace
 * Image gallery, specs, rating, reviews, share, add-to-cart
 * API: GET /products/{id}
 * Boutique product page. Wide screens: gallery (thumbnail column + big image + banner) on the left,
 * product info on the right. Phones: stacked, with a fixed add-to-cart bar.
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, Pressable, Share, Modal, Animated, Platform, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { productApi } from '@/services/productApi';
import { ScreenBackground } from '@/components/ScreenBackground';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { Product } from '@/types/product';
import { useResponsive, palette, radius, spacing, typeface, MAX_CONTENT_WIDTH, themed, withAlpha } from '@/constants/theme';

type Tab = 'specs' | 'reviews' | 'shipping';
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const pretty = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');

export default function ProductDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { width, pad } = useResponsive();
    const { addItem, items, totalQuantity } = useCart();
    const { has: inWishlist, toggle: toggleWishlist } = useWishlist();
    const wide = width >= 900;

    const [product, setProduct] = useState<Product | null>(null);
    const [related, setRelated] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imageIndex, setImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [expanded, setExpanded] = useState(false);
    const [viewer, setViewer] = useState(false);
    const [tab, setTab] = useState<Tab>('specs');
    const [snack, setSnack] = useState<string | null>(null);
    const fade = useRef(new Animated.Value(1)).current;

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            setImageIndex(0);
            setQuantity(1);
            setProduct(await productApi.getProductById(Number(id)));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load product');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    // Other products of the same category feed the "New arrival" banner
    const category = product?.category;
    useEffect(() => {
        if (!category) return;
        productApi
            .getProductsByCategory(category, { limit: 6 })
            .then((res) => setRelated(res.products))
            .catch(() => setRelated([]));
    }, [category]);

    // Ease the big image in whenever another picture is selected
    useEffect(() => {
        fade.setValue(0);
        Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: Platform.OS !== 'web' }).start();
    }, [imageIndex, product?.id, fade]);

    const handleShare = async () => {
        if (!product) return;
        try {
            await Share.share({
                message: `Check out ${product.title} for $${product.price.toFixed(2)} on Marketplace!`,
            });
        } catch {
            setSnack('Unable to share right now');
        }
    };

    const handleAddToCart = () => {
        if (!product) return;
        const inCart = items.find((i) => i.productId === product.id)?.quantity ?? 0;
        if (inCart + quantity > product.stock) {
            setSnack(`Only ${product.stock} in stock (you already have ${inCart} in your cart)`);
            return;
        }
        addItem({
            productId: product.id,
            title: product.title,
            thumbnail: product.thumbnail,
            price: product.price,
            discountPercentage: product.discountPercentage,
            quantity,
            stock: product.stock,
        });
        setSnack(`Added ${quantity} to cart`);
        setQuantity(1);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={palette.forest} />
            </View>
        );
    }

    if (error || !product) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{error ?? 'Product not found'}</Text>
                <Button mode="contained" onPress={load}>Retry</Button>
                <Button onPress={() => (router.canGoBack() ? router.back() : router.push('/(app)/(tabs)/home'))} style={{ marginTop: 8 }}>Go back</Button>
            </View>
        );
    }

    // Hearts save to the wishlist (kept per user, listed in Profile > Wishlist)
    const liked = inWishlist(product.id);
    const toggleWish = () => {
        const added = toggleWishlist({
            productId: product.id,
            title: product.title,
            thumbnail: product.thumbnail,
            price: product.price,
            discountPercentage: product.discountPercentage,
            stock: product.stock,
            category: product.category,
        });
        setSnack(added ? 'Saved to your wishlist' : 'Removed from your wishlist');
    };

    const discountedPrice = product.price * (1 - product.discountPercentage / 100);
    const images = product.images.length > 0 ? product.images : [product.thumbnail];
    const index = Math.min(imageIndex, images.length - 1);
    const outOfStock = product.stock <= 0;
    const bannerProduct = related.find((r) => r.id !== product.id) ?? null;
    const mainHeight = wide ? Math.min(760, Math.max(560, Math.round(width * 0.33))) : 340;

    const cartButton = (
        <Pressable style={styles.roundButton} onPress={() => router.push('/(app)/(tabs)/cart')} accessibilityLabel="Open cart">
            <MaterialCommunityIcons name="shopping-outline" size={20} color={palette.ink} />
            {totalQuantity > 0 && (
                <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{totalQuantity}</Text>
                </View>
            )}
        </Pressable>
    );

    // Quantity stepper + add button (a fixed bar on phones, inline on wide screens)
    const actions = (
        <View style={wide ? styles.actionsInline : styles.bottomBar}>
            {!wide && (
                <View style={styles.barPrice}>
                    {product.discountPercentage > 0 && <Text style={styles.barOriginal}>${product.price.toFixed(2)}</Text>}
                    <Text style={styles.barTotal}>${discountedPrice.toFixed(2)}</Text>
                </View>
            )}
            <View style={styles.qty}>
                <Pressable
                    style={styles.qtyButton}
                    onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    accessibilityLabel="Decrease quantity"
                >
                    <MaterialCommunityIcons name="minus" size={18} color={quantity <= 1 ? palette.mist : palette.ink} />
                </Pressable>
                <Text style={styles.qtyText}>{quantity}</Text>
                <Pressable
                    style={styles.qtyButton}
                    onPress={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    accessibilityLabel="Increase quantity"
                >
                    <MaterialCommunityIcons name="plus" size={18} color={quantity >= product.stock ? palette.mist : palette.ink} />
                </Pressable>
            </View>
            <Pressable
                style={[styles.addButton, outOfStock && styles.addButtonDisabled]}
                onPress={handleAddToCart}
                disabled={outOfStock}
                accessibilityRole="button"
            >
                {!outOfStock && <MaterialCommunityIcons name="shopping-outline" size={20} color={palette.surface} />}
                <Text style={styles.addButtonText}>{outOfStock ? 'Out of stock' : 'Add to Cart'}</Text>
            </Pressable>
            {wide && (
                <Pressable style={styles.heartButton} onPress={toggleWish} accessibilityLabel="Save to wishlist">
                    <MaterialCommunityIcons name={liked ? 'heart' : 'heart-outline'} size={24} color={liked ? palette.danger : palette.ink} />
                </Pressable>
            )}
        </View>
    );

    const features: { icon: IconName; title: string; text: string }[] = [
        { icon: 'truck-delivery-outline', title: 'Shipping', text: product.shippingInformation },
        { icon: 'shield-check-outline', title: 'Secure Payment', text: '100% secure' },
        { icon: 'cached', title: 'Easy Returns', text: product.returnPolicy },
    ];

    const specs: [string, string][] = [
        ['SKU', product.sku],
        ['Weight', `${product.weight} g`],
        ['Dimensions', `${product.dimensions.width} × ${product.dimensions.height} × ${product.dimensions.depth}`],
        ['Warranty', product.warrantyInformation],
        ['Availability', product.availabilityStatus],
        ['Min. order', String(product.minimumOrderQuantity)],
    ];

    const shippingInfo: [string, string][] = [
        ['Shipping', product.shippingInformation],
        ['Returns', product.returnPolicy],
        ['Availability', product.availabilityStatus],
        ['In stock', String(product.stock)],
    ];

    const tableRows = (rows: [string, string][]) =>
        rows.map(([label, value], i) => (
            <View key={label} style={[styles.specRow, i === rows.length - 1 && styles.specRowLast]}>
                <Text style={styles.specLabel}>{label}</Text>
                <Text style={styles.specValue}>{value}</Text>
            </View>
        ));

    const thumbnails = (
        <>
            {images.map((uri, i) => (
                <Pressable
                    key={`${uri}-${i}`}
                    style={[styles.thumb, i === index && styles.thumbActive]}
                    onPress={() => setImageIndex(i)}
                    accessibilityLabel={`Image ${i + 1}`}
                >
                    <Image source={{ uri }} style={styles.thumbImage} resizeMode="contain" />
                </Pressable>
            ))}
        </>
    );

    return (
        <View style={styles.container}>
            <ScreenBackground />
            <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: pad }]}>
                {/* Top bar */}
                {wide ? (
                    <View style={styles.navBar}>
                        <Pressable style={styles.roundButton} onPress={() => (router.canGoBack() ? router.back() : router.push('/(app)/(tabs)/home'))} accessibilityLabel="Go back">
                            <MaterialCommunityIcons name="arrow-left" size={20} color={palette.ink} />
                        </Pressable>
                        <View style={styles.brand}>
                            <MaterialCommunityIcons name="shopping" size={26} color={palette.forest} />
                            <Text style={styles.brandText}>MARKETPLACE</Text>
                        </View>
                        <View style={styles.navLinks}>
                            <Pressable onPress={() => router.push('/(app)/(tabs)/home')}><Text style={styles.navLink}>Home</Text></Pressable>
                            <Pressable onPress={() => router.push('/(app)/(tabs)/search')}><Text style={[styles.navLink, styles.navLinkActive]}>Shop</Text></Pressable>
                            <Pressable onPress={() => router.push('/(app)/(tabs)/categories')}><Text style={styles.navLink}>Collections</Text></Pressable>
                            <Pressable onPress={() => router.push('/(app)/(tabs)/profile')}><Text style={styles.navLink}>Account</Text></Pressable>
                        </View>
                        <View style={styles.navRight}>
                            <Pressable style={styles.navSearch} onPress={() => router.push('/(app)/(tabs)/search')} accessibilityRole="search">
                                <MaterialCommunityIcons name="magnify" size={18} color={palette.ink} />
                                <Text style={styles.navSearchText}>Search products...</Text>
                            </Pressable>
                            <Pressable style={styles.roundButton} onPress={() => router.push('/(app)/(tabs)/profile')} accessibilityLabel="Open profile">
                                <MaterialCommunityIcons name="account-outline" size={20} color={palette.ink} />
                            </Pressable>
                            {cartButton}
                        </View>
                    </View>
                ) : (
                    <View style={styles.topBar}>
                        <Pressable style={styles.roundButton} onPress={() => (router.canGoBack() ? router.back() : router.push('/(app)/(tabs)/home'))} accessibilityLabel="Go back">
                            <MaterialCommunityIcons name="arrow-left" size={20} color={palette.ink} />
                        </Pressable>
                        <Text style={styles.topTitle}>Product Details</Text>
                        {cartButton}
                    </View>
                )}

                <View style={[styles.layout, wide && styles.layoutWide]}>
                    <View style={wide ? styles.leftColumnWide : styles.leftColumn}>
                        {/* Image gallery */}
                        <View style={styles.galleryRow}>
                            {wide && (
                                <View style={styles.thumbColumn}>
                                    <Pressable style={styles.thumbArrow} onPress={() => setImageIndex(Math.max(0, index - 1))} accessibilityLabel="Previous image">
                                        <MaterialCommunityIcons name="chevron-up" size={22} color={palette.stone} />
                                    </Pressable>
                                    {thumbnails}
                                    <Pressable style={styles.thumbArrow} onPress={() => setImageIndex(Math.min(images.length - 1, index + 1))} accessibilityLabel="Next image">
                                        <MaterialCommunityIcons name="chevron-down" size={22} color={palette.stone} />
                                    </Pressable>
                                </View>
                            )}
                            <View style={[styles.mainImageCard, { height: mainHeight }]}>
                                <View style={styles.imageActions}>
                                    <Pressable style={styles.imageButton} onPress={toggleWish} accessibilityLabel="Save to wishlist">
                                        <MaterialCommunityIcons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? palette.danger : palette.ink} />
                                    </Pressable>
                                    <Pressable style={styles.imageButton} onPress={handleShare} accessibilityLabel="Share product">
                                        <MaterialCommunityIcons name="share-variant-outline" size={19} color={palette.ink} />
                                    </Pressable>
                                </View>
                                <Animated.View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', opacity: fade }}>
                                    <Image source={{ uri: images[index] }} style={styles.mainImage} resizeMode="contain" />
                                </Animated.View>
                                <View style={styles.counter}>
                                    <Text style={styles.counterText}>{index + 1} / {images.length}</Text>
                                </View>
                                <Pressable style={styles.expandButton} onPress={() => setViewer(true)} accessibilityLabel="View full screen">
                                    <MaterialCommunityIcons name="arrow-expand-all" size={18} color={palette.surface} />
                                </Pressable>
                            </View>
                        </View>
                        {!wide && images.length > 1 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
                                {thumbnails}
                            </ScrollView>
                        )}

                        {/* New arrival banner */}
                        {wide && (
                            <View style={styles.banner}>
                                {bannerProduct ? <Image source={{ uri: bannerProduct.thumbnail }} style={styles.bannerImage} resizeMode="contain" /> : null}
                                <View style={styles.bannerText}>
                                    <Text style={styles.bannerEyebrow}>New Arrival</Text>
                                    <Text style={styles.bannerTitle}>Elevate Your Style</Text>
                                    <Text style={styles.bannerSub}>Timeless fashion. Modern you.</Text>
                                    <Pressable
                                        style={styles.bannerLink}
                                        onPress={() => router.push(`/(app)/(tabs)/search?category=${encodeURIComponent(product.category)}`)}
                                        accessibilityRole="link"
                                    >
                                        <Text style={styles.bannerLinkText}>Explore Collection</Text>
                                        <MaterialCommunityIcons name="arrow-right" size={16} color={palette.forest} />
                                    </Pressable>
                                </View>
                            </View>
                        )}
                    </View>

                    <View style={wide ? styles.rightColumnWide : styles.rightColumn}>
                        <View style={styles.categoryPill}>
                            <Text style={styles.categoryText}>{product.category.replace(/-/g, ' ')}</Text>
                        </View>
                        <View style={styles.titleRow}>
                            <Text style={[styles.title, wide && styles.titleWide]}>{product.title}</Text>
                            <View style={styles.ratingBox}>
                                <MaterialCommunityIcons name="star" size={20} color={palette.star} />
                                <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
                                <Text style={styles.ratingCount}>({product.reviews.length} reviews)</Text>
                            </View>
                        </View>
                        {product.brand ? <Text style={styles.brand2}>by {product.brand}</Text> : null}

                        <View style={styles.priceRow}>
                            <Text style={[styles.price, wide && styles.priceWide]}>${discountedPrice.toFixed(2)}</Text>
                            {product.discountPercentage > 0 && (
                                <>
                                    <Text style={styles.originalPrice}>${product.price.toFixed(2)}</Text>
                                    <View style={styles.discountPill}>
                                        <Text style={styles.discountText}>-{Math.round(product.discountPercentage)}%</Text>
                                    </View>
                                </>
                            )}
                        </View>

                        <Text style={styles.paragraph} numberOfLines={expanded ? undefined : 3}>{product.description}</Text>
                        <Pressable onPress={() => setExpanded((v) => !v)}>
                            <Text style={styles.readMore}>{expanded ? 'Show less' : 'Read more'}</Text>
                        </Pressable>

                        <View style={styles.divider} />
                        <View style={styles.features}>
                            {features.map((f) => (
                                <View key={f.title} style={styles.feature}>
                                    <MaterialCommunityIcons name={f.icon} size={30} color={palette.stone} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.featureTitle}>{f.title}</Text>
                                        <Text style={styles.featureText}>{f.text}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {wide && actions}

                        {/* Specifications / reviews / shipping tabs */}
                        <View style={styles.tabs}>
                            {([['specs', 'Specifications'], ['reviews', `Reviews (${product.reviews.length})`], ['shipping', 'Shipping Info']] as [Tab, string][]).map(([key, label]) => (
                                <Pressable key={key} style={[styles.tab, tab === key && styles.tabActive]} onPress={() => setTab(key)} accessibilityRole="tab">
                                    <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
                                </Pressable>
                            ))}
                        </View>
                        <View style={styles.tabCard}>
                            {tab === 'specs' && tableRows(specs)}
                            {tab === 'shipping' && tableRows(shippingInfo)}
                            {tab === 'reviews' &&
                                (product.reviews.length === 0 ? (
                                    <Text style={[styles.reviewText, { paddingVertical: 12 }]}>No reviews yet.</Text>
                                ) : (
                                    product.reviews.map((r, idx) => (
                                        <View key={`${r.reviewerEmail}-${idx}`} style={styles.review}>
                                            <View style={styles.reviewHeader}>
                                                <Text style={styles.reviewer}>{r.reviewerName}</Text>
                                                <Text style={styles.reviewRating}>{'★'.repeat(Math.max(1, Math.round(r.rating)))}</Text>
                                            </View>
                                            <Text style={styles.reviewText}>{r.comment}</Text>
                                            <Text style={styles.reviewDate}>{new Date(r.date).toLocaleDateString()}</Text>
                                        </View>
                                    ))
                                ))}
                        </View>

                        {!wide && bannerProduct && (
                            <View style={styles.banner}>
                                <Image source={{ uri: bannerProduct.thumbnail }} style={styles.bannerImage} resizeMode="contain" />
                                <View style={styles.bannerText}>
                                    <Text style={styles.bannerEyebrow}>New Arrival</Text>
                                    <Text style={styles.bannerTitle}>Elevate Your Style</Text>
                                    <Text style={styles.bannerSub}>Timeless fashion. Modern you.</Text>
                                    <Pressable
                                        style={styles.bannerLink}
                                        onPress={() => router.push(`/(app)/(tabs)/search?category=${encodeURIComponent(product.category)}`)}
                                        accessibilityRole="link"
                                    >
                                        <Text style={styles.bannerLinkText}>Explore {pretty(product.category)}</Text>
                                        <MaterialCommunityIcons name="arrow-right" size={16} color={palette.forest} />
                                    </Pressable>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Add to cart bar */}
            {!wide && actions}

            {/* Full-screen image viewer */}
            <Modal visible={viewer} transparent animationType="fade" onRequestClose={() => setViewer(false)}>
                <Pressable style={styles.viewer} onPress={() => setViewer(false)}>
                    <Image source={{ uri: images[index] }} style={styles.viewerImage} resizeMode="contain" />
                    <Pressable style={styles.viewerClose} onPress={() => setViewer(false)} accessibilityLabel="Close">
                        <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
                    </Pressable>
                </Pressable>
            </Modal>

            <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={2500}>
                {snack}
            </Snackbar>
        </View>
    );
}

// Styles live in this file so the screen has no extra files to keep in sync
const serif = { fontFamily: typeface.display } as const;

export const styles = themed(() =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: palette.ivory },
        content: { paddingBottom: 140, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
        center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, backgroundColor: palette.ivory },
        errorText: { fontSize: 14, color: palette.danger, textAlign: 'center', marginBottom: spacing.md },

        // Top bar (phone) / navigation bar (wide)
        topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.lg, paddingBottom: spacing.md },
        navBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.lg },
        roundButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
        topTitle: { fontSize: 16, fontWeight: '600', color: palette.ink },
        brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        brandText: { ...serif, fontSize: 18, letterSpacing: 3, color: palette.forest },
        navLinks: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: spacing.xl },
        navLink: { fontSize: 14, color: palette.ink, paddingVertical: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' },
        navLinkActive: { borderBottomColor: palette.forest, fontWeight: '600' },
        navRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
        navSearch: { width: 220, height: 42, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: palette.blush, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
        navSearchText: { fontSize: 13, color: palette.stone },
        cartBadge: { position: 'absolute', top: -5, right: -6, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, backgroundColor: palette.forest, alignItems: 'center', justifyContent: 'center' },
        cartBadgeText: { fontSize: 9, fontWeight: '700', color: palette.surface },

        // Layout
        layout: { gap: spacing.lg },
        layoutWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 44 },
        leftColumn: { width: '100%' },
        leftColumnWide: { width: '52%' },
        rightColumn: { width: '100%' },
        rightColumnWide: { flex: 1 },

        // Gallery
        galleryRow: { flexDirection: 'row', gap: 14 },
        thumbColumn: { width: 92, alignItems: 'center', gap: 10 },
        thumbArrow: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
        thumb: { width: 88, height: 88, borderRadius: radius.lg, backgroundColor: palette.sand, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
        thumbActive: { borderColor: palette.forest },
        thumbImage: { width: '82%', height: '82%' },
        thumbRow: { gap: spacing.sm, paddingTop: spacing.md },
        mainImageCard: { flex: 1, borderRadius: 24, backgroundColor: palette.blush, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
        mainImage: { width: '88%', height: '88%' },
        imageActions: { position: 'absolute', top: spacing.md, right: spacing.md, flexDirection: 'row', gap: spacing.sm, zIndex: 3 },
        imageButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: withAlpha(palette.surface, 0.92), alignItems: 'center', justifyContent: 'center' },
        counter: { position: 'absolute', left: spacing.md, bottom: spacing.md, backgroundColor: 'rgba(36,21,64,0.55)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5, zIndex: 3 },
        counterText: { fontSize: 12, color: palette.surface },
        expandButton: { position: 'absolute', right: spacing.md, bottom: spacing.md, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(36,21,64,0.55)', alignItems: 'center', justifyContent: 'center', zIndex: 3 },
        viewer: { flex: 1, backgroundColor: 'rgba(20,12,36,0.92)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
        viewerImage: { width: '100%', height: '82%' },
        viewerClose: { position: 'absolute', top: 40, right: 24, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },

        // New arrival banner
        banner: { marginTop: spacing.lg, minHeight: 190, borderRadius: 24, backgroundColor: palette.accentSoft, overflow: 'hidden', justifyContent: 'center' },
        bannerText: { padding: spacing.lg, width: '60%' },
        bannerEyebrow: { fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: palette.stone, marginBottom: 6 },
        bannerTitle: { ...serif, fontSize: 30, lineHeight: 36, color: palette.forest },
        bannerSub: { fontSize: 14, color: palette.stone, marginTop: 6 },
        bannerLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: spacing.md, paddingBottom: 3, borderBottomWidth: 1.5, borderBottomColor: palette.forest },
        bannerLinkText: { fontSize: 14, fontWeight: '600', color: palette.forest },
        bannerImage: { position: 'absolute', right: 6, bottom: 0, width: '42%', height: '92%' },

        // Info
        categoryPill: { alignSelf: 'flex-start', backgroundColor: palette.accentSoft, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 6 },
        categoryText: { fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: '600', color: palette.forest },
        titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md, marginTop: spacing.md },
        title: { ...serif, flex: 1, fontSize: 30, lineHeight: 36, color: palette.forest },
        titleWide: { fontSize: 46, lineHeight: 52 },
        ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 10 },
        ratingText: { fontSize: 17, fontWeight: '600', color: palette.ink },
        ratingCount: { fontSize: 13, color: palette.stone },
        brand2: { fontSize: 13, color: palette.stone, marginTop: 4 },
        priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md, flexWrap: 'wrap' },
        price: { ...serif, fontSize: 34, color: palette.ink },
        priceWide: { fontSize: 46 },
        originalPrice: { fontSize: 20, color: palette.mist, textDecorationLine: 'line-through' },
        discountPill: { backgroundColor: palette.mint, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 6 },
        discountText: { fontSize: 15, fontWeight: '700', color: palette.forest },
        paragraph: { fontSize: 15, color: palette.ink, lineHeight: 25, marginTop: spacing.lg },
        readMore: { fontSize: 14, fontWeight: '600', color: palette.forest, marginTop: 4 },
        divider: { height: 1, backgroundColor: palette.line, marginTop: spacing.lg },

        // Service features
        features: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: spacing.lg, gap: spacing.md },
        feature: { flexDirection: 'row', alignItems: 'center', gap: 10, flexGrow: 1, flexBasis: '30%', minWidth: 150 },
        featureTitle: { fontSize: 13, fontWeight: '600', color: palette.ink },
        featureText: { fontSize: 12, color: palette.stone, marginTop: 1 },

        // Add to cart (fixed bar on phones, inline block on wide screens)
        actionsInline: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
        bottomBar: {
            position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
            paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.lg, backgroundColor: palette.ivory,
            borderTopWidth: 1, borderTopColor: palette.line,
        },
        barPrice: { minWidth: 72 },
        barOriginal: { fontSize: 12, color: palette.mist, textDecorationLine: 'line-through' },
        barTotal: { ...serif, fontSize: 20, color: palette.ink },
        qty: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: palette.line, borderRadius: radius.pill, backgroundColor: palette.surface },
        qtyButton: { width: 38, height: 46, alignItems: 'center', justifyContent: 'center' },
        qtyText: { fontSize: 15, fontWeight: '600', minWidth: 24, textAlign: 'center', color: palette.ink },
        addButton: { flex: 1, height: 52, borderRadius: radius.pill, backgroundColor: palette.forest, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
        addButtonDisabled: { backgroundColor: palette.mist },
        addButtonText: { ...serif, fontSize: 18, color: palette.surface },
        heartButton: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' },

        // Tabs
        tabs: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.lg, borderBottomWidth: 1, borderBottomColor: palette.line },
        tab: { paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
        tabActive: { borderBottomColor: palette.forest },
        tabText: { fontSize: 15, color: palette.stone },
        tabTextActive: { color: palette.forest, fontWeight: '700' },
        tabCard: { marginTop: spacing.md, backgroundColor: palette.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
        specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
        specRowLast: { borderBottomWidth: 0 },
        specLabel: { fontSize: 14, color: palette.stone, flex: 1 },
        specValue: { fontSize: 14, color: palette.ink, flex: 1.4, textAlign: 'left' },
        review: { paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
        reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
        reviewer: { fontSize: 14, fontWeight: '600', color: palette.ink },
        reviewRating: { fontSize: 12, color: palette.star },
        reviewText: { fontSize: 14, color: palette.stone, lineHeight: 21 },
        reviewDate: { fontSize: 12, color: palette.mist, marginTop: 6 },
    })
);