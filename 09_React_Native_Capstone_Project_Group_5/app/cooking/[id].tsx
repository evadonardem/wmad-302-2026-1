/**
 * Cooking Mode - distraction-free, one step at a time.
 * Big step number, large instruction text, optional photo, Previous / Next buttons,
 * a progress bar and a kitchen timer (auto-suggested from the step text, e.g. "12-15 minutes").
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Platform,
    Pressable,
    ScrollView,
    Text,
    useWindowDimensions,
    Vibration,
    View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';
import { DEFAULT_TIMER_SECONDS as DEFAULT_SECONDS, MAX_TIMER_SECONDS as MAX_SECONDS, detectSeconds, formatClock } from '@/utils/cooking';
import { routes } from '@/utils/routes';
import { ErrorState } from '@/components';
import { createStyles, tc, useAppTheme } from '@/context/ThemeContext';

export default function CookingModeScreen() {
    useAppTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const recipeId = Number(id);
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isWide = width >= 900;

    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [step, setStep] = useState(0); // steps.length means "all done"
    const [showPhoto, setShowPhoto] = useState(false);

    // Timer
    const [seconds, setSeconds] = useState(DEFAULT_SECONDS);
    const [running, setRunning] = useState(false);
    const [finished, setFinished] = useState(false);
    const endAtRef = useRef(0);

    const load = useCallback(async () => {
        if (!Number.isFinite(recipeId)) {
            setError('Invalid recipe');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const r = await recipeApi.getRecipeById(recipeId);
            setRecipe(r);
            setSeconds(detectSeconds(r.instructions[0] ?? '') ?? DEFAULT_SECONDS);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load recipe');
        } finally {
            setLoading(false);
        }
    }, [recipeId]);

    useEffect(() => {
        load();
    }, [load]);

    const steps = useMemo(() => recipe?.instructions ?? [], [recipe]);
    const total = steps.length;
    const isDone = total > 0 && step >= total;
    const suggested = !isDone && steps[step] ? detectSeconds(steps[step]) : null;

    // Countdown (based on the clock, so it stays accurate even if the tab is throttled)
    useEffect(() => {
        if (!running) return;
        const timer = setInterval(() => {
            const left = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
            setSeconds(left);
            if (left === 0) {
                setRunning(false);
                setFinished(true);
                if (Platform.OS !== 'web') Vibration.vibrate([0, 500, 300, 500, 300, 500]);
            }
        }, 250);
        return () => clearInterval(timer);
    }, [running]);

    const goTo = useCallback(
        (next: number) => {
            const clamped = Math.max(0, Math.min(total, next));
            setStep(clamped);
            // A running timer keeps going while you move on; otherwise load this step's suggested time
            if (!running) {
                setFinished(false);
                setSeconds((clamped < total ? detectSeconds(steps[clamped]) : null) ?? DEFAULT_SECONDS);
            }
        },
        [running, steps, total]
    );

    const startPause = () => {
        if (running) {
            setRunning(false);
            return;
        }
        if (seconds <= 0) return;
        setFinished(false);
        endAtRef.current = Date.now() + seconds * 1000;
        setRunning(true);
    };

    const resetTimer = () => {
        setRunning(false);
        setFinished(false);
        setSeconds(suggested ?? DEFAULT_SECONDS);
    };

    const adjust = (delta: number) => {
        if (running) return;
        setFinished(false);
        setSeconds((s) => Math.max(0, Math.min(MAX_SECONDS, s + delta)));
    };

    const close = () => {
        if (router.canGoBack()) router.back();
        else router.replace(routes.recipe(recipeId));
    };

    // Keyboard: arrow keys for Previous / Next (web)
    useEffect(() => {
        if (Platform.OS !== 'web') return;
        // No DOM types in React Native's TypeScript setup, so describe the small part of `document` we use.
        type KeyEvent = { key: string };
        type WebDoc = {
            addEventListener: (type: 'keydown', fn: (e: KeyEvent) => void) => void;
            removeEventListener: (type: 'keydown', fn: (e: KeyEvent) => void) => void;
        };
        const doc = (globalThis as unknown as { document?: WebDoc }).document;
        if (!doc) return;
        const onKey = (e: KeyEvent) => {
            if (e.key === 'ArrowRight') goTo(step + 1);
            if (e.key === 'ArrowLeft') goTo(step - 1);
            if (e.key === 'Escape') close();
        };
        doc.addEventListener('keydown', onKey);
        return () => doc.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [goTo, step]);

    if (loading) {
        return (
            <View style={styles.center}>
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color="#E85D04" />
            </View>
        );
    }

    if (error || !recipe) {
        return (
            <View style={styles.center}>
                <Stack.Screen options={{ headerShown: false }} />
                <ErrorState message={error ?? 'Recipe not found'} onRetry={load} />
            </View>
        );
    }

    const percent = total === 0 ? 0 : Math.round((Math.min(step, total) / total) * 100);

    return (
        <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Top bar */}
            <View style={styles.topBar}>
                <Pressable onPress={close} style={styles.roundButton} accessibilityRole="button" accessibilityLabel="Exit cooking mode">
                    <MaterialCommunityIcons name="close" size={24} color={tc('#3E2723')} />
                </Pressable>
                <View style={styles.topTitleWrap}>
                    <Text style={styles.topTitle} numberOfLines={1}>
                        {recipe.name}
                    </Text>
                    <Text style={styles.topSub}>
                        {isDone ? 'All done' : `Step ${step + 1} of ${total}`} · {percent}%
                    </Text>
                </View>
                <Pressable
                    onPress={() => setShowPhoto((v) => !v)}
                    style={[styles.roundButton, showPhoto && styles.roundButtonActive]}
                    accessibilityRole="button"
                    accessibilityLabel={showPhoto ? 'Hide photo' : 'Show photo'}
                >
                    <MaterialCommunityIcons name="image-outline" size={22} color={showPhoto ? '#FFFFFF' : tc('#3E2723')} />
                </Pressable>
            </View>

            {/* Progress: one segment per step (tap to jump) */}
            <View style={styles.progress}>
                {steps.map((_, i) => (
                    <Pressable
                        key={i}
                        onPress={() => goTo(i)}
                        style={styles.segmentHit}
                        accessibilityRole="button"
                        accessibilityLabel={`Go to step ${i + 1}`}
                    >
                        <View style={[styles.segment, i < step && styles.segmentDone, i === step && styles.segmentCurrent]} />
                    </Pressable>
                ))}
            </View>

            {isDone ? (
                <View style={styles.doneWrap}>
                    <View style={styles.doneIcon}>
                        <MaterialCommunityIcons name="check" size={56} color="#FFFFFF" />
                    </View>
                    <Text style={styles.doneTitle}>Enjoy your meal!</Text>
                    <Text style={styles.doneText}>You finished all {total} steps of {recipe.name}.</Text>
                    <View style={styles.doneButtons}>
                        <Pressable style={[styles.navButton, styles.navPrev]} onPress={() => goTo(0)} accessibilityRole="button">
                            <MaterialCommunityIcons name="restart" size={24} color={tc('#3E2723')} />
                            <Text style={styles.navPrevText}>Start over</Text>
                        </Pressable>
                        <Pressable style={[styles.navButton, styles.navNext]} onPress={close} accessibilityRole="button">
                            <Text style={styles.navNextText}>Back to recipe</Text>
                        </Pressable>
                    </View>
                </View>
            ) : (
                <>
                    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                        <View style={[styles.content, isWide && styles.contentWide]}>
                            {/* Step */}
                            <View style={styles.stepCol}>
                                {showPhoto && <Image source={{ uri: recipe.image }} style={styles.photo} resizeMode="cover" />}
                                <Text style={styles.bigNumber}>{String(step + 1).padStart(2, '0')}</Text>
                                <Text style={[styles.stepText, isWide && styles.stepTextWide]}>{steps[step]}</Text>
                                {suggested ? (
                                    <View style={styles.tip}>
                                        <View style={styles.tipBar} />
                                        <Text style={styles.tipText}>
                                            This step takes about {formatClock(suggested)}. The timer is set for you.
                                        </Text>
                                    </View>
                                ) : null}
                            </View>

                            {/* Timer */}
                            <View style={[styles.timerCard, finished && styles.timerCardDone, isWide && styles.timerCardWide]}>
                                <Text style={styles.timerLabel}>{finished ? "Time's up!" : running ? 'Timer running' : 'Kitchen timer'}</Text>
                                <Text style={[styles.timerClock, finished && styles.timerClockDone]} accessibilityLiveRegion="polite">
                                    {formatClock(seconds)}
                                </Text>
                                <View style={styles.timerAdjust}>
                                    <Pressable
                                        onPress={() => adjust(-60)}
                                        disabled={running}
                                        style={[styles.adjustButton, running && styles.disabled]}
                                        accessibilityRole="button"
                                        accessibilityLabel="Minus one minute"
                                    >
                                        <Text style={styles.adjustText}>−1 min</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => adjust(60)}
                                        disabled={running}
                                        style={[styles.adjustButton, running && styles.disabled]}
                                        accessibilityRole="button"
                                        accessibilityLabel="Plus one minute"
                                    >
                                        <Text style={styles.adjustText}>+1 min</Text>
                                    </Pressable>
                                </View>
                                <View style={styles.timerActions}>
                                    <Pressable
                                        onPress={startPause}
                                        style={[styles.timerMain, running && styles.timerMainPause]}
                                        accessibilityRole="button"
                                        accessibilityLabel={running ? 'Pause timer' : 'Start timer'}
                                    >
                                        <MaterialCommunityIcons name={running ? 'pause' : 'play'} size={26} color="#FFFFFF" />
                                        <Text style={styles.timerMainText}>{running ? 'Pause' : 'Start'}</Text>
                                    </Pressable>
                                    <Pressable onPress={resetTimer} style={styles.timerReset} accessibilityRole="button" accessibilityLabel="Reset timer">
                                        <MaterialCommunityIcons name="restart" size={24} color={tc('#3E2723')} />
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Previous / Next */}
                    <View style={styles.navRow}>
                        <Pressable
                            onPress={() => goTo(step - 1)}
                            disabled={step === 0}
                            style={[styles.navButton, styles.navPrev, step === 0 && styles.disabled]}
                            accessibilityRole="button"
                            accessibilityLabel="Previous step"
                        >
                            <MaterialCommunityIcons name="arrow-left" size={26} color={tc('#3E2723')} />
                            <Text style={styles.navPrevText}>Previous</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => goTo(step + 1)}
                            style={[styles.navButton, styles.navNext]}
                            accessibilityRole="button"
                            accessibilityLabel={step === total - 1 ? 'Finish cooking' : 'Next step'}
                        >
                            <Text style={styles.navNextText}>{step === total - 1 ? 'Finish' : 'Next'}</Text>
                            <MaterialCommunityIcons name={step === total - 1 ? 'check' : 'arrow-right'} size={26} color="#FFFFFF" />
                        </Pressable>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = createStyles({
    container: { flex: 1, backgroundColor: '#FFFDF8', width: '100%', maxWidth: 1100, alignSelf: 'center', paddingHorizontal: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFDF8' },
    disabled: { opacity: 0.4 },

    topBar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    roundButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F6F1EA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    roundButtonActive: { backgroundColor: '#E85D04' },
    topTitleWrap: { flex: 1, alignItems: 'center' },
    topTitle: { fontSize: 17, fontWeight: '800', color: '#2B2320' },
    topSub: { fontSize: 13, color: '#8D6E63', marginTop: 2 },

    progress: { flexDirection: 'row', gap: 6, marginTop: 16, marginBottom: 4 },
    segmentHit: { flex: 1, paddingVertical: 8 },
    segment: { height: 8, borderRadius: 4, backgroundColor: '#EADFD3' },
    segmentDone: { backgroundColor: '#F5A56B' },
    segmentCurrent: { backgroundColor: '#E85D04' },

    body: { flexGrow: 1, justifyContent: 'center', paddingVertical: 16 },
    content: { gap: 24 },
    contentWide: { flexDirection: 'row', alignItems: 'center', gap: 48 },
    stepCol: { flex: 1 },
    photo: { width: '100%', height: 200, borderRadius: 22, marginBottom: 16, backgroundColor: '#EFEBE9' },
    bigNumber: { fontSize: 110, lineHeight: 120, fontWeight: '800', color: '#E85D04' },
    stepText: { fontSize: 26, lineHeight: 38, fontWeight: '600', color: '#2B2320' },
    stepTextWide: { fontSize: 34, lineHeight: 48 },
    tip: { flexDirection: 'row', gap: 12, marginTop: 20 },
    tipBar: { width: 4, borderRadius: 2, backgroundColor: '#E85D04' },
    tipText: { flex: 1, fontSize: 16, lineHeight: 24, fontStyle: 'italic', color: '#6D4C41' },

    timerCard: {
        alignItems: 'center',
        backgroundColor: '#F6F1EA',
        borderRadius: 28,
        paddingVertical: 24,
        paddingHorizontal: 20,
        gap: 14,
    },
    timerCardWide: { width: 340 },
    timerCardDone: { backgroundColor: '#FFE0B2' },
    timerLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5, color: '#8D6E63', textTransform: 'uppercase' },
    timerClock: { fontSize: 72, fontWeight: '800', color: '#2B2320', fontVariant: ['tabular-nums'] },
    timerClockDone: { color: '#E85D04' },
    timerAdjust: { flexDirection: 'row', gap: 12 },
    adjustButton: { minWidth: 96, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
    adjustText: { fontSize: 16, fontWeight: '700', color: '#3E2723' },
    timerActions: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch' },
    timerMain: {
        flex: 1,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#2B2320',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    timerMainPause: { backgroundColor: '#E85D04' },
    timerMainText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
    timerReset: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },

    navRow: { flexDirection: 'row', gap: 12, paddingTop: 8 },
    navButton: {
        flex: 1,
        height: 68,
        borderRadius: 34,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    navPrev: { backgroundColor: '#F6F1EA' },
    navPrevText: { fontSize: 19, fontWeight: '700', color: '#3E2723' },
    navNext: { backgroundColor: '#E85D04', flex: 1.4 },
    navNextText: { fontSize: 19, fontWeight: '800', color: '#FFFFFF' },

    doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 12 },
    doneIcon: { width: 104, height: 104, borderRadius: 52, backgroundColor: '#43A047', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    doneTitle: { fontSize: 36, fontWeight: '800', color: '#2B2320', textAlign: 'center' },
    doneText: { fontSize: 18, color: '#6D4C41', textAlign: 'center' },
    doneButtons: { flexDirection: 'row', gap: 12, alignSelf: 'stretch', maxWidth: 520, marginTop: 20 },
});