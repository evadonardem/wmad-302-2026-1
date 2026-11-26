/**
 * Spin & Win - one free spin every 24 hours.
 * Animated wheel -> prize popup with confetti -> coupon saved to My Rewards.
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRewards } from '@/context/RewardsContext';
import { useResponsive, palette } from '@/constants/theme';
import { ScreenBackground } from '@/components/ScreenBackground';
import { AppDialog } from '@/components/AppDialog';
import { PlayEarnHeader } from '@/components/play-earn/PlayEarnHeader';
import { SpinWheel } from '@/components/play-earn/SpinWheel';
import { Confetti } from '@/components/play-earn/Confetti';
import { pickSpinOutcome } from '@/components/play-earn/spinData';
import { playStyles as styles } from '@/components/play-earn/playEarnStyles';
import { formatCountdown, msUntilNextSpin } from '@/services/rewardsService';
import { SpinOutcome } from '@/types/rewards';

export default function SpinWheelScreen() {
    const router = useRouter();
    const { width, pad } = useResponsive();
    const { state, recordSpin } = useRewards();
    const [now, setNow] = useState(() => Date.now());
    const [prize, setPrize] = useState<SpinOutcome | null>(null);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!state.hydrated) {
        return (
            <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={palette.forest} />
                <Text style={styles.loadingText}>Loading your wheel…</Text>
            </View>
        );
    }

    const spinMs = msUntilNextSpin(state.lastSpinAt, now);
    const wheelSize = Math.min(310, Math.max(210, width - pad * 2 - 72));

    const handleSpin = (): SpinOutcome | null => {
        if (spinMs > 0) return null;
        return pickSpinOutcome();
    };

    const handleFinish = (outcome: SpinOutcome) => {
        recordSpin(outcome);
        setPrize(outcome);
    };

    const prizeIcon =
        prize?.segment.kind === 'points'
            ? 'star-four-points'
            : prize?.segment.kind === 'shipping'
                ? 'truck-fast-outline'
                : prize?.segment.kind === 'discount'
                    ? 'ticket-percent-outline'
                    : 'emoticon-sad-outline';

    const prizeTitle =
        prize?.segment.kind === 'none'
            ? 'So close!'
            : prize?.segment.kind === 'points'
                ? `+${prize?.segment.value ?? 0} points`
                : prize?.segment.label ?? '';

    const prizeText =
        prize?.segment.kind === 'none'
            ? 'No prize this time, but your next free spin unlocks in 24 hours.'
            : prize?.segment.kind === 'points'
                ? 'The points are already in your reward balance.'
                : prize?.segment.kind === 'shipping'
                    ? 'A Free Shipping voucher is waiting in My Rewards.'
                    : 'A new discount coupon is waiting in My Rewards.';

    return (
        <View style={styles.screen}>
            <ScreenBackground />
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingHorizontal: pad }]} showsVerticalScrollIndicator={false}>
                <PlayEarnHeader eyebrow="Daily reward" title="Spin & Win" subtitle="One free spin every 24 hours." />

                <View style={styles.wheelCard}>
                    <View style={styles.wheelHead}>
                        <Text style={styles.wheelEyebrow}>Today&apos;s wheel</Text>
                        <Text style={styles.wheelTitle}>Give it a spin</Text>
                        <Text style={styles.wheelSub}>Coupons, shipping vouchers and points are hiding on the wheel.</Text>
                    </View>

                    <SpinWheel
                        size={wheelSize}
                        disabled={spinMs > 0}
                        onSpin={handleSpin}
                        onFinish={handleFinish}
                        buttonSubLabel={spinMs > 0 ? 'WAIT' : 'FREE'}
                    />

                    <View style={styles.cooldownRow}>
                        <MaterialCommunityIcons name={spinMs > 0 ? 'timer-sand' : 'check-decagram'} size={16} color={palette.forest} />
                        <Text style={styles.cooldownText}>{spinMs > 0 ? 'Next free spin in' : 'Your free spin is ready'}</Text>
                        {spinMs > 0 ? <Text style={styles.cooldownValue}>{formatCountdown(spinMs)}</Text> : null}
                    </View>
                    <Text style={styles.wheelNote}>
                        Prizes: 5% OFF · 10% OFF · 15% OFF · Free Shipping · 50 Points · Try Again
                    </Text>
                </View>

                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>How it works</Text>
                    <Text style={styles.emptyText}>
                        One free spin every 24 hours. Every coupon you win is saved automatically to My Rewards, so you can use it
                        when you shop.
                    </Text>
                </View>
            </ScrollView>

            <AppDialog
                visible={!!prize}
                onDismiss={() => setPrize(null)}
                icon={prizeIcon}
                eyebrow={prize?.segment.kind === 'none' ? 'Try again' : 'You won'}
                title={prizeTitle}
                subtitle={prize?.segment.kind === 'none' ? 'The wheel keeps spinning tomorrow.' : 'A little reward from your daily spin.'}
                scroll={false}
                actions={[
                    { label: 'Nice!', onPress: () => setPrize(null) },
                    {
                        label: 'View My Rewards',
                        icon: 'gift-outline',
                        onPress: () => {
                            setPrize(null);
                            router.push('/(app)/(tabs)/play-earn/rewards');
                        },
                    },
                ]}
            >
                <View style={styles.prizeBody}>
                    <Confetti active={!!prize && prize.segment.kind !== 'none'} />
                    <View style={[styles.prizeBadge, { backgroundColor: prize?.segment.color ?? palette.accentSoft }]}>
                        <MaterialCommunityIcons name={prizeIcon} size={36} color={prize?.segment.textColor ?? palette.forest} />
                    </View>
                    <Text style={styles.prizeText}>{prizeText}</Text>
                    {prize?.coupon ? <Text style={styles.prizeCoupon}>CODE · {prize.coupon.code}</Text> : null}
                    {prize?.segment.kind === 'none' ? (
                        <Text style={styles.prizeHint}>Come back in 24 hours for another free spin.</Text>
                    ) : null}
                </View>
            </AppDialog>
        </View>
    );
}
