/**
 * Play & Earn - one quiz step: progress bar, question card and answer options.
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette } from '@/constants/theme';
import { QuizOption, QuizQuestion as QuizQuestionData } from './quizData';
import { playStyles as styles } from './playEarnStyles';

interface QuizQuestionProps {
    question: QuizQuestionData;
    index: number;
    total: number;
    selected: QuizOption['key'] | null;
    disabled?: boolean;
    onSelect: (option: QuizOption) => void;
}

export function QuizQuestion({ question, index, total, selected, disabled = false, onSelect }: QuizQuestionProps) {
    const progress = ((index + 1) / total) * 100;

    return (
        <View>
            <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>
                    Question {index + 1} of {total}
                </Text>
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
            </View>

            <View style={styles.questionCard}>
                <View style={styles.questionGlow} />
                <Text style={styles.questionKicker}>Shopping personality</Text>
                <Text style={styles.questionText}>{question.prompt}</Text>

                <View style={styles.optionList}>
                    {question.options.map((option) => {
                        const isSelected = selected === option.key;
                        return (
                            <Pressable
                                key={option.key}
                                style={[styles.optionCard, isSelected && styles.optionSelected]}
                                onPress={() => onSelect(option)}
                                disabled={disabled}
                                accessibilityRole="button"
                                accessibilityState={{ selected: isSelected, disabled }}
                                accessibilityLabel={`${option.key}. ${option.label}`}
                            >
                                <View style={[styles.optionKey, isSelected && styles.optionKeySelected]}>
                                    <Text style={[styles.optionKeyText, isSelected && styles.optionKeyTextSelected]}>{option.key}</Text>
                                </View>
                                <Text style={styles.optionText}>{option.label}</Text>
                                {isSelected ? (
                                    <MaterialCommunityIcons name="check-circle" size={20} color={palette.forest} />
                                ) : null}
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}
