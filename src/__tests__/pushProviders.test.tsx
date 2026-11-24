import React from 'react'
import { act, render, waitFor } from '@testing-library/react-native'

import RootNavigator from '../navigators/RootNavigator'

/**
 * The root navigator's push registration against the two providers: what it
 * registers in notification_tokens, what it leaves in the storage for the
 * logout, and the change of provider while the app is open.
 */

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({ Navigator: () => null, Screen: () => null })
}))

const mockStore: Record<string, any> = {}
jest.mock('@ui', () => ({
  _retrieveStoreData: jest.fn(async (key: string) => mockStore[key]),
  _setStoreData: jest.fn((key: string, value: any) => { mockStore[key] = value }),
  _removeStoreData: jest.fn((key: string) => { delete mockStore[key] }),
  _clearStoreData: jest.fn()
}))

const quietPage = () => null
jest.mock('../navigators/HomeNavigator', () => quietPage)
jest.mock('../pages/Login', () => quietPage)
jest.mock('../pages/Signup', () => quietPage)
jest.mock('../pages/ForgotPassword', () => quietPage)
jest.mock('../pages/Home', () => quietPage)
jest.mock('../pages/IntroductoryTutorial', () => quietPage)
jest.mock('../pages/NetworkError', () => quietPage)
jest.mock('../pages/ProjectForm', () => quietPage)
jest.mock('../pages/UserVerification', () => quietPage)
jest.mock('../pages/CompleteProfile', () => quietPage)

jest.mock('react-native-onesignal', () => require('../../jest/helpers/mockOneSignal'))

const mockFirebase = { token: 'fcm-1' as string | null, calls: [] as string[] }
jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn(async () => {
    mockFirebase.calls.push('getToken')
    return mockFirebase.token
  }),
  deleteToken: jest.fn(async () => {
    mockFirebase.calls.push('deleteToken')
  }),
  getInitialNotification: jest.fn(async () => null),
  onNotificationOpenedApp: jest.fn(() => jest.fn()),
  onMessage: jest.fn(() => jest.fn()),
  onTokenRefresh: jest.fn(() => jest.fn())
}))

jest.mock('react-native-notify-kit', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn(),
    displayNotification: jest.fn(),
    onForegroundEvent: jest.fn(() => jest.fn()),
    onBackgroundEvent: jest.fn()
  },
  AndroidImportance: { HIGH: 4 },
  EventType: { PRESS: 1 }
}))

jest.mock('react-native-permissions', () => ({
  requestNotifications: jest.fn(async () => ({ status: 'granted' }))
}))

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: (handler: (state: { isConnected: boolean }) => void) => {
    handler({ isConnected: true })
    return () => undefined
  }
}))

jest.mock('../utils/storeVersion', () => ({
  checkStoreUpdate: jest.fn(async () => ({ isNeeded: false }))
}))

const ordering = require('@components')
const mockOneSignal = require('react-native-onesignal')

const TOKENS_URL = 'https://example.test/users/7/notification_tokens'
const oneSignalConfigs = { onesignal_orderingapp_id: { value: 'app-1' }, firebase_push_enabled: { value: '0' } }
const firebaseConfigs = { onesignal_orderingapp_id: { value: 'app-1' }, firebase_push_enabled: { value: '1' } }
const oneSignalState = { notification_app: 'orderingapp', notification_token: 'sub-1', notification_provider: 'onesignal' }
const firebaseState = { notification_app: 'orderingapp', notification_token: 'fcm-1', notification_provider: 'fcm' }

type Row = { id: number, token: string }

