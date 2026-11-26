/**
 * Play & Earn - the hub.
 * One reward balance, three daily activities and a preview of My Rewards.
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRewards } from '@/context/RewardsContext';
import { useResponsive, palette } from '@/constants/theme';
import { ScreenBackground } from '@/components/ScreenBackground';
import { PlayEarnHeader } from '@/components/play-earn/PlayEarnHeader';
import { ActivityCard, ActivityStatus } from '@/components/play-earn/ActivityCard';
import { CouponCard } from '@/components/play-earn/RewardCard';
import { PERSONALITIES } from '@/components/play-earn/quizData';
import { playStyles as styles } from '@/components/play-earn/playEarnStyles';
import { formatCountdown, msUntilNextMidnight, msUntilNextSpin, todayKey } from '@/services/rewardsService';

export default function PlayEarnScreen() {
    const router = useRouter();
    const { pad } = useResponsive();
    const { state } = useRewards();
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!state.hydrated) {
        return (
            <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={palette.forest} />
                <Text style={styles.loadingText}>Loading your rewards…</Text>
            </View>
        );
    }

    const today = todayKey();
    const spinMs = msUntilNextSpin(state.lastSpinAt, now);
    const dealToday = state.deal?.dateKey === today ? state.deal : null;
    const quizToday = state.quiz?.rewardDateKey === today;

    const spinStatus: { status: ActivityStatus; label: string } =
        spinMs > 0
            ? { status: 'locked', label: `Next free spin in ${formatCountdown(spinMs)}` }
            : { status: 'ready', label: 'Your free spin is ready' };

    const quizStatus: { status: ActivityStatus; label: string } = quizToday
        ? { status: 'done', label: `Completed today · ${state.quiz ? PERSONALITIES[state.quiz.key].title : 'Result saved'}` }
        : state.quiz
            ? { status: 'ready', label: `Last result: ${PERSONALITIES[state.quiz.key].title}` }
            : { status: 'ready', label: 'Take the 5-question quiz' };

    const dealStatus: { status: ActivityStatus; label: string } = dealToday?.solved
        ? { status: 'done', label: 'Deal found today · come back tomorrow' }
        : dealToday && dealToday.attemptsLeft <= 0
            ? { status: 'locked', label: 'Out of attempts · new clue at midnight' }
            : { status: 'ready', label: `Find today's deal · ${formatCountdown(msUntilNextMidnight(now))} left` };

    const latestCoupons = state.coupons.slice(0, 2);

    return (
        <View style={styles.screen}>
            <ScreenBackground />
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingHorizontal: pad }]} showsVerticalScrollIndicator={false}>
                <PlayEarnHeader
                    eyebrow="Rewards & games"
                    title="Play & Earn"
                    subtitle="Shop, play, discover, and earn rewards!"
                />

                {/* Shared reward balance */}
                <View style={styles.balanceCard}>
                    <View style={styles.balanceGlowA} />
                    <View style={styles.balanceGlowB} />
                    <View style={styles.balanceRing} />
                    <MaterialCommunityIcons name="star-four-points" size={20} color={palette.gold} style={styles.balanceSpark} />
                    <View style={styles.balanceTop}>
                        <Text style={styles.balanceLabel}>Your reward balance</Text>
                        <View style={styles.balanceChip}>
                            <MaterialCommunityIcons name="fire" size={13} color={palette.gold} />
                            <Text style={styles.balanceChipText}>Daily rewards</Text>
                        </View>
                    </View>
                    <View style={styles.balanceValueRow}>
                        <Text style={styles.balanceValue}>{state.points}</Text>
                        <Text style={styles.balanceUnit}>POINTS</Text>
                    </View>
                    <Text style={styles.balanceSub}>Keep playing to earn more!</Text>
                    <View style={styles.balanceBadges}>
                        <View style={styles.balanceBadge}>
                            <MaterialCommunityIcons name="ticket-percent-outline" size={15} color={palette.gold} />
                            <Text style={styles.balanceBadgeText}>{state.coupons.length} coupons</Text>
                        </View>
                        <View style={styles.balanceBadge}>
                            <MaterialCommunityIcons name="controller-classic-outline" size={15} color={palette.gold} />
                            <Text style={styles.balanceBadgeText}>3 games</Text>
                        </View>
                        <View style={styles.balanceBadge}>
                            <MaterialCommunityIcons name="wallet-giftcard" size={15} color={palette.gold} />
                            <Text style={styles.balanceBadgeText}>1 shared balance</Text>
                        </View>
                    </View>
                </View>

                {/* Daily activities */}
                <View style={styles.section}>
                    <View style={styles.sectionHead}>
                        <Text style={styles.sectionTitle}>Daily activities</Text>
                        <Text style={styles.sectionLink}>Play · earn · repeat</Text>
                    </View>
                    <View style={styles.activityList}>
                        <ActivityCard
                            icon="chart-donut"
                            title="Spin & Win"
                            description="Spin once every 24 hours for coupons and points."
                            badge="Daily reward"
                            status={spinStatus.status}
                            statusLabel={spinStatus.label}
                            accent="#C98A1B"
                            accentSoft="rgba(242,196,90,0.24)"
                            onPress={() => router.push('/(app)/(tabs)/play-earn/spin-wheel')}
                        />
                        <ActivityCard
                            icon="brain"
                            title="Shopping Personality Quiz"
                            description="Discover your shopping personality in 5 questions."
                            badge="5 questions"
                            status={quizStatus.status}
                            statusLabel={quizStatus.label}
                            accent="#8B5FD0"
                            accentSoft="rgba(139,95,208,0.2)"
                            onPress={() => router.push('/(app)/(tabs)/play-earn/personality-quiz')}
                        />
                        <ActivityCard
                            icon="binoculars"
                            title="Deal Hunter"
                            description="Follow today's clue and find the hidden discount."
                            badge="100 bonus points"
                            status={dealStatus.status}
                            statusLabel={dealStatus.label}
                            accent="#3F6FD8"
                            accentSoft="rgba(63,111,216,0.18)"
                            onPress={() => router.push('/(app)/(tabs)/play-earn/deal-hunter')}
                        />
                    </View>
                </View>

                {/* Rewards preview */}
                <View style={styles.section}>
                    <View style={styles.sectionHead}>
                        <Text style={styles.sectionTitle}>My Rewards</Text>
                        <Pressable onPress={() => router.push('/(app)/(tabs)/play-earn/rewards')} accessibilityRole="link">
                            <Text style={styles.sectionLink}>View all →</Text>
                        </Pressable>
                    </View>

                    {latestCoupons.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <MaterialCommunityIcons name="gift-open-outline" size={28} color={palette.forest} />
                            </View>
                            <Text style={styles.emptyTitle}>No rewards yet</Text>
                            <Text style={styles.emptyText}>Spin the wheel, finish the quiz or solve today&apos;s deal to earn coupons.</Text>
                            <Pressable
                                style={[styles.primaryBtn, { marginTop: 6 }]}
                                onPress={() => router.push('/(app)/(tabs)/play-earn/spin-wheel')}
                                accessibilityRole="button"
                            >
                                <MaterialCommunityIcons name="chart-donut" size={18} color="#FBF7FF" />
                                <Text style={styles.primaryBtnText}>Spin & Win</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.rewardList}>
                            {latestCoupons.map((coupon) => (
                                <CouponCard key={coupon.id} coupon={coupon} showCode={false} />
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>One balance, three ways to earn</Text>
                    <Text style={styles.emptyText}>
                        Every spin, quiz and deal feeds the same points and coupon wallet — so nothing gets lost between games.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
