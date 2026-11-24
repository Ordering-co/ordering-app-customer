/* eslint-env jest */
/**
 * Native / third-party mocks for M9 address, gift & integrations UI tests.
 * Import as the first line in each M9 test file.
 */
require('./registerM8NativeMocks')

jest.mock('react-native-country-picker-modal', () => ({
  Flag: (props) => {
    const React = require('react')
    const { View } = require('react-native')
    return React.createElement(View, { testID: 'country-picker-flag', ...props })
  }
}))

jest.mock('@segment/analytics-react-native', () => ({
  createClient: jest.fn(() => ({
    track: jest.fn(),
    identify: jest.fn(),
    config: { writeKey: 'test-segment-key' }
  })),
  AnalyticsProvider: ({ children }) => children
}))

jest.mock('react-native-fbsdk-next', () => ({
  AppEventsLogger: {
    logEvent: jest.fn(),
    logPurchase: jest.fn(),
    AppEvents: {
      CompletedRegistration: 'CompletedRegistration',
      AddedToCart: 'AddedToCart',
      CustomizeProduct: 'CustomizeProduct',
      AddedPaymentInfo: 'AddedPaymentInfo'
    },
    AppEventParams: {
      RegistrationMethod: 'RegistrationMethod',
      Description: 'Description',
      Currency: 'Currency',
      ContentID: 'ContentID',
      ContentType: 'ContentType'
    }
  }
}))

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react')
  const { View } = require('react-native')
  const DateTimePicker = (props) => React.createElement(View, { testID: 'date-picker', ...props })
  return {
    __esModule: true,
    default: DateTimePicker,
    DateTimePickerAndroid: { open: jest.fn(), dismiss: jest.fn() }
  }
})

jest.mock('react-native-google-places-textinput', () => {
  const React = require('react')
  const { View } = require('react-native')
  return (props) => React.createElement(View, { testID: 'google-places-input', ...props })
})
