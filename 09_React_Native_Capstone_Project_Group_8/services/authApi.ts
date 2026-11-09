
/**
 * Auth API Service - DummyJSON Authentication
 * Docs: https://dummyjson.com/docs/auth
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

    // Add the stored access token to requests.
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

    // Handle expired access tokens.
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

            console.warn('Token refresh failed. User logged out.');

            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Save authenticated user information.
  private async setTokens(user: AuthUser): Promise<void> {
    await authStorage.setUser(user);
  }

  // Remove stored authentication information.
  private async clearTokens(): Promise<void> {
    await authStorage.clearUser();
  }

  /**
   * Login user.
   * POST /auth/login
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      const response = await this.client.post<RefreshTokenResponse>(
        '/login',
        {
          username: credentials.username,
          password: credentials.password,
          expiresInMins: credentials.expiresInMins || 60,
        }
      );

      const apiUser = response.data;

      // Convert DummyJSON accessToken to the project's token property.
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
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Login failed. Please try again.'
        );
      }

      throw error;
    }
  }

  /**
   * Register new user.
   * POST https://dummyjson.com/users/add
   *
   * Important:
   * DummyJSON simulates user creation.
   * Newly created users are not permanently saved.
   */
  async register(data: RegisterData): Promise<void> {
    try {
      const response = await axios.post<{ id: number }>(
        'https://dummyjson.com/users/add',
        {
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username,
          password: data.password,
          email: data.email,
          age: data.age,
          gender: data.gender,
          image: data.image,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (!response.data || !response.data.id) {
        throw new Error('Registration failed. Please try again.');
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ||
          'Unable to create your account. Please try again.';

        throw new Error(message);
      }

      throw error;
    }
  }

  /**
   * Get current user profile.
   * GET /auth/me
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
   * Refresh access token.
   * POST /auth/refresh
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
   * Get stored user information.
   */
  async getStoredUser(): Promise<AuthUser | null> {
    return authStorage.getUser() as Promise<AuthUser | null>;
  }

  /**
   * Logout user.
   * Clears locally stored authentication information.
   */
  async logout(): Promise<void> {
    await this.clearTokens();
  }

  /**
   * Check whether authentication tokens exist.
   */
  async hasValidTokens(): Promise<boolean> {
    const user = await this.getStoredUser();

    return Boolean(user?.token && user?.refreshToken);
  }
}

// Export singleton instance.
export const authApi = new AuthApiService();

// Export class for testing.
export { AuthApiService };
