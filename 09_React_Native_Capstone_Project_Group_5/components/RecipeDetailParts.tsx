/**
 * Recipe detail pieces: section title, quick fact, star rating and nutrition row.
 */
import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IconName } from '@/components';
import { createStyles, useAppTheme } from '@/context/ThemeContext';

/** "Cooking **Instructions**": first part dark, accent part orange. */
export function SectionTitle({ first, accent }: { first: string; accent: string }) {
    useAppTheme();
    return (
        <Text style={styles.sectionTitle}>
            {first} <Text style={styles.accent}>{accent}</Text>
        </Text>
    );
}

export function Fact({ icon, label, value }: { icon: IconName; label: string; value: string }) {
    useAppTheme();
    return (
        <View style={styles.fact}>
            <View style={styles.factIcon}>
                <MaterialCommunityIcons name={icon} size={20} color="#E85D04" />
            </View>
            <View>
                <Text style={styles.factLabel}>{label}</Text>
                <Text style={styles.factValue}>{value}</Text>
            </View>
        </View>
    );
}

export function Stars({ rating }: { rating: number }) {
    useAppTheme();
    return (
        <View style={styles.stars} accessibilityLabel={`Rated ${rating.toFixed(1)} out of 5`}>
            {[1, 2, 3, 4, 5].map((n) => {
                const name = rating >= n ? 'star' : rating >= n - 0.5 ? 'star-half-full' : 'star-outline';
                return <MaterialCommunityIcons key={n} name={name} size={18} color="#F9A825" />;
            })}
        </View>
    );
}

export function NutritionRow({
    label,
    value,
    last,
    changed,
    note,
}: {
    label: string;
    value: string;
    last?: boolean;
    changed?: boolean;
    note?: string;
}) {
    useAppTheme();
    return (
        <View style={[styles.nutritionRow, !last && styles.nutritionRowBorder]}>
            <View style={styles.nutritionLabelCol}>
                <Text style={styles.nutritionLabel}>{label}</Text>
                {note ? <Text style={styles.nutritionNote}>{note}</Text> : null}
            </View>
            <Text style={[styles.nutritionValue, changed && styles.nutritionChanged]}>{value}</Text>
        </View>
    );
}

const styles = createStyles({
    accent: { color: '#E85D04' },
    fact: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 150 },
    factIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF1DC', alignItems: 'center', justifyContent: 'center' },
    factLabel: { fontSize: 12, color: '#8D6E63' },
    factValue: { fontSize: 15, fontWeight: '700', color: '#2B2320' },
    stars: { flexDirection: 'row' },
    nutritionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11 },
    nutritionRowBorder: { borderBottomWidth: 1, borderBottomColor: '#E8DDD0' },
    nutritionLabelCol: { flex: 1, paddingRight: 8 },
    nutritionNote: { fontSize: 11.5, color: '#8D6E63', marginTop: 1 },
    nutritionChanged: { color: '#E85D04' },
    nutritionLabel: { fontSize: 14, color: '#6D4C41' },
    nutritionValue: { fontSize: 14, fontWeight: '700', color: '#2B2320' },
    sectionTitle: { fontSize: 26, fontWeight: '800', color: '#2B2320', marginTop: 36 },
});