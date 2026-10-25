import { Alert, Platform, Share, StyleSheet, View } from 'react-native';
import GeneralSettings, { type SettingsAction } from '@/components/GeneralSettings';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeMode } from '@/theme';

export default function SettingsScreen() {
  const theme = useTheme();
  const { isDarkMode, setIsDarkMode } = useThemeMode();

  const handlePrint = () => {
    if (Platform.OS === 'web') {
      window.print();
    } else {
      Alert.alert('Print', 'Printing is only supported on Web browsers.');
    }
  };

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: 'Dynamic Quote Generator',
            text: 'Check out this awesome Quote Generator App!',
            url: window.location.href,
          });
        } else {
          await navigator.clipboard.writeText(window.location.href);
          alert('App link copied to clipboard!');
        }
      } else {
        await Share.share({
          message: 'Check out this awesome Quote Generator App!',
        });
      }
    } catch {
      // Direct catch fallback
    }
  };

  const handleTheme = () => {
    if (Platform.OS === 'web') {
      alert(`Current palette mode is active: ${isDarkMode ? 'Dark Mode' : 'Light Mode'}`);
    } else {
      Alert.alert('Theme Settings', `Current mode active: ${isDarkMode ? 'Dark' : 'Light'}`);
    }
  };

  const actions: SettingsAction[] = [
    {
      icon: isDarkMode ? (
        <Ionicons name="sunny" size={22} color={theme.colors.text} />
      ) : (
        <Ionicons name="moon" size={22} color={theme.colors.text} />
      ),
      name: isDarkMode ? 'Light Mode' : 'Dark Mode',
      onPress: () => setIsDarkMode((prev) => !prev),
    },
    {
      icon: <Ionicons name="color-palette" size={22} color={theme.colors.text} />,
      name: 'Theme',
      onPress: handleTheme,
    },
    {
      icon: <Ionicons name="print" size={22} color={theme.colors.text} />,
      name: 'Print',
      onPress: handlePrint,
    },
    {
      icon: <Ionicons name="share-social" size={22} color={theme.colors.text} />,
      name: 'Share',
      onPress: handleShare,
    },
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