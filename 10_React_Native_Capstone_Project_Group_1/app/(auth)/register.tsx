/**
 * Registration Screen
 * Features: First Name, Last Name, Unique Username, Valid & Unique Email, Password (>=6 chars) + Confirm Password,
 * Show/Hide Password Toggles, Continue with Google & Continue with Facebook, Full-Bleed Illustrated Hero Background with Exact Desktop Split-Screen & Curved Hero Banner + Overlapping Card Mobile/Tablet Layout.
 * Redirects to Login screen upon successful registration so the user signs in before entering the Home page.
 */
import React, { useMemo, useState } from 'react';
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
  HelperText,
  Modal,
  Portal,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

export default function RegisterScreen() {
  const auth = useAuth() as any;
  const { registerAccount, authenticateWithSocial } = auth;
  const { palette } = useAppTheme();
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  // Responsive Breakpoints: Website (>=1024), Tablet (768-1023), Phones (<768: Realme, iPhone, Samsung, Xiaomi, Oppo, Vivo)
  const metrics = useMemo(() => getAuthBreakpointMetrics(width, height), [width, height]);
  const styles = useMemo(() => createAuthStyles(metrics), [metrics]);

  // ==================== REGISTRATION FORM STATE ====================
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Field-level validation errors
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Social Account Selector Modal
  const [socialModalProvider, setSocialModalProvider] = useState<'google' | 'facebook' | null>(null);
  const [socialFirstName, setSocialFirstName] = useState('');
  const [socialLastName, setSocialLastName] = useState('');
  const [socialEmail, setSocialEmail] = useState('');

  // ==================== CLIENT-SIDE & FIELD VALIDATION ====================
  const validateFields = (): boolean => {
    const nextErrors: typeof errors = {};
    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]{2,40}$/;
    const usernameRegex = /^[a-zA-Z0-9_]{3,24}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!firstName.trim()) {
      nextErrors.firstName = 'First name is required.';
    } else if (!nameRegex.test(firstName.trim())) {
      nextErrors.firstName = 'Enter a valid first name (letters only, at least 2 characters).';
    }

    if (!lastName.trim()) {
      nextErrors.lastName = 'Last name is required.';
    } else if (!nameRegex.test(lastName.trim())) {
      nextErrors.lastName = 'Enter a valid last name (letters only, at least 2 characters).';
    }

    if (!username.trim()) {
      nextErrors.username = 'Username is required.';
    } else if (!usernameRegex.test(username.trim())) {
      nextErrors.username = 'Username must be 3-24 characters (letters, numbers, or underscores).';
    }

    if (!email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address (e.g. janily@gmail.com).';
    }

    if (!password) {
      nextErrors.password = 'Password must contain at least 6 characters.';
    } else if (password.length < 6) {
      nextErrors.password = 'Password must contain at least 6 characters.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // ==================== REDIRECT TO LOGIN HELPER ====================
  const redirectToLoginAfterRegister = async (registeredIdentifier: string) => {
    // Ensure any auto-login session created by AuthContext during registration is cleared
    // so the user must sign in via Login first before accessing Home
    if (typeof auth?.logout === 'function') {
      await auth.logout();
    } else if (typeof auth?.signOut === 'function') {
      await auth.signOut();
    }

    setBannerMessage({
      type: 'success',
      text: 'Account created! Redirecting to Sign In...',
    });

    setTimeout(() => {
      router.replace({
        pathname: '/(auth)/login' as any,
        params: {
          registeredEmail: registeredIdentifier,
          justRegistered: '1',
        },
      });
    }, 450);
  };

  // ==================== EMAIL & PASSWORD REGISTRATION HANDLER ====================
  const handleRegister = async () => {
    setBannerMessage(null);
    if (!validateFields()) return;

    setSubmitting(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const result = await registerAccount({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        email: cleanEmail,
        password,
      });

      if (!result.success) {
        setBannerMessage({ type: 'error', text: result.message });
        if (result.message.toLowerCase().includes('username')) {
          setErrors((prev) => ({ ...prev, username: result.message }));
        } else if (result.message.toLowerCase().includes('email')) {
          setErrors((prev) => ({ ...prev, email: result.message }));
        }
        return;
      }

      await redirectToLoginAfterRegister(cleanEmail);
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== GOOGLE / FACEBOOK AUTOMATIC REGISTRATION ====================
  const handleSocialPress = (provider: 'google' | 'facebook') => {
    setBannerMessage(null);
    setSocialFirstName('');
    setSocialLastName('');
    setSocialEmail('');
    setSocialModalProvider(provider);
  };

  const handleConfirmSocialAccount = async () => {
    if (!socialModalProvider) return;
    if (!socialFirstName.trim() || !socialLastName.trim() || !socialEmail.trim().includes('@')) {
      setBannerMessage({
        type: 'error',
        text: 'Please provide your First Name, Last Name, and Email from your account.',
      });
      return;
    }

    const provider = socialModalProvider;
    setSocialModalProvider(null);
    setSubmitting(true);

    try {
      const cleanEmail = socialEmail.trim().toLowerCase();
      const res = await authenticateWithSocial(provider, 'register', {
        firstName: socialFirstName.trim(),
        lastName: socialLastName.trim(),
        email: cleanEmail,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          `${socialFirstName.trim()}+${socialLastName.trim()}`
        )}&background=${provider === 'google' ? 'EA4335' : '1877F2'}&color=fff&size=256`,
      });

      if (res.success) {
        await redirectToLoginAfterRegister(cleanEmail);
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

        {/* BOTTOM / RIGHT WHITE CREATE ACCOUNT CARD PANEL */}
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
              <Title style={styles.cardTitle}>Create Your Account</Title>
              <Text style={styles.cardSubtitle}>
                Sign up to start shopping and sync your profile across devices
              </Text>
            </View>

            {/* Status Notification Banner */}
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

            {/* ==================== SOCIAL REGISTRATION BUTTONS ==================== */}
            <View style={styles.socialButtonsGroup}>
              <TouchableOpacity
                onPress={() => handleSocialPress('google')}
                disabled={submitting}
                activeOpacity={0.8}
                style={styles.socialButton}
              >
                <MaterialCommunityIcons name="google" size={20} color="#EA4335" />
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSocialPress('facebook')}
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
              <Text style={styles.dividerText}>OR REGISTER USING EMAIL AND PASSWORD</Text>
              <Divider style={styles.dividerLine} />
            </View>

            {/* ==================== EMAIL & PASSWORD REGISTRATION FORM ==================== */}
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <TextInput
                  mode="outlined"
                  dense
                  placeholder="First Name"
                  value={firstName}
                  onChangeText={(t) => {
                    setFirstName(t);
                    if (errors.firstName) setErrors((p) => ({ ...p, firstName: undefined }));
                  }}
                  error={Boolean(errors.firstName)}
                  textColor="#0F172A"
                  placeholderTextColor="#94A3B8"
                  outlineColor={metrics.isDesktop ? '#E2E8F0' : '#CBD5E1'}
                  activeOutlineColor="#2563EB"
                  outlineStyle={styles.inputOutline}
                  style={styles.registerInput}
                />
                {errors.firstName ? (
                  <HelperText type="error" visible padding="none">
                    {errors.firstName}
                  </HelperText>
                ) : null}
              </View>

              <View style={{ flex: 1 }}>
                <TextInput
                  mode="outlined"
                  dense
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={(t) => {
                    setLastName(t);
                    if (errors.lastName) setErrors((p) => ({ ...p, lastName: undefined }));
                  }}
                  error={Boolean(errors.lastName)}
                  textColor="#0F172A"
                  placeholderTextColor="#94A3B8"
                  outlineColor={metrics.isDesktop ? '#E2E8F0' : '#CBD5E1'}
                  activeOutlineColor="#2563EB"
                  outlineStyle={styles.inputOutline}
                  style={styles.registerInput}
                />
                {errors.lastName ? (
                  <HelperText type="error" visible padding="none">
                    {errors.lastName}
                  </HelperText>
                ) : null}
              </View>
            </View>

            <View style={styles.registerInputWrapper}>
              <TextInput
                mode="outlined"
                dense
                placeholder="Username"
                value={username}
                onChangeText={(t) => {
                  setUsername(t);
                  if (errors.username) setErrors((p) => ({ ...p, username: undefined }));
                }}
                autoCapitalize="none"
                autoCorrect={false}
                error={Boolean(errors.username)}
                textColor="#0F172A"
                placeholderTextColor="#94A3B8"
                outlineColor={metrics.isDesktop ? '#E2E8F0' : '#CBD5E1'}
                activeOutlineColor="#2563EB"
                outlineStyle={styles.inputOutline}
                style={styles.registerInput}
                left={<TextInput.Icon icon="at" color="#94A3B8" />}
              />
              {errors.username ? (
                <HelperText type="error" visible padding="none">
                  {errors.username}
                </HelperText>
              ) : null}
            </View>

            <View style={styles.registerInputWrapper}>
              <TextInput
                mode="outlined"
                dense
                placeholder="Gmail / Email Address"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={Boolean(errors.email)}
                textColor="#0F172A"
                placeholderTextColor="#94A3B8"
                outlineColor={metrics.isDesktop ? '#E2E8F0' : '#CBD5E1'}
                activeOutlineColor="#2563EB"
                outlineStyle={styles.inputOutline}
                style={styles.registerInput}
                left={<TextInput.Icon icon="email-outline" color="#94A3B8" />}
              />
              {errors.email ? (
                <HelperText type="error" visible padding="none">
                  {errors.email}
                </HelperText>
              ) : null}
            </View>

            <View style={styles.registerInputWrapper}>
              <TextInput
                mode="outlined"
                dense
                placeholder="Password (min. 6 characters)"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                error={Boolean(errors.password)}
                textColor="#0F172A"
                placeholderTextColor="#94A3B8"
                outlineColor={metrics.isDesktop ? '#E2E8F0' : '#CBD5E1'}
                activeOutlineColor="#2563EB"
                outlineStyle={styles.inputOutline}
                style={styles.registerInput}
                left={<TextInput.Icon icon="lock-outline" color="#94A3B8" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    color="#64748B"
                    onPress={() => setShowPassword((prev) => !prev)}
                  />
                }
              />
              {errors.password ? (
                <HelperText type="error" visible padding="none">
                  {errors.password}
                </HelperText>
              ) : null}
            </View>

            <View style={styles.registerConfirmWrapper}>
              <TextInput
                mode="outlined"
                dense
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  if (errors.confirmPassword)
                    setErrors((p) => ({ ...p, confirmPassword: undefined }));
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                onSubmitEditing={handleRegister}
                error={Boolean(errors.confirmPassword)}
                textColor="#0F172A"
                placeholderTextColor="#94A3B8"
                outlineColor={metrics.isDesktop ? '#E2E8F0' : '#CBD5E1'}
                activeOutlineColor="#2563EB"
                outlineStyle={styles.inputOutline}
                style={styles.registerInput}
                left={<TextInput.Icon icon="lock-check-outline" color="#94A3B8" />}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    color="#64748B"
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                  />
                }
              />
              {errors.confirmPassword ? (
                <HelperText type="error" visible padding="none">
                  {errors.confirmPassword}
                </HelperText>
              ) : null}
            </View>

            {/* Pill Gradient Blue Create Account Button */}
            <Button
              mode="contained"
              onPress={handleRegister}
              loading={submitting}
              disabled={submitting}
              buttonColor={metrics.isDesktop ? '#1E64F0' : '#1D63ED'}
              textColor="#FFFFFF"
              style={styles.primaryButton}
              contentStyle={styles.primaryButtonContent}
              labelStyle={styles.primaryButtonLabel}
            >
              Create Account
            </Button>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login' as any)}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ==================== SOCIAL ACCOUNT SELECTION DIALOG ==================== */}
      <Portal>
        <Modal
          visible={socialModalProvider !== null}
          onDismiss={() => setSocialModalProvider(null)}
          contentContainerStyle={[
            styles.modalContainer,
            {
              backgroundColor: palette.glassModal,
              borderColor: palette.border,
              maxWidth: 440,
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
              Continue with {socialModalProvider === 'google' ? 'Google' : 'Facebook'}
            </Title>
          </View>
          <Text style={[styles.modalDescription, { color: palette.textSecondary }]}>
            Authorize your {socialModalProvider === 'google' ? 'Google' : 'Facebook'} account to
            automatically fill your marketplace profile.
          </Text>

          <TextInput
            mode="outlined"
            dense
            label="First Name"
            placeholder="Janily"
            value={socialFirstName}
            onChangeText={setSocialFirstName}
            textColor={palette.textPrimary}
            style={{ backgroundColor: palette.glassInput, marginBottom: 8 }}
          />
          <TextInput
            mode="outlined"
            dense
            label="Last Name"
            placeholder="Carretero"
            value={socialLastName}
            onChangeText={setSocialLastName}
            textColor={palette.textPrimary}
            style={{ backgroundColor: palette.glassInput, marginBottom: 8 }}
          />
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
              onPress={handleConfirmSocialAccount}
            >
              Authorize & Continue
            </Button>
          </View>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
}