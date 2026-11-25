/**
 * AddressManager - full CRUD for delivery addresses (Student guide: "Address management (CRUD)")
 * - Read: list of saved addresses with a Default tag
 * - Create / Update: one form dialog (label, name, phone, street, city, region, postal code)
 * - Delete: confirmation dialog; the default moves to another address when needed
 * The parent owns the list (and persists it), so checkout and the profile always agree.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Button, Chip, Dialog, HelperText, IconButton, List, Portal, Switch, TextInput } from 'react-native-paper';
import { Address, ADDRESS_LABELS, AddressLabel, PHONE_PATTERN, formatAddress } from '@/services/addresses';
import { palette, spacing, themed } from '@/constants/theme';
import { StyleSheet } from 'react-native';

interface AddressManagerProps {
    visible: boolean;
    addresses: Address[];
    defaultName: string;
    onChange: (next: Address[]) => void;
    onClose: () => void;
    onMessage: (text: string) => void;
}

interface FormErrors {
    fullName?: string;
    phone?: string;
    street?: string;
    city?: string;
    region?: string;
    postalCode?: string;
}

const ICONS: Record<AddressLabel, string> = { Home: 'home-outline', Work: 'briefcase-outline', Other: 'map-marker-outline' };

export function AddressManager({ visible, addresses, defaultName, onChange, onClose, onMessage }: AddressManagerProps) {
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [removeTarget, setRemoveTarget] = useState<Address | null>(null);
    const [label, setLabel] = useState<AddressLabel>('Home');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [region, setRegion] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [makeDefault, setMakeDefault] = useState(true);
    const [errors, setErrors] = useState<FormErrors>({});

    // Create or edit: open the form (prefilled when editing)
    const openForm = (address?: Address) => {
        setEditingId(address?.id ?? null);
        setLabel(address?.label ?? (addresses.length === 0 ? 'Home' : 'Other'));
        setFullName(address?.fullName ?? defaultName);
        setPhone(address?.phone ?? '');
        setStreet(address?.street ?? '');
        setCity(address?.city ?? '');
        setRegion(address?.region ?? '');
        setPostalCode(address?.postalCode ?? '');
        setMakeDefault(address ? address.isDefault : addresses.length === 0);
        setErrors({});
        setFormOpen(true);
    };

    const closeForm = () => setFormOpen(false);

    const validate = (): boolean => {
        const next: FormErrors = {};
        if (fullName.trim().length < 2) next.fullName = 'Enter the recipient name';
        if (!PHONE_PATTERN.test(phone.trim())) next.phone = 'Enter a valid phone number';
        if (street.trim().length < 8) next.street = 'Enter the street, building and unit';
        if (city.trim().length < 2) next.city = 'Enter the city';
        if (region.trim().length < 2) next.region = 'Enter the province or region';
        if (postalCode.trim().length < 3) next.postalCode = 'Enter the postal code';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const save = () => {
        if (!validate()) return;
        const base = {
            label,
            fullName: fullName.trim(),
            phone: phone.trim(),
            street: street.trim(),
            city: city.trim(),
            region: region.trim(),
            postalCode: postalCode.trim(),
        };
        let next: Address[];
        if (editingId) {
            next = addresses.map((a) => (a.id === editingId ? { ...a, ...base, isDefault: makeDefault || a.isDefault } : a));
        } else {
            next = [...addresses, { id: `${Date.now()}`, ...base, isDefault: makeDefault || addresses.length === 0 }];
        }
        // Only one default
        const defaultId = (makeDefault ? (editingId ?? next[next.length - 1].id) : next.find((a) => a.isDefault)?.id) ?? next[0].id;
        next = next.map((a) => ({ ...a, isDefault: a.id === defaultId }));
        onChange(next);
        setFormOpen(false);
        onMessage(editingId ? 'Address updated' : 'Address added');
    };

    const setDefault = (id: string) => {
        onChange(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
        onMessage('Default address updated');
    };

    const confirmRemove = () => {
        if (!removeTarget) return;
        const remaining = addresses.filter((a) => a.id !== removeTarget.id);
        if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) remaining[0] = { ...remaining[0], isDefault: true };
        onChange(remaining);
        setRemoveTarget(null);
        onMessage('Address removed');
    };

    return (
        <Portal>
            {/* Read: saved addresses */}
            <Dialog visible={visible && !formOpen && !removeTarget} onDismiss={onClose}>
                <Dialog.Title>Delivery Addresses</Dialog.Title>
                <Dialog.ScrollArea>
                    <ScrollView style={{ maxHeight: 400 }}>
                        {addresses.length === 0 ? (
                            <Text style={styles.empty}>No addresses yet. Add one and checkout will fill it in for you.</Text>
                        ) : (
                            addresses.map((a) => (
                                <List.Item
                                    key={a.id}
                                    title={`${a.label} · ${a.fullName}`}
                                    description={`${formatAddress(a)}\n${a.phone}`}
                                    descriptionNumberOfLines={3}
                                    left={(props) => <List.Icon {...props} icon={ICONS[a.label]} />}
                                    right={() => (
                                        <View style={styles.actions}>
                                            {a.isDefault ? <Chip compact>Default</Chip> : <Button compact onPress={() => setDefault(a.id)}>Default</Button>}
                                            <IconButton icon="pencil-outline" size={20} onPress={() => openForm(a)} accessibilityLabel="Edit address" />
                                            <IconButton icon="delete-outline" size={20} onPress={() => setRemoveTarget(a)} accessibilityLabel="Delete address" />
                                        </View>
                                    )}
                                />
                            ))
                        )}
                    </ScrollView>
                </Dialog.ScrollArea>
                <Dialog.Actions>
                    <Button onPress={() => openForm()}>Add new</Button>
                    <Button onPress={onClose}>Close</Button>
                </Dialog.Actions>
            </Dialog>

            {/* Create / Update */}
            <Dialog visible={visible && formOpen} onDismiss={closeForm}>
                <Dialog.Title>{editingId ? 'Edit Address' : 'Add Address'}</Dialog.Title>
                <Dialog.ScrollArea>
                    <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 420 }}>
                        <View style={styles.chips}>
                            {ADDRESS_LABELS.map((l) => (
                                <Chip key={l} selected={label === l} icon={ICONS[l]} onPress={() => setLabel(l)}>{l}</Chip>
                            ))}
                        </View>
                        <TextInput mode="outlined" label="Full name" value={fullName} onChangeText={setFullName} error={!!errors.fullName} />
                        <HelperText type="error" visible={!!errors.fullName}>{errors.fullName}</HelperText>
                        <TextInput mode="outlined" label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={!!errors.phone} />
                        <HelperText type="error" visible={!!errors.phone}>{errors.phone}</HelperText>
                        <TextInput mode="outlined" label="Street, building, unit" value={street} onChangeText={setStreet} multiline error={!!errors.street} />
                        <HelperText type="error" visible={!!errors.street}>{errors.street}</HelperText>
                        <TextInput mode="outlined" label="City" value={city} onChangeText={setCity} error={!!errors.city} />
                        <HelperText type="error" visible={!!errors.city}>{errors.city}</HelperText>
                        <TextInput mode="outlined" label="Province / region" value={region} onChangeText={setRegion} error={!!errors.region} />
                        <HelperText type="error" visible={!!errors.region}>{errors.region}</HelperText>
                        <TextInput mode="outlined" label="Postal code" value={postalCode} onChangeText={setPostalCode} error={!!errors.postalCode} />
                        <HelperText type="error" visible={!!errors.postalCode}>{errors.postalCode}</HelperText>
                        <List.Item
                            title="Use as default address"
                            description="Checkout fills this one in"
                            right={() => <Switch value={makeDefault} onValueChange={setMakeDefault} />}
                        />
                    </ScrollView>
                </Dialog.ScrollArea>
                <Dialog.Actions>
                    <Button onPress={closeForm}>Cancel</Button>
                    <Button onPress={save}>Save</Button>
                </Dialog.Actions>
            </Dialog>

            {/* Delete */}
            <Dialog visible={!!removeTarget} onDismiss={() => setRemoveTarget(null)}>
                <Dialog.Title>Delete address</Dialog.Title>
                <Dialog.Content>
                    <Text>Delete your {removeTarget?.label.toLowerCase()} address?</Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={() => setRemoveTarget(null)}>Cancel</Button>
                    <Button textColor={palette.danger} onPress={confirmRemove}>Delete</Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
}

const styles = themed(() =>
    StyleSheet.create({
        empty: { paddingVertical: spacing.lg, textAlign: 'center', color: palette.stone },
        actions: { flexDirection: 'row', alignItems: 'center' },
        chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.sm },
    })
);