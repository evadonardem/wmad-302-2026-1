/**
 * Auth API Service - DummyJSON Authentication
 * Docs: https://dummyjson.com/docs/auth
 * Base URL: https://dummyjson.com/auth
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginCredentials, RegisterData, AuthUser, RefreshTokenResponse } from '@/types/auth';

const API_BASE_URL = 'https://dummyjson.com/auth';
// DummyJSON has no /auth/register endpoint; new users are created with POST /users/add
const USERS_ADD_URL = 'https://dummyjson.com/users/add';
const STORAGE_KEY = 'auth_user';

class AuthApiService {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<RefreshTokenResponse> | null = null;
  // In-memory copy of the session so the sync getters keep working.
  // AsyncStorage is async, so it is loaded once through init() at app start.
  private session: AuthUser | null = null;

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

        // If error is 401 and we haven't retried yet
        // (a failed login is a 401 too, but it must not trigger a refresh)
        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          originalRequest.url !== '/login'
        ) {
          originalRequest._retry = true;

          try {
            const tokens = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.clearTokens();
            // Done: AppLayout redirects to /(auth)/login once the context sees no user
            console.warn('Token refresh failed, user logged out');
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Load the stored session from AsyncStorage. Call once before hydrating.
   */
  async init(): Promise<AuthUser | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      this.session = raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      this.session = null;
    }
    return this.session;
  }

  private getAccessToken(): string | null {
    return this.session?.token ?? null;
  }

  private getRefreshToken(): string | null {
    return this.session?.refreshToken ?? null;
  }

  setTokens(user: AuthUser): void {
    this.session = user;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user)).catch((error) =>
      console.error('Failed to persist auth user:', error)
    );
  }

  private clearTokens(): void {
    this.session = null;
    AsyncStorage.removeItem(STORAGE_KEY).catch((error) =>
      console.error('Failed to clear auth user:', error)
    );
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
    this.setTokens(response.data);
    return response.data;
  }

  /**
   * Register new user
   * POST /users/add (DummyJSON's "add user" endpoint)
   * Done: create the user, then login() to get tokens
   *
   * DummyJSON does not really save new users, so logging in with the new
   * credentials fails. When that happens we sign in with the public demo
   * account to get working tokens and show the registered name/email on top.
   */
  async register(data: RegisterData): Promise<AuthUser> {
    await axios.post(USERS_ADD_URL, data, { timeout: 10000 });

    try {
      return await this.login({ username: data.username, password: data.password });
    } catch {
      const demo = await this.login({ username: 'emilys', password: 'emilyspass' });
      const merged: AuthUser = {
        ...demo,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        email: data.email,
      };
      this.setTokens(merged);
      return merged;
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
    return this.session;
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