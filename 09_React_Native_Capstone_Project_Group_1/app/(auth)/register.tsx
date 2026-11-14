
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import {
  Button,
  TextInput as PaperTextInput,
  Checkbox,
} from 'react-native-paper';

const COLORS = {
  background: '#F8F7F1',
  white: '#FFFFFF',
  primary: '#24543D',
  primaryLight: '#EAF1E9',
  text: '#26372C',
  muted: '#858B80',
  border: '#E4E5DC',
  gold: '#D8B66A',
  error: '#C62828',
};

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();

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
  const [validationMessage, setValidationMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.username.trim()) return 'Username is required';

    if (formData.username.trim().length < 3) {
      return 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) return 'Email is required';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      return 'Invalid email format';
    }

    if (!formData.password) return 'Password is required';

    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }

    if (
      formData.age &&
      (
        !Number.isInteger(Number(formData.age)) ||
        Number(formData.age) < 13 ||
        Number(formData.age) > 120
      )
    ) {
      return 'Age must be a whole number between 13 and 120';
    }

    if (!agreedToTerms) {
      return 'You must agree to the Terms of Service';
    }

    return null;
  };

  const handleRegister = async () => {
    const validationError = validateForm();

    if (validationError) {
      setValidationMessage(validationError);
      return;
    }

    setValidationMessage('');

    try {
      const registrationData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        age: formData.age ? Number(formData.age) : undefined,
        gender: formData.gender,
      };

      await register(registrationData);

      Alert.alert(
        'Registration Successful',
        'Your account has been created. You can now log in.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to create your account. Please try again.';

      Alert.alert('Registration Failed', message);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setValidationMessage('');

    if (error) {
      clearError();
    }
  };

  useEffect(() => {
    if (error) {
      Alert.alert(
        'Registration Failed',
        error,
        [{ text: 'OK', onPress: clearError }]
      );
    }
  }, [error, clearError]);

  const inputTheme = {
    colors: {
      primary: COLORS.primary,
      outline: COLORS.border,
      background: COLORS.white,
      onSurfaceVariant: COLORS.muted,
    },
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logo}>🍳</Text>
          </View>

          <Text style={styles.appName}>Cookbook</Text>
          <Text style={styles.tagline}>
            Your kitchen, your recipes, your story.
          </Text>
        </View>

        {/* Registration Form */}
        <View style={styles.formContainer}>
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join us and start your cooking journey.
            </Text>
          </View>

          {/* Personal Information */}
          <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>

          <View style={styles.nameRow}>
            <View style={styles.halfInput}>
              <PaperTextInput
                label="First Name"
                mode="outlined"
                value={formData.firstName}
                onChangeText={(value) => handleFieldChange('firstName', value)}
                style={styles.input}
                outlineStyle={styles.inputOutline}
                theme={inputTheme}
                left={<PaperTextInput.Icon icon="account-outline" />}
                autoCapitalize="words"
                autoComplete="given-name"
                disabled={isLoading}
              />
            </View>

            <View style={styles.halfInput}>
              <PaperTextInput
                label="Last Name"
                mode="outlined"
                value={formData.lastName}
                onChangeText={(value) => handleFieldChange('lastName', value)}
                style={styles.input}
                outlineStyle={styles.inputOutline}
                theme={inputTheme}
                left={<PaperTextInput.Icon icon="account-outline" />}
                autoCapitalize="words"
                autoComplete="family-name"
                disabled={isLoading}
              />
            </View>
          </View>

          <PaperTextInput
            label="Username"
            mode="outlined"
            value={formData.username}
            onChangeText={(value) => handleFieldChange('username', value)}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            theme={inputTheme}
            left={<PaperTextInput.Icon icon="at" />}
            autoCapitalize="none"
            autoComplete="username"
            disabled={isLoading}
          />

          <PaperTextInput
            label="Email Address"
            mode="outlined"
            value={formData.email}
            onChangeText={(value) => handleFieldChange('email', value)}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            theme={inputTheme}
            left={<PaperTextInput.Icon icon="email-outline" />}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            disabled={isLoading}
          />

          {/* Account Security */}
          <Text style={styles.sectionTitle}>ACCOUNT SECURITY</Text>

          <PaperTextInput
            label="Password"
            mode="outlined"
            value={formData.password}
            onChangeText={(value) => handleFieldChange('password', value)}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            theme={inputTheme}
            left={<PaperTextInput.Icon icon="lock-outline" />}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            disabled={isLoading}
            right={
              <PaperTextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          <PaperTextInput
            label="Confirm Password"
            mode="outlined"
            value={formData.confirmPassword}
            onChangeText={(value) =>
              handleFieldChange('confirmPassword', value)
            }
            style={styles.input}
            outlineStyle={styles.inputOutline}
            theme={inputTheme}
            left={<PaperTextInput.Icon icon="lock-check-outline" />}
            secureTextEntry={!showConfirmPassword}
            autoComplete="new-password"
            disabled={isLoading}
            right={
              <PaperTextInput.Icon
                icon={showConfirmPassword ? 'eye-off' : 'eye'}
                onPress={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
              />
            }
          />

          {/* Additional Details */}
          <Text style={styles.sectionTitle}>ADDITIONAL DETAILS</Text>

          <View style={styles.optionalRow}>
            <View style={styles.ageInput}>
              <PaperTextInput
                label="Age (Optional)"
                mode="outlined"
                value={formData.age}
                onChangeText={(value) => handleFieldChange('age', value)}
                style={styles.input}
                outlineStyle={styles.inputOutline}
                theme={inputTheme}
                left={<PaperTextInput.Icon icon="calendar-outline" />}
                keyboardType="numeric"
                disabled={isLoading}
              />
            </View>
          </View>

          <Text style={styles.genderLabel}>Gender</Text>

          <View style={styles.genderOptions}>
            <TouchableOpacity
              onPress={() => handleFieldChange('gender', 'male')}
              disabled={isLoading}
              style={[
                styles.genderOption,
                formData.gender === 'male' && styles.genderSelected,
              ]}
            >
              <Text
                style={[
                  styles.genderText,
                  formData.gender === 'male' && styles.genderTextSelected,
                ]}
              >
                ♂  Male
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleFieldChange('gender', 'female')}
              disabled={isLoading}
              style={[
                styles.genderOption,
                formData.gender === 'female' && styles.genderSelected,
              ]}
            >
              <Text
                style={[
                  styles.genderText,
                  formData.gender === 'female' && styles.genderTextSelected,
                ]}
              >
                ♀  Female
              </Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <View style={styles.termsContainer}>
            <Checkbox
              status={agreedToTerms ? 'checked' : 'unchecked'}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              color={COLORS.primary}
              disabled={isLoading}
            />

            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsHighlight}>Terms of Service</Text>
              {' and '}
              <Text style={styles.termsHighlight}>Privacy Policy</Text>.
            </Text>
          </View>

          {/* Validation */}
          {validationMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{validationMessage}</Text>
            </View>
          ) : null}

          {/* Create Account */}
          <Button
            mode="contained"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            style={styles.registerButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            buttonColor={COLORS.primary}
          >
            Create Account
          </Button>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>

            <TouchableOpacity
              onPress={() => router.replace('/(auth)/login')}
              disabled={isLoading}
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footer}>
          Made for food lovers ♡
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? 35 : 55,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    fontSize: 36,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.8,
  },
  tagline: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 5,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 21,
    borderWidth: 1,
    borderColor: '#ECEDE5',
    elevation: 3,
    shadowColor: '#26372C',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
  },
  headingContainer: {
    marginBottom: 25,
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 6,
    lineHeight: 19,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.2,
    marginTop: 8,
    marginBottom: 13,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
    minWidth: 0,
  },
  input: {
    backgroundColor: COLORS.white,
    marginBottom: 13,
    fontSize: 14,
  },
  inputOutline: {
    borderRadius: 13,
    borderWidth: 1,
  },
  optionalRow: {
    flexDirection: 'row',
  },
  ageInput: {
    flex: 1,
  },
  genderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 9,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  genderSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  genderText: {
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: '600',
  },
  genderTextSelected: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    marginBottom: 12,
    marginLeft: -8,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
    color: COLORS.muted,
  },
  termsHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  errorContainer: {
    backgroundColor: '#FDECEC',
    borderRadius: 10,
    padding: 11,
    marginBottom: 13,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '600',
  },
  registerButton: {
    borderRadius: 13,
    marginTop: 5,
  },
  buttonContent: {
    height: 52,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 21,
    flexWrap: 'wrap',
  },
  loginText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  footer: {
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 22,
  },
});
