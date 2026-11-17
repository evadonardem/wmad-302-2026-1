
/**
 * Auth API Service - DummyJSON Authentication
 * Docs: https://dummyjson.com/docs/auth
 * Base URL: https://dummyjson.com/auth
 *
 * Converts DummyJSON's accessToken into the local
 * AuthUser.token property so sessions can be restored.
 */

import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import type {
  LoginCredentials,
  RegisterData,
  AuthUser,
  RefreshTokenResponse,
} from '@/types/auth';

import { authStorage } from '@/utils/storage';

const API_BASE_URL = 'https://dummyjson.com/auth';

/**
 * Actual user response returned by DummyJSON.
 */
interface DummyJSONAuthResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  image: string;
  accessToken: string;
  refreshToken: string;
}

/**
 * Convert DummyJSON response into our local AuthUser format.
 */
function normalizeAuthUser(
  data: DummyJSONAuthResponse,
): AuthUser {
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    gender: data.gender,
    image: data.image,
    token: data.accessToken,
    refreshToken: data.refreshToken,
  };
}

class AuthApiService {
  private client: AxiosInstance;

  private refreshTokenPromise: Promise<RefreshTokenResponse> | null =
    null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    /**
     * Request interceptor:
     * Automatically attach the saved access token.
     */
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await this.getAccessToken();

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => Promise.reject(error),
    );

    /**
     * Response interceptor:
     * Refresh the access token if the API returns 401.
     */
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        const isRefreshRequest =
          typeof originalRequest?.url === 'string' &&
          originalRequest.url.includes('/refresh');

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !isRefreshRequest
        ) {
          originalRequest._retry = true;

          try {
            const tokens = await this.refreshAccessToken();

            originalRequest.headers.Authorization =
              `Bearer ${tokens.accessToken}`;

            return this.client(originalRequest);
          } catch (refreshError) {
            await this.clearTokens();

            console.warn(
              'Token refresh failed. The saved session was cleared.',
            );

            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  /**
   * Get saved access token.
   */
  private async getAccessToken(): Promise<string | null> {
    try {
      const user = await authStorage.getUser();
      return user?.token || null;
    } catch {
      return null;
    }
  }

  /**
   * Get saved refresh token.
   */
  private async getRefreshToken(): Promise<string | null> {
    try {
      const user = await authStorage.getUser();
      return user?.refreshToken || null;
    } catch {
      return null;
    }
  }

  /**
   * Save normalized user and authentication tokens.
   */
  async setTokens(user: AuthUser): Promise<void> {
    await authStorage.setUser(user);
  }

  /**
   * Clear saved authentication information.
   */
  private async clearTokens(): Promise<void> {
    await authStorage.clearUser();
  }

  /**
   * Login user.
   * POST /auth/login
   *
   * IMPORTANT:
   * DummyJSON returns accessToken.
   * Our application stores it as token.
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const response = await this.client.post<DummyJSONAuthResponse>(
      '/login',
      {
        username: credentials.username,
        password: credentials.password,
        expiresInMins: credentials.expiresInMins || 60,
      },
    );

    const user = normalizeAuthUser(response.data);

    // Save the correctly normalized user.
    await this.setTokens(user);

    return user;
  }

  /**
   * Register user.
   * TODO: Student implementation.
   */
  async register(_data: RegisterData): Promise<AuthUser> {
    throw new Error(
      'TODO: Implement register - call /auth/register then login',
    );
  }

  /**
   * Get current authenticated user.
   * GET /auth/me
   */
  async getMe(): Promise<AuthUser> {
    const response = await this.client.get<
      Omit<DummyJSONAuthResponse, 'accessToken' | 'refreshToken'> &
      Partial<Pick<DummyJSONAuthResponse, 'accessToken' | 'refreshToken'>>
    >('/me');

    const storedUser = await this.getStoredUser();

    if (!storedUser) {
      throw new Error('No saved user session found.');
    }

    return {
      ...storedUser,
      ...response.data,
      token: storedUser.token,
      refreshToken: storedUser.refreshToken,
    };
  }

  /**
   * Refresh access token.
   * POST /auth/refresh
   */
  async refreshAccessToken(): Promise<RefreshTokenResponse> {
    // Reuse an existing refresh request if one is running.
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    const refreshToken = await this.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available.');
    }

    this.refreshTokenPromise = this.client
      .post<{
        accessToken: string;
        refreshToken: string;
        id: number;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
        gender: 'male' | 'female';
        image: string;
      }>('/refresh', {
        refreshToken,
        expiresInMins: 60,
      })
      .then(async (response) => {
        const currentUser = await this.getStoredUser();

        if (!currentUser) {
          throw new Error('Saved user session not found.');
        }

        const updatedUser: AuthUser = {
          ...currentUser,
          token: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        };

        // Persist the newly refreshed tokens.
        await this.setTokens(updatedUser);

        return {
          ...response.data,
        };
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
   * Get locally saved user.
   */
  async getStoredUser(): Promise<AuthUser | null> {
    try {
      return await authStorage.getUser();
    } catch {
      return null;
    }
  }

  /**
   * Logout.
   * DummyJSON has no logout endpoint.
   * Clear the local session.
   */
  async logout(): Promise<void> {
    await this.clearTokens();
  }

  /**
   * Check whether authentication tokens are saved.
   */
  async hasValidTokens(): Promise<boolean> {
    const user = await this.getStoredUser();

    return !!(
      user?.token &&
      user?.refreshToken
    );
  }
}

// Export singleton instance.
export const authApi = new AuthApiService();

// Export class for testing.
export { AuthApiService };
