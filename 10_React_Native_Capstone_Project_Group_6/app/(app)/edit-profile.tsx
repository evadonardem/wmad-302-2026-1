import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, Text, TextInput } from 'react-native-paper';
import { ErrorState } from '@/components/ErrorState';
import { Screen } from '@/components/Screen';
import { useSnackbar } from '@/components/SnackbarProvider';
import { spacing, useAppTheme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { routes } from '@/utils/routes';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EditProfileScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const { show } = useSnackbar();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      setError('Enter your first and last name.');
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!user || saving) return;

    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        phone,
      });
      show('Profile updated.');
      router.replace(routes.profile);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Could not update your profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <Screen>
        <ErrorState message="Sign in to edit your profile." onRetry={() => router.replace(routes.login())} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Changes are stored with your account on this device.
        </Text>

        <Card mode="outlined" style={{ backgroundColor: theme.colors.surface }}>
          <Card.Content style={styles.form}>
            <TextInput
              mode="outlined"
              label="First name"
              value={firstName}
              onChangeText={(value) => {
                setFirstName(value);
                setError(null);
              }}
              autoCapitalize="words"
              autoComplete="given-name"
              disabled={saving}
            />
            <TextInput
              mode="outlined"
              label="Last name"
              value={lastName}
              onChangeText={(value) => {
                setLastName(value);
                setError(null);
              }}
              autoCapitalize="words"
              autoComplete="family-name"
              disabled={saving}
            />
            <TextInput
              mode="outlined"
              label="Email"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setError(null);
              }}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              disabled={saving}
            />
            <TextInput
              mode="outlined"
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              autoComplete="tel"
              keyboardType="phone-pad"
              disabled={saving}
            />
            {error ? (
              <HelperText type="error" visible>
                {error}
              </HelperText>
            ) : null}
            <View style={styles.actions}>
              <Button mode="text" onPress={() => router.back()} disabled={saving}>
                Cancel
              </Button>
              <Button mode="contained" onPress={() => void handleSave()} loading={saving} disabled={saving}>
                Save changes
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  form: { gap: spacing.md },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
});
