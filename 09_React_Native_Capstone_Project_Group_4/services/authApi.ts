/**
 * Auth API Service - DummyJSON Authentication
 * Docs: https://dummyjson.com/docs/auth
 * Base URL: https://dummyjson.com/auth
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
import { LoginCredentials, RegisterData, AuthUser, RefreshTokenResponse } from '@/types/auth';

const API_BASE_URL = 'https://dummyjson.com/auth';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

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
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();
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
      async (error: AxiosError) => {
        const originalRequest = error.config as RetryableRequestConfig | undefined;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const tokens = await this.refreshAccessToken();
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            this.clearTokens();
            router.replace('/(auth)/login');
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getAccessToken(): string | null {
    try {
      const userData = localStorage.getItem('auth_user');
      if (userData) {
        const user = JSON.parse(userData) as Partial<AuthUser> & { accessToken?: string };
        return user.token || user.accessToken || null;
      }
    } catch {
      return null;
    }
    return null;
  }

  private getRefreshToken(): string | null {
    try {
      const userData = localStorage.getItem('auth_user');
      if (userData) {
        const user = JSON.parse(userData) as Partial<AuthUser>;
        return user.refreshToken || null;
      }
    } catch {
      return null;
    }
    return null;
  }

  setTokens(user: AuthUser): void {
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  private clearTokens(): void {
    localStorage.removeItem('auth_user');
  }

  /**
   * Login user with username/email and password
   * POST /auth/login
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const response = await this.client.post<AuthUser & { accessToken?: string }>('/login', {
      username: credentials.username,
      password: credentials.password,
      expiresInMins: credentials.expiresInMins || 60,
    });

    const normalizedUser: AuthUser = {
      ...response.data,
      token: response.data.token || response.data.accessToken || '',
    };

    this.setTokens(normalizedUser);
    return normalizedUser;
  }

  /**
   * Register new user
   * Calls DummyJSON /users/add (simulated registration) and establishes an authenticated session
   */
  async register(data: RegisterData): Promise<AuthUser> {
    const response = await axios.post<Partial<AuthUser> & { id: number }>(
      'https://dummyjson.com/users/add',
      data,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    const created = response.data;
    const authenticatedUser: AuthUser = {
      id: created.id || Date.now(),
      username: created.username || data.username,
      email: created.email || data.email,
      firstName: created.firstName || data.firstName,
      lastName: created.lastName || data.lastName,
      gender: created.gender || data.gender || 'male',
      image: created.image || `https://dummyjson.com/icon/${encodeURIComponent(data.username)}/128`,
      token: created.token || `simulated-access-token-${Date.now()}`,
      refreshToken: created.refreshToken || `simulated-refresh-token-${Date.now()}`,
    };

    this.setTokens(authenticatedUser);
    return authenticatedUser;
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
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshTokenPromise = this.client
      .post<RefreshTokenResponse>('/refresh', {
        refreshToken,
        expiresInMins: 60,
      })
      .then((response) => {
        const currentUser = this.getStoredUser();
        if (currentUser) {
          const updatedUser: AuthUser = {
            ...currentUser,
            token: response.data.accessToken,
            refreshToken: response.data.refreshToken,
          };
          this.setTokens(updatedUser);
        }
        return response.data;
      })
      .catch((error) => {
        this.clearTokens();
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
  getStoredUser(): AuthUser | null {
    try {
      const userData = localStorage.getItem('auth_user');
      return userData ? (JSON.parse(userData) as AuthUser) : null;
    } catch {
      return null;
    }
  }

  /**
   * Logout - clear local tokens
   */
  logout(): void {
    this.clearTokens();
  }

  /**
   * Check if user has valid tokens stored
   */
  hasValidTokens(): boolean {
    const user = this.getStoredUser();
    return !!(user?.token && user?.refreshToken);
  }
}

export const authApi = new AuthApiService();
export { AuthApiService };