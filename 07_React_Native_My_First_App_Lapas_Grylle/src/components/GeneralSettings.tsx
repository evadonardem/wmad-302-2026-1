import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

// TODO 12: Settings Row with System-wide Theme Toggle
export const GeneralSettings: React.FC = () => {
  const { isDarkMode, toggleTheme, theme } = useTheme();

  return (
    <View style={[styles.settingRow, { backgroundColor: theme.cardBg }]}>
      <Text style={[styles.label, { color: theme.text }]}>Dark Theme</Text>
      <Switch value={isDarkMode} onValueChange={toggleTheme} />
    </View>
  );
};

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  label: { fontSize: 16, fontWeight: '500' },
});