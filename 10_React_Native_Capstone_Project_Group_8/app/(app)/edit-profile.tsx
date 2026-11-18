
/**
 * Edit Profile Screen
 *
 * CartlyX
 *
 * Features:
 * - Updates first name, last name, username, and email.
 * - Updates gender.
 * - Selects and crops a profile picture.
 * - Previews the selected profile picture.
 * - Allows the user to remove their profile picture.
 * - Validates required fields.
 * - Saves profile changes locally.
 * - Supports dynamic Light and Dark themes.
 */

import React, { useEffect, useState } from 'react';

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
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

import * as ImagePicker from 'expo-image-picker';
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

  const [profileImage, setProfileImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectingImage, setSelectingImage] = useState(false);
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
    setProfileImage(user.image ?? '');
  }, [user]);

  /**
   * Open the device gallery and select a profile picture.
   */
  const handleChoosePhoto = async () => {
    try {
      setError('');
      setSelectingImage(true);

      if (Platform.OS !== 'web') {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          showMessage(
            'Permission Required',
            'Please allow photo library access to choose a profile picture.',
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (result.canceled) {
        return;
      }

      const selectedAsset = result.assets?.[0];

      if (!selectedAsset) {
        showMessage(
          'Unable to Select Photo',
          'Please choose another image and try again.',
        );
        return;
      }

      if (!selectedAsset.base64) {
        showMessage(
          'Unable to Process Photo',
          'The selected image could not be prepared for saving. Please try another image.',
        );
        return;
      }

      const mimeType = selectedAsset.mimeType || 'image/jpeg';

      const imageData = `data:${mimeType};base64,${selectedAsset.base64}`;

      setProfileImage(imageData);
    } catch (imageError) {
      console.error('Failed to select profile picture:', imageError);

      showMessage(
        'Photo Selection Failed',
        'Something went wrong while selecting your picture. Please try again.',
      );
    } finally {
      setSelectingImage(false);
    }
  };

  /**
   * Remove the selected profile picture.
   */
  const handleRemovePhoto = () => {
    setProfileImage('');
  };

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
        image: profileImage,
      });

      showMessage(
        'Profile Updated',
        'Your profile information and picture have been successfully updated.',
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
            {profileImage ? (
              <Avatar.Image
                size={104}
                source={{ uri: profileImage }}
              />
            ) : (
              <Avatar.Text
                size={104}
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

            <View style={styles.photoButtons}>
              <Button
                mode="contained"
                icon="camera-outline"
                onPress={() => void handleChoosePhoto()}
                loading={selectingImage}
                disabled={saving || selectingImage}
                style={styles.changePhotoButton}
              >
                {profileImage ? 'Change Photo' : 'Add Photo'}
              </Button>

              {profileImage !== '' && (
                <Button
                  mode="outlined"
                  icon="delete-outline"
                  onPress={handleRemovePhoto}
                  disabled={saving || selectingImage}
                  style={styles.removePhotoButton}
                  textColor={colors.error}
                >
                  Remove
                </Button>
              )}
            </View>

            <Text variant="bodySmall" style={styles.photoHint}>
              Choose a photo from your device gallery.
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
                onValueChange={(value) => setGender(value as Gender)}
                value={gender}
              >
                <View style={styles.genderOption}>
                  <RadioButton value="male" disabled={saving} />
                  <Text variant="bodyMedium" style={styles.genderLabel}>
                    Male
                  </Text>
                </View>

                <View style={styles.genderOption}>
                  <RadioButton value="female" disabled={saving} />
                  <Text variant="bodyMedium" style={styles.genderLabel}>
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
                disabled={saving || selectingImage}
              >
                Cancel
              </Button>

              <Button
                mode="contained"
                onPress={() => void handleSave()}
                style={styles.saveButton}
                disabled={saving || selectingImage}
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

    photoButtons: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 16,
    },

    changePhotoButton: {
      borderRadius: 10,
    },

    removePhotoButton: {
      borderRadius: 10,
      borderColor: colors.error,
    },

    photoHint: {
      color: colors.onSurfaceVariant,
      marginTop: 10,
      textAlign: 'center',
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
