/**
 * Integration tests for the API service layer with a mocked axios.
 * Each axios.create() call returns a fake client we can drive, including the
 * interceptors that authApi registers.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser } from '@/types/auth';

interface FakeClient {
  (config: unknown): Promise<unknown>;
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
  requestInterceptor?: (config: { headers: Record<string, string>; url?: string }) => unknown;
  responseErrorInterceptor?: (error: unknown) => Promise<unknown>;
  interceptors: {
    request: { use: jest.Mock };
    response: { use: jest.Mock };
  };
}

type ClientRegistry = Record<string, FakeClient[]>;

/**
 * Fake clients by baseURL. Kept on globalThis because module imports are hoisted
 * above this file's top-level code, so the services call axios.create() first.
 */
function mockRegistry(): ClientRegistry {
  const holder = globalThis as { mockAxiosClients?: ClientRegistry };
  holder.mockAxiosClients ??= {};
  return holder.mockAxiosClients;
}

const mockClients = mockRegistry();

jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  const create = jest.fn((config: { baseURL: string }) => {
    const registry = mockRegistry();
    const client = jest.fn(() => Promise.resolve({ data: 'retried' })) as unknown as FakeClient;
    client.get = jest.fn();
    client.post = jest.fn();
    client.put = jest.fn();
    client.delete = jest.fn();
    client.interceptors = {
      request: { use: jest.fn((onFulfilled) => (client.requestInterceptor = onFulfilled)) },
      response: { use: jest.fn((_ok, onRejected) => (client.responseErrorInterceptor = onRejected)) },
    };
    (registry[config.baseURL] ??= []).push(client);
    return client;
  });
  return {
    __esModule: true,
    ...actual,
    default: { ...actual.default, create, isAxiosError: actual.isAxiosError },
    isAxiosError: actual.isAxiosError,
  };
});

// Imported after the mock so they receive fake clients
// eslint-disable-next-line import/first
import { AuthApiService } from '@/services/authApi';
// eslint-disable-next-line import/first
import { productApi } from '@/services/productApi';
// eslint-disable-next-line import/first
import { userApi } from '@/services/userApi';

const AUTH_URL = 'https://dummyjson.com/auth';

const apiError = (status: number, message = 'Request failed') =>
  Object.assign(new Error(message), { isAxiosError: true, response: { status, data: { message } }, config: {} });

const loginPayload = {
  id: 1,
  username: 'emilys',
  email: 'emily@example.com',
  firstName: 'Emily',
  lastName: 'Johnson',
  gender: 'female',
  image: 'img.png',
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
};

