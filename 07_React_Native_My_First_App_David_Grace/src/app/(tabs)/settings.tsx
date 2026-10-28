import { StyleSheet, Text, View } from 'react-native';
import GeneralSettings, { type SettingsAction } from '@/components/GeneralSettings';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeMode } from '@/theme';

export default function SettingsScreen() {
  const theme = useTheme();
  const { isDarkMode, setIsDarkMode } = useThemeMode();

  const actions: SettingsAction[] = [
    {
      icon: (
        <Ionicons
          name={isDarkMode ? 'sunny' : 'moon'}
          size={22}
          color={theme.colors.text}
        />
      ),
      name: isDarkMode ? 'Light Mode' : 'Dark Mode',
      onPress: () => setIsDarkMode((current) => !current),
    },
    { icon: <Ionicons name="color-palette" size={22} color={theme.colors.text} />, name: 'Theme' },
    { icon: <Ionicons name="print" size={22} color={theme.colors.text} />, name: 'Print' },
    { icon: <Ionicons name="share-social" size={22} color={theme.colors.text} />, name: 'Share' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.heading}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Your space</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Make the app feel like yours.
        </Text>
      </View>
      <GeneralSettings actions={actions} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    padding: 16,
    gap: 18,
  },
  heading: {
    paddingHorizontal: 4,
    gap: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
  },
});