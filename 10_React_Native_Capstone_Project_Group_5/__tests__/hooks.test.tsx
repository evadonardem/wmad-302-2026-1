import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useAsyncStorage, useAuthPersistence, useDebounce, useInfiniteScroll, useNetworkStatus } from '@/hooks';

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, isLoading: false, login: jest.fn(), logout: jest.fn(), refreshUser: jest.fn() }),
}));

jest.mock('@/utils/storage', () => ({
  authStorage: { getUser: jest.fn().mockResolvedValue(null) },
  getStorageItem: jest.fn().mockResolvedValue('stored'),
  setStorageItem: jest.fn().mockResolvedValue(undefined),
}));

describe('hooks', () => {
  it('useDebounce returns updated value after delay', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 10), {
      initialProps: { value: 'a' },
    });
    rerender({ value: 'b' });
    await waitFor(() => expect(result.current).toBe('b'));
  });

  it('useInfiniteScroll loads data', async () => {
    const fetcher = jest.fn().mockResolvedValue({ data: [1, 2], hasMore: false });
    const { result } = renderHook(() => useInfiniteScroll(fetcher, 2));
    await act(async () => {
      await result.current.loadMore();
    });
    await waitFor(() => expect(result.current.data).toEqual([1, 2]));
  });

  it('useAuthPersistence resolves hydration', async () => {
    const { result } = renderHook(() => useAuthPersistence());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('useAsyncStorage loads and updates', async () => {
    const { result } = renderHook(() => useAsyncStorage<string>('k', 'init'));
    await waitFor(() => expect(result.current[2]).toBe(false));
    await act(async () => { await result.current[1]('next'); });
    expect(result.current[0]).toBe('next');
  });

  it('useNetworkStatus returns boolean', () => {
    const g = globalThis as unknown as { window?: { addEventListener: jest.Mock; removeEventListener: jest.Mock } };
    const prev = g.window;
    g.window = { addEventListener: jest.fn(), removeEventListener: jest.fn() };
    const { result, unmount } = renderHook(() => useNetworkStatus());
    expect(typeof result.current).toBe('boolean');
    unmount();
    g.window = prev;
  });
});
