import '../../../../../../jest/helpers/registerM5NativeMocks'

import React from 'react'
import { act, fireEvent } from '@testing-library/react-native'

import { PaymentOptionCash } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { withTheme } from '../../../../../../jest/helpers/themeWith'

jest.mock('@components', () => require('../../../../../../jest/helpers/m5CheckoutComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m5CheckoutUiMock').getUiMock())

describe('PaymentOptionCash', () => {
  it('renders cash amount prompt', () => {
    const d = require('../../../../../../jest/helpers/m5CheckoutDefaults')
    const { getByText } = renderWithProviders(
      <PaymentOptionCash {...d.paymentOptionCashDefaults} />
    )
    expect(getByText(/Don't have exact amount/i)).toBeTruthy()
  })

  it('marks error when cash is below order total', () => {
    jest.useFakeTimers()
    const setErrorCash = jest.fn()
    const onChangeData = jest.fn()
    const { getByPlaceholderText } = renderWithProviders(
      <PaymentOptionCash
        orderTotal={20}
        setErrorCash={setErrorCash}
        onChangeData={onChangeData}
        defaultValue="5"
      />
    )
    const input = getByPlaceholderText('0')
    fireEvent.changeText(input, '5')
    jest.advanceTimersByTime(800)
    expect(setErrorCash).toHaveBeenCalled()
    jest.useRealTimers()
  })
})

describe('PaymentOptionCash: the suggested amounts (checkout.base.cash_suggestions)', () => {
  const on = withTheme({ components: { checkout: { base: { cash_suggestions: true } } } })
  const renderCash = (options?: any, props: any = {}) => {
    const onChangeData = jest.fn()
    const setErrorCash = jest.fn()
    const utils = renderWithProviders(
      <PaymentOptionCash orderTotal={48040} onChangeData={onChangeData} setErrorCash={setErrorCash} defaultValue='' {...props} />,
      options
    )
    return { ...utils, onChangeData, setErrorCash }
  }
  const chips = (utils: any) => utils.queryAllByTestId(/^cash-suggestion-/).map((chip: any) => chip.props.testID)
  const selected = (utils: any, amount: number) => utils.getByTestId(`cash-suggestion-${amount}`).props.accessibilityState.selected

  afterEach(() => jest.useRealTimers())

  it('has none by default: the field alone', () => {
    const utils = renderCash()
    expect(chips(utils)).toEqual([])
    expect(utils.getByPlaceholderText('0')).toBeTruthy()
  })

  it('offers the exact total and the next round amounts when the theme says so', () => {
    const utils = renderCash(on)
    expect(chips(utils)).toEqual(['cash-suggestion-48040', 'cash-suggestion-50000', 'cash-suggestion-60000', 'cash-suggestion-100000'])
    expect(utils.getByText('$48040')).toBeTruthy()
    expect(utils.getByText('$100000')).toBeTruthy()
    ;[48040, 50000, 60000, 100000].forEach((amount) => expect(selected(utils, amount)).toBe(false))
  })

  it('has none for an order without a total', () => {
    expect(chips(renderCash(on, { orderTotal: 0 }))).toEqual([])
    expect(chips(renderCash(on, { orderTotal: undefined }))).toEqual([])
  })

  it('sets the cash at once from a chip, marks it and writes it in the field', () => {
    jest.useFakeTimers()
    const utils = renderCash(on)
    fireEvent.press(utils.getByTestId('cash-suggestion-50000'))
    expect(utils.onChangeData).toHaveBeenCalledTimes(1)
    expect(utils.onChangeData).toHaveBeenCalledWith({ cash: 50000 })
    expect(selected(utils, 50000)).toBe(true)
    expect(selected(utils, 48040)).toBe(false)
    expect(selected(utils, 60000)).toBe(false)
    expect(utils.getByPlaceholderText('0').props.defaultValue).toBe('50000')
    expect(utils.setErrorCash).toHaveBeenLastCalledWith(false)
    act(() => { jest.advanceTimersByTime(1000) })
    expect(utils.onChangeData).toHaveBeenCalledTimes(1)
  })

  it('moves the mark to the chip pressed last, the exact total included', () => {
    const utils = renderCash(on)
    fireEvent.press(utils.getByTestId('cash-suggestion-100000'))
    fireEvent.press(utils.getByTestId('cash-suggestion-48040'))
    expect(utils.onChangeData.mock.calls).toEqual([[{ cash: 100000 }], [{ cash: 48040 }]])
    expect(selected(utils, 48040)).toBe(true)
    expect(selected(utils, 100000)).toBe(false)
  })

  it('marks the chip of the amount the order already has', () => {
    const utils = renderCash(on, { defaultValue: 60000 })
    expect(selected(utils, 60000)).toBe(true)
    expect(selected(utils, 50000)).toBe(false)
  })

  it('drops an amount still being typed when a chip is pressed', () => {
    jest.useFakeTimers()
    const utils = renderCash(on)
    fireEvent.changeText(utils.getByPlaceholderText('0'), '70000')
    fireEvent.press(utils.getByTestId('cash-suggestion-50000'))
    act(() => { jest.advanceTimersByTime(1000) })
    expect(utils.onChangeData.mock.calls).toEqual([[{ cash: 50000 }]])
    expect(selected(utils, 50000)).toBe(true)
  })
})

describe('PaymentOptionCash: the typed amount', () => {
  const renderCash = () => {
    const onChangeData = jest.fn()
    const utils = renderWithProviders(
      <PaymentOptionCash orderTotal={20} onChangeData={onChangeData} setErrorCash={jest.fn()} defaultValue='' />
    )
    return { ...utils, onChangeData }
  }

  afterEach(() => jest.useRealTimers())

  it('waits for the typing to stop and sends the last amount once', () => {
    jest.useFakeTimers()
    const utils = renderCash()
    fireEvent.changeText(utils.getByPlaceholderText('0'), '5')
    act(() => { jest.advanceTimersByTime(400) })
    fireEvent.changeText(utils.getByPlaceholderText('0'), '50')
    act(() => { jest.advanceTimersByTime(400) })
    expect(utils.onChangeData).not.toHaveBeenCalled()
    act(() => { jest.advanceTimersByTime(400) })
    expect(utils.onChangeData.mock.calls).toEqual([[{ cash: 50 }]])
  })

  it('keeps one pending amount across a render in between', () => {
    jest.useFakeTimers()
    const utils = renderCash()
    fireEvent.changeText(utils.getByPlaceholderText('0'), '30')
    utils.rerender(<PaymentOptionCash orderTotal={20} onChangeData={utils.onChangeData} setErrorCash={jest.fn()} defaultValue='' />)
    fireEvent.changeText(utils.getByPlaceholderText('0'), '40')
    act(() => { jest.advanceTimersByTime(1000) })
    expect(utils.onChangeData.mock.calls).toEqual([[{ cash: 40 }]])
  })
})
