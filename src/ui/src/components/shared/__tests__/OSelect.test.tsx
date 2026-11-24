import React from 'react'
import { Keyboard, StyleSheet } from 'react-native'
import { fireEvent } from '@testing-library/react-native'
import OSelect from '../OSelect'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@ui', () => ({ OText: require('@/ui/src/components/shared/OText').default }))

beforeEach(() => {
  jest.spyOn(Keyboard, 'addListener').mockImplementation(() => ({ remove: jest.fn() }) as any)
})

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français', disabled: true },
]

describe('OSelect', () => {
  it('shows the selected label, opens the sheet and selects an option', () => {
    const onSelect = jest.fn()
    const { getByText, getAllByText, getByTestId } = renderWithProviders(
      <OSelect testID='lang' title='Language' options={languages} value='en' onSelect={onSelect} />
    )
    expect(getByText('English')).toBeTruthy()
    fireEvent.press(getByTestId('lang'))
    expect(getByText('Language')).toBeTruthy()
    fireEvent.press(getByText('Español'))
    expect(onSelect).toHaveBeenCalledWith('es', languages[1])
    expect(getAllByText('English').length).toBeGreaterThan(0)
  })

  it('paints the trigger with the input look and the placeholder color', () => {
    const { getByText } = renderWithProviders(
      <OSelect placeholder='Choose' options={languages} onSelect={jest.fn()} />
    )
    expect(StyleSheet.flatten(getByText('Choose').props.style)).toMatchObject({ color: '#616161', fontFamily: 'Poppins-Regular' })
  })

  it('filters rows with the search field', () => {
    const { getByTestId, getByPlaceholderText, queryByText } = renderWithProviders(
      <OSelect testID='lang' searchable searchPlaceholder='Search' options={languages} onSelect={jest.fn()} />
    )
    fireEvent.press(getByTestId('lang'))
    fireEvent.changeText(getByPlaceholderText('Search'), 'esp')
    expect(queryByText('Español')).toBeTruthy()
    expect(queryByText('English')).toBeNull()
  })

  it('does not open when disabled and uses a custom trigger', () => {
    const { getByText, queryByText } = renderWithProviders(
      <OSelect
        disabled
        title='Language'
        options={languages}
        value='es'
        onSelect={jest.fn()}
        renderTrigger={({ open, selected }) => (
          <OSelectTrigger onPress={open} label={selected?.label} />
        )}
      />
    )
    fireEvent.press(getByText('Español'))
    expect(queryByText('Language')).toBeNull()
  })
})

const OSelectTrigger = ({ onPress, label }: { onPress: () => void, label?: string }) => {
  const { Text } = require('react-native')
  return <Text onPress={onPress}>{label}</Text>
}
