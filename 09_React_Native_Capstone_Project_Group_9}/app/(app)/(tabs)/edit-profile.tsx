import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, IconButton, TextInput, Title } from 'react-native-paper';
import { useAuth } from '@/context/AuthContext';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert('Missing information', 'Please fill in your name and email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }
    setSaving(true);
    try {
      await updateUser({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() });
      router.back();
    } catch (error) {
      Alert.alert('Could not save profile', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F3F8F3' }}
      contentContainerStyle={{ padding: 22 }}
      showsVerticalScrollIndicator={false}
    >
      <IconButton icon="arrow-left" onPress={() => router.back()} accessibilityLabel="Go back" style={{ marginLeft: -8 }} />
      <Text style={{ color: '#168C78', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }}>ACCOUNT</Text>
      <Title style={{ color: '#183B35', fontSize: 27, fontWeight: '800', marginTop: 4 }}>Edit profile</Title>
      <Text style={{ color: '#71857D', marginTop: 4, marginBottom: 24 }}>Your changes are saved on this device.</Text>
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16 }}>
        <TextInput label="First name" value={firstName} onChangeText={setFirstName} mode="outlined" style={{ marginBottom: 12, backgroundColor: '#FFFFFF' }} />
        <TextInput label="Last name" value={lastName} onChangeText={setLastName} mode="outlined" style={{ marginBottom: 12, backgroundColor: '#FFFFFF' }} />
        <TextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" mode="outlined" style={{ backgroundColor: '#FFFFFF' }} />
      </View>
      <Button mode="contained" onPress={() => void saveProfile()} loading={saving} disabled={saving} buttonColor="#168C78" style={{ marginTop: 22, borderRadius: 14 }} contentStyle={{ height: 50 }}>
        Save changes
      </Button>
    </ScrollView>
  );
}