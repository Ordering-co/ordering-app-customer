/* eslint-env jest */
/**
 * Native / third-party mocks for M4 menu, products & cart UI tests.
 * Import as the first line in each M4 test file.
 */
require('./registerM3NativeMocks')

jest.mock('react-native-uuid', () => ({
  v4: () => 'test-uuid-1'
}))

jest.mock('dayjs', () => {
  const actual = jest.requireActual('dayjs')
  return actual
})
