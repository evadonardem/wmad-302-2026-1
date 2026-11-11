/**
 * Auth API Service - DummyJSON Authentication
 * Docs: https://dummyjson.com/docs/auth
 * Base URL: https://dummyjson.com/auth
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { LoginCredentials, RegisterData, AuthResponse, AuthProfile, AuthUser, RefreshTokenResponse } from '@/types/auth';
import { authStorage } from '@/utils/storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_AUTH_API_URL?.trim() || 'https://dummyjson.com/auth';
const hasCustomAuthApi = Boolean(process.env.EXPO_PUBLIC_AUTH_API_URL?.trim());

class AuthApiService {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<RefreshTokenResponse> | null = null;
  private sessionExpiredHandler: (() => void) | null = null;

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
        const token = await this.getAccessToken();
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

        // If error is 401 and we haven't retried yet
        if (
          error.response?.status === 401
          && originalRequest
          && !originalRequest._retry
          && !['/login', '/refresh'].includes(originalRequest.url || '')
        ) {
          originalRequest._retry = true;

          try {
            const tokens = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            await this.clearTokens();
            this.sessionExpiredHandler?.();
            console.warn('Token refresh failed, user logged out');
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async getAccessToken(): Promise<string | null> {
    return (await authStorage.getUser())?.token ?? null;
  }

  private async getRefreshToken(): Promise<string | null> {
    return (await authStorage.getUser())?.refreshToken ?? null;
  }

  async setTokens(user: AuthUser): Promise<void> {
    await authStorage.setUser(user);
  }

  setSessionExpiredHandler(handler: () => void): () => void {
    this.sessionExpiredHandler = handler;
    return () => {
      if (this.sessionExpiredHandler === handler) this.sessionExpiredHandler = null;
    };
  }

  private async clearTokens(): Promise<void> {
    await authStorage.clearUser();
  }

  /**
   * Login user with username/email and password
   * POST /auth/login
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const response = await this.client.post<AuthResponse>('/login', {
      username: credentials.username,
      password: credentials.password,
      expiresInMins: credentials.expiresInMins || 60,
    });
    const user = this.normalizeUser(response.data);
    await this.setTokens(user);
    return user;
  }

  /** Registration is enabled only for a configured API that supports POST /register. */
  async register(data: RegisterData): Promise<AuthUser> {
    if (!hasCustomAuthApi) {
      throw new Error('DummyJSON does not support account registration. Configure EXPO_PUBLIC_AUTH_API_URL with an auth API that implements POST /register.');
    }
    const response = await this.client.post<AuthResponse>('/register', data);
    const user = this.normalizeUser(response.data);
    await this.setTokens(user);
    return user;
  }

  /**
   * Get current user profile (requires valid token)
   * GET /auth/me
   */
  async getMe(): Promise<AuthProfile> {
    const response = await this.client.get<AuthProfile>('/me');
    return response.data;
  }

  private normalizeUser(response: AuthResponse): AuthUser {
    const token = response.token ?? response.accessToken;
    if (!token || !response.refreshToken) {
      throw new Error('The authentication server returned an incomplete session.');
    }
    return {
      id: response.id,
      username: response.username,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      gender: response.gender,
      image: response.image,
      token,
      refreshToken: response.refreshToken,
    };
  }

  async updateProfile(
    id: number,
    profile: Pick<AuthUser, 'firstName' | 'lastName' | 'email'>
  ): Promise<AuthUser> {
    const response = await axios.put<Partial<AuthUser>>(`https://dummyjson.com/users/${id}`, profile, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
    const currentUser = await this.getStoredUser();
    if (!currentUser) throw new Error('Your session has expired. Please sign in again.');
    const updatedUser = { ...currentUser, ...response.data, ...profile };
    await this.setTokens(updatedUser);
    return updatedUser;
  }

  /**
   * Refresh access token using refresh token
   * POST /auth/refresh
   */
  async refreshAccessToken(): Promise<RefreshTokenResponse> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = (async () => {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token available');

      try {
        const response = await this.client.post<RefreshTokenResponse>('/refresh', {
          refreshToken,
          expiresInMins: 60,
        });
        const currentUser = await this.getStoredUser();
        if (currentUser) {
          await this.setTokens({
            ...currentUser,
            token: response.data.accessToken,
            refreshToken: response.data.refreshToken,
          });
        }
        return response.data;
      } catch (error) {
        await this.clearTokens();
        throw error;
      }
    })()
      .finally(() => {
        this.refreshTokenPromise = null;
      });

    return this.refreshTokenPromise;
  }

  /**
   * Get stored user data
   */
  getStoredUser(): Promise<AuthUser | null> {
    return authStorage.getUser();
  }

  /**
   * Logout - clear local tokens
   * Note: DummyJSON doesn't have a logout endpoint, so this is client-side only
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