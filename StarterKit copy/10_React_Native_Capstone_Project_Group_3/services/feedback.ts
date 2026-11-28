/**
 * Tactile and audio feedback: haptics on iOS/Android (no-op on web) and the
 * short theme sounds from assets/sounds (only when "Theme sounds" is on).
 */
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import type { ThemeSeason } from '@/types/account';

const SOUND_FILES: Record<ThemeSeason, number> = {
  lively: require('../assets/sounds/lively.wav'),
  christmas: require('../assets/sounds/christmas.wav'),
  winter: require('../assets/sounds/winter.wav'),
  spring: require('../assets/sounds/spring.wav'),
  summer: require('../assets/sounds/summer.wav'),
  rainy: require('../assets/sounds/rainy.wav'),
  autumn: require('../assets/sounds/autumn.wav'),
  halloween: require('../assets/sounds/halloween.wav'),
};

export type HapticKind = 'light' | 'success' | 'warning';

export function haptic(kind: HapticKind = 'light'): void {
  if (Platform.OS === 'web') return;
  const run =
    kind === 'light'
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : Haptics.notificationAsync(
          kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
        );
  run.catch(() => undefined);
}

/** Plays the season's sound once and unloads it when finished. Never throws. */
export async function playSeasonSound(season: ThemeSeason): Promise<void> {
  try {
    const { sound } = await Audio.Sound.createAsync(SOUND_FILES[season], { shouldPlay: true, volume: 0.6 });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) sound.unloadAsync().catch(() => undefined);
    });
  } catch {
    // Audio is a nice-to-have (e.g. blocked autoplay on web)
  }
}
