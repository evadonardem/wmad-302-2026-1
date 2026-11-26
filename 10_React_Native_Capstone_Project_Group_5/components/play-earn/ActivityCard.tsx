/**
 * Play & Earn - one activity row (Spin & Win, Shopping Personality Quiz, Deal Hunter).
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette } from '@/constants/theme';
import { playStyles as styles } from './playEarnStyles';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
export type ActivityStatus = 'ready' | 'done' | 'locked';

interface ActivityCardProps {
    icon: IconName;
    title: string;
    description: string;
    badge?: string;
    status?: ActivityStatus;
    statusLabel?: string;
    accent: string;
    accentSoft: string;
    onPress: () => void;
}

export function ActivityCard({
    icon,
    title,
    description,
    badge,
    status = 'ready',
    statusLabel,
    accent,
    accentSoft,
    onPress,
}: ActivityCardProps) {
    const statusColor = status === 'ready' ? palette.success : status === 'done' ? palette.stone : palette.danger;

    return (
        <Pressable
            style={({ pressed }) => [styles.activityCard, pressed && { opacity: 0.88 }]}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${title}. ${description}`}
        >
            <View style={[styles.activityIcon, { backgroundColor: accentSoft }]}>
                <MaterialCommunityIcons name={icon} size={27} color={accent} />
            </View>
            <View style={styles.activityText}>
                <View style={styles.activityTop}>
                    <Text style={styles.activityTitle}>{title}</Text>
                    {badge ? (
                        <View style={styles.activityBadge}>
                            <Text style={styles.activityBadgeText}>{badge}</Text>
                        </View>
                    ) : null}
                </View>
                <Text style={styles.activityDesc}>{description}</Text>
                {statusLabel ? (
                    <View style={styles.activityStatus}>
                        <View style={[styles.activityDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.activityStatusText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                ) : null}
            </View>
            <View style={styles.activityArrow}>
                <MaterialCommunityIcons name="chevron-right" size={20} color={palette.ink} />
            </View>
        </Pressable>
    );
}
