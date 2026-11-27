import * as Crypto from 'expo-crypto';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Checkbox, Chip, HelperText, Text, TextInput } from 'react-native-paper';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { useSnackbar } from '@/components/SnackbarProvider';
import { spacing, useAppTheme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getSavedAddresses, saveAddresses } from '@/services/addressStorage';
import type { SavedAddress } from '@/types/address';
import { getErrorMessage } from '@/utils/errors';

interface AddressForm {
  label: string;
  fullName: string;
  phone: string;
  street: string;
  unit: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const EMPTY_FORM: AddressForm = {
  label: 'Home',
  fullName: '',
  phone: '',
  street: '',
  unit: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
  isDefault: false,
};

export default function AddressesScreen() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const { show } = useSnackbar();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SavedAddress | null>(null);

  const userId = user?.id;
  const loadAddresses = useCallback(async () => {
    if (userId === undefined) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      setAddresses(await getSavedAddresses(userId));
    } catch (caught: unknown) {
      setLoadError(getErrorMessage(caught, 'Could not load your saved addresses.'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const openNewForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, fullName: user ? `${user.firstName} ${user.lastName}`.trim() : '' });
    setFormError(null);
    setOperationError(null);
    setFormVisible(true);
  };

  const openEditForm = (address: SavedAddress) => {
    setEditingId(address.id);
    setForm({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      street: address.street,
      unit: address.unit,
      city: address.city,
      region: address.region,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setFormError(null);
    setOperationError(null);
    setFormVisible(true);
  };

  const updateForm = (field: keyof AddressForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError(null);
  };

  const handleSave = async () => {
    if (userId === undefined || saving) return;
    const requiredFields = ['fullName', 'phone', 'street', 'city', 'region', 'postalCode', 'country'] as const;
    if (requiredFields.some((field) => !form[field].trim())) {
      setFormError('Complete all required address fields.');
      return;
    }

    setSaving(true);
    setFormError(null);
    setOperationError(null);
    const existing = addresses.find((address) => address.id === editingId);
    const address: SavedAddress = {
      id: editingId ?? Crypto.randomUUID(),
      ...form,
      label: form.label.trim() || 'Home',
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      street: form.street.trim(),
      unit: form.unit.trim(),
      city: form.city.trim(),
      region: form.region.trim(),
      postalCode: form.postalCode.trim(),
      country: form.country.trim(),
      isDefault: addresses.length === 0 || form.isDefault || Boolean(existing?.isDefault),
    };
    const updated = editingId
      ? addresses.map((current) => current.id === editingId ? address : current)
      : [...addresses, address];
    const next = updated.map((current) => ({
      ...current,
      isDefault: current.id === address.id ? address.isDefault : address.isDefault ? false : current.isDefault,
    }));

    try {
      await saveAddresses(userId, next);
      setAddresses(next);
      setFormVisible(false);
      setEditingId(null);
      show(existing ? 'Address updated.' : 'Address saved.');
    } catch (caught: unknown) {
      setFormError(getErrorMessage(caught, 'Could not save this address.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (userId === undefined) return;
    const next = addresses.map((address) => ({ ...address, isDefault: address.id === addressId }));
    setOperationError(null);
    try {
      await saveAddresses(userId, next);
      setAddresses(next);
      show('Default address updated.');
    } catch (caught: unknown) {
      setOperationError(getErrorMessage(caught, 'Could not update the default address.'));
    }
  };

  const handleDelete = async () => {
    if (userId === undefined || !pendingDelete) return;
    const next = addresses.filter((address) => address.id !== pendingDelete.id);
    if (next.length > 0 && !next.some((address) => address.isDefault)) {
      next[0] = { ...next[0], isDefault: true };
    }
    setOperationError(null);
    try {
      await saveAddresses(userId, next);
      setAddresses(next);
      show('Address removed.');
    } catch (caught: unknown) {
      setOperationError(getErrorMessage(caught, 'Could not remove this address.'));
    } finally {
      setPendingDelete(null);
    }
  };

  if (loading) {
    return (
      <Screen>
        <LoadingState message="Loading your addresses..." />
      </Screen>
    );
  }

  if (loadError) {
    return (
      <Screen>
        <ErrorState message={loadError} onRetry={() => void loadAddresses()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text variant="headlineSmall">Addresses</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Manage where your orders are delivered.
            </Text>
          </View>
          {!formVisible && addresses.length > 0 ? (
            <Button mode="contained" icon="plus" onPress={openNewForm}>
              Add address
            </Button>
          ) : null}
        </View>

        {operationError ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
            {operationError}
          </Text>
        ) : null}

        {formVisible ? (
          <Card mode="outlined" style={{ backgroundColor: theme.colors.surface }}>
            <Card.Content style={styles.form}>
              <Text variant="titleMedium">{editingId ? 'Edit address' : 'New address'}</Text>
              <TextInput
                mode="outlined"
                label="Label (Home, Work, etc.)"
                value={form.label}
                onChangeText={(value) => updateForm('label', value)}
                autoCapitalize="words"
              />
              <TextInput
                mode="outlined"
                label="Full name"
                value={form.fullName}
                onChangeText={(value) => updateForm('fullName', value)}
                autoCapitalize="words"
              />
              <TextInput
                mode="outlined"
                label="Phone"
                value={form.phone}
                onChangeText={(value) => updateForm('phone', value)}
                keyboardType="phone-pad"
              />
              <TextInput
                mode="outlined"
                label="Street address"
                value={form.street}
                onChangeText={(value) => updateForm('street', value)}
                autoCapitalize="words"
              />
              <TextInput
                mode="outlined"
                label="Apartment, suite, etc. (optional)"
                value={form.unit}
                onChangeText={(value) => updateForm('unit', value)}
                autoCapitalize="words"
              />
              <View style={styles.formRow}>
                <TextInput
                  mode="outlined"
                  label="City"
                  value={form.city}
                  onChangeText={(value) => updateForm('city', value)}
                  style={styles.flexInput}
                  autoCapitalize="words"
                />
                <TextInput
                  mode="outlined"
                  label="State / Province"
                  value={form.region}
                  onChangeText={(value) => updateForm('region', value)}
                  style={styles.flexInput}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.formRow}>
                <TextInput
                  mode="outlined"
                  label="Postal code"
                  value={form.postalCode}
                  onChangeText={(value) => updateForm('postalCode', value)}
                  style={styles.flexInput}
                />
                <TextInput
                  mode="outlined"
                  label="Country"
                  value={form.country}
                  onChangeText={(value) => updateForm('country', value)}
                  style={styles.flexInput}
                  autoCapitalize="words"
                />
              </View>
              <Checkbox.Item
                label="Set as default address"
                status={form.isDefault ? 'checked' : 'unchecked'}
                onPress={() => updateForm('isDefault', !form.isDefault)}
                disabled={Boolean(addresses.find((address) => address.id === editingId)?.isDefault)}
                position="leading"
                labelStyle={styles.checkboxLabel}
              />
              {formError ? (
                <HelperText type="error" visible>
                  {formError}
                </HelperText>
              ) : null}
              <View style={styles.formActions}>
                <Button
                  mode="text"
                  onPress={() => setFormVisible(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button mode="contained" onPress={() => void handleSave()} loading={saving} disabled={saving}>
                  Save address
                </Button>
              </View>
            </Card.Content>
          </Card>
        ) : null}

        {addresses.length === 0 && !formVisible ? (
          <EmptyState
            icon="map-marker-outline"
            title="No saved addresses"
            message="Add an address to keep your delivery details in one place."
            actionLabel="Add address"
            onAction={openNewForm}
          />
        ) : (
          addresses.map((address) => (
            <Card key={address.id} mode="outlined" style={{ backgroundColor: theme.colors.surface }}>
              <Card.Content style={styles.addressCard}>
                <View style={styles.addressHeader}>
                  <Text variant="titleMedium">{address.label}</Text>
                  {address.isDefault ? <Chip compact icon="check">Default</Chip> : null}
                </View>
                <Text variant="bodyMedium">{address.fullName}</Text>
                <Text variant="bodyMedium">{address.phone}</Text>
                <Text variant="bodyMedium">
                  {address.street}{address.unit ? `, ${address.unit}` : ''}
                </Text>
                <Text variant="bodyMedium">
                  {address.city}, {address.region} {address.postalCode}
                </Text>
                <Text variant="bodyMedium">{address.country}</Text>
                <View style={styles.addressActions}>
                  {!address.isDefault ? (
                    <Button mode="text" compact onPress={() => void handleSetDefault(address.id)}>
                      Make default
                    </Button>
                  ) : null}
                  <Button mode="text" compact icon="pencil-outline" onPress={() => openEditForm(address)}>
                    Edit
                  </Button>
                  <Button
                    mode="text"
                    compact
                    icon="delete-outline"
                    textColor={theme.colors.error}
                    onPress={() => setPendingDelete(address)}
                  >
                    Remove
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Remove address?"
        message={pendingDelete ? `Remove the ${pendingDelete.label.toLowerCase()} address?` : ''}
        confirmLabel="Remove"
        destructive
        onDismiss={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  headerText: { flex: 1, gap: spacing.xs },
  form: { gap: spacing.sm },
  formRow: { flexDirection: 'row', gap: spacing.sm },
  flexInput: { flex: 1 },
  checkboxLabel: { textAlign: 'left' },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  addressCard: { gap: spacing.xs },
  addressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addressActions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap' },
});
