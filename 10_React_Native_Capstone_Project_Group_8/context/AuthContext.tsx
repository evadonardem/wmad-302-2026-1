
/**
 * Authentication Context - CartlyX
 *
 * Supports:
 * - Supabase registered accounts.
 * - DummyJSON demo account.
 * - Persistent session restoration.
 * - Locally saved profile updates.
 * - Profile picture updates.
 * - Account-specific profile persistence.
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

import {
  authApi,
  type RegistrationResult,
} from '@/services/authApi';

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
  login: (
    email: string,
    password: string,
  ) => Promise<void>;

  loginDemo: (
    username: string,
    password: string,
  ) => Promise<void>;

  register: (
    data: RegisterInput,
  ) => Promise<RegistrationResult>;

  logout: () => Promise<void>;

  clearError: () => void;

  refreshUser: () => Promise<void>;

  updateProfile: (
    updates: ProfileOverrides,
  ) => Promise<void>;
}

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

function authReducer(
  state: AuthState,
  action: AuthAction,
): AuthState {
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

/**
 * Apply locally saved profile edits to a user.
 */
async function applyProfileOverrides(
  user: AuthUser,
): Promise<AuthUser> {
  const overrides = await profileOverridesStorage.get(
    user.id,
  );

  if (!overrides) {
    return user;
  }

  return {
    ...user,
    ...overrides,
    token: user.token,
    refreshToken: user.refreshToken,
    authProvider: user.authProvider,
  };
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(
    authReducer,
    initialState,
  );

  /**
   * Restore the saved authentication session.
   *
   * DummyJSON sessions are restored from local storage.
   * Supabase sessions are restored through Supabase Auth.
   */
  useEffect(() => {
    let isMounted = true;

    const hydrateAuth = async () => {
      try {
        const storedUser = await authApi.getStoredUser();

        let authenticatedUser: AuthUser | null = null;

        if (
          storedUser?.authProvider === 'dummyjson'
        ) {
          if (
            storedUser.id &&
            storedUser.username &&
            storedUser.token
          ) {
            authenticatedUser = storedUser;
          }
        } else {
          authenticatedUser =
            await authApi.restoreSupabaseSession();
        }

        if (authenticatedUser) {
          authenticatedUser =
            await applyProfileOverrides(
              authenticatedUser,
            );
        }

        if (isMounted) {
          dispatch({
            type: 'AUTH_HYDRATE',
            payload: authenticatedUser,
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
   * Supabase email and password login.
   */
  const login = useCallback(
    async (
      email: string,
      password: string,
    ) => {
      dispatch({ type: 'AUTH_START' });

      try {
        const user = await authApi.login({
          email,
          password,
        });

        const userWithOverrides =
          await applyProfileOverrides(user);

        await authStorage.setUser(
          userWithOverrides,
        );

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: userWithOverrides,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'Login failed';

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
   * DummyJSON demo account login.
   */
  const loginDemo = useCallback(
    async (
      username: string,
      password: string,
    ) => {
      dispatch({ type: 'AUTH_START' });

      try {
        const user = await authApi.loginDemo(
          username,
          password,
        );

        const userWithOverrides =
          await applyProfileOverrides(user);

        await authStorage.setUser(
          userWithOverrides,
        );

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: userWithOverrides,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'Demo login failed';

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
   * Supabase account registration.
   */
  const register = useCallback(
    async (
      data: RegisterInput,
    ): Promise<RegistrationResult> => {
      dispatch({ type: 'AUTH_START' });

      try {
        const result = await authApi.register(data);

        if (!result.user) {
          // Email confirmation is required.
          dispatch({
            type: 'AUTH_HYDRATE',
            payload: null,
          });

          return result;
        }

        const userWithOverrides =
          await applyProfileOverrides(result.user);

        await authStorage.setUser(
          userWithOverrides,
        );

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: userWithOverrides,
        });

        return {
          ...result,
          user: userWithOverrides,
        };
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
   * Logout.
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
   * Update the signed-in user's editable profile.
   *
   * Profile edits, including the profile picture,
   * are saved locally and separately per account.
   */
  const updateProfile = useCallback(
    async (updates: ProfileOverrides) => {
      const currentUser = state.user;

      if (!currentUser) {
        throw new Error(
          'You must be logged in to update your profile.',
        );
      }

      // Retrieve previously saved profile information.
      const existingOverrides =
        await profileOverridesStorage.get(
          currentUser.id,
        );

      // Preserve existing information while applying
      // the latest profile changes.
      const updatedProfile: ProfileOverrides = {
        ...existingOverrides,

        firstName: updates.firstName.trim(),
        lastName: updates.lastName.trim(),
        username: updates.username.trim(),
        email: updates.email.trim(),
        gender: updates.gender,

        ...(updates.image !== undefined
          ? { image: updates.image }
          : {}),
      };

      const updatedUser: AuthUser = {
        ...currentUser,
        ...updatedProfile,
      };

      // Save the complete profile for this account.
      await profileOverridesStorage.save(
        currentUser.id,
        updatedProfile,
      );

      // Update the locally stored authenticated user.
      await authStorage.setUser(updatedUser);

      // Immediately update the application state.
      dispatch({
        type: 'AUTH_UPDATE_USER',
        payload: updatedProfile,
      });
    },
    [state.user],
  );

  /**
   * Refresh user information according to the
   * current authentication provider.
   */
  const refreshUser = useCallback(async () => {
    if (!state.isAuthenticated || !state.user) {
      return;
    }

    try {
      let user: AuthUser;

      if (
        state.user.authProvider === 'dummyjson'
      ) {
        user = await authApi.getMe();
      } else {
        const restoredUser =
          await authApi.restoreSupabaseSession();

        if (!restoredUser) {
          throw new Error(
            'Your Supabase session has expired. Please log in again.',
          );
        }

        user = restoredUser;
      }

      const userWithOverrides =
        await applyProfileOverrides(user);

      await authStorage.setUser(
        userWithOverrides,
      );

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: userWithOverrides,
      });
    } catch (error) {
      console.warn(
        'Could not refresh profile information. Keeping the saved session.',
        error,
      );
    }
  }, [state.isAuthenticated, state.user]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        loginDemo,
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
