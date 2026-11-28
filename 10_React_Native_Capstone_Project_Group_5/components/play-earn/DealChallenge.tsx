/**
 * Play & Earn - Deal Hunter challenge UI: clue hero, product choices, feedback,
 * solved state and the countdown to the next daily challenge.
 */
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette } from '@/constants/theme';
import { Product } from '@/types/product';
import { playStyles as styles } from './playEarnStyles';

export interface DealFeedback {
    tone: 'correct' | 'wrong';
    title: string;
    text: string;
}

interface DealChallengeProps {
    clue: string;
    rewardPoints: number;
    attemptsLeft: number;
    solved: boolean;
    choices: Product[];
    picked: Record<number, boolean>;
    choiceWidth: number;
    feedback: DealFeedback | null;
    countdown: string;
    couponTitle?: string;
    onSelect: (product: Product) => void;
    onOpenProduct: (id: number) => void;
    onViewRewards: () => void;
}

export function DealChallenge({
    clue,
    rewardPoints,
    attemptsLeft,
    solved,
    choices,
    picked,
    choiceWidth,
    feedback,
    countdown,
    couponTitle,
    onSelect,
    onOpenProduct,
    onViewRewards,
}: DealChallengeProps) {
    const outOfAttempts = attemptsLeft <= 0 && !solved;

    return (
        <View>
            <View style={styles.dealHero}>
                <View style={styles.dealHeroGlow} />
                <View style={styles.dealHeroRing} />
                <Text style={styles.dealKicker}>Today&apos;s deal hunt</Text>
                <Text style={styles.dealClue}>{clue}</Text>
                <View style={styles.dealMeta}>
                    <View style={styles.dealRewardChip}>
                        <MaterialCommunityIcons name="star-four-points" size={14} color={palette.gold} />
                        <Text style={styles.dealRewardText}>{rewardPoints} points</Text>
                    </View>
                    <View style={styles.dealAttempts}>
                        <MaterialCommunityIcons name={solved ? 'check-circle-outline' : 'target'} size={14} color="#FBF7FF" />
                        <Text style={styles.dealAttemptsText}>
                            {solved ? 'Solved today' : `${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'} left`}
                        </Text>
                    </View>
                </View>
            </View>

            {solved ? (
                <View style={styles.solvedCard}>
                    <View style={styles.solvedRow}>
                        <View style={styles.solvedChip}>
                            <MaterialCommunityIcons name="check-decagram" size={16} color={palette.forest} />
                            <Text style={styles.solvedChipText}>Deal found</Text>
                        </View>
                        <View style={styles.solvedChip}>
                            <MaterialCommunityIcons name="star-four-points" size={16} color={palette.forest} />
                            <Text style={styles.solvedChipText}>+{rewardPoints} points</Text>
                        </View>
                        {couponTitle ? (
                            <View style={styles.solvedChip}>
                                <MaterialCommunityIcons name="ticket-percent-outline" size={16} color={palette.forest} />
                                <Text style={styles.solvedChipText}>{couponTitle} coupon</Text>
                            </View>
                        ) : null}
                    </View>
                    <Text style={styles.solvedTitle}>Great hunting!</Text>
                    <Text style={styles.solvedText}>
                        Your points and coupon are already in My Rewards. Come back tomorrow for a fresh clue.
                    </Text>
                    <View style={styles.btnRow}>
                        <Pressable style={styles.primaryBtn} onPress={onViewRewards} accessibilityRole="button">
                            <MaterialCommunityIcons name="gift-outline" size={18} color="#FBF7FF" />
                            <Text style={styles.primaryBtnText}>View My Rewards</Text>
                        </Pressable>
                    </View>
                </View>
            ) : null}

            {feedback ? (
                <View style={[styles.feedbackCard, feedback.tone === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong]}>
                    <MaterialCommunityIcons
                        name={feedback.tone === 'correct' ? 'check-circle' : 'close-circle'}
                        size={26}
                        color={feedback.tone === 'correct' ? palette.success : palette.danger}
                    />
                    <View style={styles.feedbackText}>
                        <Text style={styles.feedbackTitle}>{feedback.title}</Text>
                        <Text style={styles.feedbackSub}>{feedback.text}</Text>
                    </View>
                </View>
            ) : null}

            <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Which product is the answer?</Text>
                <Text style={styles.sectionLink}>{choices.length} choices</Text>
            </View>

            <View style={styles.choiceGrid}>
                {choices.map((product) => {
                    const result = picked[product.id];
                    const isCorrect = result === true;
                    const isWrong = result === false;
                    const disabled = solved || outOfAttempts || result !== undefined;

                    return (
                        <View
                            key={product.id}
                            style={[
                                styles.choiceCard,
                                { width: choiceWidth },
                                isCorrect && styles.choiceCardCorrect,
                                isWrong && styles.choiceCardWrong,
                                disabled && !isCorrect && !isWrong && styles.choiceCardDisabled,
                            ]}
                        >
                            <Pressable onPress={() => onOpenProduct(product.id)} accessibilityRole="button" accessibilityLabel={`Open ${product.title}`}>
                                <View style={styles.choiceImageWrap}>
                                    <Image source={{ uri: product.thumbnail }} style={styles.choiceImage} resizeMode="contain" />
                                </View>
                            </Pressable>
                            {product.discountPercentage > 0 ? (
                                <View style={styles.choiceBadge}>
                                    <Text style={styles.choiceBadgeText}>-{Math.round(product.discountPercentage)}%</Text>
                                </View>
                            ) : null}
                            {isCorrect || isWrong ? (
                                <View style={[styles.choiceCheck, { backgroundColor: isCorrect ? palette.success : palette.danger }]}>
                                    <MaterialCommunityIcons name={isCorrect ? 'check' : 'close'} size={17} color="#FFFFFF" />
                                </View>
                            ) : null}

                            <View style={styles.choiceBody}>
                                <Text style={styles.choiceTitle} numberOfLines={2}>
                                    {product.title}
                                </Text>
                                <View style={styles.choicePriceRow}>
                                    <Text style={styles.choicePrice}>₱{product.price.toFixed(2)}</Text>
                                    {product.discountPercentage > 0 ? (
                                        <Text style={styles.choiceDiscount}>-{Math.round(product.discountPercentage)}%</Text>
                                    ) : null}
                                </View>
                                <Pressable
                                    style={[
                                        styles.choiceSelect,
                                        disabled && !isCorrect && !isWrong && { backgroundColor: palette.mist },
                                        isCorrect && { backgroundColor: palette.success },
                                        isWrong && { backgroundColor: palette.danger },
                                    ]}
                                    onPress={() => onSelect(product)}
                                    disabled={disabled}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Select ${product.title}`}
                                >
                                    <Text style={styles.choiceSelectText}>
                                        {isCorrect ? 'Found it!' : isWrong ? 'Try again' : solved ? 'Deal found' : 'Select'}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    );
                })}
            </View>

            <View style={styles.countdownCard}>
                <Text style={styles.countdownLabel}>{solved || outOfAttempts ? 'Next challenge in' : 'Challenge ends in'}</Text>
                <Text style={styles.countdownValue}>{countdown}</Text>
                <Text style={styles.countdownSub}>
                    {solved
                        ? 'A new deal appears at midnight. Keep your streak going!'
                        : outOfAttempts
                            ? 'You used all attempts today. Come back tomorrow for another try.'
                            : 'Find the hidden deal before the timer runs out.'}
                </Text>
            </View>
        </View>
    );
}
