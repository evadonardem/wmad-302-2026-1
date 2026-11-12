import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GeneralSettings } from '../../components/GeneralSettings';
import { useTheme } from '../../theme';

// TODO 15: Settings Screen Component
export default function SettingsScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>App Settings</Text>
      <GeneralSettings />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
});