import React, { useState } from 'react'
import { useTheme } from 'styled-components/native'
import FastImage from 'react-native-fast-image';

import {
  ReviewOrderContainer,
  BusinessLogo,
  ActionContainer,
  RatingStarContainer,
  MultiLogosContainer,
  LogoWrapper
} from './styles'

import { useLanguage } from '@components'
import { OButton, OText } from '@ui'
import Icon from '../shared/Icon'
import { Pressable } from 'react-native'
import { themeSpace } from '@/theme/helpers'

export const ReviewTrigger = (props: any) => {
  const { order, handleOpenOrderReview } = props

  const theme: any = useTheme()
  const rating = theme.native.components.rating
  const slop = themeSpace(theme, 'sm')
  const [, t] = useLanguage()
  const [star, setStar] = useState(5)

  return (
    <ReviewOrderContainer>
      <ActionContainer>
        <OText color='text_muted' align='center'>
          {t('REVIEW_TRIGGER_TEXT', 'Your feedback is very important to us. Help us improve by rating your last order—it only takes a few seconds!')}
        </OText>
      </ActionContainer>
      <BusinessLogo>
        {typeof order?.logo === 'string' || !order?.logo ? (
          <LogoWrapper>
            <FastImage
              style={{ width: '100%', height: '100%' }}
              source={{ uri: order?.logo }}
              objectFit='contain'
            />
          </LogoWrapper>
        ) : (
          <MultiLogosContainer>
            {order?.logo?.map((logo: string, i: number) => (
              <LogoWrapper key={logo}>
                <FastImage
                  style={{ width: '100%', height: '100%' }}
                  source={{ uri: logo }}
                  objectFit='contain'
                />
              </LogoWrapper>
            ))}
          </MultiLogosContainer>
        )}
      </BusinessLogo>

      {!!order?.business_name && (
        <ActionContainer>
          <OText align='center' preset='body_lg' weight='bold'>
            {order?.business_name}
          </OText>
        </ActionContainer>
      )}

      <RatingStarContainer>
        {[...Array(5).keys()].map((index: number) => (
          <Pressable
            key={`star-symbol-${index}`}
            hitSlop={{ top: slop, bottom: slop, left: slop, right: slop }}
            accessibilityRole='button'
            onPress={() => setStar(index + 1)}
          >
            <Icon
              name={(index <= (star - 1)) ? 'star' : 'star-outline'}
              size={rating.sizes.lg.icon_size}
              color={rating.base.color}
            />
          </Pressable>
        ))}
      </RatingStarContainer>
      <ActionContainer>
        <OButton
          color='neutral'
          appearance='tonal'
          text={t('REVIEW', 'Review')}
          onClick={() => handleOpenOrderReview(star)}
        />
      </ActionContainer>
    </ReviewOrderContainer>
  )
}
