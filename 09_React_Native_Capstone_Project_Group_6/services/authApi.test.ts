import { authStorage } from '@/utils/storage';
import { AuthApiService } from './authApi';

jest.mock('axios', () => {
  const client = {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };

  return {
    __esModule: true,
    client,
    default: {
      create: jest.fn(() => client),
      get: jest.fn(),
      isAxiosError: jest.fn((error: unknown) => (
        typeof error === 'object'
        && error !== null
        && 'isAxiosError' in error
        && error.isAxiosError === true
      )),
    },
  };
});

jest.mock('@/utils/storage', () => ({
  authStorage: {
    getUser: jest.fn(),
    setUser: jest.fn(),
    clearUser: jest.fn(),
  },
}));

const axiosMock = jest.requireMock('axios') as {
  client: {
    get: jest.Mock;
    post: jest.Mock;
    interceptors: {
      request: { use: jest.Mock };
      response: { use: jest.Mock };
    };
  };
  default: {
    create: jest.Mock;
    get: jest.Mock;
    isAxiosError: jest.Mock;
  };
};
const mockClient = axiosMock.client;
const mockAxiosGet = axiosMock.default.get;

describe('AuthApiService', () => {
  let service: AuthApiService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthApiService();
    mockClient.post.mockResolvedValue({
      data: {
        id: 1,
        username: 'emilys',
        email: 'emily.johnson@x.dummyjson.com',
        firstName: 'Emily',
        lastName: 'Johnson',
        gender: 'female',
        image: 'https://example.com/emily.png',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    });
    jest.mocked(authStorage.setUser).mockResolvedValue();
  });

  it('resolves an email to its account username before login', async () => {
    mockAxiosGet.mockResolvedValue({
      data: { users: [{ username: 'emilys', email: 'emily.johnson@x.dummyjson.com' }] },
    });

    await service.login({ username: 'EMILY.JOHNSON@X.DUMMYJSON.COM', password: 'password' });

    expect(mockAxiosGet).toHaveBeenCalledWith(
      'https://dummyjson.com/users/filter',
      {
        params: {
          key: 'email',
          value: 'emily.johnson@x.dummyjson.com',
          select: 'username,email',
        },
        timeout: 10000,
      }
    );
    expect(mockClient.post).toHaveBeenCalledWith('/login', {
      username: 'emilys',
      password: 'password',
      expiresInMins: 60,
    });
  });

  it('continues to support direct username login', async () => {
    await service.login({ username: 'emilys', password: 'password' });

    expect(mockAxiosGet).not.toHaveBeenCalled();
    expect(mockClient.post).toHaveBeenCalledWith('/login', {
      username: 'emilys',
      password: 'password',
      expiresInMins: 60,
    });
  });

  it.each([
    ['CHRISTINE SIBAYAN', 'christine.sibayan', 'christine.sibayan@demo.local'],
    ['new.person@example.com', 'new.person', 'new.person@example.com'],
  ])('creates a local development session for %s', async (identifier, username, email) => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    try {
      const user = await service.login({ username: identifier, password: 'any-password' });

      expect(user).toMatchObject({ username, email });
      expect(user.id).toBeGreaterThan(0);
      expect(user.token).toMatch(/^cookbook-dev-demo-/);
      expect(mockAxiosGet).not.toHaveBeenCalled();
      expect(mockClient.post).not.toHaveBeenCalled();

      jest.mocked(authStorage.getUser).mockResolvedValue({ ...user, id: 0 });
      await expect(service.getMe()).resolves.toMatchObject({ id: user.id, username, email });
      await expect(service.refreshAccessToken()).resolves.toEqual({
        accessToken: user.token,
        refreshToken: user.refreshToken,
      });
      await expect(service.updateProfile(user.id, {
        firstName: 'Christine',
        lastName: 'Sibayan',
        email,
      })).resolves.toMatchObject({
        firstName: 'Christine',
        lastName: 'Sibayan',
        email,
      });
    } finally {
      process.env.NODE_ENV = previousNodeEnv ?? 'test';
    }
  });

  it('assigns different IDs to different development accounts', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    try {
      const firstUser = await service.login({ username: 'first@example.com', password: 'password' });
      const secondUser = await service.login({ username: 'second@example.com', password: 'password' });

      expect(firstUser.id).not.toBe(secondUser.id);
    } finally {
      process.env.NODE_ENV = previousNodeEnv ?? 'test';
    }
  });

  it('rejects unknown email before sending a login request', async () => {
    mockAxiosGet.mockResolvedValue({ data: { users: [] } });

    await expect(
      service.login({ username: 'unknown@example.com', password: 'password' })
    ).rejects.toThrow('No account was found with that email address.');

    expect(mockClient.post).not.toHaveBeenCalled();
  });

  it('explains invalid credentials instead of exposing the generic 400 response', async () => {
    mockClient.post.mockRejectedValue({
      isAxiosError: true,
      response: { status: 400 },
    });

    await expect(
      service.login({ username: 'emilys', password: 'wrong-password' })
    ).rejects.toThrow('Incorrect email/username or password, or this account is not registered.');
  });
});
