import { useCallback, useEffect, useRef } from 'react'
import { CommonActions, StackActions } from '@react-navigation/native'

/**
 * How the app moves between screens (React Navigation 7).
 *
 * The root stack holds `MyAccount` (the app's main stack: the tabs in
 * `BottomTab`, and every other screen) next to Login, Signup, Forgot and the
 * landing Home. In React Navigation 7, `navigate` pushes a screen (it stays
 * only when that screen is the focused one) and does not look into nested
 * navigators, and `popTo` replaces the current screen when the one it goes to
 * is not in the stack. So:
 *
 * - going home is going **back** to the tabs (`goHome`), never stacking them
 *   again;
 * - going back to a screen that is already in the stack (the business, the
 *   checkout, the cart) is `returnTo`, which keeps that screen's params; when
 *   it is not there, it opens on top;
 * - a store, a cart's checkout, the carts and the multi checkout are one
 *   screen each (`SCREEN_ID` tells stores and checkouts apart): opening one
 *   that is already open goes back to it (`openScreen`);
 * - opening a screen of the main stack from the root stack goes through
 *   `MyAccount` (`openScreen` does it);
 * - a screen that hands something back (a review sent, an address saved, a
 *   cart product edited) sets it as params of the screen that opened it
 *   (`useSendResult`): params are data, never a function to call back.
 */

/** The root stack's screen that holds the app's main stack. */
export const MAIN_STACK = 'MyAccount'

/** The landing (log in, sign up, or go on as a guest): the first screen of both stacks without a session. */
const LANDING = 'Home'

/** What tells two screens of the same name apart: a store's page, a cart's checkout. */
export const SCREEN_ID: Record<string, (params?: any) => string | undefined> = {
  Business: (params) => params?.store,
  CheckoutPage: (params) => params?.cartUuid
}

/** The screens there is one of (per store, per cart): opened again, the stack goes back to them. */
const ONE_OF = new Set(['Business', 'CheckoutPage', 'Cart', 'MultiCheckout'])

// A screen's navigation answers getState(); the container's ref (pushes from
// outside React) answers getRootState().
const stateOf = (navigation: any) => navigation?.getState?.() ?? navigation?.getRootState?.()

/** The navigation of the stack that has a screen called `name`: this one or one above (a tab's stack). */
const stackWith = (navigation: any, name: string) => {
  let current = navigation
  while (current) {
    if (stateOf(current)?.routeNames?.includes(name)) return current
    current = current.getParent?.()
  }
  return null
}

/** Whether that stack already has the screen (the same store, the same cart's checkout). */
const isOpen = (stack: any, name: string, params?: object) => {
  const id = SCREEN_ID[name]?.(params)
  return (stateOf(stack)?.routes ?? []).some((route: any) =>
    route.name === name && (id === undefined || SCREEN_ID[name]?.(route.params) === id))
}

/**
 * Back to a screen already in the stack, keeping its params (merged with
 * `params`; `merge: false` replaces them, for a navigator's `{ screen }`);
 * when it is not there, it opens on top.
 */
export const returnTo = (navigation: any, name: string, params?: object, { merge = true } = {}) => {
  if (!navigation) return
  const stack = stackWith(navigation, name) ?? navigation
  if (isOpen(stack, name, params)) {
    stack.dispatch(StackActions.popTo(name, params, { merge }))
    return
  }
  stack.navigate(name, params)
}

/**
 * Back to the tabs (to a tab with `{ screen: 'MyOrders' }`), or to them for the first time: over
 * the landing (`Home`), which stays under them. When the stack holds neither (a deep link opened
 * the app on a screen of its own: an order, a store), the tabs become the stack: opened on top,
 * that screen stayed under them and going back from the tabs returned to it.
 */
export const goHome = (navigation: any, params?: object) => {
  if (!navigation) return
  const stack = stackWith(navigation, 'BottomTab')
  if (stack) {
    const first = stateOf(stack)?.routes?.[0]?.name
    if (isOpen(stack, 'BottomTab') || first === LANDING || !first) {
      returnTo(stack, 'BottomTab', params, { merge: false })
      return
    }
    stack.reset({ index: 0, routes: [{ name: 'BottomTab', params }] })
    return
  }
  // From the root stack (Login, Signup): the tabs are inside the main stack.
  returnTo(navigation, MAIN_STACK, { screen: 'BottomTab', params }, { merge: false })
}

