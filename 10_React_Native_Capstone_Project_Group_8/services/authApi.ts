
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

    // Request interceptor to add auth token.
    // AsyncStorage requires asynchronous access.
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await this.getAccessToken();

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor for token refresh.
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Do not retry a refresh request itself.
        const isRefreshRequest =
          typeof originalRequest?.url === 'string' &&
          originalRequest.url.includes('/refresh');

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !isRefreshRequest
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
      },
    );
  }

  private async getAccessToken(): Promise<string | null> {
    try {
      const user = await authStorage.getUser();
      return user?.token || null;
    } catch {
      return null;
    }
  }

  private async getRefreshToken(): Promise<string | null> {
    try {
      const user = await authStorage.getUser();
      return user?.refreshToken || null;
    } catch {
      return null;
    }
  }

  async setTokens(user: AuthUser): Promise<void> {
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
  async register(_data: RegisterData): Promise<AuthUser> {
    // TODO: Student implementation
    // 1. Call POST /auth/register with data
    // 2. On success, call login() to get tokens
    // 3. Return user with tokens
    throw new Error('TODO: Implement register - call /auth/register then login');
  }

  /**
   * Get current user profile (requires valid token)
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
    // Prevent multiple simultaneous refresh calls.
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
        // Update stored tokens with new ones.
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
    try {
      return await authStorage.getUser();
    } catch {
      return null;
    }
  }

  /**
   * Logout - clear local tokens
   * Note: DummyJSON doesn't have a logout endpoint, so this is client-side only.
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

// Export singleton instance.
export const authApi = new AuthApiService();

// Export class for testing.
export { AuthApiService };
