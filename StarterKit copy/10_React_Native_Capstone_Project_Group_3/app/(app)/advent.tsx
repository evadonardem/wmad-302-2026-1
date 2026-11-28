/**
 * Advent Calendar Screen - 24 doors, Dec 1–24. Each door flips open to reveal
 * points, a reward coupon or a deal. Door 1 can be opened early as a sneak peek.
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from 'react-native-paper';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSettings } from '@/context/SettingsContext';
import { useRewards } from '@/context/RewardsContext';
import { useThemedStyles } from '@/hooks';
import { LivelyBackground } from '@/components/LivelyBackground';
import { GlassCard } from '@/components/GlassCard';
import { Confetti } from '@/components/Confetti';
import { haptic } from '@/services/feedback';
import { AdventReward, canOpenAdventDoor, daysUntilAdvent, openedAdventDoors } from '@/utils/rewards';
import { makeCommon } from '@/styles/common';
import { makeRewardsStyles } from '@/styles/rewards';

const DOOR_EMOJI = ['🎄', '🎁', '⛄', '🔔', '⭐', '🦌', '🍪', '🧦'];

function rewardEmoji(reward: AdventReward): string {
  return reward.kind === 'points' ? '⭐' : reward.kind === 'coupon' ? '🎟️' : '🛍️';
}

interface DoorProps {
  day: number;
  opened: boolean;
  openable: boolean;
  color: string;
  textColor: string;
  onOpen: (day: number) => void;
}

function Door({ day, opened, openable, color, textColor, onOpen }: DoorProps) {
  const flip = useSharedValue(opened ? 1 : 0);

  useEffect(() => {
    flip.value = withTiming(opened ? 1 : 0, { duration: 600 });
  }, [opened, flip]);

  const doorStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 600 }, { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` }],
  }));
  const frontStyle = useAnimatedStyle(() => ({ opacity: flip.value < 0.5 ? 1 : 0 }));
  // The back is mirrored so it reads correctly after the 180° turn
  const backStyle = useAnimatedStyle(() => ({ opacity: flip.value >= 0.5 ? 1 : 0, transform: [{ scaleX: -1 }] }));

  return (
    <TouchableOpacity
      style={{ width: '22%' }}
      onPress={() => onOpen(day)}
      disabled={opened}
      accessibilityRole="button"
      accessibilityLabel={`Door ${day}${opened ? ', opened' : openable ? '' : ', locked'}`}
    >
      <Animated.View
        style={[
          { aspectRatio: 0.85, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
          { backgroundColor: opened ? '#FFFFFF' : color, borderColor: openable && !opened ? '#FFD54F' : color },
          doorStyle,
        ]}
      >
        <Animated.View style={[{ position: 'absolute', alignItems: 'center' }, frontStyle]}>
          <Text style={{ fontSize: 26, fontWeight: '900', color: textColor }}>{day}</Text>
          <Text style={{ fontSize: 12, marginTop: 2 }}>{openable ? DOOR_EMOJI[day % DOOR_EMOJI.length] : '🔒'}</Text>
        </Animated.View>
        <Animated.View style={[{ position: 'absolute' }, backStyle]}>
          <Text style={{ fontSize: 28 }}>✨</Text>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function AdventScreen() {
  const router = useRouter();
  const { palette, heading, t } = useSettings();
  const { rewards, openAdventDoor } = useRewards();
  const common = useThemedStyles(makeCommon);
  const styles = useThemedStyles(makeRewardsStyles);
  const [revealed, setRevealed] = useState<{ day: number; reward: AdventReward } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const now = new Date();
  const opened = openedAdventDoors(rewards, now);
  const countdown = daysUntilAdvent(now);
  const doorColors = [palette.primary, palette.secondary, ...palette.accents];

  const handleOpen = (day: number) => {
    const sneakPeek = countdown > 0 && day === 1;
    if (!canOpenAdventDoor(day, now, sneakPeek)) {
      haptic('warning');
      setNotice(t('advent.locked', { day }));
      return;
    }
    const reward = openAdventDoor(day, sneakPeek);
    if (!reward) return;
    haptic('success');
    setNotice(null);
    setRevealed({ day, reward });
  };

  const describe = (reward: AdventReward) =>
    reward.kind === 'points'
      ? t('advent.points', { amount: reward.amount })
      : reward.kind === 'coupon'
        ? t('rewards.wonCoupon', { code: reward.code })
        : t('advent.deal', { label: reward.label });

  return (
    <View style={common.screen}>
      <LivelyBackground />
      <ScrollView contentContainerStyle={common.scrollContent}>
        <Text style={[styles.sectionTitle, heading(30), { textAlign: 'center' }]}>🎄 {t('advent.title')}</Text>
        <Text style={styles.adventIntro}>
          {countdown > 0 ? t('advent.countdown', { days: countdown }) : t('advent.intro')}
        </Text>

        {revealed && (
          <GlassCard style={styles.rewardCard}>
            <Text style={styles.rewardEmoji}>{rewardEmoji(revealed.reward)}</Text>
            <Text style={styles.rewardText}>
              {t('advent.door', { day: revealed.day })} · {describe(revealed.reward)}
            </Text>
            {revealed.reward.kind === 'deal' && (
              <Button
                mode="contained"
                style={{ marginTop: 10 }}
                onPress={() =>
                  revealed.reward.kind === 'deal' &&
                  router.push({ pathname: '/search', params: revealed.reward.params })
                }
              >
                {t('advent.shop')}
              </Button>
            )}
            {revealed.reward.kind === 'coupon' && (
              <Button mode="contained" style={{ marginTop: 10 }} onPress={() => router.push('/cart')}>
                {t('rewards.useInCart')}
              </Button>
            )}
          </GlassCard>
        )}
        {notice && <Text style={styles.message}>{notice}</Text>}

        <View style={styles.doorGrid}>
          {Array.from({ length: 24 }, (_, index) => index + 1).map((day) => (
            <Door
              key={day}
              day={day}
              opened={opened.includes(day)}
              openable={canOpenAdventDoor(day, now, countdown > 0 && day === 1)}
              color={doorColors[day % doorColors.length]}
              textColor={day % doorColors.length < 2 ? palette.onPrimary : '#1A1A1A'}
              onOpen={handleOpen}
            />
          ))}
        </View>
      </ScrollView>
      {revealed && <Confetti key={revealed.day} colors={[palette.primary, ...palette.accents, '#FFFFFF']} />}
    </View>
  );
}
