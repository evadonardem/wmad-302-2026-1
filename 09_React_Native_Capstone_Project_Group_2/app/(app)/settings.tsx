import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { IconButton, List, Title } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)/(tabs)/profile');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton icon="arrow-left" onPress={goBack} />
        <Title>Settings</Title>
      </View>
      <List.Section>
        <List.Item
          title="Notifications"
          description="Notification preferences are managed locally on this device."
          left={(props) => <List.Icon {...props} icon="bell-outline" />}
        />
        <List.Item
          title="Privacy"
          description="Your profile and saved recipes remain stored locally."
          left={(props) => <List.Icon {...props} icon="shield-lock-outline" />}
        />
      </List.Section>
      <Text style={{ marginTop: 16, color: '#8D6E63' }}>
        Additional settings will be available in a future update.
      </Text>
    </ScrollView>
  );
}
