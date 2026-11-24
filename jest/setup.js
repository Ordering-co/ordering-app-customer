/**
 * Jest setup file referenced by jest.config.js (`setupFiles`).
 * Registers native-module mocks the React Native preset needs.
 */
/* eslint-env jest */

// Gesture handler ships its own jest setup.
try {
  require('react-native-gesture-handler/jestSetup');
} catch (e) {}

jest.mock('@react-native-vector-icons/ionicons/static', () => 'Icon');
jest.mock('@react-native-vector-icons/material-design-icons/static', () => 'Icon');

// The WebView's native module does not exist under jest (reCAPTCHA, payment pages).
jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  const WebView = (props) => React.createElement(View, { testID: 'webview', ...props });
  return { __esModule: true, default: WebView, WebView };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 })
  };
});

jest.mock('@react-navigation/native', () => ({
  // The real actions (pure objects): the app dispatches them (appNavigation).
  StackActions: jest.requireActual('@react-navigation/routers').StackActions,
  CommonActions: jest.requireActual('@react-navigation/routers').CommonActions,
  NavigationContainer: ({ children }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setOptions: jest.fn()
  }),
  useRoute: () => ({ params: {} }),
  useFocusEffect: jest.fn()
}));

jest.mock('react-native-device-info', () => ({
  getVersion: jest.fn(() => '1.0.0'),
  getBuildNumber: jest.fn(() => '1'),
  getBundleId: jest.fn(() => 'com.test.app')
}));

jest.mock('@intercom/intercom-react-native', () => ({
  loginUserWithUserAttributes: jest.fn(),
  logout: jest.fn()
}));

jest.mock('react-native-restart', () => ({
  restart: jest.fn()
}));

// The native splash (react-native-bootsplash's README mock).
jest.mock('react-native-bootsplash', () => {
  const BootSplash = {
    hide: jest.fn(() => Promise.resolve()),
    isVisible: jest.fn(() => false),
    useHideAnimation: jest.fn(() => ({ container: {}, logo: { source: 0 }, brand: { source: 0 } }))
  };
  return { __esModule: true, default: BootSplash, ...BootSplash };
});
