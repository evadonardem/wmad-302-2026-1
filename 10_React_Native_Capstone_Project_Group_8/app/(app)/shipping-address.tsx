
/**
 * My Shipping Address
 *
 * Features:
 * - Stores shipping address separately from contact information.
 * - Loads saved address for the signed-in user.
 * - Supports editing and saving delivery address details.
 * - Supports dynamic light and dark themes.
 */

import React, { useEffect, useState } from 'react';

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { router } from 'expo-router';

import {
  ActivityIndicator,
  Button,
  Card,
  Text,
  TextInput,
  useTheme,
  type MD3Theme,
} from 'react-native-paper';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';

import { shippingAddressStorage } from '@/utils/storage';

import type { SavedShippingAddress } from '@/types/order';

export default function ShippingAddressScreen() {
  const { user } = useAuth();

  const { colors } = useTheme<MD3Theme>();

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [errors, setErrors] = useState({
    address: '',
    city: '',
    province: '',
    postalCode: '',
  });

  useEffect(() => {
    let isMounted = true;

    const loadShippingAddress = async () => {
      if (!user) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const savedAddress =
          await shippingAddressStorage.get(user.id);

        if (!isMounted) {
          return;
        }

        setAddress(savedAddress?.address || '');
        setCity(savedAddress?.city || '');
        setProvince(savedAddress?.province || '');
        setPostalCode(savedAddress?.postalCode || '');
      } catch (error) {
        console.error(
          'Unable to load shipping address:',
          error,
        );

        if (isMounted) {
          showMessage(
            'Error',
            'Unable to load your saved shipping address.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadShippingAddress();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      const browser = globalThis as typeof globalThis & {
        alert?: (message: string) => void;
      };

      browser.alert?.(`${title}\n\n${message}`);
      return;
    }

    Alert.alert(title, message);
  };

  const validateForm = () => {
    const nextErrors = {
      address: '',
      city: '',
      province: '',
      postalCode: '',
    };

    if (!address.trim()) {
      nextErrors.address = 'Please enter your street address.';
    }

    if (!city.trim()) {
      nextErrors.city = 'Please enter your city.';
    }

    if (!province.trim()) {
      nextErrors.province = 'Please enter your province.';
    }

    if (!postalCode.trim()) {
      nextErrors.postalCode = 'Please enter your postal code.';
    }

    setErrors(nextErrors);

    return !Object.values(nextErrors).some(Boolean);
  };

  const handleSave = async () => {
    if (!user) {
      showMessage(
        'Not Signed In',
        'Please sign in before saving your shipping address.',
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    const savedAddress: SavedShippingAddress = {
      address: address.trim(),
      city: city.trim(),
      province: province.trim(),
      postalCode: postalCode.trim(),
    };

    try {
      setIsSaving(true);

      await shippingAddressStorage.save(
        user.id,
        savedAddress,
      );

      showMessage(
        'Saved Successfully',
        'Your shipping address has been saved. It will automatically appear during checkout.',
      );
    } catch (error) {
      console.error(
        'Unable to save shipping address:',
        error,
      );

      showMessage(
        'Save Failed',
        'Unable to save your shipping address. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text
          style={[
            styles.loadingText,
            { color: colors.onSurfaceVariant },
          ]}
        >
          Loading shipping address...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Button
            mode="text"
            icon="arrow-left"
            onPress={() => router.back()}
            textColor={colors.primary}
            contentStyle={styles.backButton}
          >
            Back
          </Button>

          <Text
            variant="headlineSmall"
            style={[
              styles.title,
              { color: colors.onBackground },
            ]}
          >
            My Shipping Address
          </Text>

          <Text
            style={[
              styles.subtitle,
              { color: colors.onSurfaceVariant },
            ]}
          >
            Manage the address where your orders will be delivered.
          </Text>
        </View>

        <Card
          mode="elevated"
          style={[
            styles.card,
            { backgroundColor: colors.surface },
          ]}
        >
          <Card.Content>
            <View style={styles.infoHeader}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.primaryContainer },
                ]}
              >
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={27}
                  color={colors.primary}
                />
              </View>

              <View style={styles.infoHeaderText}>
                <Text
                  variant="titleMedium"
                  style={{ color: colors.onSurface }}
                >
                  Delivery Address
                </Text>

                <Text
                  variant="bodySmall"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  Your saved delivery destination.
                </Text>
              </View>
            </View>

            <TextInput
              label="Street Address"
              value={address}
              onChangeText={(value) => {
                setAddress(value);
                setErrors((previous) => ({
                  ...previous,
                  address: '',
                }));
              }}
              mode="outlined"
              left={<TextInput.Icon icon="home-outline" />}
              error={Boolean(errors.address)}
              style={styles.input}
              autoCapitalize="words"
              multiline
            />

            {!!errors.address && (
              <Text style={styles.errorText}>
                {errors.address}
              </Text>
            )}

            <TextInput
              label="City"
              value={city}
              onChangeText={(value) => {
                setCity(value);
                setErrors((previous) => ({
                  ...previous,
                  city: '',
                }));
              }}
              mode="outlined"
              left={<TextInput.Icon icon="city-variant-outline" />}
              error={Boolean(errors.city)}
              style={styles.input}
              autoCapitalize="words"
            />

            {!!errors.city && (
              <Text style={styles.errorText}>
                {errors.city}
              </Text>
            )}

            <TextInput
              label="Province"
              value={province}
              onChangeText={(value) => {
                setProvince(value);
                setErrors((previous) => ({
                  ...previous,
                  province: '',
                }));
              }}
              mode="outlined"
              left={<TextInput.Icon icon="map-outline" />}
              error={Boolean(errors.province)}
              style={styles.input}
              autoCapitalize="words"
            />

            {!!errors.province && (
              <Text style={styles.errorText}>
                {errors.province}
              </Text>
            )}

            <TextInput
              label="Postal Code"
              value={postalCode}
              onChangeText={(value) => {
                setPostalCode(value);
                setErrors((previous) => ({
                  ...previous,
                  postalCode: '',
                }));
              }}
              mode="outlined"
              left={<TextInput.Icon icon="mailbox-outline" />}
              keyboardType="number-pad"
              error={Boolean(errors.postalCode)}
              style={styles.input}
            />

            {!!errors.postalCode && (
              <Text style={styles.errorText}>
                {errors.postalCode}
              </Text>
            )}
          </Card.Content>
        </Card>

        <View
          style={[
            styles.note,
            { backgroundColor: colors.secondaryContainer },
          ]}
        >
          <MaterialCommunityIcons
            name="information-outline"
            size={21}
            color={colors.onSecondaryContainer}
          />

          <Text
            style={[
              styles.noteText,
              { color: colors.onSecondaryContainer },
            ]}
          >
            Your saved shipping address will be automatically filled in during checkout. You can still change it before placing an order.
          </Text>
        </View>

        <Button
          mode="contained"
          icon="content-save-outline"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
        >
          Save Shipping Address
        </Button>

        <Button
          mode="outlined"
          onPress={() => router.back()}
          disabled={isSaving}
          style={styles.cancelButton}
          contentStyle={styles.saveButtonContent}
        >
          Back to Profile
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  header: {
    marginBottom: 22,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: -8,
  },
  title: {
    fontWeight: '800',
    marginTop: 12,
  },
  subtitle: {
    marginTop: 7,
    lineHeight: 21,
  },
  card: {
    borderRadius: 18,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  infoHeaderText: {
    flex: 1,
  },
  input: {
    marginBottom: 13,
    backgroundColor: 'transparent',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: -9,
    marginBottom: 12,
    marginLeft: 4,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 13,
    marginTop: 18,
  },
  noteText: {
    flex: 1,
    marginLeft: 10,
    lineHeight: 20,
    fontSize: 13,
  },
  saveButton: {
    marginTop: 24,
    borderRadius: 12,
  },
  saveButtonContent: {
    minHeight: 48,
  },
  cancelButton: {
    marginTop: 12,
    borderRadius: 12,
  },
});
