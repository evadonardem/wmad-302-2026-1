import { authReducer, initialAuthState } from './authReducer';
import type { AuthUser } from '@/types/auth';

const user: AuthUser = {
  id: 1,
  username: 'emilys',
  email: 'emily@example.com',
  firstName: 'Emily',
  lastName: 'Johnson',
  gender: 'female',
  image: 'https://example.com/user.png',
  token: 'access',
  refreshToken: 'refresh',
};

describe('authReducer', () => {
  it('starts in a loading unauthenticated state', () => {
    expect(initialAuthState).toEqual({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
    });
  });

  it('starts an auth request and clears old errors', () => {
    expect(authReducer({ ...initialAuthState, error: 'old error' }, { type: 'AUTH_START' })).toMatchObject({
      isLoading: true,
      error: null,
    });
  });

  it('accepts a user after successful authentication', () => {
    expect(authReducer(initialAuthState, { type: 'AUTH_SUCCESS', payload: user })).toMatchObject({
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  });

  it('clears the user after authentication failure', () => {
    expect(authReducer(initialAuthState, { type: 'AUTH_FAILURE', payload: 'Invalid credentials' })).toMatchObject({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Invalid credentials',
    });
  });

  it('clears auth state on logout', () => {
    expect(authReducer({ ...initialAuthState, user, isAuthenticated: true }, { type: 'AUTH_LOGOUT' })).toMatchObject({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('hydrates with and without a stored user', () => {
    expect(authReducer(initialAuthState, { type: 'AUTH_HYDRATE', payload: user })).toMatchObject({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
    expect(authReducer(initialAuthState, { type: 'AUTH_HYDRATE', payload: null })).toMatchObject({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('updates profile fields without changing tokens', () => {
    const updated = authReducer(
      { ...initialAuthState, user, isAuthenticated: true },
      { type: 'AUTH_UPDATE_USER', payload: { firstName: 'Em' } }
    );
    expect(updated.user).toEqual({ ...user, firstName: 'Em' });
    expect(updated.isAuthenticated).toBe(true);
  });

  it('clears an auth error', () => {
    expect(authReducer({ ...initialAuthState, error: 'failed' }, { type: 'AUTH_CLEAR_ERROR' }).error).toBeNull();
  });
});
