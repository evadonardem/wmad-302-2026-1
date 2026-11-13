/**
 * Edit Profile Screen - Cookbook
 * Route: /edit-profile  (opened from Profile)
 *
 * Sends PUT /users/{id} to DummyJSON, then saves the changes on the device
 * through AuthContext.updateUser (DummyJSON does not keep the update itself).
 */
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Button, HelperText, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { userApi, UpdateProfileData } from '@/services/userApi';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EditProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState<UpdateProfileData>({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const setField = (field: keyof UpdateProfileData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const validate = (): string | null => {
    if (!form.firstName.trim()) return 'First name is required';
    if (!form.lastName.trim()) return 'Last name is required';
    if (!form.email.trim()) return 'Email is required';
    if (!EMAIL_PATTERN.test(form.email.trim())) return 'Please enter a valid email address';
    return null;
  };

  const handleSave = async () => {
    if (!user) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const changes: UpdateProfileData = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
    };

    setSaving(true);
    setError(null);
    try {
      await userApi.updateUser(user.id, changes);
      updateUser(changes);
      setSaved(true);
    } catch (err) {
      // Accounts created with Register only exist on this device, so DummyJSON
      // answers 404 for them. Save locally in that case instead of failing.
      const isLocalAccount = !user.token;
      if (axios.isAxiosError(err) && err.response?.status === 404 && isLocalAccount) {
        updateUser(changes);
        setSaved(true);
      } else {
        setError('Could not save your profile. Check your connection and try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    form.firstName.trim() !== (user?.firstName ?? '') ||
    form.lastName.trim() !== (user?.lastName ?? '') ||
    form.email.trim() !== (user?.email ?? '');

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: true, title: 'Edit Profile' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="bodyMedium" style={[styles.intro, { color: theme.colors.onSurfaceVariant }]}>
          Update your name and email. Your username (@{user?.username}) cannot be changed.
        </Text>

        <TextInput
          label="First Name"
          mode="outlined"
          value={form.firstName}
          onChangeText={(v) => setField('firstName', v)}
          autoCapitalize="words"
          autoComplete="given-name"
          disabled={saving}
          style={styles.input}
        />
        <TextInput
          label="Last Name"
          mode="outlined"
          value={form.lastName}
          onChangeText={(v) => setField('lastName', v)}
          autoCapitalize="words"
          autoComplete="family-name"
          disabled={saving}
          style={styles.input}
        />
        <TextInput
          label="Email"
          mode="outlined"
          value={form.email}
          onChangeText={(v) => setField('email', v)}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          disabled={saving}
          style={styles.input}
        />

        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>

        <View style={styles.buttons}>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving || !hasChanges}
            contentStyle={styles.buttonContent}
          >
            Save Changes
          </Button>
          <Button mode="text" onPress={() => router.back()} disabled={saving}>
            Cancel
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={saved}
        onDismiss={() => router.back()}
        duration={1200}
      >
        Profile updated
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  intro: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  buttons: {
    marginTop: 8,
    gap: 8,
  },
  buttonContent: {
    paddingVertical: 6,
  },
});
