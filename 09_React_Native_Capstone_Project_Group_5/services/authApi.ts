/**
 * Auth API Service - DummyJSON Authentication
 * Docs: https://dummyjson.com/docs/auth
 * Base URL: https://dummyjson.com/auth
 *
 * Tokens are cached in memory (synchronous reads for the axios interceptors)
 * and persisted to AsyncStorage. Call `hydrate()` once on app start.
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import {
  AuthUser,
  LoginCredentials,
  RawAuthResponse,
  RefreshTokenResponse,
  RegisterData,
} from '@/types/auth';
import { authStorage } from '@/utils/storage';
import { userApi } from '@/services/userApi';

const API_BASE_URL = 'https://dummyjson.com/auth';

/** DummyJSON does not persist new users, so it cannot log them in. We borrow a demo session. */
const DEMO_CREDENTIALS: LoginCredentials = { username: 'emilys', password: 'emilyspass' };

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

class AuthApiService {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<RefreshTokenResponse> | null = null;
  private currentUser: AuthUser | null = null;
  private unauthorizedHandler: (() => void) | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Attach the bearer token to every request
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

    // Auto-refresh once on 401, then retry the original request
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as RetriableConfig | undefined;
        const url = originalRequest?.url ?? '';
        const isAuthCall = url.includes('/login') || url.includes('/refresh');

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthCall) {
          originalRequest._retry = true;
          try {
            const tokens = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed: tokens are cleared, tell the app to go back to login
            this.clearTokens();
            this.unauthorizedHandler?.();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /** Register a callback invoked when the session can no longer be refreshed. */
  setUnauthorizedHandler(handler: (() => void) | null): void {
    this.unauthorizedHandler = handler;
  }

  private getAccessToken(): string | null {
    return this.currentUser?.token ?? null;
  }

  private getRefreshToken(): string | null {
    return this.currentUser?.refreshToken ?? null;
  }

  private normalize(raw: RawAuthResponse): AuthUser {
    const { accessToken, token, ...rest } = raw;
    return { ...rest, token: token ?? accessToken ?? '' };
  }

  /** Cache + persist the user (with tokens). */
  setTokens(user: AuthUser): void {
    this.currentUser = user;
    authStorage.setUser(user).catch(() => undefined);
  }

  private clearTokens(): void {
    this.currentUser = null;
    authStorage.clearUser().catch(() => undefined);
  }

  /** Load the persisted session into memory. Call once on app start. */
  async hydrate(): Promise<AuthUser | null> {
    this.currentUser = await authStorage.getUser();
    return this.currentUser;
  }

  /** POST /auth/login */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const response = await this.client.post<RawAuthResponse>('/login', {
      username: credentials.username,
      password: credentials.password,
      expiresInMins: credentials.expiresInMins || 60,
    });
    const user = this.normalize(response.data);
    this.setTokens(user);
    return user;
  }

  /**
   * Register a new user, then auto-login.
   * 1. POST /users/add (DummyJSON's simulated create endpoint)
   * 2. Try a real login with the new credentials
   * 3. DummyJSON does not store new users, so the login fails; fall back to a demo
   *    session and overlay the profile the person just entered.
   */
  async register(data: RegisterData): Promise<AuthUser> {
    const created = await userApi.addUser(data);
    try {
      return await this.login({ username: data.username, password: data.password });
    } catch {
      const session = await this.login(DEMO_CREDENTIALS);
      const user: AuthUser = {
        ...session,
        id: created.id,
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender ?? session.gender,
        image: data.image ?? '',
      };
      this.setTokens(user);
      return user;
    }
  }

  /** GET /auth/me (requires valid token) */
  async getMe(): Promise<AuthUser> {
    const response = await this.client.get<AuthUser>('/me');
    return response.data;
  }

  /** POST /auth/refresh */
  async refreshAccessToken(): Promise<RefreshTokenResponse> {
    // Prevent multiple simultaneous refresh calls
    if (this.refreshTokenPromise) return this.refreshTokenPromise;

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');

    this.refreshTokenPromise = this.client
      .post<RefreshTokenResponse>('/refresh', { refreshToken, expiresInMins: 60 })
      .then((response) => {
        const current = this.currentUser;
        if (current) {
          this.setTokens({
            ...current,
            token: response.data.accessToken,
            refreshToken: response.data.refreshToken ?? current.refreshToken,
          });
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

  getStoredUser(): AuthUser | null {
    return this.currentUser;
  }

  /** Client-side only: DummyJSON has no logout endpoint */
  logout(): void {
    this.clearTokens();
  }

  hasValidTokens(): boolean {
    return !!(this.currentUser?.token && this.currentUser?.refreshToken);
  }
}

export const authApi = new AuthApiService();
export { AuthApiService };