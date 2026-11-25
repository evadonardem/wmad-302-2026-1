/**
 * Login Screen - Cookbook
 *
 * A full-bleed food photo with a warm gradient, the brand on top and the
 * sign-in form in a bottom sheet (the layout people expect on a phone).
 *
 * - Inline validation and server errors (React Native's Alert does nothing on web)
 * - Show / hide password, keyboard "Next" jumps to the password field
 * - One-tap demo account (DummyJSON test user: emilys / emilyspass)
 * - Already signed in? Goes straight to the app, or to ?redirect=/some/page
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput as NativeTextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, HelperText, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { IconName } from '@/components/CommonComponents';
import { fontFamily, makeStyles, photoOverlay, radius, useAppTheme } from '@/constants/theme';

const backgroundPhoto = require('@/assets/login-background.webp');

const DEMO_ACCOUNT = { username: 'emilys', password: 'emilyspass' };
const HOME = '/home';

const HIGHLIGHTS: { icon: IconName; label: string }[] = [
  { icon: 'book-open-page-variant-outline', label: '50+ recipes' },
  { icon: 'cart-outline', label: 'Smart lists' },
  { icon: 'timer-outline', label: 'Step timers' },
];

/** Only follow links inside the app, and never back to login/register */
function safeRedirect(value: string | string[] | undefined): string {
  const target = Array.isArray(value) ? value[0] : value;
  if (!target || !target.startsWith('/') || target.startsWith('//')) return HOME;
  if (/^\/(\(auth\)|login|register)\b/.test(target)) return HOME;
  return target;
}

type Submitting = 'form' | 'demo' | null;

