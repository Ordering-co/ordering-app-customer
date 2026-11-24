/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import * as React from 'react';
import { LogBox, StatusBar } from 'react-native';
import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './navigators/RootNavigator';
import { PermissionsProvider } from './contexts/PermissionsContext';
import { navigationRef } from './navigators/NavigationRef';
import settings from './config.js';
import { isLocalSimulatorMode } from './onboarding/ios-local-mode';
import { isLight } from '@orderingco/ordering-theme-engine/colors';
import { AppThemeProvider, RemoteThemeLoader, readCachedTheme, useAppTheme } from './theme/AppThemeContext';
import { themeColor } from './theme/helpers';
import type { ThemeEnvelope } from './theme/engine';

import { OrderingProvider, useConfig, useSession, useApi } from '@components';

import {
  Toast as OToast,
  CookieConsentBanner,
  StoreMethods,
  SupportBubble,
  AppSplash
} from '@ui';

import { CookieConsentProvider, useCookieConsent, CURRENT_CONSENT_VERSION } from './contexts/CookieConsentContext';
import { ConsentGatedAnalytics } from './contexts/CookieConsentContext/ConsentGatedAnalytics';
import { CheckoutFieldsProvider } from './contexts/CheckoutFieldsContext';
import { ApiConnectionProvider, useApiConnection } from './contexts/ApiConnectionContext';
import { ApiConnectionGate, ConnectionAwareAlert } from './contexts/ApiConnectionContext/ApiConnectionGate';

const { _retrieveStoreData, _removeStoreData } = StoreMethods

LogBox.ignoreLogs([
  'Sending `onAnimatedValueUpdate` with no listeners registered.',
  'Non-serializable values were found in the navigation state.',
  'Setting a timer',
  'The `value` prop is required for the `<Context.Provider>`',
  "Can't perform a React state update",
  'Remote debugger',
  'Task orphaned for request',
  "JSON value '<null>'",
  'VirtualizedLists should never be nested',
  // react-native-google-places-textinput logs what the address form already handles (the legacy
  // API when the key has no Places API (New), or its own message).
  'Error fetching predictions',
  'Error fetching place details',
  'Could not receive settings from Segment',
  'No info about this app',
  'ViewPropTypes will be removed',
  'EdgeInsetsPropTypes will be removed',
  'EdgeInsetsPropType will be removed',
  'PointPropTypes will be removed',
  'PointPropType will be removed',
  'ColorPropType will be removed',
  'seem to have latest app version info',
  'ReactImageView: Image source'
]);


const ConsentConfigSync = () => {
  const [{ configs, loading: configLoading }] = useConfig()
  const { setIsConsentEnabled } = useCookieConsent()

  React.useEffect(() => {
    if (configLoading) return
    const enabled = configs?.cookie_consent_enabled?.value === '1' ||
      (!configs?.cookie_consent_enabled && (settings as any)?.cookie_consent_enabled)
    setIsConsentEnabled(!!enabled)
  }, [configLoading, configs?.cookie_consent_enabled])

  return null
}

const ConsentUserSync = () => {
  const [{ user, token, loading }, { changeUser }] = useSession()
  const [ordering] = useApi()
  const { consentStatus, consentTimestamp, setConsentFromServer, isFromServer, loading: consentLoading } = useCookieConsent()
  const prevUserIdRef = React.useRef<number | null>(null)
  const hasSyncedRef = React.useRef(false)
  const serverSettingsRef = React.useRef<any>(null)

  const saveConsentToServer = async (status: string) => {
    try {
      const currentSettings = serverSettingsRef.current || {}
      const { content: { error, result } }: any = await ordering.setAccessToken(token).users(user.id).save(
        { settings: { ...currentSettings, cookie_consent: { status, version: CURRENT_CONSENT_VERSION, timestamp: new Date().toISOString(), acknowledged: true } } }
      )
      if (!error && result) {
        serverSettingsRef.current = result.settings
        changeUser({ ...user, settings: result.settings })
      }
    } catch (err) {
      console.warn('Failed to save cookie consent to user settings:', err)
    }
  }

  React.useEffect(() => {
    if (loading || consentLoading || !user?.id || !token) {
      prevUserIdRef.current = null
      hasSyncedRef.current = false
      return
    }
    if (prevUserIdRef.current === user.id && hasSyncedRef.current) return
    prevUserIdRef.current = user.id
    hasSyncedRef.current = true

    const syncConsent = async () => {
      try {
        const { content: { error, result } }: any = await ordering.setAccessToken(token).users(user.id).select(['settings']).get()
        if (error) return

        serverSettingsRef.current = result?.settings || {}
        const serverConsent = result?.settings?.cookie_consent

        if (consentStatus !== 'unknown' && serverConsent?.status && serverConsent.status !== 'unknown') {
          const serverTime = serverConsent?.timestamp
          if (consentTimestamp && serverTime && new Date(serverTime) > new Date(consentTimestamp)) {
            if (serverConsent.status !== consentStatus) {
              setConsentFromServer(serverConsent)
            }
          } else if (serverConsent.status !== consentStatus) {
            saveConsentToServer(consentStatus)
          }
        } else if (consentStatus !== 'unknown') {
          saveConsentToServer(consentStatus)
        } else if (serverConsent?.status && serverConsent.status !== 'unknown') {
          setConsentFromServer(serverConsent)
        }
      } catch (err) {
        console.warn('Failed to fetch user settings for cookie consent:', err)
      }
    }

    syncConsent()
  }, [loading, consentLoading, user?.id, token])

  React.useEffect(() => {
    if (loading || !user?.id || !token || consentStatus === 'unknown') return
    if (isFromServer.current) {
      isFromServer.current = false
      return
    }
    if (!hasSyncedRef.current) return
    saveConsentToServer(consentStatus)
  }, [consentStatus])

  return null
}

