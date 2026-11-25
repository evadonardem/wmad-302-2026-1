/**
 * Login Screen
 * Features: Email/Username & Password Sign-In, Show/Hide Password, Continue with Google & Continue with Facebook,
 * Account Linking & Deleted Account Protection, Full-Bleed Illustrated Hero Background with Exact Desktop Split-Screen & Curved Hero Banner + Overlapping Card Mobile/Tablet Layout.
 * Signs user in and redirects to the Home page.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
  ImageBackground,
  ImageSourcePropType,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Title,
  Divider,
  Modal,
  Portal,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { createAuthStyles, getAuthBreakpointMetrics } from './styles';

// Safe dynamic asset resolution so Metro never fails bundling if the file path is moved
let HERO_BG_SOURCE: ImageSourcePropType | undefined;
try {
  // @ts-ignore
  const req = require.context('../../assets', true, /Photo\.(jpg|jpeg|png|webp)$/);
  const keys = req.keys();
  if (keys.length > 0) {
    HERO_BG_SOURCE = req(keys[0]);
  }
} catch {
  HERO_BG_SOURCE = undefined;
}

export default function LoginScreen() {
  const { user, isAuthenticated, loginWithEmailOrUsername, authenticateWithSocial } = useAuth();
  const { palette } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    registeredEmail?: string;
    justRegistered?: string;
  }>();
  const { width, height } = useWindowDimensions();

  // Responsive Breakpoints: Website (>=1024), Tablet (768-1023), Phones (<768: Realme, iPhone, Samsung, Xiaomi, Oppo, Vivo)
  const metrics = useMemo(() => getAuthBreakpointMetrics(width, height), [width, height]);
  const styles = useMemo(() => createAuthStyles(metrics), [metrics]);

  // ==================== LOGIN FORM STATE ====================
  const [identifier, setIdentifier] = useState(
    typeof params.registeredEmail === 'string' ? params.registeredEmail : ''
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(
    params.justRegistered === '1'
      ? {
          type: 'success',
          text: 'Account created successfully! Please sign in to continue.',
        }
      : null
  );

  // Social Account Selector Modal
  const [socialModalProvider, setSocialModalProvider] = useState<'google' | 'facebook' | null>(null);
  const [socialEmail, setSocialEmail] = useState('');

  // Prefill email/username if navigated immediately after registration
  useEffect(() => {
    if (typeof params.registeredEmail === 'string' && params.registeredEmail) {
      setIdentifier(params.registeredEmail);
    }
    if (params.justRegistered === '1') {
      setBannerMessage({
        type: 'success',
        text: 'Account created successfully! Please sign in to continue.',
      });
    }
  }, [params.registeredEmail, params.justRegistered]);

  // Reset form fields if user logged out or deleted account
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setPassword('');
      setSubmitting(false);
    }
  }, [isAuthenticated, user]);

  // ==================== EMAIL / USERNAME LOGIN HANDLER ====================
  const handleLogin = async () => {
    setBannerMessage(null);

    if (!identifier.trim() || !password) {
      setBannerMessage({ type: 'error', text: 'Please enter your email or username and password.' });
      return;
    }

    setSubmitting(true);
    try {
      const result = await loginWithEmailOrUsername(identifier, password);
      if (!result.success) {
        setBannerMessage({ type: 'error', text: result.message });
        return;
      }

      setBannerMessage({ type: 'success', text: result.message });
      setTimeout(() => {
        router.replace('/(app)/(tabs)/home' as any);
      }, 300);
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== GOOGLE & FACEBOOK LOGIN HANDLER ====================
  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    setBannerMessage(null);
    setSocialEmail('');
    setSocialModalProvider(provider);
  };

  const handleConfirmSocialLogin = async () => {
    if (!socialModalProvider) return;
    if (!socialEmail.trim().includes('@')) {
      setBannerMessage({ type: 'error', text: 'Please enter your registered email address.' });
      return;
    }

    const provider = socialModalProvider;
    setSocialModalProvider(null);
    setSubmitting(true);

    try {
      const emailClean = socialEmail.trim().toLowerCase();
      const fallbackFirst = emailClean.split('@')[0] || 'User';

      const res = await authenticateWithSocial(provider, 'login', {
        firstName: fallbackFirst.charAt(0).toUpperCase() + fallbackFirst.slice(1),
        lastName: 'Member',
        email: emailClean,
      });

      if (res.success) {
        setBannerMessage({ type: 'success', text: res.message });
        setTimeout(() => router.replace('/(app)/(tabs)/home' as any), 300);
      } else {
        setBannerMessage({ type: 'error', text: res.message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Hero Headline & Subtitle centered inside the pastel hero panel above the illustration
  const heroOverlayText = (
    <View style={styles.heroTextWrapper}>
      <Text style={styles.heroTitle}>
        Unwrap Joy, Every{'\n'}Single Day.
      </Text>
      <Text style={styles.heroSubtitle}>
        Discover millions of products, track your orders, and enjoy exclusive deals just for you.
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.keyboardRoot}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* TOP / LEFT FULL-BLEED IMAGE HERO PANEL WITH CURVE ON MOBILE & TABLET */}
        {HERO_BG_SOURCE ? (
          <ImageBackground
            source={HERO_BG_SOURCE}
            resizeMode="cover"
            imageStyle={styles.heroImage}
            style={styles.heroContainer}
          >
            <View style={styles.heroScrim}>{heroOverlayText}</View>
          </ImageBackground>
        ) : (
          <View style={styles.heroFallbackContainer}>{heroOverlayText}</View>
        )}

        {/* BOTTOM / RIGHT WHITE AUTH CARD PANEL */}
        <View style={styles.formSection}>
          <View style={styles.authCard}>
            {/* Floating Glowing Cyan-to-Indigo Shopping Bag Badge */}
            <View style={styles.floatingBadge}>
              <MaterialCommunityIcons
                name="shopping-outline"
                size={metrics.isDesktop ? 28 : metrics.isCompactPhone ? 28 : 32}
                color={metrics.isDesktop ? '#1E293B' : '#1E3A8A'}
              />
            </View>

            {/* Header */}
            <View style={styles.cardHeader}>
              <Title style={styles.cardTitle}>Welcome Back</Title>
              <Text style={styles.cardSubtitle}>
                Sign in to access your marketplace account
              </Text>
            </View>

            {/* Notification Banner */}
            {bannerMessage && (
              <View
                style={[
                  styles.bannerBox,
                  bannerMessage.type === 'error' ? styles.bannerError : styles.bannerSuccess,
                ]}
              >
                <MaterialCommunityIcons
                  name={bannerMessage.type === 'error' ? 'alert-circle' : 'check-circle'}
                  size={18}
                  color={bannerMessage.type === 'error' ? '#EF4444' : '#10B981'}
                />
                <Text
                  style={[
                    styles.bannerText,
                    { color: bannerMessage.type === 'error' ? '#DC2626' : '#059669' },
                  ]}
                >
                  {bannerMessage.text}
                </Text>
              </View>
            )}

            {/* ==================== SOCIAL LOGIN BUTTONS ==================== */}
            <View style={styles.socialButtonsGroup}>
              <TouchableOpacity
                onPress={() => handleSocialLogin('google')}
                disabled={submitting}
                activeOpacity={0.8}
                style={styles.socialButton}
              >
                <MaterialCommunityIcons name="google" size={20} color="#EA4335" />
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSocialLogin('facebook')}
                disabled={submitting}
                activeOpacity={0.8}
                style={styles.socialButton}
              >
                <MaterialCommunityIcons name="facebook" size={21} color="#1877F2" />
                <Text style={styles.socialButtonText}>Continue with Facebook</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dividerRow}>
              <Divider style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR SIGN IN WITH EMAIL</Text>
              <Divider style={styles.dividerLine} />
            </View>

            {/* ==================== CREDENTIAL INPUTS ==================== */}
            <TextInput
              mode="outlined"
              placeholder="Email or Username"
              value={identifier}
              onChangeText={(val) => {
                setIdentifier(val);
                if (bannerMessage) setBannerMessage(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              textColor="#0F172A"
              placeholderTextColor="#94A3B8"
              outlineColor={metrics.isDesktop ? '#E2E8F0' : '#CBD5E1'}
              activeOutlineColor="#2563EB"
              outlineStyle={styles.inputOutline}
              style={styles.loginInput}
              left={<TextInput.Icon icon="account-outline" color="#94A3B8" />}
            />

            <TextInput
              mode="outlined"
              placeholder="Password"
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                if (bannerMessage) setBannerMessage(null);
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              onSubmitEditing={handleLogin}
              textColor="#0F172A"
              placeholderTextColor="#94A3B8"
              outlineColor={metrics.isDesktop ? '#E2E8F0' : '#CBD5E1'}
              activeOutlineColor="#2563EB"
              outlineStyle={styles.inputOutline}
              style={styles.loginPasswordInput}
              left={<TextInput.Icon icon="lock-outline" color="#94A3B8" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  color="#64748B"
                  onPress={() => setShowPassword((prev) => !prev)}
                />
              }
            />

            {/* Pill Gradient Blue Sign In Button */}
            <Button
              mode="contained"
              onPress={handleLogin}
              loading={submitting}
              disabled={submitting}
              buttonColor={metrics.isDesktop ? '#1E64F0' : '#1D63ED'}
              textColor="#FFFFFF"
              style={styles.primaryButton}
              contentStyle={styles.primaryButtonContent}
              labelStyle={styles.primaryButtonLabel}
            >
              Sign In
            </Button>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don&apos;t have an account?</Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/register' as any)}>
                <Text style={styles.footerLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ==================== SOCIAL LOGIN ACCOUNT VERIFICATION MODAL ==================== */}
      <Portal>
        <Modal
          visible={socialModalProvider !== null}
          onDismiss={() => setSocialModalProvider(null)}
          contentContainerStyle={[
            styles.modalContainer,
            {
              backgroundColor: palette.glassModal,
              borderColor: palette.border,
            },
          ]}
        >
          <View style={styles.modalHeaderRow}>
            <MaterialCommunityIcons
              name={socialModalProvider === 'google' ? 'google' : 'facebook'}
              size={24}
              color={socialModalProvider === 'google' ? '#EA4335' : '#1877F2'}
            />
            <Title style={[styles.modalTitle, { color: palette.textPrimary }]}>
              Sign in with {socialModalProvider === 'google' ? 'Google' : 'Facebook'}
            </Title>
          </View>
          <Text style={[styles.modalDescription, { color: palette.textSecondary }]}>
            Select your registered {socialModalProvider === 'google' ? 'Google' : 'Facebook'} email
            address to sign in automatically.
          </Text>

          <TextInput
            mode="outlined"
            dense
            label={socialModalProvider === 'google' ? 'Gmail Address' : 'Facebook Email'}
            placeholder="janily@gmail.com"
            value={socialEmail}
            onChangeText={setSocialEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textColor={palette.textPrimary}
            style={{ backgroundColor: palette.glassInput, marginBottom: 14 }}
          />

          <View style={styles.modalActionsRow}>
            <Button
              mode="outlined"
              textColor={palette.textPrimary}
              style={{ borderColor: palette.border }}
              onPress={() => setSocialModalProvider(null)}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              buttonColor={socialModalProvider === 'google' ? '#EA4335' : '#1877F2'}
              textColor="#FFFFFF"
              onPress={handleConfirmSocialLogin}
            >
              Continue
            </Button>
          </View>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
}