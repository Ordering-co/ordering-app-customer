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

import OText from '../OText'
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

describe('OText', () => {
  it('renders children with preset and explicit size', () => {
        const { getByText, rerender } = renderWithProviders(
          <OText preset="body">Body text</OText>
        )
        expect(getByText('Body text')).toBeTruthy()
  
        rerender(
          <OText size={18} weight="700" align="center" space>
            Title
          </OText>
        )
        expect(getByText(/Title/)).toBeTruthy()
      })
})


describe('OText reads the theme', () => {
  const { StyleSheet } = require('react-native')
  const { presetForSize } = require('../OText')
  const styleOf = (el: any) => StyleSheet.flatten(el.props.style)

  it('paints a preset with its font file, line height and the text role', () => {
    const { getByText } = renderWithProviders(<OText preset='h3'>T</OText>)
    const s = styleOf(getByText('T'))
    expect(s).toMatchObject({ fontFamily: 'Poppins-Bold', fontSize: 20, lineHeight: 26, color: '#000000' })
    expect(s.fontWeight).toBeUndefined()
  })

  it('paints a weight with the file of that weight, never fontWeight', () => {
    const { getByText } = renderWithProviders(
      <>
        <OText weight='bold'>A</OText>
        <OText weight={600}>B</OText>
        <OText style={{ fontWeight: '500' }}>C</OText>
      </>
    )
    expect(styleOf(getByText('A')).fontFamily).toBe('Poppins-Bold')
    expect(styleOf(getByText('B')).fontFamily).toBe('Poppins-SemiBold')
    expect(styleOf(getByText('C'))).toMatchObject({ fontFamily: 'Poppins-Medium' })
    expect(styleOf(getByText('C')).fontWeight).toBeUndefined()
  })

  it('snaps a legacy size to its preset and keeps sizes above the scale with the line ratio', () => {
    expect([10, 12, 13, 14, 15, 16, 18, 20, 22, 26, 31].map(presetForSize))
      .toEqual(['caption', 'body_sm', 'body_sm', 'body', 'body', 'body_lg', 'h4', 'h3', 'h2', 'h1', null])
    const { getByText } = renderWithProviders(<><OText size={13}>S</OText><OText size={60}>L</OText></>)
    expect(styleOf(getByText('S'))).toMatchObject({ fontSize: 12, lineHeight: 18 })
    expect(styleOf(getByText('L'))).toMatchObject({ fontSize: 60, lineHeight: 84 })
  })

  it('takes color roles and space levels', () => {
    const { getByText } = renderWithProviders(<OText color='danger_text' mTop='md'>E</OText>)
    expect(styleOf(getByText('E'))).toMatchObject({ color: '#DA3453', marginTop: 15 })
  })

  it('maps the old preset names', () => {
    const { getByText } = renderWithProviders(<OText preset='cardTitle'>C</OText>)
    expect(styleOf(getByText('C'))).toMatchObject({ fontSize: 16, fontFamily: 'Poppins-SemiBold' })
  })
})
