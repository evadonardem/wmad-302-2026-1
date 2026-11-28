/**
 * Edit Profile Screen - PUT /users/{id}
 */
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, HelperText, TextInput } from 'react-native-paper';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/utils/errors';
import { hasErrors, isValidEmail, isValidPhone } from '@/utils/validation';
import type { Gender } from '@/types/auth';
import { makeCommon } from '@/styles/common';
import { useThemedStyles } from '@/hooks';
import { makeAccountStyles } from '@/styles/account';

interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: string;
  gender: Gender;
}

type ProfileErrors = Partial<Record<keyof ProfileForm, string>>;

function validate(form: ProfileForm): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!form.firstName.trim()) errors.firstName = 'First name is required';
  if (!form.lastName.trim()) errors.lastName = 'Last name is required';
  if (!isValidEmail(form.email)) errors.email = 'Enter a valid email';
  if (form.phone.trim() && !isValidPhone(form.phone)) errors.phone = 'Enter a valid phone number';
  if (form.age.trim()) {
    const age = Number(form.age);
    if (!Number.isInteger(age) || age < 13 || age > 120) errors.age = 'Age must be between 13 and 120';
  }
  return errors;
}

export default function EditProfileScreen() {
  const common = useThemedStyles(makeCommon);
  const styles = useThemedStyles(makeAccountStyles);
  const router = useRouter();
  const { user, updateProfile } = useAuth();

  const [form, setForm] = useState<ProfileForm>({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    age: user?.age ? String(user.age) : '',
    gender: user?.gender ?? 'male',
  });
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const setField = (field: keyof ProfileForm, value: string) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (hasErrors(errors)) setErrors(validate(next));
  };

  const handleSave = async () => {
    const validation = validate(form);
    setErrors(validation);
    if (hasErrors(validation)) return;

    setSaving(true);
    setSaveError(null);
    try {
      await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        age: form.age.trim() ? Number(form.age) : undefined,
        gender: form.gender,
      });
      router.back();
    } catch (err) {
      setSaveError(getErrorMessage(err, 'Could not update your profile'));
    } finally {
      setSaving(false);
    }
  };

  const renderField = (
    field: Exclude<keyof ProfileForm, 'gender'>,
    label: string,
    props: Partial<React.ComponentProps<typeof TextInput>> = {}
  ) => (
    <View>
      <TextInput
        mode="outlined"
        label={label}
        value={form[field]}
        onChangeText={(v) => setField(field, v)}
        error={!!errors[field]}
        disabled={saving}
        style={common.input}
        {...props}
      />
      <HelperText type="error" visible={!!errors[field]}>
        {errors[field] ?? ' '}
      </HelperText>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={common.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={common.scrollContent} keyboardShouldPersistTaps="handled">
        <Card style={common.card} elevation={1}>
          <Card.Content>
            {renderField('firstName', 'First Name', { autoCapitalize: 'words' })}
            {renderField('lastName', 'Last Name', { autoCapitalize: 'words' })}
            {renderField('email', 'Email', { keyboardType: 'email-address', autoCapitalize: 'none' })}
            {renderField('phone', 'Phone', { keyboardType: 'phone-pad' })}
            {renderField('age', 'Age', { keyboardType: 'number-pad', maxLength: 3 })}

            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.segment}>
              {(['male', 'female'] as const).map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[styles.segmentOption, form.gender === gender && styles.segmentOptionActive]}
                  onPress={() => setForm({ ...form, gender })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: form.gender === gender }}
                >
                  <Text style={[styles.segmentText, form.gender === gender && styles.segmentTextActive]}>
                    {gender === 'male' ? 'Male' : 'Female'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {saveError && <Text style={styles.errorText}>{saveError}</Text>}

        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={common.primaryButton}
          contentStyle={common.buttonContent}
        >
          Save Changes
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
