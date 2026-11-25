
/**
 * CartlyX Sign In Screen
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
  Image,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
      await loginDemo('emilys', 'emilyspass');

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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
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

          <Text style={styles.appName}>CartlyX</Text>

          <Text style={styles.tagline}>
            YOUR SHOPPING. REDEFINED.
          </Text>
        </View>

        {/* Sign In Card */}
        <Card style={styles.card} elevation={3}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.title}>
              Welcome Back!
            </Text>

            <Text style={styles.subtitle}>
              Sign in to your CartlyX account and continue shopping.
            </Text>

            {/* Email */}
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
              left={
                <PaperTextInput.Icon icon="email-outline" />
              }
            />

            {/* Password */}
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

            {/* Authentication Error */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  {error}
                </Text>
              </View>
            )}

            {/* Sign In */}
            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
              disabled={isLoading}
              contentStyle={styles.buttonContent}
              buttonColor={theme.colors.primary}
            >
              {!isLoading && (
                <Text style={styles.buttonText}>
                  Sign In
                </Text>
              )}
            </Button>

            {/* Demo Account */}
            <View style={styles.demoContainer}>
              <Divider style={styles.divider} />

              <TouchableOpacity
                onPress={handleDemoLogin}
                disabled={isLoading}
                style={styles.demoButton}
                accessibilityRole="button"
                accessibilityLabel="Try the demo account"
              >
                <Text style={styles.demoButtonText}>
                  <Text>Explore CartlyX with a Demo Account</Text>
                  {'\n'}
                  <Text style={{ fontWeight: '400' }}>
                    emilys / emilyspass
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>
                New to CartlyX?{' '}
              </Text>

              <TouchableOpacity
                onPress={() =>
                  router.push('/(auth)/register')
                }
                style={styles.link}
                disabled={isLoading}
              >
                <Text style={styles.linkText}>
                  Create an Account
                </Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing in, you agree to our Terms of
            Service and Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
