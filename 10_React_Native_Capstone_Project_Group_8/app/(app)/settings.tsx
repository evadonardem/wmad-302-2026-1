
/**
 * Settings Screen - Marketplace
 *
 * Features:
 * - System, Light, and Dark appearance preferences
 * - Dynamic theme-aware styling
 * - Interactive theme selection cards
 * - Current appearance summary
 * - Theme color preview
 * - Marketplace app information
 */

import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  IconButton,
  MD3Theme,
} from 'react-native-paper';
import { router } from 'expo-router';

import {
  useAppTheme,
  type ThemeMode,
} from '@/context/ThemeContext';

const THEME_OPTIONS: {
  value: ThemeMode;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    value: 'system',
    title: 'System Default',
    description: 'Automatically follow your device appearance.',
    icon: 'cellphone',
  },
  {
    value: 'light',
    title: 'Light Mode',
    description: 'Cool Slate and Pale Teal colors.',
    icon: 'white-balance-sunny',
  },
  {
    value: 'dark',
    title: 'Dark Mode',
    description: 'Deep Navy and Neon Teal colors.',
    icon: 'moon-waning-crescent',
  },
];

const createStyles = (colors: MD3Theme['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 12,
    },

    headerTitleContainer: {
      flex: 1,
      marginLeft: 4,
    },

    headerTitle: {
      color: colors.onBackground,
      fontSize: 23,
      fontWeight: '800',
    },

    headerSubtitle: {
      color: colors.onSurfaceVariant,
      fontSize: 12,
      marginTop: 2,
    },

    content: {
      paddingHorizontal: 18,
      paddingTop: 8,
      paddingBottom: 45,
    },

    introCard: {
      backgroundColor: colors.primaryContainer,
      borderRadius: 20,
      padding: 18,
      marginBottom: 28,
      flexDirection: 'row',
      alignItems: 'center',
    },

    introIcon: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },

    introTextContainer: {
      flex: 1,
    },

    introTitle: {
      color: colors.onPrimaryContainer,
      fontSize: 17,
      fontWeight: '800',
    },

    introDescription: {
      color: colors.onPrimaryContainer,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 5,
      opacity: 0.85,
    },

    sectionHeader: {
      marginBottom: 15,
    },

    sectionTitle: {
      color: colors.onBackground,
      fontSize: 19,
      fontWeight: '800',
    },

    sectionDescription: {
      color: colors.onSurfaceVariant,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 5,
    },

    currentCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 17,
      marginBottom: 22,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },

    currentLabel: {
      color: colors.onSurfaceVariant,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
    },

    currentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 13,
    },

    currentIcon: {
      width: 48,
      height: 48,
      borderRadius: 15,
      backgroundColor: colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 13,
    },

    currentTextContainer: {
      flex: 1,
    },

    currentValue: {
      color: colors.onSurface,
      fontSize: 17,
      fontWeight: '800',
    },

    currentDescription: {
      color: colors.onSurfaceVariant,
      fontSize: 12,
      marginTop: 4,
    },

    activeBadge: {
      backgroundColor: colors.primaryContainer,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },

    activeBadgeText: {
      color: colors.onPrimaryContainer,
      fontSize: 10,
      fontWeight: '800',
    },

    optionsContainer: {
      gap: 12,
    },

    optionCard: {
      backgroundColor: colors.surface,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
    },

    selectedOptionCard: {
      borderColor: colors.primary,
      borderWidth: 2,
      backgroundColor: colors.primaryContainer,
    },

    optionIcon: {
      width: 46,
      height: 46,
      borderRadius: 14,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 13,
    },

    selectedOptionIcon: {
      backgroundColor: colors.surface,
    },

    optionTextContainer: {
      flex: 1,
    },

    optionTitle: {
      color: colors.onSurface,
      fontSize: 14,
      fontWeight: '800',
    },

    selectedOptionTitle: {
      color: colors.onPrimaryContainer,
    },

    optionDescription: {
      color: colors.onSurfaceVariant,
      fontSize: 11,
      lineHeight: 17,
      marginTop: 4,
    },

    selectedOptionDescription: {
      color: colors.onPrimaryContainer,
    },

    selectionIndicator: {
      width: 23,
      height: 23,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.outline,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },

    selectedIndicator: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },

    selectionDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: colors.onPrimary,
    },

    loadingContainer: {
      paddingVertical: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },

    loadingText: {
      color: colors.onSurfaceVariant,
      fontSize: 13,
      marginTop: 10,
    },

    previewSection: {
      marginTop: 30,
    },

    previewCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 17,
      marginTop: 14,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },

    previewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    previewTitle: {
      color: colors.onSurface,
      fontSize: 15,
      fontWeight: '800',
    },

    previewSubtitle: {
      color: colors.onSurfaceVariant,
      fontSize: 11,
      marginTop: 4,
    },

    previewStatus: {
      backgroundColor: colors.primaryContainer,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
    },

    previewStatusText: {
      color: colors.onPrimaryContainer,
      fontSize: 10,
      fontWeight: '800',
    },

    colorSamples: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 20,
    },

    colorSample: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },

    colorSampleText: {
      fontSize: 10,
      fontWeight: '800',
    },

    previewButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: 'center',
      marginTop: 18,
    },

    previewButtonText: {
      color: colors.onPrimary,
      fontSize: 13,
      fontWeight: '800',
    },

    aboutSection: {
      marginTop: 32,
    },

    aboutCard: {
      backgroundColor: colors.surface,
      borderRadius: 17,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      marginTop: 13,
    },

    aboutRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    aboutIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },

    aboutTextContainer: {
      flex: 1,
    },

    aboutTitle: {
      color: colors.onSurface,
      fontSize: 14,
      fontWeight: '800',
    },

    aboutDescription: {
      color: colors.onSurfaceVariant,
      fontSize: 11,
      marginTop: 4,
    },

    versionBadge: {
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 9,
    },

    versionText: {
      color: colors.onSurfaceVariant,
      fontSize: 11,
      fontWeight: '700',
    },

    footer: {
      alignItems: 'center',
      marginTop: 28,
    },

    footerText: {
      color: colors.onSurfaceVariant,
      fontSize: 11,
    },

    footerBrand: {
      color: colors.primary,
      fontWeight: '800',
    },
  });

