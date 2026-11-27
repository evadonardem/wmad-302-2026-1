/**
 * Register Screen - creates a local demo account on this browser/device.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Button, Card, Checkbox, HelperText, SegmentedButtons, Text } from 'react-native-paper';
import { FormField } from '@/components/FormField';
import { useAppTheme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { createAuthStyles } from '@/styles/authStyles';
import { Gender } from '@/types/auth';
import { routes } from '@/utils/routes';
import { FieldErrors, hasErrors, RegisterFormValues, validateRegisterForm } from '@/utils/validation';

const INITIAL_VALUES: RegisterFormValues = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  age: '',
  agreedToTerms: false,
};

export default function RegisterScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createAuthStyles(theme), [theme]);
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();

  const [values, setValues] = useState<RegisterFormValues>(INITIAL_VALUES);
  const [gender, setGender] = useState<Gender>('male');
  const [errors, setErrors] = useState<FieldErrors<keyof RegisterFormValues>>({});

  const update = <K extends keyof RegisterFormValues>(field: K, value: RegisterFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (error) clearError();
  };
  const text = (field: Exclude<keyof RegisterFormValues, 'agreedToTerms'>) => (value: string) => update(field, value);

  const handleRegister = async () => {
    const found = validateRegisterForm(values);
    setErrors(found);
    if (hasErrors(found)) return;

    try {
      await register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        age: values.age.trim() ? Number.parseInt(values.age, 10) : undefined,
        gender,
      });
    } catch {
      // The failure message is shown from the auth context.
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.brand}>
          <MaterialCommunityIcons name="storefront" size={48} color={theme.colors.primary} />
          <Text variant="headlineMedium" style={styles.brandName}>
            Marketplace
          </Text>
        </View>

        <Card style={styles.card} mode="elevated">
          <Card.Content style={styles.cardContent}>
            <Text variant="titleLarge" style={styles.title}>
              Create your account
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Local demo account saved on this browser or device. Do not use a password you use elsewhere.
            </Text>

            <View style={styles.row}>
              <View style={styles.half}>
                <FormField label="First name" value={values.firstName} onChangeText={text('firstName')} error={errors.firstName} autoCapitalize="words" autoComplete="given-name" disabled={isLoading} />
              </View>
              <View style={styles.half}>
                <FormField label="Last name" value={values.lastName} onChangeText={text('lastName')} error={errors.lastName} autoCapitalize="words" autoComplete="family-name" disabled={isLoading} />
              </View>
            </View>
            <FormField label="Username" value={values.username} onChangeText={text('username')} error={errors.username} autoCapitalize="none" autoComplete="username" disabled={isLoading} />
            <FormField label="Email" value={values.email} onChangeText={text('email')} error={errors.email} autoCapitalize="none" keyboardType="email-address" autoComplete="email" disabled={isLoading} />
            <FormField label="Password" value={values.password} onChangeText={text('password')} error={errors.password} secureToggle autoCapitalize="none" autoComplete="new-password" disabled={isLoading} />
            <FormField label="Confirm password" value={values.confirmPassword} onChangeText={text('confirmPassword')} error={errors.confirmPassword} secureToggle autoCapitalize="none" autoComplete="new-password" disabled={isLoading} />
            <FormField label="Age (optional)" value={values.age} onChangeText={text('age')} error={errors.age} keyboardType="number-pad" disabled={isLoading} />

            <Text variant="labelLarge" style={styles.genderLabel}>
              Gender
            </Text>
            <SegmentedButtons
              style={styles.genderRow}
              value={gender}
              onValueChange={(next) => setGender(next as Gender)}
              buttons={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ]}
            />

            <View style={styles.termsRow}>
              <Checkbox.Android status={values.agreedToTerms ? 'checked' : 'unchecked'} onPress={() => update('agreedToTerms', !values.agreedToTerms)} disabled={isLoading} />
              <Text variant="bodyMedium" style={styles.termsText} onPress={() => update('agreedToTerms', !values.agreedToTerms)}>
                I agree to the Terms of Service and Privacy Policy
              </Text>
            </View>
            <HelperText type="error" visible={Boolean(errors.agreedToTerms)}>
              {errors.agreedToTerms ?? ''}
            </HelperText>

            {error ? (
              <View style={styles.errorBanner} accessibilityLiveRegion="assertive">
                <Text variant="bodyMedium" style={styles.errorText}>
                  {error}
                </Text>
              </View>
            ) : null}

            <Button mode="contained" onPress={handleRegister} loading={isLoading} disabled={isLoading} style={styles.primaryButton} contentStyle={styles.buttonContent}>
              Create account
            </Button>

            <View style={styles.footerRow}>
              <Text variant="bodyMedium">Already have an account?</Text>
              <Button mode="text" compact onPress={() => router.replace(routes.login())} disabled={isLoading}>
                Sign in
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
