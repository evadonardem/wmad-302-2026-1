/**
 * CategoryBento - bento-style category tiles with the product image on every tile
 * Tiles span several grid cells (for example 2x2 or 2x1) and are packed into the grid
 * left-to-right, top-to-bottom, so different sizes fit together without gaps.
 * Used for "Popular category" in Search (2 columns) and on the Categories page (4 columns).
 */
import React, { useState } from 'react';
import { Image, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radius, themed, typeface } from '@/constants/theme';

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
                        <Pressable
                            key={item.name}
                            style={[styles.tile, box, tone === 'mint' && styles.mint, tone === 'gold' && styles.gold]}
                            onPress={() => onOpen(item.name)}
                            accessibilityRole="button"
                            accessibilityLabel={`${pretty(item.name)}, ${item.count} products`}
                        >
                            {item.image ? (
                                <Image source={{ uri: item.image }} style={[styles.image, { bottom: big ? 64 : showCount ? 44 : 38 }]} resizeMode="contain" />
                            ) : null}
                            <View style={styles.label}>
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
                        </Pressable>
                    );
                })}
                {footer ? (
                    <Pressable style={[styles.tile, styles.mint, styles.footerTile, boxFor(allSpecs.length - 1)]} onPress={footer.onPress} accessibilityRole="button">
                        <Text style={styles.footerTitle} numberOfLines={2}>{footer.title}</Text>
                        <Text style={[styles.count, styles.onToneSub]}>{footer.subtitle}</Text>
                    </Pressable>
                ) : null}
            </View>
        </View>
    );
}

const DARK_TEXT = '#2A1550';

const styles = themed(() =>
    StyleSheet.create({
        tile: { position: 'absolute', borderRadius: 22, backgroundColor: palette.sand, overflow: 'hidden', justifyContent: 'flex-end' },
        mint: { backgroundColor: '#CDB8F5' },
        gold: { backgroundColor: '#E8B04A' },
        image: { position: 'absolute', top: 10, left: 10, right: 10, width: undefined, height: undefined },
        label: { padding: 12, paddingTop: 0 },
        nameSans: { fontSize: 12, fontWeight: '700', color: palette.ink },
        nameSansBig: { fontSize: 17 },
        nameSerif: { fontFamily: typeface.display, fontSize: 15, color: palette.ink },
        nameSerifBig: { fontSize: 19 },
        count: { fontSize: 10, color: palette.stone, marginTop: 2 },
        countBig: { fontSize: 12 },
        onTone: { color: DARK_TEXT },
        onToneSub: { color: 'rgba(42,21,80,0.7)' },
        footerTile: { padding: 18, justifyContent: 'flex-end', borderRadius: radius.xl },
        footerTitle: { fontFamily: typeface.display, fontSize: 26, lineHeight: 30, color: DARK_TEXT },
    })
);