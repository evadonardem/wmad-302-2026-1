import React from 'react';
import { Text, Pressable } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SettingsProvider, useSettings } from '@/context/SettingsContext';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  default: () => 'light',
}));

function Probe() {
  const { settings, updateSettings, resetSettings } = useSettings();
  return (
    <>
      <Text>theme:{settings.theme}</Text>
      <Text>orders:{String(settings.notifications.orders)}</Text>
      <Pressable onPress={() => updateSettings({ theme: 'dark', notifications: { ...settings.notifications, orders: false } })}><Text>update</Text></Pressable>
      <Pressable onPress={resetSettings}><Text>reset</Text></Pressable>
    </>
  );
}

describe('SettingsProvider', () => {
  it('updates and resets settings', async () => {
    const { getByText } = render(<SettingsProvider><Probe /></SettingsProvider>);
    await waitFor(() => expect(getByText('theme:light')).toBeTruthy());
    fireEvent.press(getByText('update'));
    await waitFor(() => expect(getByText('theme:dark')).toBeTruthy());
    fireEvent.press(getByText('reset'));
    await waitFor(() => expect(getByText('theme:light')).toBeTruthy());
  });
});
