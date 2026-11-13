/**
 * Register Screen - Cookbook
 * User registration with form validation, password confirmation, terms agreement, and auto-login
 */
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Card, Button, TextInput as PaperTextInput, Checkbox } from 'react-native-paper';
import { styles } from './styles';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.username.trim()) return 'Username is required';
    if (formData.username.trim().length < 3) return 'Username must be at least 3 characters';
    if (!formData.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) return 'Invalid email format';
    if (!formData.password) return 'Password is required';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    if (formData.age && (parseInt(formData.age, 10) < 13 || parseInt(formData.age, 10) > 120)) {
      return 'Age must be between 13 and 120';
    }
    if (!agreedToTerms) return 'You must agree to the Terms of Service';
    return null;
  };

  const handleRegister = async () => {
    const err = validateForm();
    if (err) {
      setValidationError(err);
      if (Platform.OS !== 'web') {
        Alert.alert('Validation Error', err);
      }
      return;
    }

    setValidationError(null);

    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        password: formData.password,
        email: formData.email.trim(),
        age: formData.age ? parseInt(formData.age, 10) : undefined,
        gender: formData.gender,
      });
      router.replace('/(app)/(tabs)/home');
    } catch {
      // Error surfaced via AuthContext error state
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationError) setValidationError(null);
    if (error) clearError();
  };

  useEffect(() => {
    if (error && Platform.OS !== 'web') {
      Alert.alert('Registration Failed', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const activeError = validationError || error;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>🍳</Text>
          <Text style={styles.appName}>Cookbook</Text>
          <Text style={styles.tagline}>Create Your Account</Text>
        </View>

        <Card style={styles.card} elevation={3}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start building your recipe collection</Text>

            {activeError && (
              <View style={localStyles.errorBanner}>
                <Text style={localStyles.errorBannerText}>{activeError}</Text>
              </View>
            )}

            <View style={localStyles.row}>
              <PaperTextInput
                label="First Name"
                mode="outlined"
                value={formData.firstName}
                onChangeText={(v) => handleFieldChange('firstName', v)}
                style={[styles.input, localStyles.halfInput]}
                autoCapitalize="words"
                autoComplete="given-name"
                returnKeyType="next"
                disabled={isLoading}
              />
              <PaperTextInput
                label="Last Name"
                mode="outlined"
                value={formData.lastName}
                onChangeText={(v) => handleFieldChange('lastName', v)}
                style={[styles.input, localStyles.halfInput]}
                autoCapitalize="words"
                autoComplete="family-name"
                returnKeyType="next"
                disabled={isLoading}
              />
            </View>

            <PaperTextInput
              label="Username"
              mode="outlined"
              value={formData.username}
              onChangeText={(v) => handleFieldChange('username', v)}
              style={styles.input}
              autoCapitalize="none"
              autoComplete="username"
              returnKeyType="next"
              disabled={isLoading}
            />

            <PaperTextInput
              label="Email"
              mode="outlined"
              value={formData.email}
              onChangeText={(v) => handleFieldChange('email', v)}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="next"
              disabled={isLoading}
            />

            <PaperTextInput
              label="Password"
              mode="outlined"
              value={formData.password}
              onChangeText={(v) => handleFieldChange('password', v)}
              style={styles.input}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              returnKeyType="next"
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
              onChangeText={(v) => handleFieldChange('confirmPassword', v)}
              style={styles.input}
              secureTextEntry={!showConfirmPassword}
              autoComplete="new-password"
              returnKeyType="next"
              disabled={isLoading}
              right={
                <PaperTextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
            />

            <View style={localStyles.row}>
              <PaperTextInput
                label="Age (Optional)"
                mode="outlined"
                value={formData.age}
                onChangeText={(v) => handleFieldChange('age', v)}
                style={[styles.input, localStyles.halfInput]}
                keyboardType="numeric"
                returnKeyType="done"
                disabled={isLoading}
              />
              <View style={[localStyles.halfInput, localStyles.genderBox]}>
                <Text style={localStyles.genderLabel}>Gender</Text>
                <View style={localStyles.genderOptions}>
                  <TouchableOpacity
                    onPress={() => handleFieldChange('gender', 'male')}
                    style={[
                      localStyles.genderOption,
                      formData.gender === 'male' && localStyles.genderOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        localStyles.genderOptionText,
                        formData.gender === 'male' && localStyles.genderOptionTextSelected,
                      ]}
                    >
                      ♂ Male
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleFieldChange('gender', 'female')}
                    style={[
                      localStyles.genderOption,
                      formData.gender === 'female' && localStyles.genderOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        localStyles.genderOptionText,
                        formData.gender === 'female' && localStyles.genderOptionTextSelected,
                      ]}
                    >
                      ♀ Female
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={localStyles.termsRow}>
              <Checkbox
                status={agreedToTerms ? 'checked' : 'unchecked'}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                color="#E85D04"
              />
              <Text style={localStyles.termsText} onPress={() => setAgreedToTerms(!agreedToTerms)}>
                I agree to the <Text style={localStyles.linkText}>Terms of Service</Text> and{' '}
                <Text style={localStyles.linkText}>Privacy Policy</Text>
              </Text>
            </View>

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={isLoading}
              style={localStyles.registerButton}
              disabled={isLoading}
              contentStyle={styles.buttonContent}
            >
              Create Account
            </Button>

            <View style={localStyles.loginRow}>
              <Text style={localStyles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={localStyles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const localStyles = StyleSheet.create({
  errorBanner: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorBannerText: {
    color: '#C62828',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  genderBox: {
    justifyContent: 'center',
    marginBottom: 12,
  },
  genderLabel: {
    fontSize: 12,
    color: '#8D6E63',
    marginBottom: 4,
    fontWeight: '600',
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D7CCC8',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  genderOptionSelected: {
    backgroundColor: '#E85D04',
    borderColor: '#E85D04',
  },
  genderOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5D4037',
  },
  genderOptionTextSelected: {
    color: '#FFFFFF',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#5D4037',
  },
  registerButton: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#E85D04',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: 14,
    color: '#8D6E63',
  },
  linkText: {
    fontSize: 14,
    color: '#E85D04',
    fontWeight: '700',
  },
});
