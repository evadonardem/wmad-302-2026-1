/**
 * Shopping Personality Quiz - 5 questions, animated transitions, a result card
 * with recommendations, share and retake.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, ScrollView, Share, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { useRewards } from '@/context/RewardsContext';
import { productApi } from '@/services/productApi';
import { QUIZ_REWARD_POINTS, todayKey } from '@/services/rewardsService';
import { useResponsive } from '@/constants/theme';
import { Product } from '@/types/product';
import { PersonalityKey } from '@/types/rewards';
import { ScreenBackground } from '@/components/ScreenBackground';
import { PlayEarnHeader } from '@/components/play-earn/PlayEarnHeader';
import { QuizQuestion } from '@/components/play-earn/QuizQuestion';
import { PersonalityResult } from '@/components/play-earn/PersonalityResult';
import { PERSONALITIES, QUESTIONS, Personality, QuizOption, scoreAnswers } from '@/components/play-earn/quizData';
import { playStyles as styles } from '@/components/play-earn/playEarnStyles';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export default function PersonalityQuizScreen() {
    const router = useRouter();
    const { pad } = useResponsive();
    const { state, saveQuiz } = useRewards();

    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<PersonalityKey[]>([]);
    const [selected, setSelected] = useState<QuizOption['key'] | null>(null);
    const [transitioning, setTransitioning] = useState(false);
    const [finished, setFinished] = useState(false);
    const [result, setResult] = useState<Personality | null>(null);
    const [earnedPoints, setEarnedPoints] = useState(0);
    const [recommendations, setRecommendations] = useState<Product[]>([]);
    const [recLoading, setRecLoading] = useState(false);
    const [snack, setSnack] = useState<string | null>(null);

    const fade = useRef(new Animated.Value(1)).current;
    const slide = useRef(new Animated.Value(0)).current;

    const finishQuiz = (allAnswers: PersonalityKey[]) => {
        const key = scoreAnswers(allAnswers);
        const personality = PERSONALITIES[key];
        const alreadyEarnedToday = state.quiz?.rewardDateKey === todayKey();
        setResult(personality);
        setEarnedPoints(alreadyEarnedToday ? 0 : QUIZ_REWARD_POINTS);
        saveQuiz({ key, completedAt: new Date().toISOString(), rewardDateKey: todayKey() });
        setFinished(true);
        fade.setValue(0);
        slide.setValue(18);
        Animated.parallel([
            Animated.timing(fade, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
            Animated.timing(slide, { toValue: 0, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
        ]).start(() => setTransitioning(false));
    };

    const handleSelect = (option: QuizOption) => {
        if (transitioning || finished) return;
        setSelected(option.key);
        setTransitioning(true);
        const nextAnswers = [...answers, option.personality];
        setAnswers(nextAnswers);

        Animated.parallel([
            Animated.timing(fade, { toValue: 0, duration: 170, easing: Easing.in(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
            Animated.timing(slide, { toValue: -18, duration: 170, easing: Easing.in(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
        ]).start(() => {
            if (nextAnswers.length >= QUESTIONS.length) {
                finishQuiz(nextAnswers);
                return;
            }
            setStep((current) => current + 1);
            setSelected(null);
            slide.setValue(18);
            Animated.parallel([
                Animated.timing(fade, { toValue: 1, duration: 230, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
                Animated.timing(slide, { toValue: 0, duration: 230, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
            ]).start(() => setTransitioning(false));
        });
    };

    // Load recommended products for the result personality
    useEffect(() => {
        if (!finished || !result) return;
        let active = true;
        setRecLoading(true);
        Promise.all(result.categories.slice(0, 3).map((category) => productApi.getProductsByCategory(category, { limit: 6 })))
            .then((responses) => {
                if (!active) return;
                const seen = new Set<number>();
                const merged = responses
                    .flatMap((response) => response.products)
                    .filter((product) => {
                        if (seen.has(product.id)) return false;
                        seen.add(product.id);
                        return true;
                    })
                    .sort((a, b) => b.rating - a.rating)
                    .slice(0, 8);
                setRecommendations(merged);
            })
            .catch(() => {
                if (active) setRecommendations([]);
            })
            .finally(() => {
                if (active) setRecLoading(false);
            });
        return () => {
            active = false;
        };
    }, [finished, result]);

    const shareResult = async () => {
        if (!result) return;
        const message = `I'm ${result.title} on Marketplace! ${result.tagline} Take the Shopping Personality Quiz to find yours.`;
        try {
            if (Platform.OS === 'web') {
                const nav = (globalThis as unknown as {
                    navigator?: {
                        share?: (data: { title?: string; text?: string }) => Promise<void>;
                        clipboard?: { writeText: (text: string) => Promise<void> };
                    };
                }).navigator;
                if (nav?.share) {
                    await nav.share({ title: 'My shopping personality', text: message });
                } else if (nav?.clipboard) {
                    await nav.clipboard.writeText(message);
                    setSnack('Result copied to your clipboard');
                } else {
                    setSnack('Sharing is not supported in this browser');
                }
            } else {
                await Share.share({ message });
            }
        } catch {
            setSnack('Unable to share right now');
        }
    };

    const retake = () => {
        setFinished(false);
        setResult(null);
        setAnswers([]);
        setStep(0);
        setSelected(null);
        setEarnedPoints(0);
        setRecommendations([]);
        setTransitioning(false);
        fade.setValue(1);
        slide.setValue(0);
    };

    const question = QUESTIONS[step];

    return (
        <View style={styles.screen}>
            <ScreenBackground />
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingHorizontal: pad }]} showsVerticalScrollIndicator={false}>
                <PlayEarnHeader
                    eyebrow="Personalized experience"
                    title="Shopping Personality Quiz"
                    subtitle="Five quick questions. One very you result."
                />

                {finished && result ? (
                    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
                        <PersonalityResult
                            personality={result}
                            products={recommendations}
                            loading={recLoading}
                            earnedPoints={earnedPoints}
                            onShare={shareResult}
                            onRetake={retake}
                            onOpenProduct={(id) => router.push(`/(app)/(tabs)/product/${id}`)}
                            onViewRewards={() => router.push('/(app)/(tabs)/play-earn/rewards')}
                        />
                    </Animated.View>
                ) : (
                    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
                        <QuizQuestion
                            question={question}
                            index={step}
                            total={QUESTIONS.length}
                            selected={selected}
                            disabled={transitioning}
                            onSelect={handleSelect}
                        />
                    </Animated.View>
                )}
            </ScrollView>

            <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={2600}>
                {snack}
            </Snackbar>
        </View>
    );
}
