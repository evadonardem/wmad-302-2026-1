/**
 * Integration tests for the auth flow through AuthProvider:
 * app start (hydration), login, register, logout, profile updates.
 * The network layer (authApi) is mocked.
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { authApi } from '@/services/authApi';
import { AuthUser } from '@/types/auth';

jest.mock('@/services/authApi', () => ({
  authApi: {
    loadStoredUser: jest.fn(),
    getStoredUser: jest.fn(),
    getMe: jest.fn(),
    setTokens: jest.fn(),
    refreshAccessToken: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
}));

const api = authApi as unknown as Record<keyof typeof authApi, jest.Mock>;

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

const renderAuth = () => renderHook(() => useAuth(), { wrapper: AuthProvider });

beforeEach(() => {
  Object.values(api).forEach((fn) => fn.mockReset());
  api.loadStoredUser.mockResolvedValue(null);
});

describe('AuthProvider - app start', () => {
  it('ends up logged out when nothing is saved', async () => {
    const { result } = renderAuth();
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('restores a saved session and keeps saved profile edits', async () => {
    api.loadStoredUser.mockResolvedValue({ ...user, firstName: 'Em' });
    api.getMe.mockResolvedValue({ ...user, token: undefined, refreshToken: undefined });

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    expect(result.current.user?.firstName).toBe('Em');
    expect(result.current.user?.token).toBe('access');
    expect(api.setTokens).toHaveBeenCalled();
  });

  it('refreshes an expired token on start', async () => {
    api.loadStoredUser.mockResolvedValue(user);
    api.getMe.mockRejectedValueOnce(new Error('401')).mockResolvedValueOnce(user);
    api.refreshAccessToken.mockResolvedValue({ accessToken: 'new', refreshToken: 'new-r' });
    api.getStoredUser.mockReturnValue({ ...user, token: 'new' });

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.user?.token).toBe('new');
  });

  it('logs out when the saved session cannot be refreshed', async () => {
    api.loadStoredUser.mockResolvedValue(user);
    api.getMe.mockRejectedValue(new Error('401'));
    api.refreshAccessToken.mockRejectedValue(new Error('expired'));

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(api.logout).toHaveBeenCalled();
  });
});

describe('AuthProvider - login / register / logout', () => {
  it('logs in with valid credentials', async () => {
    api.login.mockResolvedValue(user);
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('emilys', 'emilyspass');
    });

    expect(api.login).toHaveBeenCalledWith({ username: 'emilys', password: 'emilyspass' });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(user);
  });

  it('shows an error message when login fails', async () => {
    api.login.mockRejectedValue(new Error('Invalid credentials'));
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.login('emilys', 'wrong')).rejects.toThrow('Invalid credentials');
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Invalid credentials');

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });

  it('registers and logs the new user in', async () => {
    api.register.mockResolvedValue({ ...user, username: 'fabro' });
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const data = {
      firstName: 'Fabro',
      lastName: 'Cruz',
      username: 'fabro',
      password: 'secret1',
      email: 'fabro@example.com',
    };
    await act(async () => {
      await result.current.register(data);
    });

    expect(api.register).toHaveBeenCalledWith(data);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.username).toBe('fabro');
  });

  it('shows an error when registration fails', async () => {
    api.register.mockRejectedValue(new Error('Username taken'));
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(
        result.current.register({ firstName: 'a', lastName: 'b', username: 'c', password: 'dddddd', email: 'e@f.g' })
      ).rejects.toThrow('Username taken');
    });
    expect(result.current.error).toBe('Username taken');
  });

  it('logs out and clears tokens', async () => {
    api.login.mockResolvedValue(user);
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.login('emilys', 'emilyspass');
    });

    act(() => result.current.logout());

    expect(api.logout).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('updates the profile and saves it on the device', async () => {
    api.login.mockResolvedValue(user);
    api.getStoredUser.mockReturnValue(user);
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.login('emilys', 'emilyspass');
    });

    act(() => result.current.updateUser({ firstName: 'Em', email: 'em@example.com' }));

    expect(result.current.user?.firstName).toBe('Em');
    expect(api.setTokens).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Em', token: 'access' }));
  });

  it('refreshUser reloads the profile while keeping the tokens', async () => {
    api.login.mockResolvedValue(user);
    api.getMe.mockResolvedValue({ ...user, lastName: 'Updated' });
    api.getStoredUser.mockReturnValue(user);
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.login('emilys', 'emilyspass');
    });

    await act(async () => {
      await result.current.refreshUser();
    });
    expect(result.current.user?.lastName).toBe('Updated');
    expect(result.current.user?.token).toBe('access');
  });
});

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
    spy.mockRestore();
  });
});
