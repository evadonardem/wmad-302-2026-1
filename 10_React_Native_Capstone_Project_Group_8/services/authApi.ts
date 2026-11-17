
/**
 * Authentication API Service - Marketplace App
 *
 * Supabase:
 * - Real account registration.
 * - Email and password login.
 * - Persistent authentication sessions.
 *
 * DummyJSON:
 * - Demo account login.
 * - Demo account profile refresh.
 * - Demo account token refresh.
 */

import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import type {
  AuthUser,
  LoginCredentials,
  RegisterData,
  RefreshTokenResponse,
} from '@/types/auth';

import { supabase } from '@/services/supabase';
import { authStorage } from '@/utils/storage';

import type { Session, User } from '@supabase/supabase-js';

const API_BASE_URL = 'https://dummyjson.com/auth';

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

interface RegistrationResult {
  user: AuthUser | null;
  needsEmailConfirmation: boolean;
}

function normalizeGender(value: unknown): 'male' | 'female' {
  return value === 'female' ? 'female' : 'male';
}

/**
 * Convert DummyJSON response into our AuthUser format.
 */
function normalizeDummyJSONUser(
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
    authProvider: 'dummyjson',
  };
}

/**
 * Convert a Supabase session into our AuthUser format.
 */
function normalizeSupabaseUser(
  session: Session,
): AuthUser {
  const user: User = session.user;
  const metadata = user.user_metadata ?? {};

  const email = user.email ?? '';

  return {
    id: user.id,
    username:
      typeof metadata.username === 'string'
        ? metadata.username
        : email.split('@')[0] || 'user',
    email,
    firstName:
      typeof metadata.firstName === 'string'
        ? metadata.firstName
        : '',
    lastName:
      typeof metadata.lastName === 'string'
        ? metadata.lastName
        : '',
    gender: normalizeGender(metadata.gender),
    image:
      typeof metadata.image === 'string'
        ? metadata.image
        : '',
    token: session.access_token,
    refreshToken: session.refresh_token,
    authProvider: 'supabase',
  };
}

class AuthApiService {
  private client: AxiosInstance;

  private refreshTokenPromise:
    | Promise<RefreshTokenResponse>
    | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    /**
     * Attach authentication tokens only to DummyJSON requests.
     */
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const user = await authStorage.getUser();

