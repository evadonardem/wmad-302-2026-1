/**
 * Auth Context with useReducer - Complete scaffold
 * Students complete: register, token refresh integration, persistence hydration
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import type { AuthState, AuthUser } from '@/types/auth';
import { authApi } from '@/services/authApi';
import { authReducer, initialAuthState } from '@/context/authReducer';

// Context
interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    username: string;
    password: string;
    email: string;
    age?: number;
    gender?: 'male' | 'female';
  }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (profile: Pick<AuthUser, 'firstName' | 'lastName' | 'email'>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  useEffect(() => authApi.setSessionExpiredHandler(() => {
    dispatch({ type: 'AUTH_LOGOUT' });
  }), []);

  // Hydrate from storage on mount
  useEffect(() => {
    let active = true;
    const dispatchWhileMounted = (action: Parameters<typeof dispatch>[0]) => {
      if (active) dispatch(action);
    };
    const hydrateAuth = async () => {
      try {
        const storedUser = await authApi.getStoredUser();
        if (storedUser?.token && storedUser?.refreshToken) {
          try {
            const freshUser = await authApi.getMe();
            const mergedUser = {
              ...freshUser,
              token: storedUser.token,
              refreshToken: storedUser.refreshToken,
            };
            await authApi.setTokens(mergedUser);
            dispatchWhileMounted({ type: 'AUTH_HYDRATE', payload: mergedUser });
          } catch {
            try {
              await authApi.refreshAccessToken();
              const refreshedUser = await authApi.getMe();
              const storedAgain = await authApi.getStoredUser();
              if (!storedAgain) throw new Error('The saved session could not be refreshed.');
              const mergedUser = {
                ...refreshedUser,
                token: storedAgain.token,
                refreshToken: storedAgain.refreshToken,
              };
              await authApi.setTokens(mergedUser);
              dispatchWhileMounted({ type: 'AUTH_HYDRATE', payload: mergedUser });
            } catch (refreshError) {
              await authApi.logout();
              dispatchWhileMounted({
                type: 'AUTH_FAILURE',
                payload: refreshError instanceof Error ? refreshError.message : 'Your session expired. Please sign in again.',
              });
            }
          }
        } else {
          dispatchWhileMounted({ type: 'AUTH_HYDRATE', payload: null });
        }
      } catch (hydrateError) {
        dispatchWhileMounted({
          type: 'AUTH_FAILURE',
          payload: hydrateError instanceof Error ? hydrateError.message : 'Could not restore your saved session.',
        });
      }
    };

    void hydrateAuth();
    return () => { active = false; };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const user = await authApi.login({ username, password });
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      throw error;
    }
  }, []);

  const register = useCallback(
    async (data: {
      firstName: string;
      lastName: string;
      username: string;
      password: string;
      email: string;
      age?: number;
      gender?: 'male' | 'female';
    }) => {
      dispatch({ type: 'AUTH_START' });
      try {
        const user = await authApi.register(data);
        dispatch({ type: 'AUTH_SUCCESS', payload: user });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Registration failed';
        dispatch({ type: 'AUTH_FAILURE', payload: message });
        throw error;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  }, []);

  const refreshUser = useCallback(async () => {
    if (!state.isAuthenticated) return;
    try {
      const user = await authApi.getMe();
      const storedUser = await authApi.getStoredUser();
      if (storedUser) {
        const mergedUser = {
          ...user,
          token: storedUser.token,
          refreshToken: storedUser.refreshToken,
        };
        await authApi.setTokens(mergedUser);
        dispatch({ type: 'AUTH_SUCCESS', payload: mergedUser });
      }
    } catch (refreshError) {
      throw refreshError;
    }
  }, [state.isAuthenticated]);

  const updateProfile = useCallback(async (profile: Pick<AuthUser, 'firstName' | 'lastName' | 'email'>) => {
    if (!state.user) throw new Error('Please sign in to update your profile.');
    const updatedUser = await authApi.updateProfile(state.user.id, profile);
    dispatch({ type: 'AUTH_UPDATE_USER', payload: updatedUser });
  }, [state.user]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        clearError,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
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