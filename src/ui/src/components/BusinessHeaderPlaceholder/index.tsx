import React from 'react'
import FastImage from 'react-native-fast-image'
import { useTheme } from 'styled-components/native'

import { OText } from '@ui'
import { themeRadius } from '@/theme/helpers'
import { PlaceholderContainer, LogoWrapper } from './styles'
import { imageUrl } from '@/utils/imageUrl'

interface BusinessHeaderPlaceholderProps {
  logo?: string
  name?: string
  height: number
  borderRadius?: number
  optimizeImage?: (url: string, params: string) => string
}

const getMonogram = (name?: string) => {
  const initial = name?.trim()?.charAt(0)
  return initial ? initial.toUpperCase() : '?'
}

/**
 * Branded fallback shown when a business has no header image.
 * Renders the logo centered (contained) over a single consistent neutral
 * background, or the business initial when there is no logo. The background
 * is the same app-theme token for every business — never derived from the brand.
 */
export const BusinessHeaderPlaceholder = ({ logo, name, height, borderRadius }: BusinessHeaderPlaceholderProps) => {
  const theme: any = useTheme()
  const logoSize = height * 0.5

  return (
    <PlaceholderContainer style={{ height, borderRadius: borderRadius ?? themeRadius(theme, 'xxl') }}>
      {logo ? (
        <LogoWrapper style={{ width: logoSize, height: logoSize }}>
          <FastImage
            style={{ width: logoSize, height: logoSize }}
            source={{
              uri: imageUrl(logo, { height: logoSize }),
              priority: FastImage.priority.normal,
            }}
            objectFit='contain'
          />
        </LogoWrapper>
      ) : (
        <OText preset='h1' weight={600} color='text_muted' style={{ fontSize: Math.round(height * 0.32) }}>
          {getMonogram(name)}
        </OText>
      )}
    </PlaceholderContainer>
  )
}
