/**
 * Register Screen - React Native + React Native Paper, responsive (no fixed widths)
 * Validates the form, calls register() from AuthContext (POST /users/add, then auto-login)
 * and goes to the shop.
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

interface Errors {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirm?: string;
  form?: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const next: Errors = {};
    if (firstName.trim().length < 2) next.firstName = 'Enter your first name';
    if (lastName.trim().length < 2) next.lastName = 'Enter your last name';
    if (!/^[a-zA-Z0-9_.]{3,}$/.test(username.trim())) next.username = 'At least 3 letters, numbers, _ or .';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address';
    if (password.length < 6) next.password = 'At least 6 characters';
    if (confirm !== password) next.confirm = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
      });
      router.replace('/(app)/(tabs)/home');
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Could not create your account. Try again.' });
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join to start shopping</Text>

            <View style={styles.row}>
              <View style={styles.half}>
                <TextInput mode="outlined" label="First name" value={firstName} onChangeText={setFirstName} error={!!errors.firstName} style={styles.input} />
                <HelperText type="error" visible={!!errors.firstName}>{errors.firstName}</HelperText>
              </View>
              <View style={styles.half}>
                <TextInput mode="outlined" label="Last name" value={lastName} onChangeText={setLastName} error={!!errors.lastName} style={styles.input} />
                <HelperText type="error" visible={!!errors.lastName}>{errors.lastName}</HelperText>
              </View>
            </View>
            <TextInput mode="outlined" label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" error={!!errors.username} left={<TextInput.Icon icon="account-outline" />} style={styles.input} />
            <HelperText type="error" visible={!!errors.username}>{errors.username}</HelperText>
            <TextInput mode="outlined" label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={!!errors.email} left={<TextInput.Icon icon="email-outline" />} style={styles.input} />
            <HelperText type="error" visible={!!errors.email}>{errors.email}</HelperText>
            <TextInput
              mode="outlined"
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              error={!!errors.password}
              left={<TextInput.Icon icon="lock-outline" />}
              right={<TextInput.Icon icon={showPassword ? 'eye-off-outline' : 'eye-outline'} onPress={() => setShowPassword((v) => !v)} />}
              style={styles.input}
            />
            <HelperText type="error" visible={!!errors.password}>{errors.password}</HelperText>
            <TextInput mode="outlined" label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry={!showPassword} autoCapitalize="none" error={!!errors.confirm} left={<TextInput.Icon icon="lock-check-outline" />} onSubmitEditing={submit} style={styles.input} />
            <HelperText type="error" visible={!!errors.confirm}>{errors.confirm}</HelperText>
            <HelperText type="error" visible={!!errors.form}>{errors.form}</HelperText>

            <Button mode="contained" onPress={submit} loading={submitting} disabled={submitting} style={styles.button} contentStyle={styles.buttonContent} labelStyle={styles.buttonLabel}>
              Create Account
            </Button>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Button compact onPress={() => router.replace('/(auth)/login')}>Sign In</Button>
            </View>
          </View>

          <Text style={styles.terms}>By creating an account, you agree to our Terms of Service and Privacy Policy</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}