/**
 * Login Screen
 * Navigation after sign-in is handled by the (auth) layout guard.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';
import { FormField } from '@/components/FormField';
import { DEMO_CREDENTIALS } from '@/constants/config';
import { useAppTheme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { createAuthStyles } from '@/styles/authStyles';
import { routes } from '@/utils/routes';
import { FieldErrors, hasErrors, validateLoginForm } from '@/utils/validation';

export default function LoginScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createAuthStyles(theme), [theme]);
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<'username' | 'password'>>({});

  const submit = async (name: string, secret: string) => {
    try {
      await login(name.trim(), secret);
    } catch {
      // The failure message is shown from the auth context.
    }
  };

  const handleLogin = () => {
    const errors = validateLoginForm(username, password);
    setFieldErrors(errors);
    if (!hasErrors(errors)) void submit(username, password);
  };

  const handleDemoLogin = () => {
    setUsername(DEMO_CREDENTIALS.username);
    setPassword(DEMO_CREDENTIALS.password);
    setFieldErrors({});
    void submit(DEMO_CREDENTIALS.username, DEMO_CREDENTIALS.password);
  };

  const onChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    if (error) clearError();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.brand}>
          <MaterialCommunityIcons name="storefront" size={56} color={theme.colors.primary} />
          <Text variant="headlineMedium" style={styles.brandName}>
            Marketplace
          </Text>
          <Text variant="bodyMedium" style={styles.tagline}>
            Shop smart, save more
          </Text>
        </View>

        <Card style={styles.card} mode="elevated">
          <Card.Content style={styles.cardContent}>
            <Text variant="titleLarge" style={styles.title}>
              Welcome back
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Sign in to continue shopping
            </Text>

            <FormField
              label="Username"
              value={username}
              onChangeText={onChange(setUsername)}
              error={fieldErrors.username}
              autoCapitalize="none"
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              disabled={isLoading}
            />
            <FormField
              label="Password"
              value={password}
              onChangeText={onChange(setPassword)}
              error={fieldErrors.password}
              secureToggle
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              disabled={isLoading}
            />

            {error ? (
              <View style={styles.errorBanner} accessibilityLiveRegion="assertive">
                <Text variant="bodyMedium" style={styles.errorText}>
                  {error}
                </Text>
              </View>
            ) : null}

            <Button mode="contained" onPress={handleLogin} loading={isLoading} disabled={isLoading} style={styles.primaryButton} contentStyle={styles.buttonContent}>
              Sign in
            </Button>

            <Divider style={styles.divider} />
            <Button mode="text" onPress={handleDemoLogin} disabled={isLoading}>
              Use demo account ({DEMO_CREDENTIALS.username})
            </Button>

            <View style={styles.footerRow}>
              <Text variant="bodyMedium">New here?</Text>
              <Button mode="text" compact onPress={() => router.push(routes.register)} disabled={isLoading}>
                Create an account
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
