/**
 * CategoryBento - bento-style category tiles with the product image on every tile
 * Tiles span several grid cells (for example 2x2 or 2x1) and are packed into the grid
 * left-to-right, top-to-bottom, so different sizes fit together without gaps.
 * Used for "Popular category" in Search (2 columns) and on the Categories page (4 columns).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette, spacing, themed, typeface, withAlpha } from '@/constants/theme';

export type BentoTone = 'default' | 'mint' | 'gold';

export interface BentoCategory {
    name: string;
    count: number;
    image: string;
}

export interface BentoSpec {
    /** Width in grid columns */
    w: number;
    /** Height in grid rows */
    h: number;
    tone?: BentoTone;
}

interface BentoFooter {
    title: string;
    subtitle: string;
    span: BentoSpec;
    onPress: () => void;
}

interface CategoryBentoProps {
    items: BentoCategory[];
    /** One spec per item (same order) */
    specs: BentoSpec[];
    columns: number;
    /** Width available for the grid */
    width: number;
    /** Height of one grid row */
    unit: number;
    gap?: number;
    /** Show "N products" under the name */
    showCount?: boolean;
    /** Serif names (Popular category) or small bold names (Categories page) */
    serifNames?: boolean;
    /** An extra closing tile, e.g. "All categories" */
    footer?: BentoFooter;
    onOpen: (name: string) => void;
}

interface Placed {
    r: number;
    c: number;
}

const pretty = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');

// Find the first free spot (row by row) where every tile fits
function pack(specs: BentoSpec[], columns: number): Placed[] {
    const taken = new Set<string>();
    const key = (r: number, c: number): string => `${r}:${c}`;
    return specs.map((spec) => {
        const w = Math.min(spec.w, columns);
        for (let r = 0; r < specs.length * 4 + 4; r += 1) {
            for (let c = 0; c + w <= columns; c += 1) {
                let free = true;
                for (let rr = r; rr < r + spec.h && free; rr += 1) {
                    for (let cc = c; cc < c + w; cc += 1) {
                        if (taken.has(key(rr, cc))) {
                            free = false;
                            break;
                        }
                    }
                }
                if (free) {
                    for (let rr = r; rr < r + spec.h; rr += 1) for (let cc = c; cc < c + w; cc += 1) taken.add(key(rr, cc));
                    return { r, c };
                }
            }
        }
        return { r: 0, c: 0 };
    });
}

// react-native-web has no native animated module, so drive the animation with JS there
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface TileBox {
    left: number;
    top: number;
    width: number;
    height: number;
}

interface AnimatedTileProps {
    index: number;
    box: TileBox;
    tone: BentoTone;
    onPress: () => void;
    accessibilityLabel: string;
    /** Footer tiles get a centered, bolder treatment instead of the item backdrop */
    variant?: 'item' | 'footer';
    /** Smaller footer tile: trim the decorations and typography */
    compact?: boolean;
    children: React.ReactNode;
}

/**
 * One bento tile: fades and rises into place (staggered by index), then reacts to
 * hover (web) and press with a small scale. The scale lives on an inner view so the
 * entrance transform and the touch feedback never fight over the same value.
 */
