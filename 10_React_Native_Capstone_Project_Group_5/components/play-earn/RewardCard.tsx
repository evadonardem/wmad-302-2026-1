/**
 * Play & Earn - a coupon card used on the hub (recent rewards) and the full
 * My Rewards screen.
 */
import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette } from '@/constants/theme';
import { Coupon } from '@/types/rewards';
import { playStyles as styles } from './playEarnStyles';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const ICON: Record<Coupon['kind'], IconName> = {
    discount: 'ticket-percent-outline',
    shipping: 'truck-fast-outline',
    points: 'star-four-points-outline',
};

function valueLabel(coupon: Coupon): { big: string; small: string } {
    if (coupon.kind === 'discount') return { big: `${coupon.value}%`, small: 'OFF' };
    if (coupon.kind === 'shipping') return { big: 'FREE', small: 'SHIP' };
    return { big: `${coupon.value}`, small: 'PTS' };
}

function earnedLabel(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'Available';
    return `Earned ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

interface CouponCardProps {
    coupon: Coupon;
    showCode?: boolean;
}

export function CouponCard({ coupon, showCode = true }: CouponCardProps) {
    const value = valueLabel(coupon);
    return (
        <View style={styles.couponCard}>
            <View style={[styles.couponAccent, coupon.kind === 'shipping' && { backgroundColor: palette.success }]} />
            <View style={styles.couponValueWrap}>
                <MaterialCommunityIcons name={ICON[coupon.kind]} size={20} color={palette.forest} />
                <Text style={styles.couponValue}>{value.big}</Text>
                <Text style={styles.couponValueUnit}>{value.small}</Text>
            </View>
            <View style={styles.couponBody}>
                <Text style={styles.couponTitle} numberOfLines={1}>
                    {coupon.title}
                </Text>
                <Text style={styles.couponSub} numberOfLines={1}>
                    {coupon.subtitle}
                </Text>
                {showCode ? <Text style={styles.couponCode}>{coupon.code}</Text> : null}
                <Text style={styles.couponMeta}>{earnedLabel(coupon.earnedAt)}</Text>
            </View>
            <View style={styles.couponStatus}>
                <Text style={styles.couponStatusText}>Available</Text>
            </View>
        </View>
    );
}
