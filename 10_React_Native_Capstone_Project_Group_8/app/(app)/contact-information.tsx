
/**
 * My Contact Information
 *
 * Features:
 * - Stores contact information separately from shipping address.
 * - Loads saved information for the signed-in user.
 * - Uses account name and email as initial values.
 * - Supports editing and saving contact information.
 * - Supports dynamic light and dark themes.
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

import { router } from 'expo-router';

import {
  ActivityIndicator,
  Button,
  Card,
  Text,
  TextInput,
  useTheme,
  type MD3Theme,
} from 'react-native-paper';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';

import { contactInformationStorage } from '@/utils/storage';

import type { ContactInformation } from '@/types/order';

export default function ContactInformationScreen() {
  const { user } = useAuth();

  const { colors } = useTheme<MD3Theme>();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    let isMounted = true;

    const loadContactInformation = async () => {
      if (!user) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const savedInformation =
          await contactInformationStorage.get(user.id);

        if (!isMounted) {
          return;
        }

        setFullName(
          savedInformation?.fullName ||
            [user.firstName, user.lastName]
              .filter(Boolean)
              .join(' ') ||
            user.username ||
            '',
        );

        setEmail(savedInformation?.email || user.email || '');

        setPhone(savedInformation?.phone || '');
      } catch (error) {
        console.error(
          'Unable to load contact information:',
          error,
        );

        if (isMounted) {
          showMessage(
            'Error',
            'Unable to load your saved contact information.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadContactInformation();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      const browser = globalThis as typeof globalThis & {
        alert?: (message: string) => void;
      };

      browser.alert?.(`${title}\n\n${message}`);
      return;
    }

    Alert.alert(title, message);
  };

  const validateForm = () => {
    const nextErrors = {
      fullName: '',
      email: '',
      phone: '',
    };

    if (!fullName.trim()) {
      nextErrors.fullName = 'Please enter your full name.';
    }

    if (!email.trim()) {
      nextErrors.email = 'Please enter your email address.';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!phone.trim()) {
      nextErrors.phone = 'Please enter your phone number.';
    }

    setErrors(nextErrors);

    return !Object.values(nextErrors).some(Boolean);
  };

  const handleSave = async () => {
    if (!user) {
      showMessage(
        'Not Signed In',
        'Please sign in before saving your contact information.',
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    const information: ContactInformation = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
    };

    try {
      setIsSaving(true);

      await contactInformationStorage.save(
        user.id,
        information,
      );

      showMessage(
        'Saved Successfully',
        'Your contact information has been saved. It will automatically appear during checkout.',
      );
    } catch (error) {
      console.error(
        'Unable to save contact information:',
        error,
      );

      showMessage(
        'Save Failed',
        'Unable to save your contact information. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text
          style={[
            styles.loadingText,
            { color: colors.onSurfaceVariant },
          ]}
        >
          Loading contact information...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Button
            mode="text"
            icon="arrow-left"
            onPress={() => router.back()}
            textColor={colors.primary}
            contentStyle={styles.backButton}
          >
            Back
          </Button>

          <Text
            variant="headlineSmall"
            style={[
              styles.title,
              { color: colors.onBackground },
            ]}
          >
            My Contact Information
          </Text>

          <Text
            style={[
              styles.subtitle,
              { color: colors.onSurfaceVariant },
            ]}
          >
            Manage the contact details used for your orders.
          </Text>
        </View>

        <Card
          mode="elevated"
          style={[
            styles.card,
            { backgroundColor: colors.surface },
          ]}
        >
          <Card.Content>
            <View style={styles.infoHeader}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.primaryContainer },
                ]}
              >
                <MaterialCommunityIcons
                  name="account-box-outline"
                  size={27}
                  color={colors.primary}
                />
              </View>

              <View style={styles.infoHeaderText}>
                <Text
                  variant="titleMedium"
                  style={{ color: colors.onSurface }}
                >
                  Personal Contact Details
                </Text>

                <Text
                  variant="bodySmall"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  Your saved information is associated with your account.
                </Text>
              </View>
            </View>

            <TextInput
              label="Full Name"
              value={fullName}
              onChangeText={(value) => {
                setFullName(value);
                setErrors((previous) => ({
                  ...previous,
                  fullName: '',
                }));
              }}
              mode="outlined"
              left={<TextInput.Icon icon="account-outline" />}
              error={Boolean(errors.fullName)}
              style={styles.input}
              autoCapitalize="words"
            />

            {!!errors.fullName && (
              <Text style={styles.errorText}>
                {errors.fullName}
              </Text>
            )}

            <TextInput
              label="Email Address"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setErrors((previous) => ({
                  ...previous,
                  email: '',
                }));
              }}
              mode="outlined"
              left={<TextInput.Icon icon="email-outline" />}
              keyboardType="email-address"
              autoCapitalize="none"
              error={Boolean(errors.email)}
              style={styles.input}
            />

            {!!errors.email && (
              <Text style={styles.errorText}>
                {errors.email}
              </Text>
            )}

            <TextInput
              label="Phone Number"
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                setErrors((previous) => ({
                  ...previous,
                  phone: '',
                }));
              }}
              mode="outlined"
              left={<TextInput.Icon icon="phone-outline" />}
              keyboardType="phone-pad"
              error={Boolean(errors.phone)}
              style={styles.input}
            />

            {!!errors.phone && (
              <Text style={styles.errorText}>
                {errors.phone}
              </Text>
            )}
          </Card.Content>
        </Card>

        <View
          style={[
            styles.note,
            { backgroundColor: colors.secondaryContainer },
          ]}
        >
          <MaterialCommunityIcons
            name="information-outline"
            size={21}
            color={colors.onSecondaryContainer}
          />

          <Text
            style={[
              styles.noteText,
              { color: colors.onSecondaryContainer },
            ]}
          >
            Your contact information will be automatically filled in when you check out. You can still edit it before placing an order.
          </Text>
        </View>

        <Button
          mode="contained"
          icon="content-save-outline"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
        >
          Save Contact Information
        </Button>

        <Button
          mode="outlined"
          onPress={() => router.back()}
          disabled={isSaving}
          style={styles.cancelButton}
          contentStyle={styles.saveButtonContent}
        >
          Back to Profile
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  header: {
    marginBottom: 22,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: -8,
  },
  title: {
    fontWeight: '800',
    marginTop: 12,
  },
  subtitle: {
    marginTop: 7,
    lineHeight: 21,
  },
  card: {
    borderRadius: 18,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  infoHeaderText: {
    flex: 1,
  },
  input: {
    marginBottom: 13,
    backgroundColor: 'transparent',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: -9,
    marginBottom: 12,
    marginLeft: 4,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 13,
    marginTop: 18,
  },
  noteText: {
    flex: 1,
    marginLeft: 10,
    lineHeight: 20,
    fontSize: 13,
  },
  saveButton: {
    marginTop: 24,
    borderRadius: 12,
  },
  saveButtonContent: {
    minHeight: 48,
  },
  cancelButton: {
    marginTop: 12,
    borderRadius: 12,
  },
});
