import { renderHook, waitFor } from '@testing-library/react-native';
import { useShake } from '../useShake';

type Reading = { x: number; y: number; z: number };
// Names must start with "mock" to be used inside jest.mock()
const mockListeners: ((reading: Reading) => void)[] = [];
const mockRemove = jest.fn();

jest.mock('expo-sensors', () => ({
  Accelerometer: {
    isAvailableAsync: jest.fn(() => Promise.resolve(true)),
    setUpdateInterval: jest.fn(),
    addListener: jest.fn((callback: (reading: { x: number; y: number; z: number }) => void) => {
      mockListeners.push(callback);
      return { remove: mockRemove };
    }),
  },
}));

beforeEach(() => {
  mockListeners.length = 0;
  mockRemove.mockClear();
});

describe('useShake', () => {
  it('calls onShake for a strong shake but not for normal movement', async () => {
    const onShake = jest.fn();
    renderHook(() => useShake(onShake));
    await waitFor(() => expect(mockListeners).toHaveLength(1));

    mockListeners[0]({ x: 0, y: 0, z: 1 }); // phone lying still (1g)
    expect(onShake).not.toHaveBeenCalled();

    mockListeners[0]({ x: 2, y: 2, z: 1 }); // strong shake (3g)
    expect(onShake).toHaveBeenCalledTimes(1);

    mockListeners[0]({ x: 2, y: 2, z: 1 }); // within the cooldown: ignored
    expect(onShake).toHaveBeenCalledTimes(1);
  });

  it('stops listening when unmounted', async () => {
    const { unmount } = renderHook(() => useShake(jest.fn()));
    await waitFor(() => expect(mockListeners).toHaveLength(1));
    unmount();
    expect(mockRemove).toHaveBeenCalled();
  });

  it('does not listen when disabled', async () => {
    renderHook(() => useShake(jest.fn(), false));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockListeners).toHaveLength(0);
  });
});
