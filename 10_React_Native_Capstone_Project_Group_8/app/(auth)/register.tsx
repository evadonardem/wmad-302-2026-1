
/**
 * CartlyX Sign Up Screen
 *
 * Features:
 * - Real Supabase account registration.
 * - First name, last name, username, and email.
 * - Password and confirmation validation.
 * - Optional age and gender.
 * - Terms agreement.
 * - Email confirmation handling.
 * - Automatic session handling.
 * - Visible success and error messages.
 * - Dynamic Light/Dark theme support.
 */

import React, { useState } from 'react';

import {
  View,
  Text,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';

import { useRouter } from 'expo-router';

import { useAuth } from '@/context/AuthContext';

import {
  Card,
  Button,
  TextInput as PaperTextInput,
  Checkbox,
  useTheme,
  type MD3Theme,
} from 'react-native-paper';

import { createAuthStyles } from './styles';

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const styles = createAuthStyles(theme);

  const {
    register,
    isLoading,
    error,
    clearError,
  } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: 'male' as 'male' | 'female',
  });

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [successAction, setSuccessAction] = useState<
    'login' | 'home' | null
  >(null);

  /**
   * Validate registration form.
   */
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email.trim())) {
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

      if (
        !Number.isInteger(age) ||
        age < 13 ||
        age > 120
      ) {
        return 'Age must be a whole number between 13 and 120.';
      }
    }

    if (!agreedToTerms) {
      return 'You must agree to the Terms of Service.';
    }

    return null;
  };

  /**
   * Reset the registration form.
   */
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      age: '',
      gender: 'male',
    });

    setAgreedToTerms(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  /**
   * Register a new Supabase account.
   */
  const handleRegister = async () => {
    setFormError('');
    setSuccessMessage('');
    setSuccessAction(null);

    if (error) {
      clearError();
    }

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      const result = await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        age: formData.age.trim()
          ? Number(formData.age)
          : undefined,
        gender: formData.gender,
      });

      // Clear the form only after successful registration.
      resetForm();

      if (result.needsEmailConfirmation) {
        setSuccessMessage(
          'Your CartlyX account has been created successfully! Please check your email and verify your account before signing in.',
        );

        setSuccessAction('login');
        return;
      }

      setSuccessMessage(
        'Congratulations! Your CartlyX account has been created successfully. You can now start shopping!',
      );

      setSuccessAction('home');
    } catch (registrationError) {
      console.error(
        'Registration failed:',
        registrationError,
      );

      const message =
        registrationError instanceof Error
          ? registrationError.message
          : 'Something went wrong during registration. Please try again.';

      setFormError(message);
    }
  };

  /**
   * Update form fields.
   */
  const handleFieldChange = (
    field: string,
    value: string,
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFormError('');
    setSuccessMessage('');
    setSuccessAction(null);

    if (error) {
      clearError();
    }
  };

  /**
   * Continue after successful registration.
   */
  const handleSuccessContinue = () => {
    if (successAction === 'login') {
      router.replace('/(auth)/login');
      return;
    }

    if (successAction === 'home') {
      router.replace('/(app)/(tabs)/home');
    }
  };

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
        {/* CartlyX Brand */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
            accessibilityLabel="CartlyX logo"
          />

          <Text style={styles.appName}>
            CartlyX
          </Text>

          <Text style={styles.tagline}>
            YOUR SHOPPING. REDEFINED.
          </Text>
        </View>

        {/* Registration Card */}
        <Card style={styles.card} elevation={3}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.title}>
              Create Account
            </Text>

            <Text style={styles.subtitle}>
              Join CartlyX and discover a smarter shopping experience.
            </Text>

            {/* Success Message */}
            {successMessage ? (
              <View
                style={{
                  backgroundColor: theme.colors.secondaryContainer,
                  borderRadius: 12,
                  padding: 15,
                  marginBottom: 18,
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.onSecondaryContainer,
                    fontSize: 16,
                    fontWeight: '800',
                    marginBottom: 8,
                  }}
                >
                  ✓ Registration Successful!
                </Text>

                <Text
                  style={{
                    color: theme.colors.onSecondaryContainer,
                    fontSize: 14,
                    lineHeight: 21,
                  }}
                >
                  {successMessage}
                </Text>

                <Button
                  mode="contained"
                  onPress={handleSuccessContinue}
                  style={{ marginTop: 14, borderRadius: 10 }}
                  buttonColor={theme.colors.primary}
                >
                  {successAction === 'login'
                    ? 'Go to Sign In'
                    : 'Continue to CartlyX'}
                </Button>
              </View>
            ) : null}

            {/* Validation / Registration Error */}
            {formError || error ? (
              <View
                style={{
                  backgroundColor: theme.colors.errorContainer,
                  borderRadius: 10,
                  padding: 13,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: theme.colors.error,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.onErrorContainer,
                    fontWeight: '800',
                    marginBottom: 5,
                  }}
                >
                  Registration Failed
                </Text>

                <Text
                  style={{
                    color: theme.colors.onErrorContainer,
                    fontSize: 14,
                    lineHeight: 20,
                  }}
                >
                  {formError || error}
                </Text>
              </View>
            ) : null}

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
                disabled={isLoading || !!successMessage}
                left={
                  <PaperTextInput.Icon icon="account-outline" />
                }
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
                disabled={isLoading || !!successMessage}
                left={
                  <PaperTextInput.Icon icon="account-outline" />
                }
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
              autoCorrect={false}
              autoComplete="username"
              returnKeyType="next"
              disabled={isLoading || !!successMessage}
              left={
                <PaperTextInput.Icon icon="at" />
              }
            />

            {/* Email */}
            <PaperTextInput
              label="Email Address"
              mode="outlined"
              value={formData.email}
              onChangeText={(value) =>
                handleFieldChange('email', value)
              }
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              disabled={isLoading || !!successMessage}
              left={
                <PaperTextInput.Icon icon="email-outline" />
              }
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
              textContentType="newPassword"
              returnKeyType="next"
              disabled={isLoading || !!successMessage}
              left={
                <PaperTextInput.Icon icon="lock-outline" />
              }
              right={
                <PaperTextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() =>
                    setShowPassword(!showPassword)
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
              textContentType="newPassword"
              returnKeyType="next"
              disabled={isLoading || !!successMessage}
              left={
                <PaperTextInput.Icon icon="lock-check-outline" />
              }
              right={
                <PaperTextInput.Icon
                  icon={
                    showConfirmPassword ? 'eye-off' : 'eye'
                  }
                  onPress={() =>
                    setShowConfirmPassword(!showConfirmPassword)
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
                returnKeyType="next"
                disabled={isLoading || !!successMessage}
                left={
                  <PaperTextInput.Icon icon="calendar-outline" />
                }
              />

              <View
                style={[
                  styles.halfInput,
                  styles.genderSelector,
                ]}
              >
                <Text style={styles.genderLabel}>
                  Gender
                </Text>

                <View style={styles.genderOptions}>
                  <TouchableOpacity
                    onPress={() =>
                      handleFieldChange('gender', 'male')
                    }
                    disabled={isLoading || !!successMessage}
                    style={[
                      styles.genderOption,
                      formData.gender === 'male' &&
                        styles.genderOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.genderOptionText,
                        formData.gender === 'male' &&
                          styles.genderOptionTextSelected,
                      ]}
                    >
                      Male
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      handleFieldChange('gender', 'female')
                    }
                    disabled={isLoading || !!successMessage}
                    style={[
                      styles.genderOption,
                      formData.gender === 'female' &&
                        styles.genderOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.genderOptionText,
                        formData.gender === 'female' &&
                          styles.genderOptionTextSelected,
                      ]}
                    >
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Terms Checkbox */}
            <View style={styles.termsContainer}>
              <View style={styles.checkbox}>
                <Checkbox
                  status={
                    agreedToTerms ? 'checked' : 'unchecked'
                  }
                  onPress={() =>
                    setAgreedToTerms(!agreedToTerms)
                  }
                  disabled={isLoading || !!successMessage}
                  color={theme.colors.primary}
                />
              </View>

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

            {/* Create Account Button */}
            {!successMessage ? (
              <Button
                mode="contained"
                onPress={handleRegister}
                loading={isLoading}
                style={styles.registerButton}
                disabled={isLoading}
                contentStyle={styles.buttonContent}
                buttonColor={theme.colors.primary}
              >
                {!isLoading && (
                  <Text style={styles.buttonText}>
                    Create Account
                  </Text>
                )}
              </Button>
            ) : null}

            {/* Sign In Link */}
            {!successMessage ? (
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>
                  Already have an account?{' '}
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    router.replace('/(auth)/login')
                  }
                  style={styles.link}
                  disabled={isLoading}
                >
                  <Text style={styles.linkText}>
                    Sign In
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
