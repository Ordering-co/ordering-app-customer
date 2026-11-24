import '../../../../../../jest/helpers/registerM7NativeMocks'

import React from 'react'
import { ActionSheetIOS, Image, Linking, StyleSheet } from 'react-native'
import { act, fireEvent } from '@testing-library/react-native'

import { ChatThread, ChatMessage } from '../ChatThread'
import { defaultAppTheme } from '../../../../../theme/engine'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => require('../../../../../../jest/helpers/m7ReviewsComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m7ReviewsUiMock').getUiMock())

const theme: any = defaultAppTheme()
const bubble = theme.native.components.chat_bubble.base

const styles = {
  list: {},
  listContent: {},
  bubbleRow: {},
  bubbleMine: { backgroundColor: bubble.mine_background },
  bubbleTheirs: { backgroundColor: bubble.theirs_background },
  bubbleTextMine: { color: bubble.mine_color },
  bubbleTextTheirs: { color: bubble.theirs_color },
  scrollToBottom: {},
  messagesContainer: {},
}

const message = (over: Partial<ChatMessage>): ChatMessage => ({
  _id: 1,
  text: 'Hello',
  createdAt: '2026-07-01 12:05:00',
  user: { _id: 2, name: 'Pizza Place', avatar: 'https://cdn.test/logo.jpg' },
  ...over,
})

const renderThread = (messages: ChatMessage[], onCopy = jest.fn()) => renderWithProviders(
  <ChatThread
    messages={messages}
    userId={7}
    locale='en'
    showTime
    copyLabel='Copy text'
    cancelLabel='Cancel'
    closeLabel='Close'
    onCopy={onCopy}
    styles={styles}
    footer={null}
  />
)

describe('ChatThread links', () => {
  let openURL: jest.SpyInstance

  beforeEach(() => {
    openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any)
  })
  afterEach(() => openURL.mockRestore())

  it('opens the web address, the phone and the email of a message', () => {
    const { getByText } = renderThread([
      message({ text: 'Menu at www.ordering.co, call +52 55 1234 5678 or write help@ordering.co today' }),
    ])
    fireEvent.press(getByText('www.ordering.co'))
    expect(openURL).toHaveBeenLastCalledWith('https://www.ordering.co')
    fireEvent.press(getByText('+52 55 1234 5678'))
    expect(openURL).toHaveBeenLastCalledWith('tel:+525512345678')
    fireEvent.press(getByText('help@ordering.co'))
    expect(openURL).toHaveBeenLastCalledWith('mailto:help@ordering.co')
    expect(openURL).toHaveBeenCalledTimes(3)
  })

  it('paints a link with the theme\'s link color, or the bubble\'s ink where the bubble has that color', () => {
    const link = theme.native.components.link.base.color
    const { getByText } = renderThread([
      message({ _id: 1, text: 'theirs https://ordering.co/a' }),
      message({ _id: 2, text: 'mine https://ordering.co/b', user: { _id: 7, name: 'Me' } }),
    ])
    const theirs = StyleSheet.flatten(getByText('https://ordering.co/a').props.style)
    expect(theirs).toEqual(expect.objectContaining({ color: link, textDecorationLine: 'underline' }))
    // My bubble is painted with the link's color: the link takes the bubble's ink.
    expect(bubble.mine_background.toLowerCase()).toBe(link.toLowerCase())
    const mine = StyleSheet.flatten(getByText('https://ordering.co/b').props.style)
    expect(mine).toEqual(expect.objectContaining({ color: bubble.mine_color, textDecorationLine: 'underline' }))
  })

  it('keeps the long press that copies the whole message, also on a link', () => {
    const sheet = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation((_options, callback) => callback(0))
    const onCopy = jest.fn()
    const text = 'Menu at www.ordering.co'
    const { getByText } = renderThread([message({ text })], onCopy)
    fireEvent(getByText('www.ordering.co'), 'longPress')
    expect(onCopy).toHaveBeenCalledWith(text)
    expect(openURL).not.toHaveBeenCalled()
    sheet.mockRestore()
  })

  it('leaves a message without links as one text', () => {
    const { getByText } = renderThread([message({ text: 'Order placed for 2026-11-10 12:30:00 Via Ordering app' })])
    fireEvent.press(getByText('Order placed for 2026-11-10 12:30:00 Via Ordering app'))
    expect(openURL).not.toHaveBeenCalled()
  })
})

