
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { TextInput as PaperTextInput } from 'react-native-paper';
import { styles } from './styles';

export default function LoginScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isMobile = width < 700;
  const isSmallMobile = width < 380;

  const { login, isLoading, error, clearError } = useAuth();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert(
        'Missing Information',
        'Please enter your username and password.'
      );
      return;
    }

    try {
      await login(username.trim(), password.trim());
      router.replace(redirect || '/(app)/(tabs)/home');
    } catch {
      // Error is handled by AuthContext.
    }
  };

  const handleDemoLogin = async () => {
    setUsername('emilys');
    setPassword('emilyspass');

    try {
      await login('emilys', 'emilyspass');
      router.replace(redirect || '/(app)/(tabs)/home');
    } catch {
      // Error is handled by AuthContext.
    }
  };

  useEffect(() => {
    if (error) {
      Alert.alert('Login Failed', error, [
        { text: 'OK', onPress: clearError },
      ]);
    }
  }, [error, clearError]);

  return (
    <KeyboardAvoidingView
      style={styles.loginScreenContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.loginScroll,
          isMobile && {
            flexGrow: 1,
            justifyContent: 'flex-start',
            paddingHorizontal: isSmallMobile ? 12 : 18,
            paddingVertical: 22,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.loginPage,
            isMobile && {
              width: '100%',
              alignSelf: 'center',
            },
          ]}
        >
          {/* BRAND HEADER */}
          <View
            style={[
              styles.loginBrand,
              isMobile && { marginBottom: 18 },
            ]}
          >
            <View
              style={[
                styles.loginBrandIcon,
                isMobile && {
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                },
              ]}
            >
              <Text style={styles.loginBrandEmoji}>🍃</Text>
            </View>

            <Text style={styles.loginBrandName}>
              THE DAILY TABLE
            </Text>

            <Text style={styles.loginBrandTagline}>
              GOOD FOOD. GOOD MOOD. EVERY DAY.
            </Text>
          </View>

          {/* MAIN LOGIN PANEL */}
          <View
            style={[
              styles.loginPanel,
              isMobile && {
                flexDirection: 'column',
                flexWrap: 'nowrap',
                width: '100%',
                borderRadius: 20,
                overflow: 'hidden',
                alignItems: 'stretch',
              },
            ]}
          >
            {/* GREEN HERO PANEL */}
            <View
              style={[
                styles.loginHero,
                isMobile
                  ? {
                      flex: 0,
                      flexGrow: 0,
                      flexShrink: 0,
                      flexBasis: isSmallMobile ? 300 : 320,
                      width: '100%',
                      height: isSmallMobile ? 300 : 320,
                      minHeight: isSmallMobile ? 300 : 320,
                      maxHeight: isSmallMobile ? 300 : 320,
                      paddingHorizontal: 20,
                      paddingVertical: 18,
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#24543D',
                      position: 'relative',
                      overflow: 'hidden',
                    }
                  : {
                      flex: 1,
                      minHeight: 550,
                      paddingHorizontal: 38,
                      paddingVertical: 38,
                      justifyContent: 'space-between',
                      alignItems: 'stretch',
                      position: 'relative',
                      overflow: 'hidden',
                    },
              ]}
            >
              {/* DECORATIVE CIRCLES */}
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  width: isMobile ? 180 : 230,
                  height: isMobile ? 180 : 230,
                  borderRadius: isMobile ? 90 : 115,
                  backgroundColor: '#35664B',
                  top: isMobile ? -115 : -120,
                  right: isMobile ? -95 : -100,
                }}
              />

              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  width: isMobile ? 145 : 190,
                  height: isMobile ? 145 : 190,
                  borderRadius: isMobile ? 72 : 95,
                  backgroundColor: '#1D4935',
                  bottom: isMobile ? -100 : -125,
                  left: isMobile ? -80 : -90,
                }}
              />

              {/* HERO TEXT */}
              <View
                style={{
                  zIndex: 2,
                  width: '100%',
                  alignItems: isMobile ? 'center' : 'flex-start',
                }}
              >
                <Text
                  style={[
                    styles.loginEyebrow,
                    {
                      marginBottom: isMobile ? 8 : 20,
                      textAlign: isMobile ? 'center' : 'left',
                      fontSize: isMobile ? 9 : 10,
                    },
                  ]}
                >
                  YOUR KITCHEN AWAITS
                </Text>

                <Text
                  style={[
                    styles.loginHeroTitle,
                    {
                      fontSize: isMobile
                        ? isSmallMobile ? 26 : 29
                        : 42,
                      lineHeight: isMobile
                        ? isSmallMobile ? 31 : 35
                        : 50,
                      textAlign: isMobile ? 'center' : 'left',
                    },
                  ]}
                >
                  Let's make
                  {'\n'}something
                  {'\n'}
                  <Text style={styles.loginHeroAccent}>
                    delicious.
                  </Text>
                </Text>

                <Text
                  style={[
                    styles.loginHeroSubtitle,
                    {
                      maxWidth: isMobile ? 260 : 230,
                      fontSize: isMobile ? 11 : 14,
                      lineHeight: isMobile ? 16 : 22,
                      marginTop: isMobile ? 5 : 18,
                      textAlign: isMobile ? 'center' : 'left',
                    },
                  ]}
                >
                  Your favorite recipes, all in one place.
                </Text>
              </View>

              {/* FOOD ILLUSTRATION */}
              <View
                style={{
                  zIndex: 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: isMobile ? 8 : 20,
                }}
              >
                <View
                  style={{
                    width: isMobile ? 70 : 155,
                    height: isMobile ? 70 : 155,
                    borderRadius: isMobile ? 35 : 78,
                    backgroundColor: '#F1E9D8',
                    borderWidth: isMobile ? 3 : 4,
                    borderColor: '#D9CBAE',
                    justifyContent: 'center',
                    alignItems: 'center',
                    elevation: 5,
                    shadowColor: '#000000',
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 5 },
                  }}
                >
                  <Text style={{ fontSize: isMobile ? 42 : 86 }}>
                    🥗
                  </Text>
                </View>

                <Text
                  style={{
                    color: '#E4C68E',
                    fontSize: isMobile ? 8 : 10,
                    fontWeight: '800',
                    letterSpacing: isMobile ? 1.3 : 2,
                    marginTop: isMobile ? 6 : 14,
                    textAlign: 'center',
                  }}
                >
                  FRESH • SIMPLE • DELICIOUS
                </Text>
              </View>
            </View>

            {/* WHITE LOGIN FORM */}
            <View
              style={[
                styles.loginForm,
                isMobile && {
                  flex: 0,
                  flexGrow: 0,
                  flexShrink: 0,
                  flexBasis: 'auto',
                  width: '100%',
                  minWidth: 0,
                  paddingHorizontal: isSmallMobile ? 20 : 25,
                  paddingVertical: 28,
                  backgroundColor: '#FFFFFF',
                  alignSelf: 'stretch',
                },
              ]}
            >
              <Text style={styles.loginTitle}>
                Welcome back!
              </Text>

              <Text style={styles.loginSubtitle}>
                Sign in to continue your cooking journey.
              </Text>

              {/* USERNAME */}
              <Text style={styles.loginFieldLabel}>
                USERNAME OR EMAIL
              </Text>

              <PaperTextInput
                placeholder="Enter your username"
                mode="outlined"
                value={username}
                onChangeText={setUsername}
                style={styles.loginInput}
                outlineStyle={styles.loginInputOutline}
                outlineColor="#D8DED4"
                activeOutlineColor="#24543D"
                textColor="#263B2D"
                placeholderTextColor="#9BA69B"
                autoCapitalize="none"
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                disabled={isLoading}
                left={
                  <PaperTextInput.Icon
                    icon="account-outline"
                    color="#66816C"
                  />
                }
              />

              {/* PASSWORD */}
              <Text style={styles.loginFieldLabel}>
                PASSWORD
              </Text>

              <PaperTextInput
                placeholder="Enter your password"
                mode="outlined"
                value={password}
                onChangeText={setPassword}
                style={styles.loginInput}
                outlineStyle={styles.loginInputOutline}
                outlineColor="#D8DED4"
                activeOutlineColor="#24543D"
                textColor="#263B2D"
                placeholderTextColor="#9BA69B"
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleLogin}
                disabled={isLoading}
                left={
                  <PaperTextInput.Icon
                    icon="lock-outline"
                    color="#66816C"
                  />
                }
                right={
                  <PaperTextInput.Icon
                    icon={
                      showPassword
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    color="#66816C"
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />

              {/* ERROR DISPLAY */}
              {error ? (
                <View style={styles.loginError}>
                  <Text style={styles.loginErrorText}>
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* SIGN IN BUTTON */}
              <TouchableOpacity
                style={[
                  styles.loginSubmit,
                  isLoading && styles.loginSubmitDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.loginSubmitText}>
                      SIGN IN
                    </Text>

                    <Text style={styles.loginSubmitArrow}>
                      →
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* DEMO ACCOUNT */}
              <TouchableOpacity
                style={styles.loginDemo}
                onPress={handleDemoLogin}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.loginDemoTitle}>
                  EXPLORE WITH A DEMO ACCOUNT
                </Text>

                <Text style={styles.loginDemoText}>
                  Username: emilys  •  Password: emilyspass
                </Text>
              </TouchableOpacity>

              {/* SIGN UP */}
              <View style={styles.loginSignup}>
                <Text style={styles.loginSignupText}>
                  New to The Daily Table?
                </Text>

                <TouchableOpacity
                  onPress={() => router.push('/(auth)/register')}
                  disabled={isLoading}
                >
                  <Text style={styles.loginSignupLink}>
                    Create an account ↗
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* FOOTER */}
          <Text style={styles.loginFooter}>
            MADE FOR FOOD LOVERS · COOK SOMETHING WONDERFUL
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
