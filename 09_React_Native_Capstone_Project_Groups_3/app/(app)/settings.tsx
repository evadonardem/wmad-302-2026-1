/**
 * Settings Screen - Cookbook
 * Route: /settings  (opened from Profile)
 *
 * Preferences are saved in AsyncStorage under the 'user_settings' key.
 * Appearance (System / Light / Dark) is handled by ThemeContext.
 * Confirmations use Paper dialogs (React Native's Alert buttons do not work on web).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Button,
  Dialog,
  Divider,
  List,
  Portal,
  SegmentedButtons,
  Snackbar,
  Switch,
  Text,
  useTheme,
} from 'react-native-paper';
import { useAuth } from '@/context/AuthContext';
import { ThemePreference, useThemePreference } from '@/context/ThemeContext';
import { getStorageItem, setStorageItem } from '@/utils/storage';
import { useCookbook } from '@/context/CookbookContext';

interface UserSettings {
  recipeReminders: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  recipeReminders: false,
};

type ConfirmAction = 'clearFavorites' | 'clearShopping' | 'clearHistory' | 'logout';

const CONFIRM_TEXT: Record<ConfirmAction, { title: string; body: string; button: string }> = {
  clearFavorites: { title: 'Clear favorites', body: 'This removes all your saved recipes. This cannot be undone.', button: 'Clear' },
  clearShopping: { title: 'Clear shopping list', body: 'This removes every item from your shopping list.', button: 'Clear' },
  clearHistory: { title: 'Clear cooking history', body: 'This resets your cooked recipes, streak and recently viewed list.', button: 'Clear' },
  logout: { title: 'Logout', body: 'Are you sure you want to logout?', button: 'Logout' },
};

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { logout } = useAuth();
  const { preference, setPreference } = useThemePreference();

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const { favorites, shopping, cooked, clearFavorites, clearShopping, clearHistory } = useCookbook();
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const stored = await getStorageItem<UserSettings>('user_settings');
    setSettings({ ...DEFAULT_SETTINGS, ...stored });
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
      clearFavorites();
      setMessage('Favorites cleared');
    } else if (action === 'clearShopping') {
      clearShopping();
      setMessage('Shopping list cleared');
    } else if (action === 'clearHistory') {
      clearHistory();
      setMessage('Cooking history cleared');
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
        <List.Subheader>Appearance</List.Subheader>
        <SegmentedButtons
          style={styles.segmented}
          value={preference}
          onValueChange={(value) => setPreference(value as ThemePreference)}
          buttons={[
            { value: 'system', label: 'System', icon: 'theme-light-dark' },
            { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
            { value: 'dark', label: 'Dark', icon: 'weather-night' },
          ]}
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
          description={`${favorites.length} saved recipe${favorites.length === 1 ? '' : 's'}`}
          left={(props) => <List.Icon {...props} icon="heart-off-outline" />}
          onPress={() => setConfirm('clearFavorites')}
          disabled={favorites.length === 0}
        />
        <List.Item
          title="Clear shopping list"
          description={`${shopping.length} item${shopping.length === 1 ? '' : 's'}`}
          left={(props) => <List.Icon {...props} icon="cart-remove" />}
          onPress={() => setConfirm('clearShopping')}
          disabled={shopping.length === 0}
        />
        <List.Item
          title="Clear cooking history"
          description={`${cooked.length} cooked · recently viewed`}
          left={(props) => <List.Icon {...props} icon="history" />}
          onPress={() => setConfirm('clearHistory')}
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
          <Dialog.Title>{confirm ? CONFIRM_TEXT[confirm].title : ''}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{confirm ? CONFIRM_TEXT[confirm].body : ''}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirm(null)}>Cancel</Button>
            <Button textColor={theme.colors.error} onPress={handleConfirm}>
              {confirm ? CONFIRM_TEXT[confirm].button : ''}
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
  segmented: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 16,
  },
});
