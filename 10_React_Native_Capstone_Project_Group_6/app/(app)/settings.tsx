import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, SegmentedButtons, Text } from 'react-native-paper';
import { Screen } from '@/components/Screen';
import { spacing, useAppTheme } from '@/constants/theme';
import { useThemeMode } from '@/context/ThemeContext';

export default function SettingsScreen() {
  const theme = useAppTheme();
  const { mode, isReady, error, setMode } = useThemeMode();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleModeChange = async (value: string) => {
    if ((value !== 'light' && value !== 'dark') || value === mode || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await setMode(value);
    } catch (caught: unknown) {
      setSaveError(caught instanceof Error ? caught.message : 'Could not save your appearance setting.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={styles.content}>
        <Text variant="headlineSmall">Settings</Text>
        <Card mode="outlined" style={{ backgroundColor: theme.colors.surface }}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium">Appearance</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Choose how the app looks.
            </Text>
            <SegmentedButtons
              value={mode}
              onValueChange={(value) => void handleModeChange(value)}
              buttons={[
                { value: 'light', label: 'Light', icon: 'white-balance-sunny', disabled: !isReady || saving },
                { value: 'dark', label: 'Dark', icon: 'moon-waning-crescent', disabled: !isReady || saving },
              ]}
            />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Current mode: {mode === 'dark' ? 'Dark' : 'Light'}
            </Text>
            {error || saveError ? (
              <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                {saveError ?? error}
              </Text>
            ) : null}
          </Card.Content>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  cardContent: { gap: spacing.md },
});
