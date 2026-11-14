/**
 * Auth API Service - DummyJSON Authentication
 * Docs: https://dummyjson.com/docs/auth
 * Base URL: https://dummyjson.com/auth
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginCredentials, RegisterData, AuthUser, RefreshTokenResponse } from '@/types/auth';

const API_BASE_URL = 'https://dummyjson.com/auth';
const USERS_API_URL = 'https://dummyjson.com/users';
const LOCAL_ACCOUNTS_KEY = 'local_auth_accounts';

interface LocalAccount {
  credentials: RegisterData;
  user: AuthUser;
}

class AuthApiService {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<RefreshTokenResponse> | null = null;
  private storedUser: AuthUser | null = null;

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
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const tokens = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.clearTokens();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getAccessToken(): string | null {
    return this.storedUser?.token || null;
  }

  private getRefreshToken(): string | null {
    return this.storedUser?.refreshToken || null;
  }

  setTokens(user: AuthUser): void {
    this.storedUser = user;
    void AsyncStorage.setItem('auth_user', JSON.stringify(user));
  }

  private clearTokens(): void {
    this.storedUser = null;
    void AsyncStorage.removeItem('auth_user');
  }

  async hydrate(): Promise<AuthUser | null> {
    try {
      const data = await AsyncStorage.getItem('auth_user');
      this.storedUser = data ? (JSON.parse(data) as AuthUser) : null;
      return this.storedUser;
    } catch (error) {
      this.storedUser = null;
      throw error;
    }
  }

  /**
   * Login user with username/email and password
   * POST /auth/login
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const localAccounts = await this.getLocalAccounts();
    const localAccount = localAccounts.find(
      ({ credentials: accountCredentials }) =>
        accountCredentials.username === credentials.username &&
        accountCredentials.password === credentials.password
    );
    if (localAccount) {
      this.setTokens(localAccount.user);
      return localAccount.user;
    }

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
   * DummyJSON supports creating users through POST /users/add, but those
   * simulated users cannot authenticate through /auth/login.
   */
  async register(data: RegisterData): Promise<AuthUser> {
    const response = await axios.post<Partial<AuthUser>>(`${USERS_API_URL}/add`, data, {
      headers: { 'Content-Type': 'application/json' },
    });
    const userId = response.data.id ?? Date.now();
    const user: AuthUser = {
      id: userId,
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender ?? 'male',
      image: response.data.image ?? '',
      token: `local-access-${userId}`,
      refreshToken: `local-refresh-${userId}`,
    };
    const localAccounts = await this.getLocalAccounts();
    await AsyncStorage.setItem(
      LOCAL_ACCOUNTS_KEY,
      JSON.stringify([...localAccounts, { credentials: data, user }])
    );
    this.setTokens(user);
    return user;
  }

  /**
   * Get current user profile (requires valid token)
   * GET /auth/me
   */
  async getMe(): Promise<AuthUser> {
    if (this.storedUser?.token.startsWith('local-access-')) {
      return this.storedUser;
    }
    const response = await this.client.get<AuthUser>('/me');
    return response.data;
  }

  private async getLocalAccounts(): Promise<LocalAccount[]> {
    const data = await AsyncStorage.getItem(LOCAL_ACCOUNTS_KEY);
    if (!data) return [];
    return JSON.parse(data) as LocalAccount[];
  }

  async updateProfile(id: number, data: Partial<Pick<AuthUser, 'firstName' | 'lastName' | 'email' | 'gender'>>): Promise<AuthUser> {
    if (this.storedUser?.token.startsWith('local-access-')) {
      const updatedUser = { ...this.storedUser, ...data };
      const localAccounts = await this.getLocalAccounts();
      const updatedAccounts = localAccounts.map((account) =>
        account.user.id === id ? { ...account, user: updatedUser } : account
      );
      await AsyncStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
      this.setTokens(updatedUser);
      return updatedUser;
    }

    const response = await this.client.put<AuthUser>(`/users/${id}`, data);
    const currentUser = this.getStoredUser();
    const updatedUser = {
      ...response.data,
      token: currentUser?.token || '',
      refreshToken: currentUser?.refreshToken || '',
    };
    this.setTokens(updatedUser);
    return updatedUser;
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
    return this.storedUser;
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