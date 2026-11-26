/**
 * AddressManager - full CRUD for delivery addresses (Student guide: "Address management (CRUD)")
 * - Read: list of saved addresses with a Default tag
 * - Create / Update: one form dialog (label, name, phone, street, city, region, postal code)
 * - Delete: confirmation dialog; the default moves to another address when needed
 * The parent owns the list (and persists it), so checkout and the profile always agree.
 * All three views use the shared AppDialog pop-up card.
 */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, IconButton, TextInput } from 'react-native-paper';
import { Address, ADDRESS_LABELS, AddressLabel, PHONE_PATTERN, formatAddress } from '@/services/addresses';
import { palette, radius, spacing, themed } from '@/constants/theme';
import { AppDialog, DialogEmptyState, DialogRow, DialogToggleRow } from '@/components/AppDialog';

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

const ICONS = { Home: 'home-outline', Work: 'briefcase-outline', Other: 'map-marker-outline' } as const;

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
        <>
            {/* Read: saved addresses */}
            <AppDialog
                visible={visible && !formOpen && !removeTarget}
                onDismiss={onClose}
                icon="map-marker-outline"
                eyebrow="Delivery"
                title="Addresses"
                subtitle={
                    addresses.length === 0
                        ? 'Save a delivery address for a faster checkout'
                        : `${addresses.length} saved ${addresses.length === 1 ? 'address' : 'addresses'}`
                }
                actions={[
                    { label: 'Add new', mode: 'outlined', icon: 'plus', onPress: () => openForm() },
                    { label: 'Done', onPress: onClose },
                ]}
                footerNote={addresses.length > 0 ? 'The default address is filled in automatically at checkout.' : undefined}
            >
                {addresses.length === 0 ? (
                    <DialogEmptyState
                        icon="map-marker-off-outline"
                        title="No addresses yet"
                        message="Add your home, work or any delivery spot and checkout will fill it in for you."
                        action={<Button mode="contained" icon="plus" onPress={() => openForm()}>Add your first address</Button>}
                    />
                ) : (
                    addresses.map((a) => (
                        <DialogRow
                            key={a.id}
                            icon={ICONS[a.label]}
                            title={a.fullName}
                            badge={a.isDefault ? 'Default' : a.label}
                            subtitle={formatAddress(a)}
                            meta={a.phone}
                            actions={
                                <>
                                    <IconButton icon="pencil-outline" size={20} onPress={() => openForm(a)} accessibilityLabel="Edit address" />
                                    <IconButton
                                        icon="delete-outline"
                                        size={20}
                                        iconColor={palette.danger}
                                        onPress={() => setRemoveTarget(a)}
                                        accessibilityLabel="Delete address"
                                    />
                                </>
                            }
                            footer={
                                !a.isDefault ? (
                                    <Button mode="text" compact icon="star-outline" onPress={() => setDefault(a.id)} labelStyle={styles.smallLabel}>
                                        Make default
                                    </Button>
                                ) : undefined
                            }
                        />
                    ))
                )}
            </AppDialog>

            {/* Create / Update */}
            <AppDialog
                visible={visible && formOpen}
                onDismiss={closeForm}
                icon={editingId ? 'map-marker-check-outline' : 'map-marker-plus-outline'}
                eyebrow="Delivery"
                title={editingId ? 'Edit address' : 'New address'}
                subtitle="Where should we send your orders?"
                actions={[
                    { label: 'Cancel', onPress: closeForm },
                    { label: editingId ? 'Save changes' : 'Add address', onPress: save, icon: 'check' },
                ]}
            >
                <View style={styles.chips}>
                    {ADDRESS_LABELS.map((l) => (
                        <Chip key={l} selected={label === l} icon={ICONS[l]} onPress={() => setLabel(l)}>
                            {l}
                        </Chip>
                    ))}
                </View>
                <TextInput
                    mode="outlined"
                    label="Full name"
                    value={fullName}
                    onChangeText={setFullName}
                    error={!!errors.fullName}
                    left={<TextInput.Icon icon="account-outline" />}
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                />
                <HelperText type="error" visible={!!errors.fullName}>{errors.fullName}</HelperText>
                <TextInput
                    mode="outlined"
                    label="Phone number"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    error={!!errors.phone}
                    left={<TextInput.Icon icon="phone-outline" />}
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                />
                <HelperText type="error" visible={!!errors.phone}>{errors.phone}</HelperText>
                <TextInput
                    mode="outlined"
                    label="Street, building, unit"
                    value={street}
                    onChangeText={setStreet}
                    multiline
                    error={!!errors.street}
                    left={<TextInput.Icon icon="home-outline" />}
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                />
                <HelperText type="error" visible={!!errors.street}>{errors.street}</HelperText>
                <View style={styles.split}>
                    <View style={styles.splitItem}>
                        <TextInput
                            mode="outlined"
                            label="City"
                            value={city}
                            onChangeText={setCity}
                            error={!!errors.city}
                            style={styles.input}
                            outlineStyle={styles.inputOutline}
                        />
                        <HelperText type="error" visible={!!errors.city}>{errors.city}</HelperText>
                    </View>
                    <View style={styles.splitItem}>
                        <TextInput
                            mode="outlined"
                            label="Province"
                            value={region}
                            onChangeText={setRegion}
                            error={!!errors.region}
                            style={styles.input}
                            outlineStyle={styles.inputOutline}
                        />
                        <HelperText type="error" visible={!!errors.region}>{errors.region}</HelperText>
                    </View>
                </View>
                <TextInput
                    mode="outlined"
                    label="Postal code"
                    value={postalCode}
                    onChangeText={setPostalCode}
                    keyboardType="number-pad"
                    error={!!errors.postalCode}
                    left={<TextInput.Icon icon="mailbox-outline" />}
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                />
                <HelperText type="error" visible={!!errors.postalCode}>{errors.postalCode}</HelperText>
                <DialogToggleRow
                    icon="map-marker-check-outline"
                    title="Use as default address"
                    description="Checkout fills this one in"
                    value={makeDefault}
                    onValueChange={setMakeDefault}
                />
            </AppDialog>

            {/* Delete */}
            <AppDialog
                visible={!!removeTarget}
                onDismiss={() => setRemoveTarget(null)}
                icon="trash-can-outline"
                eyebrow="Careful"
                title="Delete address?"
                subtitle="This cannot be undone."
                tone="danger"
                scroll={false}
                actions={[
                    { label: 'Keep it', onPress: () => setRemoveTarget(null) },
                    { label: 'Delete', tone: 'danger', icon: 'trash-can-outline', onPress: confirmRemove },
                ]}
            >
                {removeTarget ? (
                    <DialogRow
                        icon={ICONS[removeTarget.label]}
                        title={removeTarget.fullName}
                        badge={removeTarget.label}
                        subtitle={formatAddress(removeTarget)}
                        meta={removeTarget.phone}
                    />
                ) : null}
            </AppDialog>
        </>
    );
}

const styles = themed(() =>
    StyleSheet.create({
        chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xs },
        input: { backgroundColor: palette.surface, borderRadius: radius.md },
        inputOutline: { borderRadius: 14, borderColor: palette.line },
        split: { flexDirection: 'row', gap: spacing.sm },
        splitItem: { flex: 1 },
        smallLabel: { fontSize: 11, fontWeight: '700' },
    })
);