        if (
          user?.authProvider === 'dummyjson' &&
          user.token &&
          config.headers
        ) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }

        return config;
      },
      (error) => Promise.reject(error),
    );

    /**
     * Refresh expired DummyJSON tokens.
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
          const currentUser = await authStorage.getUser();

          if (currentUser?.authProvider !== 'dummyjson') {
            return Promise.reject(error);
          }

          originalRequest._retry = true;

          try {
            const tokens = await this.refreshAccessToken();

            originalRequest.headers.Authorization =
              `Bearer ${tokens.accessToken}`;

            return this.client(originalRequest);
          } catch (refreshError) {
            await this.clearTokens();

            console.warn(
              'DummyJSON token refresh failed. The saved demo session was cleared.',
            );

            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  private async clearTokens(): Promise<void> {
    await authStorage.clearUser();
  }

  async setTokens(user: AuthUser): Promise<void> {
    await authStorage.setUser(user);
  }

  async getStoredUser(): Promise<AuthUser | null> {
    try {
      return await authStorage.getUser();
    } catch {
      return null;
    }
  }

  /**
   * Supabase email and password login.
   */
  async login(
    credentials: LoginCredentials,
  ): Promise<AuthUser> {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      });

    if (error) {
      throw error;
    }

    if (!data.session) {
      throw new Error(
        'Login succeeded but no authentication session was returned.',
      );
    }

    const user = normalizeSupabaseUser(data.session);

    await this.setTokens(user);

    return user;
  }

  /**
   * DummyJSON demo account login.
   */
  async loginDemo(
    username: string,
    password: string,
  ): Promise<AuthUser> {
    // Remove any existing Supabase session before using demo login.
    const { error: signOutError } =
      await supabase.auth.signOut();

    if (signOutError) {
      throw signOutError;
    }

    const response =
      await this.client.post<DummyJSONAuthResponse>(
        '/login',
        {
          username: username.trim(),
          password,
          expiresInMins: 60,
        },
      );

    const user = normalizeDummyJSONUser(response.data);

    await this.setTokens(user);

    return user;
  }

  /**
   * Register a real Supabase account.
   *
   * If email confirmation is enabled in Supabase,
   * the returned session will be null until the user
   * verifies their email address.
   */
  async register(
    data: RegisterData,
  ): Promise<RegistrationResult> {
    const { data: result, error } =
      await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          data: {
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            username: data.username.trim(),
            age: data.age,
            gender: data.gender ?? 'male',
            image: data.image ?? '',
          },
        },
      });

    if (error) {
      throw error;
    }

    if (!result.session) {
      await authStorage.clearUser();

      return {
        user: null,
        needsEmailConfirmation: true,
      };
    }

    const user = normalizeSupabaseUser(result.session);

    await this.setTokens(user);

    return {
      user,
      needsEmailConfirmation: false,
    };
  }

  /**
   * Restore an existing Supabase session.
   */
  async restoreSupabaseSession(): Promise<AuthUser | null> {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    if (!data.session) {
      await authStorage.clearUser();
      return null;
    }

    const user = normalizeSupabaseUser(data.session);

    await this.setTokens(user);

    return user;
  }

  /**
   * Get the current authenticated DummyJSON user.
   */
  async getMe(): Promise<AuthUser> {
    const storedUser = await this.getStoredUser();

    if (
      !storedUser ||
      storedUser.authProvider !== 'dummyjson'
    ) {
      throw new Error(
        'No authenticated DummyJSON demo session found.',
      );
    }

    const response = await this.client.get<
      Omit<
        DummyJSONAuthResponse,
        'accessToken' | 'refreshToken'
      > &
        Partial<
          Pick<
            DummyJSONAuthResponse,
            'accessToken' | 'refreshToken'
          >
        >
    >('/me');

    return {
      ...storedUser,
      ...response.data,
      token: storedUser.token,
      refreshToken: storedUser.refreshToken,
      authProvider: 'dummyjson',
    };
  }

  /**
   * Refresh DummyJSON access token.
   */
  async refreshAccessToken(): Promise<RefreshTokenResponse> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    const storedUser = await this.getStoredUser();

    if (
      !storedUser ||
      storedUser.authProvider !== 'dummyjson' ||
      !storedUser.refreshToken
    ) {
      throw new Error(
        'No DummyJSON refresh token available.',
      );
    }

    this.refreshTokenPromise = this.client
      .post<RefreshTokenResponse>(
        '/refresh',
        {
          refreshToken: storedUser.refreshToken,
          expiresInMins: 60,
        },
      )
      .then(async (response) => {
        const currentUser = await this.getStoredUser();

        if (!currentUser) {
          throw new Error(
            'Saved demo user session not found.',
          );
        }

        const updatedUser: AuthUser = {
          ...currentUser,
          token: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          authProvider: 'dummyjson',
        };

        await this.setTokens(updatedUser);

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
   * Logout from the current authentication provider.
   */
  async logout(): Promise<void> {
    const user = await this.getStoredUser();

    try {
      if (user?.authProvider === 'supabase') {
        const { error } = await supabase.auth.signOut();

        if (error) {
          throw error;
        }
      }
    } finally {
      await this.clearTokens();
    }
  }

  async hasValidTokens(): Promise<boolean> {
    const user = await this.getStoredUser();

    return !!(
      user?.token &&
      user?.refreshToken
    );
  }
}

export const authApi = new AuthApiService();

export { AuthApiService };
export type { RegistrationResult };
