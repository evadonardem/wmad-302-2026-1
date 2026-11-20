/**
 * Countdown timer for a recipe step ("Bake for 25 minutes").
 * Tap to start, tap again to pause/resume, long-press to reset.
 * When it finishes the phone vibrates and shows an alert.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { fontFamily, radius, useAppTheme } from '@/constants/theme';
import { formatSeconds } from '@/utils/ingredients';

type TimerStatus = 'idle' | 'running' | 'paused' | 'done';

interface StepTimerProps {
  minutes: number;
  /** Shown in the "time's up" alert, e.g. "Step 3" */
  label: string;
  large?: boolean;
}

export function StepTimer({ minutes, label, large = false }: StepTimerProps) {
  const theme = useAppTheme();
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [remaining, setRemaining] = useState(minutes * 60);
  const endAt = useRef<number | null>(null);

  useEffect(() => {
    if (status !== 'running') return;
    const interval = setInterval(() => {
      if (endAt.current === null) return;
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        setStatus('done');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Alert.alert("⏰ Time's up!", `${label} is done.`);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [status, label]);

  const handlePress = () => {
    if (status === 'idle' || status === 'paused') {
      endAt.current = Date.now() + remaining * 1000;
      setStatus('running');
      Haptics.selectionAsync().catch(() => {});
    } else if (status === 'running') {
      setStatus('paused');
    } else {
      reset();
    }
  };

  const reset = () => {
    endAt.current = null;
    setRemaining(minutes * 60);
    setStatus('idle');
  };

  const config: Record<TimerStatus, { icon: keyof typeof MaterialCommunityIcons.glyphMap; text: string }> = {
    idle: { icon: 'timer-outline', text: `Start ${minutes} min timer` },
    running: { icon: 'timer-sand', text: `${formatSeconds(remaining)}  ·  tap to pause` },
    paused: { icon: 'play-circle-outline', text: `${formatSeconds(remaining)}  ·  paused` },
    done: { icon: 'check-circle', text: 'Done! Tap to reset' },
  };
  const { icon, text } = config[status];
  const active = status === 'running' || status === 'done';

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={reset}
      accessibilityRole="button"
      accessibilityLabel={`${label} timer: ${text}`}
      style={[
        styles.pill,
        large && styles.pillLarge,
        {
          backgroundColor: active ? theme.colors.primary : theme.colors.primaryContainer,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={large ? 24 : 18}
        color={active ? theme.colors.onPrimary : theme.colors.primary}
      />
      <Text
        style={[
          styles.text,
          large && styles.textLarge,
          { color: active ? theme.colors.onPrimary : theme.colors.onPrimaryContainer },
        ]}
      >
        {text}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 10,
  },
  pillLarge: {
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 14,
    marginTop: 24,
  },
  text: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
  },
  textLarge: {
    fontSize: 18,
  },
});