describe('ChatThread avatar', () => {
  it('paints no avatar for a message without one (avatar: null, the order\'s own messages)', () => {
    const { queryByTestId, queryByText, getByText } = renderThread([
      message({ _id: 0, text: 'Order placed for today', user: { _id: 0, name: 'System', avatar: null } }),
    ])
    expect(getByText('Order placed for today')).toBeTruthy()
    // No circle with the initials of "System".
    expect(queryByText('S')).toBeNull()
    expect(queryByTestId('chat-avatar')).toBeNull()
  })

  it('paints the initials of a sender whose picture is not given', () => {
    const { getByText } = renderThread([
      message({ user: { _id: 2, name: 'Pizza Place' } }),
    ])
    expect(getByText('PP')).toBeTruthy()
  })
})

describe('ChatThread image viewer', () => {
  const inverse = theme.native.tokens.color.inverse_surface
  const paintedInverse = (root: any) => root.findAll((node: any) =>
    typeof node.type === 'string' && StyleSheet.flatten(node.props.style)?.backgroundColor === inverse)

  it('opens the image full screen over the inverse surface (black) and closes with its button', () => {
    const { getByRole, getByLabelText, UNSAFE_root, UNSAFE_getAllByType } = renderThread([
      message({ text: '', image: 'https://cdn.test/photo.jpg' }),
    ])
    const shown = () => UNSAFE_getAllByType(Image).filter(image => image.props.source?.uri === 'https://cdn.test/photo.jpg').length
    expect(shown()).toBe(1)
    expect(paintedInverse(UNSAFE_root)).toHaveLength(0)

    fireEvent.press(getByRole('imagebutton'))
    expect(shown()).toBe(2)
    expect(paintedInverse(UNSAFE_root).length).toBeGreaterThan(0)

    // Its close button is named as such (not "Cancel").
    fireEvent.press(getByLabelText('Close'))
    expect(shown()).toBe(1)
  })
  // A finger's drag as the responder system gives it to the viewer.
  const drag = (view: any, dx: number, dy: number) => {
    const touch = (x: number, y: number, time: number, start = false) => ({
      touchActive: true,
      startPageX: 100, startPageY: 200, startTimeStamp: 1000,
      currentPageX: x, currentPageY: y, currentTimeStamp: time,
      previousPageX: start ? x : 100, previousPageY: start ? y : 200, previousTimeStamp: 1000,
    })
    const event = (x: number, y: number, time: number, start = false) => ({
      nativeEvent: { touches: [{}], changedTouches: [{}], identifier: 0, pageX: x, pageY: y, timestamp: time },
      touchHistory: { touchBank: [touch(x, y, time, start)], numberActiveTouches: 1, indexOfSingleActiveTouch: 0, mostRecentTimeStamp: time },
    })
    const handlers = view.getByTestId('chat-image-viewer-drag').props
    // Taken at the touch's start: the Modal's own container takes it otherwise.
    expect(handlers.onStartShouldSetResponder(event(100, 200, 1000, true))).toBe(true)
    act(() => {
      handlers.onResponderGrant(event(100, 200, 1000, true))
      handlers.onResponderMove(event(100 + dx, 200 + dy, 2000))
      handlers.onResponderRelease({ ...event(100 + dx, 200 + dy, 2000), touchHistory: { touchBank: [{ ...touch(100 + dx, 200 + dy, 2000), touchActive: false }], numberActiveTouches: 0, indexOfSingleActiveTouch: -1, mostRecentTimeStamp: 2000 } })
    })
  }

  it('closes when the image is dragged down, not when it is moved a little or sideways', () => {
    const view = renderThread([message({ text: '', image: 'https://cdn.test/photo.jpg' })])
    const open = () => view.UNSAFE_getAllByType(Image).filter(image => image.props.source?.uri === 'https://cdn.test/photo.jpg').length === 2
    fireEvent.press(view.getByRole('imagebutton'))
    expect(open()).toBe(true)

    drag(view, 0, 40)
    expect(open()).toBe(true)
    drag(view, 400, 30)
    expect(open()).toBe(true)
    drag(view, 5, 500)
    expect(open()).toBe(false)
  })
})
