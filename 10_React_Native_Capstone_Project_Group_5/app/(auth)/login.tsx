/**
 * Login Screen - React Native + React Native Paper, responsive (no fixed widths)
 * - Sign in with username/email + password (POST /auth/login through AuthContext)
 */
import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, HelperText, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Screen } from '@/components/ScreenBackground';
import { palette } from '@/constants/theme';
import { styles } from './styles';

const friendly = (message: string): string =>
  /400|401|invalid/i.test(message) ? 'Incorrect username or password' : message || 'Could not sign in. Try again.';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (user: string, pass: string) => {
    if (!user.trim() || !pass) {
      setError('Enter your username and password');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login(user.trim(), pass);
      router.replace('/(app)/(tabs)/home');
    } catch (err) {
      setError(friendly(err instanceof Error ? err.message : ''));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.logo}>
              <MaterialCommunityIcons name="shopping" size={30} color={palette.surface} />
            </View>
            <Text style={styles.brand}>MARKETPLACE</Text>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue shopping</Text>

            <TextInput
              mode="outlined"
              label="Username or Email"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              left={<TextInput.Icon icon="account-outline" />}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              left={<TextInput.Icon icon="lock-outline" />}
              right={<TextInput.Icon icon={showPassword ? 'eye-off-outline' : 'eye-outline'} onPress={() => setShowPassword((v) => !v)} />}
              onSubmitEditing={() => submit(username, password)}
              style={styles.input}
            />
            <HelperText type="error" visible={!!error} style={styles.error}>{error}</HelperText>

            <Button
              mode="contained"
              onPress={() => submit(username, password)}
              loading={submitting}
              disabled={submitting}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Sign In
            </Button>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don&apos;t have an account? </Text>
              <Button compact onPress={() => router.push('/(auth)/register')}>Sign Up</Button>
            </View>
          </View>

          <Text style={styles.terms}>By signing in, you agree to our Terms of Service and Privacy Policy</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}