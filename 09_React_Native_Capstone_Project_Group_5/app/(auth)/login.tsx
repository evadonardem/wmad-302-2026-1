/**
 * Login Screen - Complete, working implementation
 * Split layout: a berry brand panel on the left and a clean form on the right (wide screens).
 * On phones the brand panel becomes a curved header and the form slides up over it like a sheet.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Button, TextInput as PaperTextInput } from 'react-native-paper';
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
      style={[styles.spFloater, style, { transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) }] }]}
    >
      {emoji}
    </Animated.Text>
  );
}

const PERKS: { icon: 'compass-outline' | 'calendar-check-outline' | 'chef-hat'; title: string; text: string }[] = [
  { icon: 'compass-outline', title: 'Discover', text: 'Browse 50 recipes by cuisine, meal and difficulty' },
  { icon: 'calendar-check-outline', title: 'Plan', text: 'Fill your week and get a shopping list' },
  { icon: 'chef-hat', title: 'Cook', text: 'Step-by-step cooking mode with timers' },
];

/** The berry brand area (left side on wide screens, curved header on phones). */
function BrandPanel({ wide }: { wide: boolean }) {
  return (
    <View style={wide ? styles.spPanel : styles.spHeader}>
      <View style={styles.spCircleA} />
      <View style={styles.spCircleB} />
      <View style={styles.spCircleC} />
      <Floater emoji="🍅" style={styles.spFloatA} />
      <Floater emoji="🥑" style={styles.spFloatB} delay={500} />
      <Floater emoji="🍰" style={styles.spFloatC} delay={1000} />
      {wide && <Floater emoji="🌶️" style={styles.spFloatD} delay={1500} />}

      <View style={styles.spBrandRow}>
        <View style={styles.spLogo}>
          <Text style={styles.spLogoEmoji}>🍳</Text>
        </View>
        <Text style={styles.spBrandName}>Cookbook</Text>
      </View>

      <View style={wide ? styles.spPanelBody : styles.spHeaderBody}>
        <Text style={wide ? styles.spHeadline : styles.spHeadlineSmall}>
          {wide ? "Cook something\nyou'll love." : "Cook something you'll love."}
        </Text>
        <Text style={styles.spLead}>Your personal recipe collection, meal planner and cooking guide.</Text>
        {wide && (
          <View style={styles.spPerks}>
            {PERKS.map((p) => (
              <View key={p.title} style={styles.spPerk}>
                <View style={styles.spPerkIcon}>
                  <MaterialCommunityIcons name={p.icon} size={20} color="#FFFFFF" />
                </View>
                <View style={styles.spPerkText}>
                  <Text style={styles.spPerkTitle}>{p.title}</Text>
                  <Text style={styles.spPerkSub}>{p.text}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {wide && <Text style={styles.spPanelFoot}>🥐 🍕 🍜 🍩 🥗</Text>}
    </View>
  );
}

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
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const { login, isLoading, error, clearError } = useAuth();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // The form slides up and fades in when the screen opens
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

  const form = (
    <Animated.View
      style={[
        wide ? styles.spFormWide : styles.spSheet,
        { opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }] },
      ]}
    >
      <Text style={styles.spTitle}>Welcome back 👋</Text>
      <Text style={styles.spSubtitle}>Sign in to see what&apos;s cooking today.</Text>

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

      {/* Divider + register */}
      <View style={styles.spDivider}>
        <View style={styles.spDividerLine} />
        <Text style={styles.spDividerText}>New here?</Text>
        <View style={styles.spDividerLine} />
      </View>
      <Button
        mode="outlined"
        onPress={() => router.push('/(auth)/register')}
        style={styles.spCreate}
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonText}
        icon="account-plus-outline"
        textColor="#D81B60"
      >
        Create an account
      </Button>

      <Text style={styles.spTerms}>By signing in, you agree to our Terms of Service and Privacy Policy</Text>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {wide ? (
        <View style={styles.spSplit}>
          <BrandPanel wide />
          <ScrollView style={styles.spRight} contentContainerStyle={styles.spRightContent} showsVerticalScrollIndicator={false}>
            {form}
          </ScrollView>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.spPhoneScroll} showsVerticalScrollIndicator={false}>
          <BrandPanel wide={false} />
          {form}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}