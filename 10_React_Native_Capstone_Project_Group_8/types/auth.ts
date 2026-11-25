
/**
 * Authentication Types - Marketplace App
 *
 * Supports:
 * - Supabase authentication for real registered accounts.
 * - DummyJSON authentication for the demo account.
 */

export type UserId = string | number;

export type AuthProvider = 'supabase' | 'dummyjson';

export type UserGender = 'male' | 'female';

export interface AuthUser {
  id: UserId;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: UserGender;
  image: string;
  token: string;
  refreshToken: string;
  authProvider?: AuthProvider;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  email: string;
  age?: number;
  gender?: UserGender;
  image?: string;
}

export interface AuthResponse extends AuthUser {}

export interface RefreshTokenResponse {
  id: UserId;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: UserGender;
  image: string;
  accessToken: string;
  refreshToken: string;
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
