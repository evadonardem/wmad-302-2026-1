/**
 * Auth API Service - DummyJSON Authentication
 * Docs: https://dummyjson.com/docs/auth
 * Base URL: https://dummyjson.com/auth
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { LoginCredentials, RegisterData, AuthUser, RefreshTokenResponse } from '@/types/auth';

const API_BASE_URL = 'https://dummyjson.com/auth';
const AUTH_STORAGE_KEY = 'auth_user';
const LOCAL_ACCOUNTS_STORAGE_KEY = 'local_auth_accounts';

interface LocalAccount {
  user: Omit<AuthUser, 'token' | 'refreshToken'>;
  salt: string;
  passwordHash: string;
}

function isLocalAccount(value: unknown): value is LocalAccount {
  if (typeof value !== 'object' || value === null) return false;

  const account = value as Record<string, unknown>;
  if (typeof account.user !== 'object' || account.user === null) return false;
  const user = account.user as Record<string, unknown>;

  return (
    typeof user.id === 'number' &&
    typeof user.username === 'string' &&
    typeof user.email === 'string' &&
    typeof user.firstName === 'string' &&
    typeof user.lastName === 'string' &&
    typeof user.gender === 'string' &&
    typeof user.image === 'string' &&
    (user.phone === undefined || typeof user.phone === 'string') &&
    typeof account.salt === 'string' &&
    typeof account.passwordHash === 'string'
  );
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
        if (!originalRequest) {
          return Promise.reject(error);
        }
        const isAuthRequest =
          originalRequest?.url?.includes('/login') ||
          originalRequest?.url?.includes('/register') ||
          originalRequest?.url?.includes('/refresh');

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
          originalRequest._retry = true;

          try {
            const tokens = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            await this.clearTokens();
            console.warn('Token refresh failed, user logged out');
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getAccessToken(): string | null {
    return this.storedUser?.token ?? null;
  }

  private getRefreshToken(): string | null {
    return this.storedUser?.refreshToken ?? null;
  }

  private async getLocalAccounts(): Promise<LocalAccount[]> {
    const stored = await AsyncStorage.getItem(LOCAL_ACCOUNTS_STORAGE_KEY);
    if (!stored) return [];
    const accounts: unknown = JSON.parse(stored);
    if (!Array.isArray(accounts) || !accounts.every(isLocalAccount)) {
      throw new Error('Stored local account data is invalid.');
    }
    return accounts;
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${salt}:${password}`,
    );
  }

  private createLocalSession(user: LocalAccount['user']): AuthUser {
    const sessionId = Crypto.randomUUID();
    return {
      ...user,
      token: `local:${sessionId}`,
      refreshToken: `local-refresh:${sessionId}`,
      isLocal: true,
    };
  }

  async setTokens(user: AuthUser): Promise<void> {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    this.storedUser = user;
  }

  async updateProfile(
    user: AuthUser,
    profile: Pick<AuthUser, 'firstName' | 'lastName' | 'email' | 'phone'>,
  ): Promise<AuthUser> {
    const updatedProfile = {
      firstName: profile.firstName.trim(),
      lastName: profile.lastName.trim(),
      email: profile.email.trim().toLowerCase(),
      phone: profile.phone?.trim() ?? '',
    };

    if (user.isLocal) {
      const accounts = await this.getLocalAccounts();
      if (!accounts.some((account) => account.user.id === user.id)) {
        throw new Error('This account is no longer available on this device.');
      }
      if (
        accounts.some(
          (account) =>
            account.user.id !== user.id &&
            account.user.email.toLowerCase() === updatedProfile.email.toLowerCase(),
        )
      ) {
        throw new Error('That email is already used by another account on this device.');
      }
      const updatedAccounts = accounts.map((account) =>
        account.user.id === user.id
          ? { ...account, user: { ...account.user, ...updatedProfile } }
          : account,
      );
      await AsyncStorage.setItem(LOCAL_ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));
    }

    const updatedUser = { ...user, ...updatedProfile };
    await this.setTokens(updatedUser);
    return updatedUser;
  }

  private async clearTokens(): Promise<void> {
    this.storedUser = null;
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  }

  async hydrateStorage(): Promise<AuthUser | null> {
    try {
      const value = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      this.storedUser = value ? (JSON.parse(value) as AuthUser) : null;
    } catch {
      this.storedUser = null;
    }
    return this.storedUser;
  }

  /**
   * Login user with username/email and password
   * POST /auth/login
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const loginIdentifier = credentials.username.trim().toLowerCase();
    const localAccount = (await this.getLocalAccounts()).find(
      (account) =>
        account.user.username.toLowerCase() === loginIdentifier ||
        account.user.email.toLowerCase() === loginIdentifier,
    );

    if (localAccount) {
      const passwordHash = await this.hashPassword(credentials.password, localAccount.salt);
      if (passwordHash !== localAccount.passwordHash) {
        throw new Error('Invalid username or password.');
      }

      const user = this.createLocalSession(localAccount.user);
      await this.setTokens(user);
      return user;
    }

    const response = await this.client.post<AuthUser>('/login', {
      username: credentials.username,
      password: credentials.password,
      expiresInMins: credentials.expiresInMins || 60,
    });
    await this.setTokens(response.data);
    return response.data;
  }

  /**
   * Create a local account. These credentials are only valid on this device/browser.
   */
  async register(data: RegisterData): Promise<AuthUser> {
    const accounts = await this.getLocalAccounts();
    const username = data.username.trim();
    const email = data.email.trim().toLowerCase();
    if (accounts.some((account) => account.user.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('That username is already registered on this device.');
    }
    if (accounts.some((account) => account.user.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('That email is already registered on this device.');
    }

    const salt = Crypto.randomUUID();
    const passwordHash = await this.hashPassword(data.password, salt);
    const account: LocalAccount = {
      user: {
        id: -Date.now(),
        username,
        email,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        gender: data.gender ?? 'female',
        image: data.image ?? '',
        isLocal: true,
      },
      salt,
      passwordHash,
    };
    await AsyncStorage.setItem(
      LOCAL_ACCOUNTS_STORAGE_KEY,
      JSON.stringify([...accounts, account]),
    );

    const user = this.createLocalSession(account.user);
    await this.setTokens(user);
    return user;
  }

  /**
   * Get current user profile (requires valid token)
   * GET /auth/me
   */
  async getMe(): Promise<AuthUser> {
    if (this.storedUser?.isLocal) return this.storedUser;
    const response = await this.client.get<AuthUser>('/me');
    const cachedUser = this.storedUser;
    if (!cachedUser) return response.data;
    return {
      ...response.data,
      username: cachedUser.username,
      email: cachedUser.email,
      firstName: cachedUser.firstName,
      lastName: cachedUser.lastName,
      gender: cachedUser.gender,
      image: cachedUser.image,
      phone: cachedUser.phone ?? response.data.phone,
    };
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
      .then(async (response) => {
        // Update stored tokens with new ones
        const currentUser = this.getStoredUser();
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
  getStoredUser(): AuthUser | null {
    return this.storedUser;
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
  hasValidTokens(): boolean {
    const user = this.getStoredUser();
    return !!(user?.token && user?.refreshToken);
  }
}

// Export singleton instance
export const authApi = new AuthApiService();

// Export class for testing
export { AuthApiService };