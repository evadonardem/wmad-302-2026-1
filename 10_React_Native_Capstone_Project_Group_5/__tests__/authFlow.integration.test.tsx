import React from 'react';
import { Text, Pressable } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';

jest.mock('@/services/authApi', () => ({
  authApi: {
    init: jest.fn().mockResolvedValue(null),
    login: jest.fn().mockResolvedValue({
      id: 1,
      username: 'emilys',
      email: 'e@example.com',
      firstName: 'Emily',
      lastName: 'Stone',
      gender: 'female',
      image: 'img',
      token: 't1',
      refreshToken: 'r1',
    }),
    logout: jest.fn().mockResolvedValue(undefined),
    getMe: jest.fn(),
    refreshAccessToken: jest.fn(),
    setTokens: jest.fn(),
    getStoredUser: jest.fn(),
  },
}));

function Probe() {
  const { isAuthenticated, user, login, logout } = useAuth();
  return (
    <>
      <Text>{isAuthenticated ? `hi:${user?.username}` : 'logged-out'}</Text>
      <Pressable onPress={() => login('emilys', 'emilyspass')}><Text>login</Text></Pressable>
      <Pressable onPress={logout}><Text>logout</Text></Pressable>
    </>
  );
}

describe('Auth flow integration', () => {
  it('logs in and logs out through AuthProvider', async () => {
    const { getByText } = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(getByText('logged-out')).toBeTruthy(), { timeout: 10000 });
    fireEvent.press(getByText('login'));
    await waitFor(() => expect(getByText('hi:emilys')).toBeTruthy(), { timeout: 10000 });
    fireEvent.press(getByText('logout'));
    await waitFor(() => expect(getByText('logged-out')).toBeTruthy(), { timeout: 10000 });
  }, 30000);
});
