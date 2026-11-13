/**
 * Profile Screen - Cookbook
 */
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import {
  Card,
  Button,
  List,
  Avatar,
  Divider,
  Portal,
  Dialog,
  TextInput as PaperTextInput,
  Switch,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { recipeApi } from '@/services/recipeApi';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/utils/storage';
import { styles } from './profileStyles';

interface UserSettings {
  notificationsEnabled: boolean;
  showCalories: boolean;
  metricUnits: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  notificationsEnabled: true,
  showCalories: true,
  metricUnits: true,
};

const showMessage = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${message}`);
    return;
  }
  Alert.alert(title, message);
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated, updateUser } = useAuth();
  const { favoriteIds } = useFavorites();

  const [totalRecipesCount, setTotalRecipesCount] = useState<number>(30);

  // Edit Profile Modal State
  const [editVisible, setEditVisible] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Settings Modal State
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    const loadStatsAndSettings = async () => {
      try {
        const [recipesRes, savedSettings] = await Promise.all([
          recipeApi.getRecipes({ limit: 1 }),
          getStorageItem<UserSettings>(STORAGE_KEYS.SETTINGS),
        ]);
        if (recipesRes.total) {
          setTotalRecipesCount(recipesRes.total);
        }
        if (savedSettings) {
          setSettings(savedSettings);
        }
      } catch {
        // Fallback to default values silently
      }
    };
    loadStatsAndSettings();
  }, []);

  const handleLogout = () => {
    const performLogout = async () => {
      await logout();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        void performLogout();
      }
      return;
    }

    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          void performLogout();
        },
      },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      showMessage('Validation Error', 'First name, last name, and email are required.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showMessage('Validation Error', 'Please enter a valid email address.');
      return;
    }

    setSavingProfile(true);
    try {
      const targetUserId = user?.id && user.id <= 208 ? user.id : 1;
      await axios.put(
        `https://dummyjson.com/users/${targetUserId}`,
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );

      updateUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });

      setEditVisible(false);
      showMessage('Success', 'Profile updated successfully!');
    } catch (err) {
      showMessage(
        'Update Failed',
        err instanceof Error ? err.message : 'Could not update profile.'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleSetting = async (key: keyof UserSettings) => {
    const updated: UserSettings = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    await setStorageItem(STORAGE_KEYS.SETTINGS, updated);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notLoggedIn}>Please log in to view profile</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Avatar.Image
          size={88}
          source={{ uri: user?.image || 'https://dummyjson.com/icon/emilys/128' }}
          style={styles.avatar}
        />
        <View style={styles.nameContainer}>
          <Text style={styles.name}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.username}>@{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalRecipesCount}</Text>
          <Text style={styles.statLabel}>Recipes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{favoriteIds.length}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>15</Text>
          <Text style={styles.statLabel}>Categories</Text>
        </View>
      </View>

      {/* Menu Sections */}
      <View style={styles.section}>
        <Card style={styles.menuCard} elevation={1}>
          <List.Section>
            <List.Item
              title="Discover Recipes"
              description="Browse curated & popular dishes"
              left={(props) => (
                <MaterialCommunityIcons
                  name="stove"
                  size={24}
                  color="#E85D04"
                  style={props.style}
                />
              )}
              right={(props) => (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color="#8D6E63"
                  style={props.style}
                />
              )}
              onPress={() => router.push('/(app)/(tabs)/home')}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Browse Categories"
              description="Explore recipes by food type"
              left={(props) => (
                <MaterialCommunityIcons
                  name="shape"
                  size={24}
                  color="#E85D04"
                  style={props.style}
                />
              )}
              right={(props) => (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color="#8D6E63"
                  style={props.style}
                />
              )}
              onPress={() => router.push('/(app)/(tabs)/categories')}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Favorites"
              description={`${favoriteIds.length} saved recipes`}
              left={(props) => (
                <MaterialCommunityIcons
                  name="heart"
                  size={24}
                  color="#E85D04"
                  style={props.style}
                />
              )}
              right={(props) => (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color="#8D6E63"
                  style={props.style}
                />
              )}
              onPress={() => router.push('/(app)/(tabs)/favorites')}
            />
          </List.Section>
        </Card>
      </View>

      <View style={styles.section}>
        <Card style={styles.menuCard} elevation={1}>
          <List.Section>
            <List.Item
              title="Edit Profile"
              description="Update your name and email"
              left={(props) => (
                <MaterialCommunityIcons
                  name="account-edit"
                  size={24}
                  color="#E85D04"
                  style={props.style}
                />
              )}
              right={(props) => (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color="#8D6E63"
                  style={props.style}
                />
              )}
              onPress={() => setEditVisible(true)}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Settings"
              description="Notifications & display preferences"
              left={(props) => (
                <MaterialCommunityIcons
                  name="cog"
                  size={24}
                  color="#E85D04"
                  style={props.style}
                />
              )}
              right={(props) => (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color="#8D6E63"
                  style={props.style}
                />
              )}
              onPress={() => setSettingsVisible(true)}
            />
          </List.Section>
        </Card>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          contentStyle={styles.logoutButtonContent}
          icon="logout"
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Button>
      </View>

      <View style={styles.version}>
        <Text style={styles.versionText}>Cookbook v1.0.0</Text>
      </View>

      {/* Edit Profile Dialog */}
      <Portal>
        <Dialog visible={editVisible} onDismiss={() => setEditVisible(false)}>
          <Dialog.Title>Edit Profile</Dialog.Title>
          <Dialog.Content>
            <PaperTextInput
              label="First Name"
              mode="outlined"
              value={firstName}
              onChangeText={setFirstName}
              style={{ marginBottom: 12 }}
              disabled={savingProfile}
            />
            <PaperTextInput
              label="Last Name"
              mode="outlined"
              value={lastName}
              onChangeText={setLastName}
              style={{ marginBottom: 12 }}
              disabled={savingProfile}
            />
            <PaperTextInput
              label="Email"
              mode="outlined"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              disabled={savingProfile}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditVisible(false)} disabled={savingProfile}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveProfile}
              loading={savingProfile}
              disabled={savingProfile}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog visible={settingsVisible} onDismiss={() => setSettingsVisible(false)}>
          <Dialog.Title>Preferences & Settings</Dialog.Title>
          <Dialog.Content>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 8,
              }}
            >
              <Text style={{ fontSize: 15, color: '#3E2723' }}>Daily Recipe Reminders</Text>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={() => toggleSetting('notificationsEnabled')}
                color="#E85D04"
              />
            </View>
            <Divider />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 8,
              }}
            >
              <Text style={{ fontSize: 15, color: '#3E2723' }}>Show Nutrition Calories</Text>
              <Switch
                value={settings.showCalories}
                onValueChange={() => toggleSetting('showCalories')}
                color="#E85D04"
              />
            </View>
            <Divider />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 8,
              }}
            >
              <Text style={{ fontSize: 15, color: '#3E2723' }}>Use Metric Measurements</Text>
              <Switch
                value={settings.metricUnits}
                onValueChange={() => toggleSetting('metricUnits')}
                color="#E85D04"
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSettingsVisible(false)}>Done</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}