export default function SettingsScreen() {
  const {
    mode,
    resolvedMode,
    theme,
    setThemeMode,
    isThemeLoaded,
  } = useAppTheme();

  const colors = theme.colors;

  const styles = useMemo(
    () => createStyles(colors),
    [colors],
  );

  const selectedOption = THEME_OPTIONS.find(
    (option) => option.value === mode,
  );

  const handleThemeChange = (value: ThemeMode) => {
    if (value !== mode) {
      void setThemeMode(value);
    }
  };

  const isDark = resolvedMode === 'dark';

  const previewColors = isDark
    ? [
        { name: 'Background', color: '#071A22', textColor: '#E7F4F3' },
        { name: 'Surface', color: '#102B35', textColor: '#E7F4F3' },
        { name: 'Accent', color: '#2DD4BF', textColor: '#003731' },
        { name: 'Secondary', color: '#A3E635', textColor: '#243500' },
      ]
    : [
        { name: 'Background', color: '#F3F8F8', textColor: '#263746' },
        { name: 'Surface', color: '#FFFFFF', textColor: '#263746' },
        { name: 'Accent', color: '#0F766E', textColor: '#FFFFFF' },
        { name: 'Secondary', color: '#4D9D96', textColor: '#FFFFFF' },
      ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor={colors.onSurface}
          size={24}
          onPress={() => router.back()}
        />

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Customize your marketplace experience
          </Text>
        </View>

        <IconButton
          icon="cog-outline"
          iconColor={colors.primary}
          size={24}
          disabled
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Introduction */}
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <IconButton
              icon="tune-variant"
              iconColor={colors.primary}
              size={27}
              disabled
            />
          </View>

          <View style={styles.introTextContainer}>
            <Text style={styles.introTitle}>
              Personalize Your Experience
            </Text>

            <Text style={styles.introDescription}>
              Adjust your marketplace appearance to match your preference.
            </Text>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          <Text style={styles.sectionDescription}>
            Choose how the marketplace looks on your device.
          </Text>
        </View>

        {/* Current Appearance */}
        <View style={styles.currentCard}>
          <Text style={styles.currentLabel}>
            CURRENT APPEARANCE
          </Text>

          <View style={styles.currentRow}>
            <View style={styles.currentIcon}>
              <IconButton
                icon={selectedOption?.icon ?? 'theme-light-dark'}
                iconColor={colors.primary}
                size={25}
                disabled
              />
            </View>

            <View style={styles.currentTextContainer}>
              <Text style={styles.currentValue}>
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </Text>

              <Text style={styles.currentDescription}>
                {mode === 'system'
                  ? 'Following your device settings'
                  : 'Manually selected appearance'}
              </Text>
            </View>

            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>ACTIVE</Text>
            </View>
          </View>
        </View>

        {/* Theme Options */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Choose Theme</Text>

          <Text style={styles.sectionDescription}>
            Select your preferred appearance mode.
          </Text>
        </View>

        {isThemeLoaded ? (
          <View style={styles.optionsContainer}>
            {THEME_OPTIONS.map((option) => {
              const isSelected = mode === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.8}
                  onPress={() => handleThemeChange(option.value)}
                  style={[
                    styles.optionCard,
                    isSelected && styles.selectedOptionCard,
                  ]}
                >
                  <View
                    style={[
                      styles.optionIcon,
                      isSelected && styles.selectedOptionIcon,
                    ]}
                  >
                    <IconButton
                      icon={option.icon}
                      iconColor={
                        isSelected
                          ? colors.primary
                          : colors.onSurfaceVariant
                      }
                      size={23}
                      disabled
                    />
                  </View>

                  <View style={styles.optionTextContainer}>
                    <Text
                      style={[
                        styles.optionTitle,
                        isSelected && styles.selectedOptionTitle,
                      ]}
                    >
                      {option.title}
                    </Text>

                    <Text
                      style={[
                        styles.optionDescription,
                        isSelected &&
                          styles.selectedOptionDescription,
                      ]}
                    >
                      {option.description}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.selectionIndicator,
                      isSelected && styles.selectedIndicator,
                    ]}
                  >
                    {isSelected && (
                      <View style={styles.selectionDot} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />

            <Text style={styles.loadingText}>
              Loading saved appearance preference...
            </Text>
          </View>
        )}

        {/* Theme Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Theme Preview</Text>

          <Text style={styles.sectionDescription}>
            Preview the colors used by your selected appearance.
          </Text>

          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.previewTitle}>
                  Marketplace Colors
                </Text>

                <Text style={styles.previewSubtitle}>
                  {isDark ? 'Deep Navy + Neon Teal' : 'Cool Slate + Pale Teal'}
                </Text>
              </View>

              <View style={styles.previewStatus}>
                <Text style={styles.previewStatusText}>
                  {isDark ? 'DARK' : 'LIGHT'}
                </Text>
              </View>
            </View>

            <View style={styles.colorSamples}>
              {previewColors.map((sample) => (
                <View
                  key={sample.name}
                  style={[
                    styles.colorSample,
                    { backgroundColor: sample.color },
                  ]}
                >
                  <Text
                    style={[
                      styles.colorSampleText,
                      { color: sample.textColor },
                    ]}
                  >
                    {sample.name}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.previewButton}>
              <Text style={styles.previewButtonText}>
                Your Theme Is Active
              </Text>
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About</Text>

          <Text style={styles.sectionDescription}>
            Application information and version details.
          </Text>

          <View style={styles.aboutCard}>
            <View style={styles.aboutRow}>
              <View style={styles.aboutIcon}>
                <IconButton
                  icon="storefront-outline"
                  iconColor={colors.primary}
                  size={23}
                  disabled
                />
              </View>

              <View style={styles.aboutTextContainer}>
                <Text style={styles.aboutTitle}>
                  Marketplace App
                </Text>

                <Text style={styles.aboutDescription}>
                  Your shopping experience, simplified.
                </Text>
              </View>

              <View style={styles.versionBadge}>
                <Text style={styles.versionText}>
                  v1.0.0
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by{' '}
            <Text style={styles.footerBrand}>Marketplace</Text>
          </Text>

          <Text style={[styles.footerText, { marginTop: 5 }]}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
