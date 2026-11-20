/* eslint-env node */
/**
 * Jest configuration
 * - jest-expo preset: runs React Native / Expo code in tests
 * - Coverage is measured on the app logic: context, hooks, services, utils
 */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.expo/'],
  collectCoverageFrom: [
    'context/**/*.{ts,tsx}',
    'hooks/**/*.ts',
    'services/**/*.ts',
    'utils/**/*.ts',
    '!**/__tests__/**',
  ],
};
