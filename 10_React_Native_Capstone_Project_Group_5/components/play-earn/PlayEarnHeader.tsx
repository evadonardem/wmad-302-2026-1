/**
 * Play & Earn - page header with a back button, eyebrow, serif title and subtitle.
 */
import React, { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette } from '@/constants/theme';
import { playStyles as styles } from './playEarnStyles';

interface PlayEarnHeaderProps {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    right?: ReactNode;
    /** Override the back action (defaults to router.back with a safe fallback) */
    onBack?: () => void;
    showBack?: boolean;
}

export function PlayEarnHeader({ eyebrow, title, subtitle, right, onBack, showBack = true }: PlayEarnHeaderProps) {
    const router = useRouter();

    const goBack = () => {
        if (onBack) {
            onBack();
            return;
        }
        if (router.canGoBack()) router.back();
        else router.replace('/(app)/(tabs)/play-earn');
    };

    return (
        <View style={styles.header}>
            {showBack ? (
                <Pressable style={styles.backBtn} onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
                    <MaterialCommunityIcons name="arrow-left" size={22} color={palette.ink} />
                </Pressable>
            ) : null}
            <View style={styles.headerText}>
                {eyebrow ? <Text style={styles.headerEyebrow}>{eyebrow}</Text> : null}
                <Text style={styles.headerTitle}>{title}</Text>
                {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
            </View>
            {right}
        </View>
    );
}
