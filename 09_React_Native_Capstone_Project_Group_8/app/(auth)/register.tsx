
/**
 * Register Screen - Cookbook
 * Green and white design with dynamic light/dark theme.
 * Includes form validation, inline feedback, and local account registration.
 */

import React, { useState } from 'react';

import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { useRouter } from 'expo-router';

import { useAuth } from '@/context/AuthContext';

import {
  Card,
  Button,
  TextInput as PaperTextInput,
  Checkbox,
  Divider,
  useTheme,
  MD3Theme,
} from 'react-native-paper';

type RegisterFormData = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: string;
  gender: 'male' | 'female';
};

type FormMessage = {
  type: 'success' | 'error';
  text: string;
};

const initialFormData: RegisterFormData = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  age: '',
  gender: 'male',
};

export default function RegisterScreen() {
  const router = useRouter();

  const { register, isLoading, clearError } = useAuth();

  const theme = useTheme<MD3Theme>();
  const colors = theme.colors;

  const [formData, setFormData] =
    useState<RegisterFormData>(initialFormData);

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [formMessage, setFormMessage] =
    useState<FormMessage | null>(null);

  const [registrationComplete, setRegistrationComplete] =
    useState(false);

  // Dynamic styles for light and dark themes.
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      padding: 20,
      paddingTop: 35,
      paddingBottom: 35,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 25,
    },
    logoText: {
      fontSize: 48,
      marginBottom: 5,
    },
    appName: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.primary,
    },
    tagline: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginTop: 5,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
    },
    cardContent: {
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 22,
    },
    nameRow: {
      flexDirection: 'row',
      gap: 10,
    },
    optionalRow: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
    },
    input: {
      marginBottom: 15,
      backgroundColor: colors.surface,
    },
    halfInput: {
      flex: 1,
    },
    genderSelector: {
      marginBottom: 15,
    },
    genderLabel: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      marginBottom: 8,
      marginTop: 5,
    },
    genderOptions: {
      flexDirection: 'row',
      gap: 6,
    },
    genderOption: {
      flex: 1,
      paddingVertical: 13,
      paddingHorizontal: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.outline,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    genderOptionSelected: {
      backgroundColor: colors.primaryContainer,
      borderColor: colors.primary,
    },
    genderOptionText: {
      fontSize: 12,
      color: colors.onSurface,
      fontWeight: '500',
    },
    genderOptionTextSelected: {
      color: colors.onPrimaryContainer,
      fontWeight: 'bold',
    },
    termsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 5,
      marginBottom: 20,
    },
    termsText: {
      flex: 1,
      fontSize: 13,
      color: colors.onSurface,
      lineHeight: 20,
    },
    linkText: {
      color: colors.primary,
      fontWeight: 'bold',
    },
    registerButton: {
      borderRadius: 10,
      backgroundColor: colors.primary,
    },
    buttonContent: {
      height: 50,
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: 15,
      fontWeight: 'bold',
    },
    loginContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginTop: 22,
    },
    loginText: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
    },
    link: {
      paddingVertical: 5,
    },
    divider: {
      marginVertical: 20,
      backgroundColor: colors.outlineVariant,
    },
    guideContainer: {
      marginTop: 20,
      padding: 15,
      borderRadius: 12,
      backgroundColor: colors.surfaceVariant,
    },
    guideTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: 8,
    },
    guideText: {
      fontSize: 12,
      lineHeight: 19,
      color: colors.onSurfaceVariant,
    },
    messageContainer: {
      padding: 12,
      borderRadius: 10,
      marginBottom: 18,
      borderWidth: 1,
    },
    errorMessage: {
      backgroundColor: colors.errorContainer,
      borderColor: colors.error,
    },
    successMessage: {
      backgroundColor: colors.primaryContainer,
      borderColor: colors.primary,
    },
    messageText: {
      fontSize: 13,
      lineHeight: 20,
      fontWeight: '500',
    },
    errorMessageText: {
      color: colors.onErrorContainer,
    },
    successMessageText: {
      color: colors.onPrimaryContainer,
    },
  });

  // Update form fields.
  const handleFieldChange = <K extends keyof RegisterFormData>(
    field: K,
    value: RegisterFormData[K]
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFormMessage(null);
    clearError();
  };

  // Validate registration form.
  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) {
      return 'First name is required.';
    }

    if (!formData.lastName.trim()) {
      return 'Last name is required.';
    }

    if (!formData.username.trim()) {
      return 'Username is required.';
    }

    if (formData.username.trim().length < 3) {
      return 'Username must be at least 3 characters.';
    }

    if (!formData.email.trim()) {
      return 'Email is required.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      return 'Please enter a valid email address.';
    }

    if (!formData.password) {
      return 'Password is required.';
    }

    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters.';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match.';
    }

    if (formData.age.trim()) {
      const age = Number(formData.age);

      if (!Number.isInteger(age) || age < 13 || age > 120) {
        return 'Age must be a whole number between 13 and 120.';
      }
    }

    if (!agreedToTerms) {
      return 'You must agree to the Terms of Service.';
    }

    return null;
  };

  // Submit registration.
  const handleRegister = async () => {
    if (registrationComplete) {
      router.replace('/(auth)/login');
      return;
    }

    if (isLoading) {
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setFormMessage({
        type: 'error',
        text: validationError,
      });
      return;
    }

    setFormMessage(null);
    clearError();

    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        age: formData.age.trim()
          ? Number(formData.age)
          : undefined,
        gender: formData.gender,
      });

      // Clear the form after successful registration.
      setFormData(initialFormData);
      setAgreedToTerms(false);
      setShowPassword(false);
      setShowConfirmPassword(false);

      // Show success message inside the registration form.
      setRegistrationComplete(true);

      setFormMessage({
        type: 'success',
        text: 'Account created successfully! Your account has been saved on this device. You can now continue to Sign In using your new username and password.',
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Registration failed. Please try again.';

      // Display registration errors directly in the form.
      setFormMessage({
        type: 'error',
        text: message,
      });
    }
  };

  const isFormDisabled = isLoading || registrationComplete;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo and Brand */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>🍳</Text>

          <Text style={styles.appName}>Cookbook</Text>

          <Text style={styles.tagline}>
            Create Your Account
          </Text>
        </View>

        {/* Registration Card */}
        <Card style={styles.card} elevation={3}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.title}>
              Create Account
            </Text>

            <Text style={styles.subtitle}>
              Start building your recipe collection.
            </Text>

            {/* Inline Registration Feedback */}
            {formMessage && (
              <View
                accessibilityRole="alert"
                style={[
                  styles.messageContainer,
                  formMessage.type === 'success'
                    ? styles.successMessage
                    : styles.errorMessage,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    formMessage.type === 'success'
                      ? styles.successMessageText
                      : styles.errorMessageText,
                  ]}
                >
                  {formMessage.type === 'success' ? '✓ ' : '⚠ '}
                  {formMessage.text}
                </Text>
              </View>
            )}

            {/* First and Last Name */}
            <View style={styles.nameRow}>
              <PaperTextInput
                label="First Name"
                mode="outlined"
                value={formData.firstName}
                onChangeText={(value) =>
                  handleFieldChange('firstName', value)
                }
                style={[styles.input, styles.halfInput]}
                autoCapitalize="words"
                autoComplete="given-name"
                returnKeyType="next"
                disabled={isFormDisabled}
              />

              <PaperTextInput
                label="Last Name"
                mode="outlined"
                value={formData.lastName}
                onChangeText={(value) =>
                  handleFieldChange('lastName', value)
                }
                style={[styles.input, styles.halfInput]}
                autoCapitalize="words"
                autoComplete="family-name"
                returnKeyType="next"
                disabled={isFormDisabled}
              />
            </View>

            {/* Username */}
            <PaperTextInput
              label="Username"
              mode="outlined"
              value={formData.username}
              onChangeText={(value) =>
                handleFieldChange('username', value)
              }
              style={styles.input}
              autoCapitalize="none"
              autoComplete="username"
              returnKeyType="next"
              disabled={isFormDisabled}
            />

            {/* Email */}
            <PaperTextInput
              label="Email"
              mode="outlined"
              value={formData.email}
              onChangeText={(value) =>
                handleFieldChange('email', value)
              }
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="next"
              disabled={isFormDisabled}
            />

            {/* Password */}
            <PaperTextInput
              label="Password"
              mode="outlined"
              value={formData.password}
              onChangeText={(value) =>
                handleFieldChange('password', value)
              }
              style={styles.input}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              returnKeyType="next"
              disabled={isFormDisabled}
              right={
                <PaperTextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() =>
                    setShowPassword((previous) => !previous)
                  }
                />
              }
            />

            {/* Confirm Password */}
            <PaperTextInput
              label="Confirm Password"
              mode="outlined"
              value={formData.confirmPassword}
              onChangeText={(value) =>
                handleFieldChange('confirmPassword', value)
              }
              style={styles.input}
              secureTextEntry={!showConfirmPassword}
              autoComplete="new-password"
              returnKeyType="next"
              disabled={isFormDisabled}
              right={
                <PaperTextInput.Icon
                  icon={
                    showConfirmPassword ? 'eye-off' : 'eye'
                  }
                  onPress={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                />
              }
            />

            {/* Optional Age and Gender */}
            <View style={styles.optionalRow}>
              <PaperTextInput
                label="Age (Optional)"
                mode="outlined"
                value={formData.age}
                onChangeText={(value) =>
                  handleFieldChange('age', value)
                }
                style={[styles.input, styles.halfInput]}
                keyboardType="numeric"
                returnKeyType="done"
                disabled={isFormDisabled}
              />

              <View style={[styles.halfInput, styles.genderSelector]}>
                <Text style={styles.genderLabel}>
                  Gender
                </Text>

                <View style={styles.genderOptions}>
                  <TouchableOpacity
                    onPress={() =>
                      handleFieldChange('gender', 'male')
                    }
                    style={[
                      styles.genderOption,
                      formData.gender === 'male' &&
                        styles.genderOptionSelected,
                    ]}
                    disabled={isFormDisabled}
                  >
                    <Text
                      style={[
                        styles.genderOptionText,
                        formData.gender === 'male' &&
                          styles.genderOptionTextSelected,
                      ]}
                    >
                      ♂ Male
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      handleFieldChange('gender', 'female')
                    }
                    style={[
                      styles.genderOption,
                      formData.gender === 'female' &&
                        styles.genderOptionSelected,
                    ]}
                    disabled={isFormDisabled}
                  >
                    <Text
                      style={[
                        styles.genderOptionText,
                        formData.gender === 'female' &&
                          styles.genderOptionTextSelected,
                      ]}
                    >
                      ♀ Female
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <Checkbox
                status={
                  agreedToTerms ? 'checked' : 'unchecked'
                }
                onPress={() =>
                  setAgreedToTerms((previous) => !previous)
                }
                disabled={isFormDisabled}
                color={colors.primary}
              />

              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.linkText}>
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text style={styles.linkText}>
                  Privacy Policy
                </Text>
              </Text>
            </View>

            {/* Create Account / Continue Button */}
            <Button
              mode="contained"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              style={styles.registerButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonText}
            >
              {registrationComplete
                ? 'Continue to Sign In'
                : 'Create Account'}
            </Button>

            <Divider style={styles.divider} />

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>
                Already have an account?{' '}
              </Text>

              <TouchableOpacity
                onPress={() =>
                  router.replace('/(auth)/login')
                }
                disabled={isLoading}
                style={styles.link}
              >
                <Text style={styles.linkText}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Registration Information */}
        <View style={styles.guideContainer}>
          <Text style={styles.guideTitle}>
            📝 Registration Information
          </Text>

          <Text style={styles.guideText}>
            • Complete all required fields.
            {'\n'}• Username must have at least 3 characters.
            {'\n'}• Password must have at least 6 characters.
            {'\n'}• Age is optional.
            {'\n'}• Agree to the Terms of Service to continue.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
