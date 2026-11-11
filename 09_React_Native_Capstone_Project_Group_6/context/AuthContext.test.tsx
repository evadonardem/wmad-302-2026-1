import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from './AuthContext';
import { authApi } from '@/services/authApi';
import type { AuthProfile, AuthUser } from '@/types/auth';

jest.mock('@react-native-async-storage/async-storage', () => (
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockUser: AuthUser = {
  id: 1,
  username: 'emilys',
  email: 'emily@example.com',
  firstName: 'Emily',
  lastName: 'Johnson',
  gender: 'female',
  image: 'https://example.com/user.png',
  token: 'access',
  refreshToken: 'refresh',
};

const mockProfile: AuthProfile = {
  id: mockUser.id,
  username: mockUser.username,
  email: mockUser.email,
  firstName: mockUser.firstName,
  lastName: mockUser.lastName,
  gender: mockUser.gender,
  image: mockUser.image,
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(authApi, 'setSessionExpiredHandler').mockReturnValue(() => undefined);
    jest.spyOn(authApi, 'getStoredUser').mockResolvedValue(null);
    jest.spyOn(authApi, 'login').mockResolvedValue(mockUser);
    jest.spyOn(authApi, 'logout').mockResolvedValue(undefined);
  });

  it('hydrates as signed out when storage is empty and logs in successfully', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);

    await act(async () => {
      await result.current.login('emilys', 'emilyspass');
    });

    expect(authApi.login).toHaveBeenCalledWith({ username: 'emilys', password: 'emilyspass' });
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('surfaces login failures in auth state', async () => {
    jest.spyOn(authApi, 'login').mockRejectedValue(new Error('Invalid credentials'));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.login('bad', 'bad')).rejects.toThrow('Invalid credentials');
    });

    expect(result.current.error).toBe('Invalid credentials');
    expect(result.current.isAuthenticated).toBe(false);
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });

  it('hydrates a stored user after verifying the session', async () => {
    jest.spyOn(authApi, 'getStoredUser').mockResolvedValue(mockUser);
    jest.spyOn(authApi, 'getMe').mockResolvedValue(mockProfile);
    const setTokens = jest.spyOn(authApi, 'setTokens').mockResolvedValue();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(setTokens).toHaveBeenCalledWith(mockUser);
  });

  it('refreshes an expired stored session and hydrates the new tokens', async () => {
    const refreshedUser = { ...mockUser, token: 'new-access', refreshToken: 'new-refresh' };
    jest.spyOn(authApi, 'getStoredUser')
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce(refreshedUser);
    jest.spyOn(authApi, 'getMe')
      .mockRejectedValueOnce(new Error('Expired'))
      .mockResolvedValueOnce(mockProfile);
    jest.spyOn(authApi, 'refreshAccessToken').mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user?.token).toBe('new-access'));
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('reports an expired session when refresh fails', async () => {
    jest.spyOn(authApi, 'getStoredUser').mockResolvedValue(mockUser);
    jest.spyOn(authApi, 'getMe').mockRejectedValue(new Error('Expired'));
    jest.spyOn(authApi, 'refreshAccessToken').mockRejectedValue(new Error('Refresh failed'));
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.error).toBe('Refresh failed'));
    expect(result.current.isAuthenticated).toBe(false);
    expect(authApi.logout).toHaveBeenCalled();
  });

  it('surfaces local session-storage failures during hydration', async () => {
    jest.spyOn(authApi, 'getStoredUser').mockRejectedValue(new Error('Secure storage unavailable'));
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.error).toBe('Secure storage unavailable'));
    expect(result.current.isLoading).toBe(false);
  });

  it('registers and updates a signed-in profile through the auth service', async () => {
    jest.spyOn(authApi, 'register').mockResolvedValue(mockUser);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.register({
        firstName: 'Emily',
        lastName: 'Johnson',
        username: 'emilys',
        password: 'password',
        email: 'emily@example.com',
      });
    });
    expect(result.current.isAuthenticated).toBe(true);

    const updatedUser = { ...mockUser, firstName: 'Em' };
    jest.spyOn(authApi, 'updateProfile').mockResolvedValue(updatedUser);
    await act(async () => {
      await result.current.updateProfile({
        firstName: 'Em',
        lastName: 'Johnson',
        email: 'emily@example.com',
      });
    });
    expect(result.current.user?.firstName).toBe('Em');
  });

  it('refreshes current profile data while retaining the stored tokens', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.login('emilys', 'emilyspass'); });

    const changedProfile = { ...mockProfile, firstName: 'Emily Updated' };
    jest.spyOn(authApi, 'getMe').mockResolvedValue(changedProfile);
    jest.spyOn(authApi, 'getStoredUser').mockResolvedValue(mockUser);
    const setTokens = jest.spyOn(authApi, 'setTokens').mockResolvedValue();
    await act(async () => { await result.current.refreshUser(); });

    expect(setTokens).toHaveBeenCalledWith({ ...changedProfile, token: mockUser.token, refreshToken: mockUser.refreshToken });
    expect(result.current.user?.firstName).toBe('Emily Updated');
  });

  it('clears the stored session before marking the user signed out', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.login('emilys', 'emilyspass'); });

    await act(async () => { await result.current.logout(); });

    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
