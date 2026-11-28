import { authReducer } from '@/context/AuthContext';
import { AuthState } from '@/types/auth';

const baseState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const user = {
  id: 1,
  username: 'emilys',
  email: 'e@example.com',
  firstName: 'Emily',
  lastName: 'Stone',
  gender: 'female' as const,
  image: 'img',
  token: 't1',
  refreshToken: 'r1',
};

describe('authReducer', () => {
  it('handles auth start and success', () => {
    const started = authReducer(baseState, { type: 'AUTH_START' });
    expect(started.isLoading).toBe(true);
    const success = authReducer(started, { type: 'AUTH_SUCCESS', payload: user });
    expect(success.isAuthenticated).toBe(true);
    expect(success.user?.username).toBe('emilys');
  });

  it('handles failure, logout, clear error', () => {
    const failed = authReducer(baseState, { type: 'AUTH_FAILURE', payload: 'Bad creds' });
    expect(failed.error).toBe('Bad creds');
    expect(failed.isAuthenticated).toBe(false);

    const loggedIn: AuthState = { ...baseState, user, isAuthenticated: true };
    const loggedOut = authReducer(loggedIn, { type: 'AUTH_LOGOUT' });
    expect(loggedOut.user).toBeNull();

    const cleared = authReducer(failed, { type: 'AUTH_CLEAR_ERROR' });
    expect(cleared.error).toBeNull();
  });

  it('hydrates and updates user', () => {
    const hydrated = authReducer({ ...baseState, isLoading: true }, { type: 'AUTH_HYDRATE', payload: user });
    expect(hydrated.isLoading).toBe(false);
    expect(hydrated.isAuthenticated).toBe(true);

    const updated = authReducer(hydrated, { type: 'AUTH_UPDATE_USER', payload: { firstName: 'Em' } });
    expect(updated.user?.firstName).toBe('Em');
  });
});
