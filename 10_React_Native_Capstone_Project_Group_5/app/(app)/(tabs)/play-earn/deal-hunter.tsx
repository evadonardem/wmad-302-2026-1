/**
 * Deal Hunter - find the hidden discounted product from today's clue.
 * Products come from DummyJSON; the clue and reward come from local config.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRewards } from '@/context/RewardsContext';
import { productApi } from '@/services/productApi';
import {
    DEAL_ATTEMPTS,
    formatCountdown,
    makeCoupon,
    msUntilNextMidnight,
    todayKey,
} from '@/services/rewardsService';
import { useResponsive, palette } from '@/constants/theme';
import { Product } from '@/types/product';
import { ScreenBackground } from '@/components/ScreenBackground';
import { PlayEarnHeader } from '@/components/play-earn/PlayEarnHeader';
import { DealChallenge, DealFeedback } from '@/components/play-earn/DealChallenge';
import { dailyDeal } from '@/components/play-earn/dealData';
import { playStyles as styles } from '@/components/play-earn/playEarnStyles';

export default function DealHunterScreen() {
    const router = useRouter();
    const { width, contentWidth, pad } = useResponsive();
    const { state, ensureDealDay, registerDealAttempt, solveDeal } = useRewards();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [picked, setPicked] = useState<Record<number, boolean>>({});
    const [feedback, setFeedback] = useState<DealFeedback | null>(null);
    const [now, setNow] = useState(() => Date.now());

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await productApi.getProducts({ limit: 200 });
            setProducts(response.products);
        } catch {
            setError('Could not load products. Check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const dayKey = todayKey(new Date(now));
    const deal = useMemo(() => dailyDeal(dayKey, products), [dayKey, products]);

    // Start / keep today's challenge in the shared reward state
    useEffect(() => {
        if (deal) ensureDealDay(deal.challenge.id);
    }, [deal, ensureDealDay]);

    // Reset the local guesses when a new day begins
    useEffect(() => {
        setPicked({});
        setFeedback(null);
    }, [dayKey]);

    const dealState = state.deal?.dateKey === dayKey ? state.deal : null;
    const attemptsLeft = dealState?.attemptsLeft ?? DEAL_ATTEMPTS;
    const solved = dealState?.solved ?? false;
    const countdown = formatCountdown(msUntilNextMidnight(now));

    const innerWidth = contentWidth - pad * 2;
    const columns = width >= 640 ? 3 : 2;
    const choiceWidth = Math.max(150, Math.floor((innerWidth - 12 * (columns - 1)) / columns));

    const handleSelect = (product: Product) => {
        if (!deal || solved || attemptsLeft <= 0 || picked[product.id] !== undefined) return;

        const correct = product.id === deal.answer.id;
        setPicked((current) => ({ ...current, [product.id]: correct }));

        if (correct) {
            const coupon = makeCoupon(
                deal.challenge.couponTitle,
                'discount',
                deal.challenge.couponValue,
                'deal',
                'DEAL'
            );
            solveDeal(deal.challenge.rewardPoints, coupon);
            setFeedback({
                tone: 'correct',
                title: 'Deal found!',
                text: `+${deal.challenge.rewardPoints} points and a ${deal.challenge.couponTitle} coupon were added to My Rewards.`,
            });
            return;
        }

        registerDealAttempt();
        const remaining = Math.max(0, attemptsLeft - 1);
        setFeedback({
            tone: 'wrong',
            title: 'Not quite…',
            text:
                remaining > 0
                    ? `That product does not match the clue. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} left.`
                    : 'That was your last attempt today. A fresh clue arrives at midnight.',
        });
    };

    if (!state.hydrated) {
        return (
            <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={palette.forest} />
                <Text style={styles.loadingText}>Loading today&apos;s challenge…</Text>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <ScreenBackground />
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingHorizontal: pad }]} showsVerticalScrollIndicator={false}>
                <PlayEarnHeader
                    eyebrow="Most interactive"
                    title="Deal Hunter"
                    subtitle="Follow the clue. Find the hidden deal. Earn the reward."
                />

                {loading ? (
                    <View style={styles.emptyState}>
                        <ActivityIndicator size="small" color={palette.forest} />
                        <Text style={styles.emptyText}>Scouting today&apos;s products…</Text>
                    </View>
                ) : error ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <MaterialCommunityIcons name="wifi-off" size={28} color={palette.forest} />
                        </View>
                        <Text style={styles.emptyTitle}>Products are hiding</Text>
                        <Text style={styles.emptyText}>{error}</Text>
                        <Pressable style={styles.primaryBtn} onPress={load} accessibilityRole="button">
                            <MaterialCommunityIcons name="refresh" size={18} color="#FBF7FF" />
                            <Text style={styles.primaryBtnText}>Try again</Text>
                        </Pressable>
                    </View>
                ) : !deal ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <MaterialCommunityIcons name="magnify-close" size={28} color={palette.forest} />
                        </View>
                        <Text style={styles.emptyTitle}>No challenge today</Text>
                        <Text style={styles.emptyText}>We could not build a challenge from the current catalogue. Try again in a moment.</Text>
                        <Pressable style={styles.primaryBtn} onPress={load} accessibilityRole="button">
                            <Text style={styles.primaryBtnText}>Reload</Text>
                        </Pressable>
                    </View>
                ) : (
                    <DealChallenge
                        clue={deal.challenge.clue}
                        rewardPoints={deal.challenge.rewardPoints}
                        attemptsLeft={attemptsLeft}
                        solved={solved}
                        choices={deal.choices}
                        picked={picked}
                        choiceWidth={choiceWidth}
                        feedback={feedback}
                        countdown={countdown}
                        couponTitle={deal.challenge.couponTitle}
                        onSelect={handleSelect}
                        onOpenProduct={(id) => router.push(`/(app)/(tabs)/product/${id}`)}
                        onViewRewards={() => router.push('/(app)/(tabs)/play-earn/rewards')}
                    />
                )}
            </ScrollView>
        </View>
    );
}
