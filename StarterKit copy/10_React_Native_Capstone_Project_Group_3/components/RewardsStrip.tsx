/**
 * Home strip under the hero: streak, seasonal points and a one-tap daily
 * check-in. Tapping the strip opens Rewards.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from 'react-native-paper';
import { useSettings } from '@/context/SettingsContext';
import { useRewards } from '@/context/RewardsContext';
import { SEASONS } from '@/constants/seasons';
import { haptic } from '@/services/feedback';
import { GlassCard } from './GlassCard';

export function RewardsStrip() {
  const router = useRouter();
  const { palette, season, t } = useSettings();
  const { rewards, streak, checkedInToday, checkIn } = useRewards();

  return (
    <GlassCard style={styles.card}>
      <View style={styles.row}>
      {/* Stats open Rewards; the check-in button is a sibling (a button can't contain a button on web) */}
      <TouchableOpacity
        style={styles.stats}
        onPress={() => router.push('/rewards')}
        accessibilityRole="button"
        accessibilityLabel={t('title.rewards')}
      >
        <View style={styles.stat}>
          <Text style={styles.value}>🔥 {streak}</Text>
          <Text style={[styles.label, { color: palette.textMuted }]}>{t('rewards.streakShort')}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.value}>
            {SEASONS[season].emoji} {rewards.points}
          </Text>
          <Text style={[styles.label, { color: palette.textMuted }]}>{t(`points.${season}`)}</Text>
        </View>
      </TouchableOpacity>
        <Button
          mode={checkedInToday ? 'text' : 'contained'}
          compact
          icon={checkedInToday ? 'check' : 'calendar-check'}
          onPress={() => {
            if (checkIn() !== null) haptic('success');
            else router.push('/rewards');
          }}
        >
          {checkedInToday ? t('rewards.done') : t('rewards.checkInShort')}
        </Button>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 0,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
    minWidth: 70,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
