/**
 * Auth Context with useReducer
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
import { isAxiosError } from 'axios';
import { AuthUser, ProfileUpdate, RegisterData } from '@/types/auth';
import { authApi } from '@/services/authApi';
import { userApi } from '@/services/userApi';
import { authReducer, initialAuthState } from '@/context/authReducer';
import type { AuthState } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: ProfileUpdate) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // If a token refresh fails anywhere, drop back to the login screen
  useEffect(() => {
    authApi.setUnauthorizedHandler(() => dispatch({ type: 'AUTH_LOGOUT' }));
    return () => authApi.setUnauthorizedHandler(null);
  }, []);

  // Hydrate from storage on mount
  useEffect(() => {
    const hydrateAuth = async () => {
      try {
        const stored = await authApi.hydrate();
        if (!stored?.token || !stored.refreshToken) {
          dispatch({ type: 'AUTH_HYDRATE', payload: null });
          return;
        }
        try {
          // Verifies the token (the interceptor refreshes it once on 401)
          const fresh = await authApi.getMe();
          const latest = authApi.getStoredUser() ?? stored;
          // Stored profile wins: DummyJSON does not persist edits or new accounts
          const merged: AuthUser = { ...fresh, ...latest };
          authApi.setTokens(merged);
          dispatch({ type: 'AUTH_HYDRATE', payload: merged });
        } catch (error) {
          if (isAxiosError(error) && !error.response) {
            // Offline: keep the saved session instead of logging the person out
            dispatch({ type: 'AUTH_HYDRATE', payload: stored });
          } else {
            authApi.logout();
            dispatch({ type: 'AUTH_HYDRATE', payload: null });
          }
        }
      } catch {
        dispatch({ type: 'AUTH_HYDRATE', payload: null });
      }
    };
    hydrateAuth();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const user = await authApi.login({ username, password });
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Login failed');
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      throw new Error(message);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const user = await authApi.register(data);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Registration failed');
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  const clearError = useCallback(() => dispatch({ type: 'AUTH_CLEAR_ERROR' }), []);

  const refreshUser = useCallback(async () => {
    if (!state.isAuthenticated) return;
    try {
      const fresh = await authApi.getMe();
      const stored = authApi.getStoredUser();
      if (stored) {
        const merged: AuthUser = { ...fresh, ...stored };
        authApi.setTokens(merged);
        dispatch({ type: 'AUTH_SUCCESS', payload: merged });
      }
    } catch {
      // Silently fail - the refresh interceptor handles 401s
    }
  }, [state.isAuthenticated]);

  const updateProfile = useCallback(
    async (data: ProfileUpdate) => {
      if (!state.user) return;
      const applied = await userApi.updateUser(state.user.id, data);
      const merged: AuthUser = { ...state.user, ...applied };
      authApi.setTokens(merged);
      dispatch({ type: 'AUTH_UPDATE_USER', payload: applied });
    },
    [state.user]
  );

  const value = useMemo(
    () => ({ ...state, login, register, logout, clearError, refreshUser, updateProfile }),
    [state, login, register, logout, clearError, refreshUser, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const serverMessage = (error.response?.data as { message?: string } | undefined)?.message;
    if (serverMessage) return serverMessage;
    if (!error.response) return 'Network error. Check your connection and try again.';
  }
  return error instanceof Error ? error.message : fallback;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };