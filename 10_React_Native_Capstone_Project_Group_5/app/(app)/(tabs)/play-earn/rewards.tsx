/**
 * My Rewards - every coupon earned from Spin & Win, the quiz and Deal Hunter,
 * plus the shared points balance.
 */
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRewards } from '@/context/RewardsContext';
import { useResponsive, palette } from '@/constants/theme';
import { ScreenBackground } from '@/components/ScreenBackground';
import { PlayEarnHeader } from '@/components/play-earn/PlayEarnHeader';
import { CouponCard } from '@/components/play-earn/RewardCard';
import { playStyles as styles } from '@/components/play-earn/playEarnStyles';
import { CouponKind } from '@/types/rewards';

type Filter = 'all' | 'discount' | 'shipping';

const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All rewards' },
    { key: 'discount', label: 'Discounts' },
    { key: 'shipping', label: 'Shipping' },
];

export default function RewardsScreen() {
    const router = useRouter();
    const { pad } = useResponsive();
    const { state } = useRewards();
    const [filter, setFilter] = useState<Filter>('all');

    if (!state.hydrated) {
        return (
            <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={palette.forest} />
                <Text style={styles.loadingText}>Loading your rewards…</Text>
            </View>
        );
    }

    const coupons = state.coupons.filter((coupon) => {
        if (filter === 'all') return true;
        return coupon.kind === (filter as CouponKind);
    });

    const discountCount = state.coupons.filter((coupon) => coupon.kind === 'discount').length;
    const shippingCount = state.coupons.filter((coupon) => coupon.kind === 'shipping').length;

    return (
        <View style={styles.screen}>
            <ScreenBackground />
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingHorizontal: pad }]} showsVerticalScrollIndicator={false}>
                <PlayEarnHeader
                    eyebrow="Your wallet"
                    title="My Rewards"
                    subtitle="Coupons and points earned across every Play & Earn game."
                />

                <View style={styles.balanceCard}>
                    <View style={styles.balanceGlowA} />
                    <View style={styles.balanceGlowB} />
                    <View style={styles.balanceRing} />
                    <MaterialCommunityIcons name="star-four-points" size={20} color={palette.gold} style={styles.balanceSpark} />
                    <View style={styles.balanceTop}>
                        <Text style={styles.balanceLabel}>Reward balance</Text>
                        <View style={styles.balanceChip}>
                            <MaterialCommunityIcons name="ticket-percent-outline" size={13} color={palette.gold} />
                            <Text style={styles.balanceChipText}>{state.coupons.length} coupons</Text>
                        </View>
                    </View>
                    <View style={styles.balanceValueRow}>
                        <Text style={styles.balanceValue}>{state.points}</Text>
                        <Text style={styles.balanceUnit}>POINTS</Text>
                    </View>
                    <Text style={styles.balanceSub}>Keep playing to earn more!</Text>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHead}>
                        <Text style={styles.sectionTitle}>Coupons</Text>
                        <Text style={styles.sectionLink}>{state.coupons.length} saved</Text>
                    </View>

                    <View style={styles.filterRow}>
                        {FILTERS.map((item) => {
                            const active = filter === item.key;
                            const count =
                                item.key === 'all'
                                    ? state.coupons.length
                                    : item.key === 'discount'
                                        ? discountCount
                                        : shippingCount;
                            return (
                                <Pressable
                                    key={item.key}
                                    style={[styles.filterChip, active && styles.filterChipActive]}
                                    onPress={() => setFilter(item.key)}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: active }}
                                >
                                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                                        {item.label} · {count}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {coupons.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <MaterialCommunityIcons name="gift-open-outline" size={28} color={palette.forest} />
                            </View>
                            <Text style={styles.emptyTitle}>
                                {state.coupons.length === 0 ? 'No rewards yet' : 'Nothing in this filter'}
                            </Text>
                            <Text style={styles.emptyText}>
                                {state.coupons.length === 0
                                    ? 'Spin the wheel, finish the quiz or solve the daily deal to start your collection.'
                                    : 'Try another filter, or play a game to earn this kind of reward.'}
                            </Text>
                            <Pressable
                                style={[styles.primaryBtn, { marginTop: 6 }]}
                                onPress={() => router.push('/(app)/(tabs)/play-earn')}
                                accessibilityRole="button"
                            >
                                <MaterialCommunityIcons name="controller-classic-outline" size={18} color="#FBF7FF" />
                                <Text style={styles.primaryBtnText}>Play & Earn</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.couponList}>
                            {coupons.map((coupon) => (
                                <CouponCard key={coupon.id} coupon={coupon} />
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>Saved on this device</Text>
                    <Text style={styles.emptyText}>
                        Your coupons and points are stored locally for this capstone demo. A production app would verify them on a
                        server so they cannot be edited.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
