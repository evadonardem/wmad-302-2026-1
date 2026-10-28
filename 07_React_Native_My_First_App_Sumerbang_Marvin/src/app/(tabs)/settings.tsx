import React from 'react';
import { StyleSheet, View } from 'react-native';
import GeneralSettings, { type SettingsAction } from '@/components/GeneralSettings';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeMode } from '@/theme';

  export default function SettingsScreen() {
  const theme = useTheme();
  const { isDarkMode, setIsDarkMode } = useThemeMode();

  // TODO 15 [Data Actions Mapping]: Populate the 'actions' configuration array below.
  const actions: SettingsAction[] = [
    {
      icon: isDarkMode 
        ? <Ionicons name="sunny" size={20} color={theme.colors.text} /> 
        : <Ionicons name="moon" size={20} color={theme.colors.text} />,
      name: isDarkMode ? "Light Mode" : "Dark Mode",
      onPress: () => setIsDarkMode(!isDarkMode),
    },
  ];

  return (
    <GeneralSettings actions={actions} />
  );
}

      const actions: SettingsAction[] = [
  {
    icon: isDarkMode 
      ? <Ionicons name="sunny" size={22} color={theme.colors.text} />
      : <Ionicons name="moon" size={22} color={theme.colors.text} />,
    name: isDarkMode ? 'Light Mode' : 'Dark Mode',
    onPress: () => setIsDarkMode(!isDarkMode),
  },
  { icon: <Ionicons name="color-palette" size={22} color={theme.colors.text} />, name: 'Theme' },
  { icon: <Ionicons name="print" size={22} color={theme.colors.text} />, name: 'Print' },
  { icon: <Ionicons name="share-social" size={22} color={theme.colors.text} />, name: 'Share' },
];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GeneralSettings actions={actions} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    padding: 16,
  },
});
