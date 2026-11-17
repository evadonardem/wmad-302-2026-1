/**
 * Auth Context with useReducer
 *
 * Restores saved login sessions from local storage.
 * Supports locally saved profile updates.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

import type {
  AuthState,
  AuthAction,
  AuthUser,
} from '@/types/auth';

import { authApi } from '@/services/authApi';

import {
  authStorage,
  profileOverridesStorage,
  type ProfileOverrides,
} from '@/utils/storage';

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

type RegisterInput = {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  email: string;
  age?: number;
  gender?: 'male' | 'female';
};

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: ProfileOverrides) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

/**
 * Applies locally saved profile edits to a user.
 */
async function applyProfileOverrides(
  user: AuthUser,
): Promise<AuthUser> {
  const overrides = await profileOverridesStorage.get(user.id);

  if (!overrides) {
    return user;
  }

  return {
    ...user,
    ...overrides,
    token: user.token,
    refreshToken: user.refreshToken,
  };
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Restore the locally saved session.
   * Apply any previously saved profile edits.
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
          const userWithOverrides =
            await applyProfileOverrides(storedUser);

          if (isMounted) {
            dispatch({
              type: 'AUTH_HYDRATE',
              payload: userWithOverrides,
            });
          }
        } else if (isMounted) {
          dispatch({
            type: 'AUTH_HYDRATE',
            payload: null,
          });
        }
      } catch (error) {
        console.error(
          'Failed to restore saved login session:',
          error,
        );

        if (isMounted) {
          dispatch({
            type: 'AUTH_HYDRATE',
            payload: null,
          });
        }
      }
    };

    void hydrateAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Login
   */
  const login = useCallback(
    async (username: string, password: string) => {
      dispatch({ type: 'AUTH_START' });

      try {
        const user = await authApi.login({
          username,
          password,
        });

        const userWithOverrides =
          await applyProfileOverrides(user);

        await authStorage.setUser(userWithOverrides);

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: userWithOverrides,
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

  /**
   * Register
   *
   * Existing registration implementation is intentionally
   * left unchanged in this update.
   */
  const register = useCallback(
    async (data: RegisterInput) => {
      dispatch({ type: 'AUTH_START' });

      try {
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

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  /**
   * Clear authentication error.
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  }, []);

  /**
   * Update the signed-in user's editable profile information.
   *
   * The profile is saved separately for the current user.
   * Authentication tokens and other user properties are preserved.
   */
  const updateProfile = useCallback(
    async (updates: ProfileOverrides) => {
      const currentUser = state.user;

      if (!currentUser) {
        throw new Error(
          'You must be logged in to update your profile.',
        );
      }

      const updatedProfile: ProfileOverrides = {
        firstName: updates.firstName.trim(),
        lastName: updates.lastName.trim(),
        username: updates.username.trim(),
        email: updates.email.trim(),
        gender: updates.gender,
      };

      const updatedUser: AuthUser = {
        ...currentUser,
        ...updatedProfile,
      };

      // Save the editable profile separately for this user.
      await profileOverridesStorage.save(
        currentUser.id,
        updatedProfile,
      );

      // Update the locally stored authenticated user.
      await authStorage.setUser(updatedUser);

      // Immediately update the app's authentication state.
      dispatch({
        type: 'AUTH_UPDATE_USER',
        payload: updatedProfile,
      });
    },
    [state.user],
  );

  /**
   * Refresh user information from DummyJSON.
   *
   * Local profile edits take priority over API profile data.
   * Existing authentication tokens are preserved.
   */
  const refreshUser = useCallback(async () => {
    if (!state.isAuthenticated) {
      return;
    }

    try {
      const user = await authApi.getMe();
      const storedUser = await authApi.getStoredUser();

      if (storedUser) {
        const mergedUser: AuthUser = {
          ...storedUser,
          ...user,
          token: storedUser.token,
          refreshToken: storedUser.refreshToken,
        };

        const userWithOverrides =
          await applyProfileOverrides(mergedUser);

        await authStorage.setUser(userWithOverrides);

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: userWithOverrides,
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
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom authentication hook.
 */
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