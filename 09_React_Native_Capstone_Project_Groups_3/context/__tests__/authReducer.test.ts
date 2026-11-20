import { authReducer, initialState } from '../AuthContext';
import { AuthUser } from '@/types/auth';

jest.mock('@/services/authApi', () => ({ authApi: {} }));

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
  it('starts loading (for hydration) and logged out', () => {
    expect(initialState).toEqual({ user: null, isAuthenticated: false, isLoading: true, error: null });
  });

  it('AUTH_START sets loading and clears the error', () => {
    const state = authReducer({ ...initialState, isLoading: false, error: 'old' }, { type: 'AUTH_START' });
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('AUTH_SUCCESS stores the user', () => {
    const state = authReducer(initialState, { type: 'AUTH_SUCCESS', payload: user });
    expect(state).toEqual({ user, isAuthenticated: true, isLoading: false, error: null });
  });

  it('AUTH_FAILURE logs out and keeps the message', () => {
    const loggedIn = authReducer(initialState, { type: 'AUTH_SUCCESS', payload: user });
    const state = authReducer(loggedIn, { type: 'AUTH_FAILURE', payload: 'Invalid credentials' });
    expect(state).toEqual({ user: null, isAuthenticated: false, isLoading: false, error: 'Invalid credentials' });
  });

  it('AUTH_LOGOUT clears the user', () => {
    const loggedIn = authReducer(initialState, { type: 'AUTH_SUCCESS', payload: user });
    expect(authReducer(loggedIn, { type: 'AUTH_LOGOUT' })).toEqual({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('AUTH_HYDRATE logs in when a saved user exists, and out when not', () => {
    expect(authReducer(initialState, { type: 'AUTH_HYDRATE', payload: user }).isAuthenticated).toBe(true);
    const empty = authReducer(initialState, { type: 'AUTH_HYDRATE', payload: null });
    expect(empty.isAuthenticated).toBe(false);
    expect(empty.isLoading).toBe(false);
  });

  it('AUTH_UPDATE_USER merges profile changes', () => {
    const loggedIn = authReducer(initialState, { type: 'AUTH_SUCCESS', payload: user });
    const state = authReducer(loggedIn, { type: 'AUTH_UPDATE_USER', payload: { firstName: 'Em' } });
    expect(state.user?.firstName).toBe('Em');
    expect(state.user?.token).toBe('access');
  });

  it('AUTH_UPDATE_USER does nothing when logged out', () => {
    expect(authReducer(initialState, { type: 'AUTH_UPDATE_USER', payload: { firstName: 'X' } }).user).toBeNull();
  });

  it('AUTH_CLEAR_ERROR clears the error', () => {
    expect(authReducer({ ...initialState, error: 'oops' }, { type: 'AUTH_CLEAR_ERROR' }).error).toBeNull();
  });
});
