/**
 * Payment Methods Screen
 * Saves cards and e-wallets on the device for checkout. Only a masked label is
 * stored: full card numbers and CVVs are validated, then discarded.
 */
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Button, Card, HelperText, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAsyncStorage, useThemedStyles } from '@/hooks';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/CommonComponents';
import { STORAGE_KEYS } from '@/utils/storage';
import { createId } from '@/utils/format';
import { detectCardBrand, isValidCardNumber, isValidExpiry, isValidPhone } from '@/utils/validation';
import type { PaymentMethod } from '@/types/account';
import { makeCommon } from '@/styles/common';
import { useAppTheme } from '@/context/SettingsContext';
import { makeAccountStyles } from '@/styles/account';

const WALLETS = ['GCash', 'Maya', 'PayPal'] as const;

interface CardForm {
  holderName: string;
  number: string;
  expiry: string;
  cvv: string;
}

interface WalletForm {
  provider: (typeof WALLETS)[number];
  account: string;
}

type FormErrors = Partial<Record<keyof CardForm | 'account', string>>;

const EMPTY_CARD: CardForm = { holderName: '', number: '', expiry: '', cvv: '' };

/** Formats raw digits as "1234 5678 9012 3456". */
function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** Formats raw digits as "MM/YY". */
function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export default function PaymentMethodsScreen() {
  const common = useThemedStyles(makeCommon);
  const styles = useThemedStyles(makeAccountStyles);
  const { palette: colors } = useAppTheme();
  const [methods, setMethods, loading] = useAsyncStorage<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS, []);

  const [adding, setAdding] = useState<'card' | 'ewallet' | null>(null);
  const [card, setCard] = useState<CardForm>(EMPTY_CARD);
  const [wallet, setWallet] = useState<WalletForm>({ provider: 'GCash', account: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [pendingDelete, setPendingDelete] = useState<PaymentMethod | null>(null);

  const resetForm = () => {
    setAdding(null);
    setCard(EMPTY_CARD);
    setWallet({ provider: 'GCash', account: '' });
    setErrors({});
  };

  const addMethod = (method: Omit<PaymentMethod, 'id' | 'isDefault'>) => {
    setMethods((prev) => [...prev, { ...method, id: createId('pay'), isDefault: prev.length === 0 }]);
    resetForm();
  };

  const saveCard = () => {
    const next: FormErrors = {};
    if (card.holderName.trim().length < 2) next.holderName = 'Cardholder name is required';
    if (!isValidCardNumber(card.number)) next.number = 'Invalid card number';
    if (!isValidExpiry(card.expiry)) next.expiry = 'Use a future MM/YY date';
    if (!/^\d{3,4}$/.test(card.cvv)) next.cvv = '3–4 digits';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const digits = card.number.replace(/\D/g, '');
    addMethod({
      type: 'card',
      label: `${detectCardBrand(digits)} •••• ${digits.slice(-4)}`,
      holderName: card.holderName.trim(),
      expiry: card.expiry,
    });
  };

  const saveWallet = () => {
    const account = wallet.account.trim();
    const valid = wallet.provider === 'PayPal' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account) : isValidPhone(account);
    if (!valid) {
      setErrors({ account: wallet.provider === 'PayPal' ? 'Enter your PayPal email' : 'Enter your mobile number' });
      return;
    }
    const masked =
      wallet.provider === 'PayPal'
        ? account.replace(/^(.).*(@.*)$/, '$1•••$2')
        : `•••${account.replace(/\D/g, '').slice(-4)}`;
    addMethod({ type: 'ewallet', label: `${wallet.provider} ${masked}` });
  };

  const setDefault = (id: string) =>
    setMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })));

  const confirmDelete = () => {
    if (pendingDelete) {
      setMethods((prev) => {
        const remaining = prev.filter((m) => m.id !== pendingDelete.id);
        if (remaining.length > 0 && !remaining.some((m) => m.isDefault)) remaining[0] = { ...remaining[0], isDefault: true };
        return remaining;
      });
    }
    setPendingDelete(null);
  };

  const cardForm = (
    <>
      <TextInput
        mode="outlined"
        dense
        label="Cardholder Name"
        value={card.holderName}
        onChangeText={(v) => setCard({ ...card, holderName: v })}
        error={!!errors.holderName}
        autoCapitalize="words"
        style={common.input}
      />
      <HelperText type="error" visible={!!errors.holderName}>
        {errors.holderName ?? ' '}
      </HelperText>
      <TextInput
        mode="outlined"
        dense
        label="Card Number"
        value={card.number}
        onChangeText={(v) => setCard({ ...card, number: formatCardNumber(v) })}
        error={!!errors.number}
        keyboardType="number-pad"
        style={common.input}
        right={<TextInput.Affix text={card.number ? detectCardBrand(card.number) : ''} />}
      />
      <HelperText type={errors.number ? 'error' : 'info'}>
        {errors.number ?? 'Test number: 4242 4242 4242 4242'}
      </HelperText>
      <View style={styles.row}>
        <View style={styles.flex}>
          <TextInput
            mode="outlined"
            dense
            label="Expiry (MM/YY)"
            value={card.expiry}
            onChangeText={(v) => setCard({ ...card, expiry: formatExpiry(v) })}
            error={!!errors.expiry}
            keyboardType="number-pad"
            style={common.input}
          />
          <HelperText type="error" visible={!!errors.expiry}>
            {errors.expiry ?? ' '}
          </HelperText>
        </View>
        <View style={styles.flex}>
          <TextInput
            mode="outlined"
            dense
            label="CVV"
            value={card.cvv}
            onChangeText={(v) => setCard({ ...card, cvv: v.replace(/\D/g, '').slice(0, 4) })}
            error={!!errors.cvv}
            keyboardType="number-pad"
            secureTextEntry
            style={common.input}
          />
          <HelperText type="error" visible={!!errors.cvv}>
            {errors.cvv ?? ' '}
          </HelperText>
        </View>
      </View>
      <View style={styles.formActions}>
        <Button onPress={resetForm}>Cancel</Button>
        <Button mode="contained" onPress={saveCard}>
          Save Card
        </Button>
      </View>
    </>
  );

  const walletForm = (
    <>
      <View style={styles.segment}>
        {WALLETS.map((provider) => (
          <TouchableOpacity
            key={provider}
            style={[styles.segmentOption, wallet.provider === provider && styles.segmentOptionActive]}
            onPress={() => setWallet({ ...wallet, provider })}
          >
            <Text style={[styles.segmentText, wallet.provider === provider && styles.segmentTextActive]}>
              {provider}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        mode="outlined"
        dense
        label={wallet.provider === 'PayPal' ? 'PayPal Email' : 'Mobile Number'}
        value={wallet.account}
        onChangeText={(v) => setWallet({ ...wallet, account: v })}
        error={!!errors.account}
        keyboardType={wallet.provider === 'PayPal' ? 'email-address' : 'phone-pad'}
        autoCapitalize="none"
        style={common.input}
      />
      <HelperText type="error" visible={!!errors.account}>
        {errors.account ?? ' '}
      </HelperText>
      <View style={styles.formActions}>
        <Button onPress={resetForm}>Cancel</Button>
        <Button mode="contained" onPress={saveWallet}>
          Save Wallet
        </Button>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={common.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={common.scrollContent} keyboardShouldPersistTaps="handled">
        {adding && (
          <Card style={common.card} elevation={2}>
            <Card.Content>
              <Text style={common.sectionTitle}>{adding === 'card' ? 'Add Card' : 'Add E-Wallet'}</Text>
              {adding === 'card' ? cardForm : walletForm}
            </Card.Content>
          </Card>
        )}

        {!loading && methods.length === 0 && !adding && (
          <EmptyState
            icon="credit-card-outline"
            title="No payment methods"
            message="Cash on Delivery is always available. Add a card or e-wallet for faster checkout."
          />
        )}

        {methods.map((method) => (
          <Card key={method.id} style={common.card} elevation={1}>
            <Card.Title
              title={method.label}
              subtitle={method.type === 'card' ? `${method.holderName} · Exp ${method.expiry}` : 'E-wallet'}
              left={(props) => (
                <MaterialCommunityIcons
                  {...props}
                  name={method.type === 'card' ? 'credit-card' : 'wallet'}
                  color={colors.primary}
                />
              )}
              right={() =>
                method.isDefault ? (
                  <View style={[styles.defaultBadge, styles.defaultBadgeInset]}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                ) : null
              }
            />
            <Card.Actions>
              {!method.isDefault && <Button onPress={() => setDefault(method.id)}>Set Default</Button>}
              <Button textColor={colors.danger} onPress={() => setPendingDelete(method)}>
                Remove
              </Button>
            </Card.Actions>
          </Card>
        ))}

        {!adding && (
          <View style={styles.row}>
            <Button mode="contained" icon="credit-card-plus" onPress={() => setAdding('card')} style={styles.flex}>
              Add Card
            </Button>
            <Button mode="contained-tonal" icon="wallet-plus" onPress={() => setAdding('ewallet')} style={styles.flex}>
              Add E-Wallet
            </Button>
          </View>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={!!pendingDelete}
        title="Remove Payment Method"
        message={`Remove ${pendingDelete?.label ?? ''}?`}
        confirmLabel="Remove"
        destructive
        onConfirm={confirmDelete}
        onDismiss={() => setPendingDelete(null)}
      />
    </KeyboardAvoidingView>
  );
}
