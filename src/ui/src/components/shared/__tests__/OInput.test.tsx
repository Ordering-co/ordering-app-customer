import React from 'react'
import { Alert, Text, Vibration, Keyboard, Platform } from 'react-native'
import { act, fireEvent } from '@testing-library/react-native'
import { ToastType, useToast } from '@components'


jest.mock('@ui', () => {
  const OText = require('@/ui/src/components/shared/OText').default
  return {
    OText,
    SafeAreaViewWrapper: ({ children }: { children: React.ReactNode }) => children,
    Toast: () => null
  }
})


const iconSource = 1

import OInput from '../OInput'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'


beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
    jest.spyOn(Vibration, 'vibrate').mockImplementation(jest.fn())
    jest.spyOn(Keyboard, 'addListener').mockImplementation(() => ({ remove: jest.fn() }))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

describe('OInput', () => {
  it('centers a one-line field and keeps a text area at the top', () => {
    const { getByPlaceholderText } = renderWithProviders(
      <>
        <OInput placeholder="One line" onChange={jest.fn()} />
        <OInput placeholder="Many lines" multiline onChange={jest.fn()} />
      </>
    )
    const flat = (node: any) => Object.assign({}, ...[node.props.style].flat(Infinity).filter(Boolean))
    expect(getByPlaceholderText('One line').props.textAlignVertical).toBe('center')
    expect(flat(getByPlaceholderText('One line'))).toMatchObject({ paddingVertical: 0, includeFontPadding: false })
    expect(getByPlaceholderText('Many lines').props.textAlignVertical).toBe('top')
    expect(flat(getByPlaceholderText('Many lines')).includeFontPadding).toBeUndefined()
  })

  it('handles change, focus, and blur', () => {
        const onChange = jest.fn()
        const onFocus = jest.fn()
        const onBlur = jest.fn()
        const { getByPlaceholderText } = renderWithProviders(
          <OInput
            placeholder="Email"
            name="email"
            icon={iconSource}
            vertorIcon="email"
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        )
        const input = getByPlaceholderText('Email')
        fireEvent(input, 'focus')
        fireEvent.changeText(input, 'test@example.com')
        fireEvent(input, 'blur')
        expect(onFocus).toHaveBeenCalled()
        expect(onChange).toHaveBeenCalledWith({ target: { name: 'email', value: 'test@example.com' } })
        expect(onBlur).toHaveBeenCalled()
      })
  
      it('debounces lazy load changes', () => {
        jest.useFakeTimers()
        const onChange = jest.fn()
        const { getByPlaceholderText } = renderWithProviders(
          <OInput placeholder="Search" isLazyLoad onChange={onChange} />
        )
        fireEvent.changeText(getByPlaceholderText('Search'), 'pizza')
        expect(onChange).not.toHaveBeenCalled()
        act(() => {
          jest.advanceTimersByTime(750)
        })
        expect(onChange).toHaveBeenCalledWith('pizza')
      })
})


