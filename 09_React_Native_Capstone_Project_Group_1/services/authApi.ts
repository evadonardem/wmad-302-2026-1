/**
 * Auth API Service
 * Supports local registration + DummyJSON login.
 */

import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';

import {
  LoginCredentials,
  RegisterData,
  AuthUser,
  RefreshTokenResponse,
} from '@/types/auth';

import {
  authStorage,
  localAccountsStorage,
} from '@/utils/storage';

const API_BASE_URL = 'https://dummyjson.com/auth';

class AuthApiService {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<RefreshTokenResponse> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const user = await authStorage.getUser();

        // Local accounts do not need a server token.
        if (user && !user.localAuth && user.token && config.headers) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }

        return config;
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;

          try {
            const tokens = await this.refreshAccessToken();

            originalRequest.headers.Authorization =
              `Bearer ${tokens.accessToken}`;

            return this.client(originalRequest);
          } catch (refreshError) {
            await this.clearTokens();
            console.warn('Token refresh failed. User logged out.');
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async setTokens(user: AuthUser): Promise<void> {
    await authStorage.setUser(user);
  }

  private async clearTokens(): Promise<void> {
    await authStorage.clearUser();
  }

  async getStoredUser(): Promise<AuthUser | null> {
    return authStorage.getUser();
  }

  /**
   * Register a new local account.
   * DummyJSON does not provide a registration endpoint.
   */
  async register(data: RegisterData): Promise<AuthUser> {
    const accounts = await localAccountsStorage.getAll();

    const usernameExists = accounts.some(
      (account) =>
        account.username.toLowerCase() === data.username.toLowerCase()
    );

    if (usernameExists) {
      throw new Error('Username is already registered.');
    }

    const emailExists = accounts.some(
      (account) =>
        account.email.toLowerCase() === data.email.toLowerCase()
    );

    if (emailExists) {
      throw new Error('Email is already registered.');
    }

    const newAccount = {
      ...data,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };

    await localAccountsStorage.save(newAccount);

    // Return a user-shaped object for the registration result.
    // This does not automatically log the user in.
    return {
      id: newAccount.id,
      username: newAccount.username,
      email: newAccount.email,
      firstName: newAccount.firstName,
      lastName: newAccount.lastName,
      gender: newAccount.gender ?? 'male',
      image: newAccount.image ?? '',
      token: '',
      refreshToken: '',
      localAuth: true,
    };
  }

  /**
   * Login using a local registered account or DummyJSON account.
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const identifier = credentials.username.trim().toLowerCase();
    const accounts = await localAccountsStorage.getAll();

    const localAccount = accounts.find(
      (account) =>
        account.username.toLowerCase() === identifier ||
        account.email.toLowerCase() === identifier
    );

    if (localAccount) {
      if (localAccount.password !== credentials.password) {
        throw new Error('Incorrect username/email or password.');
      }

      const user: AuthUser = {
        id: localAccount.id,
        username: localAccount.username,
        email: localAccount.email,
        firstName: localAccount.firstName,
        lastName: localAccount.lastName,
        gender: localAccount.gender ?? 'male',
        image: localAccount.image ?? '',
        token: `local-${localAccount.id}-${Date.now()}`,
        refreshToken: `local-refresh-${localAccount.id}`,
        localAuth: true,
      };

      await this.setTokens(user);
      return user;
    }

    // Fallback: existing DummyJSON test accounts.
    const response = await this.client.post<AuthUser>('/login', {
      username: credentials.username,
      password: credentials.password,
      expiresInMins: credentials.expiresInMins || 60,
    });

    const user: AuthUser = {
      ...response.data,
      token:
        response.data.token ||
        (response.data as AuthUser & { accessToken?: string }).accessToken ||
        '',
      localAuth: false,
    };

    await this.setTokens(user);
    return user;
  }

  /**
   * Get the current user profile.
   */
  async getMe(): Promise<AuthUser> {
    const storedUser = await this.getStoredUser();

    if (storedUser?.localAuth) {
      return storedUser;
    }

    const response = await this.client.get<AuthUser>('/me');

    return {
      ...response.data,
      token: storedUser?.token ?? response.data.token,
      refreshToken: storedUser?.refreshToken ?? response.data.refreshToken,
      localAuth: false,
    };
  }

  /**
   * Refresh a DummyJSON access token.
   */
  async refreshAccessToken(): Promise<RefreshTokenResponse> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    const currentUser = await this.getStoredUser();

    if (currentUser?.localAuth) {
      throw new Error('Local accounts do not require token refresh.');
    }

    if (!currentUser?.refreshToken) {
      throw new Error('No refresh token available.');
    }

    this.refreshTokenPromise = this.client
      .post<RefreshTokenResponse>('/refresh', {
        refreshToken: currentUser.refreshToken,
        expiresInMins: 60,
      })
      .then(async (response) => {
        const updatedUser: AuthUser = {
          ...currentUser,
          token: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        };

        await this.setTokens(updatedUser);
        return response.data;
      })
      .catch(async (error) => {
        await this.clearTokens();
        throw error;
      })
      .finally(() => {
        this.refreshTokenPromise = null;
      });

    return this.refreshTokenPromise;
  }

  async logout(): Promise<void> {
    await this.clearTokens();
  }

  async hasValidTokens(): Promise<boolean> {
    const user = await this.getStoredUser();
    return !!(user?.token && user?.refreshToken);
  }
}

export const authApi = new AuthApiService();

export { AuthApiService };