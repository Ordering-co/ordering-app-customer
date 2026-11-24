import React from 'react'
import { View } from 'react-native'
import { OText } from '@ui'
import { useTheme } from 'styled-components/native'
import { AddressSuggestContainer } from './styles'
import { suggestionLook } from '../suggestionLook'

export const AddressMapBoxList = (props: any) => {
  const {
    mapBoxSuggests,
    retrieveSuggestResult,
    handleChangeAddressMapbox,
    onBlurInput,
    handleChangeInputAddress
  } = props
  const theme: any = useTheme()
  const look = suggestionLook(theme)

  const handleClick = (suggest: any) => {
    retrieveSuggestResult(suggest?.mapbox_id, handleChangeAddressMapbox)
    handleChangeInputAddress(suggest?.full_address || suggest?.name)
    onBlurInput()
  }

  return (
    <View style={mapBoxSuggests?.length ? look.list : undefined}>
      {mapBoxSuggests?.map((suggest: any) => (
        <AddressSuggestContainer
          key={suggest?.mapbox_id}
          style={look.item}
          onPress={() => handleClick(suggest)}
        >
          <OText style={look.main}>
            {suggest?.full_address || suggest?.name}
          </OText>
        </AddressSuggestContainer>
      ))}
    </View>
  )
}
