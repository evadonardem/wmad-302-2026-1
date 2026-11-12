
/**
 * Auth Context with useReducer
 * Handles authentication, persistence hydration, token refresh,
 * and locally saved profile updates.
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
import { authStorage, ProfileOverrides } from '@/utils/storage';

type ProfileUpdates = Partial<ProfileOverrides>;

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(
  state: AuthState,
  action: AuthAction
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

  updateUser: (updates: ProfileUpdates) => Promise<void>;

  clearError: () => void;

  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(
    authReducer,
    initialState
  );

  // Restore authentication and locally saved profile information.
  useEffect(() => {
    const hydrateAuth = async () => {
      try {
        const storedUser = await authApi.getStoredUser();

        if (storedUser?.token && storedUser?.refreshToken) {
          try {
            const freshUser = await authApi.getMe();

            const profileOverrides =
              await authStorage.getProfileOverrides(storedUser.id);

            const mergedUser: AuthUser = {
              ...freshUser,
              ...(profileOverrides ?? {}),
              token: storedUser.token,
              refreshToken: storedUser.refreshToken,
            };

            await authStorage.setUser(mergedUser);

            dispatch({
              type: 'AUTH_HYDRATE',
              payload: mergedUser,
            });
          } catch {
            try {
              await authApi.refreshAccessToken();

              const storedAgain =
                await authApi.getStoredUser();

              if (!storedAgain) {
                throw new Error('Stored user not found.');
              }

              const profileOverrides =
                await authStorage.getProfileOverrides(
                  storedAgain.id
                );

              const mergedUser: AuthUser = {
                ...storedAgain,
                ...(profileOverrides ?? {}),
              };

              await authStorage.setUser(mergedUser);

              dispatch({
                type: 'AUTH_HYDRATE',
                payload: mergedUser,
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

    void hydrateAuth();
  }, []);

  // Login and restore profile edits belonging to this account.
  const login = useCallback(
    async (username: string, password: string) => {
      dispatch({ type: 'AUTH_START' });

      try {
        const apiUser = await authApi.login({
          username,
          password,
        });

        const profileOverrides =
          await authStorage.getProfileOverrides(apiUser.id);

        const user: AuthUser = {
          ...apiUser,
          ...(profileOverrides ?? {}),
        };

        await authStorage.setUser(user);

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

  // Logout. Profile overrides are intentionally retained locally.
  const logout = useCallback(async () => {
    await authApi.logout();

    dispatch({
      type: 'AUTH_LOGOUT',
    });
  }, []);

  // Update profile and save changes separately from API data.
  const updateUser = useCallback(
    async (updates: ProfileUpdates) => {
      if (!state.user) {
        throw new Error('No authenticated user found.');
      }

      const updatedUser: AuthUser = {
        ...state.user,
        ...updates,
      };

      const profileOverrides: ProfileOverrides = {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        username: updatedUser.username,
        email: updatedUser.email,
      };

      await authStorage.setProfileOverrides(
        state.user.id,
        profileOverrides
      );

      await authStorage.setUser(updatedUser);

      dispatch({
        type: 'AUTH_UPDATE_USER',
        payload: updates,
      });
    },
    [state.user]
  );

  // Clear authentication error.
  const clearError = useCallback(() => {
    dispatch({
      type: 'AUTH_CLEAR_ERROR',
    });
  }, []);

  // Refresh current user while preserving local profile edits.
  const refreshUser = useCallback(async () => {
    if (!state.isAuthenticated) {
      return;
    }

    try {
      const freshUser = await authApi.getMe();
      const storedUser = await authApi.getStoredUser();

      if (!storedUser) {
        return;
      }

      const profileOverrides =
        await authStorage.getProfileOverrides(storedUser.id);

      const mergedUser: AuthUser = {
        ...freshUser,
        ...(profileOverrides ?? {}),
        token: storedUser.token,
        refreshToken: storedUser.refreshToken,
      };

      await authStorage.setUser(mergedUser);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: mergedUser,
      });
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
        updateUser,
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
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
}

export { AuthContext };
