
/**
 * Auth Context with useReducer
 * Restores saved login sessions from local storage.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

import type { AuthState, AuthAction } from '@/types/auth';
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
        error: null,
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

const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Restore the locally saved session.
   *
   * Do not call DummyJSON during initial hydration.
   * This prevents temporary API failures or expired demo tokens
   * from automatically logging the user out on browser refresh.
   */
  useEffect(() => {
    let isMounted = true;

    const hydrateAuth = async () => {
      try {
        const storedUser = await authApi.getStoredUser();

        if (
          storedUser &&
          storedUser.id &&
          storedUser.username &&
          storedUser.token
        ) {
          if (isMounted) {
            dispatch({
              type: 'AUTH_HYDRATE',
              payload: storedUser,
            });
          }
        } else {
          if (isMounted) {
            dispatch({
              type: 'AUTH_HYDRATE',
              payload: null,
            });
          }
        }
      } catch (error) {
        console.error('Failed to restore saved login session:', error);

        if (isMounted) {
          dispatch({
            type: 'AUTH_HYDRATE',
            payload: null,
          });
        }
      }
    };

    hydrateAuth();

    return () => {
      isMounted = false;
    };
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
    [],
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
        // Registration implementation remains unchanged.
        void data;

        throw new Error(
          'TODO: Implement register in AuthContext - call authApi.register',
        );
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
    [],
  );

  // Logout
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  // Clear authentication error
  const clearError = useCallback(() => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  }, []);

  /**
   * Refresh user information from DummyJSON.
   * If the API is unavailable, keep the locally saved session.
   */
  const refreshUser = useCallback(async () => {
    if (!state.isAuthenticated) {
      return;
    }

    try {
      const user = await authApi.getMe();
      const storedUser = await authApi.getStoredUser();

      if (storedUser) {
        const mergedUser = {
          ...storedUser,
          ...user,
          token: storedUser.token,
          refreshToken: storedUser.refreshToken,
        };

        await authApi.setTokens(mergedUser);

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: mergedUser,
        });
      }
    } catch (error) {
      console.warn(
        'Could not refresh profile information. Keeping the saved session.',
        error,
      );
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

// Custom hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider',
    );
  }

  return context;
}

export { AuthContext };
