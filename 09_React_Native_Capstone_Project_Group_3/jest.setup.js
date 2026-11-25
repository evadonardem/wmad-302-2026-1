/* eslint-env jest */
/**
 * Global test setup
 */

// In-memory AsyncStorage provided by the library for tests
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Navigation is not under test here: replace expo-router with simple spies
jest.mock('expo-router', () => {
  const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), setParams: jest.fn() };
  return {
    router,
    useRouter: () => router,
    useLocalSearchParams: () => ({}),
    useFocusEffect: jest.fn(),
  };
});
