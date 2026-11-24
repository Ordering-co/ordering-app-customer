/* eslint-env jest */
/**
 * Native / third-party mocks for M7 reviews & messages UI tests.
 * Import as the first line in each M7 test file.
 */
require('./registerM6NativeMocks')

jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn()
}))

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn()
}))
