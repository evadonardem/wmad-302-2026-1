/**
 * Auth API Service - DummyJSON Authentication
 * Docs: https://dummyjson.com/docs/auth
 * Base URL: https://dummyjson.com/auth
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
import { getStorageItem, setStorageItem, removeStorageItem } from '@/utils/storage';
import { LoginCredentials, RegisterData, AuthUser, RefreshTokenResponse } from '@/types/auth';

const API_BASE_URL = 'https://dummyjson.com/auth';
const AUTH_STORAGE_KEY = 'auth_user';

/** POST /auth/login returns the user with "accessToken" (older code/tests use "token") */
type LoginResponse = Omit<AuthUser, 'token'> & { accessToken?: string; token?: string };

class AuthApiService {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<RefreshTokenResponse> | null = null;
  /**
   * In-memory copy of the stored user. AsyncStorage is async, so we load it once
   * with loadStoredUser() at app start and keep it in sync on every change.
   * This lets the token getters stay synchronous (needed by the axios interceptor).
   */
  private currentUser: AuthUser | null = null;

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
        const url: string = originalRequest?.url ?? '';
        // A 401 from login/refresh themselves must not trigger another refresh
        // (refreshing from inside the refresh request would wait on itself forever)
        const isAuthRequest = url.includes('/login') || url.includes('/refresh');

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest) {
          originalRequest._retry = true;

          try {
            const tokens = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.clearTokens();
            // TODO: Student to implement navigation redirect to login
            router.replace('/(auth)/login');
            console.warn('Token refresh failed, user logged out');
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getAccessToken(): string | null {
    return this.currentUser?.token || null;
  }

  private getRefreshToken(): string | null {
    return this.currentUser?.refreshToken || null;
  }

  setTokens(user: AuthUser): void {
    this.currentUser = user;
    setStorageItem(AUTH_STORAGE_KEY, user).catch((err) =>
      console.error('Failed to save auth user:', err)
    );
  }

  private clearTokens(): void {
    this.currentUser = null;
    removeStorageItem(AUTH_STORAGE_KEY);
  }

  /**
   * Login user with username/email and password
   * POST /auth/login
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const response = await this.client.post<LoginResponse>('/login', {
      username: credentials.username,
      password: credentials.password,
      expiresInMins: credentials.expiresInMins || 60,
    });
    // DummyJSON sends the access token as "accessToken"; the app keeps it as "token"
    const { accessToken, ...rest } = response.data;
    const user: AuthUser = { ...rest, token: accessToken ?? rest.token ?? '' };
    this.setTokens(user);
    return user;
  }

  /**
   * Register new user
   * POST /auth/register
   * TODO: Students to complete this implementation
   */
  async register(data: RegisterData): Promise<AuthUser> {
    // TODO: Student implementation
    // 1. Call POST /auth/register with data
    // 2. On success, call login() to get tokens
    // 3. Return user with tokens
    // NOTE: DummyJSON has no /auth/register endpoint, so we use the documented
    // POST /users/add instead. It is simulated: the new user is NOT saved, so
    // logging in with it fails. In that case we keep the created user in storage
    // without tokens so the session still works until logout/app restart.
    const created = await this.client.post<Omit<AuthUser, 'token' | 'refreshToken'>>(
      'https://dummyjson.com/users/add',
      data
    );
    try {
      return await this.login({ username: data.username, password: data.password });
    } catch {
      const user: AuthUser = { ...created.data, token: '', refreshToken: '' };
      this.setTokens(user);
      return user;
    }
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
    // Prevent multiple simultaneous refresh calls
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
        // Update stored tokens with new ones
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
    return this.currentUser;
  }

  /**
   * Load the saved user from AsyncStorage into memory.
   * Call once on app start (AuthContext hydration) before reading tokens.
   */
  async loadStoredUser(): Promise<AuthUser | null> {
    this.currentUser = await getStorageItem<AuthUser>(AUTH_STORAGE_KEY);
    return this.currentUser;
  }

  /**
   * Logout - clear local tokens
   * Note: DummyJSON doesn't have a logout endpoint, so this is client-side only
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

// Export singleton instance
export const authApi = new AuthApiService();

// Export class for testing
export { AuthApiService };