/**
 * StylePassport - the profile's loyalty card (a unique extra feature)
 * - Level: 1 point per $1 spent, four tiers (Explorer, Insider, VIP, Elite) with a progress bar
 * - Completeness: four steps (first order, address, payment method, wishlist) with a percentage
 * - Achievements: six badges that unlock as you use the app
 */
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette, radius, spacing, themed, typeface } from '@/constants/theme';
import { PERSONALITIES } from '@/components/play-earn/quizData';
import { PersonalityKey } from '@/types/rewards';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface Tier {
    name: string;
    min: number;
    icon: IconName;
    note: string;
}

export const TIERS: Tier[] = [
    { name: 'Explorer', min: 0, icon: 'compass-outline', note: 'Just getting started' },
    { name: 'Insider', min: 250, icon: 'star-outline', note: 'Early looks at new arrivals' },
    { name: 'VIP', min: 1000, icon: 'crown-outline', note: 'A seasoned shopper' },
    { name: 'Elite', min: 5000, icon: 'diamond-stone', note: 'Top shopper status' },
];

export function tierFor(points: number): Tier {
    return [...TIERS].reverse().find((t) => points >= t.min) ?? TIERS[0];
}

interface StylePassportProps {
    spent: number;
    ordersCount: number;
    wishCount: number;
    addressCount: number;
    methodCount: number;
    darkMode: boolean;
    quizPersonality?: PersonalityKey | null;
}

interface Badge {
    key: string;
    label: string;
    icon: IconName;
    earned: boolean;
}

