import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { IconButton, List, Switch, Text as PaperText, Title } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDark, mode, colors, setMode } = useAppTheme();
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)/(tabs)/profile');
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={goBack} />
        <View>
          <Title style={{ color: colors.text }}>Settings</Title>
          <PaperText variant="bodySmall" style={{ color: colors.textMuted }}>Make Cookbook feel like yours</PaperText>
        </View>
      </View>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>APPEARANCE</Text>
        <List.Item
          title="Dark mode"
          description={mode === 'system' ? 'Following your device setting' : isDark ? 'Easier on the eyes at night' : 'Light theme is active'}
          titleStyle={{ color: colors.text }}
          descriptionStyle={{ color: colors.textMuted }}
          left={(props) => <List.Icon {...props} icon={isDark ? 'moon-waning-crescent' : 'white-balance-sunny'} color={colors.primary} />}
          right={() => <Switch value={isDark} onValueChange={() => setMode(isDark ? 'light' : 'dark')} />}
        />
        <List.Item
          title="Use device theme"
          description="Automatically switch with your phone"
          titleStyle={{ color: colors.text }}
          descriptionStyle={{ color: colors.textMuted }}
          left={(props) => <List.Icon {...props} icon="cellphone-cog" color={colors.primary} />}
          right={() => <Switch value={mode === 'system'} onValueChange={(value) => setMode(value ? 'system' : isDark ? 'dark' : 'light')} />}
        />
      </View>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>APP PREFERENCES</Text>
        <List.Item
          title="Notifications"
          description="Notification preferences are managed locally on this device."
          titleStyle={{ color: colors.text }}
          descriptionStyle={{ color: colors.textMuted }}
          left={(props) => <List.Icon {...props} icon="bell-outline" color={colors.primary} />}
        />
        <List.Item
          title="Privacy"
          description="Your profile and saved recipes remain stored locally."
          titleStyle={{ color: colors.text }}
          descriptionStyle={{ color: colors.textMuted }}
          left={(props) => <List.Icon {...props} icon="shield-lock-outline" color={colors.primary} />}
        />
      </View>
      <Text style={[styles.footer, { color: colors.textMuted }]}>
        Additional settings will be available in a future update.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  section: { borderWidth: 1, borderRadius: 18, marginBottom: 16, overflow: 'hidden' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, paddingHorizontal: 16, paddingTop: 16 },
  footer: { marginTop: 8, lineHeight: 20, paddingHorizontal: 4 },
});
