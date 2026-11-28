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
import { AuthState, AuthAction, AuthUser } from '@/types/auth';
import { authApi } from '@/services/authApi';
import { UserProfileUpdate, userApi } from '@/services/userApi';

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with true for hydration
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
  updateUser: (profile: UserProfileUpdate) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Hydrate from storage on mount
  useEffect(() => {
    const hydrateAuth = async () => {
      try {
        const storedUser = await authApi.getStoredUser();
        if (storedUser?.token && storedUser?.refreshToken) {
          if (storedUser.token.startsWith('local-access-')) {
            dispatch({ type: 'AUTH_HYDRATE', payload: storedUser });
            return;
          }
          // Verify token still works by fetching user profile
          try {
            const freshUser = await authApi.getMe();
            // Merge stored tokens with fresh user data
            const mergedUser = {
              ...freshUser,
              token: storedUser.token,
              refreshToken: storedUser.refreshToken,
            };
            await authApi.setTokens(mergedUser); // Update with fresh data
            dispatch({ type: 'AUTH_HYDRATE', payload: mergedUser });
          } catch {
            // Token expired, try refresh
            try {
              await authApi.refreshAccessToken();
              await authApi.getMe();
              const storedAgain = await authApi.getStoredUser();
              if (storedAgain) {
                dispatch({ type: 'AUTH_HYDRATE', payload: storedAgain });
              } else {
                dispatch({ type: 'AUTH_HYDRATE', payload: null });
              }
            } catch {
              // Refresh failed, clear storage
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
    if (state.user?.token.startsWith('local-access-')) return;
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
    } catch {
      // Silently fail - token refresh interceptor handles 401s
    }
  }, [state.isAuthenticated, state.user]);

  const updateUser = useCallback(async (profile: UserProfileUpdate) => {
    if (!state.user) throw new Error('You must be signed in to update your profile.');
    const updatedProfile = state.user.token.startsWith('local-access-')
      ? profile
      : await userApi.updateUser(state.user.id, profile);
    const updatedUser = { ...state.user, ...updatedProfile, ...profile };
    await authApi.setTokens(updatedUser);
    if (state.user.token.startsWith('local-access-')) {
      await authApi.updateRegisteredUser(updatedUser);
    }
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