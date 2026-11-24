import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { act, fireEvent, waitFor } from '@testing-library/react-native'
import RNRestart from 'react-native-restart'
import { checkNotifications, openSettings } from 'react-native-permissions'

import {
  useApi,
  useConfig,
  useEvent,
  useOrder,
  useSession
} from '@components'
import { useCookieConsent } from '@/contexts/CookieConsentContext'

jest.mock('react-native-fast-image', () => {
  const React = require('react')
  const { View } = require('react-native')
  function FastImage (props: any) {
    return React.createElement(View, { testID: 'fast-image', ...props })
  }
  FastImage.resizeMode = { contain: 'contain', cover: 'cover' }
  return { __esModule: true, default: FastImage, resizeMode: FastImage.resizeMode }
})

jest.mock('react-native-webview', () => {
  const { View: RNView } = require('react-native')
  return { WebView: (props: any) => <RNView testID="webview" {...props} /> }
})

jest.mock('react-native-uuid', () => ({ v4: jest.fn(() => 'guest-token-uuid') }))

jest.mock('lottie-react-native', () => 'Lottie')

jest.mock('react-native-permissions', () => ({
  checkNotifications: jest.fn().mockResolvedValue({ status: 'granted' }),
  openSettings: jest.fn().mockResolvedValue(undefined)
}))

jest.mock('@/contexts/CookieConsentContext', () => ({
  useCookieConsent: jest.fn()
}))

jest.mock('@/ui/src/components/Help/functions', () => {
  const defaults = require('../../../../../../jest/helpers/m2ShellDefaults')
  return {
    CmsContent: (props: any) => {
      const UI = props.UIComponent
      if (!UI) return null
      return (
        <UI
          cmsState={defaults.helpCmsDefaults.cmsState}
          onRedirect={props.onRedirect}
          navigation={props.navigation}
        />
      )
    }
  }
})

jest.mock('@ui', () => {
  const { View } = require('react-native')
  const OText = require('@/ui/src/components/shared/OText').default
  const OButton = require('@/ui/src/components/shared/OButton').default
  const OIcon = require('@/ui/src/components/shared/OIcon').default
  const { NotFoundSource } = jest.requireActual('@/ui/src/components/NotFoundSource/index')
  const { AnimatedItem } = jest.requireActual('@/ui/src/components/AnimatedItem/index')
  return {
    OText,
    OButton,
    OIcon,
    LanguageSelector: () => <View testID="language-selector" />,
    NotFoundSource,
    AnimatedItem,
    LastOrders: () => <View testID="last-orders" />,
    SafeAreaViewWrapper: ({ children }: any) => children,
    Toast: () => null
  }
})

const renderUiController = (defaults: Record<string, unknown> = {}) => (props: any) => {
  const UI = props.UIComponent
  if (!UI) return null
  const { UIComponent, ...rest } = props
  return <UI {...defaults} {...rest} />
}

jest.mock('@components', () => {
  const base = require('../../../../../../jest/helpers/mockOrdering')
  const m1 = require('../../../../../../jest/helpers/m1AuthDefaults')
  const m2 = require('../../../../../../jest/helpers/m2ShellDefaults')
  return {
    ...base,
    WebsocketStatus: renderUiController(m2.websocketStatusDefaults),
    PageBanner: renderUiController(m2.pageBannerDefaults),
    UserFormDetails: renderUiController({
      ...m1.userFormDetailsDefaults,
      ...m2.notificationsListDefaults
    }),
    useEvent: jest.fn(() => [{ emit: jest.fn() }]),
    useUtils: jest.fn(() => [{
      parseDate: (value: string) => value,
      optimizeImage: (url: string) => url
    }]),
    useOrder: jest.fn(() => [{ loading: false, carts: [] }, { handleOrderStateLoading: jest.fn() }]),
    useToast: jest.fn(() => [, { showToast: jest.fn() }])
  }
})


import { FloatingButton } from '..'
import OButton, { resolveButton } from '../../shared/OButton'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { themeWith, withTheme } from '../../../../../../jest/helpers/themeWith'
import { isOpaque } from '@/theme/helpers'


beforeEach(() => {
    jest.clearAllMocks()
    ;(useConfig as jest.Mock).mockReturnValue([{
      configs: { powered_by_ordering_module: { value: false } }
    }])
    ;(useCookieConsent as jest.Mock).mockReturnValue({
      consentStatus: 'unknown',
      acceptConsent: jest.fn(),
      optOutConsent: jest.fn(),
      isConsentEnabled: true,
      loading: false
    })
    ;(checkNotifications as jest.Mock).mockResolvedValue({ status: 'granted' })
  })

