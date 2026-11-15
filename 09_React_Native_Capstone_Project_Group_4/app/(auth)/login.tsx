/**
 * Login Screen - Editorial Culinary Hero + Overlapping Floating Form Card
 * Features: Looping fade-in food photography backdrop, glowing chef emblem,
 * editorial Playfair serif branding, interactive input focus states,
 * and one-tap Demo Account autofill
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Animated,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const HERO_DISPLAY_FONT = Platform.select({
  web: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
  ios: 'Georgia-BoldItalic',
  android: 'serif',
  default: 'serif',
});

const LOGIN_FOOD_SLIDES = [
  {
    uri: 'https://cdn.dummyjson.com/recipe-images/1.webp',
    dish: 'Classic Margherita Pizza',
    tag: '★ 4.6 · Italian',
  },
  {
    uri: 'https://cdn.dummyjson.com/recipe-images/5.webp',
    dish: 'Mango Salsa Chicken',
    tag: '★ 4.9 · Mexican',
  },
  {
    uri: 'https://cdn.dummyjson.com/recipe-images/16.webp',
    dish: 'Japanese Ramen Soup',
    tag: '★ 4.9 · Japanese',
  },
  {
    uri: 'https://cdn.dummyjson.com/recipe-images/4.webp',
    dish: 'Chicken Alfredo Pasta',
    tag: '★ 4.9 · Italian',
  },
];

function LoginFoodBackdrop() {
  const [activeIndex, setActiveIndex] = useState(0);
  const prevIndexRef = useRef<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1.04)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => {
        prevIndexRef.current = current;
        return (current + 1) % LOGIN_FOOD_SLIDES.length;
      });
    }, 3400);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (prevIndexRef.current === null) return;

    fadeAnim.setValue(0.15);
    scaleAnim.setValue(1.14);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 950,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.04,
        duration: 3200,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [activeIndex, fadeAnim, scaleAnim]);

  const currentSlide = LOGIN_FOOD_SLIDES[activeIndex % LOGIN_FOOD_SLIDES.length];
  const previousSlide =
    prevIndexRef.current !== null
      ? LOGIN_FOOD_SLIDES[prevIndexRef.current % LOGIN_FOOD_SLIDES.length]
      : null;

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#2B1B12' }]} />

      {previousSlide && (
        <Image
          source={{ uri: previousSlide.uri }}
          style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: 0.82 }]}
          resizeMode="cover"
        />
      )}

      <Animated.Image
        source={{ uri: currentSlide.uri }}
        style={[
          StyleSheet.absoluteFill,
          {
            width: '100%',
            height: '100%',
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
        resizeMode="cover"
      />

      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(26, 16, 11, 0.58)' },
        ]}
      />
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { width } = useWindowDimensions();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'username' | 'password' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await login(trimmedUser, password);
      router.replace('/(app)/(tabs)/home');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Invalid credentials. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    setUsername('emilys');
    setPassword('emilyspass');
    setErrorMessage(null);
  };

  const cardWidth = Math.min(width - 32, 440);
  const heroHeight = width >= 768 ? 290 : 265;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FAF6F2' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: '#FAF6F2' }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 36 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Atmospheric Looping Food Backdrop */}
        <View
          style={{
            width: '100%',
            height: heroHeight,
            backgroundColor: '#2B1B12',
            borderBottomLeftRadius: 34,
            borderBottomRightRadius: 34,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 20,
            paddingBottom: 34,
          }}
        >
          <LoginFoodBackdrop />

          {/* Glowing Ember Chef Hat Badge */}
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: '#E85D04',
              borderWidth: 3,
              borderColor: 'rgba(255, 248, 240, 0.35)',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#E85D04',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.55,
              shadowRadius: 16,
              elevation: 8,
              marginBottom: 12,
            }}
          >
            <MaterialCommunityIcons name="chef-hat" size={38} color="#FFFFFF" />
          </View>

          {/* Editorial Serif Brand Title */}
          <Text
            style={{
              fontSize: 34,
              fontFamily: HERO_DISPLAY_FONT,
              fontWeight: '900',
              fontStyle: 'italic',
              letterSpacing: 0.8,
              color: '#FFF8F0',
              textShadowColor: 'rgba(255, 122, 24, 0.9)',
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 14,
              marginBottom: 4,
            }}
          >
            Cookbook
          </Text>

          <Text style={{ fontSize: 13, color: '#F5EFEA', fontWeight: '500' }}>
            Your Personal Culinary & Nutrition Companion
          </Text>
        </View>

        {/* Overlapping White Floating Form Card */}
        <View style={{ width: cardWidth, alignSelf: 'center', marginTop: -46 }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 26,
              padding: 24,
              borderWidth: 1,
              borderColor: '#EFE6DD',
              shadowColor: '#2B1B12',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 6,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: '800',
                color: '#2B1B12',
                textAlign: 'center',
                marginBottom: 4,
              }}
            >
              Welcome Back
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: '#8D6E63',
                textAlign: 'center',
                marginBottom: 20,
              }}
            >
              Sign in to explore recipes & track nutrition
            </Text>

            {/* Error Banner */}
            {errorMessage && (
              <View
                style={{
                  backgroundColor: '#FFEBEE',
                  borderWidth: 1,
                  borderColor: '#FFCDD2',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <MaterialCommunityIcons name="alert-circle" size={18} color="#C62828" />
                <Text style={{ fontSize: 12, color: '#C62828', fontWeight: '600', flex: 1 }}>
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* Username Input */}
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: '#4E342E',
                marginBottom: 6,
                marginLeft: 2,
              }}
            >
              Username or Email
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: focusedField === 'username' ? '#FFFDFB' : '#FAF6F2',
                borderWidth: 1.5,
                borderColor: focusedField === 'username' ? '#E85D04' : '#EADFD5',
                borderRadius: 14,
                paddingHorizontal: 14,
                height: 50,
                marginBottom: 14,
              }}
            >
              <MaterialCommunityIcons
                name="account-outline"
                size={20}
                color={focusedField === 'username' ? '#E85D04' : '#8D6E63'}
              />
              <TextInput
                value={username}
                onChangeText={setUsername}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your username"
                placeholderTextColor="#A1887F"
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  flex: 1,
                  marginLeft: 10,
                  fontSize: 14,
                  color: '#2B1B12',
                  fontWeight: '500',
                  ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
                }}
              />
            </View>

            {/* Password Input */}
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: '#4E342E',
                marginBottom: 6,
                marginLeft: 2,
              }}
            >
              Password
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: focusedField === 'password' ? '#FFFDFB' : '#FAF6F2',
                borderWidth: 1.5,
                borderColor: focusedField === 'password' ? '#E85D04' : '#EADFD5',
                borderRadius: 14,
                paddingHorizontal: 14,
                height: 50,
                marginBottom: 20,
              }}
            >
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={focusedField === 'password' ? '#E85D04' : '#8D6E63'}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your password"
                placeholderTextColor="#A1887F"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onSubmitEditing={handleLogin}
                style={{
                  flex: 1,
                  marginLeft: 10,
                  fontSize: 14,
                  color: '#2B1B12',
                  fontWeight: '500',
                  ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#8D6E63"
                />
              </TouchableOpacity>
            </View>

            {/* Primary Sign In Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleLogin}
              disabled={submitting}
              style={{
                backgroundColor: submitting ? '#F48C42' : '#E85D04',
                height: 52,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                shadowColor: '#E85D04',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.32,
                shadowRadius: 12,
                elevation: 5,
                marginBottom: 16,
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
                    Sign In
                  </Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* One-Tap Demo Account Pill */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleFillDemo}
              style={{
                backgroundColor: '#FFF5EB',
                borderWidth: 1,
                borderColor: '#FAD7B8',
                borderRadius: 14,
                paddingVertical: 10,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginBottom: 16,
              }}
            >
              <MaterialCommunityIcons name="lightning-bolt" size={16} color="#E85D04" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#D95300' }}>
                Tap to Fill Demo Account (emilys)
              </Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: '#8D6E63' }}>Don&apos;t have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#E85D04' }}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Terms */}
          <Text
            style={{
              fontSize: 11,
              color: '#A1887F',
              textAlign: 'center',
              marginTop: 18,
              lineHeight: 16,
              paddingHorizontal: 16,
            }}
          >
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}