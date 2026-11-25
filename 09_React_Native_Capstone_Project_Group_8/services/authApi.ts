
/**
 * Authentication API Service
 * Handles login, registration, token refresh, and user sessions.
 *
 * Newly registered accounts are saved locally using AsyncStorage.
 * Existing DummyJSON demo accounts can still log in through the API.
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

import { authStorage } from '@/utils/storage';

const API_BASE_URL = 'https://dummyjson.com/auth';

class AuthApiService {
  private client: AxiosInstance;

  private refreshTokenPromise: Promise<RefreshTokenResponse> | null =
    null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Attach the stored access token to API requests.
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const user = await authStorage.getUser();
        const token = user?.token;

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Handle expired tokens.
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const requestUrl = originalRequest?.url || '';

        const isAuthRequest =
          requestUrl.includes('/login') ||
          requestUrl.includes('/refresh');

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !isAuthRequest
        ) {
          originalRequest._retry = true;

          try {
            const tokens = await this.refreshAccessToken();

            originalRequest.headers.Authorization =
              `Bearer ${tokens.accessToken}`;

            return this.client(originalRequest);
          } catch (refreshError) {
            await this.clearTokens();

            console.warn(
              'Token refresh failed. User logged out.'
            );

            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async setTokens(user: AuthUser): Promise<void> {
    await authStorage.setUser(user);
  }

  private async clearTokens(): Promise<void> {
    await authStorage.clearUser();
  }

  /**
   * Login:
   * 1. Check locally registered accounts first.
   * 2. If no local account exists, use DummyJSON demo login.
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      // Check whether the username belongs to a local account.
      const localAccount = await authStorage.findLocalAccount(
        credentials.username
      );

      if (localAccount) {
        // Do not allow an incorrect local password to fall
        // through to the DummyJSON demo-account login.
        if (localAccount.password !== credentials.password) {
          throw new Error('Invalid username or password.');
        }

        const localUser: AuthUser = {
          id: localAccount.id,
          username: localAccount.username,
          email: localAccount.email,
          firstName: localAccount.firstName,
          lastName: localAccount.lastName,
          gender: localAccount.gender,
          image: '',
          token: `local-${localAccount.id}`,
          refreshToken: `local-${localAccount.id}`,
        };

        await this.setTokens(localUser);

        return localUser;
      }

      // No local account found. Continue with DummyJSON login.
      const response = await this.client.post<RefreshTokenResponse>(
        '/login',
        {
          username: credentials.username,
          password: credentials.password,
          expiresInMins: credentials.expiresInMins || 60,
        }
      );

      const apiUser = response.data;

      const user: AuthUser = {
        id: apiUser.id,
        username: apiUser.username,
        email: apiUser.email,
        firstName: apiUser.firstName,
        lastName: apiUser.lastName,
        gender: apiUser.gender,
        image: apiUser.image,
        token: apiUser.accessToken,
        refreshToken: apiUser.refreshToken,
      };

      await this.setTokens(user);

      return user;
    } catch (error) {
      if (error instanceof Error && !axios.isAxiosError(error)) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message ||
            'Login failed. Please try again.'
        );
      }

      throw error;
    }
  }

  /**
   * Register a new account locally.
   * DummyJSON's users/add endpoint does not permanently save accounts,
   * so AsyncStorage is used for this capstone prototype.
   */
  async register(data: RegisterData): Promise<void> {
    try {
      await authStorage.registerLocalAccount({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        username: data.username.trim(),
        password: data.password,
        email: data.email.trim(),
        age: data.age,
        gender: data.gender ?? 'male',
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error(
        'Unable to create your account. Please try again.'
      );
    }
  }

  /**
   * Get the currently authenticated DummyJSON user.
   */
  async getMe(): Promise<AuthUser> {
    const response = await this.client.get<
      Omit<AuthUser, 'token' | 'refreshToken'>
    >('/me');

    const storedUser = await this.getStoredUser();

    return {
      ...response.data,
      token: storedUser?.token || '',
      refreshToken: storedUser?.refreshToken || '',
    };
  }

  /**
   * Refresh the current DummyJSON access token.
   */
  async refreshAccessToken(): Promise<RefreshTokenResponse> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    const currentUser = await this.getStoredUser();
    const refreshToken = currentUser?.refreshToken;

    if (!refreshToken) {
      throw new Error('No refresh token available.');
    }

    this.refreshTokenPromise = this.client
      .post<RefreshTokenResponse>('/refresh', {
        refreshToken,
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

  /**
   * Get the stored authenticated user.
   */
  async getStoredUser(): Promise<AuthUser | null> {
    return authStorage.getUser() as Promise<AuthUser | null>;
  }

  /**
   * Log out the current user.
   * Locally registered accounts are not deleted.
   */
  async logout(): Promise<void> {
    await this.clearTokens();
  }

  /**
   * Check whether access and refresh tokens are stored.
   */
  async hasValidTokens(): Promise<boolean> {
    const user = await this.getStoredUser();

    return Boolean(user?.token && user?.refreshToken);
  }
}

export const authApi = new AuthApiService();

export { AuthApiService };
