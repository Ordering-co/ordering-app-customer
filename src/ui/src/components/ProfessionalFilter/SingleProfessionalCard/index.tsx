import React, { useMemo } from 'react'
import { Pressable, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { useTheme } from 'styled-components/native'
import {
  useSession,
  SingleProfessionalCard as SingleProfessionalCardController
} from '@components'
import { OText } from '../../shared'
import Icon from '../../shared/Icon'
import { PressableScale } from '../../shared/PressableScale'
import { professionalChoiceStyles } from '../styles'
import { themePart, themeSpace } from '@/theme/helpers'
import { IMAGE_REQUEST, imageUrl } from '@/utils/imageUrl'

const SingleProfessionalCardUI = (props: any) => {
  const {
    professional,
    handleFavoriteProfessional,
    active,
    handleProfessionalClick
  } = props

  const theme: any = useTheme()
  const styles = useMemo(() => professionalChoiceStyles(theme), [theme])
  const favorite = themePart(theme, 'favorite', 'base')
  // The heart is smaller than a touch target: reach 44 pt around it.
  const heartSlop = (themePart(theme, 'button', 'sizes.md.height') - favorite.icon_size) / 2
  const [{ auth }] = useSession()
  
  const handleChangeFavorite = () => {
    if (auth) {
      handleFavoriteProfessional && handleFavoriteProfessional(!professional?.favorite)
    }
  }

  return (
    <PressableScale
      onPress={() => handleProfessionalClick(professional)}
    >
      <View style={[styles.item, active && styles.selected]}>
        {professional?.photo ? (
          <FastImage
            style={styles.photo}
            source={{
              uri: imageUrl(professional?.photo, { height: IMAGE_REQUEST.thumbnail }),
              priority: FastImage.priority.normal,
            }}
            objectFit='cover'
          />
        ) : (
          <Icon name='person-circle-outline' size={styles.photo.width} color='text_muted' />
        )}
        <View style={{ gap: themeSpace(theme, 'xxs') }}>
          <OText style={[styles.text, active && styles.selectedText]}>
            {professional?.name} {professional?.lastname}
          </OText>

          <Pressable
            onPress={() => handleChangeFavorite()}
            hitSlop={heartSlop}
            accessibilityRole='button'
          >
            <Icon name={professional?.favorite ? 'heart' : 'heart-outline'} size={favorite.icon_size} color={favorite.color} />
          </Pressable>
        </View>
      </View>
    </PressableScale>
  )
}

export const SingleProfessionalCard = (props: any) => {
  const singleProfessionalCardProps = {
    ...props,
    UIComponent: SingleProfessionalCardUI
  }
  return <SingleProfessionalCardController {...singleProfessionalCardProps} />
}
