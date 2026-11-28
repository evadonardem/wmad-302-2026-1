/**
 * Auth API Service - DummyJSON Authentication
 * Docs: https://dummyjson.com/docs/auth
 * Base URL: https://dummyjson.com/auth
 *
 * Session storage: the logged-in user (including tokens) is cached in memory so
 * the request interceptor can read it synchronously, and persisted to
 * AsyncStorage so it survives app restarts on iOS, Android and web.
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import {
  AuthUser,
  LoginCredentials,
  LoginResponse,
  MeResponse,
  RefreshTokenResponse,
  RegisterData,
} from '@/types/auth';
import { authStorage } from '@/utils/storage';

const API_ROOT = 'https://dummyjson.com';
const API_BASE_URL = `${API_ROOT}/auth`;
const TOKEN_LIFETIME_MINS = 60;

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/** Shape returned by `POST /users/add`. */
interface CreatedUserResponse {
  id: number;
  image?: string;
}

type SessionExpiredListener = () => void;

class AuthApiService {
  private client: AxiosInstance;
  /** Separate client without interceptors so a failing refresh can never trigger another refresh. */
  private refreshClient: AxiosInstance;
  private refreshTokenPromise: Promise<RefreshTokenResponse> | null = null;
  private session: AuthUser | null = null;
  private sessionExpiredListeners = new Set<SessionExpiredListener>();

  constructor() {
    const config = {
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    };
    this.client = axios.create(config);
    this.refreshClient = axios.create(config);

    // Request interceptor to add auth token
    this.client.interceptors.request.use((requestConfig: InternalAxiosRequestConfig) => {
      const token = this.session?.token;
      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }
      return requestConfig;
    });

    // Response interceptor: refresh the access token once on 401, then retry the request
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as RetriableRequestConfig | undefined;
        const isAuthEndpoint = originalRequest?.url === '/login';

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !isAuthEndpoint
        ) {
          originalRequest._retry = true;

          try {
            const tokens = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed: the session is over. Clearing it and notifying
            // listeners makes AuthContext log out, and the (app) route guard
            // then redirects to the login screen.
            await this.endSession();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ============ Session storage ============

  /** Loads the persisted session into memory. Call once on app start. */
  async loadSession(): Promise<AuthUser | null> {
    this.session = await authStorage.getUser();
    return this.session;
  }

  async setSession(user: AuthUser): Promise<void> {
    this.session = user;
    await authStorage.setUser(user);
  }

  async clearSession(): Promise<void> {
    this.session = null;
    await authStorage.clearUser();
  }

  /** Synchronous access to the in-memory session (loaded by `loadSession`). */
  getStoredUser(): AuthUser | null {
    return this.session;
  }

  hasValidTokens(): boolean {
    return !!(this.session?.token && this.session?.refreshToken);
  }

  /** Subscribe to forced logouts (refresh token rejected). Returns an unsubscribe function. */
  onSessionExpired(listener: SessionExpiredListener): () => void {
    this.sessionExpiredListeners.add(listener);
    return () => {
      this.sessionExpiredListeners.delete(listener);
    };
  }

  private async endSession(): Promise<void> {
    if (!this.session) return;
    await this.clearSession();
    console.warn('Token refresh failed, user logged out');
    this.sessionExpiredListeners.forEach((listener) => listener());
  }

  // ============ Endpoints ============

  /**
   * Login user with username and password
   * POST /auth/login
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const response = await this.client.post<LoginResponse>('/login', {
      username: credentials.username,
      password: credentials.password,
      expiresInMins: credentials.expiresInMins ?? TOKEN_LIFETIME_MINS,
    });
    const { accessToken, token, ...profile } = response.data;
    const user: AuthUser = { ...profile, token: accessToken ?? token ?? '' };
    await this.setSession(user);
    return user;
  }

  /**
   * Register new user, then log in.
   *
   * DummyJSON has no `/auth/register` endpoint; `POST /users/add` simulates
   * creating a user and returns it with a new id, but does not persist it.
   * Because of that `/auth/login` rejects the new credentials, so when login
   * fails with 400 we start a device-only session for the new account
   * (`isLocalSession`). Against a real backend the login call simply succeeds.
   */
  async register(data: RegisterData): Promise<AuthUser> {
    const created = await this.refreshClient.post<CreatedUserResponse>(`${API_ROOT}/users/add`, data);

    try {
      return await this.login({ username: data.username, password: data.password });
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.status !== 400) throw error;

      const user: AuthUser = {
        id: created.data.id,
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender ?? 'male',
        age: data.age,
        image:
          created.data.image ||
          `https://dummyjson.com/icon/${encodeURIComponent(data.username)}/128`,
        token: '',
        refreshToken: '',
        isLocalSession: true,
      };
      await this.setSession(user);
      return user;
    }
  }

  /**
   * Get current user profile (requires valid token)
   * GET /auth/me
   */
  async getMe(): Promise<MeResponse> {
    const response = await this.client.get<MeResponse>('/me');
    return response.data;
  }

  /**
   * Refresh access token using refresh token
   * POST /auth/refresh
   */
  async refreshAccessToken(): Promise<RefreshTokenResponse> {
    // Share one in-flight refresh between all requests that hit a 401 at the same time
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    const refreshToken = this.session?.refreshToken;
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshTokenPromise = this.refreshClient
      .post<RefreshTokenResponse>('/refresh', { refreshToken, expiresInMins: TOKEN_LIFETIME_MINS })
      .then(async (response) => {
        if (this.session) {
          await this.setSession({
            ...this.session,
            token: response.data.accessToken,
            refreshToken: response.data.refreshToken,
          });
        }
        return response.data;
      })
      .finally(() => {
        this.refreshTokenPromise = null;
      });

    return this.refreshTokenPromise;
  }

  /**
   * Logout - clear local tokens
   * Note: DummyJSON doesn't have a logout endpoint, so this is client-side only
   */
  async logout(): Promise<void> {
    await this.clearSession();
  }
}

// Export singleton instance
export const authApi = new AuthApiService();

// Export class for testing
export { AuthApiService };
