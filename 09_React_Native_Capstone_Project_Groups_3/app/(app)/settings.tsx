/**
 * Settings Screen - Cookbook
 * Route: /settings  (opened from Profile)
 *
 * Preferences are saved in AsyncStorage under the 'user_settings' key.
 * Confirmations use Paper dialogs (React Native's Alert buttons do not work on web).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Button, Dialog, Divider, List, Portal, Snackbar, Switch, Text, useTheme } from 'react-native-paper';
import { useAuth } from '@/context/AuthContext';
import { favoritesStorage, getStorageItem, setStorageItem } from '@/utils/storage';

interface UserSettings {
  recipeReminders: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  recipeReminders: false,
};

type ConfirmAction = 'clearFavorites' | 'logout' | null;

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { logout } = useAuth();

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [stored, favoriteIds] = await Promise.all([
      getStorageItem<UserSettings>('user_settings'),
      favoritesStorage.getIds(),
    ]);
    setSettings({ ...DEFAULT_SETTINGS, ...stored });
    setFavoriteCount(favoriteIds.length);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateSetting = async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    try {
      await setStorageItem('user_settings', next);
    } catch {
      setMessage('Could not save the setting');
    }
  };

  const handleConfirm = async () => {
    const action = confirm;
    setConfirm(null);
    if (action === 'clearFavorites') {
      await favoritesStorage.setIds([]);
      setFavoriteCount(0);
      setMessage('Favorites cleared');
    } else if (action === 'logout') {
      logout();
    }
  };

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerShown: true, title: 'Settings' }} />

      <List.Section>
        <List.Subheader>Account</List.Subheader>
        <List.Item
          title="Edit Profile"
          description="Name and email"
          left={(props) => <List.Icon {...props} icon="account-edit" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/edit-profile')}
        />
      </List.Section>
      <Divider />

      <List.Section>
        <List.Subheader>Preferences</List.Subheader>
        <List.Item
          title="Recipe reminders"
          description="Saved on this device"
          left={(props) => <List.Icon {...props} icon="bell-outline" />}
          right={() => (
            <Switch
              value={settings.recipeReminders}
              onValueChange={(value) => updateSetting('recipeReminders', value)}
            />
          )}
        />
      </List.Section>
      <Divider />

      <List.Section>
        <List.Subheader>Data</List.Subheader>
        <List.Item
          title="Clear favorites"
          description={`${favoriteCount} saved recipe${favoriteCount === 1 ? '' : 's'}`}
          left={(props) => <List.Icon {...props} icon="heart-off-outline" />}
          onPress={() => setConfirm('clearFavorites')}
          disabled={favoriteCount === 0}
        />
      </List.Section>
      <Divider />

      <List.Section>
        <List.Subheader>About</List.Subheader>
        <List.Item
          title="Version"
          description="Cookbook v1.0.0"
          left={(props) => <List.Icon {...props} icon="information-outline" />}
        />
        <List.Item
          title="Recipe data"
          description="DummyJSON Recipes API"
          left={(props) => <List.Icon {...props} icon="database-outline" />}
        />
      </List.Section>

      <Button
        mode="outlined"
        icon="logout"
        textColor={theme.colors.error}
        style={[styles.logoutButton, { borderColor: theme.colors.error }]}
        onPress={() => setConfirm('logout')}
      >
        Logout
      </Button>

      <Portal>
        <Dialog visible={confirm !== null} onDismiss={() => setConfirm(null)}>
          <Dialog.Title>{confirm === 'logout' ? 'Logout' : 'Clear favorites'}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {confirm === 'logout'
                ? 'Are you sure you want to logout?'
                : 'This removes all your saved recipes. This cannot be undone.'}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirm(null)}>Cancel</Button>
            <Button textColor={theme.colors.error} onPress={handleConfirm}>
              {confirm === 'logout' ? 'Logout' : 'Clear'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={message !== null} onDismiss={() => setMessage(null)} duration={1500}>
        {message}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 16,
  },
});
