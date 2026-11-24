import '../../../../../../jest/helpers/registerM7NativeMocks'

import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { Messages } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => require('../../../../../../jest/helpers/m7ReviewsComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m7ReviewsUiMock').getUiMock())

describe('Messages', () => {
  const m7 = require('../../../../../../jest/helpers/m7ReviewsComponentsMock')
  const d = require('../../../../../../jest/helpers/m7ReviewsDefaults')

  beforeEach(() => {
    m7.resetMockState()
  })

  it('renders the thread and the composer for active orders', () => {
    const d = require('../../../../../../jest/helpers/m7ReviewsDefaults')
    const { getByPlaceholderText, getByText, getAllByTestId } = renderWithProviders(
      <Messages orderId={43} messages={d.messagesDefaults.messages} />
    )
    expect(getByPlaceholderText('Write message')).toBeTruthy()
    expect(getByText('Hello there')).toBeTruthy()
    expect(getAllByTestId('chat-message').length).toBeGreaterThan(0)
  })

  it('leaves no gap between the last message and the composer', () => {
    const { FlatList, StyleSheet } = require('react-native')
    const { defaultAppTheme } = require('../../../../../theme/engine')
    const space = defaultAppTheme().native.tokens.space
    const d = require('../../../../../../jest/helpers/m7ReviewsDefaults')
    const { UNSAFE_getByType } = renderWithProviders(
      <Messages orderId={43} messages={d.messagesDefaults.messages} />
    )
    const list = UNSAFE_getByType(FlatList)
    // The list is inverted: its top padding is what is under the last message.
    const under = StyleSheet.flatten(list.props.contentContainerStyle).paddingTop ?? 0
    let around = 0
    for (let node = list.parent; node; node = node.parent) {
      around += StyleSheet.flatten(node.props?.style)?.paddingBottom ?? 0
    }
    expect(under + around).toBeLessThanOrEqual(space.sm)
  })

  it('reports what is typed in the composer', () => {
    const d = require('../../../../../../jest/helpers/m7ReviewsDefaults')
    const { getByTestId } = renderWithProviders(
      <Messages orderId={43} messages={d.messagesDefaults.messages} />
    )
    fireEvent.changeText(getByTestId('chat-composer'), 'On my way')
    expect(d.messagesDefaults.setMessage).toHaveBeenCalledWith('On my way')
  })

  it('shows disabled chat message when order has ended', () => {
    m7.setMockState({ messagesDefaults: d.messagesEndedDefaults })
    const { getByText, queryByTestId } = renderWithProviders(
      <Messages orderId={41} messages={d.messagesEndedDefaults.messages} />
    )
    expect(getByText(/can't send messages/i)).toBeTruthy()
    expect(queryByTestId('chat-composer')).toBeNull()
  })
})
