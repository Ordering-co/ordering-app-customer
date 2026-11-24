import { isLocalSimulatorMode } from '../onboarding/ios-local-mode';
import React, { useState, useEffect, useRef } from 'react';
import { AppState, Alert as NativeAlert, BackHandler, Linking, DeviceEventEmitter, Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { StackActions } from '@react-navigation/native';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import {
  getMessaging,
  getToken,
  deleteToken,
  getInitialNotification,
  onNotificationOpenedApp,
  onMessage,
  onTokenRefresh
} from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from 'react-native-notify-kit';
import { requestNotifications } from 'react-native-permissions';
import NetInfo from '@react-native-community/netinfo'
import { hideSplash } from '../utils/splash';
import { checkStoreUpdate } from '../utils/storeVersion';

import { useSession, useConfig, useApi, useWebsocket, useLanguage, useOrderState, useOrderActions } from '@components';
import { useCookieConsent } from '../contexts/CookieConsentContext';
import * as RootNavigation from '../navigators/NavigationRef';
import settings from '../config.js';

dayjs.extend(isSameOrAfter);
dayjs.extend(utc);

import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Forgot from '../pages/ForgotPassword';
import Home from '../pages/Home';
import IntroductoryTutorial from '../pages/IntroductoryTutorial';
import HomeNavigator from './HomeNavigator';
import NetworkError from '../pages/NetworkError';
import ProjectForm from '../pages/ProjectForm'
import UserVerification from '../pages/UserVerification';
import CompleteProfile from '../pages/CompleteProfile';

import { _retrieveStoreData, _setStoreData, _removeStoreData } from '@ui';
import { useProfileCompletion } from '../contexts/CheckoutFieldsContext';
import {
  findNotificationTokenId,
  getNotificationTokensUrl
} from './oneSignalConsent';
import { oneSignalSmsNumber } from './oneSignalSms';
import { createOneSignalPush, type OneSignalPush, type PushState } from './oneSignalPush';
import { createPushProviderSwitch, getDesiredPushProvider } from './pushProviderSwitch';
import { isFirebasePushEnabled } from './firebasePushConsent';
import { getPushOpenNotificationPlan } from './getPushOpenNotificationPlan';
import { registerPushReferral } from './getPushReferral';
import { subscribeUpdateOrderVibration } from './subscribeUpdateOrderVibration';
import { getMyAccountDeepLinkNavigateArgs } from './getHomeDeepLinkPlan';

const Stack = createStackNavigator();
const RootNavigator = () => {
  const [{ auth, user, loading: sessionLoading, token }] = useSession();
  const orderStatus = useOrderState();
  const { changeMoment, registerReferral } = useOrderActions();
  const [ordering] = useApi()
  const socket = useWebsocket()
  const [{ configs, loading: configsLoading }] = useConfig();
  const [, t] = useLanguage()
  const { hasConsented } = useCookieConsent()
  const [loaded, setLoaded] = useState(false);
  const [productLogin, setProductLogin] = useState<any>({});
  const [orderIdParam, setOrderIdParam] = useState(null)
  const [cartUuidParam, setCartUuidParam] = useState(null)
  const [storeParam, setStoreParam] = useState(null)
  const [productParam, setProductParam] = useState<any>(null)
  const [pendingNotification, setPendingNotification] = useState<any>(null)
  const [generalProjectState, setGeneralProjectState] = useState<{ changed: boolean, setted: boolean }>({ changed: false, setted: false })
  const [oneSignalState, setOneSignalState] = useState<any>({
    notification_app: settings.notification_app,
  });
  const oneSignalPushRef = useRef<OneSignalPush | null>(null)
  const pushProviderSwitchRef = useRef<ReturnType<typeof createPushProviderSwitch> | null>(null)
  const firebaseSetupGenerationRef = useRef(0)
  const didSetupFirebaseRef = useRef(false)
  const firebaseSetupInFlightRef = useRef(false)
  const firebaseUnsubscribersRef = useRef<Array<() => void>>([])
  const notificationTokenRef = useRef<any>(null)
  const showTutorials = settings.show_tutorials;
  const [isTutorial, setTutorial] = useState([true, 1, '1'].includes(showTutorials as any));
  const [tutorialReady, setTutorialReady] = useState(false);
  const [connectionState, setConnectionState] = useState<{
    connection_status: boolean;
  } | null>(null);
  const [appState, setAppState] = useState(AppState.currentState)
  const registerReferralRef = useRef(registerReferral)
  registerReferralRef.current = registerReferral

  const isEmailVerifyRequired = auth && configs?.verification_email_required?.value === '1' && !user?.email_verified
  const isPhoneVerifyRequired = auth && configs?.verification_phone_required?.value === '1' && !user?.phone_verified
  const isUserVerifyRequired = isEmailVerifyRequired || isPhoneVerifyRequired
  const isGuest = user?.guest_id
  const isEnableAppVersionCheck = configs?.app_version?.value === '1'
  const { isRequired: isProfileCompletionRequired } = useProfileCompletion();


  // Every tap on a notification comes here, whoever the user is and whatever
  // the navigation plan does with it: a guest who orders later still counts.
  // Only an opened push gets here; one that merely arrives (onMessage) does not.
  const handleOpenedNotification = (notification: unknown) => {
    registerPushReferral(notification, registerReferralRef.current)
    setPendingNotification(notification)
  }

  const validDate = (date: any) => {
    if (!date) {
      return;
    }
    const _date = dayjs(date, 'YYYY-MM-DD HH:mm').isSameOrAfter(dayjs(), 'day')
      ? dayjs(date).format('YYYY-MM-DD HH:mm')
      : dayjs().format('YYYY-MM-DD HH:mm');
    return _date;
  };

  // OneSignal for this mount of the navigator (it mounts again when the API
  // comes back, src/TemplateApp.tsx): its listeners leave with it.
  useEffect(() => {
    if (isLocalSimulatorMode()) return;
    const oneSignalPush = createOneSignalPush({
      storage: {
        get: _retrieveStoreData,
        set: _setStoreData,
        remove: _removeStoreData
      },
      notificationApp: settings.notification_app,
      onState: (state: PushState | null) => {
        notificationTokenRef.current = state?.notification_token ?? null
        setOneSignalState(state ?? { notification_app: settings.notification_app })
      },
      onNotificationClick: (notification: unknown) => {
        handleOpenedNotification(notification)
      }
    })
    const pushProviderSwitch = createPushProviderSwitch()
    oneSignalPushRef.current = oneSignalPush
    pushProviderSwitchRef.current = pushProviderSwitch
    return () => {
      pushProviderSwitch.stop()
      oneSignalPush.dispose()
      oneSignalPushRef.current = null
      pushProviderSwitchRef.current = null
    }
  }, []);

  // Deletes a token's row in notification_tokens while the session is open
  // (after a logout the API deleted it with the token the logout sent).
  const unregisterNotificationToken = async (notificationToken: string) => {
    const tokensUrl = getNotificationTokensUrl(ordering.root, user?.id)
    if (!token || !notificationToken || !tokensUrl) {
      return
    }
    const response = await fetch(tokensUrl, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
    const content = await response.json()
    const tokenId = findNotificationTokenId(content, notificationToken)
    if (tokenId != null) {
      await fetch(`${tokensUrl}/${tokenId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
    }
  };

  const oneSignalSetup = async () => {
    await oneSignalPushRef.current?.setup({
      appId: configs?.onesignal_orderingapp_id?.value,
      externalId: `${ordering?.project}-${user?.id}`,
      email: user?.email,
      sms: oneSignalSmsNumber(user)
    })
  };

  const oneSignalTeardown = async () => {
    await oneSignalPushRef.current?.teardown(unregisterNotificationToken)
  };

  const firebasePushSetup = async () => {
    const generation = ++firebaseSetupGenerationRef.current
    firebaseSetupInFlightRef.current = true
    const messaging = getMessaging()

    requestNotifications(['alert', 'sound', 'badge']).catch((error) => {
      console.log('Firebase push permission error:', error)
    })

    let fcmToken: string | null = null
    try {
      fcmToken = await getToken(messaging)
    } catch (error) {
      console.log('Firebase push token error:', error)
    }

    if (generation !== firebaseSetupGenerationRef.current) {
      firebaseSetupInFlightRef.current = false
      return;
    }

    const nextState = {
      notification_app: settings.notification_app,
      notification_token: fcmToken,
      notification_provider: 'fcm'
    }
    setOneSignalState(nextState);
    notificationTokenRef.current = fcmToken

    if (fcmToken) {
      _setStoreData('notification_state', nextState);
    }

    if (Platform.OS === 'android') {
      try {
        await notifee.createChannel({
          id: 'orders',
          name: 'Notifications',
          importance: AndroidImportance.HIGH,
          sound: 'default'
        })
      } catch (error) {
        console.log('Firebase push channel error:', error)
      }
    }

    // A setup that runs again (no token the first time) replaces its listeners.
    firebaseUnsubscribersRef.current.forEach(unsubscribe => {
      try {
        unsubscribe()
      } catch (error) {
        console.log('Firebase push unsubscribe error:', error)
      }
    })
    firebaseUnsubscribersRef.current = []
    firebaseUnsubscribersRef.current.push(
      onNotificationOpenedApp(messaging, (remoteMessage: any) => {
        handleOpenedNotification(remoteMessage)
      }),
      onMessage(messaging, async (remoteMessage: any) => {
        if (Platform.OS !== 'android' || !remoteMessage?.notification) {
          return
        }
        try {
          await notifee.displayNotification({
            title: remoteMessage.notification.title,
            body: remoteMessage.notification.body,
            data: remoteMessage.data || {},
            android: {
              channelId: 'orders',
              // The white silhouette Android tints (res/drawable-*/ic_stat_onesignal_default.png, docs/ICONS.md)
              smallIcon: 'ic_stat_onesignal_default',
              pressAction: { id: 'default' },
              sound: 'default'
            }
          })
        } catch (error) {
          console.log('Firebase foreground display error:', error)
        }
      }),
      notifee.onForegroundEvent(({ type, detail }: any) => {
        if (type === EventType.PRESS) {
          handleOpenedNotification({ data: detail?.notification?.data })
        }
      }),
      onTokenRefresh(messaging, (newToken: string) => {
        if (!didSetupFirebaseRef.current) {
          return
        }
        const refreshedState = {
          notification_app: settings.notification_app,
          notification_token: newToken,
          notification_provider: 'fcm'
        }
        setOneSignalState(refreshedState);
        notificationTokenRef.current = newToken
        _setStoreData('notification_state', refreshedState);
      })
    )

    getInitialNotification(messaging)
      .then((remoteMessage: any) => {
        if (remoteMessage) {
          handleOpenedNotification(remoteMessage)
        }
      })
      .catch((error: any) => {
        console.log('Firebase initial notification error:', error)
      })

    didSetupFirebaseRef.current = true
    firebaseSetupInFlightRef.current = false
  };

  const firebasePushTeardown = async ({ keepDeviceToken = false }: { keepDeviceToken?: boolean } = {}) => {
    firebaseSetupGenerationRef.current += 1
    didSetupFirebaseRef.current = false
    firebaseSetupInFlightRef.current = false
    firebaseUnsubscribersRef.current.forEach(unsubscribe => {
      try {
        unsubscribe()
      } catch (error) {
        console.log('Firebase push unsubscribe error:', error)
      }
    })
    firebaseUnsubscribersRef.current = []

    const fcmToken = notificationTokenRef.current || oneSignalState.notification_token
    const tokensUrl = getNotificationTokensUrl(ordering.root, user?.id)
    if (token && fcmToken && tokensUrl) {
      try {
        const response = await fetch(tokensUrl, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })
        const content = await response.json()
        const tokenId = findNotificationTokenId(content, fcmToken)
        if (tokenId != null) {
          await fetch(`${tokensUrl}/${tokenId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          })
        }
      } catch (error) {
        console.log('Firebase token unsubscribe error:', error)
      }
    }

    // On the way to OneSignal the device's FCM token stays: on Android OneSignal
    // sends through that same token (the same Firebase project), and it only
    // asks for a new one when the app starts.
    if (!keepDeviceToken) {
      try {
        await deleteToken(getMessaging())
      } catch (error) {
        console.log('Firebase push teardown error:', error)
      }
    }

    notificationTokenRef.current = null
    setOneSignalState({
      notification_app: settings.notification_app
    })
    _removeStoreData('notification_state')
  };

  // The app is loaded (and the splash hides) once the order data is in. Push
  // setup (the FCM token, a call to Google's servers that takes seconds) runs
  // on its own: a notification that opened the app is handled when it arrives
  // (pendingNotification), not by holding the splash.
  useEffect(() => {
    if (!loaded && !orderStatus.loading) {
      setLoaded(true);
    }
  }, [orderStatus.loading]);

  useEffect(() => {
    const setTutorialLocal = async () => {
      const data = await _retrieveStoreData('isTutorial');
      if (data === false) {
        setTutorial(false);
      }
      setTutorialReady(true);
    };
    setTutorialLocal();
  }, []);

  useEffect(() => {
    if (!sessionLoading && !auth) {
      setLoaded(!auth);
    }
  }, [sessionLoading]);

  useEffect(() => {
    const plan = getPushOpenNotificationPlan({
      loaded,
      auth,
      isProfileCompletionRequired,
      isUserVerifyRequired,
      isGuest,
      notification: pendingNotification
    })
    if (!plan.shouldOpen || !plan.screen) {
      return
    }
    RootNavigation.navigate(plan.screen, plan.params)
    setPendingNotification(null)
  }, [loaded, auth, pendingNotification, isProfileCompletionRequired, isUserVerifyRequired, isGuest]);

  useEffect(() => {
    const _currentDate = dayjs
      .utc(validDate(orderStatus.options?.moment))
      .local();
    if (!_currentDate) {
      return;
    }
    const selected = dayjs(_currentDate, 'YYYY-MM-DD HH:mm');
    const now = dayjs();
    const secondsDiff = selected.diff(now, 'seconds');
    const checkTime = setTimeout(() => {
      changeMoment(null);
    }, secondsDiff * 1000);

    return () => {
      clearTimeout(checkTime);
    };
  }, [orderStatus.options?.moment]);

  useEffect(() => {
    if (isLocalSimulatorMode()) return;
    const oneSignalAppId = configs?.onesignal_orderingapp_id?.value
    const desired = getDesiredPushProvider({
      configsLoading,
      firebaseEnabled: isFirebasePushEnabled(configs),
      oneSignalAppId,
      auth,
      hasConsented
    })
    if (desired === undefined) {
      return
    }
    // One provider at a time: the other one's teardown ends before the setup starts.
    pushProviderSwitchRef.current?.sync(desired, {
      onesignal: {
        setup: oneSignalSetup,
        teardown: oneSignalTeardown,
        isActive: () => !!oneSignalPushRef.current?.isActive()
      },
      fcm: {
        setup: async () => {
          // A OneSignal subscription left from before the project switched to Firebase.
          await oneSignalPushRef.current?.retireStaleSubscription(oneSignalAppId, unregisterNotificationToken)
          // Set up with its token: nothing to do when the configs load again
          // (each time the checkout opens), or its listeners would pile up.
          if (didSetupFirebaseRef.current && notificationTokenRef.current) {
            return
          }
          await firebasePushSetup()
        },
        teardown: () => firebasePushTeardown({ keepDeviceToken: desired === 'onesignal' }),
        isActive: () => didSetupFirebaseRef.current || firebaseSetupInFlightRef.current
      }
    })
  }, [configsLoading, configs?.onesignal_orderingapp_id?.value, configs?.firebase_push_enabled?.value, auth, hasConsented]);

  const subscribePushNotifications = async () => {
    try {
      const url = `${ordering.root}/users/${user.id}/notification_tokens`
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          token: oneSignalState.notification_token,
          user_id: user.id,
          app: oneSignalState.notification_app,
          ...(oneSignalState.notification_provider
            ? { provider: oneSignalState.notification_provider }
            : {})
        })
      })
    } catch (err) {
    }
  }

  useEffect(() => {
    if (auth && hasConsented && oneSignalState.notification_token) {
      subscribePushNotifications()
    }
  }, [oneSignalState.notification_token, auth, hasConsented]);

  let netInfoSuscription: any = null
  useEffect(() => {
    netInfoSuscription = NetInfo.addEventListener(handleConnectivityChange);

    return () => {
      netInfoSuscription && netInfoSuscription()
    }
  }, []);

  const handleConnectivityChange = (state: any) => {
    setConnectionState({ connection_status: state.isConnected });
  };

  useEffect(() => {
    if (!orderStatus.loading) {
      const getCountryCode = async () => {
        const data = await _retrieveStoreData('country-code');
        const localCountryCode = orderStatus?.options?.address?.country_code ?? data

        if (localCountryCode) {
          ordering?.setCountryCode(localCountryCode)
        }
      }

      getCountryCode()
    }
    // Plain values: the order context hands a new object on every render (a storage read each time).
  }, [orderStatus.loading, orderStatus?.options?.address?.country_code])

  useEffect(() => {
    if (!token) return
    return subscribeUpdateOrderVibration(socket)
  }, [socket, user, token])

  useEffect(() => {
    const appStateListener: any = AppState.addEventListener(
      'change',
      nextAppState => { setAppState(nextAppState) },
    );
    return () => {
      appStateListener?.remove();
    };
  }, [])

  // The forced update (server config `app_version` on): checked when the app
  // opens and each time it comes back to the foreground, never while it is in
  // use. The alert cannot be dismissed; back from the store without updating,
  // it shows again. `updateAlertOpen` keeps one alert at a time.
  const updateAlertOpen = useRef(false)
  const checkUpdateNeeded = async () => {
    if (updateAlertOpen.current) return
    try {
      const updateNeeded = await checkStoreUpdate();
      if (!updateNeeded?.isNeeded || updateAlertOpen.current) return
      updateAlertOpen.current = true
      NativeAlert.alert(
        t('PLEASE_UPDATE', 'Please update'),
        t('APP_UPDATE_MESSAGE', 'You will have to update your app to the latest version to continue using.'),
        [
          {
            text: t('UPDATE', 'Update'),
            onPress: () => {
              updateAlertOpen.current = false
              Linking.openURL(updateNeeded.storeUrl)
                .then(() => { if (Platform.OS === 'android') BackHandler.exitApp() })
                // The store did not open: the alert again, never the app.
                .catch(() => checkUpdateNeeded())
            }
          }
        ],
        { cancelable: false }
      )
    } catch (error) {
      updateAlertOpen.current = false
      console.log(error)
    }
  }

  React.useEffect(() => {
    // Not only 'active': at launch the state can still be unknown (iOS).
    if (isEnableAppVersionCheck && appState !== 'background' && appState !== 'inactive') {
      checkUpdateNeeded();
    }
  }, [appState, isEnableAppVersionCheck])

  React.useEffect(() => {
    if (RootNavigation?.navigationRef?.current?.getState) {
      const params = RootNavigation?.navigationRef?.current?.getState()
      const myAccountRoute = params?.routes?.find((route: any) => route.name === 'MyAccount')
      if (myAccountRoute?.state?.routes?.length > 0) {
        myAccountRoute?.state?.routes?.map((route: any) => {
          if (route.params?.orderId) {
            setOrderIdParam(route.params?.orderId)
          }
          if (route.params?.cartUuid) {
            setCartUuidParam(route.params?.cartUuid)
          }
          if (route.params?.store) {
            setStoreParam(route.params?.store)
          }
          if (route.params?.productId && route.params?.categoryId) {
            setProductParam(
              {
                categoryId: route?.params?.categoryId,
                businessId: route?.params?.store,
                productId: route?.params?.productId
              }
            )
          }
        })
      }
    }
    return () => {
      setOrderIdParam(null)
      setCartUuidParam(null)
      setStoreParam(null)
      setProductParam(null)
    }
  }, [RootNavigation?.navigationRef?.current, auth, loaded])

  useEffect(() => {
    const navigateArgs = getMyAccountDeepLinkNavigateArgs({
      orderIdParam,
      cartUuidParam,
      storeParam,
      productParam
    })
    if (!loaded || !navigateArgs) return
    // Back to the main stack (above it there may be Login), with the deep link's params.
    RootNavigation.navigationRef.current?.dispatch(StackActions.popTo(navigateArgs.name, navigateArgs.params, { merge: true }))
  }, [loaded, auth, orderIdParam, cartUuidParam, storeParam, productParam])

  useEffect(() => {
    const getProjectName = async () => {
      const data = await _retrieveStoreData('project_name');
      if (data) {
        setGeneralProjectState((prevState) => ({ ...prevState, setted: true }))
      }
    }
    getProjectName()
  }, [ordering.project])

  useEffect(() => {
    DeviceEventEmitter.addListener('change_project', (newState: any) => {
      setGeneralProjectState(() => newState)
    })
    return () => {
      DeviceEventEmitter.removeAllListeners('change_project')
    }
  }, [])

  const HomeScreen = { component: Home, name: 'Home' }
  const ProjectScreen = { component: ProjectForm, name: 'ProjectForm' }

  const initialScreens = settings?.use_root_point
    ? generalProjectState.setted
      ? [HomeScreen, ProjectScreen]
      : [ProjectScreen, HomeScreen]
    : [HomeScreen]

  useEffect(() => {
    if (loaded && tutorialReady) {
      hideSplash();
    }
  }, [loaded, tutorialReady]);

  if (!tutorialReady) return null;

  const navigatorMode = isProfileCompletionRequired
    ? 'CompleteProfile'
    : isUserVerifyRequired && !isGuest
      ? 'UserVerification'
      : 'MyAccount';

  const initialRouteName = navigatorMode === 'MyAccount' && isTutorial && !auth
    ? 'IntroductoryTutorial'
    : navigatorMode;

  return (
    <Stack.Navigator key={navigatorMode} initialRouteName={initialRouteName}>
      {isProfileCompletionRequired ? (
        <Stack.Screen
          name="CompleteProfile"
          component={CompleteProfile}
          options={{ headerShown: false }}
        />
      ) : isUserVerifyRequired && !isGuest ? (
        <Stack.Screen
          name="UserVerification"
          component={UserVerification}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="MyAccount"
            component={HomeNavigator}
            options={{ headerShown: false }}
            initialParams={{
              productLogin,
              orderIdParam,
              cartUuidParam,
              storeParam,
              productParam,
              notification_state: oneSignalState
            }}
          />
          {!auth && isTutorial && (
            <Stack.Screen
              name="IntroductoryTutorial"
              options={{ headerShown: false }}
            >
              {() => <IntroductoryTutorial onDone={() => setTutorial(false)} />}
            </Stack.Screen>
          )}
          {connectionState?.connection_status && (
            <>
              {initialScreens.map(screen => (
                <Stack.Screen
                  key={screen.name}
                  name={screen.name}
                  component={screen.component}
                  options={{ headerShown: false }}
                />
              ))}
              <Stack.Screen
                name="Login"
                component={Login}
                options={{ headerShown: false }}
                listeners={{
                  state: (e: any) => {
                    const store_slug = e.data?.state?.routes.find(
                      (object: any) => object?.params?.store_slug,
                    )?.params?.store_slug
                    const params = store_slug ? { store_slug } : {}
                    setProductLogin({
                      ...e.data.state.routes.find(
                        (object: any) => object?.params?.product,
                      )?.params?.product,
                      ...params
                    });
                  },
                }}
                initialParams={{ notification_state: oneSignalState, projectChanged: generalProjectState.changed }}
              />
              <Stack.Screen
                name="Signup"
                component={Signup}
                options={{ headerShown: false }}
                initialParams={{ notification_state: oneSignalState, projectChanged: generalProjectState.changed }}
              />
              <Stack.Screen
                name="Forgot"
                component={Forgot}
                options={{ headerShown: false }}
              />
            </>
          )}
          {connectionState?.connection_status === false && (
            <Stack.Screen
              name='NetworkError'
              component={NetworkError}
              options={{ headerShown: false }}
            />
          )}
        </>
      )}
    </Stack.Navigator>
  );
};
export default RootNavigator;
