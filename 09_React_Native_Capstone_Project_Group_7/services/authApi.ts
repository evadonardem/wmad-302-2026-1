/**
 * Auth API Service - DummyJSON Authentication
 * Docs: https://dummyjson.com/docs/auth
 * Base URL: https://dummyjson.com/auth
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
import { LoginCredentials, RegisterData, AuthUser, RefreshTokenResponse } from '@/types/auth';

const API_BASE_URL = 'https://dummyjson.com/auth';
const USERS_BASE_URL = 'https://dummyjson.com/users';

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
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest?._retry) {
          originalRequest._retry = true;

          try {
            const tokens = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.clearTokens();
            try {
              router.replace('/(auth)/login');
            } catch {
              // Router not mounted yet
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getStorage(): Storage | null {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      return window.localStorage;
    }
    return null;
  }

  private getAccessToken(): string | null {
    try {
      const userData = this.getStorage()?.getItem('auth_user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.token || user.accessToken || null;
      }
    } catch {
      return null;
    }
    return null;
  }

  private getRefreshToken(): string | null {
    try {
      const userData = this.getStorage()?.getItem('auth_user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.refreshToken || null;
      }
    } catch {
      return null;
    }
    return null;
  }

  setTokens(user: AuthUser): void {
    this.getStorage()?.setItem('auth_user', JSON.stringify(user));
  }

  private clearTokens(): void {
    this.getStorage()?.removeItem('auth_user');
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

    const user: AuthUser = {
      ...response.data,
      token: response.data.token || response.data.accessToken || '',
    };

    this.setTokens(user);
    return user;
  }

  /**
   * Register new user
   * Calls DummyJSON /users/add and establishes authenticated session
   */
  async register(data: RegisterData): Promise<AuthUser> {
    const response = await axios.post<Partial<AuthUser>>(`${USERS_BASE_URL}/add`, {
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      email: data.email,
      password: data.password,
      age: data.age,
      gender: data.gender,
    });

    try {
      return await this.login({
        username: data.username,
        password: data.password,
      });
    } catch {
      const createdUser: AuthUser = {
        id: response.data.id || 1,
        username: response.data.username || data.username,
        email: response.data.email || data.email,
        firstName: response.data.firstName || data.firstName,
        lastName: response.data.lastName || data.lastName,
        gender: (response.data.gender as 'male' | 'female') || data.gender || 'male',
        image:
          response.data.image ||
          `https://dummyjson.com/icon/${encodeURIComponent(data.username)}/128`,
        token: `mock-access-token-${Date.now()}`,
        refreshToken: `mock-refresh-token-${Date.now()}`,
      };
      this.setTokens(createdUser);
      return createdUser;
    }
  }

  /**
   * Update user profile
   * PUT /users/{id}
   */
  async updateProfile(
    userId: number,
    updates: Partial<Pick<AuthUser, 'firstName' | 'lastName' | 'email' | 'username'>>
  ): Promise<AuthUser> {
    const response = await axios.put<Partial<AuthUser>>(`${USERS_BASE_URL}/${userId}`, updates, {
      headers: { 'Content-Type': 'application/json' },
    });

    const current = this.getStoredUser();
    const updatedUser: AuthUser = {
      ...(current as AuthUser),
      ...response.data,
      ...updates,
    };
    this.setTokens(updatedUser);
    return updatedUser;
  }

  /**
   * Get current user profile (requires valid token)
   * GET /auth/me
   */
  async getMe(): Promise<AuthUser> {
    const stored = this.getStoredUser();
    if (stored?.token?.startsWith('mock-access-token-')) {
      return stored;
    }
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
          const updatedUser = {
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
      const userData = this.getStorage()?.getItem('auth_user');
      return userData ? JSON.parse(userData) : null;
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
