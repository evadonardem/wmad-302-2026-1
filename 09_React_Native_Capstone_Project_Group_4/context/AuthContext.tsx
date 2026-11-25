/**
 * Auth Context with useReducer - Cookbook App
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

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Reducer
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

// Context
interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Hydrate from storage on mount
  useEffect(() => {
    const hydrateAuth = async () => {
      try {
        const storedUser = authApi.getStoredUser();
        if (storedUser?.token && storedUser?.refreshToken) {
          // Support simulated sessions created via /users/add registration
          if (storedUser.token.startsWith('simulated-access-token-')) {
            dispatch({ type: 'AUTH_HYDRATE', payload: storedUser });
            return;
          }

          // Verify real DummyJSON token still works by fetching user profile
          try {
            const freshUser = await authApi.getMe();
            const mergedUser: AuthUser = {
              ...freshUser,
              token: storedUser.token,
              refreshToken: storedUser.refreshToken,
            };
            authApi.setTokens(mergedUser);
            dispatch({ type: 'AUTH_HYDRATE', payload: mergedUser });
          } catch {
            // Token expired, try refresh
            try {
              await authApi.refreshAccessToken();
              const freshUser = await authApi.getMe();
              const storedAgain = authApi.getStoredUser();
              if (storedAgain) {
                const mergedRefreshed: AuthUser = {
                  ...freshUser,
                  token: storedAgain.token,
                  refreshToken: storedAgain.refreshToken,
                };
                authApi.setTokens(mergedRefreshed);
                dispatch({ type: 'AUTH_HYDRATE', payload: mergedRefreshed });
              } else {
                dispatch({ type: 'AUTH_HYDRATE', payload: null });
              }
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

  const logout = useCallback(() => {
    authApi.logout();
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  }, []);

  const updateUser = useCallback(
    (updates: Partial<AuthUser>) => {
      if (state.user) {
        const updatedUser: AuthUser = { ...state.user, ...updates };
        authApi.setTokens(updatedUser);
      }
      dispatch({ type: 'AUTH_UPDATE_USER', payload: updates });
    },
    [state.user]
  );

  const refreshUser = useCallback(async () => {
    if (!state.isAuthenticated || state.user?.token?.startsWith('simulated-access-token-')) {
      return;
    }
    try {
      const user = await authApi.getMe();
      const storedUser = authApi.getStoredUser();
      if (storedUser) {
        const mergedUser: AuthUser = {
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
  }, [state.isAuthenticated, state.user?.token]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        clearError,
        refreshUser,
        updateUser,
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