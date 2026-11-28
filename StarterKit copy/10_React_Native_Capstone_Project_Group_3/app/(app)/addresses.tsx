/**
 * Addresses Screen - create, edit, delete and set a default delivery address
 * (stored on the device; DummyJSON has no address endpoints).
 */
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Button, Card, Checkbox, HelperText, TextInput } from 'react-native-paper';
import { useAsyncStorage, useThemedStyles } from '@/hooks';
import { useAuth } from '@/context/AuthContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/CommonComponents';
import { STORAGE_KEYS } from '@/utils/storage';
import { createId } from '@/utils/format';
import { ShippingErrors, hasErrors, validateShipping } from '@/utils/validation';
import type { Address } from '@/types/account';
import { makeCommon } from '@/styles/common';
import { useAppTheme } from '@/context/SettingsContext';
import { makeAccountStyles } from '@/styles/account';

type AddressDraft = Omit<Address, 'id'>;
type DraftErrors = ShippingErrors & { label?: string };

const emptyDraft = (fullName = ''): AddressDraft => ({
  label: '',
  fullName,
  phone: '',
  street: '',
  city: '',
  postalCode: '',
  isDefault: false,
});

function validateDraft(draft: AddressDraft): DraftErrors {
  const errors: DraftErrors = validateShipping(draft);
  if (!draft.label.trim()) errors.label = 'Give this address a label (e.g. Home)';
  return errors;
}

/** Ensures exactly one default address when the list is not empty. */
function normalizeDefaults(list: Address[], defaultId?: string): Address[] {
  if (list.length === 0) return list;
  const target = defaultId ?? list.find((a) => a.isDefault)?.id ?? list[0].id;
  return list.map((a) => ({ ...a, isDefault: a.id === target }));
}

export default function AddressesScreen() {
  const common = useThemedStyles(makeCommon);
  const styles = useThemedStyles(makeAccountStyles);
  const { palette: colors } = useAppTheme();
  const { user } = useAuth();
  const [addresses, setAddresses, loading] = useAsyncStorage<Address[]>(STORAGE_KEYS.ADDRESSES, []);

  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<AddressDraft>(emptyDraft());
  const [errors, setErrors] = useState<DraftErrors>({});
  const [pendingDelete, setPendingDelete] = useState<Address | null>(null);

  const fullName = user ? `${user.firstName} ${user.lastName}` : '';

  const startAdd = () => {
    setDraft({ ...emptyDraft(fullName), isDefault: addresses.length === 0 });
    setErrors({});
    setEditingId('new');
  };

  const startEdit = (address: Address) => {
    const { id: _id, ...rest } = address;
    setDraft(rest);
    setErrors({});
    setEditingId(address.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setErrors({});
  };

  const setField = (field: keyof AddressDraft, value: string) => {
    const next = { ...draft, [field]: value };
    setDraft(next);
    if (hasErrors(errors)) setErrors(validateDraft(next));
  };

  const save = () => {
    const validation = validateDraft(draft);
    setErrors(validation);
    if (hasErrors(validation)) return;

    const trimmed: AddressDraft = {
      ...draft,
      label: draft.label.trim(),
      fullName: draft.fullName.trim(),
      phone: draft.phone.trim(),
      street: draft.street.trim(),
      city: draft.city.trim(),
      postalCode: draft.postalCode.trim(),
    };

    setAddresses((prev) => {
      if (editingId === 'new') {
        const created: Address = { ...trimmed, id: createId('addr') };
        return normalizeDefaults([...prev, created], trimmed.isDefault ? created.id : undefined);
      }
      const updated = prev.map((a) => (a.id === editingId ? { ...a, ...trimmed } : a));
      return normalizeDefaults(updated, trimmed.isDefault ? (editingId ?? undefined) : undefined);
    });
    setEditingId(null);
  };

  const confirmDelete = () => {
    if (pendingDelete) {
      setAddresses((prev) => normalizeDefaults(prev.filter((a) => a.id !== pendingDelete.id)));
    }
    setPendingDelete(null);
  };

  const setDefault = (id: string) => setAddresses((prev) => normalizeDefaults(prev, id));

  const renderField = (
    field: Exclude<keyof AddressDraft, 'isDefault'>,
    label: string,
    props: Partial<React.ComponentProps<typeof TextInput>> = {}
  ) => (
    <View>
      <TextInput
        mode="outlined"
        dense
        label={label}
        value={draft[field]}
        onChangeText={(v) => setField(field, v)}
        error={!!errors[field]}
        style={common.input}
        {...props}
      />
      <HelperText type="error" visible={!!errors[field]}>
        {errors[field] ?? ' '}
      </HelperText>
    </View>
  );

  const form = (
    <Card style={common.card} elevation={2}>
      <Card.Content>
        <Text style={common.sectionTitle}>{editingId === 'new' ? 'New Address' : 'Edit Address'}</Text>
        {renderField('label', 'Label (Home, Office…)')}
        {renderField('fullName', 'Full Name')}
        {renderField('phone', 'Phone', { keyboardType: 'phone-pad' })}
        {renderField('street', 'Street Address')}
        <View style={styles.row}>
          <View style={styles.flex}>{renderField('city', 'City')}</View>
          <View style={styles.flex}>{renderField('postalCode', 'Postal Code', { keyboardType: 'number-pad' })}</View>
        </View>
        <Checkbox.Item
          label="Use as default address"
          status={draft.isDefault ? 'checked' : 'unchecked'}
          onPress={() => setDraft({ ...draft, isDefault: !draft.isDefault })}
          mode="android"
          position="leading"
          labelStyle={styles.checkboxLabel}
          style={styles.checkboxItem}
        />
        <View style={styles.formActions}>
          <Button onPress={cancelEdit}>Cancel</Button>
          <Button mode="contained" onPress={save}>
            Save
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <KeyboardAvoidingView
      style={common.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={common.scrollContent} keyboardShouldPersistTaps="handled">
        {editingId && form}

        {!loading && addresses.length === 0 && !editingId && (
          <EmptyState
            icon="map-marker-outline"
            title="No saved addresses"
            message="Add an address to speed up checkout."
            actionLabel="Add Address"
            onAction={startAdd}
          />
        )}

        {addresses.map((address) => (
          <Card key={address.id} style={common.card} elevation={1}>
            <Card.Content>
              <View style={common.rowBetween}>
                <Text style={styles.itemTitle}>{address.label}</Text>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={styles.itemText}>{address.fullName} · {address.phone}</Text>
              <Text style={styles.itemText}>
                {address.street}, {address.city} {address.postalCode}
              </Text>
            </Card.Content>
            <Card.Actions>
              {!address.isDefault && <Button onPress={() => setDefault(address.id)}>Set Default</Button>}
              <Button onPress={() => startEdit(address)}>Edit</Button>
              <Button textColor={colors.danger} onPress={() => setPendingDelete(address)}>
                Delete
              </Button>
            </Card.Actions>
          </Card>
        ))}

        {addresses.length > 0 && !editingId && (
          <Button mode="contained" icon="plus" onPress={startAdd} style={common.primaryButton}>
            Add Address
          </Button>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={!!pendingDelete}
        title="Delete Address"
        message={`Delete "${pendingDelete?.label ?? ''}"?`}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onDismiss={() => setPendingDelete(null)}
      />
    </KeyboardAvoidingView>
  );
}
