/**
 * STYLE PASSPORT - the premium style-identity dashboard shown on Profile.
 *
 * It reads real shopping activity (views, wishlist, cart, orders and the quiz
 * personality) and renders a personal identity: a personality, confidence,
 * signature stats, most-loved categories and aesthetics. Shoppers can nudge
 * their identity with the Customize dialog.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppDialog } from '@/components/AppDialog';
import { palette, radius, spacing, themed, typeface, withAlpha } from '@/constants/theme';
import { PersonalityKey } from '@/types/rewards';
import {
    EMPTY_STYLEPRINT_PREFS,
    STYLE_BUDGET_OPTIONS,
    STYLE_CATEGORIES,
    STYLE_VIBE_OPTIONS,
    StyleActivityEvent,
    StyleBudget,
    StyleCartProduct,
    StyleCategoryKey,
    StyleOrderLike,
    StylePrintPrefs,
    StyleProduct,
    StyleVibe,
    buildStylePrint,
    loadStyleActivity,
    loadStylePrefs,
    saveStylePrefs,
} from '@/services/styleprint';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const CREAM = '#FBF7FF';
const CREAM_SOFT = 'rgba(251,247,255,0.74)';
const CARD_BG = '#33195F';
const GOLD = '#F2C45A';
const BAR_COLORS = ['#F2C45A', '#E5788D', '#B79CE8'];

const CATEGORY_ICONS: Record<StyleCategoryKey, IconName> = {
    beauty: 'lipstick',
    women: 'hanger',
    men: 'tshirt-crew-outline',
    jewellery: 'diamond-stone',
    watches: 'watch',
    tech: 'laptop',
    home: 'sofa-outline',
    grocery: 'basket-outline',
    sport: 'basketball',
    auto: 'motorbike',
    eyewear: 'sunglasses',
    other: 'shape-outline',
};

const PERSONALITY_ICONS: Record<string, IconName> = {
    minimalist: 'flower-tulip-outline',
    luxury: 'crown-outline',
    streetwear: 'skateboard',
    tech: 'laptop',
    fashion: 'hanger',
    budget: 'tag-outline',
    explorer: 'compass-outline',
};

interface StylePrintProps {
    userId?: number;
    wishlist: StyleProduct[];
    cart: StyleCartProduct[];
    orders: StyleOrderLike[];
    quizPersonality?: PersonalityKey | null;
    /** Bumped by the Profile screen whenever it regains focus */
    refreshKey?: number;
    onExplore?: () => void;
}

