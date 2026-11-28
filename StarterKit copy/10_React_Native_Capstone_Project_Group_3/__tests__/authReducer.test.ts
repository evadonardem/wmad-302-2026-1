import { authReducer, initialAuthState } from '@/context/authReducer';
import type { AuthUser } from '@/types/auth';

const user: AuthUser = {
  id: 1,
  username: 'emilys',
  email: 'emily@example.com',
  firstName: 'Emily',
  lastName: 'Johnson',
  gender: 'female',
  image: '',
  token: 'access',
  refreshToken: 'refresh',
};

describe('authReducer', () => {
  it('starts loading and clears errors on AUTH_START', () => {
    const state = authReducer({ ...initialAuthState, isLoading: false, error: 'old' }, { type: 'AUTH_START' });
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('stores the user on AUTH_SUCCESS', () => {
    const state = authReducer(initialAuthState, { type: 'AUTH_SUCCESS', payload: user });
    expect(state).toMatchObject({ user, isAuthenticated: true, isLoading: false, error: null });
  });

  it('records the error on AUTH_FAILURE', () => {
    const state = authReducer(initialAuthState, { type: 'AUTH_FAILURE', payload: 'Invalid credentials' });
    expect(state).toMatchObject({ user: null, isAuthenticated: false, isLoading: false, error: 'Invalid credentials' });
  });

  it('clears the user on AUTH_LOGOUT', () => {
    const loggedIn = authReducer(initialAuthState, { type: 'AUTH_SUCCESS', payload: user });
    expect(authReducer(loggedIn, { type: 'AUTH_LOGOUT' })).toMatchObject({ user: null, isAuthenticated: false });
  });

  it('hydrates with or without a stored user', () => {
    expect(authReducer(initialAuthState, { type: 'AUTH_HYDRATE', payload: user }).isAuthenticated).toBe(true);
    const empty = authReducer(initialAuthState, { type: 'AUTH_HYDRATE', payload: null });
    expect(empty.isAuthenticated).toBe(false);
    expect(empty.isLoading).toBe(false);
  });

  it('merges profile changes on AUTH_UPDATE_USER', () => {
    const loggedIn = authReducer(initialAuthState, { type: 'AUTH_SUCCESS', payload: user });
    const state = authReducer(loggedIn, { type: 'AUTH_UPDATE_USER', payload: { firstName: 'Em' } });
    expect(state.user?.firstName).toBe('Em');
    expect(state.user?.token).toBe('access');
  });

  it('ignores AUTH_UPDATE_USER when signed out', () => {
    expect(authReducer(initialAuthState, { type: 'AUTH_UPDATE_USER', payload: { firstName: 'X' } }).user).toBeNull();
  });

  it('clears the error on AUTH_CLEAR_ERROR', () => {
    const failed = authReducer(initialAuthState, { type: 'AUTH_FAILURE', payload: 'oops' });
    expect(authReducer(failed, { type: 'AUTH_CLEAR_ERROR' }).error).toBeNull();
  });
});
