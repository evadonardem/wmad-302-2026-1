
/**
 * Settings Screen - Marketplace
 * Includes System, Light, and Dark appearance preferences.
 */

import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import {
  Card,
  RadioButton,
  Divider,
  IconButton,
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

export default function SettingsScreen() {
  const {
    mode,
    resolvedMode,
    theme,
    setThemeMode,
    isThemeLoaded,
  } = useAppTheme();

  const colors = theme.colors;

  const handleThemeChange = (value: string) => {
    void setThemeMode(value as ThemeMode);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor={colors.onSurface}
          size={24}
          onPress={() => router.back()}
        />

        <Text
          style={[
            styles.headerTitle,
            { color: colors.onSurface },
          ]}
        >
          Settings
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.onSurface },
            ]}
          >
            Appearance
          </Text>

          <Text
            style={[
              styles.sectionDescription,
              { color: colors.onSurfaceVariant },
            ]}
          >
            Customize how the marketplace looks on your device.
          </Text>
        </View>

        <Card
          mode="elevated"
          style={[
            styles.card,
            { backgroundColor: colors.surface },
          ]}
        >
          <Card.Content>
            <View style={styles.currentTheme}>
              <Text
                style={[
                  styles.currentThemeLabel,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                CURRENT APPEARANCE
              </Text>

              <Text
                style={[
                  styles.currentThemeValue,
                  { color: colors.primary },
                ]}
              >
                {resolvedMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </Text>

              <Text
                style={[
                  styles.currentThemeDescription,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                {mode === 'system'
                  ? 'Following your device settings'
                  : 'Manually selected'}
              </Text>
            </View>

            <Divider
              style={[
                styles.divider,
                { backgroundColor: colors.outlineVariant },
              ]}
            />

            <Text
              style={[
                styles.optionHeading,
                { color: colors.onSurface },
              ]}
            >
              Choose Theme
            </Text>

            {isThemeLoaded ? (
              <RadioButton.Group
                onValueChange={handleThemeChange}
                value={mode}
              >
                {THEME_OPTIONS.map((option, index) => (
                  <View key={option.value}>
                    <RadioButton.Item
                      label={option.title}
                      value={option.value}
                      position="leading"
                      color={colors.primary}
                      uncheckedColor={colors.onSurfaceVariant}
                      labelStyle={[
                        styles.radioLabel,
                        { color: colors.onSurface },
                      ]}
                      style={styles.radioItem}
                    />

                    <Text
                      style={[
                        styles.optionDescription,
                        { color: colors.onSurfaceVariant },
                      ]}
                    >
                      {option.description}
                    </Text>

                    {index < THEME_OPTIONS.length - 1 && (
                      <Divider
                        style={[
                          styles.optionDivider,
                          { backgroundColor: colors.outlineVariant },
                        ]}
                      />
                    )}
                  </View>
                ))}
              </RadioButton.Group>
            ) : (
              <Text style={{ color: colors.onSurfaceVariant }}>
                Loading saved appearance preference...
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Theme Preview */}
        <View style={styles.previewSection}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.onSurface },
            ]}
          >
            Theme Preview
          </Text>

          <Card
            mode="elevated"
            style={[
              styles.previewCard,
              { backgroundColor: colors.surface },
            ]}
          >
            <Card.Content>
              <View style={styles.previewRow}>
                <View
                  style={[
                    styles.previewIcon,
                    { backgroundColor: colors.primaryContainer },
                  ]}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 22,
                    }}
                  >
                    ✓
                  </Text>
                </View>

                <View style={styles.previewTextContainer}>
                  <Text
                    style={[
                      styles.previewTitle,
                      { color: colors.onSurface },
                    ]}
                  >
                    Marketplace
                  </Text>

                  <Text
                    style={[
                      styles.previewDescription,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    Your selected theme is active.
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.previewButton,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.previewButtonText,
                    { color: colors.onPrimary },
                  ]}
                >
                  Theme Active
                </Text>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* About */}
        <View style={styles.aboutSection}>
          <Text
            style={[
              styles.aboutText,
              { color: colors.onSurfaceVariant },
            ]}
          >
            Marketplace App
          </Text>

          <Text
            style={[
              styles.versionText,
              { color: colors.onSurfaceVariant },
            ]}
          >
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 4,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  card: {
    borderRadius: 18,
  },
  currentTheme: {
    paddingVertical: 8,
  },
  currentThemeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  currentThemeValue: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  currentThemeDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  divider: {
    height: 1,
    marginVertical: 18,
  },
  optionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  radioItem: {
    paddingHorizontal: 0,
    minHeight: 48,
  },
  radioLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 42,
    marginTop: -2,
    marginBottom: 12,
  },
  optionDivider: {
    height: 1,
    marginBottom: 8,
  },
  previewSection: {
    marginTop: 28,
  },
  previewCard: {
    marginTop: 14,
    borderRadius: 18,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  previewDescription: {
    fontSize: 12,
    marginTop: 4,
  },
  previewButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  aboutSection: {
    alignItems: 'center',
    marginTop: 36,
  },
  aboutText: {
    fontSize: 14,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 12,
    marginTop: 5,
  },
});
