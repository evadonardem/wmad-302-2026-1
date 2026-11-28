/**
 * Integration test: AuthProvider + useAuth with a mocked API layer
 */
import '@testing-library/react-native/extend-expect';
import React from 'react';
import { Text } from 'react-native';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { authApi } from '@/services/authApi';
import type { AuthUser } from '@/types/auth';

jest.mock('@/services/authApi', () => ({
  authApi: {
    loadSession: jest.fn(),
    setSession: jest.fn(),
    getStoredUser: jest.fn(),
    hasValidTokens: jest.fn(),
    getMe: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    onSessionExpired: jest.fn(() => () => undefined),
  },
}));

jest.mock('@/services/userApi', () => ({ userApi: { updateUser: jest.fn() } }));

const api = authApi as jest.Mocked<typeof authApi>;

// The first render pays for transforming React Native Paper etc., which can be slow
jest.setTimeout(20000);

const user: AuthUser = {
  id: 1,
  username: 'emilys',
  email: 'emily@example.com',
  firstName: 'Emily',
  lastName: 'Johnson',
  gender: 'female',
  image: '',
  token: 'access',
  refreshToken: 'refresh',
};

let auth: ReturnType<typeof useAuth>;

function Probe() {
  auth = useAuth();
  return (
    <Text testID="state">
      {auth.isLoading ? 'loading' : auth.isAuthenticated ? `user:${auth.user?.firstName}` : 'guest'}
    </Text>
  );
}

const renderProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  api.onSessionExpired.mockReturnValue(() => undefined);
});

describe('AuthContext', () => {
  it('hydrates as a guest when nothing is stored', async () => {
    api.loadSession.mockResolvedValue(null);
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('guest'));
  });

  it('restores a stored session after verifying it with /auth/me', async () => {
    api.loadSession.mockResolvedValue(user);
    api.hasValidTokens.mockReturnValue(true);
    api.getStoredUser.mockReturnValue(user);
    api.getMe.mockResolvedValue({ ...user, firstName: 'Em' });

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('user:Em'));
    expect(api.setSession).toHaveBeenCalledWith(expect.objectContaining({ token: 'access', firstName: 'Em' }));
  });

  it('logs out when the stored session cannot be refreshed', async () => {
    api.loadSession.mockResolvedValue(user);
    api.hasValidTokens.mockReturnValue(true);
    api.getMe.mockRejectedValue(Object.assign(new Error('Unauthorized'), { isAxiosError: true, response: { status: 401 } }));

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('guest'));
    expect(api.logout).toHaveBeenCalled();
  });

  it('logs in and exposes API error messages on failure', async () => {
    api.loadSession.mockResolvedValue(null);
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('guest'));

    api.login.mockRejectedValueOnce(
      Object.assign(new Error('Request failed'), {
        isAxiosError: true,
        response: { status: 400, data: { message: 'Invalid credentials' } },
      })
    );
    await act(async () => {
      await expect(auth.login('emilys', 'wrong')).rejects.toBeDefined();
    });
    expect(auth.error).toBe('Invalid credentials');

    api.login.mockResolvedValueOnce(user);
    await act(() => auth.login('emilys', 'emilyspass'));
    expect(screen.getByTestId('state')).toHaveTextContent('user:Emily');
  });

  it('registers and signs the new user in', async () => {
    api.loadSession.mockResolvedValue(null);
    api.register.mockResolvedValue({ ...user, id: 209, firstName: 'Ada', isLocalSession: true });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('guest'));

    await act(() =>
      auth.register({
        firstName: 'Ada',
        lastName: 'Lovelace',
        username: 'ada',
        password: 'secret1',
        email: 'ada@example.com',
      })
    );
    expect(screen.getByTestId('state')).toHaveTextContent('user:Ada');
  });

  it('logs out', async () => {
    api.loadSession.mockResolvedValue({ ...user, isLocalSession: true });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('user:Emily'));

    await act(() => auth.logout());
    expect(api.logout).toHaveBeenCalled();
    expect(screen.getByTestId('state')).toHaveTextContent('guest');
  });
});
