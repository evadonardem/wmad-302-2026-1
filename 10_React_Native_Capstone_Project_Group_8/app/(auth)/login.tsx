
/**
 * Login Screen - Marketplace App
 *
 * Features:
 * - Supabase email and password login.
 * - Separate DummyJSON demo account login.
 * - Dynamic Light/Dark theme support.
 * - Supports protected-route redirects.
 */

import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';

import {
  useRouter,
  useLocalSearchParams,
} from 'expo-router';

import { useAuth } from '@/context/AuthContext';

import {
  Card,
  Button,
  TextInput as PaperTextInput,
  Divider,
  useTheme,
  type MD3Theme,
} from 'react-native-paper';

import { createAuthStyles } from './styles';

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const styles = createAuthStyles(theme);

  const {
    login,
    loginDemo,
    isLoading,
    error,
    clearError,
  } = useAuth();

  const { redirect } =
    useLocalSearchParams<{ redirect?: string }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Supabase email login.
   */
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        'Missing Information',
        'Please enter both your email address and password.',
      );
      return;
    }

    try {
      await login(
        email.trim().toLowerCase(),
        password,
      );

      router.replace(
        redirect || '/(app)/(tabs)/home',
      );
    } catch {
      // Authentication errors are handled by AuthContext.
    }
  };

  /**
   * DummyJSON demo account login.
   */
  const handleDemoLogin = async () => {
    try {
      await loginDemo(
        'emilys',
        'emilyspass',
      );

      router.replace(
        redirect || '/(app)/(tabs)/home',
      );
    } catch {
      // Authentication errors are handled by AuthContext.
    }
  };

  /**
   * Display authentication errors.
   */
  useEffect(() => {
    if (error) {
      Alert.alert(
        'Login Failed',
        error,
        [
          {
            text: 'OK',
            onPress: clearError,
          },
        ],
      );
    }
  }, [error, clearError]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : 'height'
      }
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo and Brand */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>🛒</Text>

          <Text style={styles.appName}>
            Marketplace
          </Text>

          <Text style={styles.tagline}>
            Shop Smart, Save More
          </Text>
        </View>

        {/* Login Card */}
        <Card
          style={styles.card}
          elevation={3}
        >
          <Card.Content style={styles.cardContent}>
            <Text style={styles.title}>
              Welcome Back
            </Text>

            <Text style={styles.subtitle}>
              Sign in to continue shopping
            </Text>

            {/* Email Field */}
            <PaperTextInput
              label="Email Address"
              mode="outlined"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              keyboardType="email-address"
              returnKeyType="next"
              disabled={isLoading}
            />

            {/* Password Field */}
            <PaperTextInput
              label="Password"
              mode="outlined"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              disabled={isLoading}
              right={
                <PaperTextInput.Icon
                  icon={
                    showPassword
                      ? 'eye-off'
                      : 'eye'
                  }
                  onPress={() =>
                    setShowPassword(!showPassword)
                  }
                />
              }
            />

            {/* Error Display */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  {error}
                </Text>
              </View>
            )}

            {/* Sign In Button */}
            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
              disabled={isLoading}
              contentStyle={styles.buttonContent}
            >
              {isLoading ? (
                <ActivityIndicator
                  color="white"
                  size="small"
                />
              ) : (
                <Text style={styles.buttonText}>
                  Sign In
                </Text>
              )}
            </Button>

            {/* Demo Login */}
            <View style={styles.demoContainer}>
              <Divider style={styles.divider} />

              <TouchableOpacity
                onPress={handleDemoLogin}
                disabled={isLoading}
                style={styles.demoButton}
              >
                <Text style={styles.demoButtonText}>
                  Try Demo Account (emilys / emilyspass)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Registration Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>
                Don&apos;t have an account?{' '}
              </Text>

              <TouchableOpacity
                onPress={() =>
                  router.push('/(auth)/register')
                }
                style={styles.link}
                disabled={isLoading}
              >
                <Text style={styles.linkText}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing in, you agree to our Terms of
            Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
