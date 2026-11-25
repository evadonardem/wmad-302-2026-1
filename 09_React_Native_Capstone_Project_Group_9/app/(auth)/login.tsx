import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFonts } from 'expo-font';
import { useAuth } from '@/context/AuthContext';
import { Card, Button, TextInput as PaperTextInput, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from './styles';

const backgroundImage = {
  uri: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1800',
};

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [fontsLoaded, fontError] = useFonts({
    Sail: require('../../assets/fonts/Sail-Regular.ttf'),
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const backgroundDrift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundDrift, {
          toValue: 1,
          duration: 18000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(backgroundDrift, {
          toValue: 0,
          duration: 18000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [backgroundDrift]);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    try {
      await login(username.trim(), password.trim());
      router.replace(redirect || '/(app)/(tabs)/home');
    } catch {
      // Error handled via context.
    }
  };

  const handleDemoLogin = async () => {
    setUsername('emilys');
    setPassword('emilyspass');
    try {
      await login('emilys', 'emilyspass');
      router.replace(redirect || '/(app)/(tabs)/home');
    } catch {
      // Error handled via context.
    }
  };

  React.useEffect(() => {
    if (error) {
      Alert.alert('Login Failed', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  React.useEffect(() => {
    if (fontError) {
      Alert.alert('Display font unavailable', fontError.message);
    }
  }, [fontError]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, styles.loginRoot]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <Animated.Image
        source={backgroundImage}
        resizeMode="cover"
        style={[
          styles.loginBackgroundImage,
          {
            transform: [
              { scale: backgroundDrift.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1.14] }) },
              { translateX: backgroundDrift.interpolate({ inputRange: [0, 1], outputRange: [-10, 10] }) },
              { translateY: backgroundDrift.interpolate({ inputRange: [0, 1], outputRange: [5, -5] }) },
            ],
          },
        ]}
      />
      <ScrollView
        contentContainerStyle={styles.loginScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.loginContent}>
          <View style={styles.loginLogoContainer}>
            <View style={styles.loginLogoBadge}>
              <Text style={styles.loginLogoText}>🍳</Text>
            </View>
            <Text style={styles.loginAppName}>Cookbook</Text>
            <Text style={styles.loginTagline}>Your Personal Recipe Collection</Text>
          </View>

          <LinearGradient
            colors={['#54E2D2', '#D946A8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loginCardGradient}
          >
            <Card style={styles.loginCard} elevation={0}>
              <Card.Content style={styles.loginCardContent}>
                <Text style={[styles.loginTitle, fontsLoaded && styles.loginTitleSail]}>
                  Welcome Back
                </Text>
                <Text style={styles.loginSubtitle}>Sign in to access your recipes</Text>

                <PaperTextInput
                  label="Username or Email"
                  mode="outlined"
                  value={username}
                  onChangeText={setUsername}
                  style={styles.loginInput}
                  autoCapitalize="none"
                  returnKeyType="next"
                  disabled={isLoading}
                  theme={{ colors: { primary: '#5867D8', outline: '#BEC6E4' } }}
                />

                <PaperTextInput
                  label="Password"
                  mode="outlined"
                  value={password}
                  onChangeText={setPassword}
                  style={styles.loginInput}
                  secureTextEntry={!showPassword}
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                  disabled={isLoading}
                  theme={{ colors: { primary: '#5867D8', outline: '#BEC6E4' } }}
                  right={
                    <PaperTextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword((current) => !current)}
                    />
                  }
                />

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <LinearGradient
                  colors={['#3978F6', '#6558E8', '#C43B9C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginButtonGradient}
                >
                  <Button
                    mode="contained"
                    onPress={handleLogin}
                    loading={isLoading}
                    buttonColor="transparent"
                    textColor="#FFFFFF"
                    style={styles.loginPrimaryButton}
                    disabled={isLoading}
                    contentStyle={styles.buttonContent}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.loginButtonText}>Sign In</Text>
                    )}
                  </Button>
                </LinearGradient>

                <View style={styles.demoContainer}>
                  <Divider style={styles.loginDivider} />
                  <TouchableOpacity onPress={handleDemoLogin} disabled={isLoading} style={styles.demoButton}>
                    <Text style={styles.loginDemoButtonText}>Try Demo Account</Text>
                    <Text style={styles.loginDemoDetails}>emilys / emilyspass</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.registerContainer}>
                  <Text style={styles.loginRegisterText}>Don&apos;t have an account? </Text>
                  <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.link}>
                    <Text style={styles.loginLinkText}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>
          </LinearGradient>

          <View style={styles.loginFooter}>
            <Text style={styles.loginFooterText}>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

