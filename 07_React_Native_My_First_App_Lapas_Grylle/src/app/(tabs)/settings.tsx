import { StyleSheet, Text, View, SafeAreaView, ScrollView } from 'react-native';
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
          color={theme.colors.primary}
        />
      ),
      name: isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      onPress: () => setIsDarkMode((current) => !current),
    },
    { icon: <Ionicons name="color-palette" size={22} color={theme.colors.primary} />, name: 'Theme Colors' },
    { icon: <Ionicons name="print" size={22} color={theme.colors.primary} />, name: 'Print Quote' },
    { icon: <Ionicons name="share-social" size={22} color={theme.colors.primary} />, name: 'Share App' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Your space</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Make the app feel like yours.
          </Text>
        </View>
        
        <GeneralSettings actions={actions} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 40,
    gap: 32,
  },
  heading: {
    gap: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
  },
});