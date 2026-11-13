
/**
 * Login Screen - Cookbook
 * Supports Light Mode and Dark Mode.
 * Preserves existing authentication functionality.
 */

import React, { useState } from 'react';

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

import { useRouter, useLocalSearchParams } from 'expo-router';

import { useAuth } from '@/context/AuthContext';

import {
  Card,
  Button,
  TextInput as PaperTextInput,
  useTheme,
  MD3Theme,
} from 'react-native-paper';

import { styles } from './styles';

export default function LoginScreen() {
  const router = useRouter();

  const theme = useTheme<MD3Theme>();
  const colors = theme.colors;

  const { login, isLoading, error, clearError } = useAuth();

  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Login using the entered credentials.
  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    try {
      await login(username.trim(), password.trim());

      // Redirect to intended page or home.
      router.replace(redirect || '/(app)/(tabs)/home');
    } catch {
      // Error handled in context.
    }
  };

  // Display authentication errors.
  React.useEffect(() => {
    if (error) {
      Alert.alert(
        'Login Failed',
        error,
        [{ text: 'OK', onPress: clearError }]
      );
    }
  }, [error, clearError]);

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo and Brand */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>🍳</Text>

          <Text
            style={[
              styles.appName,
              { color: colors.primary },
            ]}
          >
            Cookbook
          </Text>

          <Text
            style={[
              styles.tagline,
              { color: colors.onSurfaceVariant },
            ]}
          >
            Your Personal Recipe Collection
          </Text>
        </View>

        {/* Login Card */}
        <Card
          style={[
            styles.card,
            { backgroundColor: colors.surface },
          ]}
          elevation={3}
        >
          <Card.Content style={styles.cardContent}>
            <Text
              style={[
                styles.title,
                { color: colors.onSurface },
              ]}
            >
              Welcome Back
            </Text>

            <Text
              style={[
                styles.subtitle,
                { color: colors.onSurfaceVariant },
              ]}
            >
              Sign in to access your recipes
            </Text>

            {/* Username Field */}
            <PaperTextInput
              label="Username or Email"
              mode="outlined"
              value={username}
              onChangeText={setUsername}
              style={[
                styles.input,
                { backgroundColor: colors.surface },
              ]}
              autoCapitalize="none"
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              disabled={isLoading}
              outlineColor={colors.outline}
              activeOutlineColor={colors.primary}
              textColor={colors.onSurface}
            />

            {/* Password Field */}
            <PaperTextInput
              label="Password"
              mode="outlined"
              value={password}
              onChangeText={setPassword}
              style={[
                styles.input,
                { backgroundColor: colors.surface },
              ]}
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              disabled={isLoading}
              outlineColor={colors.outline}
              activeOutlineColor={colors.primary}
              textColor={colors.onSurface}
              right={
                <PaperTextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                />
              }
            />

            {/* Error Display */}
            {error && (
              <View
                style={[
                  styles.errorContainer,
                  { backgroundColor: colors.errorContainer },
                ]}
              >
                <Text
                  style={[
                    styles.errorText,
                    { color: colors.onErrorContainer },
                  ]}
                >
                  {error}
                </Text>
              </View>
            )}

            {/* Login Button */}
            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
              disabled={isLoading}
              contentStyle={styles.buttonContent}
              buttonColor={colors.primary}
              textColor={colors.onPrimary}
            >
              {isLoading ? (
                <ActivityIndicator
                  color={colors.onPrimary}
                  size="small"
                />
              ) : (
                <Text
                  style={[
                    styles.buttonText,
                    { color: colors.onPrimary },
                  ]}
                >
                  Sign In
                </Text>
              )}
            </Button>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text
                style={[
                  styles.registerText,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                Don't have an account?{' '}
              </Text>

              <TouchableOpacity
                onPress={() => router.push('/(auth)/register')}
                style={styles.link}
              >
                <Text
                  style={[
                    styles.linkText,
                    { color: colors.primary },
                  ]}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </Card.Content> 
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              { color: colors.onSurfaceVariant },
            ]}
          >
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
