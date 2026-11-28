/**
 * Login Screen
 * After a successful login the (auth) layout redirects to the shop.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Button, TextInput as PaperTextInput, Divider, HelperText } from 'react-native-paper';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks';
import { LivelyBackground } from '@/components/LivelyBackground';
import { useAppTheme } from '@/context/SettingsContext';
import { SEASONS } from '@/constants/seasons';
import { makeAuthStyles } from '@/styles/auth';

const DEMO_USERNAME = 'emilys';
const DEMO_PASSWORD = 'emilyspass';

export default function LoginScreen() {
  const router = useRouter();
  const styles = useThemedStyles(makeAuthStyles);
  const { season } = useAppTheme();
  const { login, isLoading, error, clearError } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (user: string, pass: string) => {
    try {
      await login(user, pass);
    } catch {
      // The error message is stored in context and shown below the form
    }
  };

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setFormError('Please enter both username and password');
      return;
    }
    setFormError(null);
    submit(username.trim(), password);
  };

  const handleDemoLogin = () => {
    // DummyJSON test credentials
    setUsername(DEMO_USERNAME);
    setPassword(DEMO_PASSWORD);
    setFormError(null);
    submit(DEMO_USERNAME, DEMO_PASSWORD);
  };

  const handleChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    if (error) clearError();
    if (formError) setFormError(null);
  };

  const message = formError ?? error;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LivelyBackground />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo/Brand */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>{SEASONS[season].decoration}</Text>
          <Text style={styles.appName}>Marketplace</Text>
          <Text style={styles.tagline}>Shop Smart, Save More</Text>
        </View>

        {/* Login Card */}
        <Card style={styles.card} elevation={3}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue shopping</Text>

            <PaperTextInput
              label="Username"
              mode="outlined"
              value={username}
              onChangeText={handleChange(setUsername)}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              disabled={isLoading}
            />

            <PaperTextInput
              label="Password"
              mode="outlined"
              value={password}
              onChangeText={handleChange(setPassword)}
              style={styles.input}
              secureTextEntry={!showPassword}
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              disabled={isLoading}
              right={
                <PaperTextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword((v) => !v)}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                />
              }
            />

            {message && (
              <View style={styles.errorContainer} accessibilityLiveRegion="polite">
                <Text style={styles.errorText}>{message}</Text>
              </View>
            )}

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
              disabled={isLoading}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonText}
            >
              Sign In
            </Button>

            {/* Demo Login */}
            <View style={styles.demoContainer}>
              <Divider style={styles.divider} />
              <TouchableOpacity onPress={handleDemoLogin} disabled={isLoading} style={styles.demoButton}>
                <Text style={styles.demoButtonText}>
                  Try Demo Account ({DEMO_USERNAME} / {DEMO_PASSWORD})
                </Text>
              </TouchableOpacity>
              <HelperText type="info" style={styles.demoHint}>
                Any DummyJSON user works, e.g. michaelw / michaelwpass
              </HelperText>
            </View>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don&apos;t have an account? </Text>
              <TouchableOpacity
                onPress={() => {
                  clearError();
                  router.push('/register');
                }}
                style={styles.link}
              >
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
