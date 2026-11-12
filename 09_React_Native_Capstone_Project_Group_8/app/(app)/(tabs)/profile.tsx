
/**
 * Profile Screen - Cookbook
 * Displays user information, editable profile details,
 * actual recipe statistics, and account navigation.
 */

import React, { useCallback, useState } from 'react';

import {
  View,
  Text,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';

import { useFocusEffect, useRouter } from 'expo-router';

import {
  Card,
  Button,
  List,
  Avatar,
  Divider,
  Dialog,
  Portal,
  TextInput,
} from 'react-native-paper';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import { favoritesStorage, mealPlanStorage } from '@/utils/storage';
import { recipeApi } from '@/services/recipeApi';

import { styles } from './profileStyles';

interface ProfileStats {
  recipes: number;
  favorites: number;
  plannedMeals: number;
}

const COLORS = {
  primary: '#43A52F',
  secondary: '#2E7D32',
  lightGreen: '#E8F5E9',
  background: '#F5FAF3',
  text: '#202B20',
  secondaryText: '#52634F',
  divider: '#D5E3D0',
  white: '#FFFFFF',
  error: '#D32F2F',
};

export default function ProfileScreen() {
  const router = useRouter();

  const {
    user,
    logout,
    updateUser,
    isAuthenticated,
  } = useAuth();

  const [stats, setStats] = useState<ProfileStats>({
    recipes: 0,
    favorites: 0,
    plannedMeals: 0,
  });

  const [statsLoading, setStatsLoading] = useState(true);

  const [editVisible, setEditVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  // Display messages correctly on web and mobile.
  const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      const browserWindow = (
        globalThis as unknown as {
          window?: {
            alert: (message: string) => void;
          };
        }
      ).window;

      browserWindow?.alert(`${title}\n\n${message}`);
      return;
    }

    Alert.alert(title, message);
  };

  // Load actual statistics whenever the Profile tab is opened.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadStats = async () => {
        if (!user) {
          setStatsLoading(false);
          return;
        }

        setStatsLoading(true);

        try {
          const [favoriteResult, mealResult, recipeResult] =
            await Promise.allSettled([
              favoritesStorage.getIds(),
              mealPlanStorage.getEntries(),
              recipeApi.getRecipes({ limit: 100 }),
            ]);

          if (!active) {
            return;
          }

          const favoriteCount =
            favoriteResult.status === 'fulfilled'
              ? favoriteResult.value.length
              : 0;

          const plannedMealCount =
            mealResult.status === 'fulfilled'
              ? mealResult.value.length
              : 0;

          const recipeCount =
            recipeResult.status === 'fulfilled'
              ? recipeResult.value.recipes.filter(
                  (recipe) => recipe.userId === user.id
                ).length
              : 0;

          setStats({
            recipes: recipeCount,
            favorites: favoriteCount,
            plannedMeals: plannedMealCount,
          });
        } catch (error) {
          console.error(
            'Failed to load profile statistics:',
            error
          );
        } finally {
          if (active) {
            setStatsLoading(false);
          }
        }
      };

      void loadStats();

      return () => {
        active = false;
      };
    }, [user])
  );

  // Open the Edit Profile dialog.
  const handleEditProfile = () => {
    if (!user) {
      return;
    }

    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setUsername(user.username || '');
    setEmail(user.email || '');

    setEditVisible(true);
  };

  // Save edited profile information.
  const handleSaveProfile = async () => {
    const updatedFirstName = firstName.trim();
    const updatedLastName = lastName.trim();
    const updatedUsername = username.trim();
    const updatedEmail = email.trim();

    if (
      !updatedFirstName ||
      !updatedLastName ||
      !updatedUsername ||
      !updatedEmail
    ) {
      showMessage(
        'Missing Information',
        'Please complete all profile fields.'
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedEmail)) {
      showMessage(
        'Invalid Email',
        'Please enter a valid email address.'
      );
      return;
    }

    try {
      setSaving(true);

      await updateUser({
        firstName: updatedFirstName,
        lastName: updatedLastName,
        username: updatedUsername,
        email: updatedEmail,
      });

      setEditVisible(false);

      showMessage(
        'Profile Updated',
        'Your profile information has been saved.'
      );
    } catch (error) {
      console.error('Failed to update profile:', error);

      showMessage(
        'Update Failed',
        'Unable to save your profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Logout after confirmation.
  const performLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);

      showMessage(
        'Logout Failed',
        'Unable to log out. Please try again.'
      );
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const browserWindow = (
        globalThis as unknown as {
          window?: {
            confirm: (message: string) => boolean;
          };
        }
      ).window;

      const confirmed =
        browserWindow?.confirm(
          'Are you sure you want to logout?'
        ) ?? false;

      if (confirmed) {
        void performLogout();
      }

      return;
    }

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            void performLogout();
          },
        },
      ]
    );
  };

  // Other features will be connected in the next stages.
  const showComingSoon = (feature: string) => {
    showMessage(
      feature,
      'This feature will be implemented in the next development stage.'
    );
  };

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notLoggedIn}>
          Please log in to view profile.
        </Text>
      </View>
    );
  }

  const initials =
    `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`;

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          {user.image ? (
            <Avatar.Image
              size={88}
              source={{ uri: user.image }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Text
              size={88}
              label={initials || 'U'}
              style={styles.avatar}
              color={COLORS.primary}
            />
          )}

          <View style={styles.nameContainer}>
            <Text style={styles.name}>
              {user.firstName} {user.lastName}
            </Text>

            <Text style={styles.username}>
              @{user.username}
            </Text>

            <Text style={styles.email}>
              {user.email}
            </Text>
          </View>
        </View>

        {/* Actual Profile Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            {statsLoading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text style={styles.statValue}>
                {stats.recipes}
              </Text>
            )}

            <Text style={styles.statLabel}>Recipes</Text>
          </View>

          <View style={styles.statItem}>
            {statsLoading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text style={styles.statValue}>
                {stats.favorites}
              </Text>
            )}

            <Text style={styles.statLabel}>Favorites</Text>
          </View>

          <View style={styles.statItem}>
            {statsLoading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text style={styles.statValue}>
                {stats.plannedMeals}
              </Text>
            )}

            <Text style={styles.statLabel}>Planned Meals</Text>
          </View>
        </View>

        {/* Cookbook Navigation */}
        <View style={styles.section}>
          <Card style={styles.menuCard} elevation={1}>
            <List.Section>
              <List.Item
                title="My Recipes"
                description="Recipes you've created"
                titleStyle={{ color: COLORS.text }}
                descriptionStyle={{ color: COLORS.secondaryText }}
                left={(props) => (
                  <MaterialCommunityIcons
                    name="book-edit"
                    size={24}
                    color={COLORS.primary}
                    style={props.style}
                  />
                )}
                right={(props) => (
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={COLORS.secondaryText}
                    style={props.style}
                  />
                )}
                onPress={() =>
                  router.push('/(app)/my-recipes')
                }
              />

              <Divider style={styles.divider} />

              <List.Item
                title="My Cookbook"
                description="Your saved recipes and meal plans"
                titleStyle={{ color: COLORS.text }}
                descriptionStyle={{ color: COLORS.secondaryText }}
                left={(props) => (
                  <MaterialCommunityIcons
                    name="book-open-page-variant"
                    size={24}
                    color={COLORS.primary}
                    style={props.style}
                  />
                )}
                right={(props) => (
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={COLORS.secondaryText}
                    style={props.style}
                  />
                )}
                onPress={() =>
                  router.push('/(app)/my-cookbook')
                }
              />

              <Divider style={styles.divider} />

              <List.Item
                title="Favorites"
                description="Your saved recipes"
                titleStyle={{ color: COLORS.text }}
                descriptionStyle={{ color: COLORS.secondaryText }}
                left={(props) => (
                  <MaterialCommunityIcons
                    name="heart"
                    size={24}
                    color={COLORS.primary}
                    style={props.style}
                  />
                )}
                right={(props) => (
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={COLORS.secondaryText}
                    style={props.style}
                  />
                )}
                onPress={() =>
                  router.push('/(app)/(tabs)/favorites')
                }
              />
            </List.Section>
          </Card>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Card style={styles.menuCard} elevation={1}>
            <List.Section>
              <List.Item
                title="Edit Profile"
                description="Update your personal information"
                titleStyle={{ color: COLORS.text }}
                descriptionStyle={{ color: COLORS.secondaryText }}
                left={(props) => (
                  <MaterialCommunityIcons
                    name="account-edit"
                    size={24}
                    color={COLORS.primary}
                    style={props.style}
                  />
                )}
                right={(props) => (
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={COLORS.secondaryText}
                    style={props.style}
                  />
                )}
                onPress={handleEditProfile}
              />

              <Divider style={styles.divider} />

              <List.Item
                title="Settings"
                description="Notifications, theme, and preferences"
                titleStyle={{ color: COLORS.text }}
                descriptionStyle={{ color: COLORS.secondaryText }}
                left={(props) => (
                  <MaterialCommunityIcons
                    name="cog"
                    size={24}
                    color={COLORS.primary}
                    style={props.style}
                  />
                )}
                right={(props) => (
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={COLORS.secondaryText}
                    style={props.style}
                  />
                )}
                onPress={() => showComingSoon('Settings')}
              />
            </List.Section>
          </Card>
        </View>

        {/* Logout */}
        <View style={styles.logoutContainer}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            contentStyle={styles.logoutButtonContent}
            icon="logout"
            textColor={COLORS.primary}
          >
            Logout
          </Button>
        </View>

        {/* Version */}
        <View style={styles.version}>
          <Text style={styles.versionText}>
            Cookbook v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Edit Profile Dialog */}
      <Portal>
        <Dialog
          visible={editVisible}
          onDismiss={() => {
            if (!saving) {
              setEditVisible(false);
            }
          }}
          style={{ backgroundColor: COLORS.white }}
        >
          <Dialog.Title
            style={{ color: COLORS.text }}
          >
            Edit Profile
          </Dialog.Title>

          <Dialog.Content>
            <TextInput
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              mode="outlined"
              style={{ marginBottom: 12 }}
              disabled={saving}
              outlineColor={COLORS.divider}
              activeOutlineColor={COLORS.primary}
            />

            <TextInput
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              mode="outlined"
              style={{ marginBottom: 12 }}
              disabled={saving}
              outlineColor={COLORS.divider}
              activeOutlineColor={COLORS.primary}
            />

            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              style={{ marginBottom: 12 }}
              autoCapitalize="none"
              disabled={saving}
              outlineColor={COLORS.divider}
              activeOutlineColor={COLORS.primary}
            />

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              disabled={saving}
              outlineColor={COLORS.divider}
              activeOutlineColor={COLORS.primary}
            />

            <Text
              style={{
                color: COLORS.secondaryText,
                fontSize: 12,
                marginTop: 12,
              }}
            >
              Profile changes are saved locally on this device.
            </Text>
          </Dialog.Content>

          <Dialog.Actions>
            <Button
              onPress={() => setEditVisible(false)}
              disabled={saving}
              textColor={COLORS.secondaryText}
            >
              Cancel
            </Button>

            <Button
              onPress={() => void handleSaveProfile()}
              loading={saving}
              disabled={saving}
              textColor={COLORS.primary}
            >
              Save Changes
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}
