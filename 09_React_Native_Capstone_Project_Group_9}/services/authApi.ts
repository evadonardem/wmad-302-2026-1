/**
 * Auth API Service - DummyJSON Authentication
 * Docs: https://dummyjson.com/docs/auth
 * Base URL: https://dummyjson.com/auth
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { LoginCredentials, RegisterData, AuthUser, RefreshTokenResponse } from '@/types/auth';

const API_BASE_URL = 'https://dummyjson.com/auth';
const AUTH_STORAGE_KEY = 'auth_user';

class AuthApiService {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<RefreshTokenResponse> | null = null;
  private currentUser: AuthUser | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshAccessToken();
            const token = this.getAccessToken();
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
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
    const token = this.currentUser?.token;
    return token?.startsWith('local-session:') ? null : token ?? null;
  }

  private getRefreshToken(): string | null {
    return this.currentUser?.refreshToken ?? null;
  }

  public async setTokens(user: AuthUser): Promise<void> {
    this.currentUser = user;
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  }

  public async clearTokens(): Promise<void> {
    this.currentUser = null;
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  }

  async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      const response = await this.client.post<AuthUser>('/login', {
        username: credentials.username,
        password: credentials.password,
        expiresInMins: credentials.expiresInMins || 60,
      });
      await this.setTokens(response.data);
      return response.data;
    } catch {
      // The app accepts unregistered credentials as a persisted local-only demo session.
      const username = credentials.username.trim();
      const displayName = username.split(/[@._\s-]/)[0] || 'Cook';
      const localUser: AuthUser = {
        id: 0,
        username,
        email: username.includes('@') ? username : `${username}@cookbook.local`,
        firstName: displayName.charAt(0).toUpperCase() + displayName.slice(1),
        lastName: '',
        gender: 'male',
        image: '',
        token: `local-session:${Date.now()}`,
        refreshToken: 'local-session',
      };

      await this.setTokens(localUser);
      return localUser;
    }
  }

  async register(data: RegisterData): Promise<AuthUser> {
    const response = await this.client.post<AuthUser>('/register', {
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      password: data.password,
      email: data.email,
      age: data.age,
      gender: data.gender,
      image: data.image,
    });

    const registeredUser = response.data;
    if (registeredUser.token && registeredUser.refreshToken) {
      await this.setTokens(registeredUser);
      return registeredUser;
    }

    return this.login({
      username: data.username,
      password: data.password,
      expiresInMins: 60,
    });
  }

  async getMe(): Promise<AuthUser> {
    const response = await this.client.get<AuthUser>('/me');
    return response.data;
  }

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

  getStoredUser(): AuthUser | null {
    return this.currentUser;
  }

  async getStoredUserAsync(): Promise<AuthUser | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    try {
      const userData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!userData) {
        return null;
      }

      const user = JSON.parse(userData) as AuthUser;
      this.currentUser = user;
      return user;
    } catch {
      return null;
    }
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

