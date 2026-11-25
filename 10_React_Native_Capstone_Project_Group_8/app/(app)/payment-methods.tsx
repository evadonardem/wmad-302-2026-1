
/**
 * Payment Methods Screen
 *
 * CartlyX
 *
 * Features:
 * - Add and manage saved card details.
 * - Store only the last four card digits.
 * - Edit cardholder name and expiration date.
 * - Set a default payment method.
 * - Delete saved payment methods.
 * - Account-specific local persistence.
 * - Dynamic Light and Dark themes.
 */

import React, { useCallback, useState } from 'react';

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { router, useFocusEffect } from 'expo-router';

import {
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Text,
  TextInput,
  useTheme,
  type MD3Theme,
} from 'react-native-paper';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import { paymentMethodsStorage } from '@/utils/paymentStorage';

import type { CardBrand, PaymentMethod } from '@/types/payment';

type PaymentForm = {
  cardholderName: string;
  cardNumber: string;
  expiry: string;
};

const initialForm: PaymentForm = {
  cardholderName: '',
  cardNumber: '',
  expiry: '',
};

function detectCardBrand(cardNumber: string): CardBrand {
  const number = cardNumber.replace(/\D/g, '');

  if (/^4/.test(number)) return 'Visa';

  if (/^(5[1-5]|2[2-7])/.test(number)) {
    return 'Mastercard';
  }

  if (/^3[47]/.test(number)) {
    return 'American Express';
  }

  if (/^(6011|65|64[4-9])/.test(number)) {
    return 'Discover';
  }

  return 'Other';
}

function getCardIcon(brand: CardBrand): string {
  switch (brand) {
    case 'Visa':
      return 'credit-card';
    case 'Mastercard':
      return 'credit-card-multiple';
    case 'American Express':
      return 'credit-card-outline';
    case 'Discover':
      return 'credit-card';
    default:
      return 'credit-card-outline';
  }
}

function isValidExpiry(value: string): boolean {
  if (!/^\d{2}\/\d{2}$/.test(value)) {
    return false;
  }

  const [monthText, yearText] = value.split('/');
  const month = Number(monthText);
  const year = 2000 + Number(yearText);

  if (month < 1 || month > 12) {
    return false;
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  return (
    year > currentYear ||
    (year === currentYear && month >= currentMonth)
  );
}

function showDeleteConfirmation(
  onConfirm: () => void,
): void {
  const message = 'Are you sure you want to remove this payment method?';

  if (Platform.OS === 'web') {
    const browser = globalThis as typeof globalThis & {
      confirm?: (message: string) => boolean;
    };

    if (browser.confirm?.(message)) {
      onConfirm();
    }

    return;
  }

  Alert.alert(
    'Remove Payment Method',
    message,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: onConfirm,
      },
    ],
  );
}

