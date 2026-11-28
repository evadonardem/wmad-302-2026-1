/**
 * Register Screen
 * Validates the form inline, creates the account through AuthContext.register
 * (which signs the user in), and the (auth) layout then redirects to the shop.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Button, TextInput as PaperTextInput, Checkbox, HelperText } from 'react-native-paper';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks';
import { LivelyBackground } from '@/components/LivelyBackground';
import { useAppTheme } from '@/context/SettingsContext';
import { SEASONS } from '@/constants/seasons';
import { makeAuthStyles } from '@/styles/auth';
import {
  RegisterFormErrors,
  RegisterFormValues,
  hasErrors,
  validateRegisterForm,
} from '@/utils/validation';

type TextField = Exclude<keyof RegisterFormValues, 'gender'>;

const INITIAL_VALUES: RegisterFormValues = {
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
  const styles = useThemedStyles(makeAuthStyles);
  const { season } = useAppTheme();
  const { register, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState<RegisterFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateForm = (next: RegisterFormValues, terms = agreedToTerms) => {
    setFormData(next);
    // After the first submit attempt, re-validate as the user types
    if (submitted) setErrors(validateRegisterForm(next, terms));
    if (error) clearError();
  };

  const handleFieldChange = (field: TextField, value: string) => {
    updateForm({ ...formData, [field]: value });
  };

  const toggleTerms = () => {
    const next = !agreedToTerms;
    setAgreedToTerms(next);
    if (submitted) setErrors(validateRegisterForm(formData, next));
  };

  const handleRegister = async () => {
    setSubmitted(true);
    const validationErrors = validateRegisterForm(formData, agreedToTerms);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        password: formData.password,
        email: formData.email.trim(),
        age: formData.age.trim() ? Number(formData.age) : undefined,
        gender: formData.gender,
      });
      // Auto-login done: the (auth) layout redirects to /home
    } catch {
      // Error message is stored in context and shown above the button
    }
  };

  const renderField = (
    field: TextField,
    label: string,
    props: Partial<React.ComponentProps<typeof PaperTextInput>> = {}
  ) => (
    <View style={styles.fieldGroup}>
      <PaperTextInput
        label={label}
        mode="outlined"
        value={formData[field]}
        onChangeText={(v) => handleFieldChange(field, v)}
        error={!!errors[field]}
        disabled={isLoading}
        style={styles.fieldInput}
        returnKeyType="next"
        {...props}
      />
      <HelperText type="error" visible={!!errors[field]}>
        {errors[field] ?? ' '}
      </HelperText>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LivelyBackground />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>{SEASONS[season].decoration}</Text>
          <Text style={styles.appName}>Marketplace</Text>
          <Text style={styles.tagline}>Create Your Account</Text>
        </View>

        <Card style={styles.card} elevation={3}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start shopping smarter today</Text>

            <View style={styles.nameRow}>
              <View style={styles.halfInput}>
                {renderField('firstName', 'First Name', { autoCapitalize: 'words', autoComplete: 'given-name' })}
              </View>
              <View style={styles.halfInput}>
                {renderField('lastName', 'Last Name', { autoCapitalize: 'words', autoComplete: 'family-name' })}
              </View>
            </View>

            {renderField('username', 'Username', {
              autoCapitalize: 'none',
              autoCorrect: false,
              autoComplete: 'username',
            })}

            {renderField('email', 'Email', {
              autoCapitalize: 'none',
              keyboardType: 'email-address',
              autoComplete: 'email',
            })}

            {renderField('password', 'Password', {
              secureTextEntry: !showPassword,
              autoComplete: 'new-password',
              right: (
                <PaperTextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword((v) => !v)}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                />
              ),
            })}

            {renderField('confirmPassword', 'Confirm Password', {
              secureTextEntry: !showConfirmPassword,
              autoComplete: 'new-password',
              right: (
                <PaperTextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword((v) => !v)}
                  accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                />
              ),
            })}

            {/* Optional Fields */}
            <View style={styles.optionalRow}>
              <View style={styles.halfInput}>
                {renderField('age', 'Age (Optional)', { keyboardType: 'number-pad', maxLength: 3 })}
              </View>
              <View style={[styles.halfInput, styles.genderSelector]}>
                <Text style={styles.genderLabel}>Gender</Text>
                <View style={styles.genderOptions}>
                  {(['male', 'female'] as const).map((gender) => {
                    const selected = formData.gender === gender;
                    return (
                      <TouchableOpacity
                        key={gender}
                        onPress={() => updateForm({ ...formData, gender })}
                        style={[styles.genderOption, selected && styles.genderOptionSelected]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                      >
                        <Text style={[styles.genderOptionText, selected && styles.genderOptionTextSelected]}>
                          {gender === 'male' ? '♂ Male' : '♀ Female'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={toggleTerms}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreedToTerms }}
            >
              <View style={styles.checkbox}>
                <Checkbox.Android status={agreedToTerms ? 'checked' : 'unchecked'} onPress={toggleTerms} />
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.linkText}>Terms of Service</Text> and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
            {errors.terms && (
              <HelperText type="error" style={styles.termsError}>
                {errors.terms}
              </HelperText>
            )}

            {error && (
              <View style={styles.errorContainer} accessibilityLiveRegion="polite">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.registerButton}
              disabled={isLoading}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonText}
            >
              Create Account
            </Button>

            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>
                ℹ️ DummyJSON simulates sign-ups without saving them, so new accounts are kept on this
                device. Use the demo account to see real order history.
              </Text>
            </View>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => {
                  clearError();
                  router.replace('/login');
                }}
                style={styles.link}
              >
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