describe('FloatingButton', () => {
  it('handles primary and secondary actions', () => {
        const handleClick = jest.fn()
        const handle2ndClick = jest.fn()
        const { getByText } = renderWithProviders(
          <FloatingButton
            text="Continue"
            text2nd="Cancel"
            handleClick={handleClick}
            handle2ndClick={handle2ndClick}
            flexDirection="row"
          />
        )
        fireEvent.press(getByText('Continue'))
        fireEvent.press(getByText('Cancel'))
        expect(handleClick).toHaveBeenCalled()
        expect(handle2ndClick).toHaveBeenCalled()
      })
  
      it('shows loading state on primary button', () => {
        const { getByText } = renderWithProviders(
          <FloatingButton text="Saving" loading handleClick={jest.fn()} />
        )
        expect(getByText('Saving')).toBeTruthy()
      })
})

describe('FloatingButton: what leads the main button (leading)', () => {
  const flat = (node: any) => StyleSheet.flatten(node.props.style) ?? {}
  const tree = (utils: any) => {
    const boxes: any[] = []
    const walk = (node: any, path: any[]) => {
      if (!node || typeof node !== 'object') return
      if (node.props?.accessibilityRole === 'button' && !boxes.length) boxes.push(...path)
      ;(node.children ?? []).forEach((child: any) => walk(child, [...path, node]))
    }
    walk(utils.toJSON(), [])
    return boxes
  }
  const rowOf = (utils: any) => tree(utils).reverse().find((node: any) => node.children.some((child: any) => child.props?.testID === 'lead'))

  const rows = (utils: any) => tree(utils).filter((node: any) => flat(node).flexDirection === 'row').length

  it('has nothing before the button by default, and no row for it', () => {
    const plain = renderWithProviders(<FloatingButton text="View Order" handleClick={jest.fn()} />)
    const led = renderWithProviders(<FloatingButton text="View Order" handleClick={jest.fn()} leading={<View testID="lead" />} />)
    expect(tree(plain).length).toBe(tree(led).length)
    expect(rows(led)).toBe(rows(plain) + 1)
    expect(tree(plain).filter((node: any) => flat(node).flex === 1).length).toBe(tree(led).filter((node: any) => flat(node).flex === 1).length - 1)
    expect(plain.queryByTestId('lead')).toBeNull()
  })

  it('draws it before the button, which takes the rest of the row and still works', () => {
    const handleClick = jest.fn()
    const utils = renderWithProviders(
      <FloatingButton text="View Order" handleClick={handleClick} leading={<View testID="lead" />} />
    )
    const row = rowOf(utils)
    expect(row.children.length).toBe(2)
    expect(row.children[0].props.testID).toBe('lead')
    expect(flat(row)).toMatchObject({ flexDirection: 'row', alignItems: 'center' })
    expect(flat(row.children[1]).flex).toBe(1)
    expect(JSON.stringify(row.children[1])).toContain('View Order')
    fireEvent.press(utils.getByText('View Order'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('keeps it beside the button while it loads, and leaves with the button', () => {
    const lead = <View testID="lead" />
    expect(renderWithProviders(<FloatingButton text="View Order" handleClick={jest.fn()} loading leading={lead} />).getByTestId('lead')).toBeTruthy()
    expect(renderWithProviders(<FloatingButton text="View Order" handleClick={jest.fn()} hideBtn leading={lead} />).queryByTestId('lead')).toBeNull()
  })
})

describe('FloatingButton: the second button (bottom_bar.slots.secondary)', () => {
  const second = (utils: any) => utils.UNSAFE_getAllByType(OButton).find((button: any) => button.props.text === 'Add more')
  const renderBar = (props: any = {}, options?: any) => renderWithProviders(
    <FloatingButton text="Checkout" text2nd="Add more" handleClick={jest.fn()} handle2ndClick={jest.fn()} flexDirection="row" {...props} />,
    options
  )

  it('is an outline button of the primary color by default, as the secondary class was', () => {
    const { props } = second(renderBar({ classBtn2: 'secondary' }))
    expect(props).toMatchObject({ size: 'md', color: 'primary', appearance: 'outline' })
    expect(props.class).toBeUndefined()
    expect(resolveButton(props)).toEqual(resolveButton({ class: 'secondary' }))
  })

  it('takes the size, color and appearance of the slot', () => {
    const slot = { size: 'lg', color: 'neutral', appearance: 'tonal' }
    const { props } = second(renderBar({ classBtn2: 'secondary' }, withTheme({ components: { bottom_bar: { slots: { secondary: slot } } } })))
    expect(props).toMatchObject(slot)
  })

  it('keeps the look while it loads', () => {
    const slot = { size: 'sm', color: 'danger', appearance: 'ghost' }
    const { props } = second(renderBar({ classBtn2: 'secondary', loading2nd: true }, withTheme({ components: { bottom_bar: { slots: { secondary: slot } } } })))
    expect(props).toMatchObject({ ...slot, loading: true })
  })

  it.each([[undefined], ['primary'], ['third']])('leaves a second button of the class %s as it was', (classBtn2) => {
    const slot = { size: 'lg', color: 'danger', appearance: 'tonal' }
    const { props } = second(renderBar({ classBtn2 }, withTheme({ components: { bottom_bar: { slots: { secondary: slot } } } })))
    expect(props.class).toBe(classBtn2)
    expect(props.color).toBeUndefined()
    expect(props.appearance).toBeUndefined()
    expect(props.size).toBeUndefined()
  })
})

describe('FloatingButton: one shape for the row (bottom_bar.base.joined)', () => {
  const flat = (node: any) => StyleSheet.flatten(node.props.style) ?? {}
  const hostParent = (node: any) => {
    let parent = node.parent
    while (parent && typeof parent.type !== 'string') parent = parent.parent
    return parent
  }
  const rowOf = (utils: any) => {
    let node = hostParent(utils.getByText('Checkout'))
    while (node && flat(node).width !== '100%') node = hostParent(node)
    return node
  }
  const themed = (base: Record<string, unknown>, slots?: Record<string, unknown>) => ({ components: { bottom_bar: { base, ...(slots && { slots }) } } })
  const joined = themed({ joined: true })
  const radius = (values: any) => themeWith(values).native.components.button.base.radius
  const lead = <View testID="lead" />
  const renderLed = (options?: any, props: any = {}) => renderWithProviders(
    <FloatingButton text="View Order" handleClick={jest.fn()} leading={lead} {...props} />,
    options
  )
  const renderPair = (options?: any, props: any = {}) => renderWithProviders(
    <FloatingButton text="Checkout" text2nd="Add more" handleClick={jest.fn()} handle2ndClick={jest.fn()} flexDirection="row" reverseOrder classBtn2="secondary" {...props} />,
    options
  )

  it('keeps the lead and the button apart by default', () => {
    const utils = renderLed()
    const row = hostParent(utils.getByTestId('lead'))
    expect(utils.queryByTestId('bottom-bar-joined-lead')).toBeNull()
    expect(flat(row).gap).toBeGreaterThan(0)
    expect(flat(row).borderRadius).toBeUndefined()
    expect(flat(row).backgroundColor).toBeUndefined()
  })

  it('keeps two buttons apart by default', () => {
    const row = rowOf(renderPair())
    expect(flat(row).gap).toBeGreaterThan(0)
    expect(flat(row).borderRadius).toBeUndefined()
    expect(flat(row).backgroundColor).toBeUndefined()
  })

  it('changes nothing for a button alone', () => {
    const plain = renderWithProviders(<FloatingButton text="View Order" handleClick={jest.fn()} />)
    const alone = renderWithProviders(<FloatingButton text="View Order" handleClick={jest.fn()} />, withTheme(themed({ joined: true, joined_background: '#102030' })))
    expect(alone.queryByTestId('bottom-bar-joined-lead')).toBeNull()
    expect(JSON.stringify(alone.toJSON())).toBe(JSON.stringify(plain.toJSON()))
  })

  it('joins the lead and the button in one rounded shape without a gap', () => {
    const utils = renderLed(withTheme(joined))
    const box = utils.getByTestId('bottom-bar-joined-lead')
    const row = hostParent(box)
    expect(hostParent(utils.getByTestId('lead'))).toBe(box)
    expect(flat(box)).toMatchObject({ flex: 1, alignItems: 'flex-start' })
    expect(flat(row)).toMatchObject({ flexDirection: 'row', gap: 0, borderRadius: radius(joined) })
    expect(flat(row).backgroundColor).toBeUndefined()
    expect(utils.getByText('View Order')).toBeTruthy()
  })

  it('fills the joined lead with the background of the theme', () => {
    const values = themed({ joined: true, joined_background: '#102030' })
    const row = hostParent(renderLed(withTheme(values)).getByTestId('bottom-bar-joined-lead'))
    expect(flat(row).backgroundColor).toBe(themeWith(values).native.components.bottom_bar.base.joined_background)
  })

  it.each([['transparent'], ['rgba(16, 32, 48, 0.4)']])('does not fill it with %s', (color) => {
    const row = hostParent(renderLed(withTheme(themed({ joined: true, joined_background: color }))).getByTestId('bottom-bar-joined-lead'))
    expect(flat(row).backgroundColor).toBeUndefined()
  })

  it('joins two buttons in a row, filled with the background of the theme under an outline second button', () => {
    const values = themed({ joined: true, joined_background: '#102030' })
    const utils = renderPair(withTheme(values))
    const row = rowOf(utils)
    expect(flat(row)).toMatchObject({ gap: 0, borderRadius: radius(values), backgroundColor: themeWith(values).native.components.bottom_bar.base.joined_background })
    expect(utils.queryByTestId('bottom-bar-joined-lead')).toBeNull()
  })

  it('fills two joined buttons with the background of an opaque second button, before the one of the theme', () => {
    const values = themed({ joined: true, joined_background: '#102030' }, { secondary: { color: 'primary', appearance: 'solid' } })
    const fill = themeWith(values).native.components.button.variants.primary.solid.background
    expect(isOpaque(fill)).toBe(true)
    expect(flat(rowOf(renderPair(withTheme(values)))).backgroundColor).toBe(fill)
  })

  it('fills them with the background it is given before any other', () => {
    const values = themed({ joined: true, joined_background: '#102030' }, { secondary: { color: 'primary', appearance: 'solid' } })
    expect(flat(rowOf(renderPair(withTheme(values), { joinedBackground: '#a1b2c3' }))).backgroundColor).toBe('#a1b2c3')
    expect(flat(hostParent(renderLed(withTheme(values), { joinedBackground: '#a1b2c3' }).getByTestId('bottom-bar-joined-lead'))).backgroundColor).toBe('#a1b2c3')
  })

  it('skips a background it is given that is not opaque', () => {
    const values = themed({ joined: true, joined_background: '#102030' })
    expect(flat(rowOf(renderPair(withTheme(values), { joinedBackground: 'transparent' }))).backgroundColor).toBe(themeWith(values).native.components.bottom_bar.base.joined_background)
  })

  it('ignores the second slot for a second button of another class', () => {
    const values = themed({ joined: true, joined_background: '#102030' }, { secondary: { color: 'primary', appearance: 'solid' } })
    expect(flat(rowOf(renderPair(withTheme(values), { classBtn2: 'third' }))).backgroundColor).toBe(themeWith(values).native.components.bottom_bar.base.joined_background)
  })

  it('joins the button and an element given in place of the second button, with the background of the theme', () => {
    const values = themed({ joined: true, joined_background: '#102030' }, { secondary: { color: 'primary', appearance: 'solid' } })
    const utils = renderPair(withTheme(values), { text2nd: undefined, secondElement: <View testID="second" /> })
    expect(utils.getByTestId('second')).toBeTruthy()
    expect(flat(rowOf(utils))).toMatchObject({ gap: 0, borderRadius: radius(values), backgroundColor: themeWith(values).native.components.bottom_bar.base.joined_background })
  })

  it('does not join two stacked buttons', () => {
    const row = rowOf(renderPair(withTheme(themed({ joined: true, joined_background: '#102030' })), { flexDirection: 'column' }))
    expect(flat(row).borderRadius).toBeUndefined()
    expect(flat(row).backgroundColor).toBeUndefined()
  })

  it('does not paint a background it is given while the row is not joined', () => {
    expect(flat(rowOf(renderPair(undefined, { joinedBackground: '#a1b2c3' }))).backgroundColor).toBeUndefined()
    expect(flat(hostParent(renderLed(undefined, { joinedBackground: '#a1b2c3' }).getByTestId('lead'))).backgroundColor).toBeUndefined()
  })
})

describe('FloatingButton: the look of the main button it is given (look)', () => {
  const main = (utils: any) => utils.UNSAFE_getAllByType(OButton).find((button: any) => button.props.text === 'Continue')

  it('takes the bottom bar slot when it is given none', () => {
    const { props } = main(renderWithProviders(<FloatingButton text="Continue" handleClick={jest.fn()} />))
    expect(props).toMatchObject({ size: 'md', color: 'primary', appearance: 'solid' })
  })

  it('takes the one it is given in place of the slot', () => {
    const look = { size: 'lg', color: 'success', appearance: 'solid' }
    const { props } = main(renderWithProviders(<FloatingButton text="Continue" handleClick={jest.fn()} look={look} />))
    expect(props).toMatchObject(look)
  })
})