/** Open a screen: the tabs and the one-of screens are gone back to; a main-stack screen opens from the root stack too. */
export const openScreen = (navigation: any, name: string, params?: object) => {
  if (!navigation || !name) return
  if (name === 'BottomTab') {
    goHome(navigation, params)
    return
  }
  if (!stackWith(navigation, name) && stackWith(navigation, MAIN_STACK)) {
    // A screen of the main stack, from the root stack: back to the main stack
    // (closing Login or Signup above it) and to the screen inside it.
    returnTo(navigation, MAIN_STACK, { screen: name, params }, { merge: false })
    return
  }
  if (ONE_OF.has(name)) {
    returnTo(navigation, name, params)
    return
  }
  navigation.navigate(name, params)
}

/**
 * After logging in or signing up: the app (the main stack) is all there is,
 * on `screen` (the tabs, or the addresses first), so going back leaves the
 * app instead of going back to Login or the landing.
 */
export const enterApp = (navigation: any, screen = 'BottomTab', params?: object) => {
  const root = stackWith(navigation, MAIN_STACK)
  if (!root) {
    openScreen(navigation, screen, params)
    return
  }
  root.reset({
    index: 0,
    routes: [{
      name: MAIN_STACK,
      // `initial: false` keeps the tabs under another first screen.
      params: screen === 'BottomTab' ? { screen, params } : { screen, params, initial: false }
    }]
  })
}

/** After logging out: the landing is all there is (nothing of the account behind it). */
export const leaveApp = (navigation: any) => {
  const root = stackWith(navigation, MAIN_STACK)
  root?.reset({ index: 0, routes: [{ name: LANDING }] })
}

/**
 * Leaves the app when the session's `logout` is emitted (`onLogout` first: the tabs clear their
 * account state). It follows the emitter: the events provider can hand out a new one when it
 * renders again (a session restored at launch did it after the tabs were mounted), and a
 * listener left on the old one never heard the logout: the tabs stayed, signed out, on the
 * account flow's last form.
 */
export const useLeaveAppOnLogout = (events: any, navigation: any, onLogout?: () => void) => {
  const onLogoutRef = useRef(onLogout)
  onLogoutRef.current = onLogout
  useEffect(() => {
    const handleLogout = () => {
      onLogoutRef.current?.()
      leaveApp(navigation)
    }
    events.on('logout', handleLogout)
    return () => {
      events.off('logout', handleLogout)
    }
  }, [events, navigation])
}

/** The screen that opened this one: the one below it in its stack (when that is a navigator, the screen it shows: a tab). */
const openerOf = (navigation: any) => {
  const state = stateOf(navigation)
  let route = state?.routes?.[(state?.index ?? 0) - 1]
  while (route?.state?.routes?.length) route = route.state.routes[route.state.index ?? 0]
  return route
}

/**
 * Hands a result to the screen that opened this one, as params it reads
 * (navigation params are data: a screen never receives a function to call
 * back), when it is `to` (any screen, without it). The opener is read when
 * the screen mounts, so a result sent after the screen has left (a form that
 * goes back, then reports) still reaches it. When that screen is no longer
 * there, there is no one to tell, and nothing opens.
 */
export const useSendResult = (navigation: any, to?: string) => {
  const opener = useRef<any>(undefined)
  if (opener.current === undefined) opener.current = openerOf(navigation) ?? null
  return useCallback((result: object) => {
    const route = opener.current
    if (!route?.key || (to && route.name !== to)) return
    navigation?.dispatch({ ...CommonActions.setParams(result), source: route.key })
  }, [navigation, to])
}

/**
 * The params that open the pre-order screen (`MomentOption`) for a closed
 * business: the fields it reads, and where it goes once the time is picked:
 * `'business'` opens the store in its place (from a listing), `'back'` goes
 * back to the store it was opened from.
 */
/**
 * A model of the SDK (an order, an address) as navigation params: its data without the
 * API client it carries (`api`), since params are plain data.
 */
export const plainParams = <T,>(model: T): T =>
  model ? JSON.parse(JSON.stringify(model, (key, value) => (key === 'api' ? undefined : value))) : model

export const preorderParams = (business: any, after: 'business' | 'back') => ({
  business: {
    id: business?.id,
    slug: business?.slug,
    header: business?.header,
    logo: business?.logo,
    timezone: business?.timezone,
    schedule: business?.schedule
  },
  afterPreorder: after
})

/** A page's `onNavigationRedirect`: the screens the logic and the UI name, opened by `openScreen`. */
export const redirectWith = (navigation: any) => (name: string, params?: object) => openScreen(navigation, name, params)
