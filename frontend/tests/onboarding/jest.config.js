/**
 * Jest Configuration for Onboarding Module Tests
 */

module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  testMatch: ['**/tests/onboarding/**/*.test.{ts,tsx}'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo|@expo|@tanstack)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/onboarding/setup.ts'],
  collectCoverageFrom: [
    'features/onboarding/**/*.{ts,tsx}',
    '!features/onboarding/**/*.d.ts',
    '!features/onboarding/**/index.{ts,tsx}',
  ],
  coverageDirectory: '<rootDir>/test_reports/onboarding/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/test_reports/onboarding',
        filename: 'test-report.html',
        pageTitle: 'Onboarding Module Test Report',
        expand: true,
      },
    ],
  ],
  testTimeout: 10000,
  verbose: true,
};
