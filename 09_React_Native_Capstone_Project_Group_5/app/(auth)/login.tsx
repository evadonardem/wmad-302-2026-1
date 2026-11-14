/**
 * Login Screen - Complete, working implementation
 * Playful look: floating food badge, soft decor background, icon inputs and a pill button.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Card, Button, TextInput as PaperTextInput } from 'react-native-paper';
import { DecorBackground } from '@/components/DecorBackground';
import { styles } from './styles';
import { tc, useAppTheme } from '@/context/ThemeContext';

/** A food emoji that gently bobs up and down (each one starts at a different moment). */
function Floater({ emoji, style, delay = 0 }: { emoji: string; style: object; delay?: number }) {
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1800, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob, delay]);
  return (
    <Animated.Text
      style={[styles.lgFloater, style, { transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) }] }]}
    >
      {emoji}
    </Animated.Text>
  );
}

const PERKS: { icon: 'compass-outline' | 'calendar-check-outline' | 'chef-hat'; label: string }[] = [
  { icon: 'compass-outline', label: 'Discover' },
  { icon: 'calendar-check-outline', label: 'Plan' },
  { icon: 'chef-hat', label: 'Cook' },
];

/** Explicit berry colours so the inputs match the rest of the website whatever the Paper theme says. */
const inputColors = () => ({
  activeOutlineColor: tc('#D81B60'),
  outlineColor: tc('#E9CED8', 'borderColor'),
  textColor: tc('#2A2124'),
});
const iconColor = (focused: boolean) => (focused ? tc('#D81B60') : tc('#9E828C'));

export default function LoginScreen() {
  useAppTheme();
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // The card slides up and fades in when the screen opens
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [enter]);

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
      <DecorBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo/Brand: a round badge with floating food around it */}
        <View style={styles.logoContainer}>
          <View style={styles.lgBadgeArea}>
            <Floater emoji="🍅" style={styles.lgFloatTL} />
            <Floater emoji="🥑" style={styles.lgFloatTR} delay={400} />
            <Floater emoji="🍰" style={styles.lgFloatBL} delay={800} />
            <Floater emoji="🌶️" style={styles.lgFloatBR} delay={1200} />
            <View style={styles.lgBadgeRing}>
              <View style={styles.lgBadge}>
                <Text style={styles.logoText}>🍳</Text>
              </View>
            </View>
          </View>
          <Text style={styles.appName}>
            Cook<Text style={styles.lgAppNameAccent}>book</Text>
          </Text>
          <Text style={styles.tagline}>Your Personal Recipe Collection</Text>
          <View style={styles.lgPerks}>
            {PERKS.map((p) => (
              <View key={p.label} style={styles.lgPerk}>
                <MaterialCommunityIcons name={p.icon} size={15} color="#D81B60" />
                <Text style={styles.lgPerkText}>{p.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Login Card */}
        <Animated.View
          style={{ opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }] }}
        >
          <Card style={styles.card} elevation={3}>
            <View style={styles.lgCardStripe} />
            <Card.Content style={styles.cardContent}>
              <Text style={styles.title}>Welcome Back 👋</Text>
              <Text style={styles.subtitle}>Sign in to see what&apos;s cooking today</Text>

              {/* Username Field */}
              <PaperTextInput
                label="Username or Email"
                mode="outlined"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                outlineStyle={styles.lgInputOutline}
                {...inputColors()}
                left={<PaperTextInput.Icon icon="account-outline" color={iconColor} />}
                autoCapitalize="none"
                autoComplete="username"
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
                outlineStyle={styles.lgInputOutline}
                {...inputColors()}
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleLogin}
                disabled={isLoading}
                left={<PaperTextInput.Icon icon="lock-outline" color={iconColor} />}
                right={
                  <PaperTextInput.Icon
                    icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    color={iconColor}
                    onPress={() => setShowPassword(!showPassword)}
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  />
                }
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
                style={styles.lgLoginButton}
                disabled={isLoading}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonText}
                icon="silverware-fork-knife"
                buttonColor="#D81B60"
                textColor="#FFFFFF"
              >
                {isLoading ? 'Signing in…' : 'Sign In'}
              </Button>

              {/* Register Link */}
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Don&apos;t have an account? </Text>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/register')}
                  style={styles.link}
                >
                  <Text style={styles.linkText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.lgFooterEmoji}>🥐 🍕 🍜 🍩 🥗</Text>
          <Text style={styles.footerText}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}