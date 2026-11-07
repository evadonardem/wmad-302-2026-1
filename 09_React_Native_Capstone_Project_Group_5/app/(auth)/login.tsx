/**
 * Login Screen - Complete, working implementation
 * Students can use as reference for building register screen
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Card, Button, TextInput as PaperTextInput, Divider } from 'react-native-paper';
import { styles } from './styles';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    try {
      await login(username.trim(), password.trim());
      // Redirect to intended page or home
      router.replace(redirect || '/(app)/(tabs)/home');
    } catch {
      // Error handled in context
    }
  };

  const handleDemoLogin = async () => {
    // DummyJSON test credentials: emilys / emilyspass
    setUsername('emilys');
    setPassword('emilyspass');
    try {
      await login('emilys', 'emilyspass');
      router.replace(redirect || '/(app)/(tabs)/home');
    } catch {
      // Error handled in context
    }
  };

  React.useEffect(() => {
    if (error) {
      Alert.alert('Login Failed', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo/Brand */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>🍳</Text>
          <Text style={styles.appName}>Cookbook</Text>
          <Text style={styles.tagline}>Your Personal Recipe Collection</Text>
        </View>

        {/* Login Card */}
        <Card style={styles.card} elevation={3}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to access your recipes</Text>

            {/* Username Field */}
            <PaperTextInput
              label="Username or Email"
              mode="outlined"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              autoCapitalize="none"
              autoCompleteType="username"
              textContentType="username"
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
              autoCompleteType="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              disabled={isLoading}
              right={<TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>}
            />

            {/* Error Display */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
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
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </Button>

            {/* Demo Login */}
            <View style={styles.demoContainer}>
              <Divider style={styles.divider} />
              <TouchableOpacity onPress={handleDemoLogin} disabled={isLoading} style={styles.demoButton}>
                <Text style={styles.demoButtonText}>Try Demo Account (emilys / emilyspass)</Text>
              </TouchableOpacity>
            </View>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/register')}
                style={styles.link}
              >
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}