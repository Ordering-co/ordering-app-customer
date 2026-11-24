import React, { useMemo } from 'react'
import { useTheme } from 'styled-components/native'
import { useLanguage } from '@components'
import OText from '../shared/OText'
import { nativeTextStyle } from '@/theme/helpers'
import { OptionalWrap } from './styles'

export const OptionalBadge = () => {
  const theme: any = useTheme()
  const [, t] = useLanguage()
  const text = useMemo(() => ({
    ...nativeTextStyle(theme.native.components.badge.base.text),
    color: theme.native.components.badge.variants.neutral.color
  }), [theme])

  return (
    <OptionalWrap testID='optional-badge'>
      <OText style={text}>{t('OPTIONAL', 'Optional')}</OText>
    </OptionalWrap>
  )
}
