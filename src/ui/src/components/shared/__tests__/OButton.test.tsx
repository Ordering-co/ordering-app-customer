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

import OButton from '../OButton'
import Icon from '../Icon'
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

describe('OButton', () => {
  it('renders and handles press', () => {
        const onClick = jest.fn()
        const { getByText } = renderWithProviders(
          <OButton text="Continue" testID="continue-btn" onClick={onClick} />
        )
        fireEvent.press(getByText('Continue'))
        expect(onClick).toHaveBeenCalled()
      })
  
      it('renders disabled state', () => {
        const { getByText } = renderWithProviders(
          <OButton text="Disabled" disabled />
        )
        expect(getByText('Disabled')).toBeTruthy()
      })
  
      it('renders loading state', () => {
        const { getByText } = renderWithProviders(
          <OButton text="Loading" loading class="secondary" />
        )
        expect(getByText('Loading')).toBeTruthy()
      })
  
      it.each(['primary', 'secondary', 'third', 'fourth', 'active', 'mandatory', 'alert'] as const)(
        'renders class %s',
        (buttonClass) => {
          const { getByText } = renderWithProviders(
            <OButton text={buttonClass} class={buttonClass} />
          )
          expect(getByText(buttonClass)).toBeTruthy()
        }
      )
})


describe('OButton reads components.button', () => {
  const { StyleSheet } = require('react-native')
  const { resolveButton } = require('../OButton')
  const boxOf = (getByText: any, label: string) => StyleSheet.flatten(getByText(label).parent.parent.props.style)

  it('maps the old classes as decided', () => {
    expect(resolveButton({})).toEqual({ color: 'primary', appearance: 'solid' })
    expect(resolveButton({ class: 'secondary' })).toEqual({ color: 'primary', appearance: 'outline' })
    expect(resolveButton({ class: 'mandatory' })).toEqual({ color: 'danger', appearance: 'tonal' })
    expect(resolveButton({ class: 'unknown' })).toEqual({ color: 'primary', appearance: 'solid' })
    expect(resolveButton({ class: 'secondary', appearance: 'ghost' })).toEqual({ color: 'primary', appearance: 'ghost' })
    expect(resolveButton({ color: '#000' as any })).toEqual({ color: 'primary', appearance: 'solid' })
  })

  it('paints the md primary solid button from the theme', () => {
    const { getByText } = renderWithProviders(<OButton text='Go' />)
    expect(StyleSheet.flatten(getByText('Go').props.style)).toMatchObject({ color: '#FFFFFF', fontFamily: 'Poppins-SemiBold', fontSize: 14 })
    expect(StyleSheet.flatten(getByText('Go').props.style).weight).toBeUndefined()
  })

  it('paints the disabled state and does not press', () => {
    const onClick = jest.fn()
    const { getByText } = renderWithProviders(<OButton text='Off' isDisabled onClick={onClick} />)
    expect(StyleSheet.flatten(getByText('Off').props.style).color).toBe('#616161')
    fireEvent.press(getByText('Off'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('keeps its text on one line and shrinks it when it is asked to fit (the add button with its price)', () => {
    const { getByText } = renderWithProviders(<OButton text='Add 32.00' fitText onClick={jest.fn()} />)
    const label = getByText('Add 32.00')
    expect(label.props.numberOfLines).toBe(1)
    expect(label.props.adjustsFontSizeToFit).toBe(true)
  })
})

describe('OButton: a text that fits (fitText)', () => {
  const { StyleSheet } = require('react-native')
  const growOf = (button: React.ReactElement, text: string) => StyleSheet.flatten(renderWithProviders(button).getByText(text).props.style).flexGrow

  it('takes the room of the button when it has no icon', () => {
    expect(growOf(<OButton text='Add 32.00' fitText onClick={jest.fn()} />, 'Add 32.00')).toBe(1)
  })

  it('keeps its own width beside an icon', () => {
    const utils = renderWithProviders(<OButton text='Add 32.00' fitText icon={<Icon name='add' />} onClick={jest.fn()} />)
    const label = utils.getByText('Add 32.00')
    expect(StyleSheet.flatten(label.props.style).flexGrow).toBeUndefined()
    expect(label.props.numberOfLines).toBe(1)
    expect(label.props.adjustsFontSizeToFit).toBe(true)
  })

  it('keeps its own width when it is not asked to fit, with or without an icon', () => {
    expect(growOf(<OButton text='Add' onClick={jest.fn()} />, 'Add')).toBeUndefined()
    expect(growOf(<OButton text='Add' icon={<Icon name='add' />} onClick={jest.fn()} />, 'Add')).toBeUndefined()
  })

  it('still shrinks, as every label', () => {
    const label = renderWithProviders(<OButton text='Add 32.00' fitText onClick={jest.fn()} />).getByText('Add 32.00')
    expect(StyleSheet.flatten(label.props.style).flexShrink).toBe(1)
  })
})
