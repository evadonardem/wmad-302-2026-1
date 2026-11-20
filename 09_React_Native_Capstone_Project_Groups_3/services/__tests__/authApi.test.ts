/**
 * Integration tests for the auth service: login, register, token storage,
 * and the 401 -> refresh token -> retry / redirect-to-login flow.
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { authApi } from '../authApi';
import { AuthUser } from '@/types/auth';

jest.mock('axios', () => {
  const mockClient = Object.assign(jest.fn(), {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  });
  return { __esModule: true, default: { create: jest.fn(() => mockClient), isAxiosError: jest.fn() } };
});

interface MockClient extends jest.Mock {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  interceptors: { request: { use: jest.Mock }; response: { use: jest.Mock } };
}

type RequestConfig = { headers: Record<string, string>; _retry?: boolean };

const client = (axios.create as jest.Mock).mock.results[0].value as MockClient;
const onRequest = client.interceptors.request.use.mock.calls[0][0] as (config: RequestConfig) => RequestConfig;
const onResponseError = client.interceptors.response.use.mock.calls[0][1] as (error: unknown) => Promise<unknown>;

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const user: AuthUser = {
  id: 1,
  username: 'emilys',
  email: 'emily@example.com',
  firstName: 'Emily',
  lastName: 'Johnson',
  gender: 'female',
  image: 'https://example.com/emily.png',
  token: 'access',
  refreshToken: 'refresh',
};

beforeEach(async () => {
  client.mockReset();
  client.get.mockReset();
  client.post.mockReset();
  (router.replace as jest.Mock).mockClear();
  authApi.logout();
  await AsyncStorage.clear();
});

describe('authApi.login', () => {
  it('posts the credentials and saves the user with tokens', async () => {
    client.post.mockResolvedValueOnce({ data: user });

    const result = await authApi.login({ username: 'emilys', password: 'emilyspass' });

    expect(client.post).toHaveBeenCalledWith('/login', {
      username: 'emilys',
      password: 'emilyspass',
      expiresInMins: 60,
    });
    expect(result).toEqual(user);
    expect(authApi.getStoredUser()).toEqual(user);
    expect(authApi.hasValidTokens()).toBe(true);

    await flush();
    expect(JSON.parse((await AsyncStorage.getItem('auth_user')) ?? 'null')).toEqual(user);
  });

  it('passes errors from the server on to the caller', async () => {
    client.post.mockRejectedValueOnce(new Error('Invalid credentials'));
    await expect(authApi.login({ username: 'x', password: 'y' })).rejects.toThrow('Invalid credentials');
    expect(authApi.getStoredUser()).toBeNull();
  });
});

describe('authApi.loadStoredUser / logout', () => {
  it('restores the saved user from AsyncStorage on app start', async () => {
    await AsyncStorage.setItem('auth_user', JSON.stringify(user));
    expect(await authApi.loadStoredUser()).toEqual(user);
    expect(authApi.getStoredUser()).toEqual(user);
  });

  it('logout clears tokens from memory and storage', async () => {
    authApi.setTokens(user);
    await flush();
    authApi.logout();
    await flush();
    expect(authApi.getStoredUser()).toBeNull();
    expect(authApi.hasValidTokens()).toBe(false);
    expect(await AsyncStorage.getItem('auth_user')).toBeNull();
  });
});

describe('authApi.register', () => {
  const newUser = {
    firstName: 'Fabro',
    lastName: 'Cruz',
    username: 'fabro',
    password: 'secret1',
    email: 'fabro@example.com',
  };

  it('creates the user and then logs in', async () => {
    client.post.mockImplementation((url: string) =>
      url === '/login'
        ? Promise.resolve({ data: { ...user, username: 'fabro' } })
        : Promise.resolve({ data: { id: 209, ...newUser } })
    );

    const result = await authApi.register(newUser);

    expect(client.post).toHaveBeenCalledWith('https://dummyjson.com/users/add', newUser);
    expect(result.username).toBe('fabro');
    expect(result.token).toBe('access');
  });

  it('keeps a local session when DummyJSON cannot log the new user in', async () => {
    client.post.mockImplementation((url: string) =>
      url === '/login'
        ? Promise.reject(new Error('Invalid credentials'))
        : Promise.resolve({ data: { id: 209, ...newUser } })
    );

    const result = await authApi.register(newUser);

    expect(result.id).toBe(209);
    expect(result.token).toBe('');
    expect(authApi.getStoredUser()?.username).toBe('fabro');
  });
});

describe('authApi interceptors and token refresh', () => {
  it('adds the Bearer token to requests', () => {
    authApi.setTokens(user);
    expect(onRequest({ headers: {} }).headers.Authorization).toBe('Bearer access');
  });

  it('sends requests without a token when logged out', () => {
    expect(onRequest({ headers: {} }).headers.Authorization).toBeUndefined();
  });

  it('on 401, refreshes the token and retries the request', async () => {
    authApi.setTokens(user);
    client.post.mockResolvedValueOnce({ data: { ...user, accessToken: 'new-access', refreshToken: 'new-refresh' } });
    client.mockResolvedValueOnce({ data: 'retried' });

    const result = await onResponseError({ response: { status: 401 }, config: { headers: {} } });

    expect(client.post).toHaveBeenCalledWith('/refresh', { refreshToken: 'refresh', expiresInMins: 60 });
    expect(client).toHaveBeenCalledWith(
      expect.objectContaining({ _retry: true, headers: { Authorization: 'Bearer new-access' } })
    );
    expect(result).toEqual({ data: 'retried' });
    expect(authApi.getStoredUser()?.token).toBe('new-access');
    expect(authApi.getStoredUser()?.refreshToken).toBe('new-refresh');
  });

  it('logs out and redirects to login when the refresh fails', async () => {
    authApi.setTokens(user);
    client.post.mockRejectedValueOnce(new Error('Refresh expired'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(onResponseError({ response: { status: 401 }, config: { headers: {} } })).rejects.toThrow(
      'Refresh expired'
    );

    expect(authApi.getStoredUser()).toBeNull();
    expect(router.replace).toHaveBeenCalledWith('/(auth)/login');
    warn.mockRestore();
  });

  it('does not retry the same request twice', async () => {
    const error = { response: { status: 401 }, config: { headers: {}, _retry: true } };
    await expect(onResponseError(error)).rejects.toBe(error);
    expect(client.post).not.toHaveBeenCalled();
  });

  it('passes other errors straight through', async () => {
    const error = { response: { status: 500 }, config: { headers: {} } };
    await expect(onResponseError(error)).rejects.toBe(error);
    expect(client.post).not.toHaveBeenCalled();
  });

  it('refuses to refresh without a refresh token', async () => {
    await expect(authApi.refreshAccessToken()).rejects.toThrow('No refresh token available');
  });

  it('getMe fetches the current user', async () => {
    client.get.mockResolvedValueOnce({ data: user });
    expect(await authApi.getMe()).toEqual(user);
    expect(client.get).toHaveBeenCalledWith('/me');
  });
});
