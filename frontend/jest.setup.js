// Phase 1 · T-0.1b — test-runner setup.
// AsyncStorage's native module is unavailable in the jest environment; use the
// library's official jest mock so suites that transitively import it can run.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
