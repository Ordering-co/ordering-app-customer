import { CommonActions, StackActions } from '@react-navigation/native'
import { renderHook } from '@testing-library/react-native'
import { enterApp, goHome, leaveApp, openScreen, plainParams, preorderParams, redirectWith, returnTo, useLeaveAppOnLogout, useSendResult } from '../appNavigation'

type Route = string | { name: string, params?: any }

/** A stack's navigation: the screens it has (`routeNames`) and the ones open (`routes`). */
const nav = (routeNames: string[], routes: Route[], parent?: any) => ({
  getState: () => ({ routeNames, routes: routes.map(r => typeof r === 'string' ? { name: r } : r) }),
  getParent: () => parent,
  dispatch: jest.fn(),
  navigate: jest.fn(),
  reset: jest.fn()
})
const ROOT = ['MyAccount', 'Home', 'Login', 'Signup', 'Forgot']
const MAIN = ['Home', 'BottomTab', 'Business', 'CheckoutPage', 'Cart', 'AddressList', 'OrderDetails']
const TABS = ['Home', 'Offers', 'BusinessSearch', 'MyOrders', 'Profile']

describe('appNavigation', () => {
  it('goes back to the tabs instead of stacking them again', () => {
    const n = nav(MAIN, ['BottomTab', 'OrderDetails'])
    goHome(n, { screen: 'MyOrders' })
    expect(n.dispatch).toHaveBeenCalledWith(StackActions.popTo('BottomTab', { screen: 'MyOrders' }, { merge: false }))
    expect(n.navigate).not.toHaveBeenCalled()
  })

  it('opens the tabs when they are not open yet (the landing)', () => {
    const n = nav(MAIN, ['Home'])
    goHome(n, { screen: 'Home' })
    expect(n.navigate).toHaveBeenCalledWith('BottomTab', { screen: 'Home' })
  })

  it('makes the tabs the stack when a deep link opened the app on a screen of its own', () => {
    const n = nav(MAIN, [{ name: 'OrderDetails', params: { orderId: 'o1' } }])
    goHome(n, { screen: 'MyOrders' })
    expect(n.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'BottomTab', params: { screen: 'MyOrders' } }] })
    expect(n.navigate).not.toHaveBeenCalled()
  })

  it('from a tab, acts on the stack that holds the tabs', () => {
    const stack = nav(MAIN, ['BottomTab', 'OrderDetails'])
    const tab = nav(TABS, ['Home'], stack)
    goHome(tab)
    expect(stack.dispatch).toHaveBeenCalledWith(StackActions.popTo('BottomTab', undefined, { merge: false }))
    expect(tab.dispatch).not.toHaveBeenCalled()
  })

  it('from the root stack, goes home through the main stack', () => {
    const n = nav(ROOT, ['MyAccount', 'Login'])
    goHome(n, { screen: 'Home' })
    expect(n.dispatch).toHaveBeenCalledWith(StackActions.popTo('MyAccount', { screen: 'BottomTab', params: { screen: 'Home' } }, { merge: false }))
  })

  it('returns to a screen below keeping its params, and opens it on top when it is not there', () => {
    const n = nav(MAIN, ['BottomTab', { name: 'CheckoutPage', params: { cartUuid: 'c1' } }, 'Cart'])
    returnTo(n, 'CheckoutPage', { cartUuid: 'c1' })
    expect(n.dispatch).toHaveBeenCalledWith(StackActions.popTo('CheckoutPage', { cartUuid: 'c1' }, { merge: true }))
    const m = nav(MAIN, ['BottomTab'])
    returnTo(m, 'CheckoutPage', { cartUuid: 'c1' })
    expect(m.navigate).toHaveBeenCalledWith('CheckoutPage', { cartUuid: 'c1' })
    expect(m.dispatch).not.toHaveBeenCalled()
  })

  it('goes back to the same store, and opens another store on top', () => {
    const n = nav(MAIN, ['BottomTab', { name: 'Business', params: { store: 'a' } }, 'Cart'])
    openScreen(n, 'Business', { store: 'a' })
    expect(n.dispatch).toHaveBeenCalledWith(StackActions.popTo('Business', { store: 'a' }, { merge: true }))
    openScreen(n, 'Business', { store: 'b' })
    expect(n.navigate).toHaveBeenCalledWith('Business', { store: 'b' })
  })

  it('opens any other screen with navigate', () => {
    const n = nav(MAIN, ['BottomTab'])
    openScreen(n, 'AddressList', { a: 1 })
    expect(n.navigate).toHaveBeenCalledWith('AddressList', { a: 1 })
    expect(n.dispatch).not.toHaveBeenCalled()
  })

  it('opens a main-stack screen from the root stack inside MyAccount, without a second MyAccount', () => {
    const n = nav(ROOT, ['MyAccount', 'Login'])
    openScreen(n, 'AddressList', { a: 1 })
    expect(n.dispatch).toHaveBeenCalledWith(StackActions.popTo('MyAccount', { screen: 'AddressList', params: { a: 1 } }, { merge: false }))
    expect(n.navigate).not.toHaveBeenCalled()
  })

  it('opens a root screen from the root stack with navigate', () => {
    const n = nav(ROOT, ['MyAccount'])
    openScreen(n, 'Forgot')
    expect(n.navigate).toHaveBeenCalledWith('Forgot', undefined)
  })

  it('sends BottomTab redirects home, and ignores an empty route', () => {
    const n = nav(MAIN, ['BottomTab', 'Cart'])
    const redirect = redirectWith(n)
    redirect('BottomTab')
    redirect('')
    expect(n.dispatch).toHaveBeenCalledTimes(1)
    expect(n.navigate).not.toHaveBeenCalled()
  })

  it('works from the container ref (getRootState)', () => {
    const n = { getRootState: () => ({ routeNames: ROOT, routes: [{ name: 'MyAccount' }] }), dispatch: jest.fn(), navigate: jest.fn() }
    openScreen(n, 'OrderDetails', { orderId: 1 })
    expect(n.dispatch).toHaveBeenCalledWith(StackActions.popTo('MyAccount', { screen: 'OrderDetails', params: { orderId: 1 } }, { merge: false }))
  })

  it('after login, leaves only the app on its first screen', () => {
    const n = nav(ROOT, ['MyAccount', 'Login'])
    enterApp(n, 'BottomTab', { screen: 'Home' })
    expect(n.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'MyAccount', params: { screen: 'BottomTab', params: { screen: 'Home' } } }] })
    enterApp(n, 'AddressList')
    expect(n.reset).toHaveBeenLastCalledWith({ index: 0, routes: [{ name: 'MyAccount', params: { screen: 'AddressList', params: undefined, initial: false } }] })
  })

  it('after logout, leaves only the landing', () => {
    const root = nav(ROOT, ['MyAccount'])
    const tabs = nav(TABS, ['Profile'], nav(MAIN, ['BottomTab'], root))
    leaveApp(tabs)
    expect(root.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Home' }] })
  })

  it('leaves the app on logout, also when the events provider handed out a new emitter after the tabs mounted', () => {
    const emitter = () => {
      const listeners: Array<() => void> = []
      return {
        on: (_: string, listener: () => void) => { listeners.push(listener) },
        off: (_: string, listener: () => void) => { listeners.splice(listeners.indexOf(listener), 1) },
        emit: () => listeners.slice().forEach(listener => listener())
      }
    }
    const root = nav(ROOT, ['MyAccount'])
    const tabs = nav(MAIN, ['BottomTab'], root)
    const onLogout = jest.fn()
    const first = emitter()
    const second = emitter()
    const { rerender } = renderHook(({ events }: any) => useLeaveAppOnLogout(events, tabs, onLogout), { initialProps: { events: first } })
    rerender({ events: second })

    second.emit()
    expect(onLogout).toHaveBeenCalledTimes(1)
    expect(root.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Home' }] })

    first.emit()
    expect(root.reset).toHaveBeenCalledTimes(1)
  })

  it('hands a result to the screen that opened this one, as its params', () => {
    const n = { getState: () => ({ index: 2, routes: [{ key: 'tabs', name: 'BottomTab' }, { key: 'od', name: 'OrderDetails' }, { key: 'ro', name: 'ReviewOrder' }] }), dispatch: jest.fn() }
    const { result } = renderHook(() => useSendResult(n, 'OrderDetails'))
    result.current({ reviewed: true })
    expect(n.dispatch).toHaveBeenCalledWith({ ...CommonActions.setParams({ reviewed: true }), source: 'od' })
  })

  it('remembers the opener from when the screen opened (a form that goes back, then reports)', () => {
    let state: any = { index: 1, routes: [{ key: 'mc', name: 'MultiCheckout' }, { key: 'pd', name: 'ProductDetails' }] }
    const n = { getState: () => state, dispatch: jest.fn() }
    const { result, rerender } = renderHook(() => useSendResult(n))
    state = { index: 0, routes: [{ key: 'mc', name: 'MultiCheckout' }] }
    rerender({})
    result.current({ cartUpdatedAt: 1 })
    expect(n.dispatch).toHaveBeenCalledWith({ ...CommonActions.setParams({ cartUpdatedAt: 1 }), source: 'mc' })
  })

  it('hands it to the tab shown below, and to nobody when the opener is another screen or gone', () => {
    const below = { key: 'tabs', name: 'BottomTab', state: { index: 1, routes: [{ key: 'h', name: 'Home' }, { key: 'a', name: 'AddressList' }] } }
    const n = { getState: () => ({ index: 1, routes: [below, { key: 'f', name: 'AddressForm' }] }), dispatch: jest.fn() }
    renderHook(() => useSendResult(n)).result.current({ savedAddress: { id: 1 } })
    expect(n.dispatch).toHaveBeenCalledWith({ ...CommonActions.setParams({ savedAddress: { id: 1 } }), source: 'a' })
    n.dispatch.mockClear()
    renderHook(() => useSendResult(n, 'OrderDetails')).result.current({ reviewed: true })
    expect(n.dispatch).not.toHaveBeenCalled()
    const alone = { getState: () => ({ index: 0, routes: [{ key: 'ro', name: 'ReviewOrder' }] }), dispatch: jest.fn() }
    renderHook(() => useSendResult(alone)).result.current({ reviewed: true })
    expect(alone.dispatch).not.toHaveBeenCalled()
  })

  it('opens the pre-order with the plain fields it reads (never the SDK model)', () => {
    const model = { id: 1, slug: 's', header: 'h', logo: 'l', timezone: 'UTC', schedule: [], api: { client: true }, save: () => {} }
    expect(preorderParams(model, 'business')).toEqual({
      business: { id: 1, slug: 's', header: 'h', logo: 'l', timezone: 'UTC', schedule: [] },
      afterPreorder: 'business'
    })
  })
})

describe('plainParams', () => {
  it('copies a model without its API client', () => {
    const client: any = { setAccessToken: () => {} }
    client.self = client
    const order = { id: 7, business: { name: 'Shop', api: client }, api: client }
    expect(plainParams(order)).toEqual({ id: 7, business: { name: 'Shop' } })
  })

  it('keeps an empty value', () => {
    expect(plainParams(null)).toBeNull()
    expect(plainParams(undefined)).toBeUndefined()
  })
})
