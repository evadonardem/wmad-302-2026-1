/**
 * Taste DNA card (Profile): shows what the person usually likes, learned from their favorite recipes.
 */
import React from 'react';
import { Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TasteProfile, TasteShare, formatMinutes } from '@/utils/recipeFilters';
import { createStyles, useAppTheme } from '@/context/ThemeContext';

function Bars({ items }: { items: TasteShare[] }) {
    return (
        <View style={styles.bars}>
            {items.map((c) => (
                <View key={c.name} style={styles.barRow}>
                    <Text style={styles.barName} numberOfLines={1}>
                        {c.name}
                    </Text>
                    <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${Math.max(6, c.pct)}%` }]} />
                    </View>
                    <Text style={styles.barPct}>{c.pct}%</Text>
                </View>
            ))}
        </View>
    );
}

function Chips({ items }: { items: TasteShare[] }) {
    return (
        <View style={styles.chips}>
            {items.map((t) => (
                <View key={t.name} style={styles.chip}>
                    <Text style={styles.chipText}>{t.name}</Text>
                </View>
            ))}
        </View>
    );
}

export function TasteDNACard({
    taste,
    onPlan,
    onBrowse,
}: {
    taste: TasteProfile;
    onPlan: () => void;
    onBrowse: () => void;
}) {
    useAppTheme();
    const empty = taste.total === 0;
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.icon}>
                    <MaterialCommunityIcons name="dna" size={26} color="#FFFFFF" />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.title}>Your Taste DNA</Text>
                    <Text style={styles.sub}>
                        {empty ? 'Learned from your favorite recipes' : `${taste.title} · from ${taste.total} favorite${taste.total === 1 ? '' : 's'}`}
                    </Text>
                </View>
            </View>

            {empty ? (
                <>
                    <Text style={styles.hint}>Tap the heart on a few recipes and your cuisines, flavors and favorite meal types will show up here.</Text>
                    <Button mode="contained" icon="magnify" buttonColor="#D81B60" textColor="#FFFFFF" onPress={onBrowse} style={styles.btn}>
                        Find recipes to love
                    </Button>
                </>
            ) : (
                <>
                    <Text style={styles.label}>Top cuisines</Text>
                    <Bars items={taste.cuisines.slice(0, 4)} />

                    {taste.tags.length > 0 && (
                        <>
                            <Text style={styles.label}>Flavors you keep coming back to</Text>
                            <Chips items={taste.tags.slice(0, 6)} />
                        </>
                    )}

                    <Text style={styles.label}>Favorite meal times</Text>
                    <Chips items={taste.mealTypes.slice(0, 4)} />

                    <View style={styles.stats}>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{taste.avgCalories}</Text>
                            <Text style={styles.statLabel}>avg cal</Text>
                        </View>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{formatMinutes(taste.avgTime)}</Text>
                            <Text style={styles.statLabel}>avg time</Text>
                        </View>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{taste.difficulties[0]?.name ?? '-'}</Text>
                            <Text style={styles.statLabel}>usual level</Text>
                        </View>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{taste.avgRating.toFixed(1)}</Text>
                            <Text style={styles.statLabel}>avg rating</Text>
                        </View>
                    </View>

                    <Button mode="contained" icon="auto-fix" buttonColor="#D81B60" textColor="#FFFFFF" onPress={onPlan} style={styles.btn}>
                        Plan my week from my taste
                    </Button>
                </>
            )}
        </View>
    );
}

const styles = createStyles({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E9CED8',
        marginBottom: 16,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    icon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#D81B60', alignItems: 'center', justifyContent: 'center' },
    headerText: { flex: 1 },
    title: { fontSize: 18, fontWeight: '800', color: '#2A2124' },
    sub: { fontSize: 13, color: '#8A6673', marginTop: 2 },
    hint: { fontSize: 14, color: '#5A3A46', lineHeight: 20, marginTop: 14 },
    label: { fontSize: 12, fontWeight: '800', color: '#8A6673', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 16, marginBottom: 8 },
    bars: { gap: 8 },
    barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    barName: { width: 92, fontSize: 13, fontWeight: '600', color: '#3C252D' },
    barTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: '#EDD8E0', overflow: 'hidden' },
    barFill: { height: 10, borderRadius: 5, backgroundColor: '#D81B60' },
    barPct: { width: 38, textAlign: 'right', fontSize: 12, fontWeight: '700', color: '#5A3A46' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { backgroundColor: '#FDE7EF', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 },
    chipText: { fontSize: 13, fontWeight: '600', color: '#880E4F' },
    stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
    stat: { flexGrow: 1, flexBasis: 72, alignItems: 'center', backgroundColor: '#FEF9FB', borderRadius: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#E9CED8' },
    statValue: { fontSize: 15, fontWeight: '800', color: '#2A2124' },
    statLabel: { fontSize: 11, color: '#8A6673', marginTop: 2 },
    btn: { marginTop: 18, borderRadius: 14 },
});