/** A fresh service plus its two fake clients (main client, refresh client). */
function createAuthService() {
  const service = new AuthApiService();
  const clients = mockClients[AUTH_URL];
  const [client, refreshClient] = clients.slice(-2);
  return { service, client, refreshClient };
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('authApi', () => {
  it('normalizes accessToken to token on login and persists the session', async () => {
    const { service, client } = createAuthService();
    client.post.mockResolvedValue({ data: loginPayload });

    const user = await service.login({ username: 'emilys', password: 'emilyspass' });

    expect(client.post).toHaveBeenCalledWith('/login', expect.objectContaining({ username: 'emilys', expiresInMins: 60 }));
    expect(user.token).toBe('access-1');
    expect(user).not.toHaveProperty('accessToken');
    expect(service.hasValidTokens()).toBe(true);
    expect(JSON.parse((await AsyncStorage.getItem('auth_user')) ?? '{}').token).toBe('access-1');
  });

  it('adds the bearer token to requests', async () => {
    const { service, client } = createAuthService();
    client.post.mockResolvedValue({ data: loginPayload });
    await service.login({ username: 'emilys', password: 'x' });

    const config = { headers: {} as Record<string, string> };
    client.requestInterceptor?.(config);
    expect(config.headers.Authorization).toBe('Bearer access-1');
  });

  it('refreshes the token on 401 and retries the request', async () => {
    const { service, client, refreshClient } = createAuthService();
    client.post.mockResolvedValue({ data: loginPayload });
    await service.login({ username: 'emilys', password: 'x' });
    refreshClient.post.mockResolvedValue({ data: { accessToken: 'access-2', refreshToken: 'refresh-2' } });

    const originalRequest = { url: '/me', headers: {} as Record<string, string> };
    const result = await client.responseErrorInterceptor?.({ ...apiError(401), config: originalRequest });

    expect(refreshClient.post).toHaveBeenCalledWith('/refresh', { refreshToken: 'refresh-1', expiresInMins: 60 });
    expect(originalRequest.headers.Authorization).toBe('Bearer access-2');
    expect(result).toEqual({ data: 'retried' });
    expect(service.getStoredUser()?.token).toBe('access-2');
  });

  it('ends the session and notifies listeners when refresh fails', async () => {
    const { service, client, refreshClient } = createAuthService();
    client.post.mockResolvedValue({ data: loginPayload });
    await service.login({ username: 'emilys', password: 'x' });
    refreshClient.post.mockRejectedValue(apiError(401));
    const onExpired = jest.fn();
    const unsubscribe = service.onSessionExpired(onExpired);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(
      client.responseErrorInterceptor?.({ ...apiError(401), config: { url: '/me', headers: {} } })
    ).rejects.toBeDefined();

    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(service.getStoredUser()).toBeNull();
    expect(await AsyncStorage.getItem('auth_user')).toBeNull();
    unsubscribe();
    warn.mockRestore();
  });

  it('does not try to refresh a failed login', async () => {
    const { client, refreshClient } = createAuthService();
    const error = { ...apiError(401), config: { url: '/login', headers: {} } };
    await expect(client.responseErrorInterceptor?.(error)).rejects.toBe(error);
    expect(refreshClient.post).not.toHaveBeenCalled();
  });

  it('starts a device-only session when DummyJSON rejects the new user', async () => {
    const { service, client, refreshClient } = createAuthService();
    refreshClient.post.mockResolvedValue({ data: { id: 209, image: '' } });
    client.post.mockRejectedValue(apiError(400, 'Invalid credentials'));

    const user = await service.register({
      firstName: 'Ada',
      lastName: 'Lovelace',
      username: 'ada',
      password: 'secret1',
      email: 'ada@example.com',
    });

    expect(refreshClient.post).toHaveBeenCalledWith('https://dummyjson.com/users/add', expect.objectContaining({ username: 'ada' }));
    expect(user).toMatchObject({ id: 209, firstName: 'Ada', isLocalSession: true, token: '' });
    expect(service.hasValidTokens()).toBe(false);
  });

  it('returns the real session when login after registration succeeds', async () => {
    const { service, client, refreshClient } = createAuthService();
    refreshClient.post.mockResolvedValue({ data: { id: 1 } });
    client.post.mockResolvedValue({ data: loginPayload });

    const user = await service.register({
      firstName: 'Emily',
      lastName: 'Johnson',
      username: 'emilys',
      password: 'emilyspass',
      email: 'emily@example.com',
    });
    expect(user.isLocalSession).toBeUndefined();
    expect(user.token).toBe('access-1');
  });

  it('loads, reads and clears the stored session', async () => {
    const stored: AuthUser = { ...loginPayload, gender: 'female', token: 't', refreshToken: 'r' };
    await AsyncStorage.setItem('auth_user', JSON.stringify(stored));
    const { service, client } = createAuthService();

    expect(await service.loadSession()).toMatchObject({ token: 't' });
    client.get.mockResolvedValue({ data: { id: 1, firstName: 'Emily' } });
    expect(await service.getMe()).toMatchObject({ firstName: 'Emily' });

    await service.logout();
    expect(service.getStoredUser()).toBeNull();
  });
});

describe('productApi', () => {
  const client = () => mockClients['https://dummyjson.com'][0];

  it('calls the product endpoints with the right paths and params', async () => {
    client().get.mockResolvedValue({ data: { products: [], total: 0, skip: 0, limit: 20 } });

    await productApi.getProducts({ limit: 20, skip: 40 });
    expect(client().get).toHaveBeenLastCalledWith('/products', { params: { limit: 20, skip: 40 } });

    await productApi.searchProducts('phone', { sortBy: 'price', order: 'asc' });
    expect(client().get).toHaveBeenLastCalledWith('/products/search', {
      params: { sortBy: 'price', order: 'asc', q: 'phone' },
    });

    await productApi.getProductsByCategory('home-decoration');
    expect(client().get).toHaveBeenLastCalledWith('/products/category/home-decoration', { params: {} });

    await productApi.getProductById(7);
    expect(client().get).toHaveBeenLastCalledWith('/products/7');

    await productApi.getCategories();
    expect(client().get).toHaveBeenLastCalledWith('/products/categories');
  });

  it('counts products per category from one request', async () => {
    client().get.mockResolvedValue({
      data: { products: [{ id: 1, category: 'beauty' }, { id: 2, category: 'beauty' }, { id: 3, category: 'laptops' }] },
    });
    expect(await productApi.getCategoryCounts()).toEqual({ beauty: 2, laptops: 1 });
    expect(client().get).toHaveBeenLastCalledWith('/products', { params: { limit: 0, select: 'category' } });
  });

  it('calls the cart endpoints', async () => {
    client().get.mockResolvedValue({ data: { carts: [], total: 0 } });
    client().post.mockResolvedValue({ data: { id: 51 } });
    client().put.mockResolvedValue({ data: { id: 1 } });
    client().delete.mockResolvedValue({ data: { isDeleted: true } });

    await productApi.getUserCarts(1);
    expect(client().get).toHaveBeenLastCalledWith('/carts/user/1');
    await productApi.getCartById(3);
    expect(client().get).toHaveBeenLastCalledWith('/carts/3');
    await productApi.addCart({ userId: 1, products: [{ id: 1, quantity: 2 }] });
    expect(client().post).toHaveBeenLastCalledWith('/carts/add', { userId: 1, products: [{ id: 1, quantity: 2 }] });
    await productApi.updateCart(1, [{ id: 1, quantity: 1 }]);
    expect(client().put).toHaveBeenLastCalledWith('/carts/1', { products: [{ id: 1, quantity: 1 }], merge: true });
    expect(await productApi.deleteCart(1)).toEqual({ isDeleted: true });
  });
});

describe('userApi', () => {
  it('updates a user with PUT /users/{id}', async () => {
    const client = mockClients['https://dummyjson.com/users'][0];
    client.put.mockResolvedValue({ data: { id: 1, firstName: 'Em' } });
    expect(await userApi.updateUser(1, { firstName: 'Em' })).toMatchObject({ firstName: 'Em' });
    expect(client.put).toHaveBeenCalledWith('/1', { firstName: 'Em' });
  });
});
