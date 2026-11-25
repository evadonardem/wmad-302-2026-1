
/**
 * Settings Screen - Cookbook App
 * Manages notification settings, appearance, and cooking preferences.
 * All settings are saved locally.
 */

import React from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
} from 'react-native';

import {
  Appbar,
  Card,
  Chip,
  Divider,
  RadioButton,
  Switch,
  Text,
  useTheme,
} from 'react-native-paper';

import { useRouter } from 'expo-router';

import {
  CookingDifficulty,
  ThemeMode,
  useSettings,
} from '@/context/SettingsContext';

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Gluten-Free',
  'Dairy-Free',
  'Halal',
  'Low-Carb',
];

const CUISINE_OPTIONS = [
  'Filipino',
  'Italian',
  'Chinese',
  'Japanese',
  'Korean',
  'Mexican',
  'Indian',
  'Thai',
  'Mediterranean',
];

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();

  const {
    settings,
    updateSettings,
  } = useSettings();

  const toggleDietaryPreference = async (value: string) => {
    const current = settings.dietaryPreferences;

    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    await updateSettings({
      dietaryPreferences: updated,
    });
  };

  const toggleCuisine = async (value: string) => {
    const current = settings.preferredCuisines;

    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    await updateSettings({
      preferredCuisines: updated,
    });
  };

  const updateTheme = async (value: string) => {
    await updateSettings({
      themeMode: value as ThemeMode,
    });
  };

  const updateDifficulty = async (value: string) => {
    await updateSettings({
      cookingDifficulty: value as CookingDifficulty,
    });
  };

  const updateNotification = async (
    key:
      | 'recipeRecommendations'
      | 'mealPlanReminders'
      | 'newRecipes',
    value: boolean
  ) => {
    await updateSettings({
      notifications: {
        ...settings.notifications,
        [key]: value,
      },
    });
  };

  const colors = theme.colors;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <Appbar.Header
        style={{ backgroundColor: colors.surface }}
        elevated
      >
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Settings" />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text
          variant="bodyMedium"
          style={[
            styles.introduction,
            { color: colors.onSurfaceVariant },
          ]}
        >
          Customize your Cookbook experience and manage
          your cooking preferences.
        </Text>

        {/* NOTIFICATIONS */}
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: colors.primary }]}
        >
          Notifications
        </Text>

        <Card
          mode="elevated"
          style={[
            styles.card,
            { backgroundColor: colors.surface },
          ]}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingDescription}>
              <Text variant="bodyLarge" style={{ color: colors.onSurface }}>
                Recipe Recommendations
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: colors.onSurfaceVariant }}
              >
                Receive recipe recommendation preferences.
              </Text>
            </View>

            <Switch
              value={settings.notifications.recipeRecommendations}
              onValueChange={(value) =>
                void updateNotification('recipeRecommendations', value)
              }
              color={colors.primary}
            />
          </View>

          <Divider />

          <View style={styles.settingRow}>
            <View style={styles.settingDescription}>
              <Text variant="bodyLarge" style={{ color: colors.onSurface }}>
                Meal Plan Reminders
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: colors.onSurfaceVariant }}
              >
                Enable your meal reminder preference.
              </Text>
            </View>

            <Switch
              value={settings.notifications.mealPlanReminders}
              onValueChange={(value) =>
                void updateNotification('mealPlanReminders', value)
              }
              color={colors.primary}
            />
          </View>

          <Divider />

          <View style={styles.settingRow}>
            <View style={styles.settingDescription}>
              <Text variant="bodyLarge" style={{ color: colors.onSurface }}>
                New Recipes
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: colors.onSurfaceVariant }}
              >
                Enable preferences for new recipe updates.
              </Text>
            </View>

            <Switch
              value={settings.notifications.newRecipes}
              onValueChange={(value) =>
                void updateNotification('newRecipes', value)
              }
              color={colors.primary}
            />
          </View>
        </Card>

        <Text
          variant="bodySmall"
          style={[styles.note, { color: colors.onSurfaceVariant }]}
        >
          These switches save your notification preferences.
          Actual push notifications are not connected yet.
        </Text>

        {/* APPEARANCE */}
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: colors.primary }]}
        >
          Appearance
        </Text>

        <Card
          mode="elevated"
          style={[
            styles.card,
            { backgroundColor: colors.surface },
          ]}
        >
          <Card.Content>
            <Text
              variant="bodyLarge"
              style={{ color: colors.onSurface }}
            >
              Choose your app theme
            </Text>

            <Text
              variant="bodySmall"
              style={[
                styles.description,
                { color: colors.onSurfaceVariant },
              ]}
            >
              Select how Cookbook should look.
            </Text>
          </Card.Content>

          <RadioButton.Group
            onValueChange={(value) => void updateTheme(value)}
            value={settings.themeMode}
          >
            <RadioButton.Item
              label="Light Mode"
              value="light"
              color={colors.primary}
            />
            <RadioButton.Item
              label="Dark Mode"
              value="dark"
              color={colors.primary}
            />
            <RadioButton.Item
              label="System Default"
              value="system"
              color={colors.primary}
            />
          </RadioButton.Group>
        </Card>

        {/* DIETARY PREFERENCES */}
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: colors.primary }]}
        >
          Dietary Preferences
        </Text>

        <Card
          mode="elevated"
          style={[
            styles.card,
            { backgroundColor: colors.surface },
          ]}
        >
          <Card.Content>
            <Text
              variant="bodyMedium"
              style={[
                styles.description,
                { color: colors.onSurfaceVariant },
              ]}
            >
              Select the dietary preferences that apply to you.
              You can select more than one.
            </Text>

            <View style={styles.chipContainer}>
              {DIETARY_OPTIONS.map((item) => {
                const selected =
                  settings.dietaryPreferences.includes(item);

                return (
                  <Chip
                    key={item}
                    selected={selected}
                    onPress={() => void toggleDietaryPreference(item)}
                    showSelectedCheck
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected
                          ? colors.primaryContainer
                          : colors.surfaceVariant,
                      },
                    ]}
                    textStyle={{
                      color: colors.onSurface,
                    }}
                  >
                    {item}
                  </Chip>
                );
              })}
            </View>
          </Card.Content>
        </Card>

        {/* PREFERRED CUISINES */}
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: colors.primary }]}
        >
          Preferred Cuisines
        </Text>

        <Card
          mode="elevated"
          style={[
            styles.card,
            { backgroundColor: colors.surface },
          ]}
        >
          <Card.Content>
            <Text
              variant="bodyMedium"
              style={[
                styles.description,
                { color: colors.onSurfaceVariant },
              ]}
            >
              Choose the cuisines you enjoy.
            </Text>

            <View style={styles.chipContainer}>
              {CUISINE_OPTIONS.map((item) => {
                const selected =
                  settings.preferredCuisines.includes(item);

                return (
                  <Chip
                    key={item}
                    selected={selected}
                    onPress={() => void toggleCuisine(item)}
                    showSelectedCheck
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected
                          ? colors.primaryContainer
                          : colors.surfaceVariant,
                      },
                    ]}
                    textStyle={{
                      color: colors.onSurface,
                    }}
                  >
                    {item}
                  </Chip>
                );
              })}
            </View>
          </Card.Content>
        </Card>

        {/* COOKING DIFFICULTY */}
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: colors.primary }]}
        >
          Cooking Difficulty
        </Text>

        <Card
          mode="elevated"
          style={[
            styles.card,
            { backgroundColor: colors.surface },
          ]}
        >
          <Card.Content>
            <Text
              variant="bodyMedium"
              style={[
                styles.description,
                { color: colors.onSurfaceVariant },
              ]}
            >
              Choose your preferred recipe difficulty.
            </Text>
          </Card.Content>

          <RadioButton.Group
            onValueChange={(value) => void updateDifficulty(value)}
            value={settings.cookingDifficulty}
          >
            <RadioButton.Item
              label="Any Difficulty"
              value="Any"
              color={colors.primary}
            />
            <RadioButton.Item
              label="Easy"
              value="Easy"
              color={colors.primary}
            />
            <RadioButton.Item
              label="Medium"
              value="Medium"
              color={colors.primary}
            />
            <RadioButton.Item
              label="Hard"
              value="Hard"
              color={colors.primary}
            />
          </RadioButton.Group>
        </Card>

        <Text
          variant="bodySmall"
          style={[
            styles.footer,
            { color: colors.onSurfaceVariant },
          ]}
        >
          Your settings are saved automatically on this device.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  introduction: {
    marginBottom: 12,
    lineHeight: 21,
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    fontWeight: '700',
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  settingRow: {
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  settingDescription: {
    flex: 1,
    gap: 4,
  },
  description: {
    marginTop: 5,
    lineHeight: 20,
  },
  note: {
    marginTop: 10,
    lineHeight: 18,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  chip: {
    marginBottom: 2,
  },
  footer: {
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 20,
  },
});
