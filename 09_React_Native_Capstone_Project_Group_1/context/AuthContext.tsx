/**
 * Auth Context with useReducer
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

import type { RegisterData } from '@/types/auth';

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

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore the saved session when the app opens.
  useEffect(() => {
    let mounted = true;

    const hydrateAuth = async () => {
      try {
        const storedUser = await authApi.getStoredUser();

        if (!storedUser) {
          if (mounted) {
            dispatch({ type: 'AUTH_HYDRATE', payload: null });
          }
          return;
        }

        // Local registered accounts already have a valid local session.
        if (storedUser.localAuth) {
          if (mounted) {
            dispatch({
              type: 'AUTH_HYDRATE',
              payload: storedUser,
            });
          }
          return;
        }

        // Verify DummyJSON session.
        try {
          const freshUser = await authApi.getMe();

          const mergedUser: AuthUser = {
            ...freshUser,
            token: storedUser.token,
            refreshToken: storedUser.refreshToken,
            localAuth: false,
          };

          await authApi.setTokens(mergedUser);

          if (mounted) {
            dispatch({
              type: 'AUTH_HYDRATE',
              payload: mergedUser,
            });
          }
        } catch {
          // Try refreshing an expired DummyJSON token.
          try {
            await authApi.refreshAccessToken();
            const refreshedUser = await authApi.getStoredUser();

            if (mounted) {
              dispatch({
                type: 'AUTH_HYDRATE',
                payload: refreshedUser,
              });
            }
          } catch {
            await authApi.logout();

            if (mounted) {
              dispatch({
                type: 'AUTH_HYDRATE',
                payload: null,
              });
            }
          }
        }
      } catch {
        if (mounted) {
          dispatch({
            type: 'AUTH_HYDRATE',
            payload: null,
          });
        }
      }
    };

    hydrateAuth();

    return () => {
      mounted = false;
    };
  }, []);

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
          error instanceof Error ? error.message : 'Login failed.';

        dispatch({
          type: 'AUTH_FAILURE',
          payload: message,
        });

        throw error;
      }
    },
    []
  );

  const register = useCallback(
    async (data: RegisterData) => {
      dispatch({ type: 'AUTH_START' });

      try {
        await authApi.register(data);

        // Registration saves the account but does not log the user in.
        dispatch({
          type: 'AUTH_HYDRATE',
          payload: null,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'Registration failed.';

        dispatch({
          type: 'AUTH_FAILURE',
          payload: message,
        });

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
    if (!state.isAuthenticated) {
      return;
    }

    try {
      const user = await authApi.getMe();
      await authApi.setTokens(user);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: user,
      });
    } catch {
      // Keep the current session if refreshing the profile fails.
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

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export { AuthContext };