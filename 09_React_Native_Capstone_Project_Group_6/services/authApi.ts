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
const DEVELOPMENT_SESSION_PREFIX = 'cookbook-dev-demo-';

function getDevelopmentUserId(email: string): number {
  let hash = 2166136261;
  for (const character of email.trim().toLowerCase()) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return (hash >>> 0) || 1;
}

function createDevelopmentUser(identifier: string): AuthUser {
  const normalizedIdentifier = identifier.trim();
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier);
  const usernameSource = isEmail ? normalizedIdentifier.split('@')[0] : normalizedIdentifier;
  const username = usernameSource
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '.')
    .replace(/^[._-]+|[._-]+$/g, '') || 'demo-user';
  const email = isEmail ? normalizedIdentifier.toLowerCase() : `${username}@demo.local`;
  const nameParts = usernameSource.replace(/[._-]+/g, ' ').trim().split(/\s+/).filter(Boolean);

  return {
    id: getDevelopmentUserId(email),
    username,
    email,
    firstName: nameParts[0] || 'Demo',
    lastName: nameParts.slice(1).join(' ') || 'User',
    gender: 'female',
    image: `https://dummyjson.com/icon/${encodeURIComponent(username)}/128`,
    token: `${DEVELOPMENT_SESSION_PREFIX}access-token`,
    refreshToken: `${DEVELOPMENT_SESSION_PREFIX}refresh-token`,
  };
}

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

  private isDevelopmentDemoUser(user: AuthUser | null): boolean {
    return process.env.NODE_ENV === 'development'
      && !hasCustomAuthApi
      && user?.token.startsWith(DEVELOPMENT_SESSION_PREFIX) === true;
  }

  /**
   * Login with a username or, for DummyJSON, resolve an email to its username first.
   * POST /auth/login
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const identifier = credentials.username.trim();
    if (!identifier || credentials.password.length === 0) {
      throw new Error('Please enter both username and password.');
    }

    if (process.env.NODE_ENV === 'development' && !hasCustomAuthApi) {
      const user = createDevelopmentUser(identifier);
      await this.setTokens(user);
      return user;
    }

    const username = await this.resolveLoginUsername(identifier);
    let response: AuthResponse;
    try {
      ({ data: response } = await this.client.post<AuthResponse>('/login', {
        username,
        password: credentials.password,
        expiresInMins: credentials.expiresInMins || 60,
      }));
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        throw new Error('Incorrect email/username or password, or this account is not registered.');
      }
      throw error;
    }

    const user = this.normalizeUser(response);
    await this.setTokens(user);
    return user;
  }

  private async resolveLoginUsername(identifier: string): Promise<string> {
    const normalizedIdentifier = identifier.trim();
    if (hasCustomAuthApi || !normalizedIdentifier.includes('@')) return normalizedIdentifier;

    const apiRoot = API_BASE_URL.replace(/\/auth\/?$/, '');
    const response = await axios.get<{
      users: { username: string; email: string }[];
    }>(`${apiRoot}/users/filter`, {
      params: {
        key: 'email',
        value: normalizedIdentifier.toLowerCase(),
        select: 'username,email',
      },
      timeout: 10000,
    });
    const account = response.data.users.find(
      (user) => user.email.toLowerCase() === normalizedIdentifier.toLowerCase()
    );
    if (!account) throw new Error('No account was found with that email address.');
    return account.username;
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
    const storedUser = await this.getStoredUser();
    if (storedUser && this.isDevelopmentDemoUser(storedUser)) {
      return {
        id: storedUser.id || getDevelopmentUserId(storedUser.email),
        username: storedUser.username,
        email: storedUser.email,
        firstName: storedUser.firstName,
        lastName: storedUser.lastName,
        gender: storedUser.gender,
        image: storedUser.image,
      };
    }
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
    const currentUser = await this.getStoredUser();
    if (!currentUser) throw new Error('Your session has expired. Please sign in again.');
    if (this.isDevelopmentDemoUser(currentUser)) {
      const updatedUser = { ...currentUser, ...profile };
      await this.setTokens(updatedUser);
      return updatedUser;
    }

    const response = await axios.put<Partial<AuthUser>>(`https://dummyjson.com/users/${id}`, profile, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
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
      const currentUser = await this.getStoredUser();
      if (currentUser && this.isDevelopmentDemoUser(currentUser)) {
        return {
          accessToken: currentUser.token,
          refreshToken: currentUser.refreshToken,
        };
      }

      const refreshToken = currentUser?.refreshToken ?? null;
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