export function StylePassport({ spent, ordersCount, wishCount, addressCount, methodCount, darkMode, quizPersonality }: StylePassportProps) {
    const points = Math.round(spent);
    const tier = tierFor(points);
    const next = TIERS.find((t) => t.min > points) ?? null;
    const progress = next ? (points - tier.min) / (next.min - tier.min) : 1;

    const steps = [
        { label: 'First order', done: ordersCount > 0 },
        { label: 'Address', done: addressCount > 0 },
        { label: 'Payment', done: methodCount > 0 },
        { label: 'Wishlist', done: wishCount > 0 },
    ];
    const completeness = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);

    const personality = quizPersonality ? PERSONALITIES[quizPersonality] : null;

    const badges: Badge[] = [
        { key: 'order', label: 'First Order', icon: 'package-variant-closed', earned: ordersCount > 0 },
        { key: 'wish', label: 'Wishlister', icon: 'heart-outline', earned: wishCount > 0 },
        { key: 'home', label: 'Home Base', icon: 'home-map-marker', earned: addressCount > 0 },
        { key: 'pay', label: 'Pay Ready', icon: 'credit-card-check-outline', earned: methodCount > 0 },
        { key: 'owl', label: 'Night Owl', icon: 'weather-night', earned: darkMode },
        { key: 'spender', label: 'Big Spender', icon: 'cash-multiple', earned: spent >= 1000 },
        { key: 'quiz', label: 'Quiz Star', icon: 'brain', earned: !!personality },
    ];
    const earnedCount = badges.filter((b) => b.earned).length;

    return (
        <View style={styles.card}>
            <View style={styles.headRow}>
                <View style={styles.tierIcon}>
                    <MaterialCommunityIcons name={tier.icon} size={22} color={palette.surface} />
                </View>
                <View style={styles.headText}>
                    <Text style={styles.kicker}>Style Passport</Text>
                    <Text style={styles.tierName}>{tier.name}</Text>
                </View>
                <View style={styles.pointsBox}>
                    <Text style={styles.points}>{points.toLocaleString()}</Text>
                    <Text style={styles.pointsLabel}>points</Text>
                </View>
            </View>

            <View style={styles.track}>
                <View style={[styles.fillBar, { width: `${Math.max(4, Math.round(progress * 100))}%` }]} />
            </View>
            <Text style={styles.note}>
                {next ? `${(next.min - points).toLocaleString()} points to ${next.name} · ${next.note}` : `Top tier reached · ${tier.note}`}
            </Text>
            <View style={styles.tierRow}>
                {TIERS.map((t) => (
                    <View key={t.name} style={styles.tierStep}>
                        <View style={[styles.tierDot, points >= t.min && styles.tierDotOn]} />
                        <Text style={[styles.tierStepText, points >= t.min && styles.tierStepTextOn]}>{t.name}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Profile completeness</Text>
                <Text style={styles.sectionValue}>{completeness}%</Text>
            </View>
            <View style={styles.track}>
                <View style={[styles.fillBar, styles.fillAlt, { width: `${Math.max(3, completeness)}%` }]} />
            </View>
            <View style={styles.stepsRow}>
                {steps.map((s) => (
                    <View key={s.label} style={[styles.stepChip, s.done && styles.stepChipDone]}>
                        <MaterialCommunityIcons name={s.done ? 'check-circle' : 'circle-outline'} size={14} color={s.done ? palette.forest : palette.mist} />
                        <Text style={[styles.stepText, s.done && styles.stepTextDone]}>{s.label}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Achievements</Text>
                <Text style={styles.sectionValue}>{earnedCount}/{badges.length}</Text>
            </View>

            {personality ? (
                <View style={[styles.personalityBadge, { borderColor: personality.accent, backgroundColor: personality.soft }]}>
                    <View style={[styles.personalityGlow, { backgroundColor: personality.accent }]} />
                    <Image source={personality.character} style={styles.personalityImage} resizeMode="contain" />
                    <View style={styles.personalityInfo}>
                        <Text style={[styles.personalityKicker, { color: personality.accent }]}>Personality badge earned</Text>
                        <Text style={styles.personalityTitle}>{personality.title}</Text>
                        <Text style={styles.personalityTagline} numberOfLines={2}>{personality.tagline}</Text>
                        <View style={styles.personalityTagRow}>
                            {personality.tags.slice(0, 2).map((tag) => (
                                <View key={tag} style={[styles.personalityTag, { borderColor: personality.accent }]}>
                                    <Text style={[styles.personalityTagText, { color: personality.accent }]}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                    <View style={[styles.personalityMedal, { backgroundColor: personality.accent }]}>
                        <MaterialCommunityIcons name="seal-variant" size={18} color="#FFF" />
                    </View>
                </View>
            ) : (
                <View style={styles.personalityLocked}>
                    <View style={styles.personalityLockedIcon}>
                        <MaterialCommunityIcons name="lock-outline" size={22} color={palette.mist} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.personalityLockedTitle}>Personality badge locked</Text>
                        <Text style={styles.personalityLockedText}>Take the Shopping Personality Quiz to unlock your unique badge.</Text>
                    </View>
                </View>
            )}

            <View style={styles.badgeGrid}>
                {badges.map((b) => (
                    <View key={b.key} style={styles.badge}>
                        <View style={[styles.badgeCircle, b.earned && styles.badgeCircleOn]}>
                            {b.earned ? <View style={styles.badgeShine} /> : null}
                            <MaterialCommunityIcons name={b.earned ? b.icon : 'lock-outline'} size={20} color={b.earned ? palette.surface : palette.mist} />
                        </View>
                        <Text style={[styles.badgeLabel, !b.earned && styles.badgeLabelOff]} numberOfLines={1}>{b.label}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = themed(() =>
    StyleSheet.create({
        card: { backgroundColor: palette.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
        headRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
        tierIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: palette.forest, alignItems: 'center', justifyContent: 'center' },
        headText: { flex: 1 },
        kicker: { fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: palette.stone, fontWeight: '600' },
        tierName: { fontFamily: typeface.display, fontSize: 24, color: palette.ink },
        pointsBox: { alignItems: 'flex-end' },
        points: { fontFamily: typeface.display, fontSize: 22, color: palette.forest },
        pointsLabel: { fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: palette.stone },
        track: { height: 8, borderRadius: 4, backgroundColor: palette.sand, overflow: 'hidden', marginTop: spacing.md },
        fillBar: { height: '100%', borderRadius: 4, backgroundColor: palette.forest },
        fillAlt: { backgroundColor: palette.gold },
        note: { fontSize: 12, color: palette.stone, marginTop: 8 },
        tierRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
        tierStep: { alignItems: 'center', gap: 4, flex: 1 },
        tierDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.beige },
        tierDotOn: { backgroundColor: palette.forest },
        tierStepText: { fontSize: 11, color: palette.mist },
        tierStepTextOn: { color: palette.ink, fontWeight: '600' },
        divider: { height: 1, backgroundColor: palette.line, marginVertical: spacing.lg },
        sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
        sectionTitle: { fontSize: 14, fontWeight: '700', color: palette.ink },
        sectionValue: { fontSize: 13, fontWeight: '700', color: palette.forest },
        stepsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
        stepChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 30, borderRadius: radius.pill, backgroundColor: palette.sand },
        stepChipDone: { backgroundColor: palette.accentSoft },
        stepText: { fontSize: 12, color: palette.stone },
        stepTextDone: { color: palette.forest, fontWeight: '600' },
        personalityBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md, padding: spacing.md, borderRadius: 20, borderWidth: 1.5, overflow: 'hidden' },
        personalityGlow: { position: 'absolute', right: -20, top: -20, width: 90, height: 90, borderRadius: 45, opacity: 0.12 },
        personalityImage: { width: 88, height: 88, borderRadius: 44 },
        personalityInfo: { flex: 1, minWidth: 0 },
        personalityKicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
        personalityTitle: { fontFamily: typeface.display, fontSize: 22, lineHeight: 26, color: palette.ink, marginTop: 2 },
        personalityTagline: { fontSize: 12, lineHeight: 17, color: palette.stone, marginTop: 2 },
        personalityTagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 8 },
        personalityTag: { paddingHorizontal: 8, height: 22, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.5)' },
        personalityTagText: { fontSize: 10, fontWeight: '700' },
        personalityMedal: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
        personalityLocked: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md, padding: spacing.md, borderRadius: 20, backgroundColor: palette.sand, borderWidth: 1, borderColor: palette.line },
        personalityLockedIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' },
        personalityLockedTitle: { fontSize: 14, fontWeight: '700', color: palette.ink },
        personalityLockedText: { fontSize: 12, lineHeight: 17, color: palette.stone, marginTop: 2 },
        badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md, rowGap: spacing.md },
        badge: { width: '33.33%', alignItems: 'center', gap: 6 },
        badgeCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: palette.sand, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: palette.line },
        badgeCircleOn: { backgroundColor: palette.forest, borderColor: palette.gold, shadowColor: palette.gold, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
        badgeShine: { position: 'absolute', top: -8, left: -4, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)' },
        badgeLabel: { fontSize: 11, fontWeight: '700', color: palette.ink },
        badgeLabelOff: { color: palette.mist, fontWeight: '500' },
    })
);