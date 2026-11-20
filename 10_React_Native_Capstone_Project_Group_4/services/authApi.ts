/**
 * Auth API Service - DummyJSON Authentication
 * Docs: https://dummyjson.com/docs/auth
 * Supports Web & Native (AsyncStorage + synchronous memory cache for interceptors)
 */
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginCredentials, RegisterData, AuthUser, RefreshTokenResponse } from '@/types/auth';

const API_BASE_URL = 'https://dummyjson.com/auth';
const STORAGE_KEY = 'auth_user';

class AuthApiService {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<RefreshTokenResponse> | null = null;
  private cachedUser: AuthUser | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to attach Bearer token
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

    // Response interceptor for automatic 401 token refresh
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
            await this.clearTokens();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async hydrateStorage(): Promise<AuthUser | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.cachedUser = JSON.parse(raw) as AuthUser;
        return this.cachedUser;
      }
    } catch {
      // Ignore storage read errors
    }
    this.cachedUser = null;
    return null;
  }

  private getAccessToken(): string | null {
    const user = this.getStoredUser();
    if (!user) return null;
    return user.token || (user as unknown as { accessToken?: string }).accessToken || null;
  }

  private getRefreshToken(): string | null {
    const user = this.getStoredUser();
    return user?.refreshToken || null;
  }

  async setTokens(user: AuthUser): Promise<void> {
    const normalized: AuthUser = {
      ...user,
      token: user.token || (user as unknown as { accessToken?: string }).accessToken || '',
    };
    this.cachedUser = normalized;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // Ignore storage write errors
    }
  }

  private async clearTokens(): Promise<void> {
    this.cachedUser = null;
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage delete errors
    }
  }

  /**
   * Login user with username and password
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
    await this.setTokens(normalizedUser);
    return normalizedUser;
  }

  /**
   * Register new user via DummyJSON Users API and issue session
   * POST https://dummyjson.com/users/add
   */
  async register(data: RegisterData): Promise<AuthUser> {
    const response = await axios.post<{
      id: number;
      firstName: string;
      lastName: string;
      username: string;
      email: string;
      gender?: 'male' | 'female';
      image?: string;
    }>('https://dummyjson.com/users/add', {
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      password: data.password,
      email: data.email,
      age: data.age,
      gender: data.gender,
    });

    const created = response.data;
    const registeredUser: AuthUser = {
      id: created.id || 101,
      username: created.username || data.username,
      email: created.email || data.email,
      firstName: created.firstName || data.firstName,
      lastName: created.lastName || data.lastName,
      gender: created.gender || data.gender || 'male',
      image:
        created.image ||
        `https://dummyjson.com/icon/${encodeURIComponent(data.username)}/128`,
      token: `mock-access-token-${Date.now()}`,
      refreshToken: `mock-refresh-token-${Date.now()}`,
    };

    await this.setTokens(registeredUser);
    return registeredUser;
  }

  /**
   * Get current user profile
   * GET /auth/me
   */
  async getMe(): Promise<AuthUser> {
    const token = this.getAccessToken();
    // Support locally registered DummyJSON simulated accounts
    if (token && token.startsWith('mock-access-token-') && this.cachedUser) {
      return this.cachedUser;
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
      .then(async (response) => {
        const currentUser = this.getStoredUser();
        if (currentUser) {
          const updatedUser: AuthUser = {
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

  getStoredUser(): AuthUser | null {
    if (this.cachedUser) return this.cachedUser;
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.cachedUser = JSON.parse(raw) as AuthUser;
          return this.cachedUser;
        }
      }
    } catch {
      // Ignore
    }
    return null;
  }

  async logout(): Promise<void> {
    await this.clearTokens();
  }

  hasValidTokens(): boolean {
    const user = this.getStoredUser();
    return !!(user?.token && user?.refreshToken);
  }
}

export const authApi = new AuthApiService();
export { AuthApiService };