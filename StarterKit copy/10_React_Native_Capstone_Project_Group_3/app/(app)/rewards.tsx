/**
 * Rewards Screen - seasonal points (❄️ Snowflakes, 🎃 Candies …), daily check-in
 * streak, the daily surprise game (tap the box three times), redeeming points
 * for coupons, unlocked coupons and badges.
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useRewards } from '@/context/RewardsContext';
import { useActivity } from '@/context/ActivityContext';
import { useWishlist } from '@/context/WishlistContext';
import { useGiftLists } from '@/context/GiftListsContext';
import { useThemedStyles } from '@/hooks';
import { LivelyBackground } from '@/components/LivelyBackground';
import { GlassCard } from '@/components/GlassCard';
import { Confetti } from '@/components/Confetti';
import { SEASONS } from '@/constants/seasons';
import { getOrders } from '@/services/orderService';
import { haptic } from '@/services/feedback';
import { COUPONS } from '@/utils/cart';
import { BADGES, checkInPoints, getEarnedBadges, openedAdventDoors, Prize, REDEEMABLE_COUPONS } from '@/utils/rewards';
import { makeCommon } from '@/styles/common';
import { makeRewardsStyles } from '@/styles/rewards';

const TAPS_TO_OPEN = 3;

export default function RewardsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { palette, season, heading, t } = useSettings();
  const { rewards, streak, checkedInToday, surpriseOpenedToday, checkIn, openSurprise, redeemCoupon } = useRewards();
  const { reviews } = useActivity();
  const { items: wishlist } = useWishlist();
  const { lists } = useGiftLists();
  const common = useThemedStyles(makeCommon);
  const styles = useThemedStyles(makeRewardsStyles);
  const info = SEASONS[season];
  const pointsName = t(`points.${season}`);

  const [taps, setTaps] = useState(0);
  const [prize, setPrize] = useState<Prize | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [orderStats, setOrderStats] = useState({ orders: 0, spent: 0 });

  const shake = useSharedValue(0);
  const pop = useSharedValue(1);
  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${shake.value}deg` }, { scale: pop.value }],
  }));

  useEffect(() => {
    if (!user) return;
    getOrders(user.id)
      .then((orders) =>
        setOrderStats({ orders: orders.length, spent: orders.reduce((sum, order) => sum + order.grandTotal, 0) })
      )
      .catch(() => undefined);
  }, [user]);

  const earned = getEarnedBadges({
    ...orderStats,
    bestStreak: rewards.bestStreak,
    themesTried: rewards.themesTried.length,
    reviews: reviews.length,
    wishlist: wishlist.length,
    adventOpened: openedAdventDoors(rewards).length,
    giftLists: lists.length,
  });

  const handleCheckIn = () => {
    const points = checkIn();
    if (points === null) return;
    haptic('success');
    setMessage(t('rewards.checkedInMsg', { amount: points, name: pointsName }));
  };

  const tapBox = () => {
    if (surpriseOpenedToday) return;
    haptic('light');
    shake.value = withSequence(
      withTiming(-14, { duration: 60 }),
      withTiming(14, { duration: 60 }),
      withTiming(-8, { duration: 60 }),
      withTiming(0, { duration: 60 })
    );
    const next = taps + 1;
    setTaps(next);
    if (next >= TAPS_TO_OPEN) {
      const won = openSurprise();
      if (won) {
        pop.value = withSequence(withSpring(1.4), withSpring(1));
        haptic('success');
        setPrize(won);
      }
    }
  };

  const handleRedeem = (code: string) => {
    const result = redeemCoupon(code);
    if (result === 'ok') {
      haptic('success');
      setMessage(t('rewards.wonCoupon', { code }));
    } else if (result === 'insufficient') {
      haptic('warning');
      setMessage(t('rewards.notEnough', { name: pointsName }));
    }
  };

  const prizeText = prize
    ? prize.kind === 'points'
      ? t('rewards.wonPoints', { amount: prize.amount, name: pointsName })
      : t('rewards.wonCoupon', { code: prize.code })
    : null;

  return (
    <View style={common.screen}>
      <LivelyBackground />
      <ScrollView contentContainerStyle={common.scrollContent}>
        {/* Points & streak */}
        <View style={[styles.hero, { backgroundColor: palette.primary }]}>
          <Text style={[styles.heroLabel, { color: palette.onPrimary }]}>{pointsName}</Text>
          <Text style={[styles.heroPoints, heading(48), { color: palette.onPrimary }]}>
            {info.emoji} {rewards.points}
          </Text>
          <Text style={[styles.heroStreak, { color: palette.onPrimary }]}>
            🔥 {t('rewards.streak', { days: streak })}
          </Text>
          <Button
            mode="contained"
            buttonColor={palette.onPrimary}
            textColor={palette.primary}
            onPress={handleCheckIn}
            disabled={checkedInToday}
            style={styles.heroButton}
            icon={checkedInToday ? 'check' : 'calendar-check'}
          >
            {checkedInToday ? t('rewards.checkedIn') : t('rewards.checkIn', { points: checkInPoints(streak + 1) })}
          </Button>
        </View>
        {message && <Text style={styles.message}>{message}</Text>}

        {/* Daily surprise */}
        <GlassCard>
          <Text style={[styles.sectionTitle, heading(22)]}>{t('rewards.surprise')}</Text>
          <View style={styles.surpriseArea}>
            <TouchableOpacity
              onPress={tapBox}
              disabled={surpriseOpenedToday && !prize}
              accessibilityRole="button"
              accessibilityLabel={t('rewards.surprise')}
            >
              <Animated.Text style={[styles.surpriseBox, boxStyle, surpriseOpenedToday && !prize && styles.dim]}>
                {prize ? (prize.kind === 'points' ? info.emoji : '🎟️') : info.surprise}
              </Animated.Text>
            </TouchableOpacity>
            <Text style={styles.surpriseText}>
              {prizeText ??
                (surpriseOpenedToday
                  ? t('rewards.surpriseDone')
                  : t('rewards.surpriseHint', { times: TAPS_TO_OPEN - taps }))}
            </Text>
          </View>
        </GlassCard>

        {/* Redeem */}
        <GlassCard>
          <Text style={[styles.sectionTitle, heading(22)]}>{t('rewards.redeem')}</Text>
          {REDEEMABLE_COUPONS.map(({ code, cost }) => {
            const owned = rewards.unlockedCoupons.includes(code);
            const coupon = COUPONS.find((c) => c.code === code);
            return (
              <View key={code} style={styles.redeemRow}>
                <View style={styles.flex}>
                  <Text style={styles.couponCode}>🎟️ {code}</Text>
                  <Text style={styles.couponDesc}>{coupon?.description}</Text>
                </View>
                <Button
                  mode={owned ? 'text' : 'contained-tonal'}
                  disabled={owned}
                  onPress={() => handleRedeem(code)}
                  compact
                >
                  {owned ? t('rewards.owned') : t('rewards.redeemFor', { cost })}
                </Button>
              </View>
            );
          })}
          <Text style={styles.subTitle}>{t('rewards.myCoupons')}</Text>
          {rewards.unlockedCoupons.length === 0 ? (
            <Text style={common.muted}>{t('rewards.noCoupons')}</Text>
          ) : (
            <View style={styles.couponChips}>
              {rewards.unlockedCoupons.map((code) => (
                <View key={code} style={[styles.couponChip, { borderColor: palette.primary }]}>
                  <Text style={[styles.couponChipText, { color: palette.primary }]}>{code}</Text>
                </View>
              ))}
            </View>
          )}
          {rewards.unlockedCoupons.length > 0 && (
            <Button compact icon="cart" onPress={() => router.push('/cart')} style={styles.useButton}>
              {t('rewards.useInCart')}
            </Button>
          )}
        </GlassCard>

        {/* Badges */}
        <GlassCard>
          <Text style={[styles.sectionTitle, heading(22)]}>
            {t('rewards.badges')} ({earned.length}/{BADGES.length})
          </Text>
          <View style={styles.badgeGrid}>
            {BADGES.map((badge) => {
              const has = earned.includes(badge.id);
              return (
                <View
                  key={badge.id}
                  style={[styles.badge, has && { backgroundColor: palette.primaryContainer, borderColor: palette.primary }]}
                  accessibilityLabel={`${t(`badge.${badge.id}`)}${has ? '' : ' (locked)'}`}
                >
                  <Text style={[styles.badgeEmoji, !has && styles.dim]}>{has ? badge.emoji : '🔒'}</Text>
                  <Text style={styles.badgeName} numberOfLines={1}>
                    {t(`badge.${badge.id}`)}
                  </Text>
                  <Text style={styles.badgeDesc} numberOfLines={2}>
                    {t(`badge.${badge.id}.desc`)}
                  </Text>
                </View>
              );
            })}
          </View>
        </GlassCard>
      </ScrollView>
      {prize && <Confetti key={rewards.lastSurprise ?? 'prize'} colors={[palette.primary, ...palette.accents]} />}
    </View>
  );
}
