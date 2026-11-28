/**
 * Auth API Service - DummyJSON Authentication
 * Docs: https://dummyjson.com/docs/auth
 * Base URL: https://dummyjson.com/auth
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginCredentials, RegisterData, AuthUser, AuthResponse, RefreshTokenResponse } from '@/types/auth';

const API_BASE_URL = 'https://dummyjson.com/auth';
const AUTH_USER_KEY = 'auth_user';
const REGISTERED_USERS_KEY = 'marketplace_registered_users';

interface RegisteredAccount {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  email: string;
  gender: 'male' | 'female';
  image: string;
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
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const tokens = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            await this.clearTokens();
            // TODO: Student to implement navigation redirect to login
            console.warn('Token refresh failed, user logged out');
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async getAccessToken(): Promise<string | null> {
    const user = await this.getStoredUser();
    return user?.token?.startsWith('local-access-') ? null : user?.token || null;
  }

  private async getRefreshToken(): Promise<string | null> {
    const user = await this.getStoredUser();
    return user?.refreshToken?.startsWith('local-refresh-') ? null : user?.refreshToken || null;
  }

  async setTokens(user: AuthUser): Promise<void> {
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }

  private async clearTokens(): Promise<void> {
    await AsyncStorage.removeItem(AUTH_USER_KEY);
  }

  private async getRegisteredAccounts(): Promise<RegisteredAccount[]> {
    const storedAccounts = await AsyncStorage.getItem(REGISTERED_USERS_KEY);
    return storedAccounts ? JSON.parse(storedAccounts) as RegisteredAccount[] : [];
  }

  /**
   * Login user with username/email and password
   * POST /auth/login
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const normalizedUsername = credentials.username.trim().toLowerCase();
    const account = (await this.getRegisteredAccounts()).find(
      (registeredAccount) =>
        registeredAccount.username.toLowerCase() === normalizedUsername ||
        registeredAccount.email.toLowerCase() === normalizedUsername
    );

    if (account) {
      if (account.password !== credentials.password) {
        throw new Error('Incorrect username or password.');
      }

      const user: AuthUser = {
        id: account.id,
        username: account.username,
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
        gender: account.gender,
        image: account.image,
        token: `local-access-${account.id}`,
        refreshToken: `local-refresh-${account.id}`,
      };
      await this.setTokens(user);
      return user;
    }

    const response = await this.client.post<AuthResponse>('/login', {
      username: credentials.username,
      password: credentials.password,
      expiresInMins: credentials.expiresInMins || 60,
    });
    const { accessToken, token: legacyToken, ...userData } = response.data;
    const resolvedToken = accessToken ?? legacyToken;
    if (!resolvedToken || !userData.refreshToken) {
      throw new Error('Login response did not include valid authentication tokens.');
    }

    const user: AuthUser = { ...userData, token: resolvedToken };
    await this.setTokens(user);
    return user;
  }

  /**
   * Register new user
   * Create a device-local account because DummyJSON does not persist registrations.
   */
  async register(data: RegisterData): Promise<AuthUser> {
    const accounts = await this.getRegisteredAccounts();
    const username = data.username.trim();
    const email = data.email.trim();
    const duplicate = accounts.some((account) =>
      account.username.toLowerCase() === username.toLowerCase() ||
      account.email.toLowerCase() === email.toLowerCase()
    );
    if (duplicate) {
      throw new Error('That username or email is already registered.');
    }

    // DummyJSON's user-creation endpoint does not create login-capable accounts.
    // Keep demo registrations locally so they can sign in on this device.
    const id = -(Date.now() + accounts.length);
    const account: RegisteredAccount = {
      id,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      username,
      password: data.password,
      email,
      gender: data.gender ?? 'male',
      image: data.image ?? '',
    };
    await AsyncStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify([...accounts, account]));

    const user: AuthUser = {
      id,
      username: account.username,
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
      gender: account.gender,
      image: account.image,
      token: `local-access-${id}`,
      refreshToken: `local-refresh-${id}`,
    };
    await this.setTokens(user);
    return user;
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
        // Update stored tokens with new ones
        const currentUser = await this.getStoredUser();
        if (currentUser) {
          const updatedUser = {
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
  private async readStoredUser(): Promise<AuthUser | null> {
    const userData = await AsyncStorage.getItem(AUTH_USER_KEY);
    return userData ? JSON.parse(userData) as AuthUser : null;
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

  async getStoredUser(): Promise<AuthUser | null> {
    return this.readStoredUser();
  }

  async updateRegisteredUser(user: AuthUser): Promise<void> {
    const accounts = await this.getRegisteredAccounts();
    const accountIndex = accounts.findIndex((account) => account.id === user.id);
    if (accountIndex < 0) return;

    const account = accounts[accountIndex];
    accounts[accountIndex] = {
      ...account,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
    };
    await AsyncStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(accounts));
  }
}

// Export singleton instance
export const authApi = new AuthApiService();

// Export class for testing
export { AuthApiService };