/**
 * Theme picker: one preview card per theme in its own colors, with swatches.
 * Used in Settings and in the first-launch onboarding.
 */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettings } from '@/context/SettingsContext';
import { useThemedStyles } from '@/hooks';
import { getPalette } from '@/constants/palettes';
import { resolveSeason, SEASONS } from '@/constants/seasons';
import { haptic } from '@/services/feedback';
import { THEME_SEASONS, type SeasonSetting } from '@/types/account';
import { makeAccountStyles } from '@/styles/account';

const SEASON_OPTIONS: SeasonSetting[] = ['auto', ...THEME_SEASONS];

export function SeasonPicker() {
  const { settings, updateSettings, palette, isDark, t } = useSettings();
  const styles = useThemedStyles(makeAccountStyles);

  return (
    <View style={styles.seasonGrid}>
      {SEASON_OPTIONS.map((option) => {
        const selected = settings.seasonTheme === option;
        // Preview each theme in its own colors ("auto" previews today's pick)
        const preview = getPalette(isDark, resolveSeason(option));
        return (
          <TouchableOpacity
            key={option}
            onPress={() => {
              haptic('light');
              updateSettings({ seasonTheme: option });
            }}
            style={[
              styles.seasonCard,
              { backgroundColor: preview.primary, borderColor: selected ? palette.text : 'transparent' },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={t(`season.${option}`)}
          >
            <Text style={styles.seasonCardEmoji}>{option === 'auto' ? '✨' : SEASONS[option].emoji}</Text>
            <Text style={[styles.seasonCardName, { color: preview.onPrimary }]} numberOfLines={1}>
              {t(`season.${option}`)}
            </Text>
            <View style={styles.swatchRow}>
              {[preview.secondary, ...preview.accents].map((color, index) => (
                <View key={index} style={[styles.swatch, { backgroundColor: color, borderColor: preview.onPrimary }]} />
              ))}
            </View>
            {selected && (
              <View style={[styles.seasonCheck, { backgroundColor: preview.onPrimary }]}>
                <MaterialCommunityIcons name="check-bold" size={12} color={preview.primary} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
