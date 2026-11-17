/**
 * Edit Profile Screen
 *
 * Marketplace App
 *
 * Features:
 * - Updates first name and last name.
 * - Updates username and email.
 * - Updates gender.
 * - Validates required fields.
 * - Saves profile changes locally.
 * - Supports dynamic Light and Dark themes.
 */

import React, { useEffect, useState } from 'react';

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  Alert,
} from 'react-native';

import {
  ActivityIndicator,
  Avatar,
  Button,
  Card,
  HelperText,
  RadioButton,
  Text,
  TextInput,
  useTheme,
  type MD3Theme,
} from 'react-native-paper';

import { router } from 'expo-router';

import { useAuth } from '@/context/AuthContext';

type Gender = 'male' | 'female';

const showMessage = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    const browser = globalThis as typeof globalThis & {
      alert?: (message: string) => void;
    };

    browser.alert?.(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function EditProfileScreen() {
  const { user, updateProfile } = useAuth();

  const theme = useTheme<MD3Theme>();
  const colors = theme.colors;

  const styles = createStyles(colors);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender>('male');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  /**
   * Load the current profile information.
   */
  useEffect(() => {
    if (!user) {
      return;
    }

    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
    setUsername(user.username ?? '');
    setEmail(user.email ?? '');
    setGender(user.gender ?? 'male');
  }, [user]);

  /**
   * Validate and save profile changes.
   */
  const handleSave = async () => {
    setError('');

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (
      !cleanFirstName ||
      !cleanLastName ||
      !cleanUsername ||
      !cleanEmail
    ) {
      setError('Please complete all required fields.');
      return;
    }

    if (cleanUsername.length < 3) {
      setError('Username must contain at least 3 characters.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!user) {
      setError('Your account could not be found. Please log in again.');
      return;
    }

    try {
      setSaving(true);

      await updateProfile({
        firstName: cleanFirstName,
        lastName: cleanLastName,
        username: cleanUsername,
        email: cleanEmail,
        gender,
      });

      showMessage(
        'Profile Updated',
        'Your profile information has been successfully updated.',
      );

      router.back();
    } catch (saveError) {
      console.error('Failed to update profile:', saveError);

      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save your profile. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const fullName =
    [firstName, lastName].filter(Boolean).join(' ') ||
    user?.username ||
    'User';

  const initials = fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Edit Profile
          </Text>

          <Text variant="bodyMedium" style={styles.subtitle}>
            Update your personal account information.
          </Text>
        </View>

        <Card style={styles.profileCard} mode="elevated">
          <Card.Content style={styles.profileContent}>
            {user?.image ? (
              <Avatar.Image
                size={88}
                source={{ uri: user.image }}
              />
            ) : (
              <Avatar.Text
                size={88}
                label={initials}
                style={styles.avatar}
                color={colors.onPrimary}
              />
            )}

            <Text variant="titleMedium" style={styles.previewName}>
              {fullName}
            </Text>

            <Text variant="bodySmall" style={styles.previewUsername}>
              @{username || 'username'}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.formCard} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Personal Information
            </Text>

            <TextInput
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              mode="outlined"
              autoCapitalize="words"
              left={<TextInput.Icon icon="account-outline" />}
              style={styles.input}
              disabled={saving}
            />

            <TextInput
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              mode="outlined"
              autoCapitalize="words"
              left={<TextInput.Icon icon="account-outline" />}
              style={styles.input}
              disabled={saving}
            />

            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              autoCapitalize="none"
              autoCorrect={false}
              left={<TextInput.Icon icon="at" />}
              style={styles.input}
              disabled={saving}
            />

            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              left={<TextInput.Icon icon="email-outline" />}
              style={styles.input}
              disabled={saving}
            />

            <Text variant="titleSmall" style={styles.genderTitle}>
              Gender
            </Text>

            <View style={styles.genderContainer}>
              <RadioButton.Group
                onValueChange={(value) =>
                  setGender(value as Gender)
                }
                value={gender}
              >
                <View style={styles.genderOption}>
                  <RadioButton value="male" />
                  <Text
                    variant="bodyMedium"
                    style={styles.genderLabel}
                  >
                    Male
                  </Text>
                </View>

                <View style={styles.genderOption}>
                  <RadioButton value="female" />
                  <Text
                    variant="bodyMedium"
                    style={styles.genderLabel}
                  >
                    Female
                  </Text>
                </View>
              </RadioButton.Group>
            </View>

            {!!error && (
              <HelperText type="error" visible>
                {error}
              </HelperText>
            )}

            <View style={styles.buttons}>
              <Button
                mode="outlined"
                onPress={() => router.back()}
                style={styles.cancelButton}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                mode="contained"
                onPress={() => void handleSave()}
                style={styles.saveButton}
                disabled={saving}
                icon="content-save-outline"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </View>

            {saving && (
              <ActivityIndicator
                animating
                color={colors.primary}
                style={styles.loading}
              />
            )}
          </Card.Content>
        </Card>

        <Text variant="bodySmall" style={styles.note}>
          Your profile changes are saved to this device and will remain
          available when you log back into this account.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: MD3Theme['colors']) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },

    container: {
      flex: 1,
    },

    content: {
      padding: 18,
      paddingBottom: 40,
    },

    header: {
      marginBottom: 20,
    },

    title: {
      color: colors.onBackground,
      fontWeight: '700',
    },

    subtitle: {
      color: colors.onSurfaceVariant,
      marginTop: 5,
    },

    profileCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      marginBottom: 18,
    },

    profileContent: {
      alignItems: 'center',
      paddingVertical: 22,
    },

    avatar: {
      backgroundColor: colors.primary,
    },

    previewName: {
      color: colors.onSurface,
      fontWeight: '700',
      marginTop: 12,
    },

    previewUsername: {
      color: colors.onSurfaceVariant,
      marginTop: 4,
    },

    formCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
    },

    sectionTitle: {
      color: colors.onSurface,
      fontWeight: '700',
      marginBottom: 18,
    },

    input: {
      marginBottom: 13,
      backgroundColor: colors.surface,
    },

    genderTitle: {
      color: colors.onSurface,
      fontWeight: '600',
      marginTop: 8,
      marginBottom: 8,
    },

    genderContainer: {
      marginBottom: 12,
    },

    genderOption: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 2,
    },

    genderLabel: {
      color: colors.onSurface,
    },

    buttons: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 18,
    },

    cancelButton: {
      flex: 1,
      borderColor: colors.outline,
    },

    saveButton: {
      flex: 1.5,
    },

    loading: {
      marginTop: 16,
    },

    note: {
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: 18,
      lineHeight: 20,
    },
  });
}