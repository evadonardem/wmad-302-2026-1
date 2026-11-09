
/**
 * Auth API Service - DummyJSON Authentication
 * Docs: https://dummyjson.com/docs/auth
 * Base URL: https://dummyjson.com/auth
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
  private refreshTokenPromise: Promise<RefreshTokenResponse> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
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

    // Response interceptor for token refresh
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

            console.warn('Token refresh failed, user logged out');

            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async getAccessToken(): Promise<string | null> {
    const user = await authStorage.getUser();
    return user?.token || null;
  }

  private async getRefreshToken(): Promise<string | null> {
    const user = await authStorage.getUser();
    return user?.refreshToken || null;
  }

  private async setTokens(user: AuthUser): Promise<void> {
    await authStorage.setUser(user);
  }

  private async clearTokens(): Promise<void> {
    await authStorage.clearUser();
  }

  /**
   * Login user with username/email and password
   * POST /auth/login
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const response = await this.client.post<AuthUser>('/login', {
      username: credentials.username,
      password: credentials.password,
      expiresInMins: credentials.expiresInMins || 60,
    });

    await this.setTokens(response.data);

    return response.data;
  }

  /**
   * Register new user
   * POST /auth/register
   * TODO: Student implementation
   */
  async register(data: RegisterData): Promise<AuthUser> {
    // TODO: Implement registration.
    // 1. Call POST /users/add with registration data.
    // 2. On success, call login() to get tokens.
    // 3. Return user with tokens.
    void data;

    throw new Error('TODO: Implement register');
  }

  /**
   * Get current user profile
   * GET /auth/me
   */
  async getMe(): Promise<AuthUser> {
    const response = await this.client.get<AuthUser>('/me');
    return response.data;
  }

  /**
   * Refresh access token using refresh token
   * POST /auth/refresh
   */
  async refreshAccessToken(): Promise<RefreshTokenResponse> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    const refreshToken = await this.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshTokenPromise = this.client
      .post<RefreshTokenResponse>('/refresh', {
        refreshToken,
        expiresInMins: 60,
      })
      .then(async (response) => {
        const currentUser = await this.getStoredUser();

        if (currentUser) {
          const updatedUser: AuthUser = {
            ...currentUser,
            token: response.data.accessToken,
            refreshToken: response.data.refreshToken,
          };

          await this.setTokens(updatedUser);
        }

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
   * Get stored user data
   */
  async getStoredUser(): Promise<AuthUser | null> {
    return (await authStorage.getUser()) as AuthUser | null;
  }

  /**
   * Logout - clear local tokens
   */
  async logout(): Promise<void> {
    await this.clearTokens();
  }

  /**
   * Check if user has valid tokens stored
   */
  async hasValidTokens(): Promise<boolean> {
    const user = await this.getStoredUser();

    return !!(user?.token && user?.refreshToken);
  }
}

// Export singleton instance
export const authApi = new AuthApiService();

// Export class for testing
export { AuthApiService };