describe('root navigator push registration', () => {
  // The rows of notification_tokens, as the API would keep them.
  let rows: Row[]
  let requests: string[]
  let holdDelete: null | Promise<void>

  const useConfigs = (configs: object) => {
    ordering.useConfig.mockReturnValue([{ loading: false, configs }])
  }

  const registeredBodies = () => (global.fetch as jest.Mock).mock.calls
    .filter(([url, options]) => url === TOKENS_URL && options?.method === 'POST')
    .map(([, options]) => JSON.parse(options.body))

  beforeEach(() => {
    jest.clearAllMocks()
    mockOneSignal.__reset()
    Object.keys(mockStore).forEach(key => delete mockStore[key])
    mockStore.isTutorial = false
    mockFirebase.token = 'fcm-1'
    mockFirebase.calls = []
    rows = []
    requests = []
    holdDelete = null
    jest.spyOn(console, 'log').mockImplementation(() => {})

    ordering.useSession.mockReturnValue([
      {
        auth: true,
        token: 'session-token',
        loading: false,
        user: { id: 7, email: 'ana@example.test', cellphone: '3008282222', country_phone_code: '57', email_verified: true, phone_verified: true }
      },
      { login: jest.fn() }
    ])
    ordering.useOrder.mockReturnValue([
      { loading: false, carts: [], options: {} },
      { changeMoment: jest.fn(), handleOrderStateLoading: jest.fn() }
    ])
    ordering.useApi.mockReturnValue([{ project: 'demo', root: 'https://example.test', setCountryCode: jest.fn() }, {}])
    useConfigs(oneSignalConfigs)

    global.fetch = jest.fn(async (url: string, options: any = {}) => {
      const method = options.method || 'GET'
      if (method === 'POST') {
        const body = JSON.parse(options.body)
        rows.push({ id: rows.length + 1, token: body.token })
        requests.push(`POST ${body.provider}:${body.token}`)
      } else if (method === 'DELETE') {
        if (holdDelete) {
          await holdDelete
        }
        const id = Number(String(url).split('/').pop())
        const row = rows.find(item => item.id === id)
        rows = rows.filter(item => item.id !== id)
        requests.push(`DELETE ${row?.token}`)
      }
      return { json: async () => ({ result: [...rows] }) }
    }) as any
  })

  it('registers the OneSignal subscription with its provider', async () => {
    mockOneSignal.__answers.subscriptionId = 'sub-1'

    render(<RootNavigator />)

    await waitFor(() => expect(registeredBodies()).toEqual([
      { token: 'sub-1', user_id: 7, app: 'orderingapp', provider: 'onesignal' }
    ]))
    expect(mockOneSignal.__calls.slice(0, 2)).toEqual(['setLogLevel:6', 'initialize:app-1'])
    expect(mockOneSignal.__calls).toEqual(expect.arrayContaining([
      'login:demo-7',
      'addEmail:ana@example.test',
      'addSms:+573008282222'
    ]))
    expect(mockStore.notification_state).toEqual(oneSignalState)
  })

  it('leaves the id that arrives later in the storage the logout reads', async () => {
    mockOneSignal.__answers.subscriptionId = null
    render(<RootNavigator />)
    await waitFor(() => expect(mockOneSignal.__listeners.change.size).toBe(1))
    expect(mockStore.notification_state).toBeUndefined()

    await act(async () => {
      mockOneSignal.__emit('change', { current: { id: 'sub-1', optedIn: true } })
    })

    await waitFor(() => expect(registeredBodies()).toHaveLength(1))
    expect(mockStore.notification_state).toEqual(oneSignalState)
  })

  it('does not set OneSignal up again when the configs load again', async () => {
    mockOneSignal.__answers.subscriptionId = 'sub-1'
    const view = render(<RootNavigator />)
    await waitFor(() => expect(registeredBodies()).toHaveLength(1))
    const calls = [...mockOneSignal.__calls]

    // The checkout opened: the configs load again.
    ordering.useConfig.mockReturnValue([{ loading: true, configs: oneSignalConfigs }])
    view.rerender(<RootNavigator />)
    useConfigs({ ...oneSignalConfigs })
    view.rerender(<RootNavigator />)
    await act(async () => {})

    expect(mockOneSignal.__calls).toEqual(calls)
    expect(registeredBodies()).toHaveLength(1)
  })

  it('removes its OneSignal listeners when it unmounts, and adds one set when it mounts again', async () => {
    mockOneSignal.__answers.subscriptionId = 'sub-1'
    const first = render(<RootNavigator />)
    await waitFor(() => expect(mockOneSignal.__listeners.click.size).toBe(1))

    // The API came back: the providers and the navigator mount again.
    first.unmount()
    expect(mockOneSignal.__listeners.click.size).toBe(0)
    expect(mockOneSignal.__listeners.change.size).toBe(0)
    expect(mockOneSignal.__listeners.permissionChange.size).toBe(0)

    render(<RootNavigator />)
    await waitFor(() => expect(mockOneSignal.__listeners.click.size).toBe(1))
    expect(mockOneSignal.__listeners.change.size).toBe(1)
    expect(mockOneSignal.__listeners.permissionChange.size).toBe(1)
  })

  it('from OneSignal to Firebase with the app open: the Firebase token stays registered', async () => {
    mockOneSignal.__answers.subscriptionId = 'sub-1'
    const view = render(<RootNavigator />)
    await waitFor(() => expect(requests).toEqual(['POST onesignal:sub-1']))
    let release: () => void = () => {}
    holdDelete = new Promise<void>((resolve) => { release = resolve })

    useConfigs(firebaseConfigs)
    view.rerender(<RootNavigator />)

    // OneSignal is opted out, its row is still being deleted: Firebase waits.
    await waitFor(() => expect(mockOneSignal.__calls.slice(-2)).toEqual(['optOut', 'logout']))
    await act(async () => {})
    expect(mockFirebase.calls).toEqual([])

    await act(async () => { release() })
    await waitFor(() => expect(requests).toEqual([
      'POST onesignal:sub-1',
      'DELETE sub-1',
      'POST fcm:fcm-1'
    ]))
    await act(async () => {})
    expect(mockStore.notification_state).toEqual(firebaseState)
    expect(rows.map(row => row.token)).toEqual(['fcm-1'])
  })

  it('from Firebase to OneSignal with the app open: the subscription is registered as OneSignal', async () => {
    mockOneSignal.__answers.subscriptionId = 'sub-1'
    useConfigs(firebaseConfigs)
    const view = render(<RootNavigator />)
    await waitFor(() => expect(requests).toEqual(['POST fcm:fcm-1']))
    expect(mockStore.notification_state).toEqual(firebaseState)
    let release: () => void = () => {}
    holdDelete = new Promise<void>((resolve) => { release = resolve })

    useConfigs(oneSignalConfigs)
    view.rerender(<RootNavigator />)

    // The Firebase row is still being deleted: OneSignal waits.
    await act(async () => {})
    expect(mockOneSignal.__calls).toEqual([])

    await act(async () => { release() })
    await waitFor(() => expect(requests).toEqual([
      'POST fcm:fcm-1',
      'DELETE fcm-1',
      'POST onesignal:sub-1'
    ]))
    await act(async () => {})
    // The device's FCM token is kept: on Android OneSignal sends through it.
    expect(mockFirebase.calls).toEqual(['getToken'])
    expect(mockStore.notification_state).toEqual(oneSignalState)
    expect(rows.map(row => row.token)).toEqual(['sub-1'])
  })

  it('opening in Firebase mode opts a OneSignal subscription left from before out, once', async () => {
    useConfigs(firebaseConfigs)
    // What a build in OneSignal mode left (v4 wrote no provider).
    mockStore.notification_state = { notification_app: 'orderingapp', notification_token: 'player-1' }
    rows = [{ id: 1, token: 'player-1' }]

    const view = render(<RootNavigator />)

    await waitFor(() => expect(requests).toEqual(['DELETE player-1', 'POST fcm:fcm-1']))
    expect(mockOneSignal.__calls).toEqual(['setLogLevel:6', 'initialize:app-1', 'optOut', 'logout'])
    expect(mockStore.notification_state).toEqual(firebaseState)

    ordering.useConfig.mockReturnValue([{ loading: true, configs: firebaseConfigs }])
    view.rerender(<RootNavigator />)
    useConfigs({ ...firebaseConfigs })
    view.rerender(<RootNavigator />)
    await act(async () => {})
    expect(mockOneSignal.__calls).toHaveLength(4)
  })

  it('does not set Firebase up again when the configs load again', async () => {
    const messaging = require('@react-native-firebase/messaging')
    const notifee = require('react-native-notify-kit').default
    useConfigs(firebaseConfigs)
    const view = render(<RootNavigator />)
    await waitFor(() => expect(requests).toEqual(['POST fcm:fcm-1']))

    // The checkout opened, twice: the configs load again each time.
    for (let i = 0; i < 2; i++) {
      ordering.useConfig.mockReturnValue([{ loading: true, configs: firebaseConfigs }])
      view.rerender(<RootNavigator />)
      useConfigs({ ...firebaseConfigs })
      view.rerender(<RootNavigator />)
      await act(async () => {})
    }

    // One set of listeners: with more, a push in the foreground shows several times.
    expect(messaging.onMessage).toHaveBeenCalledTimes(1)
    expect(messaging.onNotificationOpenedApp).toHaveBeenCalledTimes(1)
    expect(messaging.onTokenRefresh).toHaveBeenCalledTimes(1)
    expect(notifee.onForegroundEvent).toHaveBeenCalledTimes(1)
    expect(mockFirebase.calls).toEqual(['getToken'])
    expect(requests).toEqual(['POST fcm:fcm-1'])
  })

  it('asks Firebase for the token again when it had none, with one set of listeners', async () => {
    const messaging = require('@react-native-firebase/messaging')
    const stopFirst = jest.fn()
    messaging.onMessage.mockReturnValueOnce(stopFirst)
    mockFirebase.token = null
    useConfigs(firebaseConfigs)
    const view = render(<RootNavigator />)
    await waitFor(() => expect(messaging.onMessage).toHaveBeenCalledTimes(1))
    await act(async () => {})
    expect(requests).toEqual([])

    mockFirebase.token = 'fcm-1'
    ordering.useConfig.mockReturnValue([{ loading: true, configs: firebaseConfigs }])
    view.rerender(<RootNavigator />)
    useConfigs({ ...firebaseConfigs })
    view.rerender(<RootNavigator />)

    await waitFor(() => expect(requests).toEqual(['POST fcm:fcm-1']))
    expect(messaging.onMessage).toHaveBeenCalledTimes(2)
    expect(stopFirst).toHaveBeenCalledTimes(1)
  })

  it('a logout in Firebase mode deletes the device token', async () => {
    useConfigs(firebaseConfigs)
    const view = render(<RootNavigator />)
    await waitFor(() => expect(mockStore.notification_state).toEqual(firebaseState))

    ordering.useSession.mockReturnValue([{ auth: false, user: null, token: null, loading: false }, { login: jest.fn() }])
    view.rerender(<RootNavigator />)

    await waitFor(() => expect(mockFirebase.calls).toEqual(['getToken', 'deleteToken']))
    await waitFor(() => expect(mockStore.notification_state).toBeUndefined())
    expect(mockOneSignal.__calls).toEqual([])
  })

  it('a logout opts OneSignal out and leaves no token behind', async () => {
    mockOneSignal.__answers.subscriptionId = 'sub-1'
    const view = render(<RootNavigator />)
    await waitFor(() => expect(mockStore.notification_state).toEqual(oneSignalState))

    ordering.useSession.mockReturnValue([{ auth: false, user: null, token: null, loading: false }, { login: jest.fn() }])
    view.rerender(<RootNavigator />)

    await waitFor(() => expect(mockOneSignal.__calls.slice(-2)).toEqual(['optOut', 'logout']))
    await waitFor(() => expect(mockStore.notification_state).toBeUndefined())
  })
})
