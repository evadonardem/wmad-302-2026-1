/**
 * Auth Context with useReducer
 * Handles login, registration, profile updates, token refresh, and persistence hydration
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { AuthState, AuthAction, AuthUser, RegisterData } from '@/types/auth';
import { authApi } from '@/services/authApi';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case 'AUTH_HYDRATE':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };

    case 'AUTH_UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };

    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
  logout: () => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const hydrateAuth = async () => {
      try {
        const storedUser = authApi.getStoredUser();
        if (storedUser?.token && storedUser?.refreshToken) {
          try {
            const freshUser = await authApi.getMe();
            const mergedUser = {
              ...freshUser,
              token: storedUser.token,
              refreshToken: storedUser.refreshToken,
            };
            authApi.setTokens(mergedUser);
            dispatch({ type: 'AUTH_HYDRATE', payload: mergedUser });
          } catch {
            try {
              await authApi.refreshAccessToken();
              await authApi.getMe();
              const storedAgain = authApi.getStoredUser();
              dispatch({ type: 'AUTH_HYDRATE', payload: storedAgain ?? null });
            } catch {
              authApi.logout();
              dispatch({ type: 'AUTH_HYDRATE', payload: null });
            }
          }
        } else {
          dispatch({ type: 'AUTH_HYDRATE', payload: null });
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
      const message = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const user = await authApi.register(data);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      throw error;
    }
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    dispatch({ type: 'AUTH_UPDATE_USER', payload: updates });
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  }, []);

  const refreshUser = useCallback(async () => {
    if (!state.isAuthenticated) return;
    try {
      const user = await authApi.getMe();
      const storedUser = authApi.getStoredUser();
      if (storedUser) {
        const mergedUser = {
          ...user,
          token: storedUser.token,
          refreshToken: storedUser.refreshToken,
        };
        authApi.setTokens(mergedUser);
        dispatch({ type: 'AUTH_SUCCESS', payload: mergedUser });
      }
    } catch {
      // Token refresh interceptor handles 401s
    }
  }, [state.isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        updateUser,
        logout,
        clearError,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
