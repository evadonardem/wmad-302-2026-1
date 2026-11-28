/**
 * Auth Context with useReducer
 * Handles login, register, logout, profile updates, token-refresh integration
 * and hydrating the persisted session on app start.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  ReactNode,
} from 'react';
import { AuthState, AuthUser, ProfileUpdate, RegisterData } from '@/types/auth';
import { authApi } from '@/services/authApi';
import { userApi } from '@/services/userApi';
import { getErrorMessage, isNetworkError } from '@/utils/errors';
import { authReducer, initialAuthState } from './authReducer';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (changes: ProfileUpdate) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Keeps the tokens from the stored session while taking profile fields from the server. */
function mergeProfile(stored: AuthUser, profile: Partial<AuthUser>): AuthUser {
  return { ...stored, ...profile, token: stored.token, refreshToken: stored.refreshToken };
}

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Hydrate from storage on mount
  useEffect(() => {
    let cancelled = false;

    const hydrateAuth = async () => {
      const storedUser = await authApi.loadSession();

      if (!storedUser) {
        if (!cancelled) dispatch({ type: 'AUTH_HYDRATE', payload: null });
        return;
      }

      // Device-only accounts (see authApi.register) have no tokens to verify
      if (storedUser.isLocalSession) {
        if (!cancelled) dispatch({ type: 'AUTH_HYDRATE', payload: storedUser });
        return;
      }

      if (!authApi.hasValidTokens()) {
        await authApi.logout();
        if (!cancelled) dispatch({ type: 'AUTH_HYDRATE', payload: null });
        return;
      }

      try {
        // Verifies the token. An expired token gets a 401, which the axios
        // interceptor answers by refreshing it and retrying this request.
        const profile = await authApi.getMe();
        const current = authApi.getStoredUser() ?? storedUser;
        const merged = mergeProfile(current, profile);
        await authApi.setSession(merged);
        if (!cancelled) dispatch({ type: 'AUTH_HYDRATE', payload: merged });
      } catch (error) {
        if (isNetworkError(error)) {
          // Offline: keep the user signed in with cached data instead of logging them out
          if (!cancelled) dispatch({ type: 'AUTH_HYDRATE', payload: storedUser });
          return;
        }
        // Refresh failed too, so the session is no longer valid
        await authApi.logout();
        if (!cancelled) dispatch({ type: 'AUTH_HYDRATE', payload: null });
      }
    };

    hydrateAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  // When the refresh token is rejected mid-session, log out. The (app) layout's
  // auth guard then redirects to the login screen.
  useEffect(() => authApi.onSessionExpired(() => dispatch({ type: 'AUTH_LOGOUT' })), []);

  const login = useCallback(async (username: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const user = await authApi.login({ username, password });
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error: unknown) {
      dispatch({ type: 'AUTH_FAILURE', payload: getErrorMessage(error, 'Login failed') });
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      // Creates the account and signs the user in (auto-login)
      const user = await authApi.register(data);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error: unknown) {
      dispatch({ type: 'AUTH_FAILURE', payload: getErrorMessage(error, 'Registration failed') });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  }, []);

  const refreshUser = useCallback(async () => {
    const storedUser = authApi.getStoredUser();
    if (!storedUser || storedUser.isLocalSession) return;
    try {
      const profile = await authApi.getMe();
      const merged = mergeProfile(authApi.getStoredUser() ?? storedUser, profile);
      await authApi.setSession(merged);
      dispatch({ type: 'AUTH_UPDATE_USER', payload: merged });
    } catch {
      // Silently fail - the token refresh interceptor handles 401s
    }
  }, []);

  const updateProfile = useCallback(async (changes: ProfileUpdate) => {
    const storedUser = authApi.getStoredUser();
    if (!storedUser) throw new Error('You are not signed in');

    // DummyJSON only knows its seeded users, so device-only accounts update locally
    const profile = storedUser.isLocalSession
      ? changes
      : await userApi.updateUser(storedUser.id, changes);

    const merged = mergeProfile(storedUser, {
      firstName: profile.firstName ?? storedUser.firstName,
      lastName: profile.lastName ?? storedUser.lastName,
      email: profile.email ?? storedUser.email,
      phone: profile.phone ?? storedUser.phone,
      age: profile.age ?? storedUser.age,
      gender: profile.gender ?? storedUser.gender,
    });
    await authApi.setSession(merged);
    dispatch({ type: 'AUTH_UPDATE_USER', payload: merged });
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({ ...state, login, register, logout, clearError, refreshUser, updateProfile }),
    [state, login, register, logout, clearError, refreshUser, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