export default function LoginScreen() {
  const styles = useStyles();
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState<Submitting>(null);
  const passwordRef = useRef<NativeTextInput>(null);

  // Hero drops in, the sheet slides up
  const intro = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(intro, { toValue: 1, damping: 18, stiffness: 110, mass: 0.9, useNativeDriver: true }).start();
  }, [intro]);

  // Don't greet the user with an old error (e.g. coming back from Register)
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Signed in (just now, or from a saved session): leave the login screen
  if (!isLoading && isAuthenticated) {
    return <Redirect href={safeRedirect(redirect)} />;
  }

  const busy = submitting !== null;
  const usernameError = submitted && !username.trim() ? 'Enter your username' : null;
  const passwordError = submitted && !password ? 'Enter your password' : null;

  const signIn = async (name: string, secret: string, source: Exclude<Submitting, null>) => {
    clearError();
    setSubmitting(source);
    try {
      // On success isAuthenticated turns true and <Redirect> above takes over
      await login(name, secret);
    } catch {
      // AuthContext keeps the message in `error`; it is shown above the button
    } finally {
      setSubmitting(null);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (!username.trim() || !password) return;
    // Passwords can contain spaces, so only the username is trimmed
    signIn(username.trim(), password, 'form');
  };

  const handleDemo = () => {
    setUsername(DEMO_ACCOUNT.username);
    setPassword(DEMO_ACCOUNT.password);
    setSubmitted(false);
    signIn(DEMO_ACCOUNT.username, DEMO_ACCOUNT.password, 'demo');
  };

  const editField = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    if (error) clearError();
  };

  const heroShift = intro.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] });
  const sheetShift = intro.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* Background photo, fading into the page colour at the bottom */}
      <ImageBackground
        source={backgroundPhoto}
        resizeMode="cover"
        style={[styles.photo, { height: Math.max(340, height * 0.6) }]}
        accessibilityIgnoresInvertColors
      >
        <LinearGradient
          colors={['rgba(24,12,6,0.62)', 'rgba(24,12,6,0.12)', 'rgba(24,12,6,0.5)', theme.colors.background]}
          locations={[0, 0.38, 0.78, 1]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 28 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <Animated.View style={[styles.hero, { opacity: intro, transform: [{ translateY: heroShift }] }]}>
            <View style={styles.badge}>
              <MaterialCommunityIcons name="chef-hat" size={32} color={photoOverlay.text} />
            </View>
            <Text style={styles.brand} accessibilityRole="header">
              Cookbook
            </Text>
            <Text style={styles.tagline}>Cook something wonderful tonight.</Text>
            <View style={styles.highlights}>
              {HIGHLIGHTS.map((item) => (
                <View key={item.label} style={styles.highlight}>
                  <MaterialCommunityIcons name={item.icon} size={14} color={photoOverlay.text} />
                  <Text style={styles.highlightText}>{item.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Sign-in sheet */}
          <Animated.View
            style={[
              styles.sheet,
              { paddingBottom: insets.bottom + 24, opacity: intro, transform: [{ translateY: sheetShift }] },
            ]}
          >
            <View style={styles.handle} />
            <Text style={styles.title}>Welcome back 👋</Text>
            <Text style={styles.subtitle}>Sign in to pick up right where you left off.</Text>

            <TextInput
              label="Username"
              mode="outlined"
              value={username}
              onChangeText={editField(setUsername)}
              error={!!usernameError}
              left={<TextInput.Icon icon="account-outline" />}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordRef.current?.focus()}
              disabled={busy}
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />
            {usernameError ? (
              <HelperText type="error" style={styles.helper}>
                {usernameError}
              </HelperText>
            ) : null}

            <TextInput
              ref={passwordRef}
              label="Password"
              mode="outlined"
              value={password}
              onChangeText={editField(setPassword)}
              error={!!passwordError}
              secureTextEntry={!showPassword}
              left={<TextInput.Icon icon="lock-outline" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  onPress={() => setShowPassword((shown) => !shown)}
                  forceTextInputFocus={false}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                />
              }
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              disabled={busy}
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />
            {passwordError ? (
              <HelperText type="error" style={styles.helper}>
                {passwordError}
              </HelperText>
            ) : null}

            {error ? (
              <View style={styles.errorBox} accessibilityRole="alert" accessibilityLiveRegion="polite">
                <MaterialCommunityIcons name="alert-circle-outline" size={20} color={theme.colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={submitting === 'form'}
              disabled={busy}
              style={styles.primaryButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.primaryLabel}
            >
              {submitting === 'form' ? 'Signing in…' : 'Sign in'}
            </Button>

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.orLine} />
            </View>

            <Button
              mode="outlined"
              icon="lightning-bolt-outline"
              onPress={handleDemo}
              loading={submitting === 'demo'}
              disabled={busy}
              style={styles.demoButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.demoLabel}
            >
              Try the demo account
            </Button>
            <Text style={styles.demoHint}>
              Signs in as {DEMO_ACCOUNT.username} · no sign-up needed
            </Text>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>New to Cookbook?</Text>
              <Pressable
                onPress={() => router.push('/register')}
                disabled={busy}
                hitSlop={8}
                accessibilityRole="link"
              >
                <Text style={styles.link}>Create an account</Text>
              </Pressable>
            </View>

            <Text style={styles.legal}>By signing in you agree to our Terms of Service and Privacy Policy.</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    flex: {
      flex: 1,
    },
    photo: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    },
    scroll: {
      flexGrow: 1,
      justifyContent: 'space-between',
    },

    // Brand on the photo
    hero: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingBottom: 36,
    },
    badge: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: c.primary,
      borderWidth: 3,
      borderColor: 'rgba(255,255,255,0.85)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
      elevation: 6,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    brand: {
      fontFamily: fontFamily.display,
      fontSize: 44,
      lineHeight: 52,
      color: photoOverlay.text,
      letterSpacing: -0.5,
      textShadowColor: 'rgba(0,0,0,0.45)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 10,
    },
    tagline: {
      fontFamily: fontFamily.medium,
      fontSize: 16,
      color: photoOverlay.textSoft,
      marginTop: 4,
      textAlign: 'center',
      textShadowColor: 'rgba(0,0,0,0.4)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 6,
    },
    highlights: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
      marginTop: 18,
    },
    highlight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(0,0,0,0.38)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.4)',
    },
    highlightText: {
      fontFamily: fontFamily.semibold,
      fontSize: 12,
      color: photoOverlay.text,
    },

    // Bottom sheet with the form
    sheet: {
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
      backgroundColor: c.surface,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: 24,
      paddingTop: 10,
      elevation: 16,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: -6 },
    },
    handle: {
      alignSelf: 'center',
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: c.outlineVariant,
      marginBottom: 20,
    },
    title: {
      fontFamily: fontFamily.display,
      fontSize: 28,
      lineHeight: 34,
      color: c.onSurface,
    },
    subtitle: {
      fontFamily: fontFamily.regular,
      fontSize: 14,
      color: c.muted,
      marginTop: 4,
      marginBottom: 22,
    },
    input: {
      backgroundColor: c.surface,
      marginTop: 6,
    },
    inputOutline: {
      borderRadius: 14,
    },
    helper: {
      paddingHorizontal: 4,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: c.errorContainer,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginTop: 14,
    },
    errorText: {
      flex: 1,
      fontFamily: fontFamily.medium,
      fontSize: 14,
      color: c.error,
    },
    primaryButton: {
      marginTop: 22,
      borderRadius: radius.pill,
    },
    buttonContent: {
      height: 52,
    },
    primaryLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: 16,
      letterSpacing: 0.3,
    },
    orRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginVertical: 18,
    },
    orLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.outlineVariant,
    },
    orText: {
      fontFamily: fontFamily.medium,
      fontSize: 13,
      color: c.muted,
    },
    demoButton: {
      borderRadius: radius.pill,
      borderColor: c.primary,
      backgroundColor: c.primaryContainer,
    },
    demoLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: 15,
      color: c.onPrimaryContainer,
    },
    demoHint: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      color: c.muted,
      textAlign: 'center',
      marginTop: 8,
    },
    registerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 26,
    },
    registerText: {
      fontFamily: fontFamily.regular,
      fontSize: 14,
      color: c.muted,
    },
    link: {
      fontFamily: fontFamily.semibold,
      fontSize: 14,
      color: c.primary,
    },
    legal: {
      fontFamily: fontFamily.regular,
      fontSize: 11,
      lineHeight: 16,
      color: c.muted,
      textAlign: 'center',
      marginTop: 18,
    },
  })
);