/**
 * The status bar over the page: its content's color from the theme's
 * background. React Native 0.87 removed `backgroundColor` (the app draws edge
 * to edge on Android too): the page's own background shows under it.
 */
const ThemedStatusBar = () => {
  const theme = useAppTheme()
  const background = themeColor(theme, 'background')
  return (
    <StatusBar
      animated={true}
      barStyle={isLight(background) === false ? 'light-content' : 'dark-content'}
    />
  )
}

// Any answer of the API's configs means it is there (ApiConnectionProvider).
const API_PROBE_URL = `${(settings as any).api.url}/${(settings as any).api.version}/${(settings as any).api.language}/${(settings as any).project}/configs`

/**
 * The logic providers, mounted again (so they load everything anew) each time
 * the API answers after being out of reach; their network-error alerts become
 * a connection check instead of an alert.
 */
const SESSION_CHECK_INTERVAL = 30000

const ReloadingOrderingProvider = ({ settings: orderingSettings, children }: { settings: any, children: React.ReactNode }) => {
  const { generation } = useApiConnection()
  const { hasConsented, isConsentResolved } = useCookieConsent()
  return (
    // The session re-reads storage every 30 s (the default 2 s is the web's sync between tabs;
    // on a phone only the app writes it). Marketing attribution waits for the consent: until it is
    // known the library holds the visit in memory (not part of the key: a flip must not remount).
    <OrderingProvider key={generation} settings={orderingSettings} Alert={ConnectionAwareAlert} noValidateColors sessionCheckInterval={SESSION_CHECK_INTERVAL} referralEnabled={isConsentResolved && hasConsented}>
      {children}
    </OrderingProvider>
  )
}

const TemplateApp = () => {
  const [configStore, setConfigStore] = React.useState({ loading: settings.use_root_point })
  const [configFile, setConfigFile] = React.useState<any>(settings)
  // The last served theme of the project (undefined until it is read): painted from the first frame.
  const [cachedTheme, setCachedTheme] = React.useState<ThemeEnvelope | null | undefined>(undefined)

  const manageProjectAction = async () => {
    let project: any = null
    try {
      setConfigStore({ ...configStore, loading: true })
      if (settings.use_root_point) {
        project = await _retrieveStoreData('project_name')
      } else {
        await _removeStoreData('project_name')
      }

      if (project) {
        setConfigFile({ ...configFile, project })
        configFile.project = project
      }
      setCachedTheme(await readCachedTheme(configFile.project))
      setConfigStore({ ...configFile, loading: false })
    } catch (error) {
      setCachedTheme(null)
      setConfigStore({ ...configFile, loading: false })
    }
  }

  React.useEffect(() => {
    manageProjectAction()
  }, []);


  const linking: LinkingOptions<any> = {
    prefixes: [`${settings.app_scheme}://`],
    config: {
      screens: {
        MyAccount: {
          screens: {
            BottomTab: 'home',
            Business: 'store/:store/:category?/:categoryId?/:product?/:productId?',
            CheckoutPage: 'checkout/:cartUuid',
            OrderDetails: 'order/:orderId'
          }
        },
        NotFound: '*'
      }
    }
  };

  return (
    <SafeAreaProvider>
      {cachedTheme !== undefined && (
        <AppThemeProvider initialEnvelope={cachedTheme}>
          <ThemedStatusBar />
          <ApiConnectionProvider probeUrl={API_PROBE_URL}>
          <CookieConsentProvider>
            {/* No userAgent: every request carries the native one (android/…/co/ordering/app/UserAgent.kt, AppDelegate.swift). */}
            <ReloadingOrderingProvider settings={settings}>
              <RemoteThemeLoader project={configFile.project} appId={settings.app_id} />
              <ConsentConfigSync />
              <ConsentUserSync />
              {!isLocalSimulatorMode() && <ConsentGatedAnalytics />}
              <ApiConnectionGate>
                <NavigationContainer ref={navigationRef} linking={linking}>
                  <CheckoutFieldsProvider>
                    <PermissionsProvider>
                      <RootNavigator />
                      <SupportBubble />
                    </PermissionsProvider>
                  </CheckoutFieldsProvider>
                </NavigationContainer>
              </ApiConnectionGate>
              <CookieConsentBanner />
              <OToast />
            </ReloadingOrderingProvider>
          </CookieConsentProvider>
          </ApiConnectionProvider>
        </AppThemeProvider>
      )}
      {/* Last, over the app: the launch splash's image (image mode) and its safety timeout. */}
      <AppSplash />
    </SafeAreaProvider>
  );
};

export default TemplateApp;
