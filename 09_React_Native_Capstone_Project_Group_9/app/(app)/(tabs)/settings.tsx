
import React, { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconButton, Title } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColorMode, useAppTheme } from '@/context/AppThemeContext';
import { profileThemes, ProfileThemeName } from './profile';

const PROFILE_THEME_KEY = 'profile_theme';
const themeLabels: Record<ProfileThemeName, string> = {
  citrus: 'Sage & Citrus',
  coral: 'Peach Coral',
  ocean: 'Ocean Breeze',
};

const appearanceOptions: {
  mode: AppColorMode;
  label: string;
  icon: 'white-balance-sunny' | 'weather-night';
}[] = [
  { mode: 'light', label: 'Light mode', icon: 'white-balance-sunny' },
  { mode: 'dark', label: 'Dark mode', icon: 'weather-night' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, mode, setMode, loadError } = useAppTheme();
  const [selectedTheme, setSelectedTheme] = useState<ProfileThemeName>('citrus');
  const [savingTheme, setSavingTheme] = useState(false);
  const [savingMode, setSavingMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PROFILE_THEME_KEY)
      .then((value) => {
        if (value && value in profileThemes) setSelectedTheme(value as ProfileThemeName);
      })
      .catch((error: unknown) => {
        Alert.alert('Could not load profile color theme', error instanceof Error ? error.message : 'Please try again.');
      });
  }, []);

  useEffect(() => {
    if (loadError) Alert.alert('Could not load appearance setting', loadError);
  }, [loadError]);

  const chooseTheme = async (theme: ProfileThemeName) => {
    setSavingTheme(true);
    try {
      await AsyncStorage.setItem(PROFILE_THEME_KEY, theme);
      setSelectedTheme(theme);
    } catch (error) {
      Alert.alert('Could not save profile color theme', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSavingTheme(false);
    }
  };

  const chooseMode = async (nextMode: AppColorMode) => {
    setSavingMode(true);
    try {
      await setMode(nextMode);
    } catch (error) {
      Alert.alert('Could not save appearance setting', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSavingMode(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 22 }}>
      <IconButton
        icon="arrow-left"
        onPress={() => router.back()}
        accessibilityLabel="Go back"
        iconColor={colors.text}
        style={{ marginLeft: -8 }}
      />
      <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }}>
        MAKE IT YOURS
      </Text>
      <Title style={{ color: colors.text, fontSize: 27, fontWeight: '800', marginTop: 4 }}>
        Settings
      </Title>
      <Text style={{ color: colors.muted, marginTop: 4, marginBottom: 22 }}>
        Choose how CookBook looks on this device.
      </Text>

      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 10 }}>
        Appearance
      </Text>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        {appearanceOptions.map((option) => {
          const selected = mode === option.mode;
          return (
            <TouchableOpacity
              key={option.mode}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: savingMode }}
              accessibilityLabel={option.label}
              disabled={savingMode}
              onPress={() => void chooseMode(option.mode)}
              style={{
                flex: 1,
                minHeight: 92,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? colors.accent : colors.border,
                borderRadius: 16,
                backgroundColor: selected ? colors.surfaceVariant : colors.surface,
                opacity: savingMode ? 0.7 : 1,
              }}
            >
              <MaterialCommunityIcons
                name={option.icon}
                size={26}
                color={selected ? colors.accent : colors.muted}
                accessible={false}
              />
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 4 }}>
        Profile color mood
      </Text>
      <Text style={{ color: colors.muted, marginBottom: 12 }}>
        Customize the accent colors on your profile.
      </Text>
      <View style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
      }}>
        {(Object.keys(profileThemes) as ProfileThemeName[]).map((theme) => {
          const themeColors = profileThemes[theme];
          const selected = selectedTheme === theme;
          return (
            <TouchableOpacity
              key={theme}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: savingTheme }}
              disabled={savingTheme}
              onPress={() => void chooseTheme(theme)}
              style={{
                minHeight: 72,
                flexDirection: 'row',
                alignItems: 'center',
                borderBottomWidth: theme === 'ocean' ? 0 : 1,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{
                width: 38,
                height: 38,
                borderRadius: 14,
                backgroundColor: themeColors.tint,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: themeColors.accent }} />
              </View>
              <Text style={{ flex: 1, color: colors.text, fontSize: 15, fontWeight: '700', marginLeft: 13 }}>
                {themeLabels[theme]}
              </Text>
              <MaterialCommunityIcons
                name={selected ? 'check-circle' : 'circle-outline'}
                size={20}
                color={selected ? colors.accent : colors.muted}
                accessible={false}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 14 }}>
        Your appearance and profile color choices are saved on this device.
      </Text>
    </View>
  );
}
