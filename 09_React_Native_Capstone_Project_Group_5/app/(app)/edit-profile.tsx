/**
 * Edit Profile Screen - PUT /users/{id}
 */
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, HelperText, Snackbar, TextInput } from 'react-native-paper';
import { snackbarStyle } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { ProfileErrors, validateProfile } from '@/utils/validation';
import { createStyles, useAppTheme } from '@/context/ThemeContext';

export default function EditProfileScreen() {
    useAppTheme();
    const router = useRouter();
    const { user, updateProfile } = useAuth();
    const [firstName, setFirstName] = useState(user?.firstName ?? '');
    const [lastName, setLastName] = useState(user?.lastName ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [errors, setErrors] = useState<ProfileErrors>({});
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSave = async () => {
        const found = validateProfile({ firstName, lastName, email });
        setErrors(found);
        if (Object.keys(found).length > 0) return;
        try {
            setSaving(true);
            await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() });
            router.back();
        } catch (err) {
            setMessage(err instanceof Error ? err.message : 'Could not save your profile');
        } finally {
            setSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <TextInput
                    label="First name"
                    mode="outlined"
                    value={firstName}
                    onChangeText={setFirstName}
                    error={!!errors.firstName}
                />
                <HelperText type="error" visible={!!errors.firstName}>{errors.firstName}</HelperText>

                <TextInput
                    label="Last name"
                    mode="outlined"
                    value={lastName}
                    onChangeText={setLastName}
                    error={!!errors.lastName}
                />
                <HelperText type="error" visible={!!errors.lastName}>{errors.lastName}</HelperText>

                <TextInput
                    label="Email"
                    mode="outlined"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={!!errors.email}
                />
                <HelperText type="error" visible={!!errors.email}>{errors.email}</HelperText>

                <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving} style={styles.button}>
                    Save changes
                </Button>
            </ScrollView>
            <Snackbar visible={!!message} onDismiss={() => setMessage(null)} duration={4000} style={snackbarStyle}>
                {message}
            </Snackbar>
        </KeyboardAvoidingView>
    );
}

const styles = createStyles({
    flex: { flex: 1, backgroundColor: '#FFFDF8' },
    content: { padding: 16, maxWidth: 560, width: '100%', alignSelf: 'center' },
    button: { marginTop: 16, borderRadius: 12 },
});