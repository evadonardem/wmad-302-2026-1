/**
 * Auth Types - Shared between both capstone projects
 * Based on DummyJSON Auth API: https://dummyjson.com/docs/auth
 */

export type Gender = 'male' | 'female';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  image: string;
  token: string;
  refreshToken: string;
  phone?: string;
  age?: number;
  /**
   * True when the account was created through registration. DummyJSON
   * simulates user creation (`POST /users/add`) but never persists the user,
   * so `/auth/login` cannot issue tokens for it. Such sessions live on the
   * device only and skip token-protected endpoints.
   */
  isLocalSession?: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
  expiresInMins?: number; // optional, default 60
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  email: string;
  age?: number;
  gender?: Gender;
  image?: string;
}

/** Raw `/auth/login` payload. DummyJSON now returns `accessToken`; older versions returned `token`. */
export interface LoginResponse extends Omit<AuthUser, 'token' | 'isLocalSession'> {
  accessToken?: string;
  token?: string;
}

/** `/auth/me` returns the full user profile without tokens. */
export type MeResponse = Omit<AuthUser, 'token' | 'refreshToken' | 'isLocalSession'>;

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

/** Fields a user can change from the Edit Profile screen (PUT /users/{id}). */
export interface ProfileUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: Gender;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: AuthUser }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_HYDRATE'; payload: AuthUser | null }
  | { type: 'AUTH_UPDATE_USER'; payload: Partial<AuthUser> }
  | { type: 'AUTH_CLEAR_ERROR' };
