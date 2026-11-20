/**
 * Auth Context with useReducer - Complete Implementation
 * Handles login, registration, AsyncStorage hydration, profile updates, and logout
 */
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { AuthState, AuthAction, AuthUser } from '@/types/auth';
import { authApi } from '@/services/authApi';

export const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export function authReducer(state: AuthState, action: AuthAction): AuthState {
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
  register: (data: {
    firstName: string;
    lastName: string;
    username: string;
    password: string;
    email: string;
    age?: number;
    gender?: 'male' | 'female';
  }) => Promise<void>;
  updateUserProfile: (updates: Partial<AuthUser>) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  useEffect(() => {
    const hydrateAuth = async () => {
      try {
        const storedUser = await authApi.hydrateStorage();
        if (storedUser?.token && storedUser?.refreshToken) {
          try {
            const freshUser = await authApi.getMe();
            const mergedUser: AuthUser = {
              ...freshUser,
              token: storedUser.token,
              refreshToken: storedUser.refreshToken,
            };
            await authApi.setTokens(mergedUser);
            dispatch({ type: 'AUTH_HYDRATE', payload: mergedUser });
          } catch {
            try {
              await authApi.refreshAccessToken();
              const freshUser = await authApi.getMe();
              const storedAgain = authApi.getStoredUser();
              if (storedAgain) {
                dispatch({
                  type: 'AUTH_HYDRATE',
                  payload: {
                    ...freshUser,
                    token: storedAgain.token,
                    refreshToken: storedAgain.refreshToken,
                  },
                });
              } else {
                dispatch({ type: 'AUTH_HYDRATE', payload: null });
              }
            } catch {
              await authApi.logout();
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
      const message =
        error instanceof Error ? error.message : 'Invalid username or password';
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
        const message =
          error instanceof Error ? error.message : 'Registration failed';
        dispatch({ type: 'AUTH_FAILURE', payload: message });
        throw error;
      }
    },
    []
  );

  const updateUserProfile = useCallback(
    async (updates: Partial<AuthUser>) => {
      dispatch({ type: 'AUTH_UPDATE_USER', payload: updates });
      if (state.user) {
        const updatedUser = { ...state.user, ...updates };
        await authApi.setTokens(updatedUser);
      }
    },
    [state.user]
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
      const storedUser = authApi.getStoredUser();
      if (storedUser) {
        const mergedUser: AuthUser = {
          ...user,
          token: storedUser.token,
          refreshToken: storedUser.refreshToken,
        };
        await authApi.setTokens(mergedUser);
        dispatch({ type: 'AUTH_SUCCESS', payload: mergedUser });
      }
    } catch {
      // Handled by interceptor
    }
  }, [state.isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        updateUserProfile,
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