export function StylePrint({ userId, wishlist, cart, orders, quizPersonality, refreshKey = 0, onExplore }: StylePrintProps) {
    const [collapsed, setCollapsed] = useState(true);
    const [activity, setActivity] = useState<StyleActivityEvent[]>([]);
    const [prefs, setPrefs] = useState<StylePrintPrefs>({ ...EMPTY_STYLEPRINT_PREFS, favoriteCategories: [] });
    const [ready, setReady] = useState(false);
    const [customizeOpen, setCustomizeOpen] = useState(false);
    const [draft, setDraft] = useState<StylePrintPrefs>({ ...EMPTY_STYLEPRINT_PREFS, favoriteCategories: [] });
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        let active = true;
        if (userId === undefined) {
            setActivity([]);
            setPrefs({ ...EMPTY_STYLEPRINT_PREFS, favoriteCategories: [] });
            setReady(true);
            return () => {
                active = false;
            };
        }
        Promise.all([loadStyleActivity(userId), loadStylePrefs(userId)])
            .then(([events, saved]) => {
                if (!active) return;
                setActivity(events);
                setPrefs(saved);
                setReady(true);
            })
            .catch(() => {
                if (active) setReady(true);
            });
        return () => {
            active = false;
        };
    }, [userId, refreshKey]);

    const profile = useMemo(
        () => buildStylePrint({ activity, prefs, wishlist, cart, orders, quizPersonality }),
        [activity, prefs, wishlist, cart, orders, quizPersonality]
    );

    const openCustomize = () => {
        setDraft({ ...prefs, favoriteCategories: [...prefs.favoriteCategories] });
        setCustomizeOpen(true);
    };

    const toggleVibe = (key: StyleVibe) =>
        setDraft((current) => ({ ...current, vibe: current.vibe === key ? null : key }));

    const toggleBudget = (key: StyleBudget) =>
        setDraft((current) => ({ ...current, budget: current.budget === key ? null : key }));

    const toggleCategory = (key: StyleCategoryKey) =>
        setDraft((current) => {
            const has = current.favoriteCategories.includes(key);
            const favoriteCategories = has
                ? current.favoriteCategories.filter((k) => k !== key)
                : current.favoriteCategories.length >= 3
                  ? current.favoriteCategories
                  : [...current.favoriteCategories, key];
            return { ...current, favoriteCategories };
        });

    const applyPrefs = useCallback(
        async (next: StylePrintPrefs) => {
            setSaving(true);
            try {
                if (userId !== undefined) await saveStylePrefs(userId, next);
                setPrefs(next);
                setCustomizeOpen(false);
            } finally {
                setSaving(false);
            }
        },
        [userId]
    );

    const resetPrefs = () => {
        const empty: StylePrintPrefs = { ...EMPTY_STYLEPRINT_PREFS, favoriteCategories: [] };
        setDraft(empty);
        void applyPrefs(empty);
    };

    const topCategory = profile.topCategories[0];
    const topBrand = profile.brands[0];
    const personalityIcon = PERSONALITY_ICONS[profile.personality.key] ?? 'fingerprint';
    const steps = [
        { label: 'Browse', done: profile.viewCount > 0 },
        { label: 'Save', done: profile.wishCount > 0 },
        { label: 'Add to cart', done: profile.cartCount > 0 },
        { label: 'Order', done: profile.orderCount > 0 || profile.purchaseCount > 0 },
    ];

    const dashboard = !ready ? (
        <View style={styles.loadingCard}>
            <ActivityIndicator color={GOLD} />
            <Text style={styles.loadingText}>Reading your style…</Text>
        </View>
    ) : (
        <View style={styles.card}>
            <View style={styles.glowA} />
            <View style={styles.glowB} />

            <Pressable
                style={styles.headRow}
                onPress={() => setCollapsed(true)}
                accessibilityRole="button"
                accessibilityLabel="Collapse STYLE PASSPORT"
                accessibilityState={{ expanded: true }}
            >
                <View style={styles.mark}>
                    <MaterialCommunityIcons name={personalityIcon} size={24} color={GOLD} />
                </View>
                <View style={styles.headText}>
                    <Text style={styles.kicker}>STYLE PASSPORT</Text>
                    <Text style={styles.headNote}>Personal shopping identity</Text>
                </View>
                <View style={styles.confidenceBox}>
                    <Text style={styles.confidenceValue}>{profile.confidence}%</Text>
                    <Text style={styles.confidenceLabel}>match</Text>
                </View>
                <MaterialCommunityIcons name="chevron-up" size={22} color={GOLD} />
            </Pressable>

            <Text style={styles.title}>{profile.personality.title}</Text>
            <Text style={styles.tagline}>{profile.personality.tagline}</Text>
            <Text style={styles.summary}>{profile.summary}</Text>

            <View style={styles.tagRow}>
                {profile.tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.confidenceTrack}>
                <View style={[styles.confidenceFill, { width: `${Math.max(4, profile.confidence)}%` }]} />
            </View>

            {profile.isLearning ? (
                <View style={styles.learning}>
                    <View style={styles.learningHead}>
                        <MaterialCommunityIcons name="auto-fix" size={18} color={GOLD} />
                        <Text style={styles.learningTitle}>Your STYLE PASSPORT is learning</Text>
                    </View>
                    <Text style={styles.learningText}>A few signals unlock your full shopping identity.</Text>
                    <View style={styles.stepsRow}>
                        {steps.map((step) => (
                            <View key={step.label} style={[styles.stepChip, step.done && styles.stepChipDone]}>
                                <MaterialCommunityIcons
                                    name={step.done ? 'check-circle' : 'circle-outline'}
                                    size={13}
                                    color={step.done ? GOLD : CREAM_SOFT}
                                />
                                <Text style={[styles.stepText, step.done && styles.stepTextDone]}>{step.label}</Text>
                            </View>
                        ))}
                    </View>
                    {onExplore ? (
                        <Pressable style={styles.exploreButton} onPress={onExplore} accessibilityRole="button">
                            <Text style={styles.exploreText}>Explore products</Text>
                            <MaterialCommunityIcons name="arrow-right" size={16} color={CARD_BG} />
                        </Pressable>
                    ) : null}
                </View>
            ) : (
                <>
                    <View style={styles.panel}>
                        <Text style={styles.panelKicker}>YOUR SIGNATURE</Text>
                        <View style={styles.signatureGrid}>
                            <View style={styles.signatureItem}>
                                <View style={styles.signatureIcon}>
                                    <MaterialCommunityIcons
                                        name={topCategory ? CATEGORY_ICONS[topCategory.key] : 'shape-outline'}
                                        size={18}
                                        color={GOLD}
                                    />
                                </View>
                                <Text style={styles.signatureLabel}>Top category</Text>
                                <Text style={styles.signatureValue} numberOfLines={1}>
                                    {topCategory?.label ?? 'Still learning'}
                                </Text>
                                <Text style={styles.signatureMeta}>
                                    {topCategory ? `${Math.round(topCategory.share * 100)}% of your taste` : 'Browse to begin'}
                                </Text>
                            </View>

                            <View style={styles.signatureItem}>
                                <View style={styles.signatureIcon}>
                                    <MaterialCommunityIcons name="tag-heart-outline" size={18} color={GOLD} />
                                </View>
                                <Text style={styles.signatureLabel}>Favourite brand</Text>
                                <Text style={styles.signatureValue} numberOfLines={1}>
                                    {topBrand?.name ?? 'Open mix'}
                                </Text>
                                <Text style={styles.signatureMeta}>
                                    {profile.brands.length > 0 ? `${profile.brands.length} brands in rotation` : 'Save a branded piece'}
                                </Text>
                            </View>

                            <View style={styles.signatureItem}>
                                <View style={styles.signatureIcon}>
                                    <MaterialCommunityIcons name="palette-outline" size={18} color={GOLD} />
                                </View>
                                <Text style={styles.signatureLabel}>Palette</Text>
                                <View style={styles.swatchRow}>
                                    {profile.palette.map((color) => (
                                        <View key={`${color.name}-${color.hex}`} style={[styles.swatch, { backgroundColor: color.hex }]} />
                                    ))}
                                </View>
                                <Text style={styles.signatureMeta} numberOfLines={1}>
                                    {profile.palette.slice(0, 3).map((color) => color.name).join(' · ')}
                                </Text>
                            </View>

                            <View style={styles.signatureItem}>
                                <View style={styles.signatureIcon}>
                                    <MaterialCommunityIcons name="cash-multiple" size={18} color={GOLD} />
                                </View>
                                <Text style={styles.signatureLabel}>Price comfort</Text>
                                <Text style={styles.signatureValue} numberOfLines={1}>
                                    {profile.price.label}
                                </Text>
                                <Text style={styles.signatureMeta}>
                                    {profile.price.average > 0 ? `Avg $${profile.price.average.toFixed(0)}` : 'No price data yet'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {profile.topCategories.length > 0 ? (
                        <View style={styles.barsSection}>
                            <Text style={styles.panelKicker}>MOST-LOVED CATEGORIES</Text>
                            {profile.topCategories.slice(0, 3).map((category, index) => (
                                <View key={category.key} style={styles.barRow}>
                                    <View style={styles.barLabelRow}>
                                        <MaterialCommunityIcons
                                            name={CATEGORY_ICONS[category.key]}
                                            size={14}
                                            color={CREAM_SOFT}
                                        />
                                        <Text style={styles.barLabel}>{category.label}</Text>
                                        <Text style={styles.barValue}>{Math.round(category.share * 100)}%</Text>
                                    </View>
                                    <View style={styles.barTrack}>
                                        <View
                                            style={[
                                                styles.barFill,
                                                {
                                                    width: `${Math.max(6, Math.round(category.share * 100))}%`,
                                                    backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                                                },
                                            ]}
                                        />
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : null}

                    {profile.aesthetics.length > 0 ? (
                        <View style={styles.aestheticSection}>
                            <Text style={styles.panelKicker}>YOUR AESTHETICS</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.aestheticRow}
                            >
                                {profile.aesthetics.map((aesthetic) => (
                                    <View key={aesthetic.key} style={styles.aestheticCard}>
                                        <View style={styles.aestheticIcon}>
                                            <MaterialCommunityIcons
                                                name={CATEGORY_ICONS[aesthetic.key]}
                                                size={18}
                                                color={GOLD}
                                            />
                                        </View>
                                        <Text style={styles.aestheticTitle}>{aesthetic.title}</Text>
                                        <Text style={styles.aestheticNote} numberOfLines={2}>
                                            {aesthetic.note}
                                        </Text>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    ) : null}
                </>
            )}

            <View style={styles.footer}>
                <View style={styles.footerInfo}>
                    <View style={styles.liveDot} />
                    <Text style={styles.footerText}>
                        {profile.signalCount > 0
                            ? `${profile.signalCount} signals · updates automatically`
                            : 'Updates automatically as you shop'}
                    </Text>
                </View>
                <Pressable style={styles.customizeButton} onPress={openCustomize} accessibilityRole="button">
                    <MaterialCommunityIcons name="tune-variant" size={15} color={GOLD} />
                    <Text style={styles.customizeText}>Customize</Text>
                </Pressable>
            </View>

            <AppDialog
                visible={customizeOpen}
                onDismiss={() => setCustomizeOpen(false)}
                icon="tune-variant"
                eyebrow="Your identity"
                title="Customize STYLE PASSPORT"
                subtitle="Nudge your style — real activity still shapes it."
                actions={[
                    { label: 'Reset', tone: 'danger', onPress: resetPrefs, disabled: saving },
                    { label: 'Save', onPress: () => void applyPrefs(draft), loading: saving, disabled: saving, icon: 'check' },
                ]}
                footerNote="STYLE PASSPORT updates automatically as you browse, save and shop."
            >
                <Text style={styles.dialogLabel}>Your vibe</Text>
                <View style={styles.chipWrap}>
                    {STYLE_VIBE_OPTIONS.map((vibe) => {
                        const selected = draft.vibe === vibe.key;
                        return (
                            <Pressable
                                key={vibe.key}
                                onPress={() => toggleVibe(vibe.key)}
                                style={[styles.chip, selected && styles.chipSelected]}
                                accessibilityRole="button"
                                accessibilityState={{ selected }}
                            >
                                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{vibe.label}</Text>
                            </Pressable>
                        );
                    })}
                </View>

                <Text style={styles.dialogLabel}>Price comfort</Text>
                <View style={styles.chipWrap}>
                    {STYLE_BUDGET_OPTIONS.map((budget) => {
                        const selected = draft.budget === budget.key;
                        return (
                            <Pressable
                                key={budget.key}
                                onPress={() => toggleBudget(budget.key)}
                                style={[styles.chip, selected && styles.chipSelected]}
                                accessibilityRole="button"
                                accessibilityState={{ selected }}
                            >
                                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{budget.label}</Text>
                            </Pressable>
                        );
                    })}
                </View>

                <Text style={styles.dialogLabel}>Favourite categories (up to 3)</Text>
                <View style={styles.chipWrap}>
                    {STYLE_CATEGORIES.filter((category) => category.key !== 'other').map((category) => {
                        const selected = draft.favoriteCategories.includes(category.key);
                        return (
                            <Pressable
                                key={category.key}
                                onPress={() => toggleCategory(category.key)}
                                style={[styles.chip, selected && styles.chipSelected]}
                                accessibilityRole="button"
                                accessibilityState={{ selected }}
                            >
                                <MaterialCommunityIcons
                                    name={CATEGORY_ICONS[category.key]}
                                    size={13}
                                    color={selected ? palette.surface : palette.stone}
                                />
                                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{category.label}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            </AppDialog>
        </View>
    );

    if (collapsed) {
        return (
            <Pressable
                style={styles.launchButton}
                onPress={() => setCollapsed(false)}
                accessibilityRole="button"
                accessibilityLabel={`Open STYLE PASSPORT, ${profile.personality.title}, ${profile.confidence}% match`}
                accessibilityState={{ expanded: false }}
            >
                <View style={styles.launchGlow} />
                <View style={styles.launchRow}>
                    <View style={styles.mark}>
                        <MaterialCommunityIcons name={personalityIcon} size={24} color={GOLD} />
                    </View>
                    <View style={styles.headText}>
                        <Text style={styles.kicker}>STYLE PASSPORT</Text>
                        <Text style={styles.launchTitle} numberOfLines={1}>{profile.personality.title}</Text>
                        <Text style={styles.launchNote} numberOfLines={1}>
                            {profile.isLearning ? 'Tap to view your style identity' : `${profile.confidence}% match · Tap to view dashboard`}
                        </Text>
                    </View>
                    <View style={styles.launchChevron}>
                        <MaterialCommunityIcons name="chevron-down" size={22} color={GOLD} />
                    </View>
                </View>
            </Pressable>
        );
    }

    return dashboard;
}

const styles = themed(() =>
    StyleSheet.create({
        loadingCard: {
            backgroundColor: CARD_BG,
            borderRadius: 26,
            paddingVertical: spacing.xl,
            alignItems: 'center',
            gap: spacing.sm,
        },
        loadingText: { color: CREAM_SOFT, fontSize: 12, letterSpacing: 1 },

        launchButton: {
            backgroundColor: CARD_BG,
            borderRadius: 22,
            padding: spacing.md,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: withAlpha(GOLD, 0.24),
        },
        launchGlow: {
            position: 'absolute',
            right: -30,
            top: -40,
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: 'rgba(242,196,90,0.12)',
        },
        launchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
        launchTitle: { fontFamily: typeface.display, fontSize: 20, lineHeight: 24, color: CREAM, marginTop: 2 },
        launchNote: { fontSize: 11, color: CREAM_SOFT, marginTop: 2 },
        launchChevron: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(242,196,90,0.14)',
            alignItems: 'center',
            justifyContent: 'center',
        },

        card: {
            backgroundColor: CARD_BG,
            borderRadius: 26,
            padding: spacing.lg,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: withAlpha(GOLD, 0.24),
        },
        glowA: {
            position: 'absolute',
            right: -70,
            top: -80,
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: 'rgba(255,255,255,0.07)',
        },
        glowB: {
            position: 'absolute',
            left: -80,
            bottom: -110,
            width: 240,
            height: 240,
            borderRadius: 120,
            backgroundColor: 'rgba(242,196,90,0.1)',
        },

        headRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
        mark: {
            width: 48,
            height: 48,
            borderRadius: 16,
            backgroundColor: 'rgba(242,196,90,0.16)',
            borderWidth: 1,
            borderColor: 'rgba(242,196,90,0.42)',
            alignItems: 'center',
            justifyContent: 'center',
        },
        headText: { flex: 1, minWidth: 0 },
        kicker: { fontSize: 10, letterSpacing: 3, fontWeight: '800', color: GOLD },
        headNote: { fontSize: 10.5, color: CREAM_SOFT, marginTop: 2 },
        title: { fontFamily: typeface.display, fontSize: 25, lineHeight: 31, color: CREAM, marginTop: spacing.md },
        confidenceBox: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 10,
            paddingVertical: 7,
            borderRadius: 14,
            backgroundColor: 'rgba(251,247,255,0.1)',
            borderWidth: 1,
            borderColor: 'rgba(251,247,255,0.18)',
        },
        confidenceValue: { fontSize: 15, fontWeight: '800', color: CREAM },
        confidenceLabel: { fontSize: 8, letterSpacing: 1.4, textTransform: 'uppercase', color: CREAM_SOFT, marginTop: 1 },

        tagline: { fontSize: 13, fontWeight: '600', color: CREAM, marginTop: 4 },
        summary: { fontSize: 12.5, lineHeight: 19, color: CREAM_SOFT, marginTop: 6 },

        tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md },
        tag: {
            paddingHorizontal: 10,
            height: 26,
            borderRadius: radius.pill,
            backgroundColor: 'rgba(242,196,90,0.14)',
            borderWidth: 1,
            borderColor: 'rgba(242,196,90,0.34)',
            alignItems: 'center',
            justifyContent: 'center',
        },
        tagText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3, color: GOLD },

        confidenceTrack: {
            height: 5,
            borderRadius: 3,
            backgroundColor: 'rgba(251,247,255,0.14)',
            overflow: 'hidden',
            marginTop: spacing.md,
        },
        confidenceFill: { height: '100%', borderRadius: 3, backgroundColor: GOLD },

        panel: {
            marginTop: spacing.lg,
            padding: spacing.md,
            borderRadius: 18,
            backgroundColor: 'rgba(251,247,255,0.07)',
            borderWidth: 1,
            borderColor: 'rgba(251,247,255,0.12)',
        },
        panelKicker: { fontSize: 9, letterSpacing: 2, fontWeight: '800', color: CREAM_SOFT, marginBottom: 10 },
        signatureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
        signatureItem: {
            flexBasis: '44%',
            flexGrow: 1,
            padding: 11,
            borderRadius: 14,
            backgroundColor: 'rgba(251,247,255,0.06)',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: 'rgba(251,247,255,0.1)',
        },
        signatureIcon: {
            width: 30,
            height: 30,
            borderRadius: 10,
            backgroundColor: 'rgba(242,196,90,0.16)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 7,
        },
        signatureLabel: { fontSize: 8.5, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '700', color: CREAM_SOFT },
        signatureValue: { fontSize: 13, fontWeight: '800', color: CREAM, marginTop: 3 },
        signatureMeta: { fontSize: 9.5, color: CREAM_SOFT, marginTop: 2 },
        swatchRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
        swatch: {
            width: 15,
            height: 15,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.42)',
        },

        barsSection: { marginTop: spacing.lg },
        barRow: { marginBottom: 9 },
        barLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
        barLabel: { flex: 1, fontSize: 11.5, fontWeight: '600', color: CREAM },
        barValue: { fontSize: 10, fontWeight: '700', color: CREAM_SOFT },
        barTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(251,247,255,0.14)', overflow: 'hidden' },
        barFill: { height: '100%', borderRadius: 3 },

        aestheticSection: { marginTop: spacing.lg },
        aestheticRow: { gap: 10, paddingRight: spacing.md },
        aestheticCard: {
            width: 142,
            padding: 12,
            borderRadius: 16,
            backgroundColor: 'rgba(251,247,255,0.07)',
            borderWidth: 1,
            borderColor: 'rgba(251,247,255,0.12)',
        },
        aestheticIcon: {
            width: 32,
            height: 32,
            borderRadius: 11,
            backgroundColor: 'rgba(242,196,90,0.16)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
        },
        aestheticTitle: { fontSize: 12.5, fontWeight: '800', color: CREAM },
        aestheticNote: { fontSize: 10, lineHeight: 14, color: CREAM_SOFT, marginTop: 3 },

        learning: {
            marginTop: spacing.lg,
            padding: spacing.md,
            borderRadius: 18,
            backgroundColor: 'rgba(251,247,255,0.07)',
            borderWidth: 1,
            borderColor: 'rgba(251,247,255,0.12)',
        },
        learningHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
        learningTitle: { flex: 1, fontSize: 13, fontWeight: '800', color: CREAM },
        learningText: { fontSize: 11.5, lineHeight: 17, color: CREAM_SOFT, marginTop: 5 },
        stepsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
        stepChip: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 8,
            height: 24,
            borderRadius: radius.pill,
            backgroundColor: 'rgba(251,247,255,0.08)',
        },
        stepChipDone: { backgroundColor: 'rgba(242,196,90,0.16)' },
        stepText: { fontSize: 9.5, fontWeight: '600', color: CREAM_SOFT },
        stepTextDone: { color: CREAM },
        exploreButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: spacing.md,
            height: 40,
            borderRadius: radius.pill,
            backgroundColor: GOLD,
        },
        exploreText: { fontSize: 12, fontWeight: '800', color: CARD_BG },

        footer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            marginTop: spacing.lg,
            paddingTop: spacing.md,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: 'rgba(251,247,255,0.16)',
        },
        footerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
        liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#7BC49A' },
        footerText: { flex: 1, fontSize: 9.5, color: CREAM_SOFT },
        customizeButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 12,
            height: 34,
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: 'rgba(242,196,90,0.5)',
            backgroundColor: 'rgba(242,196,90,0.12)',
        },
        customizeText: { fontSize: 11, fontWeight: '800', color: GOLD },

        dialogLabel: {
            fontSize: 10,
            letterSpacing: 1.8,
            textTransform: 'uppercase',
            fontWeight: '800',
            color: palette.stone,
            marginTop: spacing.md,
            marginBottom: spacing.sm,
        },
        chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
        chip: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 11,
            height: 32,
            borderRadius: radius.pill,
            backgroundColor: palette.ivory,
            borderWidth: 1,
            borderColor: palette.line,
        },
        chipSelected: { backgroundColor: palette.forest, borderColor: palette.forest },
        chipText: { fontSize: 11.5, fontWeight: '700', color: palette.ink },
        chipTextSelected: { color: palette.surface },
    })
);