function AnimatedTile({ index, box, tone, onPress, accessibilityLabel, variant = 'item', compact = false, children }: AnimatedTileProps) {
    const entrance = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;
    const hovered = useRef(false);

    useEffect(() => {
        const animation = Animated.timing(entrance, {
            toValue: 1,
            duration: 420,
            delay: Math.min(index, 12) * 55,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: USE_NATIVE_DRIVER,
        });
        animation.start();
        return () => animation.stop();
    }, [entrance, index]);

    const animateScale = (toValue: number, spring = false) => {
        if (spring) {
            Animated.spring(scale, {
                toValue,
                speed: 28,
                bounciness: 0,
                useNativeDriver: USE_NATIVE_DRIVER,
            }).start();
        } else {
            Animated.timing(scale, {
                toValue,
                duration: 150,
                easing: Easing.out(Easing.quad),
                useNativeDriver: USE_NATIVE_DRIVER,
            }).start();
        }
    };

    // Give every tile its own accent glow and sparkle colour
    const accents = [styles.accentRose, styles.accentGold, styles.accentViolet, styles.accentMint, styles.accentBlush];
    const accent = accents[index % accents.length];
    const sparkColors = [palette.gold, palette.rose, palette.accent, palette.success, palette.gold];
    const sparkColor = sparkColors[index % sparkColors.length];

    return (
        <Animated.View
            style={[
                styles.tileBox,
                box,
                {
                    opacity: entrance,
                    transform: [
                        { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
                        { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                    ],
                },
            ]}
        >
            <Pressable
                style={styles.pressable}
                onPress={onPress}
                onPressIn={() => animateScale(0.965, true)}
                onPressOut={() => animateScale(hovered.current ? 1.02 : 1, true)}
                onHoverIn={() => {
                    hovered.current = true;
                    animateScale(1.02);
                }}
                onHoverOut={() => {
                    hovered.current = false;
                    animateScale(1);
                }}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
            >
                <Animated.View
                    style={[
                        styles.tile,
                        tone === 'mint' && styles.mint,
                        tone === 'gold' && styles.gold,
                        { transform: [{ scale }] },
                    ]}
                >
                    {variant === 'footer' ? (
                        <View style={styles.footerBackdrop} pointerEvents="none">
                            {!compact ? (
                                <>
                                    <View style={styles.footerGlow} />
                                    <View style={styles.footerRing} />
                                    <View style={styles.footerRingInner} />
                                </>
                            ) : null}
                            <MaterialCommunityIcons name="star-four-points" size={16} color="rgba(42,21,80,0.4)" style={styles.footerSpark} />
                        </View>
                    ) : (
                        <View style={styles.backdrop} pointerEvents="none">
                            <View style={styles.bgBlob} />
                            <View style={[styles.bgBlob2, accent]} />
                            <View style={styles.bgRing} />
                            <View style={styles.bgRingInner} />
                            <View style={styles.bgWave} />
                            <MaterialCommunityIcons name="star-four-points" size={15} color={sparkColor} style={styles.bgSpark} />
                        </View>
                    )}
                    {children}
                </Animated.View>
            </Pressable>
        </Animated.View>
    );
}

export function CategoryBento({ items, specs, columns, width, unit, gap = 10, showCount = true, serifNames, footer, onOpen }: CategoryBentoProps) {
    // Use the real width of the container (not the window), so tiles never overflow it
    const [measured, setMeasured] = useState(0);
    const usable = measured > 0 ? measured : width;
    const colW = (usable - gap * (columns - 1)) / columns;
    const allSpecs = footer ? [...specs.slice(0, items.length), footer.span] : specs.slice(0, items.length);
    const placed = pack(allSpecs, columns);
    const rows = placed.reduce((m, p, i) => Math.max(m, p.r + allSpecs[i].h), 0);
    const boxFor = (i: number) => {
        const s = allSpecs[i];
        const w = Math.min(s.w, columns);
        return {
            left: placed[i].c * (colW + gap),
            top: placed[i].r * (unit + gap),
            width: w * colW + (w - 1) * gap,
            height: s.h * unit + (s.h - 1) * gap,
        };
    };
    const footerBox = footer ? boxFor(allSpecs.length - 1) : null;
    const footerCompact = footerBox ? footerBox.height < 130 || footerBox.width < 280 : false;

    return (
        <View style={{ width: '100%' }} onLayout={(e: LayoutChangeEvent) => setMeasured(Math.floor(e.nativeEvent.layout.width))}>
            <View style={{ height: rows * unit + Math.max(0, rows - 1) * gap }}>
                {items.map((item, i) => {
                    const spec = allSpecs[i];
                    const box = boxFor(i);
                    const big = spec.w * spec.h >= 4;
                    const tone = spec.tone ?? 'default';
                    const onTone = tone !== 'default';
                    return (
                        <AnimatedTile
                            key={item.name}
                            index={i}
                            box={box}
                            tone={tone}
                            onPress={() => onOpen(item.name)}
                            accessibilityLabel={`${pretty(item.name)}, ${item.count} products`}
                        >
                            {item.image ? (
                                <Image source={{ uri: item.image }} style={[styles.image, { bottom: big ? 76 : showCount ? 54 : 46 }]} resizeMode="contain" />
                            ) : null}
                            <View style={[styles.label, onTone && styles.labelOnTone]}>
                                <Text
                                    style={[
                                        serifNames ? styles.nameSerif : styles.nameSans,
                                        big && (serifNames ? styles.nameSerifBig : styles.nameSansBig),
                                        onTone && styles.onTone,
                                    ]}
                                    numberOfLines={1}
                                >
                                    {pretty(item.name)}
                                </Text>
                                {showCount ? <Text style={[styles.count, big && styles.countBig, onTone && styles.onToneSub]}>{item.count} products</Text> : null}
                            </View>
                        </AnimatedTile>
                    );
                })}
                {footer ? (
                    <AnimatedTile
                        index={items.length}
                        box={footerBox ?? boxFor(allSpecs.length - 1)}
                        tone="mint"
                        variant="footer"
                        compact={footerCompact}
                        onPress={footer.onPress}
                        accessibilityLabel={`${footer.title}, ${footer.subtitle}`}
                    >
                        <View style={[styles.footerContent, footerCompact && styles.footerContentCompact]}>
                            <Text style={[styles.footerTitle, footerCompact && styles.footerTitleCompact]} numberOfLines={2}>{footer.title}</Text>
                            <Text style={[styles.footerSub, footerCompact && styles.footerSubCompact]} numberOfLines={2}>{footer.subtitle}</Text>
                        </View>
                    </AnimatedTile>
                ) : null}
            </View>
        </View>
    );
}

const DARK_TEXT = '#2A1550';

const styles = themed(() =>
    StyleSheet.create({
        pressable: { flex: 1 },
        tileBox: { position: 'absolute' },
        tile: { flex: 1, borderRadius: 22, backgroundColor: palette.sand, overflow: 'hidden', justifyContent: 'flex-end' },
        mint: { backgroundColor: '#CDB8F5' },
        gold: { backgroundColor: '#E8B04A' },

        // Designed backdrop inside every product tile
        backdrop: { ...StyleSheet.absoluteFillObject },
        bgBlob: { position: 'absolute', top: '10%', left: '19%', width: '62%', aspectRatio: 1, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.52)' },
        bgBlob2: { position: 'absolute', left: '-16%', bottom: '6%', width: '44%', aspectRatio: 1, borderRadius: 999 },
        bgRing: { position: 'absolute', top: '6%', left: '14%', width: '72%', aspectRatio: 1, borderRadius: 999, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.72)' },
        bgRingInner: { position: 'absolute', top: '18%', left: '28%', width: '44%', aspectRatio: 1, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.62)' },
        bgWave: { position: 'absolute', left: '-10%', right: '-10%', bottom: '-16%', height: '34%', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.28)' },
        bgSpark: { position: 'absolute', right: '12%', top: '10%', opacity: 0.9 },
        accentRose: { backgroundColor: 'rgba(139,95,208,0.22)' },
        accentGold: { backgroundColor: 'rgba(242,196,90,0.24)' },
        accentViolet: { backgroundColor: 'rgba(107,63,196,0.2)' },
        accentMint: { backgroundColor: 'rgba(79,143,106,0.18)' },
        accentBlush: { backgroundColor: 'rgba(229,217,247,0.6)' },

        image: { position: 'absolute', top: 8, left: 8, right: 8, width: undefined, height: undefined },
        label: { padding: 12, paddingTop: 10, backgroundColor: withAlpha(palette.surface, 0.45) },
        labelOnTone: { backgroundColor: 'rgba(255,255,255,0.35)' },
        nameSans: { fontSize: 13, fontWeight: '700', color: palette.ink },
        nameSansBig: { fontSize: 18 },
        nameSerif: { fontFamily: typeface.display, fontSize: 16, color: palette.ink },
        nameSerifBig: { fontSize: 20 },
        count: { fontSize: 11, color: palette.stone, marginTop: 2 },
        countBig: { fontSize: 13 },
        onTone: { color: DARK_TEXT },
        onToneSub: { color: 'rgba(42,21,80,0.7)' },

        // Footer tile: centered, bold treatment with its own rings
        footerBackdrop: { ...StyleSheet.absoluteFillObject },
        footerGlow: { position: 'absolute', top: '50%', left: '50%', width: 130, height: 130, marginLeft: -65, marginTop: -65, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.22)' },
        footerRing: { position: 'absolute', top: '50%', left: '50%', width: 170, height: 170, marginLeft: -85, marginTop: -85, borderRadius: 85, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' },
        footerRingInner: { position: 'absolute', top: '50%', left: '50%', width: 120, height: 120, marginLeft: -60, marginTop: -60, borderRadius: 60, borderWidth: 1, borderColor: 'rgba(255,255,255,0.32)' },
        footerSpark: { position: 'absolute', right: 18, top: 14, opacity: 0.75 },
        footerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 3 },
        footerTitle: { fontFamily: typeface.display, fontSize: 27, lineHeight: 31, color: DARK_TEXT, textAlign: 'center', fontWeight: '700', letterSpacing: 0.2 },
        footerSub: { fontSize: 11, color: 'rgba(42,21,80,0.72)', textAlign: 'center' },
        footerContentCompact: { paddingHorizontal: spacing.sm, paddingVertical: 4, gap: 1 },
        footerTitleCompact: { fontSize: 17, lineHeight: 20 },
        footerSubCompact: { fontSize: 9, lineHeight: 12 },
    })
);