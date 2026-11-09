
/**
 * Auth Context with useReducer
 * Handles authentication, persistence hydration, and token refresh.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

import { AuthState, AuthAction } from '@/types/auth';
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
        user: state.user
          ? { ...state.user, ...action.payload }
          : null,
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

// Context interface
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore authentication from AsyncStorage.
  useEffect(() => {
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

            dispatch({
              type: 'AUTH_HYDRATE',
              payload: mergedUser,
            });
          } catch {
            // Try refreshing an expired token.
            try {
              await authApi.refreshAccessToken();

              const storedAgain = await authApi.getStoredUser();

              dispatch({
                type: 'AUTH_HYDRATE',
                payload: storedAgain,
              });
            } catch {
              await authApi.logout();

              dispatch({
                type: 'AUTH_HYDRATE',
                payload: null,
              });
            }
          }
        } else {
          dispatch({
            type: 'AUTH_HYDRATE',
            payload: null,
          });
        }
      } catch {
        dispatch({
          type: 'AUTH_HYDRATE',
          payload: null,
        });
      }
    };

    hydrateAuth();
  }, []);

  // Login
  const login = useCallback(
    async (username: string, password: string) => {
      dispatch({ type: 'AUTH_START' });

      try {
        const user = await authApi.login({
          username,
          password,
        });

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: user,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Login failed';

        dispatch({
          type: 'AUTH_FAILURE',
          payload: message,
        });

        throw error;
      }
    },
    []
  );

  // Register
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
        await authApi.register(data);

        // Registration does not automatically log in the user.
        // Return to the unauthenticated state.
        dispatch({
          type: 'AUTH_HYDRATE',
          payload: null,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'Registration failed';

        dispatch({
          type: 'AUTH_FAILURE',
          payload: message,
        });

        throw error;
      }
    },
    []
  );

  // Logout
  const logout = useCallback(async () => {
    await authApi.logout();

    dispatch({
      type: 'AUTH_LOGOUT',
    });
  }, []);

  // Clear authentication error
  const clearError = useCallback(() => {
    dispatch({
      type: 'AUTH_CLEAR_ERROR',
    });
  }, []);

  // Refresh current user
  const refreshUser = useCallback(async () => {
    if (!state.isAuthenticated) {
      return;
    }

    try {
      const user = await authApi.getMe();
      const storedUser = await authApi.getStoredUser();

      if (storedUser) {
        const mergedUser = {
          ...user,
          token: storedUser.token,
          refreshToken: storedUser.refreshToken,
        };

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: mergedUser,
        });
      }
    } catch {
      // The API interceptor handles token refresh.
    }
  }, [state.isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        clearError,
        refreshUser,
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