export default function PaymentMethodsScreen() {
  const { user } = useAuth();

  const theme = useTheme<MD3Theme>();
  const colors = theme.colors;

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formVisible, setFormVisible] = useState(false);
  const [editingMethod, setEditingMethod] =
    useState<PaymentMethod | null>(null);

  const [form, setForm] = useState<PaymentForm>(initialForm);
  const [formError, setFormError] = useState('');

  const loadMethods = useCallback(async () => {
    if (!user) {
      setMethods([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const savedMethods =
        await paymentMethodsStorage.getAll(user.id);

      setMethods(savedMethods);
    } catch (error) {
      console.error('Unable to load payment methods:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadMethods();
    }, [loadMethods]),
  );

  const resetForm = () => {
    setForm(initialForm);
    setEditingMethod(null);
    setFormVisible(false);
    setFormError('');
  };

  const openAddForm = () => {
    setForm(initialForm);
    setEditingMethod(null);
    setFormError('');
    setFormVisible(true);
  };

  const openEditForm = (method: PaymentMethod) => {
    setEditingMethod(method);

    setForm({
      cardholderName: method.cardholderName,
      cardNumber: '',
      expiry: `${method.expiryMonth}/${method.expiryYear}`,
    });

    setFormError('');
    setFormVisible(true);
  };

  const updateForm = (
    field: keyof PaymentForm,
    value: string,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFormError('');
  };

  const handleExpiryChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);

    const formatted =
      digits.length > 2
        ? `${digits.slice(0, 2)}/${digits.slice(2)}`
        : digits;

    updateForm('expiry', formatted);
  };

  const handleSave = async () => {
    if (!user) {
      setFormError('Please log in to manage payment methods.');
      return;
    }

    const cardholderName = form.cardholderName.trim();

    if (!cardholderName) {
      setFormError('Please enter the cardholder name.');
      return;
    }

    if (!/^[a-zA-Z\s.'-]{2,60}$/.test(cardholderName)) {
      setFormError('Please enter a valid cardholder name.');
      return;
    }

    if (!isValidExpiry(form.expiry)) {
      setFormError('Enter a valid future expiration date (MM/YY).');
      return;
    }

    const [expiryMonth, expiryYear] = form.expiry.split('/');

    try {
      setSaving(true);

      if (editingMethod) {
        await paymentMethodsStorage.update(
          user.id,
          editingMethod.id,
          {
            cardholderName,
            expiryMonth,
            expiryYear,
          },
        );
      } else {
        const cardNumber = form.cardNumber.replace(/\D/g, '');

        if (cardNumber.length < 12 || cardNumber.length > 19) {
          setFormError('Enter a valid card number (12–19 digits).');
          setSaving(false);
          return;
        }

        const newMethod: PaymentMethod = {
          id: `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
          cardholderName,
          brand: detectCardBrand(cardNumber),
          last4: cardNumber.slice(-4),
          expiryMonth,
          expiryYear,
          isDefault: methods.length === 0,
          createdAt: new Date().toISOString(),
        };

        await paymentMethodsStorage.add(user.id, newMethod);
      }

      await loadMethods();
      resetForm();
    } catch (error) {
      console.error('Unable to save payment method:', error);
      setFormError('Unable to save your payment method. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    if (!user) return;

    try {
      await paymentMethodsStorage.setDefault(user.id, methodId);
      await loadMethods();
    } catch (error) {
      console.error('Unable to update default payment method:', error);
    }
  };

  const handleRemove = (methodId: string) => {
    if (!user) return;

    showDeleteConfirmation(() => {
      void (async () => {
        try {
          await paymentMethodsStorage.remove(user.id, methodId);
          await loadMethods();
        } catch (error) {
          console.error('Unable to remove payment method:', error);
        }
      })();
    });
  };

  const pageBackground = colors.background;
  const cardBackground = colors.surface;
  const mutedColor = colors.onSurfaceVariant;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: pageBackground }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={colors.onBackground}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          />

          <View style={styles.headerText}>
            <Text variant="headlineSmall" style={{ color: colors.onBackground }}>
              Payment Methods
            </Text>

            <Text
              variant="bodyMedium"
              style={{ color: mutedColor }}
            >
              Manage your saved payment options.
            </Text>
          </View>
        </View>

        {/* Security information */}
        <Card
          mode="contained"
          style={[
            styles.securityCard,
            {
              backgroundColor: colors.primaryContainer,
            },
          ]}
        >
          <Card.Content style={styles.securityContent}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={27}
              color={colors.primary}
            />

            <View style={styles.securityText}>
              <Text
                variant="titleSmall"
                style={{ color: colors.onSurface }}
              >
                Your payment details are protected
              </Text>

              <Text
                variant="bodySmall"
                style={{ color: mutedColor }}
              >
                CartlyX stores only masked card details. Full card
                numbers and security codes are never saved.
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Saved payment methods */}
        <View style={styles.sectionHeading}>
          <View>
            <Text
              variant="titleLarge"
              style={{ color: colors.onBackground }}
            >
              Saved Cards
            </Text>

            <Text
              variant="bodySmall"
              style={{ color: mutedColor }}
            >
              {methods.length} saved payment method
              {methods.length === 1 ? '' : 's'}
            </Text>
          </View>

          <Button
            mode="contained"
            icon="plus"
            onPress={openAddForm}
            compact
          >
            Add Card
          </Button>
        </View>

        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={{ color: mutedColor }}>
              Loading payment methods...
            </Text>
          </View>
        ) : methods.length === 0 ? (
          <Card
            mode="outlined"
            style={[
              styles.emptyCard,
              {
                backgroundColor: cardBackground,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons
                name="credit-card-plus-outline"
                size={52}
                color={colors.primary}
              />

              <Text
                variant="titleMedium"
                style={{ color: colors.onSurface }}
              >
                No payment methods yet
              </Text>

              <Text
                variant="bodyMedium"
                style={{ color: mutedColor, textAlign: 'center' }}
              >
                Add a card to keep its masked details available
                in your CartlyX account.
              </Text>

              <Button
                mode="contained"
                icon="plus"
                onPress={openAddForm}
                style={styles.emptyButton}
              >
                Add Your First Card
              </Button>
            </Card.Content>
          </Card>
        ) : (
          methods.map((method) => (
            <Card
              key={method.id}
              mode="elevated"
              style={[
                styles.methodCard,
                { backgroundColor: cardBackground },
              ]}
            >
              <Card.Content>
                <View style={styles.methodTopRow}>
                  <View style={styles.brandRow}>
                    <View
                      style={[
                        styles.cardIcon,
                        { backgroundColor: colors.primaryContainer },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={getCardIcon(method.brand) as never}
                        size={25}
                        color={colors.primary}
                      />
                    </View>

                    <View style={styles.methodInfo}>
                      <Text
                        variant="titleMedium"
                        style={{ color: colors.onSurface }}
                      >
                        {method.brand}
                      </Text>

                      <Text
                        variant="bodyMedium"
                        style={{ color: mutedColor }}
                      >
                        •••• •••• •••• {method.last4}
                      </Text>
                    </View>
                  </View>

                  {method.isDefault && (
                    <Chip
                      compact
                      icon="check-circle"
                      textStyle={{ color: colors.primary }}
                    >
                      Default
                    </Chip>
                  )}
                </View>

                <Divider style={styles.methodDivider} />

                <Text
                  variant="labelSmall"
                  style={{ color: mutedColor }}
                >
                  CARDHOLDER
                </Text>

                <Text
                  variant="bodyLarge"
                  style={[
                    styles.cardholder,
                    { color: colors.onSurface },
                  ]}
                >
                  {method.cardholderName}
                </Text>

                <View style={styles.expiryRow}>
                  <View>
                    <Text
                      variant="labelSmall"
                      style={{ color: mutedColor }}
                    >
                      EXPIRES
                    </Text>

                    <Text
                      variant="bodyMedium"
                      style={{ color: colors.onSurface }}
                    >
                      {method.expiryMonth}/{method.expiryYear}
                    </Text>
                  </View>

                  <View style={styles.actions}>
                    <IconButton
                      icon="pencil-outline"
                      size={20}
                      iconColor={colors.primary}
                      onPress={() => openEditForm(method)}
                      accessibilityLabel="Edit payment method"
                    />

                    <IconButton
                      icon="delete-outline"
                      size={20}
                      iconColor={colors.error}
                      onPress={() => handleRemove(method.id)}
                      accessibilityLabel="Remove payment method"
                    />
                  </View>
                </View>

                {!method.isDefault && (
                  <Button
                    mode="outlined"
                    compact
                    onPress={() => handleSetDefault(method.id)}
                    style={styles.defaultButton}
                  >
                    Set as Default
                  </Button>
                )}
              </Card.Content>
            </Card>
          ))
        )}

        {/* Add/Edit form */}
        {formVisible && (
          <Card
            mode="outlined"
            style={[
              styles.formCard,
              {
                backgroundColor: cardBackground,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <Card.Content>
              <View style={styles.formHeader}>
                <View style={{ flex: 1 }}>
                  <Text
                    variant="titleLarge"
                    style={{ color: colors.onSurface }}
                  >
                    {editingMethod ? 'Edit Card' : 'Add New Card'}
                  </Text>

                  <Text
                    variant="bodySmall"
                    style={{ color: mutedColor }}
                  >
                    {editingMethod
                      ? `Updating •••• ${editingMethod.last4}`
                      : 'Enter your card details below.'}
                  </Text>
                </View>

                <IconButton
                  icon="close"
                  onPress={resetForm}
                  accessibilityLabel="Close form"
                />
              </View>

              <TextInput
                label="Cardholder Name"
                mode="outlined"
                value={form.cardholderName}
                onChangeText={(value) =>
                  updateForm('cardholderName', value)
                }
                autoCapitalize="words"
                style={styles.input}
                left={<TextInput.Icon icon="account-outline" />}
              />

              {!editingMethod && (
                <TextInput
                  label="Card Number"
                  mode="outlined"
                  value={form.cardNumber}
                  onChangeText={(value) =>
                    updateForm(
                      'cardNumber',
                      value.replace(/\D/g, '').slice(0, 19),
                    )
                  }
                  keyboardType="number-pad"
                  maxLength={19}
                  style={styles.input}
                  left={<TextInput.Icon icon="credit-card-outline" />}
                  placeholder="Enter card number"
                  secureTextEntry={false}
                />
              )}

              <TextInput
                label="Expiration Date (MM/YY)"
                mode="outlined"
                value={form.expiry}
                onChangeText={handleExpiryChange}
                keyboardType="number-pad"
                maxLength={5}
                placeholder="MM/YY"
                style={styles.input}
                left={<TextInput.Icon icon="calendar-outline" />}
              />

              {editingMethod && (
                <Text
                  variant="bodySmall"
                  style={{ color: mutedColor, marginBottom: 12 }}
                >
                  Card number cannot be changed here. Remove this card
                  and add a new one if you need to replace it.
                </Text>
              )}

              {formError !== '' && (
                <Text
                  variant="bodySmall"
                  style={{ color: colors.error, marginBottom: 12 }}
                >
                  {formError}
                </Text>
              )}

              <View style={styles.formButtons}>
                <Button
                  mode="outlined"
                  onPress={resetForm}
                  disabled={saving}
                  style={styles.formButton}
                >
                  Cancel
                </Button>

                <Button
                  mode="contained"
                  onPress={() => void handleSave()}
                  loading={saving}
                  disabled={saving}
                  style={styles.formButton}
                >
                  {editingMethod ? 'Save Changes' : 'Save Card'}
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        <View style={styles.footer}>
          <MaterialCommunityIcons
            name="information-outline"
            size={18}
            color={mutedColor}
          />

          <Text
            variant="bodySmall"
            style={[styles.footerText, { color: mutedColor }]}
          >
            Payment methods are stored locally for this account.
            This feature does not process real payments.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
    marginLeft: 4,
  },
  securityCard: {
    borderRadius: 14,
    marginBottom: 28,
  },
  securityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  securityText: {
    flex: 1,
    gap: 4,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  emptyContainer: {
    padding: 28,
    alignItems: 'center',
  },
  emptyCard: {
    borderRadius: 16,
    borderStyle: 'dashed',
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 26,
    gap: 12,
  },
  emptyButton: {
    marginTop: 8,
  },
  methodCard: {
    borderRadius: 16,
    marginBottom: 14,
  },
  methodTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
    gap: 3,
  },
  methodDivider: {
    marginVertical: 16,
  },
  cardholder: {
    marginTop: 4,
    marginBottom: 14,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  formCard: {
    borderRadius: 16,
    marginTop: 12,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  input: {
    marginBottom: 14,
    backgroundColor: 'transparent',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  formButton: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 24,
  },
  footerText: {
    flex: 1,
    lineHeight: 19,
  